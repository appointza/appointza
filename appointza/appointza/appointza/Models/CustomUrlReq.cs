using System.ComponentModel.DataAnnotations;

namespace appointza.Models
{
    /// <summary>
    /// Lookup organisation location by stored custom URL slug (subdomain prefix).
    /// Example: awonderonesurprise → awonderonesurprise.appointza.com
    /// </summary>
    public class CustomUrlReq
    {
        [Required]
        [StringLength(200)]
        public string customUrl { get; set; }
    }
}
