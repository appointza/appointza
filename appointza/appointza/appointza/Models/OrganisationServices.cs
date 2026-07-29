using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class OrganisationServices
    {
        public long id { get; set; }
public long prize { get; set; }
public long weekday_price  { get; set; }
public long weekend_price  { get; set; }
public long timetaken { get; set; }
public bool is_price_different { get; set; } = false;

                                    public ServicesidsData servicesids { get; set; }
                                    [JsonIgnore]
                                    public string servicesids_json
                                    {
                                        get { return JsonSerializer.Serialize(servicesids); }
                                        set
                                        {
                                            if (!string.IsNullOrEmpty(value) && value != "null")
                                                servicesids = JsonSerializer.Deserialize<ServicesidsData>(value);
                                        }
                                    }
                                
public bool Iscombo { get; set; }
public long offerprize { get; set; }
public string Servicename { get; set; }
public string code { get; set; }
public int version { get; set; }
public bool show_price  { get; set; }
public long createdby { get; set; }
public DateTime createdon { get; set; }
public long modifiedby { get; set; }
public DateTime modifiedon { get; set; }


                                    public AttributesData attributes { get; set; }
                                    [JsonIgnore]
                                    public string attributes_json
                                    {
                                        get { return JsonSerializer.Serialize(attributes); }
                                        set
                                        {
                                            if (!string.IsNullOrEmpty(value) && value != "null")
                                                attributes = JsonSerializer.Deserialize<AttributesData>(value);
                                        }
                                    }
                                
public bool isactive { get; set; }
public bool issuspended { get; set; }
public long organisationid { get; set; }
public bool isfactory { get; set; }

public decimal? rating { get; set; }
public string notes { get; set; }
        
                public class ServicesidsData
                {

            public List<comboids> combolist { get; set; } = new List<comboids>();

        }
       


        public class AttributesData
                {
            public List<long> ImageIds { get; set; } = new List<long>();
                }  
                
    }
    public class  comboids
    {
        public long id { get; set; }
        public string servicename { get; set; }
    }
    public class OrganisationServicesSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
    }
    public class OrganisationServicesDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }
}