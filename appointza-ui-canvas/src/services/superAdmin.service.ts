import axios from "axios";
import type {
  ReportDefinitionDto,
  ReportDefinitionUpsertReq,
  ReportExecutionResult,
  ReportListItemDto,
  ReportValidateResult,
} from "@/models/dynamicReport.model";
import { environment } from "@/utils/environment";
import { getAuthHeaders } from "@/utils/authSession.util";

/**
 * Super admin console API client (users.isfactory = true).
 *
 * Uses plain axios on purpose: the shared AxiosHelperUtils treats any 401/403 as "session expired" and logs
 * the user out. A 403 here only means "not a super admin", which must not end the session.
 * Every endpoint is enforced server-side; the UI gating is only for display.
 */

export type SuperAdminOrganisation = {
  id: number;
  name: string;
  gstnumber: string;
  primarytypecode: string;
  secondarytypecode: string;
  tagline: string;
  isactive: boolean;
  issuspended: boolean;
  createdon: string;
  locationcount: number;
  usercount: number;
  ownername: string;
  ownermobile: string;
  owneremail: string;
};

export type SuperAdminOrganisationList = {
  items: SuperAdminOrganisation[];
  total: number;
  PageNumber: number;
  PageSize: number;
};

export type SuperAdminLocation = {
  id: number;
  name: string;
  addressline1: string;
  addressline2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  googlelocation: string;
  isactive: boolean;
  isverified: boolean;
  createdon: string;
};

export type SuperAdminUser = {
  id: number;
  name: string;
  email: string;
  mobile: string;
  designation: string;
  organisationid: number;
  organisationname: string;
  locationid: number;
  isactive: boolean;
  issuspended: boolean;
  issuperadmin: boolean;
  createdon: string;
};

export type SuperAdminUserList = {
  items: SuperAdminUser[];
  total: number;
  PageNumber: number;
  PageSize: number;
};

export type SuperAdminOrganisationDetail = {
  organisation: SuperAdminOrganisation;
  notes: string;
  attributes: string;
  modifiedon: string;
  locations: SuperAdminLocation[];
  users: SuperAdminUser[];
  totalappointments: number;
  appointmentstatuscounts: { statuscode: string; count: number }[];
};

export type SuperAdminDashboardStats = {
  OrganizationStats?: {
    TotalOrganizations?: number;
    VerifiedOrganizations?: number;
    NotVerifiedOrganizations?: number;
  };
  AppointmentStats?: {
    TotalAppointments?: number;
    StatusCounts?: { StatusCode: string; Count: number }[];
  };
};

/** Row from api/Admin/GetAllOrganisationLocations (every location of every organisation). */
export type SuperAdminLocationRow = {
  id: number;
  name?: string;
  addressline1?: string;
  addressline2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  googlelocation?: string;
  createdon?: string;
  isactive?: boolean;
  isverified?: boolean;
  organisationid?: number;
  organisationname?: string;
  organisationgstnumber?: string;
  organisationprimarytypecode?: string;
  organisationsecondarytypecode?: string;
  organisationmobile?: string;
  usermobile?: string;
};

export type ReferenceTypeItem = {
  id: number;
  identifier: string;
  displaytext: string;
  langcode?: string;
  isactive?: boolean;
  isfactory?: boolean;
  notes?: string;
  version?: number;
  attributes?: Record<string, unknown>;
};

export type ReferenceValueItem = {
  id: number;
  identifier: string;
  displaytext: string;
  description?: string;
  langcode?: string;
  referencetypeid: number;
  parentid?: number;
  isactive?: boolean;
  isfactory?: boolean;
  notes?: string;
  version?: number;
  attributes?: { DisplayOrder?: number | null };
};

type Env<T> = { item?: T; message?: string };

