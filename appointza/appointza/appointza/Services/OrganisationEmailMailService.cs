using appointza.Models;
using appointza.Utils;
using MailKit;
using MailKit.Net.Imap;
using MailKit.Net.Smtp;
using MailKit.Search;
using MailKit.Security;
using MimeKit;
using System.Data.Common;
using System.Text;

namespace appointza.Services
{
    /// <summary>
    /// Sends and receives mail using the organisation's connected email integration (Gmail app password / SMTP).
    /// </summary>
    public class OrganisationEmailMailService
    {
        private readonly IDbProvider _dbProvider;
        private readonly RequestState _requestState;
        private readonly SecretProtector _secretProtector;
        private readonly ILogger<OrganisationEmailMailService> _logger;

        public OrganisationEmailMailService(
            IDbProvider dbProvider,
            RequestState requestState,
            SecretProtector secretProtector,
            ILogger<OrganisationEmailMailService> logger)
        {
            _dbProvider = dbProvider;
            _requestState = requestState;
            _secretProtector = secretProtector;
            _logger = logger;
        }

        public async Task<OrgEmailSmtpCredentials> ResolveCredentials(long organisationId = 0)
        {
            long orgId = organisationId > 0 ? organisationId : RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureSchema(db);
            return await LoadCredentials(db, orgId);
        }

        public async Task SendAsync(
            string toEmail,
            string subject,
            string bodyText,
            string? bodyHtml = null,
            long organisationId = 0)
        {
            var creds = await ResolveCredentials(organisationId);
            await SendWithCredentialsAsync(creds, toEmail, subject, bodyText, bodyHtml);
        }

        public async Task SendWithCredentialsAsync(
            OrgEmailSmtpCredentials creds,
            string toEmail,
            string subject,
            string bodyText,
            string? bodyHtml = null)
        {
            if (string.IsNullOrWhiteSpace(toEmail))
                throw new Exception("Recipient email is required.");
            if (string.IsNullOrWhiteSpace(creds.smtp_host))
                throw new Exception("SMTP host is not configured. Connect email under Profile → Email.");
            if (string.IsNullOrWhiteSpace(creds.smtp_password))
                throw new Exception("SMTP / app password is missing. Re-save your email connection with an app password.");

            var message = new MimeMessage();
            var fromName = string.IsNullOrWhiteSpace(creds.sender_name) ? creds.email_address : creds.sender_name;
            message.From.Add(new MailboxAddress(fromName, creds.email_address));
            message.To.Add(MailboxAddress.Parse(toEmail.Trim()));
            if (!string.IsNullOrWhiteSpace(creds.reply_to))
            {
                message.ReplyTo.Add(MailboxAddress.Parse(creds.reply_to.Trim()));
            }
            message.Subject = subject?.Trim() ?? "";

            var builder = new BodyBuilder
            {
                TextBody = bodyText ?? "",
            };
            if (!string.IsNullOrWhiteSpace(bodyHtml))
            {
                builder.HtmlBody = bodyHtml;
            }
            message.Body = builder.ToMessageBody();

            using var client = new SmtpClient();
            var secure = ResolveSecureSocketOptions(creds.smtp_tls_mode, creds.smtp_port);
            await client.ConnectAsync(creds.smtp_host, creds.smtp_port > 0 ? creds.smtp_port : 587, secure);
            await client.AuthenticateAsync(
                string.IsNullOrWhiteSpace(creds.smtp_username) ? creds.email_address : creds.smtp_username,
                creds.smtp_password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
        }

        public async Task<EmailInboxSyncResult> SyncInbox(int maxMessages = 40, long organisationId = 0)
        {
            long orgId = organisationId > 0 ? organisationId : RequireOrg();
            var creds = await ResolveCredentials(orgId);
            if (string.IsNullOrWhiteSpace(creds.imap_host))
            {
                throw new Exception("IMAP host could not be resolved for this provider.");
            }

            int fetched = 0;
            int inserted = 0;

            using (var client = new ImapClient())
            {
                await client.ConnectAsync(creds.imap_host, creds.imap_port > 0 ? creds.imap_port : 993, SecureSocketOptions.SslOnConnect);
                await client.AuthenticateAsync(
                    string.IsNullOrWhiteSpace(creds.smtp_username) ? creds.email_address : creds.smtp_username,
                    creds.smtp_password);
                var inbox = client.Inbox;
                await inbox.OpenAsync(MailKit.FolderAccess.ReadOnly);

                var uids = await inbox.SearchAsync(SearchQuery.All);
                var take = uids.TakeLast(Math.Clamp(maxMessages, 1, 100)).ToList();
                fetched = take.Count;

                using var db = await _dbProvider.GetDb();
                await db.Connect();
                await EnsureSchema(db);

                foreach (var uid in take)
                {
                    var msg = await inbox.GetMessageAsync(uid);
                    var providerId = msg.MessageId?.Trim() ?? $"imap:{uid}";
                    var from = msg.From.Mailboxes.FirstOrDefault()?.Address ?? msg.From.ToString();
                    var to = msg.To.Mailboxes.FirstOrDefault()?.Address ?? creds.email_address;
                    var subject = msg.Subject ?? "";
                    var text = msg.TextBody ?? StripHtml(msg.HtmlBody ?? "");
                    var preview = text.Length > 480 ? text[..480] : text;
                    var received = msg.Date.UtcDateTime;

                    if (await InsertInboundMessage(db, orgId, creds.integration_id, providerId, from, to, subject, text, preview, received))
                    {
                        inserted++;
                    }
                }

                await client.DisconnectAsync(true);
            }

            return new EmailInboxSyncResult
            {
                fetched = fetched,
                inserted = inserted,
                message = inserted > 0
                    ? $"Synced {inserted} new message(s) from {fetched} fetched."
                    : fetched > 0
                        ? "Inbox checked — no new messages."
                        : "Inbox is empty.",
            };
        }

        public async Task<List<EmailMessageDto>> ListMessages(int limit = 50, long organisationId = 0)
        {
            long orgId = organisationId > 0 ? organisationId : RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await EnsureSchema(db);

            var list = new List<EmailMessageDto>();
            string sql = @"
                SELECT id, organisation_id, integration_id, direction, provider_message_id,
                       from_address, to_address, subject, body_preview, body_text, received_at, created_at
                FROM email_messages
                WHERE organisation_id = @organisation_id
                ORDER BY COALESCE(received_at, created_at) DESC, id DESC
                LIMIT @limit;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = Math.Clamp(limit, 1, 200);
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                list.Add(MapMessage(reader));
            }
            return list;
        }

