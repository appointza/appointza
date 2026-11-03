import AsyncStorage from '@react-native-async-storage/async-storage';

export const APPOINTZA_ACCESS_TOKEN_KEY = 'appointza_access_token';
export const APPOINTZA_REFRESH_TOKEN_KEY = 'appointza_refresh_token';
export const APPOINTZA_USER_ID_KEY = 'appointza_userid';
export const APPOINTZA_ORG_ID_KEY = 'appointza_organisationid';

export async function saveAppointzaSession(params: {
  accesstoken: string;
  refreshtoken?: string | null;
  userid?: number | null;
  organisationid?: number | null;
}): Promise<void> {
  const writes: [string, string][] = [
    [APPOINTZA_ACCESS_TOKEN_KEY, params.accesstoken],
  ];
  if (params.refreshtoken) {
    writes.push([APPOINTZA_REFRESH_TOKEN_KEY, params.refreshtoken]);
  }
  if (params.userid != null && params.userid > 0) {
    writes.push([APPOINTZA_USER_ID_KEY, String(params.userid)]);
  }
  if (params.organisationid != null && params.organisationid > 0) {
    writes.push([APPOINTZA_ORG_ID_KEY, String(params.organisationid)]);
  }
  await AsyncStorage.multiSet(writes);
}

export async function getAppointzaAccessToken(): Promise<string | null> {
  const token = await AsyncStorage.getItem(APPOINTZA_ACCESS_TOKEN_KEY);
  return token?.trim() || null;
}

export async function clearAppointzaSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    APPOINTZA_ACCESS_TOKEN_KEY,
    APPOINTZA_REFRESH_TOKEN_KEY,
    APPOINTZA_USER_ID_KEY,
    APPOINTZA_ORG_ID_KEY,
  ]);
}
