export interface EdgeSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageBlock {
  id: string;
  type: string;
  props: Record<string, unknown>;
  layout?: {
    width?: number;
    height?: number | "auto";
    padding?: Partial<EdgeSpacing>;
    margin?: Partial<EdgeSpacing>;
  };
}

export interface SitePageSettings {
  backgroundColor?: string;
  backgroundImage?: string;
  textColor?: string;
}

export interface BlockCatalogEntry {
  type: string;
  name: string;
  category: string;
  icon: string;
}
