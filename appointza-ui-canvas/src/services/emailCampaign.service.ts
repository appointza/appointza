import { ActionRes } from "@/models/actionres.model";
import type {
  EmailCampaignDto,
  EmailCampaignRecipientDto,
  EmailCampaignUpsertReq,
  EmailInboxSyncResult,
  EmailMessageDto,
  EmailSendResult,
} from "@/models/emailCampaign.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";

export class EmailCampaignService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/crm/email/campaigns";
  }

  async select(params?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<EmailCampaignDto[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.offset) qs.set("offset", String(params.offset));
    const query = qs.toString();
    const resp = await this.http.get<ActionRes<EmailCampaignDto[]>>(
      `${this.baseurl}${query ? `?${query}` : ""}`,
    );
    return resp.item ?? [];
  }

  async create(body: EmailCampaignUpsertReq): Promise<EmailCampaignDto> {
    const resp = await this.http.post<ActionRes<EmailCampaignDto>>(this.baseurl, body);
    if (!resp.item) throw new Error("Failed to create campaign.");
    return resp.item;
  }

  async send(id: number): Promise<EmailSendResult> {
    const resp = await this.http.post<ActionRes<EmailSendResult>>(
      `${this.baseurl}/${id}/send`,
      {},
    );
    if (!resp.item) throw new Error("Send failed.");
    return resp.item;
  }

  async testSend(body: {
    to_email: string;
    subject?: string;
    body_text?: string;
  }): Promise<EmailSendResult> {
    const resp = await this.http.post<ActionRes<EmailSendResult>>(
      `${this.baseurl}/test-send`,
      body,
    );
    if (!resp.item) throw new Error("Test send failed.");
    return resp.item;
  }

  async recipients(id: number): Promise<EmailCampaignRecipientDto[]> {
    const resp = await this.http.get<ActionRes<EmailCampaignRecipientDto[]>>(
      `${this.baseurl}/${id}/recipients`,
    );
    return resp.item ?? [];
  }

  async syncInbox(limit = 40): Promise<EmailInboxSyncResult> {
    const resp = await this.http.post<ActionRes<EmailInboxSyncResult>>(
      `${this.baseurl}/inbox/sync?limit=${limit}`,
      {},
    );
    if (!resp.item) throw new Error("Inbox sync failed.");
    return resp.item;
  }

  async listInbox(limit = 50): Promise<EmailMessageDto[]> {
    const resp = await this.http.get<ActionRes<EmailMessageDto[]>>(
      `${this.baseurl}/inbox?limit=${limit}`,
    );
    return resp.item ?? [];
  }
}
