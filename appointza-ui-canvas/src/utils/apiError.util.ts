import axios from "axios";
import type { ActionRes } from "@/models/actionres.model";

/** Prefer server `error` / `message` from ActionRes over generic axios status text. */
export function getApiErrorMessage(error: unknown, fallback = "Please try again."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | ActionRes<unknown>
      | { error?: string; message?: string }
      | undefined;
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof error.response?.data === "string" && error.response.data.trim()) {
      return error.response.data;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
