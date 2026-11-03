using System.Data.Common;
using System.Text.Json;
using appointza.Models;
using appointza.Utils;

namespace appointza.Services
{
    public class OrganisationSalesProfileService
    {
        static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        readonly IDbProvider dbprovider;
        readonly OrganisationCrmCatalogueService catalogueService;
        readonly EnquiryService enquiryService;
        readonly RequestState requeststate;

        public OrganisationSalesProfileService(
            IDbProvider dbprovider,
            OrganisationCrmCatalogueService catalogueService,
            EnquiryService enquiryService,
            RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.catalogueService = catalogueService;
            this.enquiryService = enquiryService;
            this.requeststate = requeststate;
        }

        public async Task<OrganisationSalesProfileView> Get(OrganisationSalesProfileSelectReq req)
        {
            long orgId = ResolveOrganisationId(req?.organisation_id);
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await EnsureSchema(db);
            }

            var row = await SelectRow(orgId);
            if (row == null)
            {
                return EmptyView(orgId);
            }

            var overview = await TryCatalogue(orgId);
            var changedSections = new List<string>();
            var catalogueChanged = false;
            if (overview != null && !string.IsNullOrEmpty(row.catalogue_fingerprint))
            {
                var next = OrganisationSalesProfileBuilder.Fingerprint(overview);
                changedSections = OrganisationSalesProfileBuilder.SectionsForCatalogueChange(row.catalogue_fingerprint, next);
                catalogueChanged = changedSections.Count > 0;
                if (catalogueChanged && row.approved_version > 0 && row.status == OrganisationSalesProfileStatus.Approved)
                {
                    row.status = OrganisationSalesProfileStatus.RefreshRequired;
                    row.refresh_sections = changedSections;
                    await MarkRefreshRequired(orgId, changedSections);
                }
                else if (catalogueChanged && row.status == OrganisationSalesProfileStatus.RefreshRequired)
                {
                    row.refresh_sections = changedSections;
                    await MarkRefreshRequired(orgId, changedSections);
                }
            }

            var view = ToView(row, catalogueChanged);
            int displayVersion = DisplayVersion(row);
            view.display_version = displayVersion;
            if (displayVersion > 0)
            {
                var content = await SelectContent(orgId, displayVersion);
                view.knowledge = content.knowledge;
                view.lead_research = content.lead_research;
                view.strategy = content.strategy;
            }
            return view;
        }

