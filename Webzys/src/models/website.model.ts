export type WebsiteType = 'normal' | 'appointza' | 'resume';

export class Website {
  id: number = 0;
  user_id: number = 0;
  name: string = '';
  type: WebsiteType = 'normal';
  data: WebsiteData | any = new WebsiteData();
  created_at: string = '';
  updated_at: string = '';
  export_paid: boolean = false;
  export_payment_date?: string | null = null;
  export_payment_order_id?: string | null = null;
}

export class WebsiteData {
  pages: Record<string, PageData> = {};
  currentPage: string = 'home';
}

export class PageData {
  id: string = '';
  name: string = '';
  blocks: BlockData[] = [];
}

export class BlockData {
  id: string = '';
  type: string = '';
  data: Record<string, any> = {};
}

export class WebsiteSelectReq {
  id: number = 0;
  user_id: number = 0;
  type: string = ''; // Optional - can be empty
}

export class WebsiteDeleteReq {
  id: number = 0;
  user_id: number = 0;
}

export class WebsiteExportPaymentSuccessReq {
  website_id: number = 0;
  order_id: string = '';
}

export class WebsiteExportHtmlSaveReq {
  website_id: number = 0;
  html_content: string = '';
  website_name: string = '';
}