        public async Task LogOutboundAsync(
            IDb db,
            long orgId,
            long integrationId,
            string toEmail,
            string subject,
            string bodyPreview,
            string providerMessageId = "")
        {
            string sql = @"
                INSERT INTO email_messages (
                    organisation_id, integration_id, direction, provider_message_id,
                    from_address, to_address, subject, body_preview, body_text, received_at, created_at
                ) VALUES (
                    @organisation_id, @integration_id, 'outbound', @provider_message_id,
                    '', @to_address, @subject, @body_preview, @body_text, @received_at, @created_at
                );";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "integration_id", DbTypes.Types.Long).Value = integrationId > 0 ? integrationId : (object)DBNull.Value;
            db.AddParameter(command, "provider_message_id", DbTypes.Types.String).Value = providerMessageId ?? "";
            db.AddParameter(command, "to_address", DbTypes.Types.String).Value = toEmail ?? "";
            db.AddParameter(command, "subject", DbTypes.Types.String).Value = subject ?? "";
            db.AddParameter(command, "body_preview", DbTypes.Types.String).Value = Truncate(bodyPreview ?? "", 480);
            db.AddParameter(command, "body_text", DbTypes.Types.String).Value = bodyPreview ?? "";
            db.AddParameter(command, "received_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        private async Task<bool> InsertInboundMessage(
            IDb db,
            long orgId,
            long integrationId,
            string providerId,
            string from,
            string to,
            string subject,
            string bodyText,
            string preview,
            DateTime receivedAt)
        {
            string existsSql = @"
                SELECT 1 FROM email_messages
                WHERE organisation_id = @organisation_id AND provider_message_id = @provider_message_id
                LIMIT 1;";
            using (var existsCmd = db.GetCommand(existsSql))
            {
                db.AddParameter(existsCmd, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(existsCmd, "provider_message_id", DbTypes.Types.String).Value = providerId;
                using var reader = await db.Execute(existsCmd);
                if (await reader.ReadAsync()) return false;
            }

            string sql = @"
                INSERT INTO email_messages (
                    organisation_id, integration_id, direction, provider_message_id,
                    from_address, to_address, subject, body_preview, body_text, received_at, created_at
                ) VALUES (
                    @organisation_id, @integration_id, 'inbound', @provider_message_id,
                    @from_address, @to_address, @subject, @body_preview, @body_text, @received_at, @created_at
                );";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "integration_id", DbTypes.Types.Long).Value = integrationId > 0 ? integrationId : (object)DBNull.Value;
            db.AddParameter(command, "provider_message_id", DbTypes.Types.String).Value = providerId ?? "";
            db.AddParameter(command, "from_address", DbTypes.Types.String).Value = from ?? "";
            db.AddParameter(command, "to_address", DbTypes.Types.String).Value = to ?? "";
            db.AddParameter(command, "subject", DbTypes.Types.String).Value = Truncate(subject ?? "", 500);
            db.AddParameter(command, "body_preview", DbTypes.Types.String).Value = Truncate(preview ?? "", 480);
            db.AddParameter(command, "body_text", DbTypes.Types.String).Value = bodyText ?? "";
            db.AddParameter(command, "received_at", DbTypes.Types.DateTime).Value = receivedAt;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
            return true;
        }

        private async Task<OrgEmailSmtpCredentials> LoadCredentials(IDb db, long orgId)
        {
            string sql = @"
                SELECT oi.id AS integration_id, ec.email_provider, ec.email_address, ec.sender_name, ec.reply_to,
                       ec.smtp_host, ec.smtp_port, ec.smtp_tls_mode, ec.smtp_username
                FROM organization_integrations oi
                INNER JOIN email_connections ec ON ec.integration_id = oi.id
                WHERE oi.organisation_id = @organisation_id
                  AND oi.provider = 'email'
                  AND COALESCE(oi.is_active, TRUE) = TRUE
                ORDER BY CASE WHEN oi.status = 'connected' THEN 0 ELSE 1 END, oi.updated_at DESC
                LIMIT 1;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                throw new Exception("No email connection found. Connect Gmail/SMTP under Profile → Email.");
            }

            var creds = new OrgEmailSmtpCredentials
            {
                integration_id = Convert.ToInt64(reader["integration_id"]),
                email_provider = reader["email_provider"]?.ToString() ?? "gmail",
                email_address = reader["email_address"]?.ToString() ?? "",
                sender_name = reader["sender_name"]?.ToString() ?? "",
                reply_to = reader["reply_to"]?.ToString() ?? "",
                smtp_host = reader["smtp_host"]?.ToString() ?? "",
                smtp_port = reader["smtp_port"] == DBNull.Value ? 587 : Convert.ToInt32(reader["smtp_port"]),
                smtp_tls_mode = reader["smtp_tls_mode"]?.ToString() ?? "starttls",
                smtp_username = reader["smtp_username"]?.ToString() ?? "",
            };

            ApplyProviderDefaults(creds);
            creds.smtp_password = await LoadSmtpPassword(db, creds.integration_id);
            return creds;
        }

        private static void ApplyProviderDefaults(OrgEmailSmtpCredentials creds)
        {
            var provider = (creds.email_provider ?? "gmail").Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(creds.smtp_host))
            {
                creds.smtp_host = provider switch
                {
                    "microsoft365" => "smtp.office365.com",
                    "smtp" => creds.smtp_host,
                    _ => "smtp.gmail.com",
                };
            }
            if (creds.smtp_port <= 0) creds.smtp_port = 587;
            if (string.IsNullOrWhiteSpace(creds.smtp_tls_mode)) creds.smtp_tls_mode = "starttls";
            if (string.IsNullOrWhiteSpace(creds.smtp_username)) creds.smtp_username = creds.email_address;

            creds.imap_host = provider switch
            {
                "microsoft365" => "outlook.office365.com",
                "smtp" => InferImapHost(creds.smtp_host),
                _ => "imap.gmail.com",
            };
            creds.imap_port = 993;
        }

