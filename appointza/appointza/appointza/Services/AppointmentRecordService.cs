using appointza.Models;
using appointza.Utils;
using System.Collections.Generic;
using System.Data.Common;
using Npgsql;
using NpgsqlTypes;

namespace appointza.Services
{
    public class AppointmentRecordService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public AppointmentRecordService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<AppointmentRecord>> Select(AppointmentRecordSelectReq req)
        {
            List<AppointmentRecord> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<AppointmentRecord>> SelectTransaction(IDb db, AppointmentRecordSelectReq req)
        {
            List<AppointmentRecord> result = new List<AppointmentRecord>();
            string query = @"
                SELECT 
                    id, userid, organisationid, appointmentdate, status, 
                    ishasreschedule, imageids, record, fileids, createdon, modifiedon, modifiedby
                FROM appointmentrecords
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (req.id > 0)
            {
                queryBuilder.AddParameter("appointmentrecords.id", "=", "id", req.id, DbTypes.Types.Long);
            }

            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("appointmentrecords.organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }

            if (req.userid > 0)
            {
                queryBuilder.AddParameter("appointmentrecords.userid", "=", "userid", req.userid, DbTypes.Types.Long);
            }

            if (req.appointmentdate != null && req.appointmentdate != DateTime.MinValue)
            {
                DateOnly appointmentDate = DateOnly.FromDateTime(req.appointmentdate.Value);
                queryBuilder.AddParameter("appointmentrecords.appointmentdate", "=", "appointmentdate", appointmentDate, DbTypes.Types.Date);
            }

            if (req.status.HasValue)
            {
                queryBuilder.AddParameter("appointmentrecords.status", "=", "status", req.status.Value, DbTypes.Types.Integer);
            }

            if (req.ishasreschedule.HasValue)
            {
                queryBuilder.AddParameter("appointmentrecords.ishasreschedule", "=", "ishasreschedule", req.ishasreschedule.Value, DbTypes.Types.Boolean);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "appointmentrecords.id");
            var command = queryBuilder.GetCommand(db);
            
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    AppointmentRecord temp = new AppointmentRecord();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]);
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.appointmentdate = reader["appointmentdate"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["appointmentdate"]);
                    temp.status = reader["status"] == DBNull.Value ? 0 : Convert.ToInt32(reader["status"]);
                    temp.ishasreschedule = reader["ishasreschedule"] == DBNull.Value ? false : Convert.ToBoolean(reader["ishasreschedule"]);
                    temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
                    temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
                    temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    
                    // Handle imageids array - PostgreSQL BIGINT[]
                    if (reader["imageids"] != DBNull.Value)
                    {
                        try
                        {
                            // Npgsql returns arrays as Array type
                            if (reader["imageids"] is long[] longArray)
                            {
                                temp.imageids = longArray.ToList();
                            }
                            else if (reader["imageids"] is Array array)
                            {
                                temp.imageids = new List<long>();
                                foreach (var item in array)
                                {
                                    if (item != null)
                                    {
                                        temp.imageids.Add(Convert.ToInt64(item));
                                    }
                                }
                            }
                            else
                            {
                                // Fallback: try to parse as JSON string
                                string imageidsStr = reader["imageids"].ToString();
                                if (!string.IsNullOrEmpty(imageidsStr))
                                {
                                    temp.imageids_json = imageidsStr;
                                }
                            }
                        }
                        catch
                        {
                            temp.imageids = new List<long>();
                        }
                    }
                    else
                    {
                        temp.imageids = new List<long>();
                    }
                    
                    // Handle record JSONB
                    temp.record_json = reader["record"] == DBNull.Value ? "null" : reader["record"].ToString();
                    
                    // Handle fileids JSONB
                    temp.fileids_json = reader["fileids"] == DBNull.Value ? "null" : reader["fileids"].ToString();

