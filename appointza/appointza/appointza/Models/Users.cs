using System.Text.Json.Serialization;
using System.Text.Json;
using Microsoft.CodeAnalysis;
namespace appointza.Models
{
    public class Users
    {
        public long id { get; set; }
        public string name { get; set; }
        public string email { get; set; }
        public string mobile { get; set; }
        public string mobilecountrycode { get; set; }
        public string designation { get; set; }
        public string otp { get; set; }
        public DateTime otpexpirationtime { get; set; }
        public long organisationid { get; set; }
        public long locationid { get; set; }
        public long profileimage { get; set; }
        public int version { get; set; }
        public long createdby { get; set; }
        public DateTime createdon { get; set; }
        public long modifiedby { get; set; }
        public DateTime modifiedon { get; set; }

        public AttributesData attributes { get; set; } = new AttributesData();
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
        public long parentid { get; set; }
        public bool isfactory { get; set; }
        public string notes { get; set; }
        public bool isverified { get; set; }
        public bool accountactive { get; set; }

        public string? push_token { get; set; }
        
        // Platform-specific push tokens
        public string? webpushnotification { get; set; }
        public string? iospushnotification { get; set; }
        public string? androidpushnotification { get; set; }

        public class AttributesData
        {
            public UsersPermissionData permission { get; set; }
        }

    }

