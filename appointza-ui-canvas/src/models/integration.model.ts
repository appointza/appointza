export interface IntegrationContextRes {
  organisation_id: number;
  organisation_name: string;
  userid: number;
  user_name: string;
  user_email: string;
  location_id: number;
  location_name: string;
}

export interface IntegrationTokenUrlsRes {
  token: string;
  context_url: string;
  data_url: string;
  export_url: string;
  context: IntegrationContextRes;
}
