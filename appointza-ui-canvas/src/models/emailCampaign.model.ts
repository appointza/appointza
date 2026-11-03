export interface EmailCampaignDto {
  id: number;
  organisation_id: number;
  integration_id?: number | null;
  name: string;
  subject: string;
  body_text: string;
  body_html: string;
  status: string;
  audience_mode: string;
  selected_count: number;
  sent_count: number;
  failed_count: number;
  last_error: string;
  version: number;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
  sent_at?: string | null;
}

export interface EmailCampaignRecipientDto {
  id: number;
  campaign_id: number;
  enquiry_id?: number | null;
  display_name: string;
  email_address: string;
  delivery_status: string;
  error_message: string;
  sent_at?: string | null;
}

export interface EmailMessageDto {
  id: number;
  organisation_id: number;
  integration_id?: number | null;
  direction: string;
  provider_message_id: string;
  from_address: string;
  to_address: string;
  subject: string;
  body_preview: string;
  body_text: string;
  received_at?: string | null;
  created_at: string;
}

export interface EmailCampaignUpsertReq {
  name?: string;
  subject: string;
  body_text: string;
  body_html?: string;
  audience_mode?: string;
  manual_emails?: string[];
}

export interface EmailSendResult {
  success: boolean;
  message: string;
  sent_count: number;
  failed_count: number;
  campaign?: EmailCampaignDto | null;
}

export interface EmailInboxSyncResult {
  fetched: number;
  inserted: number;
  message: string;
}
