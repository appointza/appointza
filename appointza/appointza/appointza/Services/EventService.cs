using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class EventService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        private static string TimeSpanFromReader(object dbVal)
        {
            if (dbVal == null || dbVal == DBNull.Value) return "";
            if (dbVal is TimeSpan ts) return ts.ToString(@"hh\:mm");
            return dbVal.ToString() ?? "";
        }

        private static object ToTimeDbParam(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return DBNull.Value;
            var trimmed = value.Trim();
            if (TimeSpan.TryParse(trimmed, out var ts)) return ts;
            string[] formats = { @"h\:m", @"hh\:mm", @"H\:m", @"HH\:mm", @"h\:m\:s", @"hh\:mm\:ss" };
            if (TimeSpan.TryParseExact(trimmed, formats, null, out ts)) return ts;
            return DBNull.Value;
        }

        private static DateTime? ToCalendarDate(DateTime? value)
        {
            return value.HasValue ? value.Value.Date : null;
        }
        
        public EventService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        
        public async Task<List<Event>> Select(EventSelectReq req)
        {
            List<Event> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }
        
        public async Task<List<Event>> SelectTransaction(IDb db, EventSelectReq req)
        {
            List<Event> result = new List<Event>();
            // Calculate remaining slots by counting active bookings against event_id
            // Formula: remainingslot = slot_limit - (sum of number_of_people from active bookings)
            string query = @"
                SELECT 
                    events.id,
                    events.organisation_id,
                    events.organisation_location_id,
                    events.event_name,
                    events.event_type,
                    events.event_date,
                    events.from_date,
                    events.to_date,
                    events.start_time,
                    events.end_time,
                    events.timing_config,
                    events.payment_type,
                    events.entry_amount,
                    events.slot_limit,
                    GREATEST(0, events.slot_limit - COALESCE((
                        SELECT SUM(number_of_people) 
                        FROM event_bookings 
                        WHERE event_bookings.event_id = events.id 
                        AND event_bookings.isactive = TRUE
                    ), 0)) as remainingslot,
                    events.dress_code,
                    events.location,
                    events.description,
                    events.images,
                    events.is_public,
                    events.status,
                    events.rating,
                    events.created_by,
                    events.created_at,
                    events.updated_at,
                    events.notes,
                    events.isactive
                FROM events
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            // Always filter by isactive = TRUE
            queryBuilder.AddParameter("events.isactive", "=", "isactive", true, DbTypes.Types.Boolean);
            
            // Public browse passes is_public = true. Org management can pass false to include private events.
            if (req.is_public)
            {
                queryBuilder.AddParameter("events.is_public", "=", "is_public", true, DbTypes.Types.Boolean);
            }
            
            // Exclude cancelled and completed events using condition strings
            queryBuilder.AddParameter("events.status != @status_cancelled", "status_cancelled", "cancelled", DbTypes.Types.String);
            queryBuilder.AddParameter("events.status != @status_completed", "status_completed", "completed", DbTypes.Types.String);

            // Only add filters if specific IDs are provided
            if (req.id > 0)
            {
                queryBuilder.AddParameter("events.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.organisation_id > 0)
            {
                queryBuilder.AddParameter("events.organisation_id", "=", "organisation_id", req.organisation_id, DbTypes.Types.Integer);
            }
            if (req.organisation_location_id > 0)
            {
                queryBuilder.AddParameter("events.organisation_location_id", "=", "organisation_location_id", req.organisation_location_id, DbTypes.Types.Integer);
            }
            
            if (!string.IsNullOrWhiteSpace(req.status))
            {
                queryBuilder.AddParameter("events.status", "=", "status", req.status, DbTypes.Types.String);
            }
            
            // By default, hide past events. Organization management screens can request include_past = true.
            // Compare calendar dates (start of today), not full UtcNow timestamps — otherwise today's
            // date-only event_date (midnight) is treated as already past after 00:00 UTC.
            if (!req.include_past)
            {
                var today = DateTime.UtcNow.Date;
                string dateFilterCondition = @"
                    (
                        (events.event_date IS NOT NULL AND events.event_date::date >= @current_date) OR
                        (events.from_date IS NOT NULL AND events.to_date IS NOT NULL AND events.to_date::date >= @current_date) OR
                        (events.from_date IS NOT NULL AND events.to_date IS NULL AND events.from_date::date >= @current_date) OR
                        (events.event_date IS NULL AND events.from_date IS NULL AND events.to_date IS NULL)
                    )
                ";
                queryBuilder.AddParameter(dateFilterCondition, "current_date", today, DbTypes.Types.DateTime);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "events.event_date, events.from_date");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Event temp = new Event();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.organisation_id = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt32(reader["organisation_id"]);
                    temp.organisation_location_id = reader["organisation_location_id"] == DBNull.Value ? 0 : Convert.ToInt32(reader["organisation_location_id"]);
                    temp.event_name = reader["event_name"] == DBNull.Value ? "" : reader["event_name"].ToString();
                    temp.event_type = reader["event_type"] == DBNull.Value ? "" : reader["event_type"].ToString();
                    temp.event_date = ToCalendarDate(reader["event_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["event_date"]));
                    temp.from_date = ToCalendarDate(reader["from_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["from_date"]));
                    temp.to_date = ToCalendarDate(reader["to_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["to_date"]));
                    temp.start_time = TimeSpanFromReader(reader["start_time"]);
                    temp.end_time = TimeSpanFromReader(reader["end_time"]);
                    temp.timing_config_json = reader["timing_config"] == DBNull.Value ? "null" : reader["timing_config"].ToString();
                    temp.payment_type = reader["payment_type"] == DBNull.Value ? "" : reader["payment_type"].ToString();
                    temp.entry_amount = reader["entry_amount"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["entry_amount"]);
                    temp.slot_limit = reader["slot_limit"] == DBNull.Value ? 0 : Convert.ToInt32(reader["slot_limit"]);
                    temp.remainingslot = reader["remainingslot"] == DBNull.Value ? 0 : Convert.ToInt64(reader["remainingslot"]);
                    temp.dress_code = reader["dress_code"] == DBNull.Value ? "" : reader["dress_code"].ToString();
                    temp.location = reader["location"] == DBNull.Value ? "" : reader["location"].ToString();
                    temp.description = reader["description"] == DBNull.Value ? "" : reader["description"].ToString();
                    temp.images_json = reader["images"] == DBNull.Value ? "null" : reader["images"].ToString();
                    temp.is_public = reader["is_public"] == DBNull.Value ? true : Convert.ToBoolean(reader["is_public"]);
                    temp.status = reader["status"] == DBNull.Value ? "active" : reader["status"].ToString();
                    temp.rating = reader["rating"] == DBNull.Value ? null : Convert.ToDecimal(reader["rating"]);
                    temp.created_by = reader["created_by"] == DBNull.Value ? 0 : Convert.ToInt32(reader["created_by"]);
                    temp.created_at = reader["created_at"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["created_at"]);
                    temp.updated_at = reader["updated_at"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["updated_at"]);
                    temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    temp.isactive = reader["isactive"] == DBNull.Value ? true : Convert.ToBoolean(reader["isactive"]);
                    result.Add(temp);
                }
            }
            return result;
        }
        
        public async Task<Event> Insert(Event eventItem)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, eventItem);
            }
            return eventItem;
        }
        
        public async Task InsertTransaction(IDb db, Event eventItem)
        {
            String query = @"
                INSERT INTO events (
                    organisation_id,organisation_location_id,event_name,event_type,event_date,from_date,to_date,start_time,end_time,timing_config,payment_type,entry_amount,slot_limit,remainingslot,dress_code,location,description,images,is_public,status,rating,created_by,created_at,updated_at,notes,isactive
                )
                VALUES (
                   @organisation_id,@organisation_location_id,@event_name,@event_type,@event_date,@from_date,@to_date,@start_time,@end_time,@timing_config,@payment_type,@entry_amount,@slot_limit,@remainingslot,@dress_code,@location,@description,@images,@is_public,@status,@rating,@created_by,@created_at,@updated_at,@notes,@isactive
                )
                RETURNING id;
                ";
            
            eventItem.status = string.IsNullOrEmpty(eventItem.status) ? "active" : eventItem.status;
            eventItem.is_public = eventItem.is_public;
            eventItem.created_at = DateTime.UtcNow;
            eventItem.created_by = (int)requeststate.usercontext.id;
            eventItem.updated_at = DateTime.UtcNow;
            eventItem.isactive = true; // Always set to active when creating
            // Always set remainingslot to slot_limit when creating event
            if (eventItem.slot_limit > 0)
            {
                eventItem.remainingslot = eventItem.slot_limit;
            }
            else
            {
                eventItem.remainingslot = 0;
            }

            eventItem.event_date = ToCalendarDate(eventItem.event_date);
            eventItem.from_date = ToCalendarDate(eventItem.from_date);
            eventItem.to_date = ToCalendarDate(eventItem.to_date);

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "organisation_id", DbTypes.Types.Integer).Value = eventItem.organisation_id;
            db.AddParameter(command, "organisation_location_id", DbTypes.Types.Integer).Value = eventItem.organisation_location_id;
            db.AddParameter(command, "event_name", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.event_name) ? "" : eventItem.event_name;
            db.AddParameter(command, "event_type", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.event_type) ? "single" : eventItem.event_type;
            db.AddParameter(command, "event_date", DbTypes.Types.DateTime).Value = eventItem.event_date.HasValue ? (object)eventItem.event_date.Value : DBNull.Value;
            db.AddParameter(command, "from_date", DbTypes.Types.DateTime).Value = eventItem.from_date.HasValue ? (object)eventItem.from_date.Value : DBNull.Value;
            db.AddParameter(command, "to_date", DbTypes.Types.DateTime).Value = eventItem.to_date.HasValue ? (object)eventItem.to_date.Value : DBNull.Value;
            db.AddParameter(command, "start_time", DbTypes.Types.Time).Value = ToTimeDbParam(eventItem.start_time);
            db.AddParameter(command, "end_time", DbTypes.Types.Time).Value = ToTimeDbParam(eventItem.end_time);
            db.AddParameter(command, "timing_config", DbTypes.Types.Json).Value = eventItem.timing_config_json;
            db.AddParameter(command, "payment_type", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.payment_type) ? "userpay" : eventItem.payment_type;
            db.AddParameter(command, "entry_amount", DbTypes.Types.Decimal).Value = eventItem.entry_amount;
            db.AddParameter(command, "slot_limit", DbTypes.Types.Integer).Value = eventItem.slot_limit;
            db.AddParameter(command, "remainingslot", DbTypes.Types.Long).Value = eventItem.remainingslot;
            db.AddParameter(command, "dress_code", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.dress_code) ? "" : eventItem.dress_code;
            db.AddParameter(command, "location", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.location) ? "" : eventItem.location;
            db.AddParameter(command, "description", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.description) ? "" : eventItem.description;
            db.AddParameter(command, "images", DbTypes.Types.Json).Value = eventItem.images_json;
            db.AddParameter(command, "is_public", DbTypes.Types.Boolean).Value = eventItem.is_public;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.status) ? "active" : eventItem.status;
            db.AddParameter(command, "rating", DbTypes.Types.Decimal).Value = eventItem.rating.HasValue ? (object)eventItem.rating.Value : DBNull.Value;
            db.AddParameter(command, "created_by", DbTypes.Types.Integer).Value = eventItem.created_by;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = eventItem.created_at;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = eventItem.updated_at;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.notes) ? "" : eventItem.notes;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = eventItem.isactive;
            
            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    eventItem.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }
        
        public async Task<Event> Update(Event eventItem)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, eventItem);
            }
            return eventItem;
        }
        
        public async Task<bool> UpdateTransaction(IDb db, Event eventItem)
        {
            bool result = false;
            
            // Check if there are any active bookings for this event
            string checkBookingsQuery = @"
                SELECT COUNT(*) as booking_count
                FROM event_bookings
                WHERE event_id = @event_id AND isactive = TRUE
            ";
            
            DbCommand checkCommand = db.GetCommand(checkBookingsQuery);
            db.AddParameter(checkCommand, "event_id", DbTypes.Types.Long).Value = eventItem.id;
            
            int bookingCount = 0;
            using (DbDataReader reader = await db.Execute(checkCommand))
            {
                if (await reader.ReadAsync())
                {
                    bookingCount = reader["booking_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["booking_count"]);
                }
            }
            
            // Don't allow editing if there are any bookings
            if (bookingCount > 0)
            {
                throw new Exception($"Cannot edit event. There are {bookingCount} active booking(s) registered for this event. Events with bookings cannot be edited.");
            }
            
            String query = @"
                UPDATE events
                    SET 
                        organisation_id = @organisation_id,organisation_location_id = @organisation_location_id,event_name = @event_name,event_type = @event_type,event_date = @event_date,from_date = @from_date,to_date = @to_date,start_time = @start_time,end_time = @end_time,timing_config = @timing_config,payment_type = @payment_type,entry_amount = @entry_amount,slot_limit = @slot_limit,remainingslot = @remainingslot,dress_code = @dress_code,location = @location,description = @description,images = @images,is_public = @is_public,status = @status,rating = @rating,updated_at = @updated_at,notes = @notes,isactive = @isactive
                WHERE id = @id
                ";
            
            eventItem.updated_at = DateTime.UtcNow;

            eventItem.event_date = ToCalendarDate(eventItem.event_date);
            eventItem.from_date = ToCalendarDate(eventItem.from_date);
            eventItem.to_date = ToCalendarDate(eventItem.to_date);
            
            DbCommand command = db.GetCommand(query);
            
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = eventItem.id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Integer).Value = eventItem.organisation_id;
            db.AddParameter(command, "organisation_location_id", DbTypes.Types.Integer).Value = eventItem.organisation_location_id;
            db.AddParameter(command, "event_name", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.event_name) ? "" : eventItem.event_name;
            db.AddParameter(command, "event_type", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.event_type) ? "single" : eventItem.event_type;
            db.AddParameter(command, "event_date", DbTypes.Types.DateTime).Value = eventItem.event_date.HasValue ? (object)eventItem.event_date.Value : DBNull.Value;
            db.AddParameter(command, "from_date", DbTypes.Types.DateTime).Value = eventItem.from_date.HasValue ? (object)eventItem.from_date.Value : DBNull.Value;
            db.AddParameter(command, "to_date", DbTypes.Types.DateTime).Value = eventItem.to_date.HasValue ? (object)eventItem.to_date.Value : DBNull.Value;
            db.AddParameter(command, "start_time", DbTypes.Types.Time).Value = ToTimeDbParam(eventItem.start_time);
            db.AddParameter(command, "end_time", DbTypes.Types.Time).Value = ToTimeDbParam(eventItem.end_time);
            db.AddParameter(command, "timing_config", DbTypes.Types.Json).Value = eventItem.timing_config_json;
            db.AddParameter(command, "payment_type", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.payment_type) ? "userpay" : eventItem.payment_type;
            db.AddParameter(command, "entry_amount", DbTypes.Types.Decimal).Value = eventItem.entry_amount;
            db.AddParameter(command, "slot_limit", DbTypes.Types.Integer).Value = eventItem.slot_limit;
            db.AddParameter(command, "remainingslot", DbTypes.Types.Long).Value = eventItem.remainingslot;
            db.AddParameter(command, "dress_code", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.dress_code) ? "" : eventItem.dress_code;
            db.AddParameter(command, "location", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.location) ? "" : eventItem.location;
            db.AddParameter(command, "description", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.description) ? "" : eventItem.description;
            db.AddParameter(command, "images", DbTypes.Types.Json).Value = eventItem.images_json;
            db.AddParameter(command, "is_public", DbTypes.Types.Boolean).Value = eventItem.is_public;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.status) ? "active" : eventItem.status;
            db.AddParameter(command, "rating", DbTypes.Types.Decimal).Value = eventItem.rating.HasValue ? (object)eventItem.rating.Value : DBNull.Value;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = eventItem.updated_at;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(eventItem.notes) ? "" : eventItem.notes;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = eventItem.isactive;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }
        
        public async Task<bool> Delete(EventDeleteReq eventDeleteReq)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, eventDeleteReq);
            }
            return result;
        }
        
        public async Task<bool> DeleteTransaction(IDb db, EventDeleteReq eventDeleteReq)
        {
            bool result = false;
            
            // First, get event details to check event date
            string getEventQuery = @"
                SELECT event_type, event_date, from_date, to_date
                FROM events
                WHERE id = @event_id
            ";
            
            DbCommand getEventCommand = db.GetCommand(getEventQuery);
            db.AddParameter(getEventCommand, "event_id", DbTypes.Types.Long).Value = eventDeleteReq.id;
            
            string eventType = "";
            DateTime? eventDate = null;
            DateTime? fromDate = null;
            DateTime? toDate = null;
            
            using (DbDataReader reader = await db.Execute(getEventCommand))
            {
                if (await reader.ReadAsync())
                {
                    eventType = reader["event_type"] == DBNull.Value ? "" : reader["event_type"].ToString();
                    eventDate = reader["event_date"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(reader["event_date"]);
                    fromDate = reader["from_date"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(reader["from_date"]);
                    toDate = reader["to_date"] == DBNull.Value ? null : (DateTime?)Convert.ToDateTime(reader["to_date"]);
                }
            }
            
            // Check if there are any active bookings for this event
            string checkBookingsQuery = @"
                SELECT COUNT(*) as booking_count
                FROM event_bookings
                WHERE event_id = @event_id AND isactive = TRUE
            ";
            
            DbCommand checkCommand = db.GetCommand(checkBookingsQuery);
            db.AddParameter(checkCommand, "event_id", DbTypes.Types.Long).Value = eventDeleteReq.id;
            
            int bookingCount = 0;
            using (DbDataReader reader = await db.Execute(checkCommand))
            {
                if (await reader.ReadAsync())
                {
                    bookingCount = reader["booking_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["booking_count"]);
                }
            }
            
            // If there are bookings, check if event date is in the future
            if (bookingCount > 0)
            {
                DateTime today = DateTime.UtcNow.Date;
                bool isEventInFuture = false;
                
                // Check based on event type
                if (eventType == "single" && eventDate.HasValue)
                {
                    isEventInFuture = eventDate.Value.Date > today;
                }
                else if (eventType == "range" && fromDate.HasValue)
                {
                    isEventInFuture = fromDate.Value.Date > today;
                }
                else if (eventType == "daily")
                {
                    // For daily events, check if there are any future dates
                    // Since daily events don't have a specific end date, we consider them as ongoing
                    isEventInFuture = true; // Assume daily events are ongoing
                }
                
                // If event is in the future (before the day), don't allow deletion
                if (isEventInFuture)
                {
                    throw new Exception($"Cannot delete event. There are {bookingCount} active booking(s) registered for this event and the event date is in the future. Events with bookings cannot be deleted before the event day.");
                }
            }
            
            // Soft delete: Set isactive = false instead of deleting
            String query = @"
                UPDATE events
                SET isactive = FALSE, updated_at = @updated_at
                WHERE id = @id
                ";
            
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = eventDeleteReq.id;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            
            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }
    }
}

