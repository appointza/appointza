export class WebsiteExportOrderReq {
  website_id: number = 0;
  user_id: number = 0;
  page_count: number = 0;
}

export class RazorpayOrderNotes {
  customerid: number = 0;
  appointmentid?: number | null = null;
  organisation_location_id: number = 0;
  eventid?: number | null = null;
  website_id?: number | null = null;
  page_count?: number | null = null;
}

export class RazorpayOrder {
  id: string = '';
  entity: string = '';
  amount: number = 0;
  amount_paid: number = 0;
  amount_due: number = 0;
  currency: string = 'INR';
  receipt: string = '';
  offer_id?: any = null;
  status: string = '';
  attempts: number = 0;
  notes?: RazorpayOrderNotes = new RazorpayOrderNotes();
  created_at: number = 0;
}

export class WebsiteExportOrderRes {
  orderid: string = '';
  key: string = ''; // Razorpay key from ApplicationSettings
  amount: number = 0; // Amount in paise
  currency: string = 'INR';
  receipt: string = '';
}

