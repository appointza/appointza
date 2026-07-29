using System.Text.Json;
using System.Text.Json.Serialization;

namespace appointza.Services.AppointzaStay;

public static class JsonOptions
{
    public static readonly JsonSerializerOptions Default = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
    };
}

public class JsonDataStore
{
    private readonly string _dataDir;

    public string DataDirectory => _dataDir;

    public JsonDataStore(IWebHostEnvironment env)
    {
        _dataDir = Path.Combine(env.ContentRootPath, "App_Data");
        Directory.CreateDirectory(_dataDir);
    }

    public List<T> Load<T>(string fileName, Func<List<T>> seed)
    {
        var path = Path.Combine(_dataDir, fileName);
        if (!File.Exists(path))
        {
            var data = seed();
            Save(fileName, data);
            return data;
        }
        try
        {
            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<List<T>>(json, JsonOptions.Default) ?? seed();
        }
        catch
        {
            return seed();
        }
    }

    public void Save<T>(string fileName, List<T> data)
    {
        var path = Path.Combine(_dataDir, fileName);
        var json = JsonSerializer.Serialize(data, JsonOptions.Default);
        File.WriteAllText(path, json);
    }

    public T LoadSingle<T>(string fileName, Func<T> seed)
    {
        var path = Path.Combine(_dataDir, fileName);
        if (!File.Exists(path))
        {
            var data = seed();
            SaveSingle(fileName, data);
            return data;
        }
        try
        {
            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<T>(json, JsonOptions.Default) ?? seed();
        }
        catch
        {
            return seed();
        }
    }

    public T LoadSingleWithMigration<T>(string fileName, Func<T> seed, Func<string, T?> migrate)
    {
        var path = Path.Combine(_dataDir, fileName);
        if (!File.Exists(path))
        {
            var data = seed();
            SaveSingle(fileName, data);
            return data;
        }

        try
        {
            var json = File.ReadAllText(path);
            var migrated = migrate(json);
            if (migrated != null)
            {
                SaveSingle(fileName, migrated);
                return migrated;
            }

            return JsonSerializer.Deserialize<T>(json, JsonOptions.Default) ?? seed();
        }
        catch
        {
            return seed();
        }
    }

    public void SaveSingle<T>(string fileName, T data)
    {
        var path = Path.Combine(_dataDir, fileName);
        var json = JsonSerializer.Serialize(data, JsonOptions.Default);
        File.WriteAllText(path, json);
    }
}
