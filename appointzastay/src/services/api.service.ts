import axios, { AxiosInstance } from "axios";
import { getApiBaseUrl } from "@/utils/environment";
import { getRequestSubdomain } from "@/utils/subdomain";
import { getStayUser } from "@/services/auth.service";
import { getManagedOrganisation } from "@/utils/platformAdminContext";
import { isPlatformAdminRole } from "@/models/stay";

const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const subdomain = getRequestSubdomain();
  if (subdomain) {
    config.headers["X-AppointzaStay-Subdomain"] = subdomain;
  }
  const stayUser = getStayUser();
  const managedOrg = getManagedOrganisation();
  if (managedOrg?.id && isPlatformAdminRole(stayUser?.role)) {
    config.headers["X-AppointzaStay-OrganisationId"] = managedOrg.id;
  } else if (stayUser?.organizationId) {
    config.headers["X-AppointzaStay-OrganisationId"] = stayUser.organizationId;
  }
  if (config.data instanceof FormData) {
    // Let the browser set multipart boundary; a bare multipart type breaks file binding.
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
    } else {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("appointzastay:session-expired"));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
