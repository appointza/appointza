import { appointzaRequest, unwrapAppointzaItem } from '../billing/appointzaHttp';
import type { BlaBlaCarRideOffer } from './blaBlaCarCatalog';

export async function blaBlaCarProStatus(): Promise<{
  configured: boolean;
  loggedIn: boolean;
  login?: string;
  firstName?: string;
}> {
  const payload = await appointzaRequest('/api/Napz/RideCatalog?provider=blablacar_status', {
    body: {},
  });
  return unwrapAppointzaItem(payload) as {
    configured: boolean;
    loggedIn: boolean;
    login?: string;
    firstName?: string;
  };
}

export async function blaBlaCarProLogin(login: string, password: string): Promise<{
  loggedIn: boolean;
  login?: string;
  firstName?: string;
}> {
  const payload = await appointzaRequest('/api/Napz/RideCatalog?provider=blablacar_login', {
    body: { item: { login, password } },
  });
  return unwrapAppointzaItem(payload) as {
    loggedIn: boolean;
    login?: string;
    firstName?: string;
  };
}

export async function logoutBlaBlaCarPro(): Promise<void> {
  await appointzaRequest('/api/Napz/RideCatalog?provider=blablacar_logout', { body: {} });
}

export async function blaBlaCarProSearch(input: {
  originName: string;
  destinationName: string;
  departureDate: string;
}): Promise<{
  configured: boolean;
  loggedIn: boolean;
  rides: BlaBlaCarRideOffer[];
  message?: string;
}> {
  const payload = await appointzaRequest('/api/Napz/RideCatalog?provider=blablacar_search', {
    body: { item: input },
  });
  const item = unwrapAppointzaItem(payload);
  return {
    configured: item.configured === true,
    loggedIn: item.loggedIn === true,
    rides: Array.isArray(item.rides) ? (item.rides as BlaBlaCarRideOffer[]) : [],
    message: typeof item.message === 'string' ? item.message : undefined,
  };
}
