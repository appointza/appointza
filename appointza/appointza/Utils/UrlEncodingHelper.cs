using System.Text;
using System.Web;

namespace appointza.Utils
{
    /// <summary>
    /// Helper class for URL encoding/decoding (percent encoding)
    /// Converts: "Organization Name" <-> "Organization%20Name"
    /// </summary>
    public static class UrlEncodingHelper
    {
        /// <summary>
        /// Encodes a string for safe URL usage (percent encoding)
        /// Example: "Organization Name" -> "Organization%20Name"
        /// Process: Character -> ASCII/UTF-8 number -> Hex -> %XX format
        /// </summary>
        public static string Encode(string text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;

            // Use Uri.EscapeDataString for RFC 3986 compliant encoding
            // This encodes: space, special chars, unicode
            return Uri.EscapeDataString(text);
        }

        /// <summary>
        /// Decodes a URL-encoded string back to original
        /// Example: "Organization%20Name" -> "Organization Name"
        /// </summary>
        public static string Decode(string encodedText)
        {
            if (string.IsNullOrEmpty(encodedText))
                return string.Empty;

            return Uri.UnescapeDataString(encodedText);
        }

        /// <summary>
        /// Alternative encoding using HttpUtility (if available)
        /// </summary>
        public static string EncodeForHtml(string text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;

            return HttpUtility.UrlEncode(text);
        }

        /// <summary>
        /// Alternative decoding using HttpUtility
        /// </summary>
        public static string DecodeFromHtml(string encodedText)
        {
            if (string.IsNullOrEmpty(encodedText))
                return string.Empty;

            return HttpUtility.UrlDecode(encodedText);
        }

        /// <summary>
        /// Manual percent encoding for educational purposes
        /// Shows the complete process: Character -> Number -> Hex -> %
        /// </summary>
        public static string ManualEncode(string text)
        {
            if (string.IsNullOrEmpty(text))
                return string.Empty;

            var result = new StringBuilder();
            var bytes = Encoding.UTF8.GetBytes(text);

            foreach (var b in bytes)
            {
                // Check if character is unreserved (no encoding needed)
                if (IsUnreserved((char)b))
                {
                    result.Append((char)b);
                }
                else
                {
                    // Convert byte to hex and prepend with %
                    result.Append($"%{b:X2}");
                }
            }

            return result.ToString();
        }

        /// <summary>
        /// Manual percent decoding
        /// </summary>
        public static string ManualDecode(string encodedText)
        {
            if (string.IsNullOrEmpty(encodedText))
                return string.Empty;

            var bytes = new List<byte>();
            int i = 0;

            while (i < encodedText.Length)
            {
                if (encodedText[i] == '%' && i + 2 < encodedText.Length)
                {
                    // Get the two hex digits after %
                    string hexString = encodedText.Substring(i + 1, 2);
                    byte b = Convert.ToByte(hexString, 16);
                    bytes.Add(b);
                    i += 3;
                }
                else
                {
                    bytes.Add((byte)encodedText[i]);
                    i++;
                }
            }

            return Encoding.UTF8.GetString(bytes.ToArray());
        }

        /// <summary>
        /// Check if character is unreserved and doesn't need encoding
        /// Unreserved: A-Z a-z 0-9 - _ . ~
        /// </summary>
        private static bool IsUnreserved(char c)
        {
            return (c >= 'A' && c <= 'Z') ||
                   (c >= 'a' && c <= 'z') ||
                   (c >= '0' && c <= '9') ||
                   c == '-' || c == '_' || c == '.' || c == '~';
        }

        /// <summary>
        /// Demonstrates the encoding process step by step
        /// For educational/debugging purposes
        /// </summary>
        public static string GetEncodingSteps(string text)
        {
            if (string.IsNullOrEmpty(text))
                return "Empty string";

            var steps = new StringBuilder();
            steps.AppendLine($"Original: {text}");
            steps.AppendLine("\nEncoding Process:");

            var bytes = Encoding.UTF8.GetBytes(text);
            foreach (var b in bytes)
            {
                char c = (char)b;
                if (IsUnreserved(c))
                {
                    steps.AppendLine($"  '{c}' -> No encoding needed -> '{c}'");
                }
                else
                {
                    steps.AppendLine($"  '{c}' -> Byte: {b} -> Hex: {b:X2} -> %{b:X2}");
                }
            }

            steps.AppendLine($"\nFinal Encoded: {Encode(text)}");
            return steps.ToString();
        }

        /// <summary>
        /// Batch encode a list of strings
        /// </summary>
        public static Dictionary<string, string> EncodeBatch(IEnumerable<string> texts)
        {
            var result = new Dictionary<string, string>();
            foreach (var text in texts)
            {
                if (!string.IsNullOrEmpty(text))
                {
                    result[text] = Encode(text);
                }
            }
            return result;
        }

        /// <summary>
        /// Batch decode a list of strings
        /// </summary>
        public static Dictionary<string, string> DecodeBatch(IEnumerable<string> encodedTexts)
        {
            var result = new Dictionary<string, string>();
            foreach (var encodedText in encodedTexts)
            {
                if (!string.IsNullOrEmpty(encodedText))
                {
                    result[encodedText] = Decode(encodedText);
                }
            }
            return result;
        }
    }
}
