using System.ComponentModel.DataAnnotations;

namespace appointza.Models
{
    /// <summary>
    /// Request model for fetching organization location by subdomain
    /// Example: appointza-panruti-cuddalore-tamil-nadu
    /// </summary>
    public class SubdomainLocationReq
    {
        [Required]
        [StringLength(100)]
        public string organisation { get; set; }

        [Required]
        [StringLength(100)]
        public string area { get; set; }

        [Required]
        [StringLength(100)]
        public string city { get; set; }

        [Required]
        [StringLength(100)]
        public string state { get; set; }
    }
}
