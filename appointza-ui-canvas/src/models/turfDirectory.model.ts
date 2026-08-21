export type TurfVenue = {
  Name: string;
  Category: string;
  Address: string;
  Phone: string;
  Website: string;
  City: string;
  State: string;
  MapURL: string;
  ImageURL: string;
  SearchTerm: string;
  Constituency: string;
  QueryState: string;
};

export const TURF_DIRECTORY_INDEX_URL = "/data/turf_tamil_nadu_index.json";
export const TURF_DIRECTORY_CITY_URL = (file: string) => `/data/turf_tamil_nadu/${file}`;
