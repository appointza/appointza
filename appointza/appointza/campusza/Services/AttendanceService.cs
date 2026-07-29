using appointza.Models.Campusza;
using appointza.Models;
using appointza.Utils;
using System.Data.Common;
using System.Globalization;

namespace appointza.Services.Campusza
{
    public class AttendanceService
    {
        ICampuszaDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        StudentService studentService;

        public AttendanceService(ICampuszaDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate, StudentService studentService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.studentService = studentService;
        }

        public async Task<List<Attendance>> Select(AttendanceSelectReq req)
        {
            List<Attendance> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Attendance>> SelectTransaction(IDb db, AttendanceSelectReq req)
        {
            List<Attendance> result = new List<Attendance>();
            string query = @"
                SELECT 
                    id, type, date, class_id, class_name, student_id, student_name, staff_id, staff_name,
                    status, check_in_time, check_out_time, remarks, marked_by, marked_at,
                    organization_id, isactive, created_at, updated_at
                FROM attendance
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (!string.IsNullOrWhiteSpace(req.id))
            {
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.organizationid))
            {
                queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.classid))
            {
                queryBuilder.AddParameter("class_id", "=", "class_id", req.classid, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.studentid))
            {
                queryBuilder.AddParameter("student_id", "=", "student_id", req.studentid, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.staffid))
            {
                queryBuilder.AddParameter("staff_id", "=", "staff_id", req.staffid, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.type))
            {
                queryBuilder.AddParameter("type", "=", "type", req.type, DbTypes.Types.String);
            }
            if (req.fromdate.HasValue)
            {
                queryBuilder.AddParameter("date", ">=", "fromdate", req.fromdate.Value.Date, DbTypes.Types.Date);
            }
            if (req.todate.HasValue)
            {
                queryBuilder.AddParameter("date", "<=", "todate", req.todate.Value.Date, DbTypes.Types.Date);
            }

            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "date");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Attendance temp = new Attendance();
                    temp.id = reader["id"]?.ToString() ?? "";
                    temp.type = reader["type"] == DBNull.Value ? "" : reader["type"].ToString();
                    temp.date = reader["date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["date"]);
                    temp.classid = reader["class_id"] == DBNull.Value ? "" : reader["class_id"].ToString();
                    temp.classname = reader["class_name"] == DBNull.Value ? "" : reader["class_name"].ToString();
                    temp.studentid = reader["student_id"] == DBNull.Value ? "" : reader["student_id"].ToString();
                    temp.studentname = reader["student_name"] == DBNull.Value ? "" : reader["student_name"].ToString();
                    temp.staffid = reader["staff_id"] == DBNull.Value ? "" : reader["staff_id"].ToString();
                    temp.staffname = reader["staff_name"] == DBNull.Value ? "" : reader["staff_name"].ToString();
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    temp.checkintime = reader["check_in_time"] == DBNull.Value ? "" : reader["check_in_time"].ToString();
                    temp.checkouttime = reader["check_out_time"] == DBNull.Value ? "" : reader["check_out_time"].ToString();
                    temp.remarks = reader["remarks"] == DBNull.Value ? "" : reader["remarks"].ToString();
                    temp.markedby = reader["marked_by"] == DBNull.Value ? "" : reader["marked_by"].ToString();
                    temp.markedat = reader["marked_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["marked_at"]);
                    temp.organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString();
                    temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    temp.createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]);
                    temp.updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]);

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<Attendance> Insert(Attendance attendance)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, attendance);
            }
            return attendance;
        }

        public async Task InsertTransaction(IDb db, Attendance attendance)
        {
            string query = @"
                INSERT INTO attendance (
                    id, type, date, class_id, class_name, student_id, student_name, staff_id, staff_name,
                    status, check_in_time, check_out_time, remarks, marked_by, marked_at,
                    organization_id, isactive, created_at, updated_at
                )
                VALUES (
                    @id, @type, @date, @class_id, @class_name, @student_id, @student_name, @staff_id, @staff_name,
                    @status, @check_in_time, @check_out_time, @remarks, @marked_by, @marked_at,
                    @organization_id, @isactive, @created_at, @updated_at
                )
                RETURNING id;
            ";

            if (string.IsNullOrWhiteSpace(attendance.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            DateTime now = DateTime.UtcNow;
            attendance.id = string.IsNullOrWhiteSpace(attendance.id) ? Guid.NewGuid().ToString() : attendance.id;
            attendance.isactive = true;
            attendance.createdat = now;
            attendance.updatedat = now;

            if (string.IsNullOrWhiteSpace(attendance.markedby))
                attendance.markedby = ResolveActor();
            if (attendance.markedat == DateTime.MinValue)
                attendance.markedat = now;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = attendance.id;
            db.AddParameter(command, "type", DbTypes.Types.String).Value = attendance.type ?? "";
            db.AddParameter(command, "date", DbTypes.Types.Date).Value = attendance.date.Date;
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.classid) ? DBNull.Value : attendance.classid;
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = attendance.classname ?? "";
            db.AddParameter(command, "student_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.studentid) ? DBNull.Value : attendance.studentid;
            db.AddParameter(command, "student_name", DbTypes.Types.String).Value = attendance.studentname ?? "";
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.staffid) ? DBNull.Value : attendance.staffid;
            db.AddParameter(command, "staff_name", DbTypes.Types.String).Value = attendance.staffname ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = attendance.status ?? "";
            db.AddParameter(command, "check_in_time", DbTypes.Types.Time).Value = ParseTimeOrNull(attendance.checkintime);
            db.AddParameter(command, "check_out_time", DbTypes.Types.Time).Value = ParseTimeOrNull(attendance.checkouttime);
            db.AddParameter(command, "remarks", DbTypes.Types.String).Value = attendance.remarks ?? "";
            db.AddParameter(command, "marked_by", DbTypes.Types.String).Value = attendance.markedby ?? "";
            db.AddParameter(command, "marked_at", DbTypes.Types.DateTime).Value = attendance.markedat;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = attendance.organizationid ?? "";
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = attendance.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = attendance.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = attendance.updatedat;

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    attendance.id = reader["id"]?.ToString() ?? "";
                }
            }
        }

        public async Task<Attendance> Update(Attendance attendance)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, attendance);
            }
            return attendance;
        }

        public async Task<bool> UpdateTransaction(IDb db, Attendance attendance)
        {
            bool result = false;
            string query = @"
                UPDATE attendance
                SET 
                    type = @type, date = @date, class_id = @class_id, class_name = @class_name, 
                    student_id = @student_id, student_name = @student_name, staff_id = @staff_id, staff_name = @staff_name,
                    status = @status, check_in_time = @check_in_time, check_out_time = @check_out_time, remarks = @remarks,
                    marked_by = @marked_by, marked_at = @marked_at,
                    organization_id = @organization_id, isactive = @isactive, updated_at = @updated_at
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            attendance.updatedat = DateTime.UtcNow;
            if (string.IsNullOrWhiteSpace(attendance.markedby))
                attendance.markedby = ResolveActor();

            db.AddParameter(command, "id", DbTypes.Types.String).Value = attendance.id ?? "";
            db.AddParameter(command, "type", DbTypes.Types.String).Value = attendance.type ?? "";
            db.AddParameter(command, "date", DbTypes.Types.Date).Value = attendance.date.Date;
            db.AddParameter(command, "class_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.classid) ? DBNull.Value : attendance.classid;
            db.AddParameter(command, "class_name", DbTypes.Types.String).Value = attendance.classname ?? "";
            db.AddParameter(command, "student_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.studentid) ? DBNull.Value : attendance.studentid;
            db.AddParameter(command, "student_name", DbTypes.Types.String).Value = attendance.studentname ?? "";
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = string.IsNullOrWhiteSpace(attendance.staffid) ? DBNull.Value : attendance.staffid;
            db.AddParameter(command, "staff_name", DbTypes.Types.String).Value = attendance.staffname ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = attendance.status ?? "";
            db.AddParameter(command, "check_in_time", DbTypes.Types.Time).Value = ParseTimeOrNull(attendance.checkintime);
            db.AddParameter(command, "check_out_time", DbTypes.Types.Time).Value = ParseTimeOrNull(attendance.checkouttime);
            db.AddParameter(command, "remarks", DbTypes.Types.String).Value = attendance.remarks ?? "";
            db.AddParameter(command, "marked_by", DbTypes.Types.String).Value = attendance.markedby ?? "";
            db.AddParameter(command, "marked_at", DbTypes.Types.DateTime).Value = attendance.markedat;
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = attendance.organizationid ?? "";
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = attendance.isactive;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = attendance.updatedat;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(AttendanceDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, AttendanceDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE attendance
                SET isactive = false,
                    updated_at = @updated_at
                WHERE id = @id
            ";
            
            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id ?? "";
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        private object ParseTimeOrNull(string time)
        {
            if (string.IsNullOrWhiteSpace(time))
                return DBNull.Value;
            if (TimeSpan.TryParse(time, out var parsed))
                return parsed;
            return DBNull.Value;
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }

        /// <summary>Single API: fetch students for the class and their attendance status for the given date; merge and return.</summary>
        public async Task<List<StudentWithAttendanceItem>> GetStudentsWithAttendance(StudentsWithAttendanceReq req)
        {
            var orgId = req.organizationid?.Trim() ?? "";
            if (string.IsNullOrWhiteSpace(orgId) && requeststate.usercontext?.organisationid > 0)
                orgId = requeststate.usercontext.organisationid.ToString(CultureInfo.InvariantCulture);
            if (string.IsNullOrWhiteSpace(orgId))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");
            if (string.IsNullOrWhiteSpace(req.classid))
                return new List<StudentWithAttendanceItem>();

            // Do not filter by students.status here — many DBs use empty/reference values; is_active is already required in StudentService.
            var studentsReq = new StudentSelectReq
            {
                organizationid = orgId,
                classid = req.classid,
                status = ""
            };
            var students = await studentService.Select(studentsReq);

            var attendanceReq = new AttendanceSelectReq
            {
                organizationid = orgId,
                classid = req.classid,
                type = "student"
            };
            if (!string.IsNullOrWhiteSpace(req.date) &&
                DateTime.TryParse(req.date, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dateVal))
            {
                attendanceReq.fromdate = dateVal.Date;
                attendanceReq.todate = dateVal.Date;
            }
            var attendanceList = await Select(attendanceReq);

            var statusByStudent = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            foreach (var a in attendanceList)
            {
                if (string.IsNullOrWhiteSpace(a.studentid) || string.IsNullOrWhiteSpace(a.status))
                    continue;
                statusByStudent[a.studentid] = a.status;
            }

            var result = new List<StudentWithAttendanceItem>();
            foreach (var s in students)
            {
                var st = "";
                if (!string.IsNullOrWhiteSpace(s.id) && statusByStudent.TryGetValue(s.id, out var byPk))
                    st = byPk;
                else if (!string.IsNullOrWhiteSpace(s.studentid) && statusByStudent.TryGetValue(s.studentid, out var byCode))
                    st = byCode;

                result.Add(new StudentWithAttendanceItem
                {
                    id = s.id,
                    studentid = s.studentid ?? "",
                    firstname = s.firstname ?? "",
                    lastname = s.lastname ?? "",
                    fullname = s.fullname ?? "",
                    rollnumber = s.rollnumber,
                    classid = s.classid ?? "",
                    classname = s.classname ?? "",
                    attendancestatus = st
                });
            }
            return result;
        }
    }
}
