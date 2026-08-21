using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class OrganisationServicesService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public OrganisationServicesService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        public async Task<List<OrganisationServices>> Select(OrganisationServicesSelectReq req)
        {
            List<OrganisationServices> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await EnsureLocationColumnTransaction(db);
                    result = await this.SelectTransaction(db, req);
                }
            return result;
        }
        public async Task<List<OrganisationServices>> SelectTransaction(IDb db, OrganisationServicesSelectReq req)
        {
            List<OrganisationServices> result = new List<OrganisationServices>();
                string query = @"
                SELECT OrganisationServices.id,OrganisationServices.prize,OrganisationServices.weekday_price,OrganisationServices.weekend_price,OrganisationServices.is_price_different,OrganisationServices.timetaken,OrganisationServices.servicesids,OrganisationServices.Iscombo,OrganisationServices.offerprize,OrganisationServices.Servicename,OrganisationServices.code,OrganisationServices.version,OrganisationServices.show_price,OrganisationServices.createdby,OrganisationServices.createdon,OrganisationServices.modifiedby,OrganisationServices.modifiedon,OrganisationServices.attributes,OrganisationServices.isactive,OrganisationServices.issuspended,OrganisationServices.organisationid,OrganisationServices.organisationlocationid,OrganisationServices.isfactory,OrganisationServices.rating,OrganisationServices.notes
                FROM OrganisationServices
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (req.id > 0 || req.organisationid > 0)
            {
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("OrganisationServices.id", "=", "id", req.id, DbTypes.Types.Long);
                }
                if (req.organisationid > 0)
                {
                    queryBuilder.AddParameter("OrganisationServices.organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
                }
                if (req.organisationlocationid > 0)
                {
                    queryBuilder.AddParameter("OrganisationServices.organisationlocationid", "=", "organisationlocationid", req.organisationlocationid, DbTypes.Types.Long);
                }
            }
            else
            {
                queryBuilder.AddParameter("OrganisationServices.id", "=", "id", 0, DbTypes.Types.Long);
            }
            queryBuilder.AddParameter("OrganisationServices.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "OrganisationServices.id");
                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        OrganisationServices temp = new OrganisationServices();
                         temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
 temp.prize = reader["prize"] == DBNull.Value ? 0 : Convert.ToInt64(reader["prize"]);
 temp.weekday_price = reader["weekday_price"] == DBNull.Value ? 0 : Convert.ToInt64(reader["weekday_price"]);
 temp.weekend_price = reader["weekend_price"] == DBNull.Value ? 0 : Convert.ToInt64(reader["weekend_price"]);
 temp.is_price_different = reader["is_price_different"] == DBNull.Value ? false : Convert.ToBoolean(reader["is_price_different"]);
 temp.timetaken = reader["timetaken"] == DBNull.Value ? 0 : Convert.ToInt64(reader["timetaken"]);
temp.servicesids_json = reader["servicesids"] == DBNull.Value ? "null" : reader["servicesids"].ToString();
 temp.Iscombo = reader["Iscombo"] == DBNull.Value ? false : Convert.ToBoolean(reader["Iscombo"]);
 temp.offerprize = reader["offerprize"] == DBNull.Value ? 0 : Convert.ToInt64(reader["offerprize"]);
temp.Servicename = reader["Servicename"] == DBNull.Value ? "" : reader["Servicename"].ToString();
temp.code = reader["code"] == DBNull.Value ? "" : reader["code"].ToString();
 temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
 temp.show_price = reader["show_price"] == DBNull.Value ? true : Convert.ToBoolean(reader["show_price"]);
 temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
 temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
 temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
 temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
 temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
 temp.organisationlocationid = HasColumn(reader, "organisationlocationid") && reader["organisationlocationid"] != DBNull.Value
     ? Convert.ToInt64(reader["organisationlocationid"]) : 0;
 temp.isfactory = reader["isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfactory"]);
 temp.rating = reader["rating"] == DBNull.Value ? null : (decimal?)Convert.ToDecimal(reader["rating"]);
temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                        result.Add(temp);
                    }
                }
            return result;
        }
        public async Task<OrganisationServices> Insert(OrganisationServices organisationservices)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await EnsureLocationColumnTransaction(db);
                    await this.InsertTransaction(db, organisationservices);
                }
            return organisationservices;
        }
        public async Task InsertTransaction(IDb db, OrganisationServices organisationservices)
        {
                String query = @"
                INSERT INTO OrganisationServices (
                    prize,weekday_price,weekend_price,is_price_different,timetaken,servicesids,Iscombo,offerprize,Servicename,code,version,show_price,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,organisationid,organisationlocationid,isfactory,rating,notes
                )
                VALUES (
                   @prize,@weekday_price,@weekend_price,@is_price_different,@timetaken,@servicesids,@Iscombo,@offerprize,@Servicename,@code,@version,@show_price,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@organisationid,@organisationlocationid,@isfactory,@rating,@notes
                )
                RETURNING id;
                ";
                organisationservices.isactive = true;
                organisationservices.version = 1;
                organisationservices.createdon = DateTime.UtcNow;
                organisationservices.createdby = requeststate.usercontext.id;
                organisationservices.modifiedon = DateTime.UtcNow;
                organisationservices.modifiedby = requeststate.usercontext.id;

                DbCommand command = db.GetCommand(query);

                db.AddParameter(command, "prize", DbTypes.Types.Long).Value = organisationservices.prize;
db.AddParameter(command, "weekday_price", DbTypes.Types.Long).Value = organisationservices.weekday_price;
db.AddParameter(command, "weekend_price", DbTypes.Types.Long).Value = organisationservices.weekend_price;
db.AddParameter(command, "is_price_different", DbTypes.Types.Boolean).Value = organisationservices.is_price_different;
db.AddParameter(command, "timetaken", DbTypes.Types.Long).Value = organisationservices.timetaken;
db.AddParameter(command, "servicesids", DbTypes.Types.Json).Value = organisationservices.servicesids_json;
db.AddParameter(command, "Iscombo", DbTypes.Types.Boolean).Value = organisationservices.Iscombo;
db.AddParameter(command, "offerprize", DbTypes.Types.Long).Value = organisationservices.offerprize;
db.AddParameter(command, "Servicename", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationservices.Servicename) ? "" : organisationservices.Servicename;
db.AddParameter(command, "code", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationservices.code) ? "" : organisationservices.code;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisationservices.version;
db.AddParameter(command, "show_price", DbTypes.Types.Boolean).Value = organisationservices.show_price;
db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = organisationservices.createdby;
db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = organisationservices.createdon;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organisationservices.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organisationservices.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organisationservices.attributes_json;
db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = organisationservices.isactive;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organisationservices.issuspended;
db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = organisationservices.organisationid;
db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = organisationservices.organisationlocationid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organisationservices.isfactory;
db.AddParameter(command, "rating", DbTypes.Types.Decimal).Value = organisationservices.rating.HasValue ? (object)organisationservices.rating.Value : DBNull.Value;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationservices.notes) ? "" : organisationservices.notes;
                
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        organisationservices.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                }
            }
        public async Task<OrganisationServices> Update(OrganisationServices organisationservices)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.UpdateTransaction(db, organisationservices);
                }
            return organisationservices;
        }
        public async Task<bool> UpdateTransaction(IDb db, OrganisationServices organisationservices)
        {
            bool result = false;
                String query = @"
                UPDATE OrganisationServices
                    SET 
                        prize = @prize,weekday_price = @weekday_price,weekend_price = @weekend_price,is_price_different = @is_price_different,timetaken = @timetaken,servicesids = @servicesids,Iscombo = @Iscombo,offerprize = @offerprize,Servicename = @Servicename,code = @code,show_price = @show_price,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,organisationid = @organisationid,organisationlocationid = @organisationlocationid,isfactory = @isfactory,rating = @rating,notes = @notes,
                        version = version + 1
                ";
                
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

                queryBuilder.AddParameter("id", "=", "id", organisationservices.id, DbTypes.Types.Long);

                if (organisationservices.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", organisationservices.version, DbTypes.Types.Integer);
                }

                var command = queryBuilder.GetCommand(db);
                
                organisationservices.modifiedon = DateTime.UtcNow;
                organisationservices.modifiedby = requeststate.usercontext.id;
                
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationservices.id;
db.AddParameter(command, "prize", DbTypes.Types.Long).Value = organisationservices.prize;
db.AddParameter(command, "weekday_price", DbTypes.Types.Long).Value = organisationservices.weekday_price;
db.AddParameter(command, "weekend_price", DbTypes.Types.Long).Value = organisationservices.weekend_price;
db.AddParameter(command, "is_price_different", DbTypes.Types.Boolean).Value = organisationservices.is_price_different;
db.AddParameter(command, "timetaken", DbTypes.Types.Long).Value = organisationservices.timetaken;
db.AddParameter(command, "servicesids", DbTypes.Types.Json).Value = organisationservices.servicesids_json;
db.AddParameter(command, "Iscombo", DbTypes.Types.Boolean).Value = organisationservices.Iscombo;
db.AddParameter(command, "offerprize", DbTypes.Types.Long).Value = organisationservices.offerprize;
db.AddParameter(command, "Servicename", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationservices.Servicename) ? "" : organisationservices.Servicename;
db.AddParameter(command, "code", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationservices.code) ? "" : organisationservices.code;
db.AddParameter(command, "show_price", DbTypes.Types.Boolean).Value = organisationservices.show_price;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisationservices.version;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organisationservices.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organisationservices.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organisationservices.attributes_json;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organisationservices.issuspended;
db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = organisationservices.organisationid;
db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = organisationservices.organisationlocationid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organisationservices.isfactory;
db.AddParameter(command, "rating", DbTypes.Types.Decimal).Value = organisationservices.rating.HasValue ? (object)organisationservices.rating.Value : DBNull.Value;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationservices.notes) ? "" : organisationservices.notes;

                if (await db.ExecuteNonQuery(command) > 0)
                {
                    organisationservices.version = organisationservices.version + 1;
                    result = true;
                }
            return result;
        }
        public async Task<bool> Delete(OrganisationServicesDeleteReq organisationservices)
        {
             bool result = false;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.DeleteTransaction(db, organisationservices);
                    
                }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, OrganisationServicesDeleteReq organisationservices)
        {
            bool result = false;
                String query = @"
                UPDATE OrganisationServices
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                queryBuilder.AddParameter("id", "=", "id", organisationservices.id, DbTypes.Types.Long);
                if (organisationservices.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", organisationservices.version, DbTypes.Types.Integer);
                }
                DbCommand command = queryBuilder.GetCommand(db);
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationservices.id;
                db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisationservices.version;
                db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
                db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                if (await db.ExecuteNonQuery(command) > 0)
                {
                    result = true;
                }
            return result;
        }

        public async Task<List<PublicServiceCatalogueItem>> SelectPublicCatalogue(OrganisationServicesSelectReq req)
        {
            req ??= new OrganisationServicesSelectReq();
            var result = new List<PublicServiceCatalogueItem>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await EnsureLocationColumnTransaction(db);

                string query = @"
                SELECT
                    OrganisationServices.id,
                    OrganisationServices.prize,
                    OrganisationServices.weekday_price,
                    OrganisationServices.weekend_price,
                    OrganisationServices.is_price_different,
                    OrganisationServices.timetaken,
                    OrganisationServices.servicesids,
                    OrganisationServices.Iscombo,
                    OrganisationServices.offerprize,
                    OrganisationServices.Servicename,
                    OrganisationServices.code,
                    OrganisationServices.version,
                    OrganisationServices.show_price,
                    OrganisationServices.createdby,
                    OrganisationServices.createdon,
                    OrganisationServices.modifiedby,
                    OrganisationServices.modifiedon,
                    OrganisationServices.attributes,
                    OrganisationServices.isactive,
                    OrganisationServices.issuspended,
                    OrganisationServices.organisationid,
                    OrganisationServices.organisationlocationid,
                    OrganisationServices.isfactory,
                    OrganisationServices.rating,
                    OrganisationServices.notes,
                    Organisation.name AS organisationName,
                    Organisation.imageid AS organisationImageId,
                    OrganisationLocation.city AS organisationLocationCity,
                    OrganisationLocation.state AS organisationLocationState
                FROM OrganisationServices
                INNER JOIN Organisation ON Organisation.id = OrganisationServices.organisationid
                INNER JOIN OrganisationLocation ON OrganisationLocation.id = OrganisationServices.organisationlocationid
                ";

                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                queryBuilder.AddParameter("OrganisationServices.isactive", "=", "isactive", true, DbTypes.Types.Boolean);
                queryBuilder.AddParameter("Organisation.isactive", "=", "orgisactive", true, DbTypes.Types.Boolean);
                queryBuilder.AddParameter("OrganisationLocation.isactive", "=", "locisactive", true, DbTypes.Types.Boolean);

                if (req.organisationid > 0)
                {
                    queryBuilder.AddParameter("OrganisationServices.organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
                }
                if (req.organisationlocationid > 0)
                {
                    queryBuilder.AddParameter("OrganisationServices.organisationlocationid", "=", "organisationlocationid", req.organisationlocationid, DbTypes.Types.Long);
                }
                if (!string.IsNullOrWhiteSpace(req.search))
                {
                    queryBuilder.AddParameter(
                        "(OrganisationServices.Servicename ILIKE @search OR Organisation.name ILIKE @search OR OrganisationLocation.city ILIKE @search)",
                        "search",
                        $"%{req.search.Trim()}%",
                        DbTypes.Types.String);
                }

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "OrganisationServices.id");
                var take = req.take > 0 ? Math.Min(req.take, 500) : 300;
                var skip = req.skip < 0 ? 0 : req.skip;
                queryBuilder.AddLimitOffset(take, skip);

                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        var temp = new PublicServiceCatalogueItem();
                        temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                        temp.prize = reader["prize"] == DBNull.Value ? 0 : Convert.ToInt64(reader["prize"]);
                        temp.weekday_price = reader["weekday_price"] == DBNull.Value ? 0 : Convert.ToInt64(reader["weekday_price"]);
                        temp.weekend_price = reader["weekend_price"] == DBNull.Value ? 0 : Convert.ToInt64(reader["weekend_price"]);
                        temp.is_price_different = reader["is_price_different"] == DBNull.Value ? false : Convert.ToBoolean(reader["is_price_different"]);
                        temp.timetaken = reader["timetaken"] == DBNull.Value ? 0 : Convert.ToInt64(reader["timetaken"]);
                        temp.servicesids_json = reader["servicesids"] == DBNull.Value ? "null" : reader["servicesids"].ToString();
                        temp.Iscombo = reader["Iscombo"] == DBNull.Value ? false : Convert.ToBoolean(reader["Iscombo"]);
                        temp.offerprize = reader["offerprize"] == DBNull.Value ? 0 : Convert.ToInt64(reader["offerprize"]);
                        temp.Servicename = reader["Servicename"] == DBNull.Value ? "" : reader["Servicename"].ToString();
                        temp.code = reader["code"] == DBNull.Value ? "" : reader["code"].ToString();
                        temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                        temp.show_price = reader["show_price"] == DBNull.Value ? true : Convert.ToBoolean(reader["show_price"]);
                        temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                        temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
                        temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                        temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
                        temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
                        temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                        temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
                        temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                        temp.organisationlocationid = HasColumn(reader, "organisationlocationid") && reader["organisationlocationid"] != DBNull.Value
                            ? Convert.ToInt64(reader["organisationlocationid"]) : 0;
                        temp.isfactory = reader["isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfactory"]);
                        temp.rating = reader["rating"] == DBNull.Value ? null : (decimal?)Convert.ToDecimal(reader["rating"]);
                        temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                        temp.organisationName = reader["organisationName"] == DBNull.Value ? "" : reader["organisationName"].ToString();
                        temp.organisationImageId = reader["organisationImageId"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationImageId"]);
                        temp.organisationLocationCity = reader["organisationLocationCity"] == DBNull.Value ? "" : reader["organisationLocationCity"].ToString();
                        temp.organisationLocationState = reader["organisationLocationState"] == DBNull.Value ? "" : reader["organisationLocationState"].ToString();
                        result.Add(temp);
                    }
                }
            }
            return result;
        }

        static bool HasColumn(DbDataReader reader, string columnName)
        {
            for (var i = 0; i < reader.FieldCount; i++)
            {
                if (string.Equals(reader.GetName(i), columnName, StringComparison.OrdinalIgnoreCase))
                    return true;
            }
            return false;
        }

        public Task EnsureLocationColumnAsync(IDb db) => EnsureLocationColumnTransaction(db);

        static async Task EnsureLocationColumnTransaction(IDb db)
        {
            DbCommand cmd = db.GetCommand(@"
                ALTER TABLE organisationservices
                ADD COLUMN IF NOT EXISTS organisationlocationid BIGINT NOT NULL DEFAULT 0");
            await db.ExecuteNonQuery(cmd);
        }
    }
}
