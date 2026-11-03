export interface CrmDiscoveredPlace {
  place_id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  google_maps_url: string;
  lat: number;
  lng: number;
  rating?: number | null;
  already_saved: boolean;
  saved_reason?: string;
}

export interface CrmPlaceSearchReq {
  organisation_id?: number;
  query: string;
  lat?: number | null;
  lng?: number | null;
  radius_meters?: number;
  require_phone?: boolean;
  require_website?: boolean;
  limit?: number;
}

export interface CrmPlaceSearchRes {
  places: CrmDiscoveredPlace[];
  status: string;
  next_page_token?: string;
}

export interface CrmSavePlaceAsLeadReq {
  organisation_id?: number;
  place: CrmDiscoveredPlace;
}
