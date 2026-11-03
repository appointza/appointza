using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class EmailCampaignService
    {
        private readonly IDbProvider _dbProvider;
        private readonly RequestState _requestState;
        private readonly OrganisationEmailMailService _mail;
        private readonly ILogger<EmailCampaignService> _logger;

        public EmailCampaignService(
            IDbProvider dbProvider,
            RequestState requestState,
            OrganisationEmailMailService mail,
            ILogger<EmailCampaignService> logger)
        {
            _dbProvider = dbProvider;
            _requestState = requestState;
            _mail = mail;
            _logger = logger;
        }

        public async Task<List<EmailCampaignDto>> Select(EmailCampaignSelectReq req)
        {
            long orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await _mail.EnsureSchema(db);

            var list = new List<EmailCampaignDto>();
            string sql = @"
                SELECT id, organisation_id, integration_id, name, subject, body_text, body_html, status,
                       audience_mode, selected_count, sent_count, failed_count, last_error, version,
                       created_by, created_at, updated_at, sent_at
                FROM email_campaigns
                WHERE organisation_id = @organisation_id
                  AND (@status = '' OR status = @status)
                  AND (@search = '' OR name ILIKE '%' || @search || '%' OR subject ILIKE '%' || @search || '%')
                ORDER BY created_at DESC
                LIMIT @limit OFFSET @offset;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = (req.status ?? "").Trim();
            db.AddParameter(command, "search", DbTypes.Types.String).Value = (req.search ?? "").Trim();
            db.AddParameter(command, "limit", DbTypes.Types.Integer).Value = Math.Clamp(req.limit <= 0 ? 50 : req.limit, 1, 200);
            db.AddParameter(command, "offset", DbTypes.Types.Integer).Value = Math.Max(0, req.offset);
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                list.Add(MapCampaign(reader));
            }
            return list;
        }

        public async Task<EmailCampaignDto?> GetById(long id)
        {
            long orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await _mail.EnsureSchema(db);
            return await GetByIdTx(db, orgId, id);
        }

        public async Task<List<EmailCampaignRecipientDto>> ListRecipients(long campaignId)
        {
            long orgId = RequireOrg();
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await _mail.EnsureSchema(db);

            var list = new List<EmailCampaignRecipientDto>();
            string sql = @"
                SELECT id, campaign_id, enquiry_id, display_name, email_address, delivery_status, error_message, sent_at
                FROM email_campaign_recipients
                WHERE organisation_id = @organisation_id AND campaign_id = @campaign_id
                ORDER BY id ASC;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                list.Add(new EmailCampaignRecipientDto
                {
                    id = Convert.ToInt64(reader["id"]),
                    campaign_id = Convert.ToInt64(reader["campaign_id"]),
                    enquiry_id = reader["enquiry_id"] == DBNull.Value ? null : Convert.ToInt64(reader["enquiry_id"]),
                    display_name = reader["display_name"]?.ToString() ?? "",
                    email_address = reader["email_address"]?.ToString() ?? "",
                    delivery_status = reader["delivery_status"]?.ToString() ?? "pending",
                    error_message = reader["error_message"]?.ToString() ?? "",
                    sent_at = reader["sent_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["sent_at"]),
                });
            }
            return list;
        }

        public async Task<EmailCampaignDto> Create(EmailCampaignUpsertReq req)
        {
            long orgId = RequireOrg();
            if (string.IsNullOrWhiteSpace(req.subject))
                throw new Exception("Subject is required.");
            if (string.IsNullOrWhiteSpace(req.body_text) && string.IsNullOrWhiteSpace(req.body_html))
                throw new Exception("Email body is required.");

            var creds = await _mail.ResolveCredentials(orgId);
            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await _mail.EnsureSchema(db);

            string sql = @"
                INSERT INTO email_campaigns (
                    organisation_id, integration_id, name, subject, body_text, body_html, status,
                    audience_mode, selected_count, created_by, created_at, updated_at
                ) VALUES (
                    @organisation_id, @integration_id, @name, @subject, @body_text, @body_html, 'draft',
                    @audience_mode, 0, @created_by, @created_at, @updated_at
                ) RETURNING id;";
            long id;
            var now = DateTime.UtcNow;
            using (var command = db.GetCommand(sql))
            {
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(command, "integration_id", DbTypes.Types.Long).Value = creds.integration_id;
                db.AddParameter(command, "name", DbTypes.Types.String).Value =
                    string.IsNullOrWhiteSpace(req.name) ? Truncate(req.subject.Trim(), 200) : req.name.Trim();
                db.AddParameter(command, "subject", DbTypes.Types.String).Value = Truncate(req.subject.Trim(), 500);
                db.AddParameter(command, "body_text", DbTypes.Types.String).Value = req.body_text ?? "";
                db.AddParameter(command, "body_html", DbTypes.Types.String).Value = req.body_html ?? "";
                db.AddParameter(command, "audience_mode", DbTypes.Types.String).Value =
                    string.IsNullOrWhiteSpace(req.audience_mode) ? "leads_with_email" : req.audience_mode.Trim();
                db.AddParameter(command, "created_by", DbTypes.Types.Long).Value = SafeUserId() > 0 ? SafeUserId() : (object)DBNull.Value;
                db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = now;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = now;
                using var reader = await db.Execute(command);
                if (!await reader.ReadAsync()) throw new Exception("Failed to create campaign.");
                id = Convert.ToInt64(reader["id"]);
            }

            int selected = await MaterializeRecipients(db, orgId, id, req);
            await UpdateSelectedCount(db, id, selected);

            return (await GetByIdTx(db, orgId, id))!;
        }

        public async Task<EmailSendResult> SendNow(long id)
        {
            long orgId = RequireOrg();
            var creds = await _mail.ResolveCredentials(orgId);

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await _mail.EnsureSchema(db);

            var campaign = await GetByIdTx(db, orgId, id)
                ?? throw new Exception("Campaign not found.");
            if (campaign.status is "sending")
                throw new Exception("Campaign is already sending.");

            await SetStatus(db, id, "sending", "");

            var recipients = await LoadPendingRecipients(db, orgId, id);
            if (recipients.Count == 0)
            {
                // Re-materialize leads if draft was empty.
                await MaterializeRecipients(db, orgId, id, new EmailCampaignUpsertReq
                {
                    audience_mode = campaign.audience_mode,
                    subject = campaign.subject,
                    body_text = campaign.body_text,
                });
                recipients = await LoadPendingRecipients(db, orgId, id);
            }

            int sent = 0;
            int failed = 0;
            string lastError = "";

            foreach (var recipient in recipients)
            {
                try
                {
                    await _mail.SendWithCredentialsAsync(
                        creds,
                        recipient.email_address,
                        campaign.subject,
                        campaign.body_text,
                        string.IsNullOrWhiteSpace(campaign.body_html) ? null : campaign.body_html);
                    await MarkRecipient(db, recipient.id, "sent", "");
                    await _mail.LogOutboundAsync(
                        db,
                        orgId,
                        creds.integration_id,
                        recipient.email_address,
                        campaign.subject,
                        campaign.body_text);
                    sent++;
                }
                catch (Exception ex)
                {
                    failed++;
                    lastError = ex.Message;
                    _logger.LogWarning(ex, "Email campaign {CampaignId} failed for {Email}", id, recipient.email_address);
                    await MarkRecipient(db, recipient.id, "failed", Truncate(ex.Message, 500));
                }
            }

            string status = failed == 0 && sent > 0
                ? "sent"
                : sent > 0
                    ? "sent_with_errors"
                    : "failed";

            string updateSql = @"
                UPDATE email_campaigns
                SET status = @status,
                    sent_count = @sent_count,
                    failed_count = @failed_count,
                    last_error = @last_error,
                    sent_at = @sent_at,
                    updated_at = @updated_at,
                    version = version + 1
                WHERE id = @id AND organisation_id = @organisation_id;";
            using (var command = db.GetCommand(updateSql))
            {
                db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
                db.AddParameter(command, "sent_count", DbTypes.Types.Integer).Value = sent;
                db.AddParameter(command, "failed_count", DbTypes.Types.Integer).Value = failed;
                db.AddParameter(command, "last_error", DbTypes.Types.String).Value = lastError ?? "";
                db.AddParameter(command, "sent_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                await db.ExecuteNonQuery(command);
            }

            var updated = await GetByIdTx(db, orgId, id);
            return new EmailSendResult
            {
                success = sent > 0,
                message = sent > 0
                    ? $"Sent {sent} email(s)" + (failed > 0 ? $", {failed} failed." : ".")
                    : (string.IsNullOrWhiteSpace(lastError) ? "No emails were sent." : lastError),
                sent_count = sent,
                failed_count = failed,
                campaign = updated,
            };
        }

        public async Task<EmailSendResult> TestSend(EmailTestSendReq req)
        {
            if (string.IsNullOrWhiteSpace(req.to_email))
                throw new Exception("Recipient email is required.");

            long orgId = RequireOrg();
            var creds = await _mail.ResolveCredentials(orgId);
            await _mail.SendWithCredentialsAsync(
                creds,
                req.to_email.Trim(),
                string.IsNullOrWhiteSpace(req.subject) ? "Appointza test email" : req.subject.Trim(),
                string.IsNullOrWhiteSpace(req.body_text)
                    ? "This is a test email from Appointza."
                    : req.body_text);

            using var db = await _dbProvider.GetDb();
            await db.Connect();
            await _mail.EnsureSchema(db);
            await _mail.LogOutboundAsync(
                db,
                orgId,
                creds.integration_id,
                req.to_email.Trim(),
                req.subject ?? "Appointza test email",
                req.body_text ?? "This is a test email from Appointza.");

            return new EmailSendResult
            {
                success = true,
                message = $"Test email sent to {req.to_email.Trim()}.",
                sent_count = 1,
            };
        }

        private async Task<int> MaterializeRecipients(IDb db, long orgId, long campaignId, EmailCampaignUpsertReq req)
        {
            // Clear previous pending rows for this campaign (draft rebuild).
            using (var del = db.GetCommand("DELETE FROM email_campaign_recipients WHERE campaign_id = @campaign_id AND organisation_id = @organisation_id;"))
            {
                db.AddParameter(del, "campaign_id", DbTypes.Types.Long).Value = campaignId;
                db.AddParameter(del, "organisation_id", DbTypes.Types.Long).Value = orgId;
                await db.ExecuteNonQuery(del);
            }

            var mode = (req.audience_mode ?? "leads_with_email").Trim().ToLowerInvariant();
            int count = 0;

            if (mode == "manual" && req.manual_emails != null)
            {
                foreach (var raw in req.manual_emails)
                {
                    var email = (raw ?? "").Trim();
                    if (!LooksLikeEmail(email)) continue;
                    if (await InsertRecipient(db, orgId, campaignId, null, "", email)) count++;
                }
                return count;
            }

            string sql = @"
                SELECT id, COALESCE(name, '') AS name, COALESCE(email, '') AS email
                FROM enquiries
                WHERE organisation_id = @organisation_id
                  AND COALESCE(is_active, TRUE) = TRUE
                  AND email IS NOT NULL AND btrim(email) <> ''
                ORDER BY id DESC
                LIMIT 500;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            using var reader = await db.Execute(command);
            var rows = new List<(long id, string name, string email)>();
            while (await reader.ReadAsync())
            {
                rows.Add((
                    Convert.ToInt64(reader["id"]),
                    reader["name"]?.ToString() ?? "",
                    reader["email"]?.ToString() ?? ""
                ));
            }

            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var row in rows)
            {
                var email = row.email.Trim();
                if (!LooksLikeEmail(email) || !seen.Add(email)) continue;
                if (await InsertRecipient(db, orgId, campaignId, row.id, row.name, email)) count++;
            }
            return count;
        }

        private async Task<bool> InsertRecipient(
            IDb db, long orgId, long campaignId, long? enquiryId, string name, string email)
        {
            string sql = @"
                INSERT INTO email_campaign_recipients (
                    organisation_id, campaign_id, enquiry_id, display_name, email_address,
                    delivery_status, created_at
                ) VALUES (
                    @organisation_id, @campaign_id, @enquiry_id, @display_name, @email_address,
                    'pending', @created_at
                );";
            try
            {
                using var command = db.GetCommand(sql);
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
                db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
                db.AddParameter(command, "enquiry_id", DbTypes.Types.Long).Value = enquiryId.HasValue ? enquiryId.Value : (object)DBNull.Value;
                db.AddParameter(command, "display_name", DbTypes.Types.String).Value = name ?? "";
                db.AddParameter(command, "email_address", DbTypes.Types.String).Value = email;
                db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                await db.ExecuteNonQuery(command);
                return true;
            }
            catch
            {
                return false;
            }
        }

        private async Task UpdateSelectedCount(IDb db, long campaignId, int selected)
        {
            string sql = @"UPDATE email_campaigns SET selected_count = @selected_count, updated_at = @updated_at WHERE id = @id;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "selected_count", DbTypes.Types.Integer).Value = selected;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = campaignId;
            await db.ExecuteNonQuery(command);
        }

        private async Task SetStatus(IDb db, long id, string status, string lastError)
        {
            string sql = @"UPDATE email_campaigns SET status = @status, last_error = @last_error, updated_at = @updated_at WHERE id = @id;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "last_error", DbTypes.Types.String).Value = lastError ?? "";
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            await db.ExecuteNonQuery(command);
        }

        private async Task MarkRecipient(IDb db, long recipientId, string status, string error)
        {
            string sql = @"
                UPDATE email_campaign_recipients
                SET delivery_status = @delivery_status,
                    error_message = @error_message,
                    sent_at = CASE WHEN @delivery_status = 'sent' THEN @sent_at ELSE sent_at END
                WHERE id = @id;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "delivery_status", DbTypes.Types.String).Value = status;
            db.AddParameter(command, "error_message", DbTypes.Types.String).Value = error ?? "";
            db.AddParameter(command, "sent_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = recipientId;
            await db.ExecuteNonQuery(command);
        }

        private async Task<List<EmailCampaignRecipientDto>> LoadPendingRecipients(IDb db, long orgId, long campaignId)
        {
            var list = new List<EmailCampaignRecipientDto>();
            string sql = @"
                SELECT id, campaign_id, enquiry_id, display_name, email_address, delivery_status, error_message, sent_at
                FROM email_campaign_recipients
                WHERE organisation_id = @organisation_id AND campaign_id = @campaign_id
                  AND delivery_status = 'pending'
                ORDER BY id ASC;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "campaign_id", DbTypes.Types.Long).Value = campaignId;
            using var reader = await db.Execute(command);
            while (await reader.ReadAsync())
            {
                list.Add(new EmailCampaignRecipientDto
                {
                    id = Convert.ToInt64(reader["id"]),
                    campaign_id = Convert.ToInt64(reader["campaign_id"]),
                    email_address = reader["email_address"]?.ToString() ?? "",
                    display_name = reader["display_name"]?.ToString() ?? "",
                    delivery_status = "pending",
                });
            }
            return list;
        }

        private async Task<EmailCampaignDto?> GetByIdTx(IDb db, long orgId, long id)
        {
            string sql = @"
                SELECT id, organisation_id, integration_id, name, subject, body_text, body_html, status,
                       audience_mode, selected_count, sent_count, failed_count, last_error, version,
                       created_by, created_at, updated_at, sent_at
                FROM email_campaigns
                WHERE organisation_id = @organisation_id AND id = @id
                LIMIT 1;";
            using var command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
            using var reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return MapCampaign(reader);
        }

        private static EmailCampaignDto MapCampaign(DbDataReader reader)
        {
            return new EmailCampaignDto
            {
                id = Convert.ToInt64(reader["id"]),
                organisation_id = Convert.ToInt64(reader["organisation_id"]),
                integration_id = reader["integration_id"] == DBNull.Value ? null : Convert.ToInt64(reader["integration_id"]),
                name = reader["name"]?.ToString() ?? "",
                subject = reader["subject"]?.ToString() ?? "",
                body_text = reader["body_text"]?.ToString() ?? "",
                body_html = reader["body_html"]?.ToString() ?? "",
                status = reader["status"]?.ToString() ?? "draft",
                audience_mode = reader["audience_mode"]?.ToString() ?? "leads_with_email",
                selected_count = reader["selected_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["selected_count"]),
                sent_count = reader["sent_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["sent_count"]),
                failed_count = reader["failed_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["failed_count"]),
                last_error = reader["last_error"]?.ToString() ?? "",
                version = reader["version"] == DBNull.Value ? 1 : Convert.ToInt32(reader["version"]),
                created_by = reader["created_by"] == DBNull.Value ? null : Convert.ToInt64(reader["created_by"]),
                created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]),
                updated_at = reader["updated_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["updated_at"]),
                sent_at = reader["sent_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["sent_at"]),
            };
        }

        private static bool LooksLikeEmail(string value) =>
            !string.IsNullOrWhiteSpace(value) && value.Contains('@') && value.Contains('.');

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

        private long SafeUserId()
        {
            try { return _requestState.usercontext?.userid ?? 0; }
            catch { return 0; }
        }
    }
}