export function superAdminErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return "Super admin access is required for this action.";
    const msg = error.response?.data?.message;
    if (typeof msg === "string" && msg) return msg;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export class SuperAdminService {
  private get api(): string {
    return `${environment.baseurl}/api`;
  }

  private headers() {
    return { Accept: "application/json", "Content-Type": "application/json", ...getAuthHeaders() };
  }

  private async post<T>(path: string, item: unknown): Promise<T> {
    const res = await axios.post<Env<T>>(`${this.api}/${path}`, { item }, { headers: this.headers() });
    return res.data.item as T;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await axios.get<Env<T>>(`${this.api}/${path}`, { headers: this.headers() });
    return res.data.item as T;
  }

  /** Server-side check (users.isfactory). */
  async status(): Promise<boolean> {
    const res = await axios.get<Env<{ issuperadmin?: boolean; IsSuperAdmin?: boolean; isSuperAdmin?: boolean }>>(
      `${this.api}/Auth/SuperAdminStatus`,
      { headers: this.headers() },
    );
    const item = res.data?.item as
      | { issuperadmin?: boolean; IsSuperAdmin?: boolean; isSuperAdmin?: boolean }
      | undefined;
    return item?.issuperadmin === true || item?.IsSuperAdmin === true || item?.isSuperAdmin === true;
  }

  // ---- Organisations ----
  listOrganisations(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean | null;
    isSuspended?: boolean | null;
  }) {
    return this.post<SuperAdminOrganisationList>("SuperAdmin/ListOrganisations", {
      PageNumber: params.page ?? 1,
      PageSize: params.pageSize ?? 20,
      SearchTerm: params.search?.trim() || null,
      IsActive: params.isActive ?? null,
      IsSuspended: params.isSuspended ?? null,
    });
  }

  getOrganisation(id: number) {
    return this.post<SuperAdminOrganisationDetail>("SuperAdmin/GetOrganisation", { Id: id });
  }

  /** Switch into the normal organisation workspace JWT for full editing. */
  assumeOrganisation(id: number) {
    return this.post<Record<string, unknown>>("SuperAdmin/AssumeOrganisation", { Id: id });
  }

  async suspendOrganisation(organisationId: number, reason: string) {
    return !!(await this.post<boolean>("Admin/SuspendOrganisation", { OrganisationId: organisationId, Reason: reason }));
  }

  async activateOrganisation(organisationId: number) {
    return !!(await this.post<boolean>("Admin/ActivateOrganisation", { OrganisationId: organisationId }));
  }

  async toggleOrganisationVerification(organisationId: number, isVerified: boolean) {
    return !!(await this.post<boolean>("Admin/ToggleOrganisationVerification", {
      OrganisationId: organisationId,
      IsVerified: isVerified,
    }));
  }

  // ---- Locations ----
  async listAllLocations() {
    return (await this.get<SuperAdminLocationRow[]>("Admin/GetAllOrganisationLocations")) ?? [];
  }

  async toggleLocationVerification(locationId: number, isVerified: boolean) {
    return !!(await this.post<boolean>("Admin/ToggleLocationVerification", { LocationId: locationId, IsVerified: isVerified }));
  }

  async deactivateLocation(locationId: number) {
    return !!(await this.post<boolean>("Admin/DeleteLocation", { LocationId: locationId }));
  }

  async activateLocation(locationId: number) {
    return !!(await this.post<boolean>("Admin/ActivateLocation", { LocationId: locationId }));
  }

  // ---- Users ----
  listUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean | null;
    isSuspended?: boolean | null;
    organisationId?: number | null;
  }) {
    return this.post<SuperAdminUserList>("SuperAdmin/ListUsers", {
      PageNumber: params.page ?? 1,
      PageSize: params.pageSize ?? 20,
      SearchTerm: params.search?.trim() || null,
      IsActive: params.isActive ?? null,
      IsSuspended: params.isSuspended ?? null,
      OrganisationId: params.organisationId ?? null,
    });
  }

  async suspendUser(userId: number, reason: string) {
    return !!(await this.post<boolean>("Admin/SuspendUser", { UserId: userId, Reason: reason }));
  }

  async activateUser(userId: number) {
    return !!(await this.post<boolean>("Admin/ActivateUser", { UserId: userId }));
  }

  // ---- Dashboard ----
  async dashboardStats() {
    return (await this.post<SuperAdminDashboardStats>("Admin/GetDashboardStats", {})) ?? {};
  }

  // ---- Reference data ----
  async listReferenceTypes() {
    return (await this.get<ReferenceTypeItem[]>("SuperAdmin/ListReferenceTypes")) ?? [];
  }

  async listReferenceValues(referenceTypeId: number) {
    return (await this.post<ReferenceValueItem[]>("SuperAdmin/ListReferenceValues", { ReferenceTypeId: referenceTypeId })) ?? [];
  }

  saveReferenceValue(value: Partial<ReferenceValueItem> & { referencetypeid: number }) {
    return this.post<ReferenceValueItem>("SuperAdmin/SaveReferenceValue", {
      isactive: true,
      parentid: 0,
      langcode: "en",
      attributes: {},
      ...value,
    });
  }

  async deleteReferenceValue(id: number, version: number) {
    return !!(await this.post<boolean>("SuperAdmin/DeleteReferenceValue", { id, version }));
  }

  saveReferenceType(value: Partial<ReferenceTypeItem> & { identifier: string; displaytext: string }) {
    return this.post<ReferenceTypeItem>("SuperAdmin/SaveReferenceType", {
      isactive: true,
      langcode: "en",
      attributes: {},
      ...value,
    });
  }

  // ---- Dynamic reports (Super Admin Report Builder) ----
  private get reportsApi(): string {
    return `${this.api}/superadmin/reports`;
  }

  private async reportsGet<T>(path = ""): Promise<T> {
    const res = await axios.get<Env<T>>(`${this.reportsApi}${path}`, { headers: this.headers() });
    return res.data.item as T;
  }

  private async reportsPost<T>(path: string, body: unknown): Promise<T> {
    const res = await axios.post<Env<T>>(`${this.reportsApi}${path}`, body, { headers: this.headers() });
    return res.data.item as T;
  }

  async listReports() {
    return (await this.reportsGet<ReportListItemDto[]>("")) ?? [];
  }

  async getReport(id: number) {
    return await this.reportsGet<ReportDefinitionDto>(`/${id}`);
  }

  async saveReport(body: ReportDefinitionUpsertReq) {
    return await this.reportsPost<ReportDefinitionDto>("", body);
  }

  async setReportActive(id: number, is_active: boolean) {
    return !!(await this.reportsPost<boolean>(`/${id}/active`, { is_active }));
  }

  async deleteReport(id: number) {
    const res = await axios.delete<Env<boolean>>(`${this.reportsApi}/${id}`, { headers: this.headers() });
    return !!res.data.item;
  }

  async validateReportSql(sql_query: string) {
    return await this.reportsPost<ReportValidateResult>("/validate", { sql_query });
  }

  async previewReport(body: {
    report_id?: number | null;
    sql_query?: string;
    organisation_id?: number | null;
    parameters?: Record<string, unknown>;
    sample_limit?: number;
  }) {
    return await this.reportsPost<ReportExecutionResult>("/preview", body);
  }
}

export const superAdminService = new SuperAdminService();