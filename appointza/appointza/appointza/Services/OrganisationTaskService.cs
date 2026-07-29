using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class OrganisationTaskService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public OrganisationTaskService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        public async Task<List<OrganisationTask>> Select(OrganisationTaskSelectReq req)
        {
            List<OrganisationTask> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }
        public async Task<List<OrganisationTask>> SelectTransaction(IDb db, OrganisationTaskSelectReq req)
        {
            List<OrganisationTask> result = new List<OrganisationTask>();
            string query = @"
                SELECT OrganisationTask.id,OrganisationTask.name,OrganisationTask.organisationid,OrganisationTask.appoinmentid,OrganisationTask.description,OrganisationTask.userid,OrganisationTask.descriptionimage,OrganisationTask.code,OrganisationTask.version,OrganisationTask.createdby,OrganisationTask.createdon,OrganisationTask.modifiedby,OrganisationTask.modifiedon,OrganisationTask.attributes,OrganisationTask.isactive,OrganisationTask.issuspended,OrganisationTask.parentid,OrganisationTask.isfactory,OrganisationTask.notes,OrganisationTask.organisationlocationid,OrganisationTask.paymentamount,OrganisationTask.paymenttype,OrganisationTask.ispaid
                FROM OrganisationTask
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            if (req.id > 0)
            {
                queryBuilder.AddParameter("OrganisationTask.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            queryBuilder.AddParameter("OrganisationTask.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "OrganisationTask.id");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    OrganisationTask temp = new OrganisationTask();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.organizationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.appoinmentid = reader["appoinmentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["appoinmentid"]);
                    temp.description = reader["description"] == DBNull.Value ? "" : reader["description"].ToString();
                    temp.userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]);
                    temp.descriptionimage_json = reader["descriptionimage"] == DBNull.Value ? "null" : reader["descriptionimage"].ToString();
                    temp.code = reader["code"] == DBNull.Value ? "" : reader["code"].ToString();
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
                    temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
                    temp.paymentamount = reader["paymentamount"] == DBNull.Value ? 0 : Convert.ToInt64(reader["paymentamount"]);
                    temp.paymenttype = reader["paymenttype"] == DBNull.Value ? "" : reader["paymenttype"].ToString();
                    temp.ispaid = reader["ispaid"] == DBNull.Value ? false : Convert.ToBoolean(reader["ispaid"]);
                    result.Add(temp);
                }
            }
            return result;
        }
        public async Task<OrganisationTask> Insert(OrganisationTask organisationtask)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, organisationtask);
            }
            return organisationtask;
        }
        public async Task InsertTransaction(IDb db, OrganisationTask organisationtask)
        {
            String query = @"
                INSERT INTO OrganisationTask (
                    name,organisationid,appoinmentid,description,userid,descriptionimage,code,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,parentid,isfactory,notes,organisationlocationid,paymentamount,paymenttype,ispaid
                )
                VALUES (
                   @name,@organisationid,@appoinmentid,@description,@userid,@descriptionimage,@code,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@parentid,@isfactory,@notes,@organisationlocationid,@paymentamount,@paymenttype,@ispaid
                )
                RETURNING id;
                ";
            organisationtask.isactive = true;
            organisationtask.version = 1;
            organisationtask.createdon = DateTime.UtcNow;
            organisationtask.createdby = requeststate.usercontext.id;
            organisationtask.modifiedon = DateTime.UtcNow;
            organisationtask.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "name", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationtask.name) ? "" : organisationtask.name;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = organisationtask.organizationid;
            db.AddParameter(command, "appoinmentid", DbTypes.Types.Long).Value = organisationtask.appoinmentid;
            db.AddParameter(command, "description", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationtask.description) ? "" : organisationtask.description;
            db.AddParameter(command, "userid", DbTypes.Types.Long).Value = organisationtask.userid;
            db.AddParameter(command, "descriptionimage", DbTypes.Types.Json).Value = organisationtask.descriptionimage_json;
            db.AddParameter(command, "code", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationtask.code) ? "" : organisationtask.code;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisationtask.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = organisationtask.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = organisationtask.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organisationtask.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organisationtask.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organisationtask.attributes_json;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = organisationtask.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organisationtask.issuspended;
            db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = organisationtask.parentid;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organisationtask.isfactory;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationtask.notes) ? "" : organisationtask.notes;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = organisationtask.organisationlocationid;
            db.AddParameter(command, "paymentamount", DbTypes.Types.Long).Value = organisationtask.paymentamount;
            db.AddParameter(command, "paymenttype", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationtask.paymenttype) ? "" : organisationtask.paymenttype;
            db.AddParameter(command, "ispaid", DbTypes.Types.Boolean).Value = organisationtask.ispaid;

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    organisationtask.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }
        public async Task<OrganisationTask> Update(OrganisationTask organisationtask)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, organisationtask);
            }
            return organisationtask;
        }
        public async Task<bool> UpdateTransaction(IDb db, OrganisationTask organisationtask)
        {
            bool result = false;
            String query = @"
                UPDATE OrganisationTask
                    SET 
                        name = @name,organisationid = @organisationid,appoinmentid = @appoinmentid,description = @description,userid = @userid,descriptionimage = @descriptionimage,code = @code,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,parentid = @parentid,isfactory = @isfactory,notes = @notes,organisationlocationid = @organisationlocationid,paymentamount = @paymentamount,paymenttype = @paymenttype,ispaid = @ispaid,
                        version = version + 1
                ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            queryBuilder.AddParameter("id", "=", "id", organisationtask.id, DbTypes.Types.Long);

            if (organisationtask.version > 0)
            {
                queryBuilder.AddParameter("version", "=", "version", organisationtask.version, DbTypes.Types.Integer);
            }

            var command = queryBuilder.GetCommand(db);

            organisationtask.modifiedon = DateTime.UtcNow;
            organisationtask.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationtask.id;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationtask.name) ? "" : organisationtask.name;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = organisationtask.organizationid;
            db.AddParameter(command, "appoinmentid", DbTypes.Types.Long).Value = organisationtask.appoinmentid;
            db.AddParameter(command, "description", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationtask.description) ? "" : organisationtask.description;
            db.AddParameter(command, "userid", DbTypes.Types.Long).Value = organisationtask.userid;
            db.AddParameter(command, "descriptionimage", DbTypes.Types.Json).Value = organisationtask.descriptionimage_json;
            db.AddParameter(command, "code", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationtask.code) ? "" : organisationtask.code;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisationtask.version;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organisationtask.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organisationtask.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organisationtask.attributes_json;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organisationtask.issuspended;
            db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = organisationtask.parentid;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organisationtask.isfactory;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationtask.notes) ? "" : organisationtask.notes;
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = organisationtask.organisationlocationid;
            db.AddParameter(command, "paymentamount", DbTypes.Types.Long).Value = organisationtask.paymentamount;
            db.AddParameter(command, "paymenttype", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationtask.paymenttype) ? "" : organisationtask.paymenttype;
            db.AddParameter(command, "ispaid", DbTypes.Types.Boolean).Value = organisationtask.ispaid;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                organisationtask.version = organisationtask.version + 1;
                result = true;
            }
            return result;
        }
        public async Task<bool> Delete(OrganisationTaskDeleteReq organisationtask)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, organisationtask);

            }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, OrganisationTaskDeleteReq organisationtask)
        {
            bool result = false;
            String query = @"
                UPDATE OrganisationTask
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("id", "=", "id", organisationtask.id, DbTypes.Types.Long);
            if (organisationtask.version > 0)
            {
                queryBuilder.AddParameter("version", "=", "version", organisationtask.version, DbTypes.Types.Integer);
            }
            DbCommand command = queryBuilder.GetCommand(db);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationtask.id;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisationtask.version;
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