using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class LeaveDatesService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public LeaveDatesService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        public async Task<List<LeaveDates>> Select(LeaveDatesSelectReq req)
        {
            List<LeaveDates> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.SelectTransaction(db, req);
                }
            return result;
        }
        public async Task<List<LeaveDates>> SelectTransaction(IDb db, LeaveDatesSelectReq req)
        {
            List<LeaveDates> result = new List<LeaveDates>();
                string query = @"
                SELECT LeaveDates.id,LeaveDates.organizationlocationid,LeaveDates.start_time,LeaveDates.end_time,LeaveDates.isfullday,LeaveDates.leaveon,LeaveDates.organizationid,LeaveDates.version,LeaveDates.createdby,LeaveDates.createdon,LeaveDates.modifiedby,LeaveDates.modifiedon,LeaveDates.attributes,LeaveDates.isactive,LeaveDates.issuspended,LeaveDates.parentid,LeaveDates.isfactory,LeaveDates.notes
                FROM LeaveDates
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("LeaveDates.id", "=", "id", req.id, DbTypes.Types.Long);
                }
            if (req.organizationid > 0)
            {
                queryBuilder.AddParameter("LeaveDates.organizationid", "=", "organizationid", req.organizationid, DbTypes.Types.Long);
            }
            if (req.organizationlocationid > 0)
            {
                queryBuilder.AddParameter("LeaveDates.organizationlocationid", "=", "organizationlocationid", req.organizationlocationid, DbTypes.Types.Long);
            }

            if (req.leaveon != null)
            {
                queryBuilder.AddParameter("LeaveDates.leaveon", "=", "leaveon", req.leaveon, DbTypes.Types.DateTime);
            }
            queryBuilder.AddParameter("LeaveDates.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "LeaveDates.id");
                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        LeaveDates temp = new LeaveDates();
                         temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
temp.organizationlocationid = reader["organizationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organizationlocationid"]);
                    temp.start_time = reader["start_time"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["start_time"];
                    temp.end_time = reader["end_time"] == DBNull.Value ? TimeSpan.Zero : (TimeSpan)reader["end_time"];
                    temp.isfullday = reader["isfullday"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfullday"]);
temp.leaveon = reader["leaveon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["leaveon"]);
 temp.organizationid = reader["organizationid"] == DBNull.Value ? 0 : Convert.ToInt32(reader["organizationid"]);
 temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
 temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
 temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
 temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
 temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
 temp.parentid = reader["parentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["parentid"]);
 temp.isfactory = reader["isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfactory"]);
temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                        result.Add(temp);
                    }
                }
            return result;
        }
        public async Task<LeaveDates> Insert(LeaveDates leavedates)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.InsertTransaction(db, leavedates);
                }
            return leavedates;
        }
        public async Task InsertTransaction(IDb db, LeaveDates leavedates)
        {
                String query = @"
                INSERT INTO LeaveDates (
                    organizationlocationid,start_time,end_time,isfullday,leaveon,organizationid,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,parentid,isfactory,notes
                )
                VALUES (
                   @organizationlocationid,@start_time,@end_time,@isfullday,@leaveon,@organizationid,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@parentid,@isfactory,@notes
                )
                RETURNING id;
                ";
                leavedates.isactive = true;
                leavedates.version = 1;
                leavedates.createdon = DateTime.UtcNow;
                leavedates.createdby = requeststate.usercontext.id;
                leavedates.modifiedon = DateTime.UtcNow;
                leavedates.modifiedby = requeststate.usercontext.id;

                DbCommand command = db.GetCommand(query);

                db.AddParameter(command, "organizationlocationid", DbTypes.Types.Long).Value = leavedates.organizationlocationid;
            db.AddParameter(command, "start_time", DbTypes.Types.Time).Value = leavedates.start_time;
            db.AddParameter(command, "end_time", DbTypes.Types.Time).Value = leavedates.end_time;
            db.AddParameter(command, "isfullday", DbTypes.Types.Boolean).Value = leavedates.isfullday;
db.AddParameter(command, "leaveon", DbTypes.Types.DateTime).Value = leavedates.leaveon;
db.AddParameter(command, "organizationid", DbTypes.Types.Integer).Value = leavedates.organizationid;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = leavedates.version;
db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = leavedates.createdby;
db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = leavedates.createdon;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = leavedates.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = leavedates.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = leavedates.attributes_json;
db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = leavedates.isactive;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = leavedates.issuspended;
db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = leavedates.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = leavedates.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(leavedates.notes) ? "" : leavedates.notes;
                
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        leavedates.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                }
            }
        public async Task<LeaveDates> Update(LeaveDates leavedates)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.UpdateTransaction(db, leavedates);
                }
            return leavedates;
        }
        public async Task<bool> UpdateTransaction(IDb db, LeaveDates leavedates)
        {
            bool result = false;
                String query = @"
                UPDATE LeaveDates
                    SET 
                        organizationlocationid = @organizationlocationid,
                        start_time = @start_time,
                        end_time = @end_time,
                        isfullday = @isfullday,
                        leaveon = @leaveon,
                        organizationid = @organizationid,
                        modifiedby = @modifiedby,
                        modifiedon = @modifiedon,
                        attributes = @attributes,
                        issuspended = @issuspended,
                        parentid = @parentid,
                        isfactory = @isfactory,
                        notes = @notes,
                        version = version + 1
                WHERE id = @id
                ";
                
                leavedates.modifiedon = DateTime.UtcNow;
                leavedates.modifiedby = requeststate.usercontext.id;
                
                DbCommand command = db.GetCommand(query);
                
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = leavedates.id;
                db.AddParameter(command, "organizationlocationid", DbTypes.Types.Long).Value = leavedates.organizationlocationid;
                db.AddParameter(command, "start_time", DbTypes.Types.Time).Value = leavedates.start_time;
                db.AddParameter(command, "end_time", DbTypes.Types.Time).Value = leavedates.end_time;
                db.AddParameter(command, "isfullday", DbTypes.Types.Boolean).Value = leavedates.isfullday;
                db.AddParameter(command, "leaveon", DbTypes.Types.DateTime).Value = leavedates.leaveon;
                db.AddParameter(command, "organizationid", DbTypes.Types.Integer).Value = leavedates.organizationid;
                db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = leavedates.modifiedby;
                db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = leavedates.modifiedon;
                db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = leavedates.attributes_json;
                db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = leavedates.issuspended;
                db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = leavedates.parentid;
                db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = leavedates.isfactory;
                db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(leavedates.notes) ? "" : leavedates.notes;

                if (await db.ExecuteNonQuery(command) > 0)
                {
                    leavedates.version = leavedates.version + 1;
                    result = true;
                }
            return result;
        }
        public async Task<bool> Delete(LeaveDatesDeleteReq leavedates)
        {
             bool result = false;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.DeleteTransaction(db, leavedates);
                    
                }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, LeaveDatesDeleteReq leavedates)
        {
            bool result = false;
                String query = @"
                UPDATE LeaveDates
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                queryBuilder.AddParameter("id", "=", "id", leavedates.id, DbTypes.Types.Long);
                if (leavedates.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", leavedates.version, DbTypes.Types.Integer);
                }
                DbCommand command = queryBuilder.GetCommand(db);
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = leavedates.id;
                db.AddParameter(command, "version", DbTypes.Types.Integer).Value = leavedates.version;
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
