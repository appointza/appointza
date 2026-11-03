import {
  appointzaRequest,
  readString,
  unwrapAppointzaItem,
} from './appointzaHttp';
import type { SavedPlace } from '../types/place';
import type { UserProfile } from '../services/firebase/userProfileSync';
import type { TripPlan } from '../trip/types';

function unwrapList(payload: unknown): Record<string, unknown>[] {
  if (!payload || typeof payload !== 'object') return [];
  const root = payload as Record<string, unknown>;
  for (const key of ['item', 'Item', 'data', 'Data']) {
    const nested = root[key];
    if (Array.isArray(nested)) return nested as Record<string, unknown>[];
  }
  return [];
}

export async function appointzaUpsertProfile(
  profile: UserProfile & { firebaseUid?: string | null }
): Promise<void> {
  await appointzaRequest('/api/Napz/UpsertProfile', {
    body: {
      item: {
        firebase_uid: profile.firebaseUid ?? null,
        name: profile.name ?? '',
        email: profile.email ?? '',
        mobile: profile.mobile ?? '',
        pincode: profile.pincode ?? '',
        photo_url: profile.photoUrl ?? null,
      },
    },
  });
}

export async function appointzaGetProfile(): Promise<{
  mobile: string;
  pincode: string;
  name: string;
  email: string;
  photoUrl: string | null;
} | null> {
  const payload = await appointzaRequest('/api/Napz/GetProfile', { body: {} });
  const item = unwrapAppointzaItem(payload);
  if (!Object.keys(item).length) return null;
  return {
    name: readString(item, ['name']),
    email: readString(item, ['email']),
    mobile: readString(item, ['mobile']),
    pincode: readString(item, ['pincode']),
    photoUrl: readString(item, ['photo_url', 'photoUrl']) || null,
  };
}

export async function appointzaSetActiveDestination(place: {
  placeName: string;
  lat: number;
  lng: number;
  alertRadius: number;
}): Promise<void> {
  await appointzaRequest('/api/Napz/SetActiveDestination', {
    body: {
      item: {
        placeName: place.placeName,
        lat: place.lat,
        lng: place.lng,
        alertRadius: place.alertRadius,
      },
    },
  });
}

export async function appointzaListSavedPlaces(): Promise<SavedPlace[]> {
  const payload = await appointzaRequest('/api/Napz/ListSavedPlaces', { body: {} });
  return unwrapList(payload)
    .map((row) => {
      const lat = Number(row.lat);
      const lng = Number(row.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const place: SavedPlace = {
        id: String(row.id ?? ''),
        name: String(row.name ?? 'Place'),
        lat,
        lng,
        radius: Number(row.radius) || 1000,
        createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
      };
      return place;
    })
    .filter((p): p is SavedPlace => p != null && !!p.id);
}

export async function appointzaUpsertSavedPlace(place: SavedPlace): Promise<void> {
  await appointzaRequest('/api/Napz/UpsertSavedPlace', {
    body: { item: place },
  });
}

export async function appointzaDeleteSavedPlace(placeId: string): Promise<void> {
  await appointzaRequest('/api/Napz/DeleteSavedPlace', {
    body: { item: { id: placeId } },
  });
}

export async function appointzaSaveTrip(plan: TripPlan): Promise<void> {
  await appointzaRequest('/api/Napz/SaveTrip', {
    body: {
      item: {
        trip_id: plan.id,
        share_code: plan.shareCode ?? null,
        plan_json: JSON.stringify(plan),
      },
    },
  });
}

export async function appointzaListTrips(): Promise<TripPlan[]> {
  const payload = await appointzaRequest('/api/Napz/ListTrips', { body: {} });
  return unwrapList(payload)
    .map((row) => {
      try {
        const raw = String(row.plan_json ?? row.planJson ?? '{}');
        return JSON.parse(raw) as TripPlan;
      } catch {
        return null;
      }
    })
    .filter((p): p is TripPlan => p != null && !!p.id);
}

export async function appointzaDeleteTrip(plan: TripPlan): Promise<void> {
  await appointzaRequest('/api/Napz/DeleteTrip', {
    body: { item: { trip_id: plan.id, share_code: plan.shareCode ?? null } },
  });
}

export async function appointzaPublishTrip(plan: TripPlan): Promise<TripPlan> {
  const payload = await appointzaRequest('/api/Napz/PublishTrip', {
    body: {
      item: {
        trip_id: plan.id,
        share_code: plan.shareCode ?? null,
        plan_json: JSON.stringify(plan),
      },
    },
  });
  const item = unwrapAppointzaItem(payload);
  const shareCode = readString(item, ['share_code', 'shareCode']) || plan.shareCode;
  return { ...plan, shareCode: shareCode || plan.shareCode };
}

export async function appointzaOpenSharedTrip(code: string): Promise<TripPlan | null> {
  const payload = await appointzaRequest('/api/Napz/GetSharedTrip', {
    auth: false,
    body: { item: { share_code: code.trim().toUpperCase() } },
  });
  const item = unwrapAppointzaItem(payload);
  try {
    return JSON.parse(String(item.plan_json ?? item.planJson ?? '{}')) as TripPlan;
  } catch {
    return null;
  }
}

export async function appointzaDeleteAccountData(): Promise<void> {
  await appointzaRequest('/api/Napz/DeleteAccount', { body: {} });
}

export async function appointzaSearchPlaces(
  query: string,
  near?: { lat: number; lng: number } | null
): Promise<{ display_name: string; lat: string; lon: string; type: string; importance: number }[]> {
  const payload = await appointzaRequest('/api/Napz/SearchPlaces', {
    body: {
      item: {
        query,
        lat: near?.lat ?? null,
        lng: near?.lng ?? null,
      },
    },
  });
  return unwrapList(payload).map((row, index) => ({
    display_name: String(row.display_name ?? row.displayName ?? query),
    lat: String(row.lat ?? ''),
    lon: String(row.lon ?? row.lng ?? ''),
    type: String(row.type ?? 'google_place'),
    importance: Number(row.importance) || 1 - index * 0.05,
  }));
}

export async function appointzaReverseGeocode(
  lat: number,
  lng: number
): Promise<{ display_name: string }> {
  const payload = await appointzaRequest('/api/Napz/ReverseGeocode', {
    body: { item: { lat, lng } },
  });
  const item = unwrapAppointzaItem(payload);
  return {
    display_name: readString(item, ['display_name', 'displayName']) || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
  };
}

export async function appointzaEstimateJourney(body: {
  origin: { lat: number; lng: number; address?: string };
  destination: { lat: number; lng: number; address?: string };
}): Promise<Record<string, unknown>> {
  const payload = await appointzaRequest('/api/Napz/EstimateJourney', {
    body: { item: body },
  });
  return unwrapAppointzaItem(payload);
}

export async function appointzaComputeRoute(
  origin: { lat: number; lng: number; address?: string },
  destination: { lat: number; lng: number; address?: string },
  mode: 'DRIVE' | 'TWO_WHEELER'
): Promise<Record<string, unknown>> {
  const payload = await appointzaRequest(`/api/Napz/ComputeRoute?mode=${mode}`, {
    body: { item: { origin, destination } },
  });
  return unwrapAppointzaItem(payload);
}

export async function appointzaNarrateTrip(body: {
  lang: string;
  stops: { id: string; name: string; kind: string; tip: string }[];
}): Promise<{ descriptions?: Record<string, string> | null }> {
  const payload = await appointzaRequest('/api/Napz/NarrateTrip', {
    body: { item: body },
  });
  return unwrapAppointzaItem(payload) as { descriptions?: Record<string, string> | null };
}