        private static string InferImapHost(string smtpHost)
        {
            var host = (smtpHost ?? "").Trim().ToLowerInvariant();
            if (host.StartsWith("smtp.")) return "imap." + host[5..];
            if (host.Contains("gmail")) return "imap.gmail.com";
            if (host.Contains("office365") || host.Contains("outlook")) return "outlook.office365.com";
            return host;
        }

        private async Task<string> LoadSmtpPassword(IDb db, long integrationId)
        {
            string encrypted = "";
            string sql = @"
                SELECT encrypted_value
                FROM integration_secrets
                WHERE integration_id = @integration_id AND secret_type = @secret_type
                LIMIT 1;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "integration_id", DbTypes.Types.Long).Value = integrationId;
            db.AddParameter(command, "secret_type", DbTypes.Types.String).Value = IntegrationSecretTypes.SmtpPassword;
            using var reader = await db.Execute(command);
            if (await reader.ReadAsync())
            {
                encrypted = reader["encrypted_value"]?.ToString() ?? "";
            }
            if (string.IsNullOrWhiteSpace(encrypted)) return "";
            try
            {
                return _secretProtector.Decrypt(encrypted);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to decrypt SMTP password for integration {IntegrationId}", integrationId);
                return "";
            }
        }

        private static SecureSocketOptions ResolveSecureSocketOptions(string tlsMode, int port)
        {
            var mode = (tlsMode ?? "starttls").Trim().ToLowerInvariant();
            return mode switch
            {
                "none" => SecureSocketOptions.None,
                "ssl" => SecureSocketOptions.SslOnConnect,
                _ => port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls,
            };
        }

