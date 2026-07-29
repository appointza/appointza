using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Authentication.Services
{
    public class UserSessionService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public UserSessionService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        public async Task<List<UserSession>> Select(UserSessionSelectReq req)
        {
            List<UserSession> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }
        public async Task<List<UserSession>> SelectTransaction(IDb db, UserSessionSelectReq req)
        {
            List<UserSession> result = new List<UserSession>();
            string query = @"
                SELECT UserSession.id,UserSession.code,UserSession.userid,UserSession.starttime,UserSession.endtime,UserSession.version,UserSession.createdby,UserSession.createdon,UserSession.modifiedby,UserSession.modifiedon,UserSession.attributes,UserSession.isactive,UserSession.issuspended,UserSession.parentid,UserSession.isfactory,UserSession.notes
                FROM UserSession
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            if (req.id > 0)
            {
                queryBuilder.AddParameter("UserSession.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.userid > 0)
            {
                queryBuilder.AddParameter("UserSession.userid", "=", "userid", req.userid, DbTypes.Types.Long);
            }
            if (!String.IsNullOrEmpty(req.code))
            {
                queryBuilder.AddParameter("UserSession.code", "=", "code", req.code, DbTypes.Types.String);
            }
            queryBuilder.AddParameter("UserSession.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "UserSession.id");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    UserSession temp = new UserSession();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.code = reader["code"] == DBNull.Value ? "" : reader["code"].ToString();
                    temp.userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]);
                    temp.starttime = reader["starttime"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["starttime"]);
                    temp.endtime = reader["endtime"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["endtime"]);
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
        public async Task<UserSession> Insert(UserSession usersession)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, usersession);
            }
            return usersession;
        }
        public async Task InsertTransaction(IDb db, UserSession usersession)
        {
            String query = @"
                INSERT INTO UserSession (
                    code,userid,starttime,endtime,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,parentid,isfactory,notes
                )
                VALUES (
                   @code,@userid,@starttime,@endtime,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@parentid,@isfactory,@notes
                )
                RETURNING id;
                ";
            usersession.isactive = true;
            usersession.version = 1;
            usersession.createdon = DateTime.UtcNow;
            usersession.createdby = requeststate.usercontext.userid;
            usersession.modifiedon = DateTime.UtcNow;
            usersession.modifiedby = requeststate.usercontext.userid;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "code", DbTypes.Types.String).Value = String.IsNullOrEmpty(usersession.code) ? "" : usersession.code;
            db.AddParameter(command, "userid", DbTypes.Types.Long).Value = usersession.userid;
            db.AddParameter(command, "starttime", DbTypes.Types.DateTime).Value = usersession.starttime;
            db.AddParameter(command, "endtime", DbTypes.Types.DateTime).Value = usersession.endtime;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = usersession.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = usersession.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = usersession.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = usersession.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = usersession.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = usersession.attributes_json;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = usersession.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = usersession.issuspended;
            db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = usersession.parentid;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = usersession.isfactory;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(usersession.notes) ? "" : usersession.notes;

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    usersession.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }
        public async Task<UserSession> Update(UserSession usersession)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, usersession);
            }
            return usersession;
        }
        public async Task<bool> UpdateTransaction(IDb db, UserSession usersession)
        {
            bool result = false;
            String query = @"
                UPDATE UserSession
                    SET 
                        code = @code,userid = @userid,starttime = @starttime,endtime = @endtime,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,parentid = @parentid,isfactory = @isfactory,notes = @notes,
                        version = version + 1
                ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            queryBuilder.AddParameter("id", "=", "id", usersession.id, DbTypes.Types.Long);

            if (usersession.version > 0)
            {
                queryBuilder.AddParameter("version", "=", "version", usersession.version, DbTypes.Types.Integer);
            }

            var command = queryBuilder.GetCommand(db);

            usersession.modifiedon = DateTime.UtcNow;
            usersession.modifiedby = requeststate.usercontext.userid;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = usersession.id;
            db.AddParameter(command, "code", DbTypes.Types.String).Value = String.IsNullOrEmpty(usersession.code) ? "" : usersession.code;
            db.AddParameter(command, "userid", DbTypes.Types.Long).Value = usersession.userid;
            db.AddParameter(command, "starttime", DbTypes.Types.DateTime).Value = usersession.starttime;
            db.AddParameter(command, "endtime", DbTypes.Types.DateTime).Value = usersession.endtime;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = usersession.version;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = usersession.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = usersession.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = usersession.attributes_json;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = usersession.issuspended;
            db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = usersession.parentid;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = usersession.isfactory;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(usersession.notes) ? "" : usersession.notes;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                usersession.version = usersession.version + 1;
                result = true;
            }
            return result;
        }
        public async Task<bool> Delete(UserSessionDeleteReq usersession)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, usersession);

            }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, UserSessionDeleteReq usersession)
        {
            bool result = false;
            String query = @"
                UPDATE UserSession
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("id", "=", "id", usersession.id, DbTypes.Types.Long);
            if (usersession.version > 0)
            {
                queryBuilder.AddParameter("version", "=", "version", usersession.version, DbTypes.Types.Integer);
            }
            DbCommand command = queryBuilder.GetCommand(db);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = usersession.id;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = usersession.version;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.userid;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }
    }
}

