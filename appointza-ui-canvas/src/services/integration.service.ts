import { ActionRes } from "../models/actionres.model";
import type { IntegrationTokenUrlsRes } from "../models/integration.model";
import { AxiosHelperUtils } from "../utils/axioshelper.utils";
import { environment } from "../utils/environment";

export class IntegrationService {
  http: AxiosHelperUtils;

  constructor() {
    this.http = new AxiosHelperUtils();
  }

  get baseurl(): string {
    return environment.baseurl + "/api/Integration";
  }

  async generateToken(regenerate = false) {
    const url = `${this.baseurl}/GenerateToken${regenerate ? "?regenerate=true" : ""}`;
    const resp = await this.http.post<ActionRes<IntegrationTokenUrlsRes>>(url, {});
    return resp.item!;
  }
}
