using System;
using System.Collections.Generic;

namespace appointza.Models
{
    public static class OrganisationSalesProfileStatus
    {
        public const string NotGenerated = "not_generated";
        public const string Generating = "generating";
        public const string PendingReview = "pending_review";
        public const string Approved = "approved";
        public const string RefreshRequired = "refresh_required";
    }

    public static class OrganisationSalesProfileSection
    {
        public const string SalesKnowledge = "sales_knowledge";
        public const string LeadResearch = "lead_research";
        public const string AiSalesStrategy = "ai_sales_strategy";
    }

    public class OrganisationSalesProfileSelectReq
    {
        public long organisation_id { get; set; }
    }

    public class OrganisationSalesPriority
    {
        public string kind { get; set; } = "";
        public long offer_id { get; set; }
        public string name { get; set; } = "";
        public string problem_solved { get; set; } = "";
    }

    public class OrganisationSalesKnowledge
    {
        public List<string> ideal_customers { get; set; } = new();
        public string value_proposition { get; set; } = "";
        public List<string> differentiators { get; set; } = new();
        public List<string> proof { get; set; } = new();
        public List<OrganisationSalesPriority> priorities { get; set; } = new();
        public List<string> approved_claims { get; set; } = new();
        public string discount_limit { get; set; } = "";
        public List<string> do_not_promise { get; set; } = new();
    }

    public class OrganisationLeadResearchField
    {
        public string key { get; set; } = "";
        public string label { get; set; } = "";
        public string field_type { get; set; } = "string";
        public string instructions { get; set; } = "";
    }

    public class OrganisationLeadResearchConfig
    {
        public List<OrganisationLeadResearchField> fields { get; set; } = new();
    }

    public class OrganisationOfferRule
    {
        public string kind { get; set; } = "";
        public long offer_id { get; set; }
        public string name { get; set; } = "";
        public string when { get; set; } = "";
    }

    public class OrganisationAiSalesStrategy
    {
        public List<string> qualification_rules { get; set; } = new();
        public List<OrganisationOfferRule> offer_matching { get; set; } = new();
        public List<string> objections { get; set; } = new();
        public List<string> discovery_questions { get; set; } = new();
        public string tone { get; set; } = "";
        public string channel { get; set; } = "";
        public string follow_up { get; set; } = "";
        public string opt_out { get; set; } = "";
        public string escalation { get; set; } = "";
    }

    public class OrganisationSalesProfileContent
    {
        public OrganisationSalesKnowledge knowledge { get; set; } = new();
        public OrganisationLeadResearchConfig lead_research { get; set; } = new();
        public OrganisationAiSalesStrategy strategy { get; set; } = new();
    }

    public class OrganisationSalesProfileSaveReq
    {
        public long organisation_id { get; set; }
        public OrganisationSalesKnowledge knowledge { get; set; } = new();
        public OrganisationLeadResearchConfig lead_research { get; set; } = new();
        public OrganisationAiSalesStrategy strategy { get; set; } = new();
    }

    public class OrganisationSalesProfileView
    {
        public long organisation_id { get; set; }
        public string status { get; set; } = OrganisationSalesProfileStatus.NotGenerated;
        public int version { get; set; }
        public int approved_version { get; set; }
        public int draft_version { get; set; }
        public int display_version { get; set; }
        public List<string> refresh_sections { get; set; } = new();
        public string last_error { get; set; } = "";
        public DateTime? generated_at { get; set; }
        public DateTime? approved_at { get; set; }
        public bool catalogue_changed { get; set; }
        public bool approved_available { get; set; }
        public OrganisationSalesKnowledge knowledge { get; set; } = new();
        public OrganisationLeadResearchConfig lead_research { get; set; } = new();
        public OrganisationAiSalesStrategy strategy { get; set; } = new();
    }

    public class OrganisationLeadSalesActionReq
    {
        public long organisation_id { get; set; }
        public long enquiry_id { get; set; }
    }

    public class OrganisationLeadResearchAnswer
    {
        public string key { get; set; } = "";
        public string label { get; set; } = "";
        public string instructions { get; set; } = "";
        public string value { get; set; } = "";
        public bool missing { get; set; }
    }

    public class OrganisationOfferMatch
    {
        public string kind { get; set; } = "";
        public long offer_id { get; set; }
        public string name { get; set; } = "";
        public bool available { get; set; }
        public string live_check { get; set; } = "";
    }

    public class OrganisationLeadSalesAction
    {
        public long id { get; set; }
        public long organisation_id { get; set; }
        public long enquiry_id { get; set; }
        public int profile_version { get; set; }
        public string profile_status { get; set; } = "";
        public bool catalogue_changed { get; set; }
        public List<OrganisationLeadResearchAnswer> research { get; set; } = new();
        public List<OrganisationOfferMatch> offer_matches { get; set; } = new();
        public string recommended_offer_name { get; set; } = "";
        public long recommended_offer_id { get; set; }
        public string recommended_offer_kind { get; set; } = "";
        public int fit_percent { get; set; }
        public string next_action { get; set; } = "";
    }

    public class OrganisationLeadFitScore
    {
        public long enquiry_id { get; set; }
        public int fit_percent { get; set; }
        public string service_name { get; set; } = "";
        public long service_id { get; set; }
    }

    public class OrganisationLeadFitList
    {
        public bool profile_ready { get; set; }
        public List<OrganisationLeadFitScore> scores { get; set; } = new();
    }
}
