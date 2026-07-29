using appointza.Models.Campusza;
using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services.Campusza
{
    public class StudentTermService
    {
        ICampuszaDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public StudentTermService(ICampuszaDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<StudentTerm>> Select(StudentTermSelectReq req)
        {
            List<StudentTerm> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<StudentTerm>> SelectTransaction(IDb db, StudentTermSelectReq req)
        {
            List<StudentTerm> result = new List<StudentTerm>();
            string query = @"
                SELECT 
                    id, studentid, studentname, studentgrade, termid, termname, academicyear, status,
                    assignedby, assignedbyname, assigneddate,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes,
                    fee, certificates
                FROM StudentTerm
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (req.id > 0)
            {
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }
            if (req.studentid > 0)
            {
                queryBuilder.AddParameter("studentid", "=", "studentid", req.studentid, DbTypes.Types.Long);
            }
            if (req.termid > 0)
            {
                queryBuilder.AddParameter("termid", "=", "termid", req.termid, DbTypes.Types.Long);
            }
             if (!string.IsNullOrEmpty(req.academicyear))
            {
                queryBuilder.AddParameter("academicyear", "=", "academicyear", req.academicyear, DbTypes.Types.String);
            }
             if (!string.IsNullOrEmpty(req.status))
            {
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);
            }
            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    StudentTerm temp = new StudentTerm();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.studentid = reader["studentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["studentid"]);
                    temp.studentname = reader["studentname"] == DBNull.Value ? "" : reader["studentname"].ToString();
                    temp.studentgrade = reader["studentgrade"] == DBNull.Value ? "" : reader["studentgrade"].ToString();
                    temp.termid = reader["termid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["termid"]);
                    temp.termname = reader["termname"] == DBNull.Value ? "" : reader["termname"].ToString();
                    temp.academicyear = reader["academicyear"] == DBNull.Value ? "" : reader["academicyear"].ToString();
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    
                    temp.assignedby = reader["assignedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["assignedby"]);
                    temp.assignedbyname = reader["assignedbyname"] == DBNull.Value ? "" : reader["assignedbyname"].ToString();
                    temp.assigneddate = reader["assigneddate"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["assigneddate"]);
                    
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
                    
                    temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                    temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                    temp.createdon = reader["createdon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["createdon"]);
                    temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    temp.modifiedon = reader["modifiedon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["modifiedon"]);
                    temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
                    temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
                    
                    temp.fee_json = reader["fee"] == DBNull.Value ? "null" : reader["fee"].ToString();
                    temp.certificates_json = reader["certificates"] == DBNull.Value ? "[]" : reader["certificates"].ToString();

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<StudentTerm> Insert(StudentTerm studentTerm)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, studentTerm);
            }
            return studentTerm;
        }

        public async Task InsertTransaction(IDb db, StudentTerm studentTerm)
        {
            string query = @"
                INSERT INTO StudentTerm (
                    studentid, studentname, studentgrade, termid, termname, academicyear, status,
                    assignedby, assignedbyname, assigneddate,
                    organisationid, organisationlocationid,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, notes, attributes,
                    fee, certificates
                )
                VALUES (
                    @studentid, @studentname, @studentgrade, @termid, @termname, @academicyear, @status,
                    @assignedby, @assignedbyname, @assigneddate,
                    @organisationid, @organisationlocationid,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon, @isactive, @issuspended, @notes, @attributes,
                    @fee, @certificates
                )
                RETURNING id;
            ";

            studentTerm.isactive = true;
            studentTerm.version = 1;
            studentTerm.createdon = DateTime.UtcNow;
            studentTerm.createdby = requeststate.usercontext.id;
            studentTerm.modifiedon = DateTime.UtcNow;
            studentTerm.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "studentid", DbTypes.Types.Long).Value = studentTerm.studentid;
            db.AddParameter(command, "studentname", DbTypes.Types.String).Value = studentTerm.studentname ?? "";
            db.AddParameter(command, "studentgrade", DbTypes.Types.String).Value = studentTerm.studentgrade ?? "";
            db.AddParameter(command, "termid", DbTypes.Types.Long).Value = studentTerm.termid;
            db.AddParameter(command, "termname", DbTypes.Types.String).Value = studentTerm.termname ?? "";
            db.AddParameter(command, "academicyear", DbTypes.Types.String).Value = studentTerm.academicyear ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = studentTerm.status ?? "";
            
            db.AddParameter(command, "assignedby", DbTypes.Types.Long).Value = studentTerm.assignedby;
            db.AddParameter(command, "assignedbyname", DbTypes.Types.String).Value = studentTerm.assignedbyname ?? "";
            db.AddParameter(command, "assigneddate", DbTypes.Types.DateTime).Value = studentTerm.assigneddate;
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = studentTerm.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = studentTerm.organisationlocationid;
            
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = studentTerm.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = studentTerm.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = studentTerm.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = studentTerm.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = studentTerm.modifiedon;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = studentTerm.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = studentTerm.issuspended;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = studentTerm.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = studentTerm.attributes_json ?? "{}";
            
            db.AddParameter(command, "fee", DbTypes.Types.Json).Value = studentTerm.fee_json ?? "{}";
            db.AddParameter(command, "certificates", DbTypes.Types.Json).Value = studentTerm.certificates_json ?? "[]";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    studentTerm.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<StudentTerm> Update(StudentTerm studentTerm)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, studentTerm);
            }
            return studentTerm;
        }

        public async Task<bool> UpdateTransaction(IDb db, StudentTerm studentTerm)
        {
            bool result = false;
            string query = @"
                UPDATE StudentTerm
                SET 
                    studentid = @studentid, studentname = @studentname, studentgrade = @studentgrade, 
                    termid = @termid, termname = @termname, academicyear = @academicyear, status = @status,
                    assignedby = @assignedby, assignedbyname = @assignedbyname, assigneddate = @assigneddate,
                    organisationid = @organisationid, organisationlocationid = @organisationlocationid,
                    modifiedby = @modifiedby, modifiedon = @modifiedon, notes = @notes, attributes = @attributes,
                    issuspended = @issuspended,
                    fee = @fee, certificates = @certificates,
                    version = version + 1
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            studentTerm.modifiedon = DateTime.UtcNow;
            studentTerm.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = studentTerm.id;
            db.AddParameter(command, "studentid", DbTypes.Types.Long).Value = studentTerm.studentid;
            db.AddParameter(command, "studentname", DbTypes.Types.String).Value = studentTerm.studentname ?? "";
            db.AddParameter(command, "studentgrade", DbTypes.Types.String).Value = studentTerm.studentgrade ?? "";
            db.AddParameter(command, "termid", DbTypes.Types.Long).Value = studentTerm.termid;
            db.AddParameter(command, "termname", DbTypes.Types.String).Value = studentTerm.termname ?? "";
            db.AddParameter(command, "academicyear", DbTypes.Types.String).Value = studentTerm.academicyear ?? "";
            db.AddParameter(command, "status", DbTypes.Types.String).Value = studentTerm.status ?? "";
            
            db.AddParameter(command, "assignedby", DbTypes.Types.Long).Value = studentTerm.assignedby;
            db.AddParameter(command, "assignedbyname", DbTypes.Types.String).Value = studentTerm.assignedbyname ?? "";
            db.AddParameter(command, "assigneddate", DbTypes.Types.DateTime).Value = studentTerm.assigneddate;
            
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = studentTerm.organisationid;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = studentTerm.organisationlocationid;
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = studentTerm.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = studentTerm.modifiedon;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = studentTerm.notes ?? "";
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = studentTerm.attributes_json ?? "{}";
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = studentTerm.issuspended;
            
            db.AddParameter(command, "fee", DbTypes.Types.Json).Value = studentTerm.fee_json ?? "{}";
            db.AddParameter(command, "certificates", DbTypes.Types.Json).Value = studentTerm.certificates_json ?? "[]";

            if (await db.ExecuteNonQuery(command) > 0)
            {
                studentTerm.version = studentTerm.version + 1;
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(StudentTermDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, StudentTermDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE StudentTerm
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby
                WHERE id = @id
            ";
            
            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }
    }
}
