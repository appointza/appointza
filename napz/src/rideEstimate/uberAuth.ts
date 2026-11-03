import { appointzaRequest, unwrapAppointzaItem } from '../billing/appointzaHttp';
import type { UberProductOffer } from './uberCatalog';

export async function uberAuthStart(): Promise<{ authorizeUrl?: string; redirectUri?: string }> {
  const payload = await appointzaRequest('/api/Napz/RideCatalog?provider=uber_auth_start', {
    body: {},
  });
  return unwrapAppointzaItem(payload) as { authorizeUrl?: string; redirectUri?: string };
}

export async function uberConnectionStatus(): Promise<{ connected: boolean; scope?: string }> {
  const payload = await appointzaRequest('/api/Napz/RideCatalog?provider=uber_status', {
    body: {},
  });
  const item = unwrapAppointzaItem(payload);
  return { connected: item.connected === true, scope: typeof item.scope === 'string' ? item.scope : undefined };
}

export async function uberDisconnect(): Promise<void> {
  await appointzaRequest('/api/Napz/RideCatalog?provider=uber_disconnect', { body: {} });
}

export async function uberRideCatalog(
  pickup: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ connected: boolean; products: UberProductOffer[] }> {
  try {
    const payload = await appointzaRequest(
      `/api/Napz/RideCatalog?provider=uber&pickupLat=${pickup.lat}&pickupLng=${pickup.lng}&destLat=${destination.lat}&destLng=${destination.lng}`,
      { body: {} }
    );
    const item = unwrapAppointzaItem(payload);
    return {
      connected: item.connected === true,
      products: Array.isArray(item.products) ? (item.products as UberProductOffer[]) : [],
    };
  } catch {
    return { connected: false, products: [] };
  }
}
