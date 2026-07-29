using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class OrganizationServicesService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public OrganizationServicesService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        public async Task<List<OrganizationServices>> Select(OrganizationServicesSelectReq req)
        {
            List<OrganizationServices> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.SelectTransaction(db, req);
                }
            return result;
        }
        public async Task<List<OrganizationServices>> SelectTransaction(IDb db, OrganizationServicesSelectReq req)
        {
            List<OrganizationServices> result = new List<OrganizationServices>();
                string query = @"
                SELECT OrganizationServices.id,OrganizationServices.prize,OrganizationServices.timetaken,OrganizationServices.servicesids,OrganizationServices.Iscombo,OrganizationServices.offerprize,OrganizationServices.Servicename,OrganizationServices.code,OrganizationServices.version,OrganizationServices.createdby,OrganizationServices.createdon,OrganizationServices.modifiedby,OrganizationServices.modifiedon,OrganizationServices.attributes,OrganizationServices.isactive,OrganizationServices.issuspended,OrganizationServices.parentid,OrganizationServices.isfactory,OrganizationServices.notes
                FROM OrganizationServices
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("OrganizationServices.id", "=", "id", req.id, DbTypes.Types.Long);
                }
                queryBuilder.AddParameter("OrganizationServices.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "OrganizationServices.id");
                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        OrganizationServices temp = new OrganizationServices();
                         temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
 temp.prize = reader["prize"] == DBNull.Value ? 0 : Convert.ToInt64(reader["prize"]);
 temp.timetaken = reader["timetaken"] == DBNull.Value ? 0 : Convert.ToInt64(reader["timetaken"]);
temp.servicesids_json = reader["servicesids"] == DBNull.Value ? "null" : reader["servicesids"].ToString();
 temp.Iscombo = reader["Iscombo"] == DBNull.Value ? false : Convert.ToBoolean(reader["Iscombo"]);
 temp.offerprize = reader["offerprize"] == DBNull.Value ? 0 : Convert.ToInt64(reader["offerprize"]);
temp.Servicename = reader["Servicename"] == DBNull.Value ? "" : reader["Servicename"].ToString();
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
                        result.Add(temp);
                    }
                }
            return result;
        }
        public async Task<OrganizationServices> Insert(OrganizationServices organizationservices)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.InsertTransaction(db, organizationservices);
                }
            return organizationservices;
        }
        public async Task InsertTransaction(IDb db, OrganizationServices organizationservices)
        {
                String query = @"
                INSERT INTO OrganizationServices (
                    prize,timetaken,servicesids,Iscombo,offerprize,Servicename,code,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,parentid,isfactory,notes
                )
                VALUES (
                   @prize,@timetaken,@servicesids,@Iscombo,@offerprize,@Servicename,@code,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@parentid,@isfactory,@notes
                )
                RETURNING id;
                ";
                organizationservices.isactive = true;
                organizationservices.version = 1;
                organizationservices.createdon = DateTime.UtcNow;
                organizationservices.createdby = requeststate.usercontext.id;
                organizationservices.modifiedon = DateTime.UtcNow;
                organizationservices.modifiedby = requeststate.usercontext.id;

                DbCommand command = db.GetCommand(query);

                db.AddParameter(command, "prize", DbTypes.Types.Long).Value = organizationservices.prize;
db.AddParameter(command, "timetaken", DbTypes.Types.Long).Value = organizationservices.timetaken;
db.AddParameter(command, "servicesids", DbTypes.Types.Json).Value = organizationservices.servicesids_json;
db.AddParameter(command, "Iscombo", DbTypes.Types.Boolean).Value = organizationservices.Iscombo;
db.AddParameter(command, "offerprize", DbTypes.Types.Long).Value = organizationservices.offerprize;
db.AddParameter(command, "Servicename", DbTypes.Types.String).Value = String.IsNullOrEmpty(organizationservices.Servicename) ? "" : organizationservices.Servicename;
db.AddParameter(command, "code", DbTypes.Types.String).Value = String.IsNullOrEmpty(organizationservices.code) ? "" : organizationservices.code;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organizationservices.version;
db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = organizationservices.createdby;
db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = organizationservices.createdon;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organizationservices.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organizationservices.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organizationservices.attributes_json;
db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = organizationservices.isactive;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organizationservices.issuspended;
db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = organizationservices.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organizationservices.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organizationservices.notes) ? "" : organizationservices.notes;
                
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        organizationservices.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                }
            }
        public async Task<OrganizationServices> Update(OrganizationServices organizationservices)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.UpdateTransaction(db, organizationservices);
                }
            return organizationservices;
        }
        public async Task<bool> UpdateTransaction(IDb db, OrganizationServices organizationservices)
        {
            bool result = false;
                String query = @"
                UPDATE OrganizationServices
                    SET 
                        prize = @prize,timetaken = @timetaken,servicesids = @servicesids,Iscombo = @Iscombo,offerprize = @offerprize,Servicename = @Servicename,code = @code,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,parentid = @parentid,isfactory = @isfactory,notes = @notes,
                        version = version + 1
                ";
                
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

                queryBuilder.AddParameter("id", "=", "id", organizationservices.id, DbTypes.Types.Long);

                if (organizationservices.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", organizationservices.version, DbTypes.Types.Integer);
                }

                var command = queryBuilder.GetCommand(db);
                
                organizationservices.modifiedon = DateTime.UtcNow;
                organizationservices.modifiedby = requeststate.usercontext.id;
                
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = organizationservices.id;
db.AddParameter(command, "prize", DbTypes.Types.Long).Value = organizationservices.prize;
db.AddParameter(command, "timetaken", DbTypes.Types.Long).Value = organizationservices.timetaken;
db.AddParameter(command, "servicesids", DbTypes.Types.Json).Value = organizationservices.servicesids_json;
db.AddParameter(command, "Iscombo", DbTypes.Types.Boolean).Value = organizationservices.Iscombo;
db.AddParameter(command, "offerprize", DbTypes.Types.Long).Value = organizationservices.offerprize;
db.AddParameter(command, "Servicename", DbTypes.Types.String).Value = String.IsNullOrEmpty(organizationservices.Servicename) ? "" : organizationservices.Servicename;
db.AddParameter(command, "code", DbTypes.Types.String).Value = String.IsNullOrEmpty(organizationservices.code) ? "" : organizationservices.code;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organizationservices.version;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organizationservices.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organizationservices.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organizationservices.attributes_json;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organizationservices.issuspended;
db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = organizationservices.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organizationservices.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organizationservices.notes) ? "" : organizationservices.notes;

                if (await db.ExecuteNonQuery(command) > 0)
                {
                    organizationservices.version = organizationservices.version + 1;
                    result = true;
                }
            return result;
        }
        public async Task<bool> Delete(OrganizationServicesDeleteReq organizationservices)
        {
             bool result = false;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.DeleteTransaction(db, organizationservices);
                    
                }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, OrganizationServicesDeleteReq organizationservices)
        {
            bool result = false;
                String query = @"
                UPDATE OrganizationServices
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                queryBuilder.AddParameter("id", "=", "id", organizationservices.id, DbTypes.Types.Long);
                if (organizationservices.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", organizationservices.version, DbTypes.Types.Integer);
                }
                DbCommand command = queryBuilder.GetCommand(db);
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = organizationservices.id;
                db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organizationservices.version;
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
