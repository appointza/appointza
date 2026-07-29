namespace appointza.Models
{
    public class CreatePaymentOrderReq
    {
        public long organizationid { get; set; }
        public long organisationlocationid { get; set; }
        public long userid { get; set; }
        public decimal amount { get; set; } // This will be ignored - server will recalculate
        public string currency { get; set; } = "INR";
        public string receipt { get; set; }
        public string? appointmentid { get; set; } // Optional: for existing appointments
        public long? eventid { get; set; } // Optional: for event bookings
        public DateTime? appointmentdate { get; set; } // Required for weekend/weekday price calculation
        public List<SelectedService>? servicelist { get; set; } // Required for service-based pricing
    }

    public class CreatePaymentOrderRes
    {
        public string orderid { get; set; }
        public string key { get; set; } // Razorpay key for frontend
        public decimal amount { get; set; }
        public string currency { get; set; }
        public string receipt { get; set; }
    }

    public class VerifyPaymentReq
    {
        public string razorpay_order_id { get; set; }
        public string razorpay_payment_id { get; set; }
        public string razorpay_signature { get; set; }
        public long appointmentid { get; set; }
        public long? eventbookingid { get; set; } // Optional: for event bookings
        public long? organizationid { get; set; } // Optional: for test payments (when appointmentid = 0)
    }

    public class VerifyPaymentRes
    {
        public bool isvalid { get; set; }
        public string message { get; set; }
        public long paymentid { get; set; }
    }
}

