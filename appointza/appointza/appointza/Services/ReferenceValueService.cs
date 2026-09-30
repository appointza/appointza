using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class ReferenceValueService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public ReferenceValueService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        public async Task<List<ReferenceValue>> Select(ReferenceValueSelectReq req)
        {
            List<ReferenceValue> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.SelectTransaction(db, req);
                }
            return result;
        }
        public async Task<List<ReferenceValue>> SelectTransaction(IDb db, ReferenceValueSelectReq req)
        {
            List<ReferenceValue> result = new List<ReferenceValue>();
            
            // Build query with organization-specific filtering when organization ID is provided
            string query;
            DbCommand command;
            
            if (req.organisationid > 0)
            {
                // Use manual query building for complex organization filtering
                query = @"
                SELECT ReferenceValue.id,ReferenceValue.identifier,ReferenceValue.displaytext,ReferenceValue.description,ReferenceValue.langcode,ReferenceValue.organizationid,ReferenceValue.referencetypeid,ReferenceValue.version,ReferenceValue.createdby,ReferenceValue.createdon,ReferenceValue.modifiedby,ReferenceValue.modifiedon,ReferenceValue.attributes,ReferenceValue.isactive,ReferenceValue.issuspended,ReferenceValue.parentid,ReferenceValue.isfactory,ReferenceValue.notes
                FROM ReferenceValue
                WHERE (ReferenceValue.organizationid IS NULL OR ReferenceValue.organizationid = 0 OR ReferenceValue.organizationid = @organisationid)
                ";
                
                // Add additional filters
                if (req.id > 0)
                {
                    query += " AND ReferenceValue.id = @id";
                }
                if (req.parentid > 0)
                {
                    query += " AND ReferenceValue.parentid = @parentid";
                }
                if (req.referencetypeid > 0)
                {
                    query += " AND ReferenceValue.referencetypeid = @referencetypeid";
                }
                if (!string.IsNullOrEmpty(req.identifier))
                {
                    query += " AND ReferenceValue.identifier = @identifier";
                }
                
                query += @" ORDER BY COALESCE((NULLIF(TRIM(ReferenceValue.attributes->>'DisplayOrder'),''))::integer, 2000000000), ReferenceValue.identifier ASC";
                
                command = db.GetCommand(query);
                
                // Add parameters
                // Removed isactive filter to show all reference values (active and inactive)
                // db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = true;
                db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = req.organisationid;
                
                if (req.id > 0)
                {
                    db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
                }
                if (req.parentid > 0)
                {
                    db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = req.parentid;
                }
                if (req.referencetypeid > 0)
                {
                    db.AddParameter(command, "referencetypeid", DbTypes.Types.Long).Value = req.referencetypeid;
                }
                if (!string.IsNullOrEmpty(req.identifier))
                {
                    db.AddParameter(command, "identifier", DbTypes.Types.String).Value = req.identifier;
                }
            }
            else
            {
                // Use query builder for simple queries without organization filtering
                query = @"
                SELECT ReferenceValue.id,ReferenceValue.identifier,ReferenceValue.displaytext,ReferenceValue.description,ReferenceValue.langcode,ReferenceValue.organizationid,ReferenceValue.referencetypeid,ReferenceValue.version,ReferenceValue.createdby,ReferenceValue.createdon,ReferenceValue.modifiedby,ReferenceValue.modifiedon,ReferenceValue.attributes,ReferenceValue.isactive,ReferenceValue.issuspended,ReferenceValue.parentid,ReferenceValue.isfactory,ReferenceValue.notes
                FROM ReferenceValue
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("ReferenceValue.id", "=", "id", req.id, DbTypes.Types.Long);
                }
                if(req.parentid > 0)
                {
                    queryBuilder.AddParameter("ReferenceValue.parentid", "=", "parentid", req.parentid, DbTypes.Types.Long);
                }

                if (req.referencetypeid > 0)
                {
                    queryBuilder.AddParameter("ReferenceValue.referencetypeid", "=", "referencetypeid", req.referencetypeid, DbTypes.Types.Long);
                }
                if (!string.IsNullOrEmpty(req.identifier))
                {
                    queryBuilder.AddParameter("ReferenceValue.identifier", "=", "identifier", req.identifier, DbTypes.Types.String);
                }
                
                // Removed isactive filter to show all reference values (active and inactive)
                // queryBuilder.AddParameter("ReferenceValue.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "ReferenceValue.identifier");
                command = queryBuilder.GetCommand(db);
            }
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        ReferenceValue temp = new ReferenceValue();
                         temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
