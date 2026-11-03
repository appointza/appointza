import { NAPZ_PRODUCT_CLIENT } from './appointzaConfig';
import {
  appointzaRequest,
  readNumber,
  readString,
  unwrapAppointzaItem,
} from './appointzaHttp';
import { saveAppointzaSession } from './appointzaSession';
import { mapAppointzaEntitlement } from './appointzaEntitlement';
import { writeCachedEntitlement } from '../entitlement/entitlementStorage';
import type { NapzEntitlement } from '../entitlement/entitlementTypes';

export type AppointzaGoogleLoginInput = {
  idToken: string;
  email: string;
  name?: string;
  picture?: string | null;
};

export type AppointzaEnsureUserResult = {
  userid: number;
  organisationid: number;
  organisationname: string;
  entitlement: NapzEntitlement;
};

/**
 * Exchange Google identity for an Appointza JWT (creates Napz users when needed).
 */
export async function appointzaGoogleLogin(
  input: AppointzaGoogleLoginInput
): Promise<{ userid: number; organisationid: number; accesstoken: string }> {
  const payload = await appointzaRequest('/api/Auth/GoogleLogin', {
    auth: false,
    body: {
      item: {
        idToken: input.idToken,
        email: input.email,
        name: input.name ?? '',
        picture: input.picture ?? '',
        client: NAPZ_PRODUCT_CLIENT,
        is_business_registration: false,
      },
    },
  });

  const item = unwrapAppointzaItem(payload);
  const accesstoken = readString(item, ['accesstoken', 'accessToken', 'AccessToken']);
  const refreshtoken = readString(item, ['refreshtoken', 'refreshToken', 'RefreshToken']);
  const userid = readNumber(item, ['userid', 'userId', 'UserId']);
  const organisationid = readNumber(item, ['organisationid', 'organizationid', 'organisationId']);

  if (!accesstoken || !Number.isFinite(userid) || userid <= 0) {
    throw new Error('Appointza Google login did not return a session.');
  }

  await saveAppointzaSession({
    accesstoken,
    refreshtoken: refreshtoken || null,
    userid,
    organisationid: Number.isFinite(organisationid) ? organisationid : null,
  });

  return {
    userid,
    organisationid: Number.isFinite(organisationid) ? organisationid : 0,
    accesstoken,
  };
}

/** Ensure Napz product org + free entitlement row for the signed-in Appointza user. */
export async function appointzaEnsureUser(): Promise<AppointzaEnsureUserResult> {
  const payload = await appointzaRequest('/api/Napz/EnsureUser', {
    body: {},
  });
  const item = unwrapAppointzaItem(payload);
  const userid = readNumber(item, ['userid', 'userId']);
  const organisationid = readNumber(item, ['organisationid', 'organizationid']);
  const organisationname = readString(item, ['organisationname', 'organizationname']) || 'Napz';

  const entitlementRaw =
    item.entitlement && typeof item.entitlement === 'object'
      ? (item.entitlement as Record<string, unknown>)
      : item;

  return {
    userid: Number.isFinite(userid) ? userid : 0,
    organisationid: Number.isFinite(organisationid) ? organisationid : 0,
    organisationname,
    entitlement: mapAppointzaEntitlement(entitlementRaw),
  };
}

/** Full Napz platform bootstrap after Google sign-in. */
export async function linkNapzAccountToAppointza(
  input: AppointzaGoogleLoginInput
): Promise<AppointzaEnsureUserResult> {
  await appointzaGoogleLogin(input);
  const ensured = await appointzaEnsureUser();
  await writeCachedEntitlement(ensured.entitlement);
  return ensured;
}
