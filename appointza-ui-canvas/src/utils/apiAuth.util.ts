import axios from "axios";

/** True when the API indicates the session is invalid (HTTP or body message). */
export function isUnauthorizedApiError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) return true;
    const msg = error.response?.data?.message;
    if (typeof msg === "string" && msg.toLowerCase() === "unauthorized") return true;
  }
  if (error && typeof error === "object" && "message" in error) {
    const m = String((error as { message?: string }).message || "").toLowerCase();
    if (m === "unauthorized" || m.includes("unauthorized")) return true;
  }
  return false;
}
