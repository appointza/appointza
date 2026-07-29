using System.Text.Json.Serialization;
using System.Text.Json;
namespace appointza.Models
{
    public class Staff
    {
        public long id { get; set; }
public long userid { get; set; }
public long organisationid { get; set; }

                                    public UsersPermissionData roles { get; set; } = new UsersPermissionData();
                                    [JsonIgnore]
                                    public string roles_json
                                    {
                                        get { return JsonSerializer.Serialize(roles); }
                                        set
                                        {
                                            if (!string.IsNullOrEmpty(value) && value != "null")
                                                roles = JsonSerializer.Deserialize<UsersPermissionData>(value);
                                        }
                                    }
                                
public long image { get; set; }
public int version { get; set; }
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
public long organisationlocationid { get; set; }
public bool isfactory { get; set; }
public string notes { get; set; }
        
                public class RolesData
                {

                }  
                

                public class AttributesData
                {

                }  
                
    }

 
    public class StaffSelectReq
    {
        public long id { get; set; }
        public long userid { get; set; }
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
    }
    public class StaffDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
    }


    public class staffuser : Staff
    {
        public string name { get; set; }
        public string email { get; set; }
        public string mobile { get; set; }
        public string mobilecountrycode { get; set; }
        public string designation { get; set; }

        public string locationname { get; set; }
        public string addressline1 { get; set; }
        public string addressline2 { get; set; }
        public string city { get; set; }
        public string state { get; set; }
        public string country { get; set; }
    }
}