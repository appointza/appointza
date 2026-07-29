using appointza.Models;
using appointza.Authentication.Services;
using appointza.Sms.Services;
using appointza.Sms.Models;
using appointza.WhatsAppMsg.Services;
using appointza.Utils;
using System.Collections.Generic;
using System.Data.Common;
using System.Diagnostics.Metrics;
using System.Linq;

namespace appointza.Services
{
    public class AppoinmentService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        ReferenceValueService referenceValueService;
        ReferenceTypeService referenceTypeService;
        // TODO: Future implementation - Payment integration
        // PaymentService paymentService;
        TimelineService timelineService;
        WhatsAppMsg.Services.WhatsAppService whatsAppService;
        UsersService usersService;
        OrganisationService organisationService;
        OrganisationLocationService organisationLocationService;
        Sms.Services.SmsService smsService;
        CreditWalletService creditWalletService;

        public AppoinmentService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate, ReferenceValueService referenceValueService, ReferenceTypeService referenceTypeService, /* PaymentService paymentService, */ TimelineService timelineService, WhatsAppMsg.Services.WhatsAppService whatsAppService, UsersService usersService, OrganisationService organisationService, OrganisationLocationService organisationLocationService, Sms.Services.SmsService smsService, CreditWalletService creditWalletService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.referenceValueService = referenceValueService;
            this.referenceTypeService = referenceTypeService;
            // TODO: Future implementation - Payment integration
            // this.paymentService = paymentService;
            this.timelineService = timelineService;
            this.whatsAppService = whatsAppService;
            this.usersService = usersService;
            this.organisationService = organisationService;
            this.organisationLocationService = organisationLocationService;
            this.smsService = smsService;
            this.creditWalletService = creditWalletService;
        }
        public async Task<List<Appoinment>> Select(AppoinmentSelectReq req)
        {
            List<Appoinment> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }
        public async Task<List<Appoinment>> SelectTransaction(IDb db, AppoinmentSelectReq req)
        {
            List<Appoinment> result = new List<Appoinment>();
            string query = @"
                SELECT Appoinment.id,Appoinment.userid,Appoinment.organisationid,Appoinment.fromtime,Appoinment.totime,Appoinment.appoinmentdate,Appoinment.status,Appoinment.statuscode,Appoinment.version,Appoinment.createdby,Appoinment.createdon,Appoinment.modifiedby,Appoinment.modifiedon,Appoinment.attributes,Appoinment.isactive,Appoinment.issuspended,Appoinment.organisationlocationid,Appoinment.isfactory,Appoinment.notes,Appoinment.staffid,Appoinment.ispaid,Appoinment.staffname,Appoinment.isusercancel,Appoinment.fileid,Appoinment.tasklist,Appoinment.resheduledate,Appoinment.ishasreshedule
                FROM Appoinment
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            if (req.id > 0)
            {
                queryBuilder.AddParameter("Appoinment.id", "=", "id", req.id, DbTypes.Types.Long);
            }
        

            if (req.appointmentdate != null && req.appointmentdate != DateTime.MinValue)
            {
                DateOnly appointmentDate = DateOnly.FromDateTime(req.appointmentdate.Value);
                queryBuilder.AddParameter("Appoinment.appoinmentdate", "=", "appoinmentdate", appointmentDate, DbTypes.Types.Date);

            }

            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("Appoinment.organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }
            if (req.userid > 0)
            {
                queryBuilder.AddParameter("Appoinment.userid ", "=", "userid", req.userid, DbTypes.Types.Long);
            }

            if (req.organisationlocationid > 0)
            {
                queryBuilder.AddParameter("Appoinment.organisationlocationid", "=", "organisationlocationid", req.organisationlocationid, DbTypes.Types.Long);
            }
            queryBuilder.AddParameter("Appoinment.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Appoinment.id");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Appoinment temp = new Appoinment();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]);
                    temp.organizationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.fromtime = reader["fromtime"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["fromtime"];
                    temp.totime = reader["totime"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["totime"];
                    temp.appoinmentdate = reader["appoinmentdate"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["appoinmentdate"]);
                    temp.status = reader["status"] == DBNull.Value ? 0 : Convert.ToInt32(reader["status"]);
                    temp.statuscode = reader["statuscode"] == DBNull.Value ? "" : reader["statuscode"].ToString();
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
                    temp.isusercancel = reader["isusercancel"] == DBNull.Value ? false : Convert.ToBoolean(reader["isusercancel"]);
                    temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    temp.staffid = reader["staffid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["staffid"]);
                    temp.staffname = reader["staffname"] == DBNull.Value ? "" : reader["staffname"].ToString();
                    temp.ispaid = reader["ispaid"] == DBNull.Value ? false : Convert.ToBoolean(reader["ispaid"]);
                    
                    // New columns mapping
                    temp.fileid_json = reader["fileid"] == DBNull.Value ? "null" : reader["fileid"].ToString();
                    temp.tasklist_json = reader["tasklist"] == DBNull.Value ? "null" : reader["tasklist"].ToString();
                    temp.resheduledate = reader["resheduledate"] == DBNull.Value ? null : Convert.ToDateTime(reader["resheduledate"]);
                    temp.ishasreshedule = reader["ishasreshedule"] == DBNull.Value ? false : Convert.ToBoolean(reader["ishasreshedule"]);

                    result.Add(temp);
                }
            }
            return result;
        }
        public async Task<Appoinment> Insert(Appoinment appoinment)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, appoinment);
            }
            return appoinment;
        }
        public async Task InsertTransaction(IDb db, Appoinment appoinment)
        {
            String query = @"
                INSERT INTO Appoinment (
                    userid,organisationid,fromtime,totime,appoinmentdate,status,statuscode,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,organisationlocationid,isfactory,notes,staffid,ispaid,staffname,isusercancel
                )
                VALUES (
                   @userid,@organisationid,@fromtime,@totime,@appoinmentdate,@status,@statuscode,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@organisationlocationid,@isfactory,@notes,@staffid,@ispaid,@staffname,@isusercancel
                )
                RETURNING id;
                ";
            appoinment.isactive = true;
            appoinment.version = 1;
            appoinment.createdon = DateTime.UtcNow;
            appoinment.createdby = requeststate.usercontext.id;
            appoinment.modifiedon = DateTime.UtcNow;
            appoinment.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "userid", DbTypes.Types.Long).Value = appoinment.userid;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = appoinment.organizationid;
            db.AddParameter(command, "fromtime", DbTypes.Types.Time).Value = appoinment.fromtime;
            db.AddParameter(command, "totime", DbTypes.Types.Time).Value = appoinment.totime;
            db.AddParameter(command, "appoinmentdate", DbTypes.Types.DateTime).Value = appoinment.appoinmentdate;
            db.AddParameter(command, "status", DbTypes.Types.Integer).Value = appoinment.status;
            db.AddParameter(command, "statuscode", DbTypes.Types.String).Value = String.IsNullOrEmpty(appoinment.statuscode) ? "" : appoinment.statuscode;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = appoinment.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = appoinment.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = appoinment.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = appoinment.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = appoinment.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = appoinment.attributes_json;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = appoinment.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = appoinment.issuspended;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = appoinment.organisationlocationid;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = appoinment.isfactory;
            db.AddParameter(command, "isusercancel", DbTypes.Types.Boolean).Value = appoinment.isusercancel;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(appoinment.notes) ? "" : appoinment.notes;
            db.AddParameter(command, "staffid", DbTypes.Types.Long).Value = appoinment.staffid;
            db.AddParameter(command, "ispaid", DbTypes.Types.Boolean).Value = appoinment.ispaid;
            db.AddParameter(command, "staffname", DbTypes.Types.String).Value = String.IsNullOrEmpty(appoinment.staffname) ? "" : appoinment.staffname;
            
            // New columns parameters - temporarily disabled until database columns are added
            // db.AddParameter(command, "fileid", DbTypes.Types.Json).Value = appoinment.fileid_json;
            // db.AddParameter(command, "tasklist", DbTypes.Types.Json).Value = appoinment.tasklist_json;
            // db.AddParameter(command, "resheduledate", DbTypes.Types.DateTime).Value = appoinment.resheduledate.HasValue ? (object)appoinment.resheduledate.Value : DBNull.Value;
            // db.AddParameter(command, "ishasreshedule", DbTypes.Types.Boolean).Value = appoinment.ishasreshedule;

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    appoinment.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }

            if (appoinment.organizationid > 0 && !appoinment.isfactory && appoinment.id > 0)
            {
                try
                {
                    await creditWalletService.ConsumeForBookingTransaction(
                        db,
                        appoinment.organizationid,
                        appoinment.id,
                        null);
                }
                catch
                {
                    await RollbackInsertedAppointmentTransaction(db, appoinment.id);
                    throw;
                }
            }

            // Send WhatsApp notification to organization user when appointment is booked
            try
            {
                // Get customer user details
                var customerUser = (await usersService.SelectTransaction(db, new UsersSelectReq { id = appoinment.userid })).FirstOrDefault();
                // Get organization details
                var organisation = (await organisationService.SelectTransaction(db, new OrganisationSelectReq { id = appoinment.organizationid })).FirstOrDefault();
                
                if (customerUser != null && organisation != null)
                {
                    // Get organization user mobile
                    string orgUserMobile = "";
                    var organisationLocation = (await organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq { id = appoinment.organisationlocationid })).FirstOrDefault();
                    if (organisationLocation != null && !string.IsNullOrEmpty(organisationLocation.whatsapp_mobile))
                    {
                        orgUserMobile = organisationLocation.whatsapp_mobile;
                    }
                    else
                    {
                        var orgUsers = await usersService.SelectTransaction(db, new UsersSelectReq { organisationid = appoinment.organizationid });
                        var orgUser = orgUsers?.FirstOrDefault(u => !string.IsNullOrEmpty(u.mobile));
                        orgUserMobile = orgUser?.mobile ?? "";
                    }
                    
                    // Format appointment time as HH.mm a.m/p.m
                    int hours = appoinment.fromtime.Hours;
                    int minutes = appoinment.fromtime.Minutes;
                    string period = hours < 12 ? "a.m" : "p.m";
                    if (hours > 12) hours -= 12;
                    if (hours == 0) hours = 12;
                    string appointmentTime = $"{hours:00}.{minutes:00} {period}";
                    
                    // Get first service name from attributes
                    string serviceName = "Appointment";
                    string department = organisationLocation?.name ?? organisationLocation?.city ?? "";
                    
                    if (appoinment.attributes != null && appoinment.attributes.servicelist != null && appoinment.attributes.servicelist.Count > 0)
                    {
                        serviceName = appoinment.attributes.servicelist[0].servicename ?? "";
                    }
                    
                    // Send booking notification to organization user
                    if (!string.IsNullOrEmpty(orgUserMobile))
                    {
                        await whatsAppService.SendBookingNotificationAsync(
                            customerMobile: orgUserMobile,
                            hospitalName: organisation.name ?? "",
                            customerName: customerUser.name ?? "",
                            appointmentDate: appoinment.appoinmentdate,
                            appointmentTime: appointmentTime,
                            serviceName: serviceName,
                            department: department
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail the appointment creation
                Console.WriteLine($"Error sending booking WhatsApp notification: {ex.Message}");
            }
        }
        public async Task<Appoinment> Update(Appoinment appoinment)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, appoinment);
            }
            return appoinment;
        }
        public async Task<bool> UpdateTransaction(IDb db, Appoinment appoinment)
        {
            bool result = false;
            String query = @"
                UPDATE Appoinment
                    SET 
                        userid = @userid,organisationid = @organisationid,fromtime = @fromtime,totime = @totime,appoinmentdate = @appoinmentdate,status = @status,statuscode = @statuscode,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,organisationlocationid = @organisationlocationid,isfactory = @isfactory,notes = @notes,staffid = @staffid,ispaid = @ispaid,staffname = @staffname,isusercancel=@isusercancel,fileid = @fileid,tasklist = @tasklist,resheduledate = @resheduledate,ishasreshedule = @ishasreshedule,
                        version = version + 1
                    WHERE id = @id
                ";

            var command = db.GetCommand(query);

            appoinment.modifiedon = DateTime.UtcNow;
            appoinment.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = appoinment.id;
            db.AddParameter(command, "userid", DbTypes.Types.Long).Value = appoinment.userid;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = appoinment.organizationid;
            db.AddParameter(command, "fromtime", DbTypes.Types.Time).Value = appoinment.fromtime;
            db.AddParameter(command, "totime", DbTypes.Types.Time).Value = appoinment.totime;
            db.AddParameter(command, "appoinmentdate", DbTypes.Types.DateTime).Value = appoinment.appoinmentdate;
            db.AddParameter(command, "status", DbTypes.Types.Integer).Value = appoinment.status;
            db.AddParameter(command, "statuscode", DbTypes.Types.String).Value = String.IsNullOrEmpty(appoinment.statuscode) ? "" : appoinment.statuscode;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = appoinment.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = appoinment.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = appoinment.attributes_json;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = appoinment.issuspended;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = appoinment.organisationlocationid;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = appoinment.isfactory;
            db.AddParameter(command, "isusercancel", DbTypes.Types.Boolean).Value = appoinment.isusercancel;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(appoinment.notes) ? "" : appoinment.notes;
            db.AddParameter(command, "staffid", DbTypes.Types.Long).Value = appoinment.staffid;
            db.AddParameter(command, "ispaid", DbTypes.Types.Boolean).Value = appoinment.ispaid;
            db.AddParameter(command, "staffname", DbTypes.Types.String).Value = String.IsNullOrEmpty(appoinment.staffname) ? "" : appoinment.staffname;
            
            // New columns parameters
            Console.WriteLine($"Updating appointment {appoinment.id}:");
            Console.WriteLine($"fileid_json: {appoinment.fileid_json}");
            Console.WriteLine($"tasklist_json: {appoinment.tasklist_json}");
            Console.WriteLine($"resheduledate: {appoinment.resheduledate}");
            Console.WriteLine($"ishasreshedule: {appoinment.ishasreshedule}");
            
            db.AddParameter(command, "fileid", DbTypes.Types.Json).Value = appoinment.fileid_json;
            db.AddParameter(command, "tasklist", DbTypes.Types.Json).Value = appoinment.tasklist_json;
            db.AddParameter(command, "resheduledate", DbTypes.Types.DateTime).Value = appoinment.resheduledate.HasValue ? (object)appoinment.resheduledate.Value : DBNull.Value;
            db.AddParameter(command, "ishasreshedule", DbTypes.Types.Boolean).Value = appoinment.ishasreshedule;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                appoinment.version = appoinment.version + 1;
                result = true;
            }
            return result;
        }
        public async Task<bool> Delete(AppoinmentDeleteReq appoinment)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, appoinment);

            }
            return result;
        }
        async Task RollbackInsertedAppointmentTransaction(IDb db, long appointmentId)
        {
            if (appointmentId <= 0)
            {
                return;
            }

            const string query = @"
                UPDATE Appoinment
                SET isactive = false,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby
                WHERE id = @id";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = appointmentId;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext?.id ?? 0;
            await db.ExecuteNonQuery(command);
        }

        public async Task<bool> DeleteTransaction(IDb db, AppoinmentDeleteReq appoinment)
        {
            bool result = false;
            String query = @"
                UPDATE Appoinment
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("id", "=", "id", appoinment.id, DbTypes.Types.Long);
            if (appoinment.version > 0)
            {
                queryBuilder.AddParameter("version", "=", "version", appoinment.version, DbTypes.Types.Integer);
            }
            DbCommand command = queryBuilder.GetCommand(db);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = appoinment.id;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = appoinment.version;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }


        public async Task<List<BookedAppoinmentRes>> SelectBookedAppoinment(AppoinmentSelectReq req)
        {
            try
            {
                List<BookedAppoinmentRes> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.SelectBookedAppoinmentTransaction(db, req);
                }
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SelectBookedAppoinment: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<List<BookedAppoinmentRes>> SelectBookedAppoinmentTransaction(IDb db, AppoinmentSelectReq req)
        {
            try
            {
                List<BookedAppoinmentRes> result = new List<BookedAppoinmentRes>();
            string query = @"
        SELECT 
            Appoinment.id,
            Appoinment.userid,
            Appoinment.organisationid,
            Appoinment.fromtime,
            Appoinment.totime,
            Appoinment.appoinmentdate,
            Appoinment.status,
            Appoinment.statuscode,
            Appoinment.version,
            Appoinment.createdby,
            Appoinment.createdon,
            Appoinment.modifiedby,
            Appoinment.modifiedon,
            Appoinment.attributes,
            Appoinment.isactive,
            Appoinment.issuspended,
            Appoinment.organisationlocationid,
            Appoinment.isfactory,
            Appoinment.notes,
            Appoinment.staffid,
            Appoinment.ispaid,
            Appoinment.staffname,
            Appoinment.fileid,
            Appoinment.tasklist,
            Appoinment.resheduledate,
            Appoinment.ishasreshedule,
            users.name AS username,
            users.mobile,
            organisation.name AS organisationname,
            organisation.secondarytypecode,
            organisation.primarytypecode,
            organisationlocation.city
        FROM Appoinment
        LEFT JOIN users ON users.id = Appoinment.userid
        LEFT JOIN organisation ON organisation.id = Appoinment.organisationid
        LEFT JOIN organisationlocation ON organisationlocation.id = Appoinment.organisationlocationid
    ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            if (req.id > 0)
            {
                queryBuilder.AddParameter("Appoinment.id", "=", "id", req.id, DbTypes.Types.Long);
            }

     
            if (req.appointmentdate != null && req.appointmentdate != DateTime.MinValue)
            {
                DateOnly appointmentDate = DateOnly.FromDateTime(req.appointmentdate.Value);
                queryBuilder.AddParameter("Appoinment.appoinmentdate", "=", "appoinmentdate", appointmentDate, DbTypes.Types.Date);
            }

            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("Appoinment.organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }

            if (req.userid > 0)
            {
                queryBuilder.AddParameter("Appoinment.userid", "=", "userid", req.userid, DbTypes.Types.Long);
            }

            if (req.organisationlocationid > 0)
            {
                queryBuilder.AddParameter("Appoinment.organisationlocationid", "=", "organisationlocationid", req.organisationlocationid, DbTypes.Types.Long);
            }

            queryBuilder.AddParameter("Appoinment.isactive", "=", "isactive", true, DbTypes.Types.Boolean);
            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Appoinment.id");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    BookedAppoinmentRes temp = new BookedAppoinmentRes();

                    // Base Appoinment properties
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]);
                    temp.organizationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.fromtime = reader["fromtime"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["fromtime"];
                    temp.totime = reader["totime"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["totime"];
                    temp.appoinmentdate = reader["appoinmentdate"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["appoinmentdate"]);
                    temp.status = reader["status"] == DBNull.Value ? 0 : Convert.ToInt32(reader["status"]);
                    temp.statuscode = reader["statuscode"] == DBNull.Value ? "" : reader["statuscode"].ToString();
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
                    temp.staffid = reader["staffid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["staffid"]);
                    temp.staffname = reader["staffname"] == DBNull.Value ? "" : reader["staffname"].ToString();
                    temp.ispaid = reader["ispaid"] == DBNull.Value ? false : Convert.ToBoolean(reader["ispaid"]);
                    
                    // New columns mapping
                    temp.fileid_json = reader["fileid"] == DBNull.Value ? "null" : reader["fileid"].ToString();
                    temp.tasklist_json = reader["tasklist"] == DBNull.Value ? "null" : reader["tasklist"].ToString();
                    temp.resheduledate = reader["resheduledate"] == DBNull.Value ? null : Convert.ToDateTime(reader["resheduledate"]);
                    temp.ishasreshedule = reader["ishasreshedule"] == DBNull.Value ? false : Convert.ToBoolean(reader["ishasreshedule"]);

                    // Additional properties from joins
                    temp.username = reader["username"] == DBNull.Value ? "" : reader["username"].ToString();
                    temp.mobile = reader["mobile"] == DBNull.Value ? "" : reader["mobile"].ToString();
                    temp.organisationname = reader["organisationname"] == DBNull.Value ? "" : reader["organisationname"].ToString();
                    temp.secondarytypecode = reader["secondarytypecode"] == DBNull.Value ? "" : reader["secondarytypecode"].ToString();
                    temp.primarytypecode = reader["primarytypecode"] == DBNull.Value ? "" : reader["primarytypecode"].ToString();
                    temp.city = reader["city"] == DBNull.Value ? "" : reader["city"].ToString();

                    result.Add(temp);
                }
            }
            return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SelectBookedAppoinmentTransaction: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<bool> Assignstaff(AddStaffReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.AssignStaffTransaction(db, req);
            }
            return result;
        }
        public async Task<bool> AssignStaffTransaction(IDb db, AddStaffReq req)
        {
            bool result = false;

            Appoinment appoinment =(await this.SelectTransaction(db,new AppoinmentSelectReq { id = req.appoinmentid})).FirstOrDefault();

            appoinment.staffid = req.staffid;
            appoinment.staffname = req.staffname;

            await this.UpdateTransaction(db, appoinment);

            await this.timelineService.InsertTransaction(db, new Timeline
            {
                organisationid= req.organisationid,
                organisationlocationid= req.organisationlocationid,
                appoinmentid=req.appoinmentid,
                tasktypeid = (long)TimelineStatus.Assigned,
                taskcode = "Assigned to",
                customerid = appoinment.userid,
                staffname = req.staffname,
                staffid = req.staffid,

            });
            result = true;
           


            return result;
        }


        public async Task<bool> UpdateStatus(UpdateStatusReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.UpdateStatusTransaction(db, req);
            }
            return result;
        }
        public async Task<bool> UpdateStatusTransaction(IDb db, UpdateStatusReq req)
        {
            bool result = false;

            Appoinment appoinment = (await this.SelectTransaction(db, new AppoinmentSelectReq { id = req.appoinmentid })).FirstOrDefault();

            if (appoinment == null)
            {
                return false;
            }

            int oldStatus = appoinment.status;
            appoinment.status = (int)req.statusid;
            appoinment.statuscode = req.statuscode;

            await this.UpdateTransaction(db, appoinment);

            await this.timelineService.InsertTransaction(db, new Timeline
            {
                organisationid = req.organisationid,
                organisationlocationid = req.organisationlocationid,
                appoinmentid = req.appoinmentid,
                tasktypeid = (long)TimelineStatus.Status,
                taskcode = "Status to",
                apoinmentstatuscode = req.statuscode,
                appoinmenstatustype=req.statustype,
                appoinmentstatusid = req.statusid

        });
            result = true;

            // Send SMS notification to customer when appointment status changes
            try
            {
                // Get customer user details
                var customerUser = (await usersService.SelectTransaction(db, new UsersSelectReq { id = appoinment.userid })).FirstOrDefault();
                // Get organization details
                var organisation = (await organisationService.SelectTransaction(db, new OrganisationSelectReq { id = appoinment.organizationid })).FirstOrDefault();
                // Get location details
                var organisationLocation = (await organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq { id = appoinment.organisationlocationid })).FirstOrDefault();
                
                // Get ReferenceValue for status display text
                string statusDisplayText = req.statuscode ?? "";
                try
                {
                    // Get APPOINTMENTSTATUS reference type
                    var statusRefType = (await referenceTypeService.SelectTransaction(db, new ReferenceTypeSelectReq { identifier = "APPOINTMENTSTATUS" })).FirstOrDefault();
                    if (statusRefType != null)
                    {
                        // Get all ReferenceValues for this type and organization, then filter by identifier
                        var statusRefValues = (await referenceValueService.SelectTransaction(db, new ReferenceValueSelectReq 
                        { 
                            referencetypeid = (int)statusRefType.id,
                            organisationid = appoinment.organizationid
                        }));
                        
                        var statusRefValue = statusRefValues?.FirstOrDefault(rv => rv.identifier == req.statuscode);
                        
                        if (statusRefValue != null && !string.IsNullOrEmpty(statusRefValue.displaytext))
                        {
                            statusDisplayText = statusRefValue.displaytext;
                        }
                    }
                }
                catch (Exception refEx)
                {
                    // If ReferenceValue lookup fails, use statuscode as fallback
                    Console.WriteLine($"Error getting status ReferenceValue: {refEx.Message}");
                }
                
                if (customerUser != null && organisation != null && !string.IsNullOrEmpty(customerUser.mobile))
                {
                    // Format appointment date as dd/MM/yy
                    string appointmentDate = appoinment.appoinmentdate.ToString("dd/MM/yy");
                    
                    // Format appointment time as HH.mm a.m/p.m
                    int hours = appoinment.fromtime.Hours;
                    int minutes = appoinment.fromtime.Minutes;
                    string period = hours < 12 ? "a.m" : "p.m";
                    if (hours > 12) hours -= 12;
                    if (hours == 0) hours = 12;
                    string appointmentTime = $"{hours:00}.{minutes:00} {period}";
                    
                    // Get service type from appointment attributes
                    string serviceType = "General";
                    if (appoinment.attributes != null && appoinment.attributes.servicelist != null && appoinment.attributes.servicelist.Any())
                    {
                        var serviceNames = appoinment.attributes.servicelist.Select(s => s.servicename).ToList();
                        serviceType = string.Join(", ", serviceNames);
                    }
                    
                    // Get location name
                    string locationName = organisationLocation?.name ?? organisationLocation?.city ?? "N/A";
                    
                    // Send SMS status notification to customer
                    await smsService.SendAppointmentStatus(new AppointmentStatusSmsReq
                    {
                        mobilenumber = customerUser.mobile,
                        CustomerName = customerUser.name ?? "Customer",
                        AppointmentStatus = statusDisplayText,
                        AppointmentDate = appointmentDate,
                        AppointmentTime = appointmentTime,
                        Location = locationName,
                        ServiceType = serviceType,
                        OrganisationName = organisation.name ?? "Organization"
                    });
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail the status update
                Console.WriteLine($"Error sending status SMS notification: {ex.Message}");
            }

            return result;
        }


        public async Task<bool> CancelAppointment(UpdateStatusReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.CancelAppointmentTransaction(db, req);
            }
            return result;
        }
        public async Task<bool> CancelAppointmentTransaction(IDb db, UpdateStatusReq req)
        {
            bool result = false;

            Appoinment appoinment = (await this.SelectTransaction(db, new AppoinmentSelectReq { id = req.appoinmentid })).FirstOrDefault();

            appoinment.status = (int)req.statusid;
            appoinment.statuscode = req.statuscode;
            appoinment.isusercancel = true;

            await this.UpdateTransaction(db, appoinment);

            await this.timelineService.InsertTransaction(db, new Timeline
            {
                organisationid = req.organisationid,
                organisationlocationid = req.organisationlocationid,
                appoinmentid = req.appoinmentid,
                tasktypeid = (long)TimelineStatus.Status,
                taskcode = "Status to",
                apoinmentstatuscode = req.statuscode,
                appoinmenstatustype = req.statustype,
                appoinmentstatusid = req.statusid

            });
            result = true;

            // Send SMS notification to customer when appointment is cancelled
            try
            {
                // Get customer user details
                var customerUser = (await usersService.SelectTransaction(db, new UsersSelectReq { id = appoinment.userid })).FirstOrDefault();
                // Get organization details
                var organisation = (await organisationService.SelectTransaction(db, new OrganisationSelectReq { id = appoinment.organizationid })).FirstOrDefault();
                // Get location details
                var organisationLocation = (await organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq { id = appoinment.organisationlocationid })).FirstOrDefault();
                
                // Get ReferenceValue for status display text
                string statusDisplayText = req.statuscode ?? "Cancelled";
                try
                {
                    // Get APPOINTMENTSTATUS reference type
                    var statusRefType = (await referenceTypeService.SelectTransaction(db, new ReferenceTypeSelectReq { identifier = "APPOINTMENTSTATUS" })).FirstOrDefault();
                    if (statusRefType != null)
                    {
                        // Get all ReferenceValues for this type and organization, then filter by identifier
                        var statusRefValues = (await referenceValueService.SelectTransaction(db, new ReferenceValueSelectReq 
                        { 
                            referencetypeid = (int)statusRefType.id,
                            organisationid = appoinment.organizationid
                        }));
                        
                        var statusRefValue = statusRefValues?.FirstOrDefault(rv => rv.identifier == req.statuscode);
                        
                        if (statusRefValue != null && !string.IsNullOrEmpty(statusRefValue.displaytext))
                        {
                            statusDisplayText = statusRefValue.displaytext;
                        }
                    }
                }
                catch (Exception refEx)
                {
                    // If ReferenceValue lookup fails, use statuscode as fallback
                    Console.WriteLine($"Error getting status ReferenceValue: {refEx.Message}");
                }
                
                if (customerUser != null && organisation != null && !string.IsNullOrEmpty(customerUser.mobile))
                {
                    // Format appointment date as dd/MM/yy
                    string appointmentDate = appoinment.appoinmentdate.ToString("dd/MM/yy");
                    
                    // Format appointment time as HH.mm a.m/p.m
                    int hours = appoinment.fromtime.Hours;
                    int minutes = appoinment.fromtime.Minutes;
                    string period = hours < 12 ? "a.m" : "p.m";
                    if (hours > 12) hours -= 12;
                    if (hours == 0) hours = 12;
                    string appointmentTime = $"{hours:00}.{minutes:00} {period}";
                    
                    // Get service type from appointment attributes
                    string serviceType = "General";
                    if (appoinment.attributes != null && appoinment.attributes.servicelist != null && appoinment.attributes.servicelist.Any())
                    {
                        var serviceNames = appoinment.attributes.servicelist.Select(s => s.servicename).ToList();
                        serviceType = string.Join(", ", serviceNames);
                    }
                    
                    // Get location name
                    string locationName = organisationLocation?.name ?? organisationLocation?.city ?? "N/A";
                    
                    // Send SMS status notification to customer
                    await smsService.SendAppointmentStatus(new AppointmentStatusSmsReq
                    {
                        mobilenumber = customerUser.mobile,
                        CustomerName = customerUser.name ?? "Customer",
                        AppointmentStatus = statusDisplayText,
                        AppointmentDate = appointmentDate,
                        AppointmentTime = appointmentTime,
                        Location = locationName,
                        ServiceType = serviceType,
                        OrganisationName = organisation.name ?? "Organization"
                    });
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail the cancellation
                Console.WriteLine($"Error sending cancellation SMS notification: {ex.Message}");
            }

            return result;
        }


        // TODO: Future implementation - Payment integration
        // UpdatePayment and UpdatePaymentTransaction methods will be implemented here

        public async Task<AppointmentSummary> GetAppointmentSummary(AppointmentSummarySelectReq req)
        {
            try
            {
                Console.WriteLine($"GetAppointmentSummary called with appointment ID: {req.appointmentid}");
                AppointmentSummary result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.GetAppointmentSummaryTransaction(db, req);
                }
                Console.WriteLine($"GetAppointmentSummary completed successfully for appointment ID: {req.appointmentid}");
                if (result != null)
                {
                    Console.WriteLine($"Summary data - ID: {result.id}, Organisation: {result.organisationname}, Status: {result.status}");
                }
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAppointmentSummary: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<AppointmentSummary> GetAppointmentSummaryTransaction(IDb db, AppointmentSummarySelectReq req)
        {
            try
            {
                Console.WriteLine($"GetAppointmentSummaryTransaction called with appointment ID: {req.appointmentid}");
                var summary = new AppointmentSummary();

                // Get appointment details
                string appointmentQuery = 
                    @"SELECT 
                        a.id, a.userid, a.organisationid, a.organisationlocationid,
                        a.fromtime, a.totime, a.appoinmentdate, a.status, a.statuscode,
                        a.createdon, a.modifiedon, a.staffid, a.staffname, a.notes, a.attributes,
                        u.name as username, u.email, u.mobile,
                        o.name as organisationname,
                        ol.name as locationname, ol.addressline1 as loc_address, ol.addressline2, ol.city, ol.state
                    FROM Appoinment a
                    LEFT JOIN users u ON a.userid = u.id
                    LEFT JOIN organisation o ON a.organisationid = o.id
                    LEFT JOIN organisationlocation ol ON a.organisationlocationid = ol.id";

                Console.WriteLine("Creating query builder...");
                var queryBuilder = querybuilderprovider.GetQueryBuilder(appointmentQuery);
                if (req.appointmentid > 0)
                {
                    queryBuilder.AddParameter("a.id", "=", "appointmentId", req.appointmentid, DbTypes.Types.Long);
                }
                var command = queryBuilder.GetCommand(db);
                Console.WriteLine($"Generated SQL: {command.CommandText}");
                Console.WriteLine("Query builder created successfully");

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    // Map appointment data
                    summary.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt32(reader["id"]);
                    summary.userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt32(reader["userid"]);
                    summary.username = reader["username"] == DBNull.Value ? "" : reader["username"].ToString();
                    summary.useremail = reader["email"] == DBNull.Value ? "" : reader["email"].ToString();
                    summary.usermobile = reader["mobile"] == DBNull.Value ? "" : reader["mobile"].ToString();
                    summary.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt32(reader["organisationid"]);
                    summary.organisationname = reader["organisationname"] == DBNull.Value ? "" : reader["organisationname"].ToString();
                    summary.organisationaddress = ""; // Not available in this query
                    summary.organisationphone = ""; // Not available in this query
                    summary.organisationemail = ""; // Not available in this query
                    summary.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt32(reader["organisationlocationid"]);
                    summary.locationname = reader["locationname"] == DBNull.Value ? "" : reader["locationname"].ToString();
                    
                    // Build address from available fields
                    string addressLine1 = reader["loc_address"] == DBNull.Value ? "" : reader["loc_address"].ToString();
                    string addressLine2 = reader["addressline2"] == DBNull.Value ? "" : reader["addressline2"].ToString();
                    string city = reader["city"] == DBNull.Value ? "" : reader["city"].ToString();
                    string state = reader["state"] == DBNull.Value ? "" : reader["state"].ToString();
                    
                    List<string> addressParts = new List<string>();
                    if (!string.IsNullOrEmpty(addressLine1)) addressParts.Add(addressLine1);
                    if (!string.IsNullOrEmpty(addressLine2)) addressParts.Add(addressLine2);
                    if (!string.IsNullOrEmpty(city)) addressParts.Add(city);
                    if (!string.IsNullOrEmpty(state)) addressParts.Add(state);
                    
                    summary.locationaddress = string.Join(", ", addressParts);
                    summary.locationphone = ""; // Not available in this query
                    summary.appointmentdate = reader["appoinmentdate"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["appoinmentdate"]);
                    summary.fromtime = reader["fromtime"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["fromtime"];
                    summary.totime = reader["totime"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["totime"];
                    summary.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    summary.statuscode = reader["statuscode"] == DBNull.Value ? "" : reader["statuscode"].ToString();
                    summary.createdon = reader["createdon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["createdon"]);
                    summary.modifiedon = reader["modifiedon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["modifiedon"]);
                    summary.staffid = reader["staffid"] == DBNull.Value ? null : Convert.ToInt32(reader["staffid"]);
                    summary.staffname = reader["staffname"] == DBNull.Value ? "" : reader["staffname"].ToString();
                    summary.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();

                    // Parse attributes if they exist
                    string attributesJson = reader["attributes"] == DBNull.Value ? "" : reader["attributes"].ToString();
                    if (!string.IsNullOrEmpty(attributesJson))
                    {
                        try
                        {
                            summary.attributes = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(attributesJson) ?? new Dictionary<string, object>();
                        }
                        catch
                        {
                            summary.attributes = new Dictionary<string, object>();
                        }
                    }
                }
                else
                {
                    throw new Exception("Appointment not found");
                }
            }

            // Get staff details if staff is assigned
            if (summary.staffid.HasValue && summary.staffid > 0)
            {
                string staffQuery = @"
                    SELECT name as username, email, mobile
                    FROM users
                    ";
                
                var staffQueryBuilder = querybuilderprovider.GetQueryBuilder(staffQuery);
                if (summary.staffid.HasValue && summary.staffid > 0)
                {
                    staffQueryBuilder.AddParameter("id", "=", "staffId", summary.staffid, DbTypes.Types.Long);
                }
                var staffCommand = staffQueryBuilder.GetCommand(db);
                Console.WriteLine($"Generated Staff SQL: {staffCommand.CommandText}");
                
                using (DbDataReader staffReader = await db.Execute(staffCommand))
                {
                    if (await staffReader.ReadAsync())
                    {
                        summary.staffphone = staffReader["mobile"] == DBNull.Value ? "" : staffReader["mobile"].ToString();
                        summary.staffemail = staffReader["email"] == DBNull.Value ? "" : staffReader["email"].ToString();
                    }
                }
            }

            // Get payment details
            string paymentQuery = @"
                SELECT p.id, p.amount, p.paymentmodetype, p.paymentmodecode, p.createdon
                FROM Payment p
                ";

            var paymentQueryBuilder = querybuilderprovider.GetQueryBuilder(paymentQuery);
            if (req.appointmentid > 0)
            {
                paymentQueryBuilder.AddParameter("p.appoinmentid", "=", "appointmentId", req.appointmentid, DbTypes.Types.Long);
            }
            paymentQueryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "p.createdon");
            paymentQueryBuilder.AddLimitOffset(1, 0);
            var paymentCommand = paymentQueryBuilder.GetCommand(db);
            Console.WriteLine($"Generated Payment SQL: {paymentCommand.CommandText}");
            
            using (DbDataReader paymentReader = await db.Execute(paymentCommand))
            {
                if (await paymentReader.ReadAsync())
                {
                    summary.paymentid = paymentReader["id"] == DBNull.Value ? null : Convert.ToInt32(paymentReader["id"]);
                    summary.totalamount = paymentReader["amount"] == DBNull.Value ? 0 : Convert.ToDecimal(paymentReader["amount"]);
                    summary.paymentstatus = ""; // Payment table doesn't have status column
                    summary.paymentmethod = paymentReader["paymentmodetype"] == DBNull.Value ? "" : paymentReader["paymentmodetype"].ToString();
                    summary.paymentreference = paymentReader["paymentmodecode"] == DBNull.Value ? "" : paymentReader["paymentmodecode"].ToString();
                    summary.paymentdate = paymentReader["createdon"] == DBNull.Value ? null : Convert.ToDateTime(paymentReader["createdon"]);
                }
            }

            // Get services from attributes
            if (summary.attributes.ContainsKey("servicelist"))
            {
                try
                {
                    var serviceListJson = summary.attributes["servicelist"].ToString();
                    var serviceList = System.Text.Json.JsonSerializer.Deserialize<List<System.Text.Json.JsonElement>>(serviceListJson);
                    
                    foreach (var service in serviceList)
                    {
                        summary.services.Add(new AppointmentServiceSummary
                        {
                            serviceid = service.TryGetProperty("serviceid", out var idProp) ? idProp.GetInt32() : 0,
                            servicename = service.TryGetProperty("servicename", out var nameProp) ? nameProp.GetString() ?? "" : "",
                            servicedescription = service.TryGetProperty("servicedescription", out var descProp) ? descProp.GetString() ?? "" : "",
                            serviceprice = service.TryGetProperty("serviceprice", out var priceProp) ? priceProp.GetDecimal() : 0,
                            duration = service.TryGetProperty("duration", out var durationProp) ? durationProp.GetInt32() : 0,
                            category = service.TryGetProperty("category", out var categoryProp) ? categoryProp.GetString() ?? "" : ""
                        });
                    }
                }
                catch (Exception ex)
                {
                    // Log error but continue
                    Console.WriteLine($"Error parsing services: {ex.Message}");
                }
            }

            // Get timeline
            string timelineQuery = @"
                SELECT 
                    t.id, t.taskcode, t.tasktype, t.description, t.staffname, 
                    t.apoinmentstatuscode, t.createdon, t.notes
                FROM Timeline t
                ";

            var timelineQueryBuilder = querybuilderprovider.GetQueryBuilder(timelineQuery);
            if (req.appointmentid > 0)
            {
                timelineQueryBuilder.AddParameter("t.appoinmentid", "=", "appointmentId", req.appointmentid, DbTypes.Types.Long);
            }
            timelineQueryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "t.createdon");
            var timelineCommand = timelineQueryBuilder.GetCommand(db);
            Console.WriteLine($"Generated Timeline SQL: {timelineCommand.CommandText}");
            
            using (DbDataReader timelineReader = await db.Execute(timelineCommand))
            {
                while (await timelineReader.ReadAsync())
                {
                    summary.timeline.Add(new AppointmentTimelineSummary
                    {
                        id = timelineReader["id"] == DBNull.Value ? 0 : Convert.ToInt32(timelineReader["id"]),
                        taskcode = timelineReader["taskcode"] == DBNull.Value ? "" : timelineReader["taskcode"].ToString(),
                        tasktype = timelineReader["tasktype"] == DBNull.Value ? "" : timelineReader["tasktype"].ToString(),
                        description = timelineReader["description"] == DBNull.Value ? "" : timelineReader["description"].ToString(),
                        staffname = timelineReader["staffname"] == DBNull.Value ? "" : timelineReader["staffname"].ToString(),
                        status = timelineReader["apoinmentstatuscode"] == DBNull.Value ? "" : timelineReader["apoinmentstatuscode"].ToString(),
                        createdon = timelineReader["createdon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(timelineReader["createdon"]),
                        notes = timelineReader["notes"] == DBNull.Value ? "" : timelineReader["notes"].ToString()
                    });
                }
            }

            return summary;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAppointmentSummaryTransaction: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        // Task Management Methods
        public async Task<long> GetAppointmentTaskReferenceTypeId()
        {
            try
            {
                var referenceTypeReq = new ReferenceTypeSelectReq { identifier = "APPOINTMENTTASK" };
                var referenceTypes = await referenceTypeService.Select(referenceTypeReq);
                
                if (referenceTypes != null && referenceTypes.Count > 0)
                {
                    return referenceTypes.First().id;
                }
                
                throw new Exception("APPOINTMENTTASK reference type not found");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting APPOINTMENTTASK reference type ID: {ex.Message}");
                throw;
            }
        }

        public async Task<ReferenceValue> AddAppointmentTask(AddAppointmentTaskReq req)
        {
            try
            {
                // Get the APPOINTMENTTASK reference type ID
                long referenceTypeId = await GetAppointmentTaskReferenceTypeId();
                
                // Create a new ReferenceValue for the task
                var task = new ReferenceValue
                {
                    identifier = req.taskname,
                    displaytext = req.taskname,
                    langcode = "en",
                    organizationid = (int)req.organizationid,
                    parentid = req.appointmentid, // Link to appointment
                    notes = req.description,
                    attributes = new ReferenceValue.AttributesData
                    {
                        // You can add custom attributes here if needed
                    }
                };

                // Insert the task using ReferenceValueService
                var result = await referenceValueService.Insert(task);
                
                // Add timeline entry
                await timelineService.Insert(new Timeline
                {
                    organisationid = req.organizationid,
                    organisationlocationid = req.organisationlocationid,
                    appoinmentid = req.appointmentid,
                    tasktypeid = (long)TimelineStatus.Status,
                    taskcode = "Task Added",
                    description = $"Task '{req.taskname}' added to appointment"
                });

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error adding appointment task: {ex.Message}");
                throw;
            }
        }

        public async Task<List<ReferenceValue>> GetAppointmentTasks(long appointmentId, long organizationId)
        {
            try
            {
                // Get the APPOINTMENTTASK reference type ID
                long referenceTypeId = await GetAppointmentTaskReferenceTypeId();
                
                // Get tasks for this appointment
                var taskReq = new ReferenceValueSelectReq
                {
                    parentid = appointmentId,
                    referencetypeid = referenceTypeId
                };
                
                var tasks = await referenceValueService.Select(taskReq);
                
                // Filter by organization if needed
                return tasks?.Where(t => t.organizationid == organizationId).ToList() ?? new List<ReferenceValue>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error getting appointment tasks: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> UpdateAppointmentTask(UpdateAppointmentTaskReq req)
        {
            try
            {
                var task = new ReferenceValue
                {
                    id = req.taskid,
                    identifier = req.taskname,
                    displaytext = req.taskname,
                    langcode = "en",
                    organizationid = (int)req.organizationid,
                    parentid = req.appointmentid,
                    notes = req.description,
                    version = req.version
                };

                var result = await referenceValueService.Update(task);
                
                // Add timeline entry
                await timelineService.Insert(new Timeline
                {
                    organisationid = req.organizationid,
                    organisationlocationid = req.organisationlocationid,
                    appoinmentid = req.appointmentid,
                    tasktypeid = (long)TimelineStatus.Status,
                    taskcode = "Task Updated",
                    description = $"Task '{req.taskname}' updated"
                });

                return result != null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating appointment task: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> DeleteAppointmentTask(DeleteAppointmentTaskReq req)
        {
            try
            {
                var deleteReq = new ReferenceValueDeleteReq
                {
                    id = req.taskid,
                    version = req.version
                };

                var result = await referenceValueService.Delete(deleteReq);
                
                // Add timeline entry
                await timelineService.Insert(new Timeline
                {
                    organisationid = req.organizationid,
                    organisationlocationid = req.organisationlocationid,
                    appoinmentid = req.appointmentid,
                    tasktypeid = (long)TimelineStatus.Status,
                    taskcode = "Task Deleted",
                    description = $"Task deleted from appointment"
                });

                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting appointment task: {ex.Message}");
                throw;
            }
        }

        public async Task<List<BookedAppoinmentRes>> SearchAppointmentsByMobile(SearchAppointmentByMobileReq req)
        {
            List<BookedAppoinmentRes> result = new List<BookedAppoinmentRes>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SearchAppointmentsByMobileTransaction(db, req);
            }
            return result;
        }

        public async Task<List<ClientInfoRes>> SelectUniqueClients(ClientsSelectReq req)
        {
            List<ClientInfoRes> result = new List<ClientInfoRes>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectUniqueClientsTransaction(db, req);
            }
            return result;
        }

        public async Task<List<ClientInfoRes>> SelectUniqueClientsTransaction(IDb db, ClientsSelectReq req)
        {
            List<ClientInfoRes> result = new List<ClientInfoRes>();

            string query = @"
                SELECT 
                    u.id AS userid,
                    u.name AS username,
                    u.mobile,
                    ol.city
                FROM Appoinment a
                LEFT JOIN users u ON u.id = a.userid
                LEFT JOIN organisationlocation ol ON ol.id = a.organisationlocationid
                WHERE a.isactive = TRUE
            ";

            // Build dynamic filters
            bool hasOrganisationId = req.organisationid > 0;
            bool hasLocation = req.organisationlocationid > 0;
            bool hasMobileFilter = !string.IsNullOrWhiteSpace(req.mobilenumber);

            // Filter by organisationlocationid (primary filter - can be used alone)
            if (hasLocation)
            {
                query += " AND a.organisationlocationid = @organisationlocationid";
            }
            
            // Filter by organisationid (optional - only if provided)
            if (hasOrganisationId)
            {
                query += " AND a.organisationid = @organisationid";
            }
            
            // Mobile/name search filter
            if (hasMobileFilter)
            {
                query += " AND (u.mobile LIKE @mobilenumber OR u.name LIKE @mobilenumber)";
            }

            // Group to ensure unique users
            query += "\n GROUP BY u.id, u.name, u.mobile, ol.city\n ORDER BY u.name ASC";

            var command = db.GetCommand(query);
            
            // Add parameters conditionally
            if (hasLocation)
            {
                db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = req.organisationlocationid;
            }
            if (hasOrganisationId)
            {
                db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = req.organisationid;
            }
            if (hasMobileFilter)
            {
                db.AddParameter(command, "mobilenumber", DbTypes.Types.String).Value = $"%{req.mobilenumber}%";
            }

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    var temp = new ClientInfoRes
                    {
                        userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]),
                        username = reader["username"] == DBNull.Value ? "" : reader["username"].ToString(),
                        mobile = reader["mobile"] == DBNull.Value ? "" : reader["mobile"].ToString(),
                        city = reader["city"] == DBNull.Value ? "" : reader["city"].ToString()
                    };
                    result.Add(temp);
                }
            }

            return result;
        }

        public async Task<List<BookedAppoinmentRes>> SearchAppointmentsByMobileTransaction(IDb db, SearchAppointmentByMobileReq req)
        {
            List<BookedAppoinmentRes> result = new List<BookedAppoinmentRes>();
            
            // Query to search appointments by mobile number
            // First get user ID by mobile number, then get appointments for that user and organization
            string query = @"
                SELECT 
                    a.id,
                    a.userid,
                    a.organisationid,
                    a.fromtime,
                    a.totime,
                    a.appoinmentdate,
                    a.status,
                    a.statuscode,
                    a.version,
                    a.createdby,
                    a.createdon,
                    a.modifiedby,
                    a.modifiedon,
                    a.attributes,
                    a.isactive,
                    a.issuspended,
                    a.organisationlocationid,
                    a.isfactory,
                    a.notes,
                    a.staffid,
                    a.staffname,
                    a.ispaid,
                    a.isusercancel,
                    a.fileid,
                    a.tasklist,
                    a.resheduledate,
                    a.ishasreshedule,
                    users.name AS username,
                    users.mobile,
                    organisation.name AS organisationname,
                    organisationlocation.city
                FROM Appoinment a
                LEFT JOIN users ON users.id = a.userid
                LEFT JOIN organisation ON organisation.id = a.organisationid
                LEFT JOIN organisationlocation ON organisationlocation.id = a.organisationlocationid
                WHERE a.organisationid = @organisationid
                AND (users.mobile LIKE @mobilenumber OR users.name LIKE @mobilenumber)
                AND a.isactive = true
                ORDER BY a.appoinmentdate DESC, a.fromtime DESC
            ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = req.organisationid;
            db.AddParameter(command, "mobilenumber", DbTypes.Types.String).Value = $"%{req.mobilenumber}%";

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    BookedAppoinmentRes temp = new BookedAppoinmentRes();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]);
                    temp.organizationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.fromtime = reader["fromtime"] == DBNull.Value ? TimeSpan.Zero : TimeSpan.Parse(reader["fromtime"].ToString());
                    temp.totime = reader["totime"] == DBNull.Value ? TimeSpan.Zero : TimeSpan.Parse(reader["totime"].ToString());
                    temp.appoinmentdate = reader["appoinmentdate"] == DBNull.Value ? new DateTime() : Convert.ToDateTime(reader["appoinmentdate"]);
                    temp.status = reader["status"] == DBNull.Value ? 0 : Convert.ToInt32(reader["status"]);
                    temp.statuscode = reader["statuscode"] == DBNull.Value ? "" : reader["statuscode"].ToString();
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
                    temp.isusercancel = reader["isusercancel"] == DBNull.Value ? false : Convert.ToBoolean(reader["isusercancel"]);
                    temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    temp.staffid = reader["staffid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["staffid"]);
                    temp.staffname = reader["staffname"] == DBNull.Value ? "" : reader["staffname"].ToString();
                    temp.ispaid = reader["ispaid"] == DBNull.Value ? false : Convert.ToBoolean(reader["ispaid"]);
                    
                    // New columns mapping
                    temp.fileid_json = reader["fileid"] == DBNull.Value ? "null" : reader["fileid"].ToString();
                    temp.tasklist_json = reader["tasklist"] == DBNull.Value ? "null" : reader["tasklist"].ToString();
                    temp.resheduledate = reader["resheduledate"] == DBNull.Value ? null : Convert.ToDateTime(reader["resheduledate"]);
                    temp.ishasreshedule = reader["ishasreshedule"] == DBNull.Value ? false : Convert.ToBoolean(reader["ishasreshedule"]);

                    // User information
                    temp.username = reader["username"] == DBNull.Value ? "" : reader["username"].ToString();
                    temp.mobile = reader["mobile"] == DBNull.Value ? "" : reader["mobile"].ToString();
                    temp.organisationname = reader["organisationname"] == DBNull.Value ? "" : reader["organisationname"].ToString();
                    temp.city = reader["city"] == DBNull.Value ? "" : reader["city"].ToString();

                    result.Add(temp);
                }
            }
            return result;
        }
    }
}