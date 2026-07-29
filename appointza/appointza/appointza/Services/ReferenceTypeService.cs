using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class ReferenceTypeService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public ReferenceTypeService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        public async Task<List<ReferenceType>> Select(ReferenceTypeSelectReq req)
        {
            List<ReferenceType> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.SelectTransaction(db, req);
                }
            return result;
        }
        public async Task<List<ReferenceType>> SelectTransaction(IDb db, ReferenceTypeSelectReq req)
        {
            List<ReferenceType> result = new List<ReferenceType>();
                string query = @"
                SELECT ReferenceType.id,ReferenceType.identifier,ReferenceType.displaytext,ReferenceType.langcode,ReferenceType.organizationid,ReferenceType.version,ReferenceType.createdby,ReferenceType.createdon,ReferenceType.modifiedby,ReferenceType.modifiedon,ReferenceType.attributes,ReferenceType.isactive,ReferenceType.issuspended,ReferenceType.parentid,ReferenceType.isfactory,ReferenceType.notes
                FROM ReferenceType
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("ReferenceType.id", "=", "id", req.id, DbTypes.Types.Long);
                }
                if (!string.IsNullOrEmpty(req.identifier))
                {
                    queryBuilder.AddParameter("ReferenceType.identifier", "=", "identifier", req.identifier, DbTypes.Types.String);
                }
                if (req.referencetypeid > 0)
                {
                    queryBuilder.AddParameter("ReferenceType.id", "=", "referencetypeid", req.referencetypeid, DbTypes.Types.Long);
                }
                // Removed isactive filter to show all reference types (active and inactive)
                // queryBuilder.AddParameter("ReferenceType.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "ReferenceType.id");
                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        ReferenceType temp = new ReferenceType();
                         temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
temp.identifier = reader["identifier"] == DBNull.Value ? "" : reader["identifier"].ToString();
temp.displaytext = reader["displaytext"] == DBNull.Value ? "" : reader["displaytext"].ToString();
temp.langcode = reader["langcode"] == DBNull.Value ? "" : reader["langcode"].ToString();
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
        public async Task<ReferenceType> Insert(ReferenceType referencetype)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.InsertTransaction(db, referencetype);
                }
            return referencetype;
        }
        public async Task InsertTransaction(IDb db, ReferenceType referencetype)
        {
                String query = @"
                INSERT INTO ReferenceType (
                    identifier,displaytext,langcode,organizationid,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,parentid,isfactory,notes
                )
                VALUES (
                   @identifier,@displaytext,@langcode,@organizationid,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@parentid,@isfactory,@notes
                )
                RETURNING id;
                ";
                referencetype.isactive = true;
                referencetype.version = 1;
                referencetype.createdon = DateTime.UtcNow;
                referencetype.createdby = requeststate.usercontext.id;
                referencetype.modifiedon = DateTime.UtcNow;
                referencetype.modifiedby = requeststate.usercontext.id;

                DbCommand command = db.GetCommand(query);

                db.AddParameter(command, "identifier", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencetype.identifier) ? "" : referencetype.identifier;
db.AddParameter(command, "displaytext", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencetype.displaytext) ? "" : referencetype.displaytext;
db.AddParameter(command, "langcode", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencetype.langcode) ? "" : referencetype.langcode;
db.AddParameter(command, "organizationid", DbTypes.Types.Integer).Value = referencetype.organizationid;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = referencetype.version;
db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = referencetype.createdby;
db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = referencetype.createdon;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = referencetype.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = referencetype.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = referencetype.attributes_json;
db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = referencetype.isactive;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = referencetype.issuspended;
db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = referencetype.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = referencetype.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencetype.notes) ? "" : referencetype.notes;
                
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        referencetype.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                }
            }
        public async Task<ReferenceType> Update(ReferenceType referencetype)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.UpdateTransaction(db, referencetype);
                }
            return referencetype;
        }
        public async Task<bool> UpdateTransaction(IDb db, ReferenceType referencetype)
        {
            bool result = false;
                String query = @"
                UPDATE ReferenceType
                    SET 
                        identifier = @identifier,displaytext = @displaytext,langcode = @langcode,organizationid = @organizationid,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,parentid = @parentid,isfactory = @isfactory,notes = @notes,
                        version = version + 1
                ";
                
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

                queryBuilder.AddParameter("id", "=", "id", referencetype.id, DbTypes.Types.Long);

                if (referencetype.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", referencetype.version, DbTypes.Types.Integer);
                }

                var command = queryBuilder.GetCommand(db);
                
                referencetype.modifiedon = DateTime.UtcNow;
                referencetype.modifiedby = requeststate.usercontext.id;
                
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = referencetype.id;
db.AddParameter(command, "identifier", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencetype.identifier) ? "" : referencetype.identifier;
db.AddParameter(command, "displaytext", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencetype.displaytext) ? "" : referencetype.displaytext;
db.AddParameter(command, "langcode", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencetype.langcode) ? "" : referencetype.langcode;
db.AddParameter(command, "organizationid", DbTypes.Types.Integer).Value = referencetype.organizationid;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = referencetype.version;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = referencetype.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = referencetype.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = referencetype.attributes_json;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = referencetype.issuspended;
db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = referencetype.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = referencetype.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencetype.notes) ? "" : referencetype.notes;

                if (await db.ExecuteNonQuery(command) > 0)
                {
                    referencetype.version = referencetype.version + 1;
                    result = true;
                }
            return result;
        }
        public async Task<bool> Delete(ReferenceTypeDeleteReq referencetype)
        {
             bool result = false;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.DeleteTransaction(db, referencetype);
                    
                }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, ReferenceTypeDeleteReq referencetype)
        {
            bool result = false;
                String query = @"
                UPDATE ReferenceType
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                queryBuilder.AddParameter("id", "=", "id", referencetype.id, DbTypes.Types.Long);
                if (referencetype.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", referencetype.version, DbTypes.Types.Integer);
                }
                DbCommand command = queryBuilder.GetCommand(db);
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = referencetype.id;
                db.AddParameter(command, "version", DbTypes.Types.Integer).Value = referencetype.version;
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
