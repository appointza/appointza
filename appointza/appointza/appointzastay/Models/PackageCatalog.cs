namespace appointza.Models.AppointzaStay;

public static class PackageCatalog
{
    public static readonly (string Value, string Label)[] Kinds =
    [
        ("honeymoon", "Honeymoon"),
        ("family", "Family"),
        ("weekend", "Weekend"),
        ("extended", "Extended Stay"),
        ("standard", "Standard"),
        ("custom", "Custom"),
    ];

    public static readonly string[] BadgeSuggestions =
    [
        "Popular", "Best Value", "Limited", "Romantic", "New", "Seasonal",
    ];

    public static string KindLabel(string kind) =>
        Kinds.FirstOrDefault(k => k.Value == kind).Label ?? kind;

    public static string KindEmoji(string kind) => kind switch
    {
        "honeymoon" => "💑",
        "family" => "👨‍👩‍👧",
        "weekend" => "🎉",
        "extended" => "📅",
        "standard" => "🎁",
        _ => "✨",
    };
}
