import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { appointzaRequest, unwrapAppointzaItem } from './appointzaHttp';
import { getAppointzaAccessToken } from './appointzaSession';

const MIGRATED_KEY_PREFIX = 'napz_firebase_migrated_v1:';

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function parseDate(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const t = Date.parse(value);
    return Number.isFinite(t) ? new Date(t).toISOString() : null;
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return d.toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

async function alreadyMigrated(uid: string): Promise<boolean> {
  const flag = await AsyncStorage.getItem(`${MIGRATED_KEY_PREFIX}${uid}`);
  return flag === '1';
}

async function markMigrated(uid: string): Promise<void> {
  await AsyncStorage.setItem(`${MIGRATED_KEY_PREFIX}${uid}`, '1');
}

/**
 * Read this user's Firestore Napz data and write it into Appointza Postgres.
 * Safe to call after Firebase Auth + Appointza JWT are ready.
 */
export async function migrateFirebaseDataToAppointza(options?: {
  force?: boolean;
}): Promise<{ ok: boolean; message: string }> {
  const uid = auth().currentUser?.uid;
  if (!uid) {
    return { ok: false, message: 'No Firebase Auth user.' };
  }
  if (!(await getAppointzaAccessToken())) {
    return { ok: false, message: 'No Appointza session.' };
  }
  if (!options?.force && (await alreadyMigrated(uid))) {
    return { ok: true, message: 'Already migrated.' };
  }

  const userRef = firestore().collection('users').doc(uid);
  const userSnap = await userRef.get();
  const userData = (userSnap.data() ?? {}) as Record<string, unknown>;

  const placesSnap = await userRef.collection('savedPlaces').get();
  const places = placesSnap.docs
    .map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      const lat = asNumber(d.lat);
      const lng = asNumber(d.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return {
        id: asString(d.id, doc.id),
        name: asString(d.placeName ?? d.name, 'Place'),
        lat,
        lng,
        radius: asNumber(d.alertRadius ?? d.radius, 1000),
        createdAt: asString(d.createdAt, new Date().toISOString()),
      };
    })
    .filter((p): p is NonNullable<typeof p> => p != null);

  const tripsSnap = await userRef.collection('trips').get();
  const trips = tripsSnap.docs.map((doc) => {
    const plan = doc.data() as Record<string, unknown>;
    const shareCode = asString(plan.shareCode) || null;
    return {
      trip_id: asString(plan.id, doc.id),
      share_code: shareCode,
      plan_json: JSON.stringify(plan),
    };
  });

  const shared_trips: { share_code: string; plan_json: string }[] = [];
  for (const trip of trips) {
    if (!trip.share_code) continue;
    try {
      const sharedSnap = await firestore().collection('sharedTrips').doc(trip.share_code).get();
      if (!sharedSnap.exists) continue;
      const shared = sharedSnap.data() as { plan?: unknown; ownerUid?: string } | undefined;
      if (shared?.ownerUid && shared.ownerUid !== uid) continue;
      shared_trips.push({
        share_code: trip.share_code,
        plan_json: JSON.stringify(shared?.plan ?? JSON.parse(trip.plan_json)),
      });
    } catch {
      /* ignore missing share */
    }
  }

  let entitlementDoc: Record<string, unknown> = {};
  try {
    const entSnap = await userRef.collection('entitlement').doc('current').get();
    if (entSnap.exists) entitlementDoc = (entSnap.data() ?? {}) as Record<string, unknown>;
  } catch {
    entitlementDoc = {};
  }

  let freeTrialUsed =
    userData.freeTrialUsed === true ||
    asString(userData.freeTrialStatus).length > 0 ||
    entitlementDoc.freeTrialUsed === true;
  try {
    const trialSnap = await userRef.collection('trials').doc('free_10_day').get();
    if (trialSnap.exists) freeTrialUsed = true;
  } catch {
    /* ignore */
  }

  const productId =
    asString(entitlementDoc.productId ?? entitlementDoc.planId) ||
    asString(userData.planId ?? userData.premiumProductId) ||
    null;
  const expiresAt =
    parseDate(entitlementDoc.expiresAt ?? entitlementDoc.expiryTime) ||
    parseDate(userData.premiumExpiresAt ?? userData.expiryTime);
  const isLifetime =
    entitlementDoc.isLifetime === true ||
    asString(entitlementDoc.tier) === 'lifetime' ||
    productId === 'napz_lifetime' ||
    productId === 'napz_premium_lifetime';
  const premium =
    entitlementDoc.premium === true ||
    userData.premium === true ||
    isLifetime ||
    asString(entitlementDoc.tier) === 'premium' ||
    asString(userData.subscriptionTier) === 'premium' ||
    asString(userData.subscriptionTier) === 'lifetime';

  const destinationLat = asNumber(userData.destinationLat, NaN);
  const destinationLng = asNumber(userData.destinationLng, NaN);

  const bundle = {
    firebase_uid: uid,
    profile: {
      firebase_uid: uid,
      name: asString(userData.name),
      email: asString(userData.email, auth().currentUser?.email ?? ''),
      mobile: asString(userData.mobile),
      pincode: asString(userData.pincode),
      photo_url: asString(userData.photoUrl) || null,
      place_name: asString(userData.placeName) || null,
      destination_lat: Number.isFinite(destinationLat) ? destinationLat : null,
      destination_lng: Number.isFinite(destinationLng) ? destinationLng : null,
      alert_radius: asNumber(userData.alertRadius, 0) || null,
    },
    places,
    trips,
    shared_trips,
    entitlement: {
      tier: isLifetime ? 'lifetime' : premium ? 'premium' : 'free',
      product_id: productId,
      expires_at: expiresAt,
      is_lifetime: isLifetime,
      saved_place_limit: asNumber(
        entitlementDoc.savedPlaceLimit ?? userData.savedPlaceLimit,
        isLifetime ? 500 : premium ? 50 : 3
      ),
      free_trial_used: freeTrialUsed,
      premium,
    },
  };

  const payload = await appointzaRequest('/api/Napz/ImportFirebaseBundle', {
    body: { item: bundle },
  });
  const item = unwrapAppointzaItem(payload);
  await markMigrated(uid);
  return {
    ok: true,
    message: asString(item.message, 'Imported Firebase data into Appointza.'),
  };
}
