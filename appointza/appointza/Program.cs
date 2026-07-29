using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using appointza;
using appointza.Authentication.Middlewares;
using appointza.integrations.Authentication.Middlewares;
using appointza.Middlewares;
using appointza.Utils;
using appointza.Data.AppointzaStay;
using appointza.Services.AppointzaStay;

var builder = WebApplication.CreateBuilder(args);

// CONFIGURATION: align server with the same config.js the SPA loads (appointzabuild/production/wwwroot/config.js)
if (AppointzaConfigJsParser.TryLoad(out var configJsBaseUrl, out var configJsTemplateUrl, out var configJsPath))
{
    var pairs = new List<KeyValuePair<string, string?>>
    {
        new("ApplicationSettings:baseUrl", configJsBaseUrl)
    };
    if (!string.IsNullOrWhiteSpace(configJsTemplateUrl))
        pairs.Add(new KeyValuePair<string, string?>("ApplicationSettings:templateBaseUrl", configJsTemplateUrl));
    builder.Configuration.AddInMemoryCollection(pairs!);
    Console.WriteLine($"✅ URLs from config.js ({configJsPath}): baseurl={configJsBaseUrl}");
}

// CONFIGURATION
builder.Services.Configure<ApplicationEnvironment>(
    builder.Configuration.GetSection("ApplicationSettings"));

var appSettings = builder.Configuration
    .GetSection("ApplicationSettings")
    .Get<ApplicationEnvironment>();

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// LOGGING
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddLog4Net("log4net.config");

// SERVICES
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = null;
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => c.CustomSchemaIds(type => type.FullName!.Replace("+", ".")));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(origin => true) // This supports any origin dynamically, fixing strict-origin-when-cross-origin issues on subdomains
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.AddHealthChecks()
    .AddNpgSql(appSettings.postgresqlconnection, name: "postgresql")
    .AddNpgSql(appSettings.campusza_postgresqlconnection, name: "campusza-postgresql")
    .AddNpgSql(appSettings.appointzastay_postgresqlconnection, name: "appointzastay-postgresql")
    .AddRedis(appSettings.redis?.connection_string ?? "localhost:6379", name: "redis");

builder.Services.AddMemoryCache();
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = appSettings.redis?.connection_string ?? "localhost:6379";
    options.InstanceName = appSettings.redis?.instance_name ?? "appointza";
});

builder.Services.AddResponseCompression();
builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
builder.Services.AddSingleton<AppState>();
builder.Services.AddScoped<RequestState>();
builder.Services.AddScoped<IDbProvider, PostgreSQLProvider>();
builder.Services.AddScoped<ICampuszaDbProvider, CampuszaDbProvider>();
builder.Services.AddCustomServices();

// B2B Services
builder.Services.AddHttpClient<appointza.integrations.Authentication.Services.IB2BClientService, appointza.integrations.Authentication.Services.B2BClientService>();

var app = builder.Build();

// AppointzaStay PostgreSQL schema bootstrap
if (!string.IsNullOrWhiteSpace(appSettings.appointzastay_postgresqlconnection))
{
    var stayBootstrap = await PostgresBootstrap.EnsureSchemaAsync(
        appSettings.appointzastay_postgresqlconnection,
        Path.Combine(app.Environment.ContentRootPath, "appointzastay"),
        app.Logger);
    if (stayBootstrap.Connected && stayBootstrap.SchemaReady)
    {
        var dataStore = app.Services.GetRequiredService<AppDataStore>();
        var stats = dataStore.GetStats();
        app.Logger.LogInformation(
            "AppointzaStay data loaded — {Orgs} orgs, {Users} users, {Rooms} rooms, {Customers} customers, {Bookings} bookings",
            stats.Organisations, stats.Users, stats.Rooms, stats.Customers, stats.Bookings);
    }
    else
    {
        app.Logger.LogWarning("AppointzaStay PostgreSQL not ready: {Message}", stayBootstrap.Message);
    }
}