temp.identifier = reader["identifier"] == DBNull.Value ? "" : reader["identifier"].ToString();
temp.displaytext = reader["displaytext"] == DBNull.Value ? "" : reader["displaytext"].ToString();
temp.description = reader["description"] == DBNull.Value ? "" : reader["description"].ToString();
temp.langcode = reader["langcode"] == DBNull.Value ? "" : reader["langcode"].ToString();
 temp.organizationid = reader["organizationid"] == DBNull.Value ? 0 : Convert.ToInt32(reader["organizationid"]);
 temp.referencetypeid = reader["referencetypeid"] == DBNull.Value ? 0 : Convert.ToInt32(reader["referencetypeid"]);
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

        /// <summary>
        /// Batch lookup of reference-value display text by id (public-site facilities).
        /// Preserves no ordering — callers map ids to labels in list order.
        /// </summary>
        public async Task<Dictionary<long, string>> SelectDisplayTextByIdsTransaction(IDb db, IEnumerable<long> ids)
        {
            var idList = ids.Where(id => id > 0).Distinct().ToList();
            var labels = new Dictionary<long, string>();
            if (idList.Count == 0)
                return labels;

            var inClause = string.Join(", ", idList);
            var query = $@"
                SELECT ReferenceValue.id, ReferenceValue.displaytext
                FROM ReferenceValue
                WHERE ReferenceValue.id IN ({inClause})";

            var command = db.GetCommand(query);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    var id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    if (id <= 0)
                        continue;

                    var displayText = reader["displaytext"] == DBNull.Value ? "" : reader["displaytext"].ToString() ?? "";
                    labels[id] = displayText.Trim();
                }
            }

            return labels;
        }

        public async Task<ReferenceValue> Insert(ReferenceValue referencevalue)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.InsertTransaction(db, referencevalue);
                }
            return referencevalue;
        }
        public async Task InsertTransaction(IDb db, ReferenceValue referencevalue)
        {
                const int websiteTemplateTypeId = 5;
                const int maxWebsiteTemplatesPerOrg = 2;
                const string orgTemplateAssetsIdentifier = "__org_template_assets__";
                if (referencevalue.referencetypeid == websiteTemplateTypeId
                    && referencevalue.organizationid > 0
                    && !string.Equals(referencevalue.identifier, orgTemplateAssetsIdentifier, StringComparison.Ordinal))
                {
                    String countQuery = @"
                    SELECT COUNT(*)::int
                    FROM ReferenceValue
                    WHERE organizationid = @organisationid
                      AND referencetypeid = @referencetypeid
                      AND COALESCE(identifier, '') <> @assets_identifier
                    ";
                    DbCommand countCommand = db.GetCommand(countQuery);
                    db.AddParameter(countCommand, "organisationid", DbTypes.Types.Integer).Value = referencevalue.organizationid;
                    db.AddParameter(countCommand, "referencetypeid", DbTypes.Types.Integer).Value = websiteTemplateTypeId;
                    db.AddParameter(countCommand, "assets_identifier", DbTypes.Types.String).Value = orgTemplateAssetsIdentifier;
                    int existingCount = 0;
                    using (DbDataReader countReader = await db.Execute(countCommand))
                    {
                        if (await countReader.ReadAsync())
                        {
                            existingCount = countReader[0] == DBNull.Value ? 0 : Convert.ToInt32(countReader[0]);
                        }
                    }
                    if (existingCount >= maxWebsiteTemplatesPerOrg)
                    {
                        throw new InvalidOperationException("An organisation can have at most 2 website templates.");
                    }
                }

                String query = @"
                INSERT INTO ReferenceValue (
                    identifier,displaytext,description,langcode,organizationid,referencetypeid,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,parentid,isfactory,notes
                )
                VALUES (
                   @identifier,@displaytext,@description,@langcode,@organizationid,@referencetypeid,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@parentid,@isfactory,@notes
                )
                RETURNING id;
                ";
                referencevalue.isactive = true;
                referencevalue.version = 1;
                referencevalue.createdon = DateTime.UtcNow;
                referencevalue.createdby = requeststate.usercontext.id;
                referencevalue.modifiedon = DateTime.UtcNow;
                referencevalue.modifiedby = requeststate.usercontext.id;
                
                // Debug logging
                Console.WriteLine($"Inserting ReferenceValue - referencetypeid: {referencevalue.referencetypeid}, organizationid: {referencevalue.organizationid}, parentid: {referencevalue.parentid}");

                DbCommand command = db.GetCommand(query);

                db.AddParameter(command, "identifier", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencevalue.identifier) ? "" : referencevalue.identifier;
db.AddParameter(command, "displaytext", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencevalue.displaytext) ? "" : referencevalue.displaytext;
db.AddParameter(command, "description", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencevalue.description) ? "" : referencevalue.description;
db.AddParameter(command, "langcode", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencevalue.langcode) ? "" : referencevalue.langcode;
db.AddParameter(command, "organizationid", DbTypes.Types.Integer).Value = referencevalue.organizationid;
db.AddParameter(command, "referencetypeid", DbTypes.Types.Integer).Value = referencevalue.referencetypeid;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = referencevalue.version;
db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = referencevalue.createdby;
db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = referencevalue.createdon;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = referencevalue.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = referencevalue.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = referencevalue.attributes_json;
db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = referencevalue.isactive;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = referencevalue.issuspended;
db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = referencevalue.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = referencevalue.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencevalue.notes) ? "" : referencevalue.notes;
                
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        referencevalue.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                }
            }
        public async Task<ReferenceValue> Update(ReferenceValue referencevalue)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.UpdateTransaction(db, referencevalue);
                }
            return referencevalue;
        }
        public async Task<bool> UpdateTransaction(IDb db, ReferenceValue referencevalue)
        {
            bool result = false;
                String query = @"
                UPDATE ReferenceValue
                    SET 
                        identifier = @identifier,displaytext = @displaytext,description = @description,langcode = @langcode,organizationid = @organizationid,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,parentid = @parentid,isfactory = @isfactory,notes = @notes,
                        version = version + 1
                ";
                
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

                queryBuilder.AddParameter("id", "=", "id", referencevalue.id, DbTypes.Types.Long);

                if (referencevalue.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", referencevalue.version, DbTypes.Types.Integer);
                }

                var command = queryBuilder.GetCommand(db);
                
                referencevalue.modifiedon = DateTime.UtcNow;
                referencevalue.modifiedby = requeststate.usercontext.id;
                
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = referencevalue.id;
db.AddParameter(command, "identifier", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencevalue.identifier) ? "" : referencevalue.identifier;
db.AddParameter(command, "displaytext", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencevalue.displaytext) ? "" : referencevalue.displaytext;
db.AddParameter(command, "description", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencevalue.description) ? "" : referencevalue.description;
db.AddParameter(command, "langcode", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencevalue.langcode) ? "" : referencevalue.langcode;
db.AddParameter(command, "organizationid", DbTypes.Types.Integer).Value = referencevalue.organizationid;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = referencevalue.version;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = referencevalue.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = referencevalue.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = referencevalue.attributes_json;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = referencevalue.issuspended;
db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = referencevalue.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = referencevalue.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(referencevalue.notes) ? "" : referencevalue.notes;

                if (await db.ExecuteNonQuery(command) > 0)
                {
                    referencevalue.version = referencevalue.version + 1;
                    result = true;
                }
            return result;
        }
        public async Task<bool> Delete(ReferenceValueDeleteReq referencevalue)
        {
             bool result = false;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.DeleteTransaction(db, referencevalue);
                    
                }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, ReferenceValueDeleteReq referencevalue)
        {
            bool result = false;
                String query = @"
                DELETE FROM ReferenceValue
                WHERE id = @id
                  AND COALESCE(isfactory, FALSE) = FALSE
                ";
                DbCommand command = db.GetCommand(query);
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = referencevalue.id;
                if (await db.ExecuteNonQuery(command) > 0)
                {
                    result = true;
                }
            return result;
        }
    }
}
