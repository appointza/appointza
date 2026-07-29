import { environment } from "@/utils/environment";

export interface CreatePaymentOrderReq {
  organizationid: number;
  organisationlocationid: number;
  userid: number;
  amount: number; // This will be ignored - server will recalculate
  currency?: string;
  receipt?: string;
  appointmentid?: string;
  eventid?: number;
  appointmentdate?: string; // ISO date string for weekend/weekday pricing
  servicelist?: Array<{
    id: number;
    servicename: string;
    serviceprice: number;
    servicetimetaken: number;
    iscombo: boolean;
  }>; // Required for service-based pricing
}

export interface CreatePaymentOrderRes {
  orderid: string;
  key: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface VerifyPaymentReq {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  appointmentid: number;
  eventbookingid?: number; // Optional: for event bookings
  organizationid?: number; // Optional: for test payments (when appointmentid = 0)
}

export interface VerifyPaymentRes {
  isvalid: boolean;
  message: string;
  paymentid: number;
}

export class PaymentService {
  get baseUrl(): string {
    return environment.baseurl + '/api/Payment';
  }

  async createOrder(req: CreatePaymentOrderReq): Promise<CreatePaymentOrderRes> {
    try {
      console.log('Creating payment order:', req);
      
      const response = await fetch(`${this.baseUrl}/CreateOrder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      });

      const responseText = await response.text();
      console.log('Payment order response status:', response.status);
      console.log('Payment order response:', responseText);

      if (!response.ok) {
        let errorMessage = "Failed to create payment order";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result: CreatePaymentOrderRes = JSON.parse(responseText);
      
      if (!result) {
        throw new Error("Invalid response from payment service");
      }
      
      return result;
    } catch (error: any) {
      console.error('Payment service error:', error);
      throw error;
    }
  }

  async verifyPayment(req: VerifyPaymentReq): Promise<VerifyPaymentRes> {
    const response = await fetch(`${this.baseUrl}/VerifyPayment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = "Failed to verify payment";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const result: VerifyPaymentRes = await response.json();
    return result;
  }
}

