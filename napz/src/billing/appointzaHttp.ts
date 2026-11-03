import { APPOINTZA_API_BASE_URL } from './appointzaConfig';
import { getAppointzaAccessToken } from './appointzaSession';

export function unwrapAppointzaItem(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {};
  const root = payload as Record<string, unknown>;
  for (const key of ['item', 'Item', 'data', 'Data', 'result', 'Result']) {
    const nested = root[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return root;
}

function failureMessage(payload: unknown, httpStatus: number): string | null {
  const root =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const detail = String(root.message ?? root.Message ?? root.error ?? root.Error ?? '').trim();
  if (httpStatus >= 400) {
    return detail || `Appointza request failed (${httpStatus}).`;
  }
  if (root.success === false || root.Success === false) {
    return detail || 'Appointza rejected the request.';
  }
  return null;
}

export async function appointzaRequest(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    body?: Record<string, unknown> | null;
    auth?: boolean;
  } = {}
): Promise<unknown> {
  const method = options.method ?? 'POST';
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (options.auth !== false) {
    const token = await getAppointzaAccessToken();
    if (!token) {
      throw new Error('Sign in again to connect Napz.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${APPOINTZA_API_BASE_URL.replace(/\/$/, '')}${path}`;
  const response = await fetch(url, {
    method,
    headers,
    body:
      method === 'GET' || options.body == null
        ? undefined
        : JSON.stringify(options.body),
  });
  const payload = await response.json().catch(() => ({}));
  const failed = failureMessage(payload, response.status);
  if (failed) throw new Error(failed);
  return payload;
}

export function readString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

export function readNumber(record: Record<string, unknown>, keys: string[]): number {
  const raw = readString(record, keys);
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

export function readBool(record: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 'True') return true;
  }
  return false;
}
