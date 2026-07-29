using System;

namespace appointza.Models
{
    public class PaymentGatewayCredentials
    {
        public long id { get; set; }
        public long gateway_id { get; set; }
        public long organization_id { get; set; }
        public string gateway_name { get; set; } = string.Empty;
        public string api_key { get; set; } = string.Empty;
        public string api_secret { get; set; } = string.Empty;
        public string? upi_id { get; set; }
        public string? webhook_secret { get; set; }
        public string environment { get; set; } = "production";
        public bool is_active { get; set; } = true;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }

    // Request DTOs for PaymentGatewayCredentials
    public class PaymentGatewayCredentialsSelectReq
    {
        public long? id { get; set; }
        public long? gateway_id { get; set; }
        public long? organization_id { get; set; }
        public string? gateway_name { get; set; }
        public bool? is_active { get; set; }
    }

    public class PaymentGatewayCredentialsInsertReq
    {
        public long gateway_id { get; set; }
        public long organization_id { get; set; }
        public string gateway_name { get; set; } = string.Empty;
        public string api_key { get; set; } = string.Empty;
        public string api_secret { get; set; } = string.Empty;
        public string? upi_id { get; set; }
        public string? webhook_secret { get; set; }
        public string environment { get; set; } = "production";
        public bool is_active { get; set; } = true;
    }

    public class PaymentGatewayCredentialsUpdateReq
    {
        public long id { get; set; }
        public long? gateway_id { get; set; }
        public long? organization_id { get; set; }
        public string? gateway_name { get; set; }
        public string? api_key { get; set; }
        public string? api_secret { get; set; }
        public string? upi_id { get; set; }
        public string? webhook_secret { get; set; }
        public string? environment { get; set; }
        public bool? is_active { get; set; }
    }

    /// <summary>Toggle gateway on/off without resubmitting secrets (uses existing Update merge logic).</summary>
    public class PaymentGatewayCredentialsSetActiveReq
    {
        public long id { get; set; }
        public bool is_active { get; set; }
    }

    // Safe DTO for returning credentials without exposing sensitive data
    public class PaymentGatewayCredentialsSafe
    {
        public long id { get; set; }
        public long gateway_id { get; set; }
        public long organization_id { get; set; }
        public string gateway_name { get; set; } = string.Empty;
        public string api_key { get; set; } = string.Empty; // Masked
        public string api_secret { get; set; } = string.Empty; // Masked
        public string? upi_id { get; set; }
        public string? webhook_secret { get; set; } // Masked
        public string environment { get; set; } = "production";
        public bool is_active { get; set; } = true;
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }
}

