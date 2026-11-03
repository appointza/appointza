import { appointzaComputeRoute, appointzaEstimateJourney } from '../billing/appointzaCloud';
import type { RidePlace } from './types';
import type { RoutesRoute } from './googleRoutesParse';

export type RoutesTravelMode = 'TRANSIT' | 'DRIVE' | 'TWO_WHEELER' | 'WALK' | 'BICYCLE';

export type RoutesApiResponse = {
  error?: { message?: string; status?: string };
  routes?: RoutesRoute[];
};

export async function computeRoutesHttp(
  origin: RidePlace,
  destination: RidePlace,
  travelMode: RoutesTravelMode,
  _extra: Record<string, unknown> = {}
): Promise<RoutesApiResponse> {
  const mode = travelMode === 'TWO_WHEELER' ? 'TWO_WHEELER' : 'DRIVE';
  if (travelMode !== 'DRIVE' && travelMode !== 'TWO_WHEELER') {
    return { routes: [] };
  }
  const data = await appointzaComputeRoute(
    { lat: origin.lat, lng: origin.lng, address: origin.name },
    { lat: destination.lat, lng: destination.lng, address: destination.name },
    mode
  );
  return data as RoutesApiResponse;
}

export async function computeJourneyModesHttp(
  origin: RidePlace,
  destination: RidePlace
): Promise<{
  transit: RoutesApiResponse;
  drive: RoutesApiResponse;
  twoWheeler: RoutesApiResponse;
  walk: RoutesApiResponse;
  bicycle: RoutesApiResponse;
}> {
  const empty: RoutesApiResponse = { routes: [] };
  try {
    const payload = await appointzaEstimateJourney({
      origin: { lat: origin.lat, lng: origin.lng, address: origin.name },
      destination: { lat: destination.lat, lng: destination.lng, address: destination.name },
    });
    if (!payload.configured) {
      return { transit: empty, drive: empty, twoWheeler: empty, walk: empty, bicycle: empty };
    }
    return {
      transit: (payload.transit as RoutesApiResponse) ?? empty,
      drive: (payload.drive as RoutesApiResponse) ?? empty,
      twoWheeler: (payload.twoWheeler as RoutesApiResponse) ?? empty,
      walk: (payload.walk as RoutesApiResponse) ?? empty,
      bicycle: (payload.bicycle as RoutesApiResponse) ?? empty,
    };
  } catch {
    return { transit: empty, drive: empty, twoWheeler: empty, walk: empty, bicycle: empty };
  }
}
