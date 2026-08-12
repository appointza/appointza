import axios from "axios";
import { ActionReq } from "@/models/actionreq.model";
import { ActionRes } from "@/models/actionres.model";
import {
  OrganisationMonthlyBookingStatsReq,
  OrganisationMonthlyBookingStatsRes,
  OrganisationSubscriptionChangePlanReq,
  OrganisationSubscriptionSelectReq,
  OrganisationSubscriptionStatusRes,
  PlatformTopUpDueRes,
  PlatformTopUpOrderRes,
  PlatformTopUpVerifyReq,
  SubscriptionPlan,
  SubscriptionPlanSelectReq,
  CreditWalletBillingModeReq,
  CreditWalletRechargeReq,
  CreditWalletRechargeOrderRes,
  CreditWalletRechargeVerifyReq,
  CreditWalletStatusRes,
} from "@/models/subscription.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";

function unwrapActionRes<T>(resp: ActionRes<T>, label: string): T {
  if (resp?.error) {
    throw new Error(resp.error);
  }
  if (resp?.item == null) {
    throw new Error(`${label} returned no data`);
  }
  return resp.item;
}

export function getSubscriptionApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 405) {
      return "This billing feature is not available on the server yet. Deploy the latest appointza backend (Credit Wallet API) or use a local API on port 5117.";
    }
    const data = error.response?.data as ActionRes<unknown> | undefined;
    if (data?.error) {
      return data.error;
    }
    if (typeof error.response?.data === "string") {
      return error.response.data;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Please try again.";
}

