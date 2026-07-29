using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace appointza.Utils
{
    /// <summary>
    /// JSON converter for calendar dates (event_date, from_date, to_date).
    /// Reads/writes yyyy-MM-dd only so timezone does not shift the day.
    /// </summary>
    public class DateOnlyNullableJsonConverter : JsonConverter<DateTime?>
    {
        private const string DateFormat = "yyyy-MM-dd";

        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;

            var s = reader.GetString();
            if (string.IsNullOrWhiteSpace(s))
                return null;

            if (s.Length >= 10 &&
                DateTime.TryParseExact(s.AsSpan(0, 10), DateFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateOnly))
            {
                return dateOnly;
            }

            if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
                return parsed.Date;

            throw new JsonException($"Invalid date value: {s}");
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (!value.HasValue)
            {
                writer.WriteNullValue();
                return;
            }

            writer.WriteStringValue(value.Value.ToString(DateFormat, CultureInfo.InvariantCulture));
        }
    }
}
