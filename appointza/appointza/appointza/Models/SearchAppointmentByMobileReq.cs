namespace appointza.Models
{
    public class SearchAppointmentByMobileReq
    {
        public long organisationid { get; set; }
        public string mobilenumber { get; set; } = "";
    }
}
