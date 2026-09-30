using appointza.Models;
using appointza.Models.Hospitality;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class OrganisationSiteService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        readonly OrganisationHospitalityContentService hospitalityContentService;
        readonly OrganisationRoomService organisationRoomService;
        readonly OrganisationServicesService organisationservicesService;
        readonly ReferenceValueService referenceValueService;

        public OrganisationSiteService(
            IDbProvider dbprovider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            OrganisationHospitalityContentService hospitalityContentService,
            OrganisationRoomService organisationRoomService,
            OrganisationServicesService organisationservicesService,
            ReferenceValueService referenceValueService)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.hospitalityContentService = hospitalityContentService;
            this.organisationRoomService = organisationRoomService;
            this.organisationservicesService = organisationservicesService;
            this.referenceValueService = referenceValueService;
        }

        public async Task<List<OrganisationSite>> Select(OrganisationSiteSelectReq req)
        {
            List<OrganisationSite> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<OrganisationSite>> SelectTransaction(IDb db, OrganisationSiteSelectReq req)
        {
            List<OrganisationSite> result = new List<OrganisationSite>();
            string query = @"
                SELECT organisation_sites.id, organisation_sites.organisation_id, organisation_sites.site_html
                FROM organisation_sites
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            if (req.id > 0)
            {
                queryBuilder.AddParameter("organisation_sites.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.organisation_id > 0)
            {
                queryBuilder.AddParameter("organisation_sites.organisation_id", "=", "organisation_id", req.organisation_id, DbTypes.Types.Long);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "organisation_sites.id");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    OrganisationSite temp = new OrganisationSite();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.organisation_id = reader["organisation_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_id"]);
                    temp.site_html = reader["site_html"] == DBNull.Value ? "" : reader["site_html"].ToString();
                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<OrganisationSite> Insert(OrganisationSite organisationsite)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, organisationsite);
            }
            return organisationsite;
        }

        public async System.Threading.Tasks.Task InsertTransaction(IDb db, OrganisationSite organisationsite)
        {
            String query = @"
                INSERT INTO organisation_sites (
                    organisation_id, site_html
                )
                VALUES (
                   @organisation_id, @site_html
                )
                RETURNING id;
                ";

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationsite.organisation_id;
            db.AddParameter(command, "site_html", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationsite.site_html) ? "" : organisationsite.site_html;

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    organisationsite.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<OrganisationSite> Update(OrganisationSite organisationsite)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, organisationsite);
            }
            return organisationsite;
        }

        public async Task<bool> UpdateTransaction(IDb db, OrganisationSite organisationsite)
        {
            bool result = false;
            String query = @"
                UPDATE organisation_sites
                    SET 
                        organisation_id = @organisation_id, site_html = @site_html
                ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            queryBuilder.AddParameter("id", "=", "id", organisationsite.id, DbTypes.Types.Long);

            var command = queryBuilder.GetCommand(db);

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationsite.id;
            db.AddParameter(command, "organisation_id", DbTypes.Types.Long).Value = organisationsite.organisation_id;
            db.AddParameter(command, "site_html", DbTypes.Types.String).Value = String.IsNullOrEmpty(organisationsite.site_html) ? "" : organisationsite.site_html;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(OrganisationSiteDeleteReq organisationsite)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, organisationsite);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, OrganisationSiteDeleteReq organisationsite)
        {
            bool result = false;
            String query = @"
                DELETE FROM organisation_sites
                WHERE id = @id
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("id", "=", "id", organisationsite.id, DbTypes.Types.Long);
            
            DbCommand command = queryBuilder.GetCommand(db);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = organisationsite.id;
            
            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        public async Task<List<Sitedetails>> GetSiteDetails(long organisationlocationid)
        {
            List<Sitedetails> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.GetSiteDetailsTransaction(db, organisationlocationid);
            }
            return result;
        }

                public async Task<List<Sitedetails>> GetSiteDetailsTransaction(IDb db, long organisationlocationid)
        {
            List<Sitedetails> result = new List<Sitedetails>();
            string query = @"
                SELECT 
                  -- OrganisationLocation columns
                  ol.id AS location_id,
                  ol.organisationid,
                  ol.name,
                  ol.addressline1,
                  ol.addressline2,
                  ol.city,
                  ol.state,
                  ol.country,
                  ol.latitude,
                  ol.longitude,
                  ol.googlelocation,
                  ol.pincode,
                  ol.orgloctempid AS location_orgloctempid,
                  ol.images AS location_images,
                  ol.version AS location_version,
                  ol.createdby AS location_createdby,
                  ol.createdon AS location_createdon,
                  ol.modifiedby AS location_modifiedby,
                  ol.modifiedon AS location_modifiedon,
                  ol.attributes AS location_attributes,
                  ol.isactive AS location_isactive,
                  ol.issuspended AS location_issuspended,
                  ol.parentid,
                  ol.isfactory AS location_isfactory,
                  ol.notes AS location_notes,
                  ol.templateid AS templateid,
                  ol.facility_list AS location_facility_list,
                  ol.email AS location_email,
                  ol.whatsapp_mobile AS location_whatsapp_mobile,

                  -- Organisation columns
                  o.id AS organisation_id,
                  o.name AS organisation_name,
                  o.gstnumber,
                  o.secondarytypecode,
                  o.secondarytype,
                  o.primarytype,
                  o.imageid,
                  o.organisationlogo,
                  o.tagline,
                  o.primarytypecode,
                  o.version AS organisation_version,
                  o.createdby AS organisation_createdby,
                  o.createdon AS organisation_createdon,
                  o.modifiedby AS organisation_modifiedby,
                  o.modifiedon AS organisation_modifiedon,
                  o.attributes AS organisation_attributes,
                  o.isactive AS organisation_isactive,
                  o.issuspended AS organisation_issuspended,
                  o.parentid AS organisation_parentid,
                  o.isfactory AS organisation_isfactory,
                  o.notes AS organisation_notes,

                  -- OrganisationServices columns
                  os.id AS service_id,
                  os.prize,
                  os.weekday_price,
                  os.weekend_price,
                  os.is_price_different,
                  os.show_price,
                  os.timetaken,
                  os.servicesids AS servicesids_json,
                  os.Iscombo,
                  os.offerprize,
                  os.Servicename,
                  os.code,
                  os.version AS service_version,
                  os.createdby AS service_createdby,
                  os.createdon AS service_createdon,
                  os.modifiedby AS service_modifiedby,
                  os.modifiedon AS service_modifiedon,
                  os.attributes AS service_attributes,
                  os.isactive AS service_isactive,
                  os.issuspended AS service_issuspended,
                  os.organisationid AS service_organisationid,
                  os.organisationlocationid AS service_organisationlocationid,
                  os.isfactory AS service_isfactory,
                  os.notes AS service_notes,

                  -- OrganisationServiceTiming columns
                  ost.id AS timing_id,
                  ost.organisationid AS timing_organisationid,
                  ost.day_of_week,
                  ost.start_time,
                  ost.end_time,
                  ost.version AS timing_version,
                  ost.createdby AS timing_createdby,
                  ost.createdon AS timing_createdon,
                  ost.modifiedby AS timing_modifiedby,
                  ost.modifiedon AS timing_modifiedon,
                  ost.counter,
                  ost.openbefore,
                  ost.attributes AS timing_attributes,
                  ost.isactive AS timing_isactive,
                  ost.issuspended AS timing_issuspended,
                  ost.organisationlocationid,
                  ost.isfactory AS timing_isfactory,
                  ost.notes AS timing_notes,

                  -- ReferenceValue columns
                  rv.description AS template_html

                FROM OrganisationLocation ol
                LEFT JOIN Organisation o ON o.id = ol.organisationid
                LEFT JOIN OrganisationServices os ON os.organisationid = ol.organisationid
                    AND os.organisationlocationid = ol.id
                    AND os.isactive = TRUE
                LEFT JOIN OrganisationServiceTiming ost ON ost.organisationlocationid = ol.id
                LEFT JOIN ReferenceValue rv ON ol.templateid = rv.id
                WHERE ol.id = @organisationlocationid
                ORDER BY ol.id, os.id, ost.id
                ";

            var command = db.GetCommand(query);
            db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = organisationlocationid;
            
            // Dictionary to group by location ID
            var locationGroups = new Dictionary<long, Sitedetails>();
            
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    long locationId = reader["location_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["location_id"]);
                    
                    // Get or create Sitedetails for this location
                    if (!locationGroups.ContainsKey(locationId))
                    {
                        locationGroups[locationId] = new Sitedetails
                        {
                            locationdetail = new OrganisationLocation
                            {
                                id = locationId,
                                organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]),
                                name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString(),
                                addressline1 = reader["addressline1"] == DBNull.Value ? "" : reader["addressline1"].ToString(),
                                addressline2 = reader["addressline2"] == DBNull.Value ? "" : reader["addressline2"].ToString(),
                                city = reader["city"] == DBNull.Value ? "" : reader["city"].ToString(),
                                state = reader["state"] == DBNull.Value ? "" : reader["state"].ToString(),
                                country = reader["country"] == DBNull.Value ? "" : reader["country"].ToString(),
                                latitude = reader["latitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["latitude"]),
                                longitude = reader["longitude"] == DBNull.Value ? 0 : Convert.ToDouble(reader["longitude"]),
                                googlelocation = reader["googlelocation"] == DBNull.Value ? "" : reader["googlelocation"].ToString(),
                                pincode = reader["pincode"] == DBNull.Value ? "" : reader["pincode"].ToString(),
                                orgloctempid = reader["location_orgloctempid"] == DBNull.Value ? "" : reader["location_orgloctempid"].ToString(),
                                templateid = reader["templateid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["templateid"]),
                                images_json = reader["location_images"] == DBNull.Value ? "[]" : reader["location_images"].ToString(),
                                version = reader["location_version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["location_version"]),
                                createdby = reader["location_createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["location_createdby"]),
                                createdon = reader["location_createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["location_createdon"]),
                                modifiedby = reader["location_modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["location_modifiedby"]),
                                modifiedon = reader["location_modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["location_modifiedon"]),
                                attributes_json = reader["location_attributes"] == DBNull.Value ? "null" : reader["location_attributes"].ToString(),
                                isactive = reader["location_isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["location_isactive"]),
                                issuspended = reader["location_issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["location_issuspended"]),
                                parentid = reader["parentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["parentid"]),
                                isfactory = reader["location_isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["location_isfactory"]),
                                notes = reader["location_notes"] == DBNull.Value ? "" : reader["location_notes"].ToString(),
                                facility_list_json = reader["location_facility_list"] == DBNull.Value ? "[]" : reader["location_facility_list"].ToString(),
                                email = reader["location_email"] == DBNull.Value ? "" : reader["location_email"].ToString(),
                                whatsapp_mobile = reader["location_whatsapp_mobile"] == DBNull.Value ? "" : reader["location_whatsapp_mobile"].ToString()
                            },
                            organisationdetail = null,
                            orgnaisatinservice = new List<OrganisationServices>(),
                            OrganisationServiceTiming = new List<OrganisationServiceTiming>(),
                            facilities = new List<string>(),
                            template_html = reader["template_html"] == DBNull.Value ? "" : reader["template_html"].ToString()
                        };
                    }

                    var sitedetail = locationGroups[locationId];

                    // Set organisation detail if not already set and organisation data exists
                    if (sitedetail.organisationdetail == null && reader["organisation_id"] != DBNull.Value)
                    {
                        sitedetail.organisationdetail = new Organisation
                        {
                            id = Convert.ToInt64(reader["organisation_id"]),
                            name = reader["organisation_name"] == DBNull.Value ? "" : reader["organisation_name"].ToString(),
                            gstnumber = reader["gstnumber"] == DBNull.Value ? "" : reader["gstnumber"].ToString(),
                            secondarytypecode = reader["secondarytypecode"] == DBNull.Value ? "" : reader["secondarytypecode"].ToString(),
                            secondarytype = reader["secondarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["secondarytype"]),
                            primarytype = reader["primarytype"] == DBNull.Value ? 0 : Convert.ToInt64(reader["primarytype"]),
                            imageid = reader["imageid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["imageid"]),
                            organisationlogo = reader["organisationlogo"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlogo"]),
                            tagline = reader["tagline"] == DBNull.Value ? "" : reader["tagline"].ToString(),
                            primarytypecode = reader["primarytypecode"] == DBNull.Value ? "" : reader["primarytypecode"].ToString(),
                            version = reader["organisation_version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["organisation_version"]),
                            createdby = reader["organisation_createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_createdby"]),
                            createdon = reader["organisation_createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["organisation_createdon"]),
                            modifiedby = reader["organisation_modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_modifiedby"]),
                            modifiedon = reader["organisation_modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["organisation_modifiedon"]),
                            attributes_json = reader["organisation_attributes"] == DBNull.Value ? "null" : reader["organisation_attributes"].ToString(),
                            isactive = reader["organisation_isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["organisation_isactive"]),
                            issuspended = reader["organisation_issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["organisation_issuspended"]),
                            parentid = reader["organisation_parentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisation_parentid"]),
                            isfactory = reader["organisation_isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["organisation_isfactory"]),
                            notes = reader["organisation_notes"] == DBNull.Value ? "" : reader["organisation_notes"].ToString()
                        };
                    }

                    // Add OrganisationServices (if not null, isactive = true, and not already added)
                    if (reader["service_id"] != DBNull.Value)
                    {
                        long serviceId = Convert.ToInt64(reader["service_id"]);
                        bool isServiceActive = reader["service_isactive"] != DBNull.Value && Convert.ToBoolean(reader["service_isactive"]);
                        
                        // Only add active services
                        if (isServiceActive && !sitedetail.orgnaisatinservice.Any(s => s.id == serviceId))
                        {
                            // Get price fields
                            long weekdayPrice = reader["weekday_price"] == DBNull.Value ? 0 : Convert.ToInt64(reader["weekday_price"]);
                            long weekendPrice = reader["weekend_price"] == DBNull.Value ? 0 : Convert.ToInt64(reader["weekend_price"]);
                            bool isPriceDifferent = reader["is_price_different"] != DBNull.Value && Convert.ToBoolean(reader["is_price_different"]);
                            bool showPrice = reader["show_price"] == DBNull.Value ? true : Convert.ToBoolean(reader["show_price"]);
                            
                            // Determine current price based on day of week and price difference flag
                            long currentPrice = 0;
                            if (showPrice)
                            {
                                if (isPriceDifferent)
                                {
                                    // Check if today is weekend (Saturday = 6, Sunday = 0)
                                    DayOfWeek today = DateTime.Now.DayOfWeek;
                                    if (today == DayOfWeek.Saturday || today == DayOfWeek.Sunday)
                                    {
                                        currentPrice = weekendPrice;
                                    }
                                    else
                                    {
                                        currentPrice = weekdayPrice;
                                    }
                                }
                                else
                                {
                                    // Same price every day - use weekday_price or fallback to prize
                                    currentPrice = weekdayPrice > 0 ? weekdayPrice : (reader["prize"] == DBNull.Value ? 0 : Convert.ToInt64(reader["prize"]));
                                }
                            }
                            // If show_price is false, currentPrice remains 0
                            
                            sitedetail.orgnaisatinservice.Add(new OrganisationServices
                            {
                                id = serviceId,
                                prize = currentPrice, // Set to calculated price (0 if show_price is false)
                                weekday_price = weekdayPrice,
                                weekend_price = weekendPrice,
                                is_price_different = isPriceDifferent,
                                show_price = showPrice,
                                timetaken = reader["timetaken"] == DBNull.Value ? 0 : Convert.ToInt32(reader["timetaken"]),
                                servicesids_json = reader["servicesids_json"] == DBNull.Value ? "null" : reader["servicesids_json"].ToString(),
                                Iscombo = reader["Iscombo"] == DBNull.Value ? false : Convert.ToBoolean(reader["Iscombo"]),
                                offerprize = reader["offerprize"] == DBNull.Value ? 0 : Convert.ToInt64(reader["offerprize"]),
                                Servicename = reader["Servicename"] == DBNull.Value ? "" : reader["Servicename"].ToString(),
                                code = reader["code"] == DBNull.Value ? "" : reader["code"].ToString(),
                                version = reader["service_version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["service_version"]),
                                createdby = reader["service_createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["service_createdby"]),
                                createdon = reader["service_createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["service_createdon"]),
                                modifiedby = reader["service_modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["service_modifiedby"]),
                                modifiedon = reader["service_modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["service_modifiedon"]),
                                attributes_json = reader["service_attributes"] == DBNull.Value ? "null" : reader["service_attributes"].ToString(),
                                isactive = true, // Already filtered to only active services
                                issuspended = reader["service_issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["service_issuspended"]),
                                organisationid = reader["service_organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["service_organisationid"]),
                                organisationlocationid = reader["service_organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["service_organisationlocationid"]),
                                isfactory = reader["service_isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["service_isfactory"]),
                                notes = reader["service_notes"] == DBNull.Value ? "" : reader["service_notes"].ToString()
                            });
                        }
                    }

                    // Add OrganisationServiceTiming (if not null and not already added)
                    if (reader["timing_id"] != DBNull.Value)
                    {
                        long timingId = Convert.ToInt64(reader["timing_id"]);
                        if (!sitedetail.OrganisationServiceTiming.Any(t => t.id == timingId))
                        {
                            sitedetail.OrganisationServiceTiming.Add(new OrganisationServiceTiming
                            {
                                id = timingId,
                                organisationid = reader["timing_organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["timing_organisationid"]),
                                day_of_week = reader["day_of_week"] == DBNull.Value ? 0 : Convert.ToInt32(reader["day_of_week"]),
                                start_time = reader["start_time"] == DBNull.Value ? TimeSpan.Zero : TimeSpan.Parse(reader["start_time"].ToString()),
                                end_time = reader["end_time"] == DBNull.Value ? TimeSpan.Zero : TimeSpan.Parse(reader["end_time"].ToString()),
                                version = reader["timing_version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["timing_version"]),
                                createdby = reader["timing_createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["timing_createdby"]),
                                createdon = reader["timing_createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["timing_createdon"]),
                                modifiedby = reader["timing_modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["timing_modifiedby"]),
                                modifiedon = reader["timing_modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["timing_modifiedon"]),
                                counter = reader["counter"] == DBNull.Value ? 0 : Convert.ToInt32(reader["counter"]),
                                openbefore = reader["openbefore"] == DBNull.Value ? 0 : Convert.ToInt32(reader["openbefore"]),
                                attributes_json = reader["timing_attributes"] == DBNull.Value ? "null" : reader["timing_attributes"].ToString(),
                                isactive = reader["timing_isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["timing_isactive"]),
                                issuspended = reader["timing_issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["timing_issuspended"]),
                                organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]),
                                isfactory = reader["timing_isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["timing_isfactory"]),
                                notes = reader["timing_notes"] == DBNull.Value ? "" : reader["timing_notes"].ToString()
                            });
                        }
                    }
                }
            }
            
            result = locationGroups.Values.ToList();

            ApplyDisplayPricesToServices(result);

            var templateHtml = result.FirstOrDefault()?.template_html ?? "";
            var loadHospitality = PublicTemplateContentRequirements.RequiresHospitality(templateHtml);
            var loadFacilities = PublicTemplateContentRequirements.RequiresFacilities(templateHtml);

            if (loadHospitality)
            {
                await EnrichHospitalityDataTransaction(db, result);
            }
            else
            {
                foreach (var site in result)
                {
                    site.hospitality_profile = null;
                    site.hospitality_rooms = [];
                }
            }

            if (loadFacilities)
            {
                await EnrichFacilitiesTransaction(db, result);
            }
            else
            {
                foreach (var site in result)
                {
                    site.facilities = [];
                }
            }

            return result;
        }

        static void ApplyDisplayPricesToServices(List<Sitedetails> sites)
        {
            foreach (var site in sites)
            {
                if (site.orgnaisatinservice == null)
                    continue;

                foreach (var service in site.orgnaisatinservice)
                {
                    service.prize = CalculateDisplayPrice(service);
                }
            }
        }

        async Task EnrichFacilitiesTransaction(IDb db, List<Sitedetails> sites)
        {
            foreach (var site in sites)
            {
                site.facilities ??= [];
                site.facilities.Clear();
                var facilityIds = site.locationdetail?.facility_list ?? [];
                if (facilityIds.Count == 0)
                    continue;

                try
                {
                    var labelsById = await referenceValueService.SelectDisplayTextByIdsTransaction(db, facilityIds);
                    foreach (var id in facilityIds)
                    {
                        if (id <= 0)
                            continue;

                        if (!labelsById.TryGetValue(id, out var label) || string.IsNullOrWhiteSpace(label))
                            continue;

                        site.facilities.Add(label);
                    }
                }
                catch
                {
                    // skip unresolved facility ids — matches prior per-id behavior
                }
            }
        }

        static long CalculateDisplayPrice(OrganisationServices service)
        {
            if (!service.show_price)
                return 0;

            if (service.is_price_different)
            {
                var today = DateTime.Now.DayOfWeek;
                return today == DayOfWeek.Saturday || today == DayOfWeek.Sunday
                    ? service.weekend_price
                    : service.weekday_price;
            }

            return service.weekday_price > 0 ? service.weekday_price : service.prize;
        }

        async Task EnrichHospitalityDataTransaction(IDb db, List<Sitedetails> sites)
        {
            foreach (var site in sites)
            {
                var orgId = site.organisationdetail?.id ?? site.locationdetail?.organisationid ?? 0;
                var locId = site.locationdetail?.id ?? 0;
                if (orgId <= 0)
                    continue;

                try
                {
                    site.hospitality_profile = await hospitalityContentService.GetProfileTransaction(db, orgId);
                }
                catch
                {
                    site.hospitality_profile = null;
                }

                if (locId <= 0)
                {
                    site.hospitality_rooms = [];
                    continue;
                }

                try
                {
                    site.hospitality_rooms = await organisationRoomService.SelectTransaction(db, new OrganisationRoomSelectReq
                    {
                        organisation_id = orgId,
                        organisation_location_id = locId,
                    });
                    foreach (var room in site.hospitality_rooms)
                    {
                        room.guest = null;
                        room.booking = null;
                        room.payment = null;
                        room.cleaning_assignment = null;
                    }
                }
                catch
                {
                    site.hospitality_rooms = [];
                }
            }
        }
    }
} 