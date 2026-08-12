using appointza.Models;
using appointza.Authentication.Services;
using appointza.FirebaseNotification.Services;
using appointza.Sms.Services;
using appointza.Sms.Models;
using appointza.Utils;
using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Linq;
using System.Text.Json;

namespace appointza.Services
{
    public class OrganisationServiceTimingService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        OrganisationServicesService organisationservicesservice;
        AppoinmentService appoinmentService;
        LeaveDatesService leaveDatesService;
        FirebaseNotificationService firebaseNotificationService;
        OrganisationService organisationService;
        UsersService usersService;
        OrganisationLocationService organisationLocationService;
        Sms.Services.SmsService smsService;
        
        public OrganisationServiceTimingService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate, OrganisationServicesService organisationservicesservice, AppoinmentService appoinmentService, LeaveDatesService leaveDatesService, FirebaseNotificationService firebaseNotificationService, OrganisationService organisationService, UsersService usersService, OrganisationLocationService organisationLocationService, Sms.Services.SmsService smsService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.organisationservicesservice = organisationservicesservice;
            this.appoinmentService = appoinmentService;
            this.leaveDatesService = leaveDatesService;
            this.firebaseNotificationService = firebaseNotificationService;
            this.organisationService = organisationService;
            this.usersService = usersService;
            this.organisationLocationService = organisationLocationService;
            this.smsService = smsService;
        }
        public async Task<List<OrganisationServiceTiming>> Select(OrganisationServiceTimingSelectReq req)
        {
            List<OrganisationServiceTiming> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.SelectTransaction(db, req);
                }
            return result;
        }
        public async Task<List<OrganisationServiceTiming>> SelectTransaction(IDb db, OrganisationServiceTimingSelectReq req)
        {
            List<OrganisationServiceTiming> result = new List<OrganisationServiceTiming>();
                string query = @"
                SELECT OrganisationServiceTiming.id,OrganisationServiceTiming.organisationid,OrganisationServiceTiming.day_of_week,OrganisationServiceTiming.start_time,OrganisationServiceTiming.end_time,OrganisationServiceTiming.version,OrganisationServiceTiming.createdby,OrganisationServiceTiming.createdon,OrganisationServiceTiming.modifiedby,OrganisationServiceTiming.modifiedon,OrganisationServiceTiming.attributes,OrganisationServiceTiming.isactive,OrganisationServiceTiming.issuspended,OrganisationServiceTiming.organisationlocationid,OrganisationServiceTiming.isfactory,OrganisationServiceTiming.notes
,OrganisationServiceTiming.openbefore,OrganisationServiceTiming.counter
                FROM OrganisationServiceTiming
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("OrganisationServiceTiming.id", "=", "id", req.id, DbTypes.Types.Long);
                }
            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("OrganisationServiceTiming.organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }
            if (req.organisationlocationid > 0)
            {
                queryBuilder.AddParameter("OrganisationServiceTiming.organisationlocationid", "=", "organisationlocationid", req.organisationlocationid, DbTypes.Types.Long);
            }
            if (req.day_of_week > 0)
            {
                queryBuilder.AddParameter("OrganisationServiceTiming.day_of_week ", "=", "day_of_week", req.day_of_week, DbTypes.Types.Long);
            }
            queryBuilder.AddParameter("OrganisationServiceTiming.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "OrganisationServiceTiming.id");
                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        OrganisationServiceTiming temp = new OrganisationServiceTiming();
                         temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                         temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                         temp.day_of_week = reader["day_of_week"] == DBNull.Value ? 0 : Convert.ToInt64(reader["day_of_week"]);
                         temp.start_time = reader["start_time"] == DBNull.Value? TimeSpan.Zero : (TimeSpan)reader["start_time"];
                         temp.end_time = reader["end_time"] == DBNull.Value? TimeSpan.Zero : (TimeSpan)reader["end_time"];      
                    temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
 temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
 temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
 temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
 temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
 temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
 temp.isfactory = reader["isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfactory"]);
temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    temp.counter = reader["counter"] == DBNull.Value ? 0 : Convert.ToInt64(reader["counter"]);
                    temp.openbefore = reader["openbefore"] == DBNull.Value ? 0 : Convert.ToInt64(reader["openbefore"]);
                    result.Add(temp);
                    }
                }
            return result;
        }
        public async Task<OrganisationServiceTiming> Insert(OrganisationServiceTiming organisationservicetiming)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.InsertTransaction(db, organisationservicetiming);
                }
            return organisationservicetiming;
        }
        public async Task InsertTransaction(IDb db, OrganisationServiceTiming organisationservicetiming)
        {
                String query = @"
                INSERT INTO OrganisationServiceTiming (
                    organisationid,day_of_week,start_time,end_time,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,organisationlocationid,isfactory,notes,counter,openbefore
                )
                VALUES (
                   @organisationid,@day_of_week,@start_time,@end_time,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@organisationlocationid,@isfactory,@notes,@counter,@openbefore
                )
                RETURNING id;
                ";
                organisationservicetiming.isactive = true;
                organisationservicetiming.version = 1;
                organisationservicetiming.createdon = DateTime.UtcNow;
                organisationservicetiming.createdby = requeststate.usercontext.id;
                organisationservicetiming.modifiedon = DateTime.UtcNow;
                organisationservicetiming.modifiedby = requeststate.usercontext.id;

                DbCommand command = db.GetCommand(query);

                db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = organisationservicetiming.organisationid;
db.AddParameter(command, "day_of_week", DbTypes.Types.Long).Value = organisationservicetiming.day_of_week;
db.AddParameter(command, "start_time", DbTypes.Types.Time).Value = organisationservicetiming.start_time;
db.AddParameter(command, "end_time", DbTypes.Types.Time).Value = organisationservicetiming.end_time;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisationservicetiming.version;
db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = organisationservicetiming.createdby;
db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = organisationservicetiming.createdon;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organisationservicetiming.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organisationservicetiming.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organisationservicetiming.attributes_json;
db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = organisationservicetiming.isactive;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organisationservicetiming.issuspended;
db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = organisationservicetiming.organisationlocationid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organisationservicetiming.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationservicetiming.notes) ? "" : organisationservicetiming.notes;
            db.AddParameter(command, "counter", DbTypes.Types.Long).Value = organisationservicetiming.counter;
            db.AddParameter(command, "openbefore", DbTypes.Types.Long).Value = organisationservicetiming.openbefore;
            using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        organisationservicetiming.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                }
            }
        public async Task<OrganisationServiceTiming> Update(OrganisationServiceTiming organisationservicetiming)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.UpdateTransaction(db, organisationservicetiming);
                }
            return organisationservicetiming;
        }
        public async Task<bool> UpdateTransaction(IDb db, OrganisationServiceTiming organisationservicetiming)
        {
            bool result = false;
                String query = @"
                UPDATE OrganisationServiceTiming
                    SET 
                        organisationid = @organisationid,day_of_week = @day_of_week,start_time = @start_time,end_time = @end_time,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,organisationlocationid = @organisationlocationid,isfactory = @isfactory,notes = @notes,counter=@counter,openbefore=@openbefore,
                        version = version + 1
                ";
                
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

                queryBuilder.AddParameter("id", "=", "id", organisationservicetiming.id, DbTypes.Types.Long);

                if (organisationservicetiming.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", organisationservicetiming.version, DbTypes.Types.Integer);
                }

                var command = queryBuilder.GetCommand(db);
                
                organisationservicetiming.modifiedon = DateTime.UtcNow;
                organisationservicetiming.modifiedby = requeststate.usercontext.id;
                
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationservicetiming.id;
db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = organisationservicetiming.organisationid;
db.AddParameter(command, "day_of_week", DbTypes.Types.Long).Value = organisationservicetiming.day_of_week;
db.AddParameter(command, "start_time", DbTypes.Types.Time).Value = organisationservicetiming.start_time;
db.AddParameter(command, "end_time", DbTypes.Types.Time).Value = organisationservicetiming.end_time;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisationservicetiming.version;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organisationservicetiming.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organisationservicetiming.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organisationservicetiming.attributes_json;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organisationservicetiming.issuspended;
db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = organisationservicetiming.organisationlocationid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organisationservicetiming.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationservicetiming.notes) ? "" : organisationservicetiming.notes;
            db.AddParameter(command, "counter", DbTypes.Types.Long).Value = organisationservicetiming.counter;
            db.AddParameter(command, "openbefore", DbTypes.Types.Long).Value = organisationservicetiming.openbefore;
            if (await db.ExecuteNonQuery(command) > 0)
                {
                    organisationservicetiming.version = organisationservicetiming.version + 1;
                    result = true;
                }
            return result;
        }
        public async Task<bool> Delete(OrganisationServiceTimingDeleteReq organisationservicetiming)
        {
             bool result = false;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.DeleteTransaction(db, organisationservicetiming);
                    
                }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, OrganisationServiceTimingDeleteReq organisationservicetiming)
        {
            bool result = false;
                String query = @"
                Delete from OrganisationServiceTiming
             
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (organisationservicetiming.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", organisationservicetiming.version, DbTypes.Types.Integer);
                }
                if(organisationservicetiming.organisationid > 0 || organisationservicetiming.organizationlocationid > 0)
            {
                if (organisationservicetiming.organisationid > 0)
                {
                    queryBuilder.AddParameter("OrganisationServiceTiming.organisationid", "=", "organisationid", organisationservicetiming.organisationid, DbTypes.Types.Long);
                }
                if (organisationservicetiming.organizationlocationid > 0)
                {
                    queryBuilder.AddParameter("OrganisationServiceTiming.organisationlocationid", "=", "organisationlocationid", organisationservicetiming.organizationlocationid, DbTypes.Types.Long);
                }

            }
            else
            {
                queryBuilder.AddParameter("OrganisationServiceTiming.id", "=", "id", 0, DbTypes.Types.Long);
            }

            DbCommand command = queryBuilder.GetCommand(db);
            
                if (await db.ExecuteNonQuery(command) > 0)
                {
                    result = true;
                }
            return result;
        }

        
        public async Task<List<Appoinment>> selecttimingslot(OrganisationServiceTimingSelectReq req)
        {
            List<Appoinment> result = new List<Appoinment>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTimingSlotTransaction(db, req);
            }
            return result;
        }
        public async Task<string> Bookappoinment(Appoinment appoinment)
        {
            string result = "";
            using (IDb db = await dbprovider.GetDb())
            {

                await db.Connect();
                result = await this.BookappoinmentTransaction(db, appoinment);
            }
            return result;
        }

        public async Task<List<Appoinment>> SelectTimingSlotTransaction(IDb db, OrganisationServiceTimingSelectReq organisationServiceTiming)
        {
            // Validate input date
            if (organisationServiceTiming.appointmentdate == DateTime.MinValue)
            {
                return new List<Appoinment>();
            }

            // Load active event windows for this date (daily/single/range)
            var eventBlocked = await GetEventBlockedIntervalsTransaction(
                db,
                organisationServiceTiming.organisationid,
                organisationServiceTiming.organisationlocationid,
                organisationServiceTiming.appointmentdate.Date
            );

            // 1. Fetch organization's available timing slots
            organisationServiceTiming.day_of_week = GetAppointmentDayNumber(organisationServiceTiming.appointmentdate);
            List<OrganisationServiceTiming> selectedTimingSlot = await SelectTransaction(db, organisationServiceTiming);
            if (!selectedTimingSlot.Any())
            {
                return new List<Appoinment>(); // No available slots
            }

            // 2. Fetch services offered by this organization
            List<OrganisationServices> organisationServices = await organisationservicesservice.SelectTransaction(
                db,
                new OrganisationServicesSelectReq
                {
                    organisationid = organisationServiceTiming.organisationid,
                });

            // 3. Get minimum service duration (default to 15 mins if no services)
            int minTimePerSlot = organisationServices.Any()
                ? (int)organisationServices.Min(s => s.timetaken)
                : 15;

            // 4. Fetch existing appointments for this date/location
            List<Appoinment> existingAppointments = await appoinmentService.SelectTransaction(db,
                new AppoinmentSelectReq
                {
                    organisationlocationid = organisationServiceTiming.organisationlocationid,
                    organisationid = organisationServiceTiming.organisationid,
                    appointmentdate = organisationServiceTiming.appointmentdate
                });

            List<Appoinment> availableSlots = new List<Appoinment>();

            foreach (var timing in selectedTimingSlot.Where(t => t.isactive && !t.issuspended))
            {
                TimeSpan currentSlotStart = timing.start_time;
                int maxConcurrentBookings = (int)timing.counter;

                while (currentSlotStart.Add(TimeSpan.FromMinutes(minTimePerSlot)) <=
            (timing.end_time > timing.start_time ? timing.end_time : timing.end_time.Add(TimeSpan.FromDays(1))))

                {
                    TimeSpan currentSlotEnd = currentSlotStart.Add(TimeSpan.FromMinutes(minTimePerSlot));

                    // Count minute-by-minute overlapping appointments
                    int minuteByMinuteOverlaps = 0;
                    TimeSpan checkTime = currentSlotStart;

                    while (checkTime < currentSlotEnd)
                    {
                        // Check how many appointments overlap at this specific minute
                        int overlapsAtThisMinute = existingAppointments.Count(a =>
                            a.appoinmentdate.Date == organisationServiceTiming.appointmentdate.Date &&
                            checkTime >= a.fromtime &&
                            checkTime < a.totime);

                        minuteByMinuteOverlaps = Math.Max(minuteByMinuteOverlaps, overlapsAtThisMinute);

                        // If we've already hit max capacity, no need to check further
                        if (minuteByMinuteOverlaps >= maxConcurrentBookings)
                            break;

                        checkTime = checkTime.Add(TimeSpan.FromMinutes(1));
                    }

                    bool isAvailable = minuteByMinuteOverlaps < maxConcurrentBookings;
                    int remainingSlots = maxConcurrentBookings - minuteByMinuteOverlaps;

                    // Block by event if any event overlaps this slot window
                    if (isAvailable && eventBlocked.Count > 0 && OverlapsAny(currentSlotStart, currentSlotEnd, eventBlocked))
                    {
                        isAvailable = false;
                        remainingSlots = 0;
                    }

                    availableSlots.Add(new Appoinment
                    {
                        fromtime = currentSlotStart,
                        totime = currentSlotEnd,
                        statuscode = isAvailable ? "Available" : "Booked",
                        notes = isAvailable ?
                            $"{remainingSlots} slots remaining" :
                            (eventBlocked.Count > 0 && OverlapsAny(currentSlotStart, currentSlotEnd, eventBlocked))
                                ? "Blocked by event"
                                : "Fully booked",
                        appoinmentdate = organisationServiceTiming.appointmentdate,
                        organizationid = organisationServiceTiming.organisationid,
                        organisationlocationid = organisationServiceTiming.organisationlocationid
                    });

                    currentSlotStart = currentSlotEnd; // Move to next slot
                }
            }

            return availableSlots.OrderBy(s => s.fromtime).ToList();
        }

        public async Task<CalendarOverviewRes> SelectCalendarOverview(CalendarOverviewReq req)
        {
            var result = new CalendarOverviewRes();
            if (req.organisationid <= 0 || req.organisationlocationid <= 0 || req.year <= 0 || req.month <= 0 || req.month > 12)
            {
                return result;
            }

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await SelectCalendarOverviewTransaction(db, req);
            }
            return result;
        }

        public async Task<CalendarOverviewRes> SelectCalendarOverviewTransaction(IDb db, CalendarOverviewReq req)
        {
            var result = new CalendarOverviewRes();
            var daysInMonth = DateTime.DaysInMonth(req.year, req.month);

            var allAppointments = await appoinmentService.SelectBookedAppoinmentTransaction(db, new AppoinmentSelectReq
            {
                organisationid = req.organisationid,
                organisationlocationid = req.organisationlocationid,
            });

            for (int day = 1; day <= daysInMonth; day++)
            {
                var date = new DateTime(req.year, req.month, day);
                var slotReq = new OrganisationServiceTimingSelectReq
                {
                    organisationid = req.organisationid,
                    organisationlocationid = req.organisationlocationid,
                    appointmentdate = date.Date,
                };

                var slots = await SelectTimingSlotTransaction(db, slotReq);
                var dayBookings = allAppointments
                    .Where(a => a.appoinmentdate.Date == date.Date)
                    .OrderBy(a => a.fromtime)
                    .ToList();

                var dayOverview = new CalendarDayOverview
                {
                    date = date.Date,
                    available_count = slots.Count(s => string.Equals(s.statuscode, "Available", StringComparison.OrdinalIgnoreCase)),
                    booked_slot_count = slots.Count(s => string.Equals(s.statuscode, "Booked", StringComparison.OrdinalIgnoreCase)),
                    slots = slots.Select(s => new CalendarSlotOverviewItem
                    {
                        fromtime = s.fromtime.ToString(@"hh\:mm\:ss"),
                        totime = s.totime.ToString(@"hh\:mm\:ss"),
                        statuscode = s.statuscode ?? "",
                        notes = s.notes ?? "",
                    }).ToList(),
                    bookings = dayBookings.Select(b =>
                    {
                        var serviceNames = "";
                        if (b.attributes?.servicelist != null && b.attributes.servicelist.Count > 0)
                        {
                            serviceNames = string.Join(", ", b.attributes.servicelist
                                .Select(s => s.servicename)
                                .Where(n => !string.IsNullOrWhiteSpace(n)));
                        }
                        return new CalendarBookingOverviewItem
                        {
                            id = b.id,
                            username = b.username ?? "",
                            mobile = b.mobile ?? "",
                            fromtime = b.fromtime.ToString(@"hh\:mm\:ss"),
                            totime = b.totime.ToString(@"hh\:mm\:ss"),
                            statuscode = b.statuscode ?? "",
                            servicenames = serviceNames,
                        };
                    }).ToList(),
                };

                result.days.Add(dayOverview);
            }

            return result;
        }

        public enum Weeks
        {
            Monday = 1,
            Tuesday = 2,
            Wednesday = 3,
            Thursday = 4,
            Friday = 5,
            Saturday = 6,
            Sunday = 7
        }

        public int GetAppointmentDayNumber(DateTime appointmentdate)
        {
            // Convert .NET DayOfWeek (Sunday=0) to our Weeks enum (Monday=1)
            return ((int)appointmentdate.DayOfWeek + 6) % 7 + 1;
        }

        public Weeks GetAppointmentDayOfWeek(DateTime appointmentdate)
        {
            // Convert .NET DayOfWeek to our Weeks enum
            int dayNumber = GetAppointmentDayNumber(appointmentdate);
            return (Weeks)dayNumber;
        }
            
        public async Task<string> BookappoinmentTransaction(IDb db, Appoinment appoinment)
        {
            DateTime today = DateTime.Today;
            
            // Debug logging
            Console.WriteLine($"Booking appointment for date: {appoinment.appoinmentdate:yyyy-MM-dd}");
            Console.WriteLine($"Today's date: {today:yyyy-MM-dd}");
            Console.WriteLine($"Appointment user ID: {appoinment.userid}");

            // FIRST: Check slot availability BEFORE checking payment requirement
            // This ensures users don't pay for unavailable slots

            LeaveDates leave = (await leaveDatesService.SelectTransaction(db,new LeaveDatesSelectReq
            {
                organizationid = appoinment.organizationid,
                organizationlocationid = appoinment.organisationlocationid,
                leaveon = appoinment.appoinmentdate,
            })).FirstOrDefault();

            if (leave != null && leave.isfullday)
            {
                return "The shop is on leave that day.";
            }

            var appointmentDay = GetAppointmentDayOfWeek(appoinment.appoinmentdate);
            var dayNumber = (int)appointmentDay;
            
            // Fetch service timing information
            List<OrganisationServiceTiming> selectedTimingSlot = await SelectTransaction(db,
                new OrganisationServiceTimingSelectReq
                {
                    organisationlocationid = appoinment.organisationlocationid,
                    organisationid = appoinment.organizationid,
                    day_of_week = dayNumber
                });

            if (!selectedTimingSlot.Any())
            {
                return "No available time slots for the selected date.";
            }

            var timingSlot = selectedTimingSlot[0];
            long counter = timingSlot.counter;
            long openBefore = timingSlot.openbefore;

            DateTime maxBookingDate = today.AddDays(openBefore);

            // Check booking window (0 = no limit)
            if (openBefore > 0 && appoinment.appoinmentdate.Date > maxBookingDate)
            {
                return $"Appointments can only be booked up to {maxBookingDate:dd MMM yyyy}.";
            }

            // Fetch all existing appointments for the same date and location
            List<Appoinment> existingAppointments = await appoinmentService.SelectTransaction(db,
                new AppoinmentSelectReq
                {
                    organisationlocationid = appoinment.organisationlocationid,
                    organisationid = appoinment.organizationid,
                    appointmentdate = appoinment.appoinmentdate
                });

            // Block booking if slot overlaps any active event window (daily/single/range)
            var eventBlocked = await GetEventBlockedIntervalsTransaction(
                db,
                appoinment.organizationid,
                appoinment.organisationlocationid,
                appoinment.appoinmentdate.Date
            );
            if (eventBlocked.Count > 0 && OverlapsAny(appoinment.fromtime, appoinment.totime, eventBlocked))
            {
                var availableSlots = await SelectTimingSlotTransaction(db,
                    new OrganisationServiceTimingSelectReq
                    {
                        organisationid = appoinment.organizationid,
                        organisationlocationid = appoinment.organisationlocationid,
                        appointmentdate = appoinment.appoinmentdate
                    });

                var availableTimes = availableSlots
                    .Where(s => s.statuscode == "Available")
                    .Select(s => $"{s.fromtime:hh\\:mm}-{s.totime:hh\\:mm}")
                    .ToList();

                return $"This time slot is blocked by an event. Available slots: {string.Join(", ", availableTimes)}";
            }

            // Check for overlapping appointments that would exceed counter limit
            int overlappingCount = existingAppointments.Count(a =>
                appoinment.appoinmentdate.Date == a.appoinmentdate.Date &&
                appoinment.fromtime < a.totime &&
                appoinment.totime > a.fromtime
            );

            if (overlappingCount >= counter)
            {
                // Get all available slots for the day to suggest alternatives
                var availableSlots = await SelectTimingSlotTransaction(db,
                    new OrganisationServiceTimingSelectReq
                    {
                        organisationid = appoinment.organizationid,
                        organisationlocationid = appoinment.organisationlocationid,
                        appointmentdate = appoinment.appoinmentdate
                    });

                var availableTimes = availableSlots
                    .Where(s => s.statuscode == "Available")
                    .Select(s => $"{s.fromtime:hh\\:mm}-{s.totime:hh\\:mm}")
                    .ToList();

                return $"This time slot has reached maximum capacity ({counter} concurrent bookings). Available slots: {string.Join(", ", availableTimes)}";
            }

            // SECOND: After confirming slot is available, check if payment is required
            var organisationLocation = (await organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq 
            { 
                id = appoinment.organisationlocationid 
            })).FirstOrDefault();

            if (organisationLocation != null && organisationLocation.isPaymentRequired && !appoinment.ispaid)
            {
                // Payment is required but not paid - return special response
                // Slot is available, so proceed with payment flow
                return "PAYMENT_REQUIRED";
            }

            // If we get here, slot is available - book it
            try
            {
                await appoinmentService.InsertTransaction(db, appoinment);
            }
            catch (InvalidOperationException ex)
            {
                return ex.Message;
            }
            
            // Send push notification for successful appointment booking
            try
            {
                await firebaseNotificationService.SendAppointmentSuccessNotificationAsync(
                    appoinment.userid,
                    $"Appointment scheduled for {appoinment.appoinmentdate:dd MMM yyyy} at {appoinment.fromtime:hh\\:mm}"
                );
            }
            catch (Exception ex)
            {
                // Log error but don't fail the appointment booking
                Console.WriteLine($"Error sending appointment success notification: {ex.Message}");
            }
            
            // Send booking notification to organization via WhatsApp/SMS
            try
            {
                // Get organization details
                var organisation = (await organisationService.SelectTransaction(db, new OrganisationSelectReq 
                { 
                    id = appoinment.organizationid 
                })).FirstOrDefault();

                // Get customer details
                var customerUser = (await usersService.SelectTransaction(db, new UsersSelectReq 
                { 
                    id = appoinment.userid 
                })).FirstOrDefault();

                // Get organization location details (reuse variable name from earlier in method)
                var organisationLocationForNotification = (await organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq 
                { 
                    id = appoinment.organisationlocationid 
                })).FirstOrDefault();

                // Send only to organisation location's WhatsApp mobile (not organisation owner)
                string notificationMobile = organisationLocationForNotification?.whatsapp_mobile?.Trim() ?? "";

                if (organisation != null && customerUser != null && !string.IsNullOrEmpty(notificationMobile))
                {
                    // Get service type from appointment attributes
                    string serviceType = "General";
                    if (appoinment.attributes != null && appoinment.attributes.servicelist != null && appoinment.attributes.servicelist.Any())
                    {
                        var serviceNames = appoinment.attributes.servicelist.Select(s => s.servicename).ToList();
                        serviceType = string.Join(", ", serviceNames);
                    }

                    // Format date and time
                    string appointmentDate = appoinment.appoinmentdate.ToString("dd/MM/yy");
                    string appointmentTime = $"{appoinment.fromtime:hh\\:mm}";

                    // Prepare location name
                    string locationName = organisationLocationForNotification?.name ?? "N/A";

                    // Send notification to organization (location's WhatsApp or owner's mobile)
                    await smsService.SendUserBookAppointment(new UserBookAppointmentSmsReq
                    {
                        mobilenumber = notificationMobile,
                        OrganizationName = organisation.name ?? "Organization",
                        CustomerName = customerUser.name ?? "Customer",
                        AppointmentDate = appointmentDate,
                        AppointmentTime = appointmentTime,
                        ServiceType = serviceType,
                        Location = locationName
                    });
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail the appointment booking
                Console.WriteLine($"Error sending organization booking notification: {ex.Message}");
            }
            
            return "Successfully booked.";
        }

        private sealed class TimeWindow
        {
            public TimeSpan Start { get; set; }
            public TimeSpan End { get; set; }
        }

        private static bool OverlapsAny(TimeSpan start, TimeSpan end, List<TimeWindow> windows)
        {
            // End is exclusive
            return windows.Any(w => start < w.End && end > w.Start);
        }

        private static string DayKeyShort(DateTime date)
        {
            return date.DayOfWeek switch
            {
                DayOfWeek.Monday => "Mon",
                DayOfWeek.Tuesday => "Tue",
                DayOfWeek.Wednesday => "Wed",
                DayOfWeek.Thursday => "Thu",
                DayOfWeek.Friday => "Fri",
                DayOfWeek.Saturday => "Sat",
                _ => "Sun",
            };
        }

        private static bool TryParseWindow(string raw, out TimeWindow window)
        {
            window = null;
            if (string.IsNullOrWhiteSpace(raw)) return false;

            // accepted: "06:00-07:00" or "06:00 - 07:00"
            var parts = raw.Trim().Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (parts.Length != 2) return false;

            if (!TimeSpan.TryParse(parts[0], out var start)) return false;
            if (!TimeSpan.TryParse(parts[1], out var end)) return false;
            if (end <= start) return false;

            window = new TimeWindow { Start = start, End = end };
            return true;
        }

        private async Task<List<TimeWindow>> GetEventBlockedIntervalsTransaction(
            IDb db,
            long organisationId,
            long organisationLocationId,
            DateTime day
        )
        {
            var result = new List<TimeWindow>();
            if (organisationId <= 0 || organisationLocationId <= 0) return result;

            // Active events only (include both public/private). These events should block appointment slots.
            var query = @"
                SELECT start_time, end_time, timing_config
                FROM events
                WHERE isactive = TRUE
                  AND organisation_id = @organisation_id
                  AND organisation_location_id = @organisation_location_id
                  AND COALESCE(status, 'active') = 'active'
                  AND (
                        (event_type = 'daily')
                        OR (event_type = 'single' AND event_date = @day)
                        OR (event_type = 'range' AND from_date <= @day AND to_date >= @day)
                  )
            ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationId;
            db.AddParameter(command, "organisation_location_id", DbTypes.Types.Long).Value = organisationLocationId;
            db.AddParameter(command, "day", DbTypes.Types.Date).Value = day.Date;

            var dayKey = DayKeyShort(day);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    // Priority 1: dedicated start_time / end_time columns
                    if (reader["start_time"] != DBNull.Value && reader["end_time"] != DBNull.Value)
                    {
                        var start = (TimeSpan)reader["start_time"];
                        var end = (TimeSpan)reader["end_time"];
                        if (end > start)
                        {
                            result.Add(new TimeWindow { Start = start, End = end });
                        }
                        continue;
                    }

                    if (reader["timing_config"] == DBNull.Value) continue;
                    var json = reader["timing_config"]?.ToString();
                    if (string.IsNullOrWhiteSpace(json) || json == "null") continue;

                    try
                    {
                        // Priority 2: legacy JSON StartTime / EndTime on timing_config
                        var typedCfg = JsonSerializer.Deserialize<Event.TimingConfigData>(json);
                        if (typedCfg != null
                            && !string.IsNullOrWhiteSpace(typedCfg.StartTime)
                            && !string.IsNullOrWhiteSpace(typedCfg.EndTime)
                            && TimeSpan.TryParse(typedCfg.StartTime.Trim(), out var jsonStart)
                            && TimeSpan.TryParse(typedCfg.EndTime.Trim(), out var jsonEnd)
                            && jsonEnd > jsonStart)
                        {
                            result.Add(new TimeWindow { Start = jsonStart, End = jsonEnd });
                            continue;
                        }

                        // Priority 3: day-keyed windows e.g. { "Mon": ["06:00-07:00"] }
                        var cfg = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(json);
                        if (cfg == null || cfg.Count == 0) continue;

                        List<string> windows = null;
                        if (!cfg.TryGetValue(dayKey, out windows))
                        {
                            cfg.TryGetValue(day.DayOfWeek.ToString(), out windows);
                        }

                        if (windows == null || windows.Count == 0) continue;

                        foreach (var w in windows)
                        {
                            if (TryParseWindow(w, out var tw))
                            {
                                result.Add(tw);
                            }
                        }
                    }
                    catch
                    {
                        // ignore malformed JSON; don't block the whole day
                    }
                }
            }

            return result;
        }


        public async Task<string> BookLeave(Leavereq appoinment)
        {
            string result = "";
            using (IDb db = await dbprovider.GetDb())
            {

                await db.Connect();
                result = await this.BookLeaveTransaction(db, appoinment);
            }
            return result;
        }

        public async Task<string> BookLeaveTransaction(IDb db, Leavereq appoinment)
        {

            if(appoinment.isforce)
            {

                List<Appoinment> appoinments = await this.appoinmentService.SelectTransaction(db, new AppoinmentSelectReq {
                    appointmentdate = appoinment.appointmentdate
                });

                foreach (var appt in appoinments)
                {
                    await appoinmentService.CancelAppointmentTransaction(db, new UpdateStatusReq
                    {
                        appoinmentid = appt.id // Replace `id` with the actual ID property name if different
                    });
                }
                await leaveDatesService.Insert(new LeaveDates
                {
                    isfullday = appoinment.isfullday,
                    organizationid = (int)appoinment.organisationid,
                    organizationlocationid = appoinment.organisationlocationid,
                    start_time = appoinment.start_time,
                end_time = appoinment.end_time,
                });
            }

            List<Appoinment> existingAppointments = await appoinmentService.SelectTransaction(db,
             new AppoinmentSelectReq
             {
                 organisationlocationid = appoinment.organisationlocationid,
                 organisationid = appoinment.organisationid,
                 appointmentdate = appoinment.appointmentdate,
             });

            if(existingAppointments.Count > 0)
            {
                return $"There are {existingAppointments.Count} appointments scheduled on this day. Do you wish to mark the shop as on leave and cancel all appointments?";
            }
            else
            {
                await leaveDatesService.Insert(new LeaveDates
                {
                    isfullday = appoinment.isfullday,
                    organizationid = (int)appoinment.organisationid,
                    organizationlocationid = appoinment.organisationlocationid,
                    start_time = appoinment.start_time,
                    end_time = appoinment.end_time,
                    leaveon = appoinment.appointmentdate,
                });

            
            };
            return "Successfully marked as holiday";
        }

        public async Task<List<Leavereq>> GetLeaveRequests(Leavereq req)
        {
            Console.WriteLine($"🔍 GetLeaveRequests called with orgId: {req.organisationid}, locId: {req.organisationlocationid}, date: {req.appointmentdate}");
            List<Leavereq> result = new List<Leavereq>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.GetLeaveRequestsTransaction(db, req);
            }
            Console.WriteLine($"🔍 GetLeaveRequests returning {result.Count} leave requests");
            return result;
        }

        public async Task<List<Leavereq>> GetLeaveRequestsTransaction(IDb db, Leavereq req)
        {
            List<Leavereq> result = new List<Leavereq>();
            string query = @"
                SELECT 
                    ld.id,
                    ld.organizationid as organisationid,
                    ld.organizationlocationid as organisationlocationid,
                    ld.leaveon as appointmentdate,
                    ld.start_time,
                    ld.end_time,
                    ld.isfullday,
                    ld.isforce
                FROM LeaveDates ld
            ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("ld.organizationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            queryBuilder.AddParameter("ld.organizationlocationid", "=", "organisationlocationid", req.organisationlocationid, DbTypes.Types.Long);

            // Add date filter if provided
            if (req.appointmentdate != DateTime.MinValue)
            {
                // Set time to 00:00:00
                DateTime dateOnly = req.appointmentdate.Date;

                queryBuilder.AddParameter(
                    "ld.leaveon",
                    "=",
                    "appointmentdate",
                    dateOnly,
                    DbTypes.Types.Date
                );
            }


            // Add active filter
            queryBuilder.AddParameter("ld.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            var command = queryBuilder.GetCommand(db);
            Console.WriteLine($"🔍 Executing query: {query}");
            Console.WriteLine($"🔍 Parameters: orgId={req.organisationid}, locId={req.organisationlocationid}");
            
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Leavereq leave = new Leavereq();
                    leave.leaveid = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    leave.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    leave.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
                    leave.appointmentdate = reader["appointmentdate"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["appointmentdate"]);
                    leave.start_time = reader["start_time"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["start_time"];
                    leave.end_time = reader["end_time"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["end_time"];
                    leave.isfullday = reader["isfullday"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfullday"]);
                    leave.isforce = reader["isforce"] == DBNull.Value ? false : Convert.ToBoolean(reader["isforce"]);
                    
                    Console.WriteLine($"🔍 Found leave request: {leave.appointmentdate:yyyy-MM-dd}, Full day: {leave.isfullday}");
                    result.Add(leave);
                }
            }
            Console.WriteLine($"🔍 Total leave requests found: {result.Count}");
            return result;
        }

    }
}
