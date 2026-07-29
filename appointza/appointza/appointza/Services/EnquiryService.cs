using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class EnquiryService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public EnquiryService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Enquiry>> Select(EnquirySelectReq req)
        {
            List<Enquiry> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Enquiry>> SelectTransaction(IDb db, EnquirySelectReq req)
        {
            List<Enquiry> result = new List<Enquiry>();
            string query = @"
                SELECT 
                    id, name, email, mobile, message, organisation_id, created_by, notes, 
                    status, source, is_active, ip_address, created_at, updated_at
                FROM enquiries
            ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (req.id > 0)
            {
                queryBuilder.AddParameter("enquiries.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.organisation_id > 0)
            {
                queryBuilder.AddParameter("enquiries.organisation_id", "=", "organisation_id", req.organisation_id, DbTypes.Types.Long);
            }
            if (!string.IsNullOrEmpty(req.status))
            {
                queryBuilder.AddParameter("enquiries.status", "=", "status", req.status, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.source))
            {
                queryBuilder.AddParameter("enquiries.source", "=", "source", req.source, DbTypes.Types.String);
            }
            if (req.is_active.HasValue)
            {
                queryBuilder.AddParameter("enquiries.is_active", "=", "is_active", req.is_active.Value, DbTypes.Types.Boolean);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "enquiries.created_at");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Enquiry temp = new Enquiry();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.email = reader["email"] == DBNull.Value ? "" : reader["email"].ToString();
                    temp.mobile = reader["mobile"] == DBNull.Value ? "" : reader["mobile"].ToString();
                    temp.message = reader["message"] == DBNull.Value ? "" : reader["message"].ToString();
                    temp.organisation_id = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]);
                    temp.created_by = reader["created_by"] == DBNull.Value ? 0 : Convert.ToInt64(reader["created_by"]);
                    temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    temp.status = reader["status"] == DBNull.Value ? "new" : reader["status"].ToString();
                    temp.source = reader["source"] == DBNull.Value ? "" : reader["source"].ToString();
                    temp.is_active = reader["is_active"] == DBNull.Value ? true : Convert.ToBoolean(reader["is_active"]);
                    temp.ip_address = reader["ip_address"] == DBNull.Value ? "" : reader["ip_address"].ToString();
                    temp.created_at = reader["created_at"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["created_at"]);
                    temp.updated_at = reader["updated_at"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["updated_at"]);
                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<Enquiry> Insert(Enquiry enquiry)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, enquiry);
            }
            return enquiry;
        }

        public async Task InsertTransaction(IDb db, Enquiry enquiry)
        {
            String query = @"
                INSERT INTO enquiries (
                    name, email, mobile, message, organisation_id, created_by, notes, 
                    status, source, is_active, ip_address, created_at, updated_at
                )
                VALUES (
                    @name, @email, @mobile, @message, @organisation_id, @created_by, @notes,
                    @status, @source, @is_active, 
                    CASE WHEN @ip_address IS NULL OR @ip_address = '' THEN NULL ELSE CAST(@ip_address AS inet) END, 
                    @created_at, @updated_at
                )
                RETURNING id;
            ";
            
            enquiry.is_active = true;
            if (string.IsNullOrEmpty(enquiry.status))
            {
                enquiry.status = "new";
            }
            enquiry.created_at = DateTime.UtcNow;
            if (enquiry.created_by == 0 && requeststate?.usercontext != null)
            {
                enquiry.created_by = requeststate.usercontext.id;
            }
            enquiry.updated_at = DateTime.UtcNow;

            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "name", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.name) ? "" : enquiry.name;
                db.AddParameter(command, "email", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.email) ? (object)DBNull.Value : enquiry.email;
                db.AddParameter(command, "mobile", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.mobile) ? (object)DBNull.Value : enquiry.mobile;
                db.AddParameter(command, "message", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.message) ? (object)DBNull.Value : enquiry.message;
                db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = enquiry.organisation_id;
                db.AddParameter(command, "created_by", DbTypes.Types.Long).Value = enquiry.created_by == 0 ? (object)DBNull.Value : enquiry.created_by;
                db.AddParameter(command, "notes", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.notes) ? (object)DBNull.Value : enquiry.notes;
                db.AddParameter(command, "status", DbTypes.Types.String).Value = enquiry.status;
                db.AddParameter(command, "source", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.source) ? (object)DBNull.Value : enquiry.source;
                db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = enquiry.is_active;
                db.AddParameter(command, "ip_address", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.ip_address) ? (object)DBNull.Value : enquiry.ip_address;
                db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = enquiry.created_at;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = enquiry.updated_at;
                
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        enquiry.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                    else
                    {
                        throw new Exception("INSERT query did not return an ID. The insert may have failed.");
                    }
                }
                
                // Verify the ID was set
                if (enquiry.id <= 0)
                {
                    throw new Exception($"INSERT completed but ID was not set. ID value: {enquiry.id}");
                }
            }
        }

        public async Task<Enquiry> Update(Enquiry enquiry)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, enquiry);
            }
            return enquiry;
        }

        public async Task<bool> UpdateTransaction(IDb db, Enquiry enquiry)
        {
            bool result = false;
            String query = @"
                UPDATE enquiries
                SET 
                    name = @name,
                    email = @email,
                    mobile = @mobile,
                    message = @message,
                    notes = @notes,
                    status = @status,
                    source = @source,
                    is_active = @is_active,
                    updated_at = @updated_at
                WHERE id = @id
            ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("id", "=", "id", enquiry.id, DbTypes.Types.Long);
            var command = queryBuilder.GetCommand(db);
            
            enquiry.updated_at = DateTime.UtcNow;
            
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = enquiry.id;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.name) ? "" : enquiry.name;
            db.AddParameter(command, "email", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.email) ? (object)DBNull.Value : enquiry.email;
            db.AddParameter(command, "mobile", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.mobile) ? (object)DBNull.Value : enquiry.mobile;
            db.AddParameter(command, "message", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.message) ? (object)DBNull.Value : enquiry.message;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.notes) ? (object)DBNull.Value : enquiry.notes;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.status) ? "new" : enquiry.status;
            db.AddParameter(command, "source", DbTypes.Types.String).Value = string.IsNullOrEmpty(enquiry.source) ? (object)DBNull.Value : enquiry.source;
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = enquiry.is_active;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = enquiry.updated_at;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(EnquiryDeleteReq enquiry)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, enquiry);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, EnquiryDeleteReq enquiry)
        {
            bool result = false;
            
            // Soft delete by setting is_active to false
            String query = @"
                UPDATE enquiries
                SET is_active = false,
                    updated_at = @updated_at
                WHERE id = @id
            ";
            
            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = enquiry.id;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                
                if (await db.ExecuteNonQuery(command) > 0)
                {
                    result = true;
                }
            }
            
            return result;
        }
    }
}