                    result.Add(temp);
                }
            }
            
            return result;
        }

        public async Task<AppointmentRecord> Insert(AppointmentRecord appointmentRecord)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, appointmentRecord);
            }
            return appointmentRecord;
        }

        public async Task InsertTransaction(IDb db, AppointmentRecord appointmentRecord)
        {
            String query = @"
                INSERT INTO appointmentrecords (
                    userid, organisationid, appointmentdate, status, 
                    ishasreschedule, imageids, record, fileids, createdon, modifiedon, modifiedby
                )
                VALUES (
                    @userid, @organisationid, @appointmentdate, @status, 
                    @ishasreschedule, @imageids, @record::jsonb, @fileids::jsonb, @createdon, @modifiedon, @modifiedby
                )
                RETURNING id;
                ";
            
            appointmentRecord.createdon = DateTime.UtcNow;
            appointmentRecord.modifiedon = DateTime.UtcNow;
            appointmentRecord.modifiedby = requeststate?.usercontext?.id ?? 0;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "userid", DbTypes.Types.Long).Value = appointmentRecord.userid;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = appointmentRecord.organisationid;
            db.AddParameter(command, "appointmentdate", DbTypes.Types.Date).Value = appointmentRecord.appointmentdate;
            db.AddParameter(command, "status", DbTypes.Types.Integer).Value = appointmentRecord.status;
            db.AddParameter(command, "ishasreschedule", DbTypes.Types.Boolean).Value = appointmentRecord.ishasreschedule;
            db.AddParameter(command, "record", DbTypes.Types.Json).Value = appointmentRecord.record_json;
            
            // Ensure fileids is properly serialized
            // Check if fileids object has data but JSON is not properly set
            string fileidsJson;
            if (appointmentRecord.fileids != null && appointmentRecord.fileids.files != null && appointmentRecord.fileids.files.Count > 0)
            {
                // If fileids object has data, serialize it directly
                fileidsJson = System.Text.Json.JsonSerializer.Serialize(appointmentRecord.fileids);
            }
            else
            {
                // Access the property to trigger the getter (handles null case)
                fileidsJson = appointmentRecord.fileids_json;
                // If still empty, use empty structure
                if (string.IsNullOrEmpty(fileidsJson) || fileidsJson == "null" || fileidsJson == "\"null\"")
                {
                    fileidsJson = "{\"files\":[]}";
                }
            }
            db.AddParameter(command, "fileids", DbTypes.Types.Json).Value = fileidsJson;
            
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = appointmentRecord.createdon;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = appointmentRecord.modifiedon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = appointmentRecord.modifiedby;
            
            // Handle imageids array - PostgreSQL BIGINT[]
            // Use Npgsql array parameter directly
            long[] imageidsArray = (appointmentRecord.imageids != null && appointmentRecord.imageids.Count > 0) 
                ? appointmentRecord.imageids.ToArray() 
                : new long[0];
            
            var imageidsParam = new NpgsqlParameter("imageids", imageidsArray);
            imageidsParam.DataTypeName = "bigint[]";
            command.Parameters.Add(imageidsParam);

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    appointmentRecord.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<AppointmentRecord> Update(AppointmentRecord appointmentRecord)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, appointmentRecord);
            }
            return appointmentRecord;
        }

        public async Task<bool> UpdateTransaction(IDb db, AppointmentRecord appointmentRecord)
        {
            bool result = false;
            String query = @"
                UPDATE appointmentrecords
                SET 
                    userid = @userid,
                    organisationid = @organisationid,
                    appointmentdate = @appointmentdate,
                    status = @status,
                    ishasreschedule = @ishasreschedule,
                    imageids = @imageids,
                    record = @record::jsonb,
                    fileids = @fileids::jsonb,
                    modifiedby = @modifiedby,
                    modifiedon = @modifiedon
                WHERE id = @id
                ";

            var command = db.GetCommand(query);

            appointmentRecord.modifiedon = DateTime.UtcNow;
            appointmentRecord.modifiedby = requeststate?.usercontext?.id ?? 0;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = appointmentRecord.id;
            db.AddParameter(command, "userid", DbTypes.Types.Long).Value = appointmentRecord.userid;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = appointmentRecord.organisationid;
            db.AddParameter(command, "appointmentdate", DbTypes.Types.Date).Value = appointmentRecord.appointmentdate;
            db.AddParameter(command, "status", DbTypes.Types.Integer).Value = appointmentRecord.status;
            db.AddParameter(command, "ishasreschedule", DbTypes.Types.Boolean).Value = appointmentRecord.ishasreschedule;
            db.AddParameter(command, "record", DbTypes.Types.Json).Value = appointmentRecord.record_json;
            
            // Ensure fileids is properly serialized
            // Check if fileids object has data but JSON is not properly set
            string fileidsJson;
            if (appointmentRecord.fileids != null && appointmentRecord.fileids.files != null && appointmentRecord.fileids.files.Count > 0)
            {
                // If fileids object has data, serialize it directly
                fileidsJson = System.Text.Json.JsonSerializer.Serialize(appointmentRecord.fileids);
            }
            else
            {
                // Access the property to trigger the getter (handles null case)
                fileidsJson = appointmentRecord.fileids_json;
                // If still empty, use empty structure
                if (string.IsNullOrEmpty(fileidsJson) || fileidsJson == "null" || fileidsJson == "\"null\"")
                {
                    fileidsJson = "{\"files\":[]}";
                }
            }
            db.AddParameter(command, "fileids", DbTypes.Types.Json).Value = fileidsJson;
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = appointmentRecord.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = appointmentRecord.modifiedon;
            
            // Handle imageids array - PostgreSQL BIGINT[]
            // Use Npgsql array parameter directly
            long[] imageidsArray = (appointmentRecord.imageids != null && appointmentRecord.imageids.Count > 0) 
                ? appointmentRecord.imageids.ToArray() 
                : new long[0];
            
            var imageidsParam = new NpgsqlParameter("imageids", imageidsArray);
            imageidsParam.DataTypeName = "bigint[]";
            command.Parameters.Add(imageidsParam);

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            
            return result;
        }

        public async Task<bool> Delete(AppointmentRecordDeleteReq appointmentRecord)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, appointmentRecord);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, AppointmentRecordDeleteReq appointmentRecord)
        {
            bool result = false;
            String query = @"
                DELETE FROM appointmentrecords
                WHERE id = @id
                ";
            
            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = appointmentRecord.id;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            
            return result;
        }
    }
}

