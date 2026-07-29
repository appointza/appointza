namespace appointza.Models
{
    public class ApplicationSettings
    {
        public ApplicationSettingsData settings { get; set; } = new ApplicationSettingsData();
    }

    public class ApplicationSettingsData
    {
        public PaymentSettings paymentsettings { get; set; } = new PaymentSettings();
    }

    public class PaymentSettings
    {
        public RazorpayConfig razorpayconfig { get; set; } = new RazorpayConfig();
        public PhonePeConfig phonepeconfig { get; set; } = new PhonePeConfig();
    }

    public class RazorpayConfig
    {
        public string appkey { get; set; } = string.Empty;
        public string appsecret { get; set; } = string.Empty;
        public string produrl { get; set; } = string.Empty;
    }

    public class PhonePeConfig
    {
        public string url { get; set; } = string.Empty;
        public string basehref { get; set; } = string.Empty;
        public string merchantid { get; set; } = string.Empty;
        public string saltkey { get; set; } = string.Empty;
        public string saltindex { get; set; } = string.Empty;
    }

    public class ApplicationSettingsSelectReq
    {
        // Empty request for now
    }
}

