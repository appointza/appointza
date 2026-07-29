/** One uploaded image stored in Files API, tracked per organisation. */
export interface OrgTemplateAsset {
  id: number;
  name: string;
  addedAt: string;
}

export interface OrgAssetCatalog {
  version: 1;
  assets: OrgTemplateAsset[];
}

export const ORG_TEMPLATE_ASSETS_IDENTIFIER = "__org_template_assets__";
