import axios from "axios";
import { environment } from "@/utils/environment";
import { ActionRes } from "@/models/actionres.model";
import { formatPublicHtmlEtag } from "@/utils/publicSiteCache.util";

export type PublicHtmlPayload = {
  organisationid?: number;
  organisationlocationid?: number;
  orgloctempid?: string;
  templateid?: number;
  html?: string;
  versionKey?: string;
};

export type PublicHtmlFetchResult = PublicHtmlPayload & {
  notModified?: boolean;
};

const baseurl = () => `${environment.baseurl}/api/OrganisationSite`;

async function fetchPublicHtml(
  url: string,
  ifNoneMatch?: string,
): Promise<PublicHtmlFetchResult> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (ifNoneMatch) {
    headers["If-None-Match"] = ifNoneMatch;
  }

  const response = await axios.get<ActionRes<PublicHtmlPayload>>(url, {
    headers,
    validateStatus: (status) => status === 200 || status === 304,
  });

  if (response.status === 304) {
    return { notModified: true };
  }

  return { ...(response.data.item ?? {}), notModified: false };
}

export async function getPublicHtmlByGuid(
  orgloctempid: string,
  options?: { versionKey?: string },
): Promise<PublicHtmlFetchResult> {
  const ifNoneMatch = options?.versionKey ? formatPublicHtmlEtag(options.versionKey) : undefined;
  return fetchPublicHtml(
    `${baseurl()}/GetPublicHtml/${encodeURIComponent(orgloctempid)}`,
    ifNoneMatch,
  );
}

export async function getPublicHtmlByLocationId(
  locationId: number,
  options?: { versionKey?: string },
): Promise<PublicHtmlFetchResult> {
  const ifNoneMatch = options?.versionKey ? formatPublicHtmlEtag(options.versionKey) : undefined;
  return fetchPublicHtml(`${baseurl()}/GetPublicHtmlByLocation/${locationId}`, ifNoneMatch);
}
