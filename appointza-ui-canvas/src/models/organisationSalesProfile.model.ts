export interface OrganisationSalesPriority {
  kind: string;
  offer_id: number;
  name: string;
  problem_solved: string;
}

export interface OrganisationSalesKnowledge {
  ideal_customers: string[];
  value_proposition: string;
  differentiators: string[];
  proof: string[];
  priorities: OrganisationSalesPriority[];
  approved_claims: string[];
  discount_limit: string;
  do_not_promise: string[];
}

export interface OrganisationLeadResearchField {
  key: string;
  label: string;
  field_type: string;
  instructions: string;
}

export interface OrganisationLeadResearchConfig {
  fields: OrganisationLeadResearchField[];
}

export interface OrganisationOfferRule {
  kind: string;
  offer_id: number;
  name: string;
  when: string;
}

export interface OrganisationAiSalesStrategy {
  qualification_rules: string[];
  offer_matching: OrganisationOfferRule[];
  objections: string[];
  discovery_questions: string[];
  tone: string;
  channel: string;
  follow_up: string;
  opt_out: string;
  escalation: string;
}

export interface OrganisationSalesProfileView {
  organisation_id: number;
  status: string;
  version: number;
  approved_version: number;
  draft_version: number;
  display_version: number;
  refresh_sections: string[];
  last_error: string;
  generated_at?: string | null;
  approved_at?: string | null;
  catalogue_changed: boolean;
  approved_available: boolean;
  knowledge: OrganisationSalesKnowledge;
  lead_research: OrganisationLeadResearchConfig;
  strategy: OrganisationAiSalesStrategy;
}

export interface OrganisationSalesProfileSaveReq {
  organisation_id?: number;
  knowledge: OrganisationSalesKnowledge;
  lead_research: OrganisationLeadResearchConfig;
  strategy: OrganisationAiSalesStrategy;
}

export interface OrganisationLeadResearchAnswer {
  key: string;
  label: string;
  instructions: string;
  value: string;
  missing: boolean;
}

export interface OrganisationOfferMatch {
  kind: string;
  offer_id: number;
  name: string;
  available: boolean;
  live_check: string;
}

export interface OrganisationLeadSalesAction {
  id: number;
  organisation_id: number;
  enquiry_id: number;
  profile_version: number;
  profile_status: string;
  catalogue_changed: boolean;
  research: OrganisationLeadResearchAnswer[];
  offer_matches: OrganisationOfferMatch[];
  recommended_offer_name: string;
  recommended_offer_id: number;
  recommended_offer_kind: string;
  fit_percent: number;
  next_action: string;
}

export interface OrganisationLeadFitScore {
  enquiry_id: number;
  fit_percent: number;
  service_name: string;
  service_id: number;
}

export interface OrganisationLeadFitList {
  profile_ready: boolean;
  scores: OrganisationLeadFitScore[];
}
