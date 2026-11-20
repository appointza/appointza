using System.Text.Json;
using appointza.Models;

namespace appointza.Utils
{
    public class SiteTemplateDraftRequest
    {
        public string description { get; set; } = "";
        public List<string> chips { get; set; } = [];
        public long organisation_id { get; set; }
        public long organisation_location_id { get; set; }
        public string? organisation_name { get; set; }
        public string? theme { get; set; }
        /// <summary>Optional known capabilities so drafts include live blocks even without a DB round-trip.</summary>
        public bool has_rooms { get; set; }
        public bool has_services { get; set; }
        public bool has_events { get; set; }
    }

    public class SiteTemplateDraftResult
    {
        public string page_json { get; set; } = "";
        public List<string> live_blocks { get; set; } = [];
        public string message { get; set; } = "";
    }

    /// <summary>
    /// Deterministic, zero-billing website draft generator that prefers live Appointza data blocks
    /// (services, rooms, hours, booking CTAs) instead of hard-coded HTML.
    /// </summary>
    public static class SiteTemplateDraftGenerator
    {
        static readonly Dictionary<string, string[]> ChipBlocks = new(StringComparer.OrdinalIgnoreCase)
        {
            ["rooms"] = ["appointza-rooms", "appointza-hospitality-packages", "appointza-hospitality-policies"],
            ["gallery"] = ["appointza-location-images"],
            ["maps"] = ["appointza-location"],
            ["packages"] = ["appointza-hospitality-packages"],
            ["events"] = ["appointza-events"],
            ["colours"] = [],
        };

        public static SiteTemplateDraftResult Generate(SiteTemplateDraftRequest req)
        {
            var description = (req.description ?? "").Trim();
            var chips = (req.chips ?? []).Select(c => c.Trim().ToLowerInvariant()).Where(c => c.Length > 0).Distinct().ToList();
            var text = $"{description} {string.Join(' ', chips)} {req.theme}".ToLowerInvariant();
            var seed = Math.Abs(HashCode.Combine(description, string.Join(',', chips), req.organisation_id));

            var blocks = new List<Dictionary<string, object?>>
            {
                Block("hero-1", "hero", seed, new Dictionary<string, object?>
                {
                    ["title"] = string.IsNullOrWhiteSpace(req.organisation_name) ? "Welcome" : req.organisation_name,
                    ["subtitle"] = string.IsNullOrWhiteSpace(req.theme) ? "Book online with Appointza" : req.theme,
                    ["ctaLabel"] = "Book now",
                    ["ctaAction"] = "book",
                }),
                Block("appointza-services-1", "appointza-services", seed + 1, new Dictionary<string, object?>
                {
                    ["title"] = "Our services",
                    ["source"] = "live",
                }),
                Block("appointza-hours-1", "appointza-hours", seed + 2, new Dictionary<string, object?>
                {
                    ["title"] = "Hours",
                    ["source"] = "live",
                }),
                Block("appointza-booking-1", "appointza-booking-button", seed + 3, new Dictionary<string, object?>
                {
                    ["label"] = "Book an appointment",
                    ["source"] = "live",
                }),
                Block("about-1", "about", seed + 4, new Dictionary<string, object?>
                {
                    ["title"] = string.IsNullOrWhiteSpace(req.organisation_name)
                        ? "About us"
                        : $"About {req.organisation_name}",
                    ["content"] = string.IsNullOrWhiteSpace(description)
                        ? "Tell visitors what makes your business special."
                        : description,
                }),
            };

            void EnsureChip(string chip)
            {
                if (!ChipBlocks.TryGetValue(chip, out var types)) return;
                foreach (var type in types)
                {
                    if (blocks.Any(b => string.Equals(Convert.ToString(b["type"]), type, StringComparison.OrdinalIgnoreCase)))
                        continue;
                    blocks.Add(Block($"{type}-{seed}", type, seed + type.Length, new Dictionary<string, object?>
                    {
                        ["source"] = "live",
                        ["title"] = type.Replace("appointza-", "").Replace('-', ' '),
                    }));
                }
            }

            if (req.has_rooms || RegexContains(text, "room|resort|hotel|stay|hospitality|lodge") || chips.Contains("rooms"))
                EnsureChip("rooms");
            if (RegexContains(text, "galler|photo|portfolio|image") || chips.Contains("gallery"))
                EnsureChip("gallery");
            if (RegexContains(text, "map|location|direction|google") || chips.Contains("maps"))
                EnsureChip("maps");
            if (RegexContains(text, "package|offer|combo") || chips.Contains("packages"))
                EnsureChip("packages");
            if (req.has_events || RegexContains(text, "event|tournament|workshop|class") || chips.Contains("events"))
                EnsureChip("events");
            if (chips.Contains("colours"))
            {
                var hero = blocks.FirstOrDefault(b => Convert.ToString(b["type"])?.StartsWith("hero") == true);
                if (hero?["data"] is Dictionary<string, object?> data)
                    data["variant"] = 2;
            }

            if (req.has_services == false && !blocks.Any(b => Convert.ToString(b["type"]) == "appointza-services"))
            {
                // keep services block anyway — live source will render empty gracefully
            }

            var liveBlocks = blocks
                .Select(b => Convert.ToString(b["type"]) ?? "")
                .Where(t => t.StartsWith("appointza-", StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            var page = new Dictionary<string, object?>
            {
                ["id"] = $"draft-{req.organisation_location_id}-{seed}",
                ["name"] = string.IsNullOrWhiteSpace(req.organisation_name)
                    ? "Generated site"
                    : $"{req.organisation_name} site",
                ["slug"] = "home",
                ["blocks"] = blocks,
                ["generatedBy"] = "SiteTemplateDraftGenerator",
                ["liveData"] = true,
            };

            return new SiteTemplateDraftResult
            {
                page_json = JsonSerializer.Serialize(page),
                live_blocks = liveBlocks,
                message = "Draft ready. Nothing is live until you click Use this design and Save.",
            };
        }

        static Dictionary<string, object?> Block(string id, string type, int seed, Dictionary<string, object?> data) =>
            new()
            {
                ["id"] = id,
                ["type"] = type,
                ["visible"] = true,
                ["seed"] = seed,
                ["data"] = data,
            };

        static bool RegexContains(string text, string pattern) =>
            System.Text.RegularExpressions.Regex.IsMatch(text, pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }
}