        public async Task EnsureSchema(IDb db)
        {
            // Idempotent bootstrap so local/dev works without manually running SQL.
            string sql = @"
CREATE TABLE IF NOT EXISTS email_campaigns (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    integration_id BIGINT NULL,
    name VARCHAR(200) NOT NULL DEFAULT '',
    subject VARCHAR(500) NOT NULL DEFAULT '',
    body_text TEXT NOT NULL DEFAULT '',
    body_html TEXT NOT NULL DEFAULT '',
    status VARCHAR(40) NOT NULL DEFAULT 'draft',
    audience_mode VARCHAR(40) NOT NULL DEFAULT 'leads_with_email',
    selected_count INT NOT NULL DEFAULT 0,
    sent_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    last_error TEXT NOT NULL DEFAULT '',
    version INT NOT NULL DEFAULT 1,
    created_by BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ NULL
);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_org ON email_campaigns (organisation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS email_campaign_recipients (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    campaign_id BIGINT NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
    enquiry_id BIGINT NULL,
    display_name VARCHAR(200) NOT NULL DEFAULT '',
    email_address VARCHAR(255) NOT NULL,
    delivery_status VARCHAR(40) NOT NULL DEFAULT 'pending',
    error_message TEXT NOT NULL DEFAULT '',
    provider_message_id VARCHAR(255) NOT NULL DEFAULT '',
    sent_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign
    ON email_campaign_recipients (campaign_id, delivery_status);

CREATE TABLE IF NOT EXISTS email_messages (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT NOT NULL,
    integration_id BIGINT NULL,
    direction VARCHAR(20) NOT NULL DEFAULT 'inbound',
    provider_message_id VARCHAR(255) NOT NULL DEFAULT '',
    thread_key VARCHAR(255) NOT NULL DEFAULT '',
    from_address VARCHAR(255) NOT NULL DEFAULT '',
    to_address VARCHAR(255) NOT NULL DEFAULT '',
    subject VARCHAR(500) NOT NULL DEFAULT '',
    body_text TEXT NOT NULL DEFAULT '',
    body_preview VARCHAR(500) NOT NULL DEFAULT '',
    received_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email_messages_org
    ON email_messages (organisation_id, received_at DESC NULLS LAST, created_at DESC);
";
            using var command = db.GetCommand(sql);
            await db.ExecuteNonQuery(command);
        }

        private static EmailMessageDto MapMessage(DbDataReader reader)
        {
            return new EmailMessageDto
            {
                id = Convert.ToInt64(reader["id"]),
                organisation_id = Convert.ToInt64(reader["organisation_id"]),
                integration_id = reader["integration_id"] == DBNull.Value ? null : Convert.ToInt64(reader["integration_id"]),
                direction = reader["direction"]?.ToString() ?? "inbound",
                provider_message_id = reader["provider_message_id"]?.ToString() ?? "",
                from_address = reader["from_address"]?.ToString() ?? "",
                to_address = reader["to_address"]?.ToString() ?? "",
                subject = reader["subject"]?.ToString() ?? "",
                body_preview = reader["body_preview"]?.ToString() ?? "",
                body_text = reader["body_text"]?.ToString() ?? "",
                received_at = reader["received_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["received_at"]),
                created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]),
            };
        }

        private static string StripHtml(string html)
        {
            if (string.IsNullOrWhiteSpace(html)) return "";
            var sb = new StringBuilder(html.Length);
            bool inside = false;
            foreach (var ch in html)
            {
                if (ch == '<') { inside = true; continue; }
                if (ch == '>') { inside = false; continue; }
                if (!inside) sb.Append(ch);
            }
            return System.Net.WebUtility.HtmlDecode(sb.ToString());
        }

        private static string Truncate(string value, int max) =>
            string.IsNullOrEmpty(value) ? "" : value.Length <= max ? value : value[..max];

        private long RequireOrg()
        {
            try
            {
                var ctx = _requestState.usercontext;
                if (ctx != null && ctx.organisationid > 0) return ctx.organisationid;
            }
            catch { /* ignore */ }
            throw new Exception("Organisation is required.");
        }
    }
}
