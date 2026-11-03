import { appointzaRequest, unwrapAppointzaItem } from '../billing/appointzaHttp';
import type { OlaProductOffer } from './olaCatalog';

export type { OlaProductOffer };

/** Ola catalog via Appointza (returns configured:false until Ola secrets are set). */
export async function fetchOlaRideCatalog(
  pickup: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ configured: boolean; products: OlaProductOffer[] }> {
  try {
    const payload = await appointzaRequest(
      `/api/Napz/RideCatalog?provider=ola&pickupLat=${pickup.lat}&pickupLng=${pickup.lng}&destLat=${destination.lat}&destLng=${destination.lng}`,
      { body: {} }
    );
    const item = unwrapAppointzaItem(payload);
    return {
      configured: item.configured === true,
      products: Array.isArray(item.products) ? (item.products as OlaProductOffer[]) : [],
    };
  } catch {
    return { configured: false, products: [] };
  }
}
