using appointza.Models;
using appointza.Utils;
using appointza.Razorpay;
using System.Data.Common;

namespace appointza.Services
{
    public class OrganisationService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        RazorpayService razorpayService;
        OrganisationSubscriptionService organisationSubscriptionService;
        OrganisationReferralService organisationReferralService;
        
        public OrganisationService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            RazorpayService razorpayService,
            OrganisationSubscriptionService organisationSubscriptionService,
            OrganisationReferralService organisationReferralService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.razorpayService = razorpayService;
            this.organisationSubscriptionService = organisationSubscriptionService;
            this.organisationReferralService = organisationReferralService;
        }
        public async Task<List<Organisation>> Select(OrganisationSelectReq req)
        {
            List<Organisation> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.SelectTransaction(db, req);
                }
            return result;
        }
        public async Task<List<Organisation>> SelectTransaction(IDb db, OrganisationSelectReq req)
        {
            List<Organisation> result = new List<Organisation>();
                string query = @"
                SELECT Organisation.id,Organisation.name,Organisation.gstnumber,Organisation.secondarytypecode,Organisation.secondarytype,Organisation.primarytype,Organisation.imageid,Organisation.organisationlogo,Organisation.tagline,Organisation.primarytypecode,Organisation.version,Organisation.createdby,Organisation.createdon,Organisation.modifiedby,Organisation.modifiedon,Organisation.attributes,Organisation.isactive,Organisation.issuspended,Organisation.parentid,Organisation.isfactory,Organisation.notes,Organisation.booking_amount,Organisation.isserviceamount
                FROM Organisation
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            if(req.id > 0 || !string.IsNullOrWhiteSpace(req.gstnumber))
            {
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("Organisation.id", "=", "id", req.id, DbTypes.Types.Long);
                }
                if (!string.IsNullOrWhiteSpace(req.gstnumber))
                {
                    queryBuilder.AddParameter("Organisation.gstnumber", "=", "gstnumber", req.gstnumber, DbTypes.Types.String);
                }

            }
            else
            {
                queryBuilder.AddParameter("Organisation.id", "=", "id", req.id, DbTypes.Types.Long);
            }
              
            queryBuilder.AddParameter("Organisation.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Organisation.id");
                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        Organisation temp = new Organisation();
                         temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