        public async Task<OrganisationSalesProfileView> Generate(OrganisationSalesProfileSelectReq req)
        {
            long orgId = ResolveOrganisationId(req?.organisation_id);
            var existing = await SelectRow(orgId);
            var previousStatus = existing?.status ?? OrganisationSalesProfileStatus.NotGenerated;
            var approvedVersion = existing?.approved_version ?? 0;

            await SetStatus(orgId, OrganisationSalesProfileStatus.Generating, "");

            try
            {
                var overview = await catalogueService.GetOverview(new OrganisationCrmCatalogueSelectReq
                {
                    organisation_id = orgId,
                });
                var content = OrganisationSalesProfileBuilder.Build(overview);
                var fingerprint = OrganisationSalesProfileBuilder.Fingerprint(overview);

                using IDb db = await dbprovider.GetDb();
                await db.Connect();
                try
                {
                    await db.BeginTransaction();
                    await EnsureSchema(db);
                    int version = await NextVersion(db, orgId);
                    await InsertContent(db, orgId, version, content);
                    await UpdateDraft(db, orgId, version, fingerprint);
                    await db.CommitTransaction();
                }
                catch
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
            catch (Exception ex)
            {
                var restore = OrganisationSalesProfileBuilder.StatusAfterFailedGenerate(previousStatus, approvedVersion);
                await SetStatus(orgId, restore, ex.Message);
                throw;
            }

            return await Get(new OrganisationSalesProfileSelectReq { organisation_id = orgId });
        }

        public async Task<OrganisationSalesProfileView> Save(OrganisationSalesProfileSaveReq req)
        {
            long orgId = ResolveOrganisationId(req?.organisation_id);
            var content = Normalise(req);
            var row = await SelectRow(orgId);
            if (row == null || row.status == OrganisationSalesProfileStatus.NotGenerated)
            {
                throw new InvalidOperationException("Generate the sales profile before saving it.");
            }
            if (row.status == OrganisationSalesProfileStatus.Generating)
            {
                throw new InvalidOperationException("Wait until generation finishes, then save.");
            }

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            try
            {
                await db.BeginTransaction();
                await EnsureSchema(db);
                if (row.status == OrganisationSalesProfileStatus.PendingReview && row.draft_version > 0)
                {
                    await UpdateContent(db, orgId, row.draft_version, content);
                }
                else
                {
                    int version = await NextVersion(db, orgId);
                    await InsertContent(db, orgId, version, content);
                    await MarkDraft(db, orgId, version);
                }
                await db.CommitTransaction();
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }

            return await Get(new OrganisationSalesProfileSelectReq { organisation_id = orgId });
        }

        public async Task<OrganisationSalesProfileView> Approve(OrganisationSalesProfileSelectReq req)
        {
            long orgId = ResolveOrganisationId(req?.organisation_id);
            var overview = await catalogueService.GetOverview(new OrganisationCrmCatalogueSelectReq
            {
                organisation_id = orgId,
            });
            var fingerprint = OrganisationSalesProfileBuilder.Fingerprint(overview);
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchema(db);
            const string sql = @"
                UPDATE organisation_sales_profiles
                SET status = @status,
                    approved_version = draft_version,
                    approved_at = @now,
                    catalogue_fingerprint = @catalogue_fingerprint,
                    refresh_sections = '[]'::jsonb,
                    last_error = NULL,
                    updated_at = @now
                WHERE organisation_id = @organisation_id
                  AND status = @pending
                  AND draft_version > 0";
            DbCommand command = db.GetCommand(sql);
            var now = DateTime.UtcNow;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = OrganisationSalesProfileStatus.Approved;
            db.AddParameter(command, "pending", DbTypes.Types.String).Value = OrganisationSalesProfileStatus.PendingReview;
            db.AddParameter(command, "catalogue_fingerprint", DbTypes.Types.String).Value = fingerprint;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            int updated = await db.ExecuteNonQuery(command);
            if (updated == 0)
            {
                throw new InvalidOperationException("Approve the draft only while it is pending review.");
            }
            return await Get(new OrganisationSalesProfileSelectReq { organisation_id = orgId });
        }

        public async Task<OrganisationLeadFitList> ListLeadFit(OrganisationSalesProfileSelectReq req)
        {
            long orgId = ResolveOrganisationId(req?.organisation_id);
            var result = new OrganisationLeadFitList();
            var row = await SelectRow(orgId);
            var overview = await catalogueService.GetOverview(new OrganisationCrmCatalogueSelectReq
            {
                organisation_id = orgId,
            });
            if (overview == null) return result;

            OrganisationSalesProfileContent content;
            if (row == null || row.approved_version <= 0)
            {
                content = OrganisationSalesProfileBuilder.Build(overview);
            }
            else
            {
                content = await SelectContent(orgId, row.approved_version);
                content = WithCatalogueOffers(content, overview);
            }
            if ((content.knowledge?.priorities ?? new List<OrganisationSalesPriority>()).Count == 0)
            {
                return result;
            }
            var leads = await enquiryService.Select(new EnquirySelectReq
            {
                organisation_id = orgId,
            });
            result.profile_ready = true;
            var profileStatus = row?.status ?? "";
            result.scores = (leads ?? new List<Enquiry>())
                .Where(lead => lead != null && lead.organisation_id == orgId)
                .Select(lead =>
                {
                    var match = OrganisationSalesProfileBuilder.MatchLead(content, overview, lead, profileStatus, false);
                    return new OrganisationLeadFitScore
                    {
                        enquiry_id = lead.id,
                        fit_percent = match.fit_percent,
                        service_name = match.recommended_offer_name ?? "",
                        service_id = match.recommended_offer_id,
                    };
                })
                .ToList();
            return result;
        }

        public async Task<OrganisationLeadSalesAction> PrepareLeadAction(OrganisationLeadSalesActionReq req)
        {
            long orgId = ResolveOrganisationId(req?.organisation_id);
            if (req == null || req.enquiry_id <= 0)
            {
                throw new InvalidOperationException("Lead is required.");
            }

            var row = await SelectRow(orgId);
            var overview = await catalogueService.GetOverview(new OrganisationCrmCatalogueSelectReq
            {
                organisation_id = orgId,
            });
            if (overview == null)
            {
                throw new InvalidOperationException("Catalogue is required.");
            }

            var leads = await enquiryService.Select(new EnquirySelectReq
            {
                id = req.enquiry_id,
                organisation_id = orgId,
            });
            var enquiry = leads?.FirstOrDefault();
            if (enquiry == null || enquiry.organisation_id != orgId)
            {
                throw new UnauthorizedAccessException("That lead is not in this organisation.");
            }

            OrganisationSalesProfileContent content;
            string profileStatus;
            int profileVersion;
            bool changed;
            if (row == null || row.approved_version <= 0)
            {
                content = OrganisationSalesProfileBuilder.Build(overview);
                profileStatus = row?.status ?? OrganisationSalesProfileStatus.NotGenerated;
                profileVersion = 0;
                changed = false;
            }
            else
            {
                content = WithCatalogueOffers(await SelectContent(orgId, row.approved_version), overview);
                profileStatus = row.status;
                profileVersion = row.approved_version;
                var nextFingerprint = OrganisationSalesProfileBuilder.Fingerprint(overview);
                changed = OrganisationSalesProfileBuilder
                    .SectionsForCatalogueChange(row.catalogue_fingerprint, nextFingerprint)
                    .Count > 0
                    || row.status == OrganisationSalesProfileStatus.RefreshRequired;
            }

            var action = OrganisationSalesProfileBuilder.MatchLead(
                content,
                overview,
                enquiry,
                profileStatus,
                changed);
            action.profile_version = profileVersion;
            action.organisation_id = orgId;

            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            try
            {
                await db.BeginTransaction();
                await EnsureSchema(db);
                action.id = await InsertLeadAction(db, action);
                await db.CommitTransaction();
            }
            catch
            {
                await db.RollbackTransaction();
                throw;
            }

            return action;
        }

        static OrganisationSalesProfileContent WithCatalogueOffers(
            OrganisationSalesProfileContent content,
            OrganisationCrmCatalogueOverview overview)
        {
            content ??= OrganisationSalesProfileBuilder.Build(overview);
            content.knowledge ??= new OrganisationSalesKnowledge();
            if ((content.knowledge.priorities ?? new List<OrganisationSalesPriority>()).Count > 0)
            {
                return content;
            }
            content.knowledge.priorities = OrganisationSalesProfileBuilder.Build(overview).knowledge?.priorities
                ?? new List<OrganisationSalesPriority>();
            return content;
        }

        async Task<OrganisationCrmCatalogueOverview?> TryCatalogue(long orgId)
        {
            try
            {
                return await catalogueService.GetOverview(new OrganisationCrmCatalogueSelectReq
                {
                    organisation_id = orgId,
                });
            }
            catch
            {
                return null;
            }
        }

        async Task EnsureSchema(IDb db)
        {
            string[] statements =
            {
                @"CREATE TABLE IF NOT EXISTS organisation_sales_profiles (
                    organisation_id BIGINT PRIMARY KEY,
                    status VARCHAR(32) NOT NULL DEFAULT 'not_generated',
                    version INT NOT NULL DEFAULT 0,
                    approved_version INT NOT NULL DEFAULT 0,
                    draft_version INT NOT NULL DEFAULT 0,
                    catalogue_fingerprint TEXT NOT NULL DEFAULT '',
                    refresh_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
                    last_error TEXT NULL,
                    generated_at TIMESTAMP NULL,
                    approved_at TIMESTAMP NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
                )",
                @"CREATE TABLE IF NOT EXISTS organisation_sales_knowledge (
                    organisation_id BIGINT NOT NULL,
                    version INT NOT NULL,
                    content JSONB NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    PRIMARY KEY (organisation_id, version)
                )",
                @"CREATE TABLE IF NOT EXISTS organisation_lead_research_fields (
                    organisation_id BIGINT NOT NULL,
                    version INT NOT NULL,
                    content JSONB NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    PRIMARY KEY (organisation_id, version)
                )",
                @"CREATE TABLE IF NOT EXISTS organisation_ai_sales_strategies (
                    organisation_id BIGINT NOT NULL,
                    version INT NOT NULL,
                    content JSONB NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
                    PRIMARY KEY (organisation_id, version)
                )",
                @"CREATE TABLE IF NOT EXISTS organisation_lead_sales_actions (
                    id BIGSERIAL PRIMARY KEY,
                    organisation_id BIGINT NOT NULL,
                    enquiry_id BIGINT NOT NULL,
                    profile_version INT NOT NULL,
                    research JSONB NOT NULL,
                    offer_match JSONB NOT NULL,
                    next_action TEXT NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
                )",
                @"CREATE INDEX IF NOT EXISTS ix_lead_sales_actions_org_enquiry
                    ON organisation_lead_sales_actions (organisation_id, enquiry_id, created_at DESC)",
            };
            foreach (var statement in statements)
            {
                await db.ExecuteNonQuery(db.GetCommand(statement));
            }
        }

        async Task<ProfileRow?> SelectRow(long orgId)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchema(db);
            const string sql = @"
                SELECT organisation_id, status, version, approved_version, draft_version,
                       catalogue_fingerprint, refresh_sections, last_error, generated_at, approved_at
                FROM organisation_sales_profiles
                WHERE organisation_id = @organisation_id
                LIMIT 1";
            DbCommand command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync()) return null;
            return new ProfileRow
            {
                organisation_id = Convert.ToInt64(reader["organisation_id"]),
                status = reader["status"]?.ToString() ?? OrganisationSalesProfileStatus.NotGenerated,
                version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]),
                approved_version = reader["approved_version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["approved_version"]),
                draft_version = reader["draft_version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["draft_version"]),
                catalogue_fingerprint = reader["catalogue_fingerprint"]?.ToString() ?? "",
                refresh_sections = ReadStringList(reader["refresh_sections"]),
                last_error = reader["last_error"] == DBNull.Value ? "" : reader["last_error"]?.ToString() ?? "",
                generated_at = reader["generated_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["generated_at"]),
                approved_at = reader["approved_at"] == DBNull.Value ? null : Convert.ToDateTime(reader["approved_at"]),
            };
        }

        async Task SetStatus(long orgId, string status, string error)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            await EnsureSchema(db);
            const string sql = @"
                INSERT INTO organisation_sales_profiles (
                    organisation_id, status, last_error, created_at, updated_at
                ) VALUES (
                    @organisation_id, @status, @last_error, @now, @now
                )
                ON CONFLICT (organisation_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    last_error = EXCLUDED.last_error,
                    updated_at = EXCLUDED.updated_at";
            DbCommand command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = status;
            var errorParam = db.AddParameter(command, "last_error", DbTypes.Types.String);
            errorParam.Value = string.IsNullOrWhiteSpace(error) ? DBNull.Value : error;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        async Task MarkRefreshRequired(long orgId, List<string> sections)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            const string sql = @"
                UPDATE organisation_sales_profiles
                SET status = @status,
                    refresh_sections = @refresh_sections::jsonb,
                    updated_at = @now
                WHERE organisation_id = @organisation_id
                  AND approved_version > 0
                  AND status IN (@approved, @refresh)";
            DbCommand command = db.GetCommand(sql);
            db.AddParameter(command, "status", DbTypes.Types.String).Value = OrganisationSalesProfileStatus.RefreshRequired;
            db.AddParameter(command, "refresh_sections", DbTypes.Types.String).Value = JsonSerializer.Serialize(sections);
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "approved", DbTypes.Types.String).Value = OrganisationSalesProfileStatus.Approved;
            db.AddParameter(command, "refresh", DbTypes.Types.String).Value = OrganisationSalesProfileStatus.RefreshRequired;
            await db.ExecuteNonQuery(command);
        }

        async Task<int> NextVersion(IDb db, long orgId)
        {
            const string sql = @"
                SELECT GREATEST(
                    COALESCE((SELECT MAX(version) FROM organisation_sales_knowledge WHERE organisation_id = @organisation_id), 0),
                    COALESCE((SELECT MAX(version) FROM organisation_lead_research_fields WHERE organisation_id = @organisation_id), 0),
                    COALESCE((SELECT MAX(version) FROM organisation_ai_sales_strategies WHERE organisation_id = @organisation_id), 0)
                )";
            DbCommand command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            using DbDataReader reader = await db.Execute(command);
            int current = 0;
            if (await reader.ReadAsync() && reader[0] != DBNull.Value)
            {
                current = Convert.ToInt32(reader[0]);
            }
            return current + 1;
        }

        async Task InsertContent(IDb db, long orgId, int version, OrganisationSalesProfileContent content)
        {
            await InsertSection(db, "organisation_sales_knowledge", orgId, version, content.knowledge);
            await InsertSection(db, "organisation_lead_research_fields", orgId, version, content.lead_research);
            await InsertSection(db, "organisation_ai_sales_strategies", orgId, version, content.strategy);
        }

        async Task UpdateContent(IDb db, long orgId, int version, OrganisationSalesProfileContent content)
        {
            await UpdateSection(db, "organisation_sales_knowledge", orgId, version, content.knowledge);
            await UpdateSection(db, "organisation_lead_research_fields", orgId, version, content.lead_research);
            await UpdateSection(db, "organisation_ai_sales_strategies", orgId, version, content.strategy);
            const string touch = @"
                UPDATE organisation_sales_profiles
                SET updated_at = @now
                WHERE organisation_id = @organisation_id";
            DbCommand command = db.GetCommand(touch);
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            await db.ExecuteNonQuery(command);
        }

        async Task InsertSection(IDb db, string table, long orgId, int version, object content)
        {
            string sql = $@"
                INSERT INTO {table} (organisation_id, version, content, created_at)
                VALUES (@organisation_id, @version, @content::jsonb, @now)";
            DbCommand command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = version;
            db.AddParameter(command, "content", DbTypes.Types.String).Value = JsonSerializer.Serialize(content, JsonOpts);
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            await db.ExecuteNonQuery(command);
        }

        async Task UpdateSection(IDb db, string table, long orgId, int version, object content)
        {
            string sql = $@"
                UPDATE {table}
                SET content = @content::jsonb
                WHERE organisation_id = @organisation_id AND version = @version";
            DbCommand command = db.GetCommand(sql);
            db.AddParameter(command, "content", DbTypes.Types.String).Value = JsonSerializer.Serialize(content, JsonOpts);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = version;
            await db.ExecuteNonQuery(command);
        }

        async Task UpdateDraft(IDb db, long orgId, int version, string fingerprint)
        {
            const string sql = @"
                UPDATE organisation_sales_profiles
                SET status = @status,
                    version = @version,
                    draft_version = @version,
                    catalogue_fingerprint = CASE
                        WHEN approved_version > 0 THEN catalogue_fingerprint
                        ELSE @catalogue_fingerprint
                    END,
                    refresh_sections = '[]'::jsonb,
                    last_error = NULL,
                    generated_at = @now,
                    updated_at = @now
                WHERE organisation_id = @organisation_id";
            DbCommand command = db.GetCommand(sql);
            var now = DateTime.UtcNow;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = OrganisationSalesProfileStatus.PendingReview;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = version;
            db.AddParameter(command, "catalogue_fingerprint", DbTypes.Types.String).Value = fingerprint ?? "";
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = now;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            await db.ExecuteNonQuery(command);
        }

        async Task MarkDraft(IDb db, long orgId, int version)
        {
            const string sql = @"
                UPDATE organisation_sales_profiles
                SET status = @status,
                    version = @version,
                    draft_version = @version,
                    last_error = NULL,
                    updated_at = @now
                WHERE organisation_id = @organisation_id";
            DbCommand command = db.GetCommand(sql);
            db.AddParameter(command, "status", DbTypes.Types.String).Value = OrganisationSalesProfileStatus.PendingReview;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = version;
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            await db.ExecuteNonQuery(command);
        }

        async Task<OrganisationSalesProfileContent> SelectContent(long orgId, int version)
        {
            using IDb db = await dbprovider.GetDb();
            await db.Connect();
            return new OrganisationSalesProfileContent
            {
                knowledge = await SelectSection<OrganisationSalesKnowledge>(db, "organisation_sales_knowledge", orgId, version) ?? new OrganisationSalesKnowledge(),
                lead_research = await SelectSection<OrganisationLeadResearchConfig>(db, "organisation_lead_research_fields", orgId, version) ?? new OrganisationLeadResearchConfig(),
                strategy = await SelectSection<OrganisationAiSalesStrategy>(db, "organisation_ai_sales_strategies", orgId, version) ?? new OrganisationAiSalesStrategy(),
            };
        }

        async Task<T?> SelectSection<T>(IDb db, string table, long orgId, int version) where T : class
        {
            string sql = $@"
                SELECT content
                FROM {table}
                WHERE organisation_id = @organisation_id AND version = @version
                LIMIT 1";
            DbCommand command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = orgId;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = version;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync() || reader["content"] == DBNull.Value) return null;
            var json = reader["content"]?.ToString() ?? "";
            if (string.IsNullOrWhiteSpace(json)) return null;
            return JsonSerializer.Deserialize<T>(json, JsonOpts);
        }

        async Task<long> InsertLeadAction(IDb db, OrganisationLeadSalesAction action)
        {
            const string sql = @"
                INSERT INTO organisation_lead_sales_actions (
                    organisation_id, enquiry_id, profile_version, research, offer_match, next_action, created_at
                ) VALUES (
                    @organisation_id, @enquiry_id, @profile_version, @research::jsonb, @offer_match::jsonb, @next_action, @now
                )
                RETURNING id";
            DbCommand command = db.GetCommand(sql);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = action.organisation_id;
            db.AddParameter(command, "enquiry_id", DbTypes.Types.Long).Value = action.enquiry_id;
            db.AddParameter(command, "profile_version", DbTypes.Types.Integer).Value = action.profile_version;
            db.AddParameter(command, "research", DbTypes.Types.String).Value = JsonSerializer.Serialize(action.research ?? new List<OrganisationLeadResearchAnswer>(), JsonOpts);
            db.AddParameter(command, "offer_match", DbTypes.Types.String).Value = JsonSerializer.Serialize(action.offer_matches ?? new List<OrganisationOfferMatch>(), JsonOpts);
            db.AddParameter(command, "next_action", DbTypes.Types.String).Value = action.next_action ?? "";
            db.AddParameter(command, "now", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            using DbDataReader reader = await db.Execute(command);
            if (!await reader.ReadAsync())
            {
                throw new InvalidOperationException("Could not store the lead sales action.");
            }
            return Convert.ToInt64(reader[0]);
        }

        static OrganisationSalesProfileContent Normalise(OrganisationSalesProfileSaveReq? req)
        {
            var knowledge = req?.knowledge ?? new OrganisationSalesKnowledge();
            var research = req?.lead_research ?? new OrganisationLeadResearchConfig();
            var strategy = req?.strategy ?? new OrganisationAiSalesStrategy();
            knowledge.ideal_customers = CleanLines(knowledge.ideal_customers);
            knowledge.value_proposition = (knowledge.value_proposition ?? "").Trim();
            knowledge.differentiators = CleanLines(knowledge.differentiators);
            knowledge.proof = CleanLines(knowledge.proof);
            knowledge.approved_claims = CleanLines(knowledge.approved_claims);
            knowledge.discount_limit = (knowledge.discount_limit ?? "").Trim();
            knowledge.do_not_promise = CleanLines(knowledge.do_not_promise);
            knowledge.priorities = (knowledge.priorities ?? new List<OrganisationSalesPriority>())
                .Where(p => p != null && p.offer_id > 0 && !string.IsNullOrWhiteSpace(p.kind))
                .Select(p => new OrganisationSalesPriority
                {
                    kind = p.kind.Trim().ToLowerInvariant(),
                    offer_id = p.offer_id,
                    name = (p.name ?? "").Trim(),
                    problem_solved = (p.problem_solved ?? "").Trim(),
                })
                .ToList();

            research.fields = (research.fields ?? new List<OrganisationLeadResearchField>())
                .Where(f => f != null && !string.IsNullOrWhiteSpace(f.label))
                .Select(f =>
                {
                    var label = f.label.Trim();
                    var key = string.IsNullOrWhiteSpace(f.key) ? Slug(label) : Slug(f.key);
                    return new OrganisationLeadResearchField
                    {
                        key = key,
                        label = label,
                        field_type = string.IsNullOrWhiteSpace(f.field_type) ? "string" : f.field_type.Trim().ToLowerInvariant(),
                        instructions = (f.instructions ?? "").Trim(),
                    };
                })
                .Where(f => f.key.Length > 0)
                .ToList();

            strategy.qualification_rules = CleanLines(strategy.qualification_rules);
            strategy.objections = CleanLines(strategy.objections);
            strategy.discovery_questions = CleanLines(strategy.discovery_questions);
            strategy.tone = (strategy.tone ?? "").Trim();
            strategy.channel = (strategy.channel ?? "").Trim();
            strategy.follow_up = (strategy.follow_up ?? "").Trim();
            strategy.opt_out = (strategy.opt_out ?? "").Trim();
            strategy.escalation = (strategy.escalation ?? "").Trim();
            strategy.offer_matching = (strategy.offer_matching ?? new List<OrganisationOfferRule>())
                .Where(r => r != null && r.offer_id > 0 && !string.IsNullOrWhiteSpace(r.kind))
                .Select(r => new OrganisationOfferRule
                {
                    kind = r.kind.Trim().ToLowerInvariant(),
                    offer_id = r.offer_id,
                    name = (r.name ?? "").Trim(),
                    when = (r.when ?? "").Trim(),
                })
                .ToList();

            return new OrganisationSalesProfileContent
            {
                knowledge = knowledge,
                lead_research = research,
                strategy = strategy,
            };
        }

        static List<string> CleanLines(List<string>? lines)
        {
            return (lines ?? new List<string>())
                .Where(line => !string.IsNullOrWhiteSpace(line))
                .Select(line => line.Trim())
                .ToList();
        }

        static string Slug(string text)
        {
            var chars = (text ?? "").Trim().ToLowerInvariant().Select(ch => char.IsLetterOrDigit(ch) ? ch : '_').ToArray();
            var slug = new string(chars).Trim('_');
            while (slug.Contains("__", StringComparison.Ordinal)) slug = slug.Replace("__", "_", StringComparison.Ordinal);
            return slug.Length <= 64 ? slug : slug.Substring(0, 64);
        }

        static int DisplayVersion(ProfileRow row)
        {
            if (row.status == OrganisationSalesProfileStatus.PendingReview && row.draft_version > 0)
            {
                return row.draft_version;
            }
            if (row.approved_version > 0) return row.approved_version;
            if (row.draft_version > 0) return row.draft_version;
            return 0;
        }

        static OrganisationSalesProfileView ToView(ProfileRow row, bool catalogueChanged)
        {
            return new OrganisationSalesProfileView
            {
                organisation_id = row.organisation_id,
                status = row.status,
                version = row.version,
                approved_version = row.approved_version,
                draft_version = row.draft_version,
                refresh_sections = row.refresh_sections,
                last_error = row.last_error,
                generated_at = row.generated_at,
                approved_at = row.approved_at,
                catalogue_changed = catalogueChanged,
                approved_available = row.approved_version > 0,
            };
        }

        static OrganisationSalesProfileView EmptyView(long orgId)
        {
            return new OrganisationSalesProfileView
            {
                organisation_id = orgId,
                status = OrganisationSalesProfileStatus.NotGenerated,
            };
        }

        static List<string> ReadStringList(object value)
        {
            if (value == null || value == DBNull.Value) return new List<string>();
            var json = value.ToString() ?? "[]";
            try
            {
                return JsonSerializer.Deserialize<List<string>>(json, JsonOpts) ?? new List<string>();
            }
            catch (JsonException)
            {
                return new List<string>();
            }
        }

        long ResolveOrganisationId(long? requested)
        {
            long jwtOrg = 0;
            try
            {
                var ctx = requeststate.usercontext;
                if (ctx != null && ctx.organisationid > 0)
                {
                    jwtOrg = ctx.organisationid;
                }
            }
            catch
            {
                // Request state is absent outside an authenticated call.
            }

            if (jwtOrg <= 0)
            {
                throw new Exception("Organisation is required.");
            }

            if (requested.HasValue && requested.Value > 0 && requested.Value != jwtOrg)
            {
                throw new UnauthorizedAccessException("Cross-organisation access is not allowed.");
            }

            return jwtOrg;
        }

        sealed class ProfileRow
        {
            public long organisation_id { get; set; }
            public string status { get; set; } = OrganisationSalesProfileStatus.NotGenerated;
            public int version { get; set; }
            public int approved_version { get; set; }
            public int draft_version { get; set; }
            public string catalogue_fingerprint { get; set; } = "";
            public List<string> refresh_sections { get; set; } = new();
            public string last_error { get; set; } = "";
            public DateTime? generated_at { get; set; }
            public DateTime? approved_at { get; set; }
        }
    }
}
