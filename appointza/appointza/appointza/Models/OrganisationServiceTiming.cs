using System.Text.Json.Serialization;
using System.Text.Json;
using System;
namespace appointza.Models
{
    public class OrganisationServiceTiming
    {
        public long id { get; set; }
public long organisationid { get; set; }
public long day_of_week { get; set; }
        public TimeSpan start_time { get; set; } 
        public TimeSpan end_time { get; set; } 

        public int version { get; set; }
public long createdby { get; set; }
public DateTime createdon { get; set; }
public long modifiedby { get; set; }
public DateTime modifiedon { get; set; }

        public long counter { get; set; }
        public long openbefore { get; set; }

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
public long organisationlocationid{ get; set; }
public bool isfactory { get; set; }
public string notes { get; set; }
        
                public class AttributesData
                {

                }  
                
    }
    public class OrganisationServiceTimingSelectReq
    {
        public long id { get; set; }
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }

        public long day_of_week { get; set; }

        public DateTime appointmentdate { get; set; }

    }
    public class OrganisationServiceTimingDeleteReq
    {
        public long id { get; set; }
        public int version { get; set; }
        public long organisationid { get; set; }
        public long organizationlocationid { get; set; }
    }

    public class OrganisationServiceTimingSlotReq
    {
        public long day_of_week { get; set; }
        public string start_time { get; set; } = "";
        public string end_time { get; set; } = "";
    }

    public class OrganisationServiceTimingBulkSaveReq
    {
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        public long counter { get; set; }
        public long openbefore { get; set; }
        public List<OrganisationServiceTimingSlotReq> slots { get; set; } = new List<OrganisationServiceTimingSlotReq>();
    }

    public class OrganisationServiceTimingHasAnyReq
    {
        public long organisationid { get; set; }
    }

    public class CalendarOverviewReq
    {
        public long organisationid { get; set; }
        public long organisationlocationid { get; set; }
        public int year { get; set; }
        public int month { get; set; }
    }

    public class CalendarSlotOverviewItem
    {
        public string fromtime { get; set; }
        public string totime { get; set; }
        public string statuscode { get; set; }
        public string notes { get; set; }
        public int remaining { get; set; }
        public int capacity { get; set; }
        public bool is_within_booking_window { get; set; } = true;
    }

    public class CalendarBookingOverviewItem
    {
        public long id { get; set; }
        public string username { get; set; }
        public string mobile { get; set; }
        public string fromtime { get; set; }
        public string totime { get; set; }
        public string statuscode { get; set; }
        public string servicenames { get; set; }
    }

    public class CalendarDayOverview
    {
        public DateTime date { get; set; }
        public List<CalendarSlotOverviewItem> slots { get; set; } = new List<CalendarSlotOverviewItem>();
        public List<CalendarBookingOverviewItem> bookings { get; set; } = new List<CalendarBookingOverviewItem>();
        public int available_count { get; set; }
        public int booked_slot_count { get; set; }
    }

    public class CalendarOverviewRes
    {
        public List<CalendarDayOverview> days { get; set; } = new List<CalendarDayOverview>();
    }
}