import { ActionReq } from "../models/actionreq.model";
import { ActionRes } from "../models/actionres.model";
import {
  ClientLoyaltyWallet,
  LoyaltyDashboard,
  LoyaltyPointTransaction,
  LoyaltyRewardGrant,
  LoyaltyRule,
  LoyaltyScheme,
  LoyaltyTier,
  OrganisationLoyaltySettings,
} from "../models/loyalty.model";
import { AxiosHelperUtils } from "../utils/axioshelper.utils";
import { getApiErrorMessage } from "../utils/apiError.util";
import { environment } from "../utils/environment";

export class LoyaltyService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get base(): string {
    return `${environment.baseurl}/api/OrganisationLoyalty`;
  }

  async getDashboard(organisationId: number) {
    const postdata = new ActionReq<{ organisation_id: number }>();
    postdata.item = { organisation_id: organisationId };
    const resp = await this.http.post<ActionRes<LoyaltyDashboard>>(`${this.base}/GetDashboard`, postdata);
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? new LoyaltyDashboard();
  }

  async getSettings(organisationId: number) {
    const postdata = new ActionReq<{ organisation_id: number }>();
    postdata.item = { organisation_id: organisationId };
    const resp = await this.http.post<ActionRes<OrganisationLoyaltySettings>>(
      `${this.base}/GetSettings`,
      postdata,
    );
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? new OrganisationLoyaltySettings();
  }

  async saveSettings(settings: OrganisationLoyaltySettings) {
    const postdata = new ActionReq<OrganisationLoyaltySettings>();
    postdata.item = settings;
    const resp = await this.http.post<ActionRes<OrganisationLoyaltySettings>>(
      `${this.base}/SaveSettings`,
      postdata,
    );
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? settings;
  }

  async selectSchemes(organisationId: number, id = 0) {
    const postdata = new ActionReq<{ organisation_id: number; id: number }>();
    postdata.item = { organisation_id: organisationId, id };
    const resp = await this.http.post<ActionRes<LoyaltyScheme[]>>(`${this.base}/SelectSchemes`, postdata);
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? [];
  }

  async saveScheme(scheme: LoyaltyScheme) {
    const postdata = new ActionReq<LoyaltyScheme>();
    postdata.item = scheme;
    const resp = await this.http.post<ActionRes<LoyaltyScheme>>(`${this.base}/SaveScheme`, postdata);
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? scheme;
  }

  async deleteScheme(organisationId: number, id: number) {
    const postdata = new ActionReq<{ organisation_id: number; id: number }>();
    postdata.item = { organisation_id: organisationId, id };
    const resp = await this.http.post<ActionRes<unknown>>(`${this.base}/DeleteScheme`, postdata);
    if (resp.error) throw new Error(resp.error);
  }

  async saveRule(rule: LoyaltyRule) {
    const postdata = new ActionReq<LoyaltyRule>();
    postdata.item = rule;
    const resp = await this.http.post<ActionRes<LoyaltyRule>>(`${this.base}/SaveRule`, postdata);
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? rule;
  }

  async deleteRule(organisationId: number, id: number) {
    const postdata = new ActionReq<{ organisation_id: number; id: number }>();
    postdata.item = { organisation_id: organisationId, id };
    const resp = await this.http.post<ActionRes<unknown>>(`${this.base}/DeleteRule`, postdata);
    if (resp.error) throw new Error(resp.error);
  }

  async selectTiers(organisationId: number) {
    const postdata = new ActionReq<{ organisation_id: number }>();
    postdata.item = { organisation_id: organisationId };
    const resp = await this.http.post<ActionRes<LoyaltyTier[]>>(`${this.base}/SelectTiers`, postdata);
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? [];
  }

  async saveTier(tier: LoyaltyTier) {
    const postdata = new ActionReq<LoyaltyTier>();
    postdata.item = tier;
    const resp = await this.http.post<ActionRes<LoyaltyTier>>(`${this.base}/SaveTier`, postdata);
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? tier;
  }

  async deleteTier(organisationId: number, id: number) {
    const postdata = new ActionReq<{ organisation_id: number; id: number }>();
    postdata.item = { organisation_id: organisationId, id };
    const resp = await this.http.post<ActionRes<unknown>>(`${this.base}/DeleteTier`, postdata);
    if (resp.error) throw new Error(resp.error);
  }

  async selectCustomerWallets(
    organisationId: number,
    search = "",
    limit = 100,
    clientUserId = 0,
  ) {
    const postdata = new ActionReq<{ organisation_id: number; search?: string; client_user_id: number; limit: number }>();
    postdata.item = {
      organisation_id: organisationId,
      search: search || undefined,
      client_user_id: clientUserId,
      limit,
    };
    const resp = await this.http.post<ActionRes<ClientLoyaltyWallet[]>>(
      `${this.base}/SelectCustomerWallets`,
      postdata,
    );
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? [];
  }

  async selectTransactions(organisationId: number, clientUserId: number) {
    const postdata = new ActionReq<{ organisation_id: number; client_user_id: number; limit: number }>();
    postdata.item = { organisation_id: organisationId, client_user_id: clientUserId, limit: 100 };
    const resp = await this.http.post<ActionRes<LoyaltyPointTransaction[]>>(
      `${this.base}/SelectTransactions`,
      postdata,
    );
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? [];
  }

  async selectRewardGrants(organisationId: number, clientUserId: number) {
    const postdata = new ActionReq<{ organisation_id: number; client_user_id: number }>();
    postdata.item = { organisation_id: organisationId, client_user_id: clientUserId };
    const resp = await this.http.post<ActionRes<LoyaltyRewardGrant[]>>(
      `${this.base}/SelectRewardGrants`,
      postdata,
    );
    if (resp.error) throw new Error(resp.error);
    return resp.item ?? [];
  }

  async seedSampleProgram(organisationId: number) {
    const postdata = new ActionReq<{ organisation_id: number }>();
    postdata.item = { organisation_id: organisationId };
    const resp = await this.http.post<ActionRes<unknown>>(`${this.base}/SeedSampleProgram`, postdata);
    if (resp.error) throw new Error(getApiErrorMessage(resp.error, "Could not seed sample program."));
  }
}

export const loyaltyService = new LoyaltyService();
