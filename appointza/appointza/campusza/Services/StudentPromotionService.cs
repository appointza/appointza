using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Common;
using System.Linq;
using System.Threading.Tasks;
using appointza.Models;
using appointza.Models.Campusza;
using appointza.Utils;

namespace appointza.Services.Campusza
{
    public class StudentPromotionService
    {
        private ICampuszaDbProvider dbprovider;
        private IQueryBuilderProvider querybuilderprovider;
        private RequestState requeststate;

        public StudentPromotionService(ICampuszaDbProvider dbprov, IQueryBuilderProvider qprov, RequestState rstate)
        {
            dbprovider = dbprov;
            querybuilderprovider = qprov;
            requeststate = rstate;
        }

        // Get academic history for a student
        public async Task<List<StudentAcademicHistory>> GetStudentAcademicHistory(string studentId, string organizationId)
        {
            if (string.IsNullOrWhiteSpace(organizationId))
                organizationId = requeststate.usercontext.organisationid.ToString();

            List<StudentAcademicHistory> result = new List<StudentAcademicHistory>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                string query = @"
                    SELECT id, organization_id, student_id, academic_year, grade, class_id, 
                           class_name, section, roll_number, total_marks, percentage, gpa, 
                           grade_letter, promotion_status, promotion_date, is_active, 
                           created_at, updated_at, created_by, updated_by
                    FROM student_academic_history
                    WHERE student_id = @student_id AND organization_id = @organization_id
                    ORDER BY created_at DESC, academic_year DESC
                ";

                DbCommand command = db.GetCommand(query);
                db.AddParameter(command, "student_id", DbTypes.Types.String);
                command.Parameters["student_id"].Value = studentId;
                db.AddParameter(command, "organization_id", DbTypes.Types.String);
                command.Parameters["organization_id"].Value = organizationId;

                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        result.Add(MapToAcademicHistory(reader));
                    }
                }
            }
            return result;
        }

        // Get all promotions
        public async Task<List<StudentPromotion>> SelectPromotions(StudentPromotionSelectReq req)
        {
            List<StudentPromotion> result = new List<StudentPromotion>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await SelectPromotionsTransaction(db, req);
            }
            return result;
        }

        public async Task<List<StudentPromotion>> SelectPromotionsTransaction(IDb db, StudentPromotionSelectReq req)
        {
            List<StudentPromotion> result = new List<StudentPromotion>();
            
            // Auto-fill organization ID if missing
            if (string.IsNullOrWhiteSpace(req.organizationid))
                req.organizationid = requeststate.usercontext.organisationid.ToString();

            string query = @"
                SELECT id, organization_id, student_id, student_name, from_grade, from_class_id,
                       from_class_name, to_grade, to_class_id, to_class_name, academic_year_from,
                       academic_year_to, final_percentage, gpa, promotion_type, promotion_date,
                       promoted_by, notes, is_active, created_at, updated_at, created_by, updated_by
                FROM student_promotions
                WHERE is_active = true
            ";

            if (!string.IsNullOrWhiteSpace(req.organizationid))
                query += " AND organization_id = @organization_id";
            if (!string.IsNullOrWhiteSpace(req.studentid))
                query += " AND student_id = @student_id";
            if (!string.IsNullOrWhiteSpace(req.academicyear))
                query += " AND academic_year_from = @academic_year";

            query += " ORDER BY promotion_date DESC";

            DbCommand command = db.GetCommand(query);
            
            if (!string.IsNullOrWhiteSpace(req.organizationid))
            {
                db.AddParameter(command, "organization_id", DbTypes.Types.String);
                command.Parameters["organization_id"].Value = req.organizationid;
            }
            if (!string.IsNullOrWhiteSpace(req.studentid))
            {
                db.AddParameter(command, "student_id", DbTypes.Types.String);
                command.Parameters["student_id"].Value = req.studentid;
            }
            if (!string.IsNullOrWhiteSpace(req.academicyear))
            {
                db.AddParameter(command, "academic_year", DbTypes.Types.String);
                command.Parameters["academic_year"].Value = req.academicyear;
            }

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    result.Add(MapToPromotion(reader));
                }
            }
            return result;
        }

        // Bulk promote students
        public async Task<List<StudentPromotion>> BulkPromoteStudents(BulkPromotionRequest req)
        {
            List<StudentPromotion> result = new List<StudentPromotion>();
            
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await db.BeginTransaction();
                
                try
                {
                    // Step 1: Archive current academic year data
                    await ArchiveStudentDataTransaction(db, req.organizationid, req.studentids, req.fromgrade, req.fromacademicyear);

                    // Step 2: Update students table
                    await UpdateStudentGradesTransaction(db, req);

                    // Step 3: Create promotion records
                    result = await CreatePromotionRecordsTransaction(db, req);

                    await db.CommitTransaction();
                }
                catch (Exception ex)
                {
                    await db.RollbackTransaction();
                    throw new Exception($"Bulk promotion failed: {ex.Message}", ex);
                }
            }
            return result;
        }

        // Archive student data before promotion
        private async Task ArchiveStudentDataTransaction(IDb db, string organizationId, List<string> studentIds, string grade, string academicYear)
        {
            if (studentIds == null || studentIds.Count == 0)
                return;

            string query = @"
                INSERT INTO student_academic_history 
                    (organization_id, student_id, academic_year, grade, class_id, class_name, 
                     section, roll_number, is_active, promotion_status, promotion_date,
                     created_at, updated_at, created_by, updated_by)
                SELECT 
                    organization_id, id, @academic_year, grade, class_id, class_name, 
                    section, roll_number, is_active, 'promoted', CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, @created_by, @updated_by
                FROM students
                WHERE id IN (SELECT trim(both FROM unnest(string_to_array(@student_ids, ','))))
                AND organization_id = @organization_id
                AND grade = @grade
            ";

            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "academic_year", DbTypes.Types.String);
            cmd.Parameters["academic_year"].Value = academicYear;
            db.AddParameter(cmd, "grade", DbTypes.Types.String);
            cmd.Parameters["grade"].Value = grade;
            db.AddParameter(cmd, "student_ids", DbTypes.Types.String);
            cmd.Parameters["student_ids"].Value = string.Join(",", studentIds.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()));
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String);
            cmd.Parameters["organization_id"].Value = organizationId;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String);
            cmd.Parameters["created_by"].Value = requeststate.usercontext.userid.ToString();
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String);
            cmd.Parameters["updated_by"].Value = requeststate.usercontext.userid.ToString();

            await db.ExecuteNonQuery(cmd);
        }

        // Update students table with new grades and classes
        private async Task UpdateStudentGradesTransaction(IDb db, BulkPromotionRequest req)
        {
            if (req.studentids == null || req.studentids.Count == 0)
                return;

            // Get the next grade (increment)
            string nextGrade = IncrementGrade(req.fromgrade);

            string query = @"
                WITH ranked_students AS (
                    SELECT 
                        id,
                        ROW_NUMBER() OVER (ORDER BY roll_number) as new_roll_number
                    FROM students
                    WHERE id IN (SELECT trim(both FROM unnest(string_to_array(@student_ids, ','))))
                    AND organization_id = @organization_id
                    AND grade = @from_grade
                )
                UPDATE students
                SET
                    grade = @to_grade,
                    class_id = @to_class_id,
                    class_name = @to_class_name,
                    section = @to_section,
                    roll_number = ranked_students.new_roll_number,
                    current_academic_year = @to_academic_year,
                    current_term_id = @new_term_id,
                    current_term_name = @new_term_name,
                    updated_at = CURRENT_TIMESTAMP,
                    updated_by = @updated_by
                FROM ranked_students
                WHERE students.id = ranked_students.id
            ";

            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "student_ids", DbTypes.Types.String);
            cmd.Parameters["student_ids"].Value = string.Join(",", req.studentids.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()));
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String);
            cmd.Parameters["organization_id"].Value = req.organizationid;
            db.AddParameter(cmd, "from_grade", DbTypes.Types.String);
            cmd.Parameters["from_grade"].Value = req.fromgrade;
            db.AddParameter(cmd, "to_grade", DbTypes.Types.String);
            cmd.Parameters["to_grade"].Value = nextGrade;
            db.AddParameter(cmd, "to_class_id", DbTypes.Types.String);
            cmd.Parameters["to_class_id"].Value = req.toclassid;
            db.AddParameter(cmd, "to_class_name", DbTypes.Types.String);
            cmd.Parameters["to_class_name"].Value = req.toclassname;
            db.AddParameter(cmd, "to_section", DbTypes.Types.String);
            cmd.Parameters["to_section"].Value = req.tosection;
            db.AddParameter(cmd, "to_academic_year", DbTypes.Types.String);
            cmd.Parameters["to_academic_year"].Value = req.toacademicyear;
            db.AddParameter(cmd, "new_term_id", DbTypes.Types.String);
            cmd.Parameters["new_term_id"].Value = req.newtermid;
            db.AddParameter(cmd, "new_term_name", DbTypes.Types.String);
            cmd.Parameters["new_term_name"].Value = req.newtermname;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String);
            cmd.Parameters["updated_by"].Value = requeststate.usercontext.userid.ToString();

            await db.ExecuteNonQuery(cmd);
        }

        // Create promotion records
        private async Task<List<StudentPromotion>> CreatePromotionRecordsTransaction(IDb db, BulkPromotionRequest req)
        {
            List<StudentPromotion> result = new List<StudentPromotion>();

            if (req.studentids == null || req.studentids.Count == 0)
                return result;

            // Get student details for creating promotion records
            string selectQuery = @"
                SELECT id, full_name, grade, class_id, class_name
                FROM students
                WHERE id IN (SELECT trim(both FROM unnest(string_to_array(@student_ids, ','))))
                AND organization_id = @organization_id
            ";

            DbCommand selectCmd = db.GetCommand(selectQuery);
            db.AddParameter(selectCmd, "student_ids", DbTypes.Types.String);
            selectCmd.Parameters["student_ids"].Value = string.Join(",", req.studentids.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()));
            db.AddParameter(selectCmd, "organization_id", DbTypes.Types.String);
            selectCmd.Parameters["organization_id"].Value = req.organizationid;

            List<(string studentId, string studentName, string grade, string classId, string className)> students = new();

            using (DbDataReader reader = await db.Execute(selectCmd))
            {
                while (await reader.ReadAsync())
                {
                    students.Add((
                        reader["id"]?.ToString() ?? "",
                        reader["full_name"]?.ToString() ?? "",
                        reader["grade"]?.ToString() ?? "",
                        reader["class_id"]?.ToString() ?? "",
                        reader["class_name"]?.ToString() ?? ""
                    ));
                }
            }

            // Create promotion records
            foreach (var student in students)
            {
                var promotion = new StudentPromotion
                {
                    id = Guid.NewGuid().ToString(),
                    organizationid = req.organizationid,
                    studentid = student.studentId,
                    studentname = student.studentName,
                    fromgrade = req.fromgrade,
                    fromclassid = student.classId,
                    fromclassname = student.className,
                    tograde = IncrementGrade(req.fromgrade),
                    toclassid = req.toclassid,
                    toclassname = req.toclassname,
                    academicyearfrom = req.fromacademicyear,
                    academicyearto = req.toacademicyear,
                    promotiontype = "promoted",
                    promotiondate = DateTime.UtcNow,
                    promotedby = req.promotedby,
                    notes = req.notes,
                    isactive = true,
                    createdat = DateTime.UtcNow,
                    updatedat = DateTime.UtcNow,
                    createdby = requeststate.usercontext.userid.ToString(),
                    updatedby = requeststate.usercontext.userid.ToString()
                };

                await SavePromotionRecordTransaction(db, promotion);
                result.Add(promotion);
            }

            return result;
        }

        // Save individual promotion record
        private async Task SavePromotionRecordTransaction(IDb db, StudentPromotion promotion)
        {
            string query = @"
                INSERT INTO student_promotions 
                    (id, organization_id, student_id, student_name, from_grade, from_class_id,
                     from_class_name, to_grade, to_class_id, to_class_name, academic_year_from,
                     academic_year_to, promotion_type, promotion_date, promoted_by, notes,
                     is_active, created_at, updated_at, created_by, updated_by)
                VALUES 
                    (@id, @organization_id, @student_id, @student_name, @from_grade, @from_class_id,
                     @from_class_name, @to_grade, @to_class_id, @to_class_name, @academic_year_from,
                     @academic_year_to, @promotion_type, @promotion_date, @promoted_by, @notes,
                     @is_active, @created_at, @updated_at, @created_by, @updated_by)
            ";

            DbCommand cmd = db.GetCommand(query);
            db.AddParameter(cmd, "id", DbTypes.Types.String);
            cmd.Parameters["id"].Value = promotion.id;
            db.AddParameter(cmd, "organization_id", DbTypes.Types.String);
            cmd.Parameters["organization_id"].Value = promotion.organizationid;
            db.AddParameter(cmd, "student_id", DbTypes.Types.String);
            cmd.Parameters["student_id"].Value = promotion.studentid;
            db.AddParameter(cmd, "student_name", DbTypes.Types.String);
            cmd.Parameters["student_name"].Value = promotion.studentname;
            db.AddParameter(cmd, "from_grade", DbTypes.Types.String);
            cmd.Parameters["from_grade"].Value = promotion.fromgrade;
            db.AddParameter(cmd, "from_class_id", DbTypes.Types.String);
            cmd.Parameters["from_class_id"].Value = promotion.fromclassid ?? "";
            db.AddParameter(cmd, "from_class_name", DbTypes.Types.String);
            cmd.Parameters["from_class_name"].Value = promotion.fromclassname ?? "";
            db.AddParameter(cmd, "to_grade", DbTypes.Types.String);
            cmd.Parameters["to_grade"].Value = promotion.tograde;
            db.AddParameter(cmd, "to_class_id", DbTypes.Types.String);
            cmd.Parameters["to_class_id"].Value = promotion.toclassid ?? "";
            db.AddParameter(cmd, "to_class_name", DbTypes.Types.String);
            cmd.Parameters["to_class_name"].Value = promotion.toclassname ?? "";
            db.AddParameter(cmd, "academic_year_from", DbTypes.Types.String);
            cmd.Parameters["academic_year_from"].Value = promotion.academicyearfrom;
            db.AddParameter(cmd, "academic_year_to", DbTypes.Types.String);
            cmd.Parameters["academic_year_to"].Value = promotion.academicyearto;
            db.AddParameter(cmd, "promotion_type", DbTypes.Types.String);
            cmd.Parameters["promotion_type"].Value = promotion.promotiontype;
            db.AddParameter(cmd, "promotion_date", DbTypes.Types.DateTime);
            cmd.Parameters["promotion_date"].Value = promotion.promotiondate;
            db.AddParameter(cmd, "promoted_by", DbTypes.Types.String);
            cmd.Parameters["promoted_by"].Value = promotion.promotedby;
            db.AddParameter(cmd, "notes", DbTypes.Types.String);
            cmd.Parameters["notes"].Value = promotion.notes ?? "";
            db.AddParameter(cmd, "is_active", DbTypes.Types.Boolean);
            cmd.Parameters["is_active"].Value = promotion.isactive;
            db.AddParameter(cmd, "created_at", DbTypes.Types.DateTime);
            cmd.Parameters["created_at"].Value = promotion.createdat;
            db.AddParameter(cmd, "updated_at", DbTypes.Types.DateTime);
            cmd.Parameters["updated_at"].Value = promotion.updatedat;
            db.AddParameter(cmd, "created_by", DbTypes.Types.String);
            cmd.Parameters["created_by"].Value = promotion.createdby;
            db.AddParameter(cmd, "updated_by", DbTypes.Types.String);
            cmd.Parameters["updated_by"].Value = promotion.updatedby ?? "";

            await db.ExecuteNonQuery(cmd);
        }

        // Helper: Increment grade (9 -> 10, 10 -> 11, etc.)
        private string IncrementGrade(string grade)
        {
            if (int.TryParse(grade, out int gradeNum))
            {
                return (gradeNum + 1).ToString();
            }
            return grade;
        }

        // Map reader to StudentAcademicHistory
        private StudentAcademicHistory MapToAcademicHistory(DbDataReader reader)
        {
            return new StudentAcademicHistory
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                studentid = reader["student_id"]?.ToString() ?? "",
                academicyear = reader["academic_year"]?.ToString() ?? "",
                grade = reader["grade"]?.ToString() ?? "",
                classid = reader["class_id"]?.ToString() ?? "",
                classname = reader["class_name"]?.ToString() ?? "",
                section = reader["section"]?.ToString() ?? "",
                rollnumber = reader["roll_number"] == DBNull.Value ? null : Convert.ToInt32(reader["roll_number"]),
                totalmarks = reader["total_marks"] == DBNull.Value ? null : Convert.ToDecimal(reader["total_marks"]),
                percentage = reader["percentage"] == DBNull.Value ? null : Convert.ToDecimal(reader["percentage"]),
                gpa = reader["gpa"] == DBNull.Value ? null : Convert.ToDecimal(reader["gpa"]),
                gradeletter = reader["grade_letter"]?.ToString() ?? "",
                promotionstatus = reader["promotion_status"]?.ToString() ?? "current",
                promotiondate = reader["promotion_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["promotion_date"]),
                isactive = reader["is_active"] == DBNull.Value ? true : Convert.ToBoolean(reader["is_active"]),
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"]?.ToString() ?? "",
                updatedby = reader["updated_by"]?.ToString() ?? ""
            };
        }

        // Map reader to StudentPromotion
        private StudentPromotion MapToPromotion(DbDataReader reader)
        {
            return new StudentPromotion
            {
                id = reader["id"]?.ToString() ?? "",
                organizationid = reader["organization_id"]?.ToString() ?? "",
                studentid = reader["student_id"]?.ToString() ?? "",
                studentname = reader["student_name"]?.ToString() ?? "",
                fromgrade = reader["from_grade"]?.ToString() ?? "",
                fromclassid = reader["from_class_id"]?.ToString() ?? "",
                fromclassname = reader["from_class_name"]?.ToString() ?? "",
                tograde = reader["to_grade"]?.ToString() ?? "",
                toclassid = reader["to_class_id"]?.ToString() ?? "",
                toclassname = reader["to_class_name"]?.ToString() ?? "",
                academicyearfrom = reader["academic_year_from"]?.ToString() ?? "",
                academicyearto = reader["academic_year_to"]?.ToString() ?? "",
                finalpercentage = reader["final_percentage"] == DBNull.Value ? null : Convert.ToDecimal(reader["final_percentage"]),
                gpa = reader["gpa"] == DBNull.Value ? null : Convert.ToDecimal(reader["gpa"]),
                promotiontype = reader["promotion_type"]?.ToString() ?? "promoted",
                promotiondate = reader["promotion_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["promotion_date"]),
                promotedby = reader["promoted_by"]?.ToString() ?? "",
                notes = reader["notes"]?.ToString() ?? "",
                isactive = reader["is_active"] == DBNull.Value ? true : Convert.ToBoolean(reader["is_active"]),
                createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]),
                updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]),
                createdby = reader["created_by"]?.ToString() ?? "",
                updatedby = reader["updated_by"]?.ToString() ?? ""
            };
        }
    }
}
