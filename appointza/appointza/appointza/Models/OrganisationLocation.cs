using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class OrganisationLocation
    {
        public long id { get; set; }
public long organisationid { get; set; }
public string name { get; set; }
public string addressline1 { get; set; }
public string addressline2 { get; set; }
public string city { get; set; }
public string state { get; set; }
public string country { get; set; }
public double latitude { get; set; }
public double longitude { get; set; }
public string googlelocation { get; set; }
public string geolocation_url { get; set; } = "";
public string pincode { get; set; }
public string customurl { get; set; } = "";
public long templateid { get; set; }
public int version { get; set; }
public long createdby { get; set; }
public DateTime createdon { get; set; }
public long modifiedby { get; set; }
public DateTime modifiedon { get; set; }

        public List<long> images { get; set; } = new List<long>();

                                    [JsonIgnore]
                                    public string images_json
                                    {
                                        get { return JsonSerializer.Serialize(images); }
                                        set
                                        {
                                            if (!string.IsNullOrEmpty(value) && value != "null")
                                                images = JsonSerializer.Deserialize<List<long>>(value);
                                        }
                                    }

        [JsonPropertyName("facility_list")]
        public List<long> facility_list { get; set; } = new List<long>();

                                    [JsonIgnore]
                                    public string facility_list_json
                                    {
                                        get { return JsonSerializer.Serialize(facility_list); }
                                        set
                                        {
                                            if (!string.IsNullOrEmpty(value) && value != "null")
                                                facility_list = JsonSerializer.Deserialize<List<long>>(value) ?? new List<long>();
                                            else
                                                facility_list = new List<long>();
                                        }
                                    }

                                    public AttributesData attributes { get; set; } = new AttributesData();
                                    [JsonIgnore]
                                    public string attributes_json
                                    {
                                        get { return JsonSerializer.Serialize(attributes); }
                                        set
                                        {
                                            if (!string.IsNullOrEmpty(value) && value != "null")
                                                attributes = JsonSerializer.Deserialize<AttributesData>(value) ?? new AttributesData();
                                        }
                                    }
                                
public bool isactive { get; set; }
public bool issuspended { get; set; }
public long parentid { get; set; }
public bool isfactory { get; set; }
public string notes { get; set; }
public bool isverified { get; set; }
public bool isPaymentRequired { get; set; }
public string email { get; set; } = "";
public string whatsapp_mobile { get; set; } = "";
        
                public class AttributesData
                {
                    [JsonPropertyName("video_urls")]
                    public List<string> video_urls { get; set; } = new List<string>();
                }  
                
    }
    public class OrganisationLocationSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
    }
    public class OrganisationLocationDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long orgnaisationid {  get; set; }
    }

    public class UpdateLocationTemplateIdReq
    {
        public long organisationlocationid { get; set; }
        public long templateid { get; set; }
    }

    public class UpdateLocationMediaReq
    {
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        public List<long> images { get; set; } = new List<long>();
        public List<string> video_urls { get; set; } = new List<string>();
    }

    public class OrgLocationStaffReq
    {
        public long orglocid { get; set; }
    }

    public class orgnisationlocationstaffreq
    {
        public long userid { get; set; }
    }

    public class orgnisationlocationstaffres
    {
        public long organisationid { get; set; }
        public string name { get; set; }
        public long organisationlocationid { get; set; }
    }



    public class OrgLocationStaffRequest
    {
        public string BusinessName { get; set; }
        public string Area { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string PostalCode { get; set; }
        public List<int> ServiceIds { get; set; } // A list of service IDs to filter by
    }

    // Response model - for the response returned from the method
    public class OrgLocationStaffResponse
    {
        public string BusinessName { get; set; }
        public string StreetName { get; set; }
        public string Area { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string PostalCode { get; set; }
        public List<Service> Services { get; set; } = new List<Service>();
        public List<Timing> Timings { get; set; } = new List<Timing>();
    }

    // Service model - for services offered by the business
    public class Service
    {
        public string ServiceName { get; set; }
        public decimal Price { get; set; }
        public decimal OfferPrice { get; set; }
        public int Duration { get; set; } // Duration in minutes
    }

    // Timing model - for opening hours of the business
    public class Timing
    {
        public int Day { get; set; } // Day of the week (1 = Monday, 2 = Tuesday, etc.)
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }


    public class AppointmentPaymentsummary
    {
        public int totalappointments { get; set; }
        public int confirmedcount { get; set; }
        public int completedcount { get; set; }
        public List<PaymentSummary> paymentsummary { get; set; }
    }

    public class PaymentSummary
    {
        public string paymentmodetype { get; set; }
        public decimal totalamount { get; set; }
    }
    public class UsersGenerateQRCodeReq
    {
        public long organisationid { get; set; }
        public long locationid { get; set; }
    }

    public class UsersGenerateQRCodeRes
    {
        public string qrcodebase64string { get; set; }
    }
    public class QrcodeDataRes
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public string name { get; set; }
        public string addressline1 { get; set; }
        public string addressline2 { get; set; }
        public string city { get; set; }
        public string state { get; set; }
        public string country { get; set; }
        public double latitude { get; set; }
        public double longitude { get; set; }
        public string googlelocation { get; set; }
        public string pincode { get; set; }
        public string customurl { get; set; }
        public List<long> images { get; set; } = new List<long>();
    }



}