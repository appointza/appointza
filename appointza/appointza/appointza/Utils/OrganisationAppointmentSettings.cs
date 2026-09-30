using System.Text.Json;

namespace appointza.Utils
{
    public static class OrganisationAppointmentSettings
    {
        public static void ApplyFromAttributes(string attributesJson, ref long counter, ref long openBefore)
        {
            if (string.IsNullOrWhiteSpace(attributesJson) || attributesJson == "null")
            {
                return;
            }

            try
            {
                using var doc = JsonDocument.Parse(attributesJson);
                var root = doc.RootElement;
                if (root.ValueKind != JsonValueKind.Object)
                {
                    return;
                }

                if (TryReadInt(root, "appointment_counter", out var orgCounter) && orgCounter > 0)
                {
                    counter = orgCounter;
                }

                if (TryReadInt(root, "appointment_openbefore", out var orgOpenBefore))
                {
                    openBefore = orgOpenBefore;
                }
            }
            catch (JsonException)
            {
                // Keep location timing values.
            }
        }

        static bool TryReadInt(JsonElement root, string name, out long value)
        {
            value = 0;
            if (!root.TryGetProperty(name, out var prop))
            {
                return false;
            }

            if (prop.ValueKind == JsonValueKind.Number && prop.TryGetInt64(out var n))
            {
                value = n < 0 ? 0 : n;
                return true;
            }

            if (prop.ValueKind == JsonValueKind.String && long.TryParse(prop.GetString(), out n))
            {
                value = n < 0 ? 0 : n;
                return true;
            }

            return false;
        }
    }
}
