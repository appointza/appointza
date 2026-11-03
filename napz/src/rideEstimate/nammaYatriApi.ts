import { appointzaRequest, unwrapAppointzaItem } from '../billing/appointzaHttp';

export type NammaYatriOffer = {
  id?: string;
  provider?: string;
  price?: string;
  etaMinutes?: number | null;
};

export async function fetchNammaYatriRideCatalog(input: {
  pickup: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}): Promise<{ configured: boolean; offers: NammaYatriOffer[] }> {
  try {
    const payload = await appointzaRequest(
      `/api/Napz/RideCatalog?provider=nammayatri&pickupLat=${input.pickup.lat}&pickupLng=${input.pickup.lng}&destLat=${input.destination.lat}&destLng=${input.destination.lng}`,
      { body: {} }
    );
    const item = unwrapAppointzaItem(payload);
    return {
      configured: item.configured === true,
      offers: Array.isArray(item.offers) ? (item.offers as NammaYatriOffer[]) : [],
    };
  } catch {
    return { configured: false, offers: [] };
  }
}