temp.gstnumber = reader["gstnumber"] == DBNull.Value ? "" : reader["gstnumber"].ToString();
temp.secondarytypecode = reader["secondarytypecode"] == DBNull.Value ? "" : reader["secondarytypecode"].ToString();
 temp.secondarytype = reader["secondarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["secondarytype"]);
 temp.primarytype = reader["primarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["primarytype"]);
  temp.imageid = reader["imageid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["imageid"]);
 temp.organisationlogo = reader["organisationlogo"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlogo"]);
temp.tagline = reader["tagline"] == DBNull.Value ? "" : reader["tagline"].ToString();
temp.primarytypecode = reader["primarytypecode"] == DBNull.Value ? "" : reader["primarytypecode"].ToString();
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
temp.booking_amount = reader["booking_amount"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["booking_amount"]);
temp.isserviceamount = reader["isserviceamount"] == DBNull.Value ? false : Convert.ToBoolean(reader["isserviceamount"]);
                        result.Add(temp);
                    }
                }
            return result;
        }
        public async Task<Organisation> Insert(Organisation organisation)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.InsertTransaction(db, organisation);
                }
            return organisation;
        }
        public async Task InsertTransaction(IDb db, Organisation organisation)
        {
                String query = @"
                INSERT INTO Organisation (
                    name,gstnumber,secondarytypecode,secondarytype,primarytype,imageid,organisationlogo,tagline,primarytypecode,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,parentid,isfactory,notes,booking_amount,isserviceamount
                )
                VALUES (
                   @name,@gstnumber,@secondarytypecode,@secondarytype,@primarytype,@imageid,@organisationlogo,@tagline,@primarytypecode,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@parentid,@isfactory,@notes,@booking_amount,@isserviceamount
                )
                RETURNING id;
                ";
                organisation.isactive = true;
                organisation.version = 1;
                organisation.createdon = DateTime.UtcNow;
                organisation.createdby = requeststate.usercontext.id;
                organisation.modifiedon = DateTime.UtcNow;
                organisation.modifiedby = requeststate.usercontext.id;

                DbCommand command = db.GetCommand(query);

                db.AddParameter(command, "name", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.name) ? "" : organisation.name;
db.AddParameter(command, "gstnumber", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.gstnumber) ? "" : organisation.gstnumber;
db.AddParameter(command, "secondarytypecode", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.secondarytypecode) ? "" : organisation.secondarytypecode;
db.AddParameter(command, "secondarytype", DbTypes.Types.Long).Value = organisation.secondarytype;
db.AddParameter(command, "primarytype", DbTypes.Types.Long).Value = organisation.primarytype;
db.AddParameter(command, "imageid", DbTypes.Types.Long).Value = organisation.imageid;
db.AddParameter(command, "organisationlogo", DbTypes.Types.Long).Value = organisation.organisationlogo;
db.AddParameter(command, "tagline", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.tagline) ? "" : organisation.tagline;
db.AddParameter(command, "primarytypecode", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.primarytypecode) ? "" : organisation.primarytypecode;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisation.version;
db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = organisation.createdby;
db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = organisation.createdon;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organisation.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organisation.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organisation.attributes_json;
db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = organisation.isactive;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organisation.issuspended;
db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = organisation.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organisation.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.notes) ? "" : organisation.notes;
db.AddParameter(command, "booking_amount", DbTypes.Types.Decimal).Value = organisation.booking_amount;
db.AddParameter(command, "isserviceamount", DbTypes.Types.Boolean).Value = organisation.isserviceamount;
                
                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        organisation.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                }

                if (organisation.id > 0)
                {
                    try
                    {
                        await organisationSubscriptionService.StartTrialTransaction(
                            db,
                            organisation.id,
                            organisation.subscription_plan_code);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ Subscription trial setup failed for org {organisation.id}: {ex.Message}");
                    }

                    try
                    {
                        await organisationReferralService.AssignReferralCodeOnInsertTransaction(db, organisation.id);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"⚠️ Referral code setup failed for org {organisation.id}: {ex.Message}");
                    }
                }
                
                // Create Razorpay contact with type "vendor" when organization is created
                if (organisation.id > 0)
                {
                    try
                    {
                        // Get the user who created the organization for contact details
                        string contactEmail = null;
                        string contactPhone = null;
                        
                        if (organisation.createdby > 0)
                        {
                            // Query user directly to avoid circular dependency
                            string userQuery = @"
                                SELECT email, mobile 
                                FROM Users 
                                WHERE id = @userid AND isactive = true
                            ";
                            DbCommand userCommand = db.GetCommand(userQuery);
                            db.AddParameter(userCommand, "userid", DbTypes.Types.Long).Value = organisation.createdby;
                            
                            using (DbDataReader userReader = await db.Execute(userCommand))
                            {
                                if (await userReader.ReadAsync())
                                {
                                    contactEmail = userReader["email"] == DBNull.Value ? null : userReader["email"].ToString();
                                    contactPhone = userReader["mobile"] == DBNull.Value ? null : userReader["mobile"].ToString();
                                }
                            }
                        }
                        
                        // Create Razorpay contact request
                        var razorpayContactReq = new RazorpayContactReq
                        {
                            name = organisation.name ?? "Organization",
                            email = contactEmail,
                            contact = contactPhone,
                            type = "vendor",
                            reference_id = organisation.id.ToString(),
                            notes = new System.Collections.Generic.Dictionary<string, string>
                            {
                                { "organisation_id", organisation.id.ToString() },
                                { "gst_number", organisation.gstnumber ?? "" }
                            }
                        };
                        
                        // Create contact in Razorpay
                        var razorpayContact = await razorpayService.CreateContact(razorpayContactReq);
                        
                        // Log success (optional - you can store razorpayContact.id if needed)
                        Console.WriteLine($"✅ Razorpay contact created for organization {organisation.id}: {razorpayContact.id}");
                    }
                    catch (Exception ex)
                    {
                        // Log error but don't fail organization creation
                        Console.WriteLine($"⚠️ Failed to create Razorpay contact for organization {organisation.id}: {ex.Message}");
                        // Organization creation should still succeed even if Razorpay contact creation fails
                    }
                }
            }
        public async Task<Organisation> Update(Organisation organisation)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.UpdateTransaction(db, organisation);
                }
            return organisation;
        }
        public async Task<bool> UpdateTransaction(IDb db, Organisation organisation)
        {
            bool result = false;
            
            // Check for duplicate organization name (case-insensitive) before updating
            // Exclude the current organization being updated
            if (!string.IsNullOrEmpty(organisation.name))
            {
                string duplicateOrgNameQuery = @"
                    SELECT id, name, isactive 
                    FROM Organisation 
                    WHERE LOWER(TRIM(name)) = LOWER(TRIM(@name)) 
                    AND id != @currentId 
                    AND isactive = true
                ";
                DbCommand duplicateOrgNameCommand = db.GetCommand(duplicateOrgNameQuery);
                db.AddParameter(duplicateOrgNameCommand, "name", DbTypes.Types.String).Value = organisation.name ?? "";
                db.AddParameter(duplicateOrgNameCommand, "currentId", DbTypes.Types.Long).Value = organisation.id;
                
                using (DbDataReader duplicateOrgNameReader = await db.Execute(duplicateOrgNameCommand))
                {
                    if (await duplicateOrgNameReader.ReadAsync())
                    {
                        long existingOrgId = duplicateOrgNameReader["id"] == DBNull.Value ? 0 : Convert.ToInt64(duplicateOrgNameReader["id"]);
                        if (existingOrgId > 0)
                        {
                            throw new AppException(AppException.ErrorCodes.OrganisationDuplicate, 
                                $"Organization name '{organisation.name}' is already registered. Please use a different organization name.");
                        }
                    }
                }
            }
            
                String query = @"
                UPDATE Organisation
                    SET 
                        name = @name,gstnumber = @gstnumber,secondarytypecode = @secondarytypecode,secondarytype = @secondarytype,primarytype = @primarytype,imageid = @imageid,organisationlogo = @organisationlogo,tagline = @tagline,primarytypecode = @primarytypecode,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,parentid = @parentid,isfactory = @isfactory,notes = @notes,booking_amount = @booking_amount,isserviceamount = @isserviceamount,
                        version = version + 1
                ";
                
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

                queryBuilder.AddParameter("id", "=", "id", organisation.id, DbTypes.Types.Long);

                if (organisation.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", organisation.version, DbTypes.Types.Integer);
                }

                var command = queryBuilder.GetCommand(db);
                
                organisation.modifiedon = DateTime.UtcNow;
                organisation.modifiedby = requeststate.usercontext.id;
                
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisation.id;
db.AddParameter(command, "name", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.name) ? "" : organisation.name;
db.AddParameter(command, "gstnumber", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.gstnumber) ? "" : organisation.gstnumber;
db.AddParameter(command, "secondarytypecode", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.secondarytypecode) ? "" : organisation.secondarytypecode;
db.AddParameter(command, "secondarytype", DbTypes.Types.Long).Value = organisation.secondarytype;
db.AddParameter(command, "primarytype", DbTypes.Types.Long).Value = organisation.primarytype;
db.AddParameter(command, "imageid", DbTypes.Types.Long).Value = organisation.imageid;
db.AddParameter(command, "organisationlogo", DbTypes.Types.Long).Value = organisation.organisationlogo;
db.AddParameter(command, "tagline", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.tagline) ? "" : organisation.tagline;
db.AddParameter(command, "primarytypecode", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.primarytypecode) ? "" : organisation.primarytypecode;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = organisation.version;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = organisation.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = organisation.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = organisation.attributes_json;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = organisation.issuspended;
db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = organisation.parentid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = organisation.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisation.notes) ? "" : organisation.notes;
db.AddParameter(command, "booking_amount", DbTypes.Types.Decimal).Value = organisation.booking_amount;
db.AddParameter(command, "isserviceamount", DbTypes.Types.Boolean).Value = organisation.isserviceamount;

                if (await db.ExecuteNonQuery(command) > 0)
                {
                    organisation.version = organisation.version + 1;
                    result = true;
                }
            return result;
        }
        public async Task<bool> Delete(OrganisationDeleteReq organisation)
        {
             bool result = false;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.DeleteTransaction(db, organisation);
                    
                }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, OrganisationDeleteReq organisation)
        {
            bool result = false;
                String query = @"
                UPDATE Organisation
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                // Always add id condition to ensure only one organisation is deleted
                queryBuilder.AddParameter("Organisation.id", "=", "id", organisation.id, DbTypes.Types.Long);
                if (organisation.version > 0)
                {
                    queryBuilder.AddParameter("Organisation.version", "=", "version", organisation.version, DbTypes.Types.Integer);
                }
                DbCommand command = queryBuilder.GetCommand(db);
                // QueryBuilder already adds the parameters, so we only need to add the ones not handled by QueryBuilder
                db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
                db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                if (await db.ExecuteNonQuery(command) > 0)
                {
                    result = true;
                }
            return result;
        }

        public async Task<List<OrganisationDetail>> SelectOrganisationDetail(OrganisationSelectReq req)
        {
            List<OrganisationDetail> result = new List<OrganisationDetail>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectOrganisationDetailTransaction(db, req);
            }
            return result;
        }

        public async Task<List<OrganisationDetail>> SelectOrganisationDetailTransaction(IDb db, OrganisationSelectReq req)
        {
            List<OrganisationDetail> result = new List<OrganisationDetail>();

            string query = @"
    SELECT 
        Organisation.id AS organisationid,
        Organisation.name AS organisationname,
        Organisation.gstnumber AS organisationgstnumber,
        Organisation.secondarytypecode AS organisationsecondarytypecode,
        Organisation.secondarytype AS organisationsecondarytype,
        Organisation.primarytype AS organisationprimarytype,
        Organisation.imageid AS organisationimageid,
        Organisation.organisationlogo AS organisationlogo,
        Organisation.tagline AS organisationtagline,
        Organisation.primarytypecode AS organisationprimarytypecode,
        
        OrganisationLocation.id AS organisationlocationid,
        OrganisationLocation.name AS organisationlocationname,
        OrganisationLocation.addressline1 AS organisationlocationaddressline1,
        OrganisationLocation.addressline2 AS organisationlocationaddressline2,
        OrganisationLocation.city AS organisationlocationcity,
        OrganisationLocation.state AS organisationlocationstate,
        OrganisationLocation.country AS organisationlocationcountry,
        OrganisationLocation.latitude AS organisationlocationlatitude,
        OrganisationLocation.longitude AS organisationlocationlongitude,
        OrganisationLocation.googlelocation AS organisationlocationgooglelocation,
        OrganisationLocation.pincode AS organisationlocationpincode

    FROM Organisation
    LEFT JOIN OrganisationLocation 
    ON Organisation.id = OrganisationLocation.organisationid
    ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (req.id > 0)
            {
                queryBuilder.AddParameter("Organisation.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.OrganisationPrimaryType > 0)
            {
                queryBuilder.AddParameter("Organisation.primarytype", "=", "OrganisationPrimaryType", req.OrganisationPrimaryType, DbTypes.Types.Long);
            }
            if (req.OrganisationSecondaryType > 0)
            {
                queryBuilder.AddParameter("Organisation.secondarytype", "=", "OrganisationSecondaryType", req.OrganisationSecondaryType, DbTypes.Types.Long);
            }


            queryBuilder.AddParameter("Organisation.isactive", "=", "isactive", true, DbTypes.Types.Boolean);
            queryBuilder.AddParameter("OrganisationLocation.isactive", "=", "locationisactive", true, DbTypes.Types.Boolean);
            
            // Only filter by isverified if explicitly requested (for explore page, show all active locations)
            if (req.RequireVerifiedLocation == true)
            {
                queryBuilder.AddParameter("OrganisationLocation.isverified", "=", "locationisverified", true, DbTypes.Types.Boolean);
            }
            
            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Organisation.id");

            var command = queryBuilder.GetCommand(db);

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    OrganisationDetail temp = new OrganisationDetail();

                    // Organisation Fields
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.organisationname = reader["organisationname"] == DBNull.Value ? "" : reader["organisationname"].ToString();
                    temp.organisationgstnumber = reader["organisationgstnumber"] == DBNull.Value ? "" : reader["organisationgstnumber"].ToString();
                    temp.organisationsecondarytypecode = reader["organisationsecondarytypecode"] == DBNull.Value ? "" : reader["organisationsecondarytypecode"].ToString();
                    temp.organisationsecondarytype = reader["organisationsecondarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationsecondarytype"]);
                    temp.organisationprimarytype = reader["organisationprimarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationprimarytype"]);
                    temp.organisationimageid = reader["organisationimageid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationimageid"]);
                    temp.organisationlogo = reader["organisationlogo"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlogo"]);
                    temp.organisationtagline = reader["organisationtagline"] == DBNull.Value ? "" : reader["organisationtagline"].ToString();
                    temp.organisationprimarytypecode = reader["organisationprimarytypecode"] == DBNull.Value ? "" : reader["organisationprimarytypecode"].ToString();

                        // OrganisationLocation Fields
                    temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
                    temp.organisationlocationname = reader["organisationlocationname"] == DBNull.Value ? "" : reader["organisationlocationname"].ToString();
                    temp.organisationlocationaddressline1 = reader["organisationlocationaddressline1"] == DBNull.Value ? "" : reader["organisationlocationaddressline1"].ToString();
                    temp.organisationlocationaddressline2 = reader["organisationlocationaddressline2"] == DBNull.Value ? "" : reader["organisationlocationaddressline2"].ToString();
                    temp.organisationlocationcity = reader["organisationlocationcity"] == DBNull.Value ? "" : reader["organisationlocationcity"].ToString();
                    temp.organisationlocationstate = reader["organisationlocationstate"] == DBNull.Value ? "" : reader["organisationlocationstate"].ToString();
                    temp.organisationlocationcountry = reader["organisationlocationcountry"] == DBNull.Value ? "" : reader["organisationlocationcountry"].ToString();
                    temp.organisationlocationlatitude = reader["organisationlocationlatitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["organisationlocationlatitude"]);
                    temp.organisationlocationlongitude = reader["organisationlocationlongitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["organisationlocationlongitude"]);
                    temp.organisationlocationgooglelocation = reader["organisationlocationgooglelocation"] == DBNull.Value ? "" : reader["organisationlocationgooglelocation"].ToString();
                    temp.organisationlocationpincode = reader["organisationlocationpincode"] == DBNull.Value ? "" : reader["organisationlocationpincode"].ToString();
                    

                    result.Add(temp);
                }
            }

            return result;
        }

        /// <summary>
        /// Find organization by location details (area, city, state)
        /// </summary>
        public async Task<OrganisationDetail> FindOrganisationByLocation(string organizationname, string area, string city, string state)
        {
            List<OrganisationDetail> result = new List<OrganisationDetail>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.FindOrganisationByLocationTransaction(db, organizationname,area, city, state);
            }
            return result.FirstOrDefault();
        }

        public async Task<List<OrganisationDetail>> FindOrganisationByLocationTransaction(IDb db,string organizationname, string area, string city, string state)
        {
            List<OrganisationDetail> result = new List<OrganisationDetail>();

            string query = @"
    SELECT 
        Organisation.id AS organisationid,
        Organisation.name AS organisationname,
        Organisation.gstnumber AS organisationgstnumber,
        Organisation.secondarytypecode AS organisationsecondarytypecode,
        Organisation.secondarytype AS organisationsecondarytype,
        Organisation.primarytype AS organisationprimarytype,
        Organisation.imageid AS organisationimageid,
        Organisation.organisationlogo AS organisationlogo,
        Organisation.tagline AS organisationtagline,
        Organisation.primarytypecode AS organisationprimarytypecode,
        
        OrganisationLocation.id AS organisationlocationid,
        OrganisationLocation.name AS organisationlocationname,
        OrganisationLocation.addressline1 AS organisationlocationaddressline1,
        OrganisationLocation.addressline2 AS organisationlocationaddressline2,
        OrganisationLocation.city AS organisationlocationcity,
        OrganisationLocation.state AS organisationlocationstate,
        OrganisationLocation.country AS organisationlocationcountry,
        OrganisationLocation.latitude AS organisationlocationlatitude,
        OrganisationLocation.longitude AS organisationlocationlongitude,
        OrganisationLocation.googlelocation AS organisationlocationgooglelocation,
        OrganisationLocation.pincode AS organisationlocationpincode

    FROM Organisation
    LEFT JOIN OrganisationLocation 
    ON Organisation.id = OrganisationLocation.organisationid
    ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            // Add location filters
            if (!string.IsNullOrEmpty(city))
            {
                queryBuilder.AddParameter("REPLACE(LOWER(OrganisationLocation.city), ' ', '') ILIKE @city", "city", $"%{city.ToLower().Replace(" ", "")}%", DbTypes.Types.String);
            }
            
            if (!string.IsNullOrEmpty(state))
            {
                queryBuilder.AddParameter("REPLACE(LOWER(OrganisationLocation.state), ' ', '') ILIKE @state", "state", $"%{state.ToLower().Replace(" ", "")}%", DbTypes.Types.String);
            }
            
            if (!string.IsNullOrEmpty(area))
            {
                queryBuilder.AddParameter("REPLACE(LOWER(OrganisationLocation.name), ' ', '') ILIKE @area", "area", $"%{area.ToLower().Replace(" ", "")}%", DbTypes.Types.String);
            }

            if (!string.IsNullOrEmpty(organizationname))
            {
                queryBuilder.AddParameter("REPLACE(LOWER(Organisation.name), ' ', '') ILIKE @organizationname", "organizationname", $"%{organizationname.ToLower().Replace(" ", "")}%", DbTypes.Types.String);
            }
            // Add required WHERE conditions
            queryBuilder.AddParameter("Organisation.isactive", "=", "isactive", true, DbTypes.Types.Boolean);
            queryBuilder.AddParameter("OrganisationLocation.isactive", "=", "locationisactive", true, DbTypes.Types.Boolean);
            queryBuilder.AddParameter("OrganisationLocation.isverified", "=", "locationisverified", true, DbTypes.Types.Boolean);
            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Organisation.id");

            var command = queryBuilder.GetCommand(db);

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    OrganisationDetail temp = new OrganisationDetail();

                    // Organisation Fields
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.organisationname = reader["organisationname"] == DBNull.Value ? "" : reader["organisationname"].ToString();
                    temp.organisationgstnumber = reader["organisationgstnumber"] == DBNull.Value ? "" : reader["organisationgstnumber"].ToString();
                    temp.organisationsecondarytypecode = reader["organisationsecondarytypecode"] == DBNull.Value ? "" : reader["organisationsecondarytypecode"].ToString();
                    temp.organisationsecondarytype = reader["organisationsecondarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationsecondarytype"]);
                    temp.organisationprimarytype = reader["organisationprimarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationprimarytype"]);
                    temp.organisationimageid = reader["organisationimageid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationimageid"]);
                    temp.organisationlogo = reader["organisationlogo"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlogo"]);
                    temp.organisationtagline = reader["organisationtagline"] == DBNull.Value ? "" : reader["organisationtagline"].ToString();
                    temp.organisationprimarytypecode = reader["organisationprimarytypecode"] == DBNull.Value ? "" : reader["organisationprimarytypecode"].ToString();

                    // OrganisationLocation Fields
                    temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
                    temp.organisationlocationname = reader["organisationlocationname"] == DBNull.Value ? "" : reader["organisationlocationname"].ToString();
                    temp.organisationlocationaddressline1 = reader["organisationlocationaddressline1"] == DBNull.Value ? "" : reader["organisationlocationaddressline1"].ToString();
                    temp.organisationlocationaddressline2 = reader["organisationlocationaddressline2"] == DBNull.Value ? "" : reader["organisationlocationaddressline2"].ToString();
                    temp.organisationlocationcity = reader["organisationlocationcity"] == DBNull.Value ? "" : reader["organisationlocationcity"].ToString();
                    temp.organisationlocationstate = reader["organisationlocationstate"] == DBNull.Value ? "" : reader["organisationlocationstate"].ToString();
                    temp.organisationlocationcountry = reader["organisationlocationcountry"] == DBNull.Value ? "" : reader["organisationlocationcountry"].ToString();
                    temp.organisationlocationlatitude = reader["organisationlocationlatitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["organisationlocationlatitude"]);
                    temp.organisationlocationlongitude = reader["organisationlocationlongitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["organisationlocationlongitude"]);
                    temp.organisationlocationgooglelocation = reader["organisationlocationgooglelocation"] == DBNull.Value ? "" : reader["organisationlocationgooglelocation"].ToString();
                    temp.organisationlocationpincode = reader["organisationlocationpincode"] == DBNull.Value ? "" : reader["organisationlocationpincode"].ToString();

                    result.Add(temp);
                }
            }

            return result;
        }

        /// <summary>
        /// Get organization details by subdomain location using SubdomainHelper
        /// </summary>
        public async Task<OrganisationDetail> GetOrganisationBySubdomainLocation(string area, string city, string state, string organizationName)
        {
            List<OrganisationDetail> result = new List<OrganisationDetail>();
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.GetOrganisationBySubdomainLocationTransaction(db, area, city, state, organizationName);
            }
            return result.FirstOrDefault();
        }

        public async Task<List<OrganisationDetail>> GetOrganisationBySubdomainLocationTransaction(IDb db, string area, string city, string state, string organizationName)
        {
            List<OrganisationDetail> result = new List<OrganisationDetail>();

            string query = @"
    SELECT 
        Organisation.id AS organisationid,
        Organisation.name AS organisationname,
        Organisation.gstnumber AS organisationgstnumber,
        Organisation.secondarytypecode AS organisationsecondarytypecode,
        Organisation.secondarytype AS organisationsecondarytype,
        Organisation.primarytype AS organisationprimarytype,
        Organisation.imageid AS organisationimageid,
        Organisation.organisationlogo AS organisationlogo,
        Organisation.tagline AS organisationtagline,
        Organisation.primarytypecode AS organisationprimarytypecode,
        
        OrganisationLocation.id AS organisationlocationid,
        OrganisationLocation.name AS organisationlocationname,
        OrganisationLocation.addressline1 AS organisationlocationaddressline1,
        OrganisationLocation.addressline2 AS organisationlocationaddressline2,
        OrganisationLocation.city AS organisationlocationcity,
        OrganisationLocation.state AS organisationlocationstate,
        OrganisationLocation.country AS organisationlocationcountry,
        OrganisationLocation.latitude AS organisationlocationlatitude,
        OrganisationLocation.longitude AS organisationlocationlongitude,
        OrganisationLocation.googlelocation AS organisationlocationgooglelocation,
        OrganisationLocation.pincode AS organisationlocationpincode,
        OrganisationLocation.customurl AS organisationlocationcustomurl,
        OrganisationLocation.templateid AS organisationlocationtemplateid,
        OrganisationLocation.version AS organisationlocationversion,
        OrganisationLocation.createdby AS organisationlocationcreatedby,
        OrganisationLocation.createdon AS organisationlocationcreatedon,
        OrganisationLocation.modifiedby AS organisationlocationmodifiedby,
        OrganisationLocation.modifiedon AS organisationlocationmodifiedon,
        OrganisationLocation.images AS organisationlocationimages,
        OrganisationLocation.attributes AS organisationlocationattributes,
        OrganisationLocation.isactive AS organisationlocationisactive,
        OrganisationLocation.issuspended AS organisationlocationissuspended,
        OrganisationLocation.parentid AS organisationlocationparentid,
        OrganisationLocation.isfactory AS organisationlocationisfactory,
        OrganisationLocation.notes AS organisationlocationnotes

    FROM Organisation
    LEFT JOIN OrganisationLocation 
    ON Organisation.id = OrganisationLocation.organisationid
    ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            // Add location filters using normalized comparison
            // Normalize removes all spaces, hyphens, and special characters for accurate matching
            if (!string.IsNullOrEmpty(city))
            {
                var normalizedCity = SlugHelper.Normalize(city);
                Console.WriteLine($"🔍 Searching for city: {city} (normalized: {normalizedCity})");
                // Use REGEXP_REPLACE to remove all non-alphanumeric characters from database values
                queryBuilder.AddParameter("REGEXP_REPLACE(LOWER(OrganisationLocation.city), '[^a-z0-9]', '', 'g') ILIKE @city", "city", $"%{normalizedCity}%", DbTypes.Types.String);
            }
            
            if (!string.IsNullOrEmpty(state))
            {
                var normalizedState = SlugHelper.Normalize(state);
                Console.WriteLine($"🔍 Searching for state: {state} (normalized: {normalizedState})");
                queryBuilder.AddParameter("REGEXP_REPLACE(LOWER(OrganisationLocation.state), '[^a-z0-9]', '', 'g') ILIKE @state", "state", $"%{normalizedState}%", DbTypes.Types.String);
            }
            
            if (!string.IsNullOrEmpty(area))
            {
                var normalizedArea = SlugHelper.Normalize(area);
                Console.WriteLine($"🔍 Searching for area: {area} (normalized: {normalizedArea})");
                queryBuilder.AddParameter("REGEXP_REPLACE(LOWER(OrganisationLocation.name), '[^a-z0-9]', '', 'g') ILIKE @area", "area", $"%{normalizedArea}%", DbTypes.Types.String);
            }

            if (!string.IsNullOrEmpty(organizationName))
            {
                var normalizedOrgName = SlugHelper.Normalize(organizationName);
                Console.WriteLine($"🔍 Searching for organization: {organizationName} (normalized: {normalizedOrgName})");
                queryBuilder.AddParameter("REGEXP_REPLACE(LOWER(Organisation.name), '[^a-z0-9]', '', 'g') ILIKE @organisationname", "organisationname", $"%{normalizedOrgName}%", DbTypes.Types.String);
            }

            // Add required WHERE conditions
            queryBuilder.AddParameter("Organisation.isactive", "=", "isactive", true, DbTypes.Types.Boolean);
            queryBuilder.AddParameter("OrganisationLocation.isactive", "=", "locationisactive", true, DbTypes.Types.Boolean);
            queryBuilder.AddParameter("OrganisationLocation.isverified", "=", "locationisverified", true, DbTypes.Types.Boolean);
            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Organisation.id");

            var command = queryBuilder.GetCommand(db);

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    OrganisationDetail temp = new OrganisationDetail();

                    // Organisation Fields
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.organisationname = reader["organisationname"] == DBNull.Value ? "" : reader["organisationname"].ToString();
                    temp.organisationgstnumber = reader["organisationgstnumber"] == DBNull.Value ? "" : reader["organisationgstnumber"].ToString();
                    temp.organisationsecondarytypecode = reader["organisationsecondarytypecode"] == DBNull.Value ? "" : reader["organisationsecondarytypecode"].ToString();
                    temp.organisationsecondarytype = reader["organisationsecondarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationsecondarytype"]);
                    temp.organisationprimarytype = reader["organisationprimarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationprimarytype"]);
                    temp.organisationimageid = reader["organisationimageid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationimageid"]);
                    temp.organisationlogo = reader["organisationlogo"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlogo"]);
                    temp.organisationtagline = reader["organisationtagline"] == DBNull.Value ? "" : reader["organisationtagline"].ToString();
                    temp.organisationprimarytypecode = reader["organisationprimarytypecode"] == DBNull.Value ? "" : reader["organisationprimarytypecode"].ToString();

                    // OrganisationLocation Fields - Full Location Object
                    temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
                    temp.organisationlocationname = reader["organisationlocationname"] == DBNull.Value ? "" : reader["organisationlocationname"].ToString();
                    temp.organisationlocationaddressline1 = reader["organisationlocationaddressline1"] == DBNull.Value ? "" : reader["organisationlocationaddressline1"].ToString();
                    temp.organisationlocationaddressline2 = reader["organisationlocationaddressline2"] == DBNull.Value ? "" : reader["organisationlocationaddressline2"].ToString();
                    temp.organisationlocationcity = reader["organisationlocationcity"] == DBNull.Value ? "" : reader["organisationlocationcity"].ToString();
                    temp.organisationlocationstate = reader["organisationlocationstate"] == DBNull.Value ? "" : reader["organisationlocationstate"].ToString();
                    temp.organisationlocationcountry = reader["organisationlocationcountry"] == DBNull.Value ? "" : reader["organisationlocationcountry"].ToString();
                    temp.organisationlocationlatitude = reader["organisationlocationlatitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["organisationlocationlatitude"]);
                    temp.organisationlocationlongitude = reader["organisationlocationlongitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["organisationlocationlongitude"]);
                    temp.organisationlocationgooglelocation = reader["organisationlocationgooglelocation"] == DBNull.Value ? "" : reader["organisationlocationgooglelocation"].ToString();
                    temp.organisationlocationpincode = reader["organisationlocationpincode"] == DBNull.Value ? "" : reader["organisationlocationpincode"].ToString();

                    result.Add(temp);
                }
            }

            return result;
        }


    }
}