// SWAGGER / STATIC FILES
app.UseSwagger();
app.UseSwaggerUI();

// Configure static files to serve from appointzabuild/production/wwwroot
var staticPathCandidates = new[]
{
    // Running from appointza project folder
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "appointzabuild", "production", "wwwroot")),
    // Running from compiled server output inside appointzabuild/production
    Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "wwwroot")),
};

var appointzaBuildPath = staticPathCandidates.FirstOrDefault(Directory.Exists);
var wwwrootPath = !string.IsNullOrWhiteSpace(appointzaBuildPath)
    ? appointzaBuildPath
    : Path.Combine(AppContext.BaseDirectory, "wwwroot");

if (!Directory.Exists(wwwrootPath))
{
    Directory.CreateDirectory(wwwrootPath);
}

var wwwrootProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(wwwrootPath);

// Shared wwwroot (config.js, legacy root assets)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = wwwrootProvider,
    RequestPath = ""
});

var uploadServeDirectories = StayStaticFiles.UploadServeDirectories(app.Environment);
var uploadProviders = uploadServeDirectories
    .Select(path => new PhysicalFileProvider(path) as IFileProvider)
    .ToList();
if (uploadProviders.Count > 0)
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = uploadProviders.Count == 1
            ? uploadProviders[0]
            : new CompositeFileProvider(uploadProviders),
        RequestPath = "/uploads",
    });
    foreach (var uploadsPath in uploadServeDirectories)
        Console.WriteLine($"✅ Upload static files: /uploads → {uploadsPath}");
}

var uploadSyncCount = StayStaticFiles.SyncUploadsToPrimary(app.Environment);
if (uploadSyncCount > 0)
    Console.WriteLine($"✅ Synced {uploadSyncCount} upload(s) into {StayStaticFiles.UploadOrgDirectory(app.Environment)}");

// Product UIs: /appointza, /campusza, /webzys
foreach (var spaSegment in new[] { "appointza", "campusza", "webzys", "appointzastay" })
{
    var spaPhysicalPath = Path.Combine(wwwrootPath, spaSegment);
    if (!Directory.Exists(spaPhysicalPath))
    {
        continue;
    }

    var spaProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(spaPhysicalPath);
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = spaProvider,
        RequestPath = $"/{spaSegment}"
    });
    Console.WriteLine($"✅ SPA static files: /{spaSegment} → {spaPhysicalPath}");
}

Console.WriteLine($"✅ wwwroot: {wwwrootPath}");

// COMMON MIDDLEWARE
app.UseResponseCompression();
app.UseCors();
app.UseRouting();

// ✅ SUBDOMAIN ORGANIZATION MIDDLEWARE - Must be early in the pipeline
app.UseSubdomainOrganization();

// ✅ MIDDLEWARE FOR /api/b2b
app.UseMiddleware<ServerToServerAuthMiddleware>();

// ✅ MIDDLEWARE FOR /api/user
app.UseMiddleware<JwtMiddleware>();

// MAP CONTROLLERS
app.MapControllers();

// HEALTH
app.MapHealthChecks("/health");

// Root → default product UI when using combined ACW deploy
app.MapGet("/", () => Results.Redirect("/appointza/"));

// SPA fallbacks (subpath deploy from buildallacw.ps1)
app.MapFallbackToFile("/appointza/{**slug}", "appointza/index.html");
app.MapFallbackToFile("/campusza/{**slug}", "campusza/index.html");
app.MapFallbackToFile("/webzys/{**slug}", "webzys/index.html");

app.MapFallbackToFile("/appointzastay/{**slug}", "appointzastay/index.html");

// Legacy: root-level Appointza SPA if index.html exists at wwwroot root
if (File.Exists(Path.Combine(wwwrootPath, "index.html")))
{
    app.MapFallbackToFile("index.html");
}

// ERROR HANDLING
app.UseMiddleware<ErrorHandlerMiddleware>();

app.Run();