export class SubscriptionService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/Subscription";
  }

  async selectPlans(projectName?: string): Promise<SubscriptionPlan[]> {
    const postdata = new ActionReq<SubscriptionPlanSelectReq>();
    if (projectName?.trim()) {
      postdata.item = new SubscriptionPlanSelectReq();
      postdata.item.project_name = projectName.trim();
    }
    const resp = await this.http.post<ActionRes<SubscriptionPlan[]>>(
      this.baseurl + "/SelectPlans",
      postdata,
    );
    return unwrapActionRes(resp, "SelectPlans");
  }

  async getStatus(organisationId?: number): Promise<OrganisationSubscriptionStatusRes> {
    const req = new OrganisationSubscriptionSelectReq();
    if (organisationId && organisationId > 0) {
      req.organisation_id = organisationId;
    }
    const postdata = new ActionReq<OrganisationSubscriptionSelectReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<OrganisationSubscriptionStatusRes>>(
      this.baseurl + "/GetStatus",
      postdata,
    );
    return unwrapActionRes(resp, "GetStatus");
  }

  async changePlan(planCode: string, organisationId?: number): Promise<OrganisationSubscriptionStatusRes> {
    const req = new OrganisationSubscriptionChangePlanReq();
    req.plan_code = planCode.trim().toLowerCase();
    if (organisationId && organisationId > 0) {
      req.organisation_id = organisationId;
    }
    const postdata = new ActionReq<OrganisationSubscriptionChangePlanReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<OrganisationSubscriptionStatusRes>>(
      this.baseurl + "/ChangePlan",
      postdata,
    );
    return unwrapActionRes(resp, "ChangePlan");
  }

  async getOutstanding(organisationId?: number): Promise<PlatformTopUpDueRes> {
    const req = new OrganisationSubscriptionSelectReq();
    if (organisationId && organisationId > 0) {
      req.organisation_id = organisationId;
    }
    const postdata = new ActionReq<OrganisationSubscriptionSelectReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<PlatformTopUpDueRes>>(
      this.baseurl + "/GetOutstanding",
      postdata,
    );
    return unwrapActionRes(resp, "GetOutstanding");
  }

  async createTopUpOrder(organisationId?: number): Promise<PlatformTopUpOrderRes> {
    const req = new OrganisationSubscriptionSelectReq();
    if (organisationId && organisationId > 0) {
      req.organisation_id = organisationId;
    }
    const postdata = new ActionReq<OrganisationSubscriptionSelectReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<PlatformTopUpOrderRes>>(
      this.baseurl + "/CreateTopUpOrder",
      postdata,
    );
    return unwrapActionRes(resp, "CreateTopUpOrder");
  }

  async verifyTopUp(payload: PlatformTopUpVerifyReq): Promise<PlatformTopUpDueRes> {
    const postdata = new ActionReq<PlatformTopUpVerifyReq>();
    postdata.item = payload;
    const resp = await this.http.post<ActionRes<PlatformTopUpDueRes>>(
      this.baseurl + "/VerifyTopUp",
      postdata,
    );
    return unwrapActionRes(resp, "VerifyTopUp");
  }

  async getMonthlyBookingStats(
    organisationId?: number,
    months = 12,
  ): Promise<OrganisationMonthlyBookingStatsRes> {
    const req = new OrganisationMonthlyBookingStatsReq();
    req.months = months;
    if (organisationId && organisationId > 0) {
      req.organisation_id = organisationId;
    }
    const postdata = new ActionReq<OrganisationMonthlyBookingStatsReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<OrganisationMonthlyBookingStatsRes>>(
      this.baseurl + "/GetMonthlyBookingStats",
      postdata,
    );
    return unwrapActionRes(resp, "GetMonthlyBookingStats");
  }

  async getWalletStatus(organisationId?: number): Promise<CreditWalletStatusRes> {
    const req = new OrganisationSubscriptionSelectReq();
    if (organisationId && organisationId > 0) {
      req.organisation_id = organisationId;
    }
    const postdata = new ActionReq<OrganisationSubscriptionSelectReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<CreditWalletStatusRes>>(
      this.baseurl + "/GetWalletStatus",
      postdata,
    );
    return unwrapActionRes(resp, "GetWalletStatus");
  }

  async setBillingMode(
    mode: "subscription" | "credit_wallet",
    organisationId?: number,
  ): Promise<CreditWalletStatusRes> {
    const req = new CreditWalletBillingModeReq();
    req.mode = mode;
    if (organisationId && organisationId > 0) {
      req.organisation_id = organisationId;
    }
    const postdata = new ActionReq<CreditWalletBillingModeReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<CreditWalletStatusRes>>(
      this.baseurl + "/SetBillingMode",
      postdata,
    );
    return unwrapActionRes(resp, "SetBillingMode");
  }

  async rechargeWallet(packId: string, organisationId?: number): Promise<CreditWalletStatusRes> {
    const req = new CreditWalletRechargeReq();
    req.pack_id = packId;
    if (organisationId && organisationId > 0) {
      req.organisation_id = organisationId;
    }
    const postdata = new ActionReq<CreditWalletRechargeReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<CreditWalletStatusRes>>(
      this.baseurl + "/RechargeWallet",
      postdata,
    );
    return unwrapActionRes(resp, "RechargeWallet");
  }

  async createWalletRechargeOrder(
    packId: string,
    organisationId?: number,
  ): Promise<CreditWalletRechargeOrderRes> {
    const req = new CreditWalletRechargeReq();
    req.pack_id = packId;
    if (organisationId && organisationId > 0) {
      req.organisation_id = organisationId;
    }
    const postdata = new ActionReq<CreditWalletRechargeReq>();
    postdata.item = req;
    const resp = await this.http.post<ActionRes<CreditWalletRechargeOrderRes>>(
      this.baseurl + "/CreateWalletRechargeOrder",
      postdata,
    );
    return unwrapActionRes(resp, "CreateWalletRechargeOrder");
  }

  async verifyWalletRecharge(payload: CreditWalletRechargeVerifyReq): Promise<CreditWalletStatusRes> {
    const postdata = new ActionReq<CreditWalletRechargeVerifyReq>();
    postdata.item = payload;
    const resp = await this.http.post<ActionRes<CreditWalletStatusRes>>(
      this.baseurl + "/VerifyWalletRecharge",
      postdata,
    );
    return unwrapActionRes(resp, "VerifyWalletRecharge");
  }
}