    public class UpdatePushTokenRequest
    {
        public long UserId { get; set; }
        public string? PushToken { get; set; }
        public string? Platform { get; set; } // "web", "ios", "android"
    }
    public class UsersPermissionData
    {
        // New editandview privileges (single boolean for each)
        public bool editandviewDashboard { get; set; } = false;
        public bool editandviewAppointments { get; set; } = false;
        public bool editandviewEvents { get; set; } = false;
        public bool editandviewCreateService { get; set; } = false;
        public bool editandviewCreateEvent { get; set; } = false;
        public bool editandviewClients { get; set; } = false;
        public bool editandviewBusinessHours { get; set; } = false;
        public bool editandviewStaffManagement { get; set; } = false;
        public bool editandviewLocationManagement { get; set; } = false;
        public bool editandviewTemplates { get; set; } = false;
        public bool editandviewPaymentSettings { get; set; } = false;
        public bool editandviewBusinessvalues { get; set; } = false;
    }
    public class UsersPermissionGroupData
    {
        public bool view { get; set; }
        public bool manage { get; set; }
    }
    public class UsersSelectReq
    {
        public long id { get; set; }
        public string mobile { get; set; }
        public long organisationid { get; set; }
        public string?  email { get; set; }
        public bool? accountactive { get; set; } 

        
    }
    public class UsersDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long orgnaisationid { get; set; }
    }
    public class UsersRegisterReq
    {
        public long organisationimageid { get; set; }
        public string organisationname { get; set; }
        public string organisationgstnumber { get; set; }
        public long  organisationtype { get; set; }

        public string secondarytypecode { get; set; }
        public long secondarytype { get; set; }
        public long  primarytype { get; set; }
        public string  primarytypecode{ get; set; }

        public string locationname { get; set; }
        public string locationaddressline1 { get; set; }
        public string locationaddressline2 { get; set; }
        public string locationcity { get; set; }
        public string locationstate { get; set; }
        public string locationcountry { get; set; }
        public string locationpincode { get; set; }

        public double latitude { get; set; }
        public double longitude { get; set; }

        public string googlelocation { get; set; }




        public string username { get; set; }
        public string useremail { get; set; }
        public string usermobile { get; set; }
        public string usermobilecountrycode { get; set; }
        public string userdesignation { get; set; }
        public long profileimage { get; set; }
    }
    public class UsersRegisterRes
    {
        public string mobile { get; set; }
        public string name { get; set; }
    }
    public class UsersGetOtpReq
    {
        public string mobile { get; set; }
        public long organisationtype { get; set; }

    }
    public class UsersGetOtpRes
    {
        public string mobile { get; set; }
        public string name { get; set; }
    }
    public class UsersLoginReq
    {
        public string mobile { get; set; }
        public string otp { get; set; }
    }
    public class UsersRefereshTokenReq
    {
        public long userid { get; set; }
        public string refreshtoken { get; set; }
    }
    public class UsersContext
    {
        public long id { get; set; }
        public long userid { get; set; }
        public string usermobile { get; set; }
        public string username { get; set; }
        public string useremail { get; set; }
        public long profileimage { get; set; }
        public UsersPermissionData userpermission { get; set; }
        public long organisationid { get; set; }
        public string organisationname { get; set; }
        public long organisationimageid { get; set; }
        public long organisationtype { get; set; }
        public long organisationlocationid { get; set; }
        public string organisationlocationname { get; set; }
        public bool isStaff { get; set; }
        public string refreshtoken { get; set; }
        public string accesstoken { get; set; }
    }
    public class UserGenerateJwtTokenReq
    {
        public long userid { get; set; }
        public string usermobile { get; set; }
        public string username { get; set; }
        public string useremail { get; set; }
        public long profileimage { get; set; }
        public string permissionhex { get; set; }
        public long organisationid { get; set; }
        public string organisationname { get; set; }
        public long organisationtype { get; set; }
        public long organisationlocationid { get; set; }
        public string organisationlocationname { get; set; }
    }
    public class UsersConnectionRequestReq
    {
        public long organisationid { get; set; }
    }
    public class UsersAcceptConnectionRequestReq
    {
        public long notificationid { get; set; }
    }
    public class UsersDismissConnectionRequestReq
    {
        public long notificationid { get; set; }
    }
    public class UsersDismissNotificationReq
    {
        public long notificationid { get; set; }
    }
    public class UsersGetMergeDesignDataReq
    {
        public long designid { get; set; }
    }
    public class UsersMergeDesign
    {
        public long designid { get; set; }
        public long categoryid { get; set; }
        public long subcategoryid { get; set; }
        public long productid { get; set; }
        public bool issizeset { get; set; }
        public bool iscolourset { get; set; }
        public string designcode { get; set; }
        public decimal price { get; set; }
        public List<long> imagelist { get; set; } = new List<long>();
        public List<UsersMergeDesignAttributeData> attributelist { get; set; } = new List<UsersMergeDesignAttributeData>();
        public List<UsersMergeDesignAttributeData> colourlist { get; set; } = new List<UsersMergeDesignAttributeData>();
        public List<UsersMergeDesignAttributeData> sizelist { get; set; } = new List<UsersMergeDesignAttributeData>();
        public List<UsersMergeDesignSkuData> skulist { get; set; } = new List<UsersMergeDesignSkuData>();
    }
    public class UsersMergeDesignSkuData
    {
        public long colourid { get; set; }
        public string colourname { get; set; }
        public long colourimage { get; set; }
        public long sizeid { get; set; }
        public string sizename { get; set; }
        public decimal price { get; set; }
    }
    public class UsersMergeDesignAttributeData
    {
        public long attributeid { get; set; }
        public string attributename { get; set; }
        public long attributevalueid { get; set; }
        public string attributevaluename { get; set; }
        public long attributevalueimage { get; set; }
    }
    public class UsersAddColourSetToCartReq
    {
        public long designid { get; set; }
        public decimal quantity { get; set; }
    }
    public class UserAddSizeSetToCartReq
    {
        public long designid { get; set; }
        public long colourid { get; set; }
        public decimal quantity { get; set; }
    }
    public class UserAddToCartReq
    {
        public long designid { get; set; }
        public long skuid { get; set; }
        public decimal quantity { get; set; }
    }
    public class UserUpdateOrderStatusReq
    {
        public long orderid { get; set; }
    }
    public class UsersSupplierInviteScreenReq
    {
        public string searchstring { get; set; }
    }
    public class UsersSupplierInviteScreenRes
    {
        public long organisationid { get; set; }
        public string organisationname { get; set; }
        public Organisation.AttributesData organisationattributes { get; set; }
        public string organisationattributes_json
        {
            get { return JsonSerializer.Serialize(organisationattributes); }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                    organisationattributes = JsonSerializer.Deserialize<Organisation.AttributesData>(value);
            }
        }
        public bool isconnected { get; set; }
        public bool isrequested { get; set; }
    }
    public class UsersRetailerInviteScreenReq
    {
        public string searchstring { get; set; }
    }
    public class UsersRetailerInviteScreenRes
    {
        public long organisationid { get; set; }
        public string organisationname { get; set; }
        public Organisation.AttributesData organisationattributes { get; set; }
        public string organisationattributes_json
        {
            get { return JsonSerializer.Serialize(organisationattributes); }
            set
            {
                if (!string.IsNullOrEmpty(value) && value != "null")
                    organisationattributes = JsonSerializer.Deserialize<Organisation.AttributesData>(value);
            }
        }
        public bool isconnected { get; set; }
        public bool isrequested { get; set; }
    }
    public class UsersMessageSendReq
    {
        public long chatroomid { get; set; }
    }
    public class UsersMessageDeliveredReq
    {
        public long messageid { get; set; }
        public long userid { get; set; }
        public long messagememberstatusmemberid { get; set; }
    }
    public class UsersMessageReadReq
    {
        public long messageid { get; set; }
        public long messagememberstatusmemberid { get; set; }
    }
    public class UsersUpdateOrganisationImageReq
    {
        public long imageid { get; set; }
    }
    public class UserAddedAccountsReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }


    }

    public class UserAddedAccountsRes
    {
        public long id { get; set; }
        public string name { get; set; }
        public string mobile { get; set; }
        public string designation { get; set; }
        public string locationname { get; set; }
        public long organisationimageid { get; set; }
        public long profileimage { get; set; }
        public AttributesData attributes { get; set; } = new AttributesData();
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
        public class AttributesData
        {
            public UsersPermissionData permission { get; set; }
        }
    }

    public class UsersAddColourSetToOrderReq
    {
        public long orderid { get; set; }
        public long designid { get; set; }
        public decimal quantity { get; set; }
    }
    public class UserAddSizeSetToOrderReq
    {
        public long orderid { get; set; }
        public long designid { get; set; }
        public long colourid { get; set; }
        public decimal quantity { get; set; }

    }
    public class UserAddToOrderReq
    {
        public long orderid { get; set; }
        public long designid { get; set; }
        public long skuid { get; set; }
        public decimal quantity { get; set; }
    }
    public class UserNotificationScreenReq
    {

    }

    public class UsersMergeBroadcast
    {
        public long broadcastid { get; set; }
        public string broadcastname { get; set; }
        public List<UsersMergeBroadcastChatroomData> chatroomlist { get; set; } = new List<UsersMergeBroadcastChatroomData>();
    }
    public class UsersMergeBroadcastChatroomData
    {
        public long chatroomid { get; set; }
        public long retailerorganisationid { get; set; }
        public string retailerorganisationname { get; set; }
        public long retailerorganisationimageid { get; set; }        
    }
    public class UsersGetMergeBroadcastReq
    {
        public long broadcastid { get; set; }
    }

    public class Organisationdeletereq
    {
        public long organisationid { get; set; }

        public long userid { get; set; }

        public string otp { get; set; }
    }

    public class UserDetailsWithOrganisationRes
    {
        public Users user { get; set; }
        public Organisation organisation { get; set; }
        public List<OrganisationLocation> locations { get; set; } = new List<OrganisationLocation>();
    }
}