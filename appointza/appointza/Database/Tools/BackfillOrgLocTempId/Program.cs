using System.Text.Json;
using Npgsql;

static string? ResolveConnectionString(string[] args)
{
    if (args.Length > 0 && !string.IsNullOrWhiteSpace(args[0]))
    {
        return args[0];
    }

    var env = Environment.GetEnvironmentVariable("APPOINTZA_DB_CONNECTION");
    if (!string.IsNullOrWhiteSpace(env))
    {
        return env;
    }

    var searchRoots = new[]
    {
        AppContext.BaseDirectory,
        Directory.GetCurrentDirectory(),
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "..", "..")),
        Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", "..")),
    };

    foreach (var root in searchRoots.Distinct(StringComparer.OrdinalIgnoreCase))
    {
        var direct = Path.Combine(root, "appsettings.json");
        if (File.Exists(direct))
        {
            return ReadConnectionString(direct);
        }

        var nested = Path.Combine(root, "appointza", "appsettings.json");
        if (File.Exists(nested))
        {
            return ReadConnectionString(nested);
        }
    }

    return null;
}

static string ReadConnectionString(string appsettingsPath)
{
    using var doc = JsonDocument.Parse(File.ReadAllText(appsettingsPath));
    return doc.RootElement
        .GetProperty("ApplicationSettings")
        .GetProperty("postgresqlconnection")
        .GetString()
        ?? throw new InvalidOperationException($"postgresqlconnection is missing in {appsettingsPath}");
}

var connectionString = ResolveConnectionString(args);
if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine("Usage: dotnet run --project BackfillOrgLocTempId.csproj \"Host=...;Database=...\"");
    Console.Error.WriteLine("Or set APPOINTZA_DB_CONNECTION.");
    return 1;
}

const string ensureColumnSql = """
    ALTER TABLE organisationlocation
    ADD COLUMN IF NOT EXISTS orgloctempid UUID;
    """;

const string backfillSql = """
    UPDATE organisationlocation
    SET orgloctempid = gen_random_uuid()
    WHERE orgloctempid IS NULL;
    """;

const string indexSql = """
    CREATE UNIQUE INDEX IF NOT EXISTS idx_organisationlocation_orgloctempid
    ON organisationlocation (orgloctempid)
    WHERE orgloctempid IS NOT NULL;
    """;

const string verifySql = """
    SELECT
        COUNT(*) AS total_locations,
        COUNT(orgloctempid) AS with_guid,
        COUNT(*) - COUNT(orgloctempid) AS still_missing
    FROM organisationlocation;
    """;

await using var connection = new NpgsqlConnection(connectionString);
await connection.OpenAsync();

await using (var cmd = new NpgsqlCommand(ensureColumnSql, connection))
{
    await cmd.ExecuteNonQueryAsync();
}

int updated;
await using (var cmd = new NpgsqlCommand(backfillSql, connection))
{
    updated = await cmd.ExecuteNonQueryAsync();
}

await using (var cmd = new NpgsqlCommand(indexSql, connection))
{
    await cmd.ExecuteNonQueryAsync();
}

await using (var cmd = new NpgsqlCommand(verifySql, connection))
await using (var reader = await cmd.ExecuteReaderAsync())
{
    if (await reader.ReadAsync())
    {
        Console.WriteLine($"Backfill complete. Rows updated: {updated}");
        Console.WriteLine($"Total locations: {reader.GetInt64(0)}");
        Console.WriteLine($"With orgloctempid: {reader.GetInt64(1)}");
        Console.WriteLine($"Still missing: {reader.GetInt64(2)}");
    }
}

return 0;
