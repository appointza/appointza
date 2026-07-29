using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace appointza.Models
{
    /// <summary>
    /// Public marketing-site Contact Us payload. Property names are lowercase to
    /// match the rest of the Appointza API (e.g. Enquiry.organisation_id).
    /// </summary>
    public class ContactFormRequest
    {
        [Required]
        [JsonPropertyName("name")]
        public string name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [JsonPropertyName("email")]
        public string email { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string phone { get; set; } = string.Empty;

        [Required]
        [JsonPropertyName("subject")]
        public string subject { get; set; } = string.Empty;

        [Required]
        [JsonPropertyName("message")]
        public string message { get; set; } = string.Empty;

        /// <summary>
        /// Optional organisation id. Sent by the frontend when an authenticated
        /// org owner / staff submits the form so the enquiry is tracked against
        /// their organisation. Anonymous marketing visitors leave this as 0.
        /// The server falls back to RequestState.usercontext.organisationid when
        /// a valid JWT is present and organisation_id is 0.
        /// </summary>
        [JsonPropertyName("organisation_id")]
        public long organisation_id { get; set; }
    }
}
