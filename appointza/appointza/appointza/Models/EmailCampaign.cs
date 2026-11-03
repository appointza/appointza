namespace appointza.Models
{
    public class EmailCampaignDto
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long? integration_id { get; set; }
        public string name { get; set; } = "";
        public string subject { get; set; } = "";
        public string body_text { get; set; } = "";
        public string body_html { get; set; } = "";
        public string status { get; set; } = "draft";
        public string audience_mode { get; set; } = "leads_with_email";
        public int selected_count { get; set; }
        public int sent_count { get; set; }
        public int failed_count { get; set; }
        public string last_error { get; set; } = "";
        public int version { get; set; } = 1;
        public long? created_by { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public DateTime? sent_at { get; set; }
    }

    public class EmailCampaignRecipientDto
    {
        public long id { get; set; }
        public long campaign_id { get; set; }
        public long? enquiry_id { get; set; }
        public string display_name { get; set; } = "";
        public string email_address { get; set; } = "";
        public string delivery_status { get; set; } = "pending";
        public string error_message { get; set; } = "";
        public DateTime? sent_at { get; set; }
    }

    public class EmailMessageDto
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long? integration_id { get; set; }
        public string direction { get; set; } = "inbound";
        public string provider_message_id { get; set; } = "";
        public string from_address { get; set; } = "";
        public string to_address { get; set; } = "";
        public string subject { get; set; } = "";
        public string body_preview { get; set; } = "";
        public string body_text { get; set; } = "";
        public DateTime? received_at { get; set; }
        public DateTime created_at { get; set; }
    }

    public class EmailCampaignUpsertReq
    {
        public string name { get; set; } = "";
        public string subject { get; set; } = "";
        public string body_text { get; set; } = "";
        public string body_html { get; set; } = "";
        public string audience_mode { get; set; } = "leads_with_email";
        public List<string>? manual_emails { get; set; }
    }

    public class EmailCampaignSelectReq
    {
        public string search { get; set; } = "";
        public string status { get; set; } = "";
        public int limit { get; set; } = 50;
        public int offset { get; set; } = 0;
    }

    public class EmailTestSendReq
    {
        public string to_email { get; set; } = "";
        public string subject { get; set; } = "Appointza test email";
        public string body_text { get; set; } = "This is a test email from Appointza.";
    }

    public class EmailSendResult
    {
        public bool success { get; set; }
        public string message { get; set; } = "";
        public int sent_count { get; set; }
        public int failed_count { get; set; }
        public EmailCampaignDto? campaign { get; set; }
    }

    public class EmailInboxSyncResult
    {
        public int fetched { get; set; }
        public int inserted { get; set; }
        public string message { get; set; } = "";
    }

    public class OrgEmailSmtpCredentials
    {
        public long integration_id { get; set; }
        public string email_provider { get; set; } = "gmail";
        public string email_address { get; set; } = "";
        public string sender_name { get; set; } = "";
        public string reply_to { get; set; } = "";
        public string smtp_host { get; set; } = "";
        public int smtp_port { get; set; } = 587;
        public string smtp_tls_mode { get; set; } = "starttls";
        public string smtp_username { get; set; } = "";
        public string smtp_password { get; set; } = "";
        public string imap_host { get; set; } = "";
        public int imap_port { get; set; } = 993;
    }
}
