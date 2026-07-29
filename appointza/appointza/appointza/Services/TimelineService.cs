using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class TimelineService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public TimelineService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        public async Task<List<Timeline>> Select(TimelineSelectReq req)
        {
            List<Timeline> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.SelectTransaction(db, req);
                }
            return result;
        }
        public async Task<List<Timeline>> SelectTransaction(IDb db, TimelineSelectReq req)
        {
            List<Timeline> result = new List<Timeline>();
                string query = @"
                SELECT Timeline.id,Timeline.organisationlocationid,Timeline.organisationid,Timeline.appoinmentid,Timeline.tasktypeid,Timeline.taskcode,Timeline.tasktype,Timeline.description,Timeline.customerid,Timeline.staffid,Timeline.staffname,Timeline.appoinmenstatustype,Timeline.appoinmentstatusid,Timeline.apoinmentstatuscode,Timeline.descriptionimageid,Timeline.paymentid,Timeline.paymentmodetypeid,Timeline.paymentmodetype,Timeline.version,Timeline.createdby,Timeline.createdon,Timeline.modifiedby,Timeline.modifiedon,Timeline.attributes,Timeline.isactive,Timeline.issuspended,Timeline.notes
                FROM Timeline
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("Timeline.id", "=", "id", req.id, DbTypes.Types.Long);
                }
            if (req.appointmentid > 0)
            {
                queryBuilder.AddParameter("Timeline.appoinmentid", "=", "appoinmentid", req.appointmentid, DbTypes.Types.Long);
            }
            queryBuilder.AddParameter("Timeline.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Timeline.id");
                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        Timeline temp = new Timeline();
                         temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
 temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
 temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
 temp.appoinmentid = reader["appoinmentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["appoinmentid"]);
 temp.tasktypeid = reader["tasktypeid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["tasktypeid"]);
temp.taskcode = reader["taskcode"] == DBNull.Value ? "" : reader["taskcode"].ToString();
temp.tasktype = reader["tasktype"] == DBNull.Value ? "" : reader["tasktype"].ToString();
temp.description = reader["description"] == DBNull.Value ? "" : reader["description"].ToString();
 temp.customerid = reader["customerid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["customerid"]);
 temp.staffid = reader["staffid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["staffid"]);
temp.staffname = reader["staffname"] == DBNull.Value ? "" : reader["staffname"].ToString();
temp.appoinmenstatustype = reader["appoinmenstatustype"] == DBNull.Value ? "" : reader["appoinmenstatustype"].ToString();
 temp.appoinmentstatusid = reader["appoinmentstatusid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["appoinmentstatusid"]);
temp.apoinmentstatuscode = reader["apoinmentstatuscode"] == DBNull.Value ? "" : reader["apoinmentstatuscode"].ToString();
 temp.descriptionimageid = reader["descriptionimageid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["descriptionimageid"]);
 temp.paymentid = reader["paymentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["paymentid"]);
 temp.paymentmodetypeid = reader["paymentmodetypeid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["paymentmodetypeid"]);
temp.paymentmodetype = reader["paymentmodetype"] == DBNull.Value ? "" : reader["paymentmodetype"].ToString();
 temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
 temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
 temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
 temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
 temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                        result.Add(temp);
                    }
                }
            return result;
        }
        public async Task<Timeline> Insert(Timeline timeline)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.InsertTransaction(db, timeline);
                }
            return timeline;
        }
        public async Task InsertTransaction(IDb db, Timeline timeline)
        {
                String query = @"
                INSERT INTO Timeline (
                    organisationlocationid,organisationid,appoinmentid,tasktypeid,taskcode,tasktype,description,customerid,staffid,staffname,appoinmenstatustype,appoinmentstatusid,apoinmentstatuscode,descriptionimageid,paymentid,paymentmodetypeid,paymentmodetype,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,notes
                )
                VALUES (
                   @organisationlocationid,@organisationid,@appoinmentid,@tasktypeid,@taskcode,@tasktype,@description,@customerid,@staffid,@staffname,@appoinmenstatustype,@appoinmentstatusid,@apoinmentstatuscode,@descriptionimageid,@paymentid,@paymentmodetypeid,@paymentmodetype,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@notes
                )
                RETURNING id;
                ";
                timeline.isactive = true;
                timeline.version = 1;
                timeline.createdon = DateTime.UtcNow;
                timeline.createdby = requeststate.usercontext.id;
                timeline.modifiedon = DateTime.UtcNow;
                timeline.modifiedby = requeststate.usercontext.id;

                DbCommand command = db.GetCommand(query);

                db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = timeline.organisationlocationid;
db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = timeline.organisationid;
db.AddParameter(command, "appoinmentid", DbTypes.Types.Long).Value = timeline.appoinmentid;
db.AddParameter(command, "tasktypeid", DbTypes.Types.Long).Value = timeline.tasktypeid;
db.AddParameter(command, "taskcode", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.taskcode) ? "" : timeline.taskcode;
db.AddParameter(command, "tasktype", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.tasktype) ? "" : timeline.tasktype;
db.AddParameter(command, "description", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.description) ? "" : timeline.description;
db.AddParameter(command, "customerid", DbTypes.Types.Long).Value = timeline.customerid;
db.AddParameter(command, "staffid", DbTypes.Types.Long).Value = timeline.staffid;
db.AddParameter(command, "staffname", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.staffname) ? "" : timeline.staffname;
db.AddParameter(command, "appoinmenstatustype", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.appoinmenstatustype) ? "" : timeline.appoinmenstatustype;
db.AddParameter(command, "appoinmentstatusid", DbTypes.Types.Long).Value = timeline.appoinmentstatusid;
db.AddParameter(command, "apoinmentstatuscode", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.apoinmentstatuscode) ? "" : timeline.apoinmentstatuscode;
db.AddParameter(command, "descriptionimageid", DbTypes.Types.Long).Value = timeline.descriptionimageid;
db.AddParameter(command, "paymentid", DbTypes.Types.Long).Value = timeline.paymentid;
db.AddParameter(command, "paymentmodetypeid", DbTypes.Types.Long).Value = timeline.paymentmodetypeid;
db.AddParameter(command, "paymentmodetype", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.paymentmodetype) ? "" : timeline.paymentmodetype;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = timeline.version;
db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = timeline.createdby;
db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = timeline.createdon;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = timeline.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = timeline.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = timeline.attributes_json;
db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = timeline.isactive;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = timeline.issuspended;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.notes) ? "" : timeline.notes;
                
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        timeline.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                }
            }
        public async Task<Timeline> Update(Timeline timeline)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.UpdateTransaction(db, timeline);
                }
            return timeline;
        }
        public async Task<bool> UpdateTransaction(IDb db, Timeline timeline)
        {
            bool result = false;
                String query = @"
                UPDATE Timeline
                    SET 
                        organisationlocationid = @organisationlocationid,organisationid = @organisationid,appoinmentid = @appoinmentid,tasktypeid = @tasktypeid,taskcode = @taskcode,tasktype = @tasktype,description = @description,customerid = @customerid,staffid = @staffid,staffname = @staffname,appoinmenstatustype = @appoinmenstatustype,appoinmentstatusid = @appoinmentstatusid,apoinmentstatuscode = @apoinmentstatuscode,descriptionimageid = @descriptionimageid,paymentid = @paymentid,paymentmodetypeid = @paymentmodetypeid,paymentmodetype = @paymentmodetype,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,notes = @notes,
                        version = version + 1
                ";
                
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

                queryBuilder.AddParameter("id", "=", "id", timeline.id, DbTypes.Types.Long);

                if (timeline.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", timeline.version, DbTypes.Types.Integer);
                }

                var command = queryBuilder.GetCommand(db);
                
                timeline.modifiedon = DateTime.UtcNow;
                timeline.modifiedby = requeststate.usercontext.id;
                
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = timeline.id;
db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = timeline.organisationlocationid;
db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = timeline.organisationid;
db.AddParameter(command, "appoinmentid", DbTypes.Types.Long).Value = timeline.appoinmentid;
db.AddParameter(command, "tasktypeid", DbTypes.Types.Long).Value = timeline.tasktypeid;
db.AddParameter(command, "taskcode", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.taskcode) ? "" : timeline.taskcode;
db.AddParameter(command, "tasktype", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.tasktype) ? "" : timeline.tasktype;
db.AddParameter(command, "description", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.description) ? "" : timeline.description;
db.AddParameter(command, "customerid", DbTypes.Types.Long).Value = timeline.customerid;
db.AddParameter(command, "staffid", DbTypes.Types.Long).Value = timeline.staffid;
db.AddParameter(command, "staffname", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.staffname) ? "" : timeline.staffname;
db.AddParameter(command, "appoinmenstatustype", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.appoinmenstatustype) ? "" : timeline.appoinmenstatustype;
db.AddParameter(command, "appoinmentstatusid", DbTypes.Types.Long).Value = timeline.appoinmentstatusid;
db.AddParameter(command, "apoinmentstatuscode", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.apoinmentstatuscode) ? "" : timeline.apoinmentstatuscode;
db.AddParameter(command, "descriptionimageid", DbTypes.Types.Long).Value = timeline.descriptionimageid;
db.AddParameter(command, "paymentid", DbTypes.Types.Long).Value = timeline.paymentid;
db.AddParameter(command, "paymentmodetypeid", DbTypes.Types.Long).Value = timeline.paymentmodetypeid;
db.AddParameter(command, "paymentmodetype", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.paymentmodetype) ? "" : timeline.paymentmodetype;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = timeline.version;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = timeline.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = timeline.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = timeline.attributes_json;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = timeline.issuspended;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(timeline.notes) ? "" : timeline.notes;

                if (await db.ExecuteNonQuery(command) > 0)
                {
                    timeline.version = timeline.version + 1;
                    result = true;
                }
            return result;
        }
        public async Task<bool> Delete(TimelineDeleteReq timeline)
        {
             bool result = false;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.DeleteTransaction(db, timeline);
                    
                }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, TimelineDeleteReq timeline)
        {
            bool result = false;
                String query = @"
                UPDATE Timeline
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                queryBuilder.AddParameter("id", "=", "id", timeline.id, DbTypes.Types.Long);
                if (timeline.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", timeline.version, DbTypes.Types.Integer);
                }
                DbCommand command = queryBuilder.GetCommand(db);
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = timeline.id;
                db.AddParameter(command, "version", DbTypes.Types.Integer).Value = timeline.version;
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
