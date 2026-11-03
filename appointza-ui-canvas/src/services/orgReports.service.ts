import { ActionRes } from "@/models/actionres.model";
import type {
  ReportDefinitionDto,
  ReportExecutionResult,
  ReportListItemDto,
} from "@/models/dynamicReport.model";
import { AxiosHelperUtils } from "@/utils/axioshelper.utils";
import { environment } from "@/utils/environment";
import { getAuthHeaders } from "@/utils/authSession.util";
import axios from "axios";

export class OrgReportsService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return `${environment.baseurl}/api/reports`;
  }

  async list(): Promise<ReportListItemDto[]> {
    const resp = await this.http.get<ActionRes<ReportListItemDto[]>>(this.baseurl);
    return resp.item ?? [];
  }

  async get(id: number): Promise<ReportDefinitionDto> {
    const resp = await this.http.get<ActionRes<ReportDefinitionDto>>(`${this.baseurl}/${id}`);
    if (!resp.item) throw new Error("Report not found.");
    return resp.item;
  }

  async execute(id: number, parameters: Record<string, unknown>, limit?: number): Promise<ReportExecutionResult> {
    const resp = await this.http.post<ActionRes<ReportExecutionResult>>(`${this.baseurl}/${id}/execute`, {
      parameters,
      limit,
    });
    if (!resp.item) throw new Error("Report execution failed.");
    return resp.item;
  }

  async export(id: number, format: "csv" | "excel" | "pdf", parameters: Record<string, unknown>): Promise<void> {
    const res = await axios.post(
      `${this.baseurl}/${id}/export`,
      { format, parameters },
      {
        headers: { ...getAuthHeaders(), Accept: "*/*", "Content-Type": "application/json" },
        responseType: "blob",
      },
    );
    const disposition = res.headers["content-disposition"] as string | undefined;
    const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const fileName = match?.[1]?.replace(/['"]/g, "") || `report.${format === "excel" ? "xls" : format}`;
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }
}

export const orgReportsService = new OrgReportsService();
