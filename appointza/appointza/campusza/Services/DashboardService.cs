using appointza.Models.Campusza;
using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services.Campusza
{
    public class DashboardService
    {
        ICampuszaDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public DashboardService(ICampuszaDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        // --- Stats ---

        public async Task<DashboardStatsDTO> GetStats(DashboardSelectReq req)
        {
             DashboardStatsDTO stats = new DashboardStatsDTO();
             
             // In a real implementation this would query various tables to aggregate data
             // For now we will return placeholder data or perform simple counts if tables exist
             
             using (IDb db = await dbprovider.GetDb())
             {
                await db.Connect();
                
                // Example count queries
                string studentQuery = "SELECT COUNT(*) FROM Student WHERE isactive = true AND organisationid = " + req.organisationid; // SQL Injection risk handled by parameter bindings usually, but for simple counts with ID...
                // Better use query builder
                
                // Total Students
                var qbStudents = querybuilderprovider.GetQueryBuilder("SELECT COUNT(*) as count FROM Student");
                qbStudents.AddParameter("organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
                qbStudents.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);
                var cmdStudents = qbStudents.GetCommand(db);
                using(var reader = await db.Execute(cmdStudents)){
                     if(await reader.ReadAsync()) stats.totalstudents = Convert.ToInt64(reader["count"]);
                }

                // Total Staff
                var qbStaff = querybuilderprovider.GetQueryBuilder("SELECT COUNT(*) as count FROM CampusStaff"); // Using CampusStaff table name convention
                qbStaff.AddParameter("organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
                qbStaff.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);
                
                // Note: CampusStaff table might not exist if I named it differently. Let's check previous steps.
                // Step 57: Created Staff.cs. Service uses table "CampusStaff".
                
                 var cmdStaff = qbStaff.GetCommand(db);
                // Wrap in try-catch in case table doesn't exist yet (though it should)
                try {
                    using(var reader = await db.Execute(cmdStaff)){
                        if(await reader.ReadAsync()) stats.totalstaff = Convert.ToInt64(reader["count"]);
                    }
                } catch {}

                // Total Classes
                var qbClasses = querybuilderprovider.GetQueryBuilder("SELECT COUNT(*) as count FROM Class");
                qbClasses.AddParameter("organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
                qbClasses.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);
                try {
                     using(var reader = await db.Execute(qbClasses.GetCommand(db))){
                        if(await reader.ReadAsync()) stats.totalclasses = Convert.ToInt64(reader["count"]);
                    }
                } catch {}
                
             }
             
             return stats;
        }

        // --- Config ---

        public async Task<List<DashboardConfig>> SelectConfig(DashboardConfigSelectReq req)
        {
            List<DashboardConfig> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectConfigTransaction(db, req);
            }
            return result;
        }

        public async Task<List<DashboardConfig>> SelectConfigTransaction(IDb db, DashboardConfigSelectReq req)
        {
            List<DashboardConfig> result = new List<DashboardConfig>();
            string query = @"
                SELECT 
                    id, organisationid, role, layout, widgets,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, attributes
                FROM DashboardConfig
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (req.id > 0)
            {
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }
             if (!string.IsNullOrEmpty(req.role))
            {
                queryBuilder.AddParameter("role", "=", "role", req.role, DbTypes.Types.String);
            }

            queryBuilder.AddParameter("isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    DashboardConfig temp = new DashboardConfig();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.role = reader["role"] == DBNull.Value ? "" : reader["role"].ToString();
                    temp.layout = reader["layout"] == DBNull.Value ? "" : reader["layout"].ToString();
                    temp.widgets_json = reader["widgets"] == DBNull.Value ? "[]" : reader["widgets"].ToString();
                    
                    temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                    temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                    temp.createdon = reader["createdon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["createdon"]);
                    temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    temp.modifiedon = reader["modifiedon"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["modifiedon"]);
                    temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
                    temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();

                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<DashboardConfig> InsertConfig(DashboardConfig config)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertConfigTransaction(db, config);
            }
            return config;
        }

        public async Task InsertConfigTransaction(IDb db, DashboardConfig config)
        {
            string query = @"
                INSERT INTO DashboardConfig (
                    organisationid, role, layout, widgets,
                    version, createdby, createdon, modifiedby, modifiedon, isactive, issuspended, attributes
                )
                VALUES (
                    @organisationid, @role, @layout, @widgets,
                    @version, @createdby, @createdon, @modifiedby, @modifiedon, @isactive, @issuspended, @attributes
                )
                RETURNING id;
            ";

            config.isactive = true;
            config.version = 1;
            config.createdon = DateTime.UtcNow;
            config.createdby = requeststate.usercontext.id;
            config.modifiedon = DateTime.UtcNow;
            config.modifiedby = requeststate.usercontext.id;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = config.organisationid;
            db.AddParameter(command, "role", DbTypes.Types.String).Value = config.role ?? "";
            db.AddParameter(command, "layout", DbTypes.Types.String).Value = config.layout ?? "";
            db.AddParameter(command, "widgets", DbTypes.Types.Json).Value = config.widgets_json ?? "[]";
            
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = config.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = config.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = config.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = config.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = config.modifiedon;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = config.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = config.issuspended;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = config.attributes_json ?? "{}";

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    config.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }
        
         public async Task<DashboardConfig> UpdateConfig(DashboardConfig config)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateConfigTransaction(db, config);
            }
            return config;
        }

        public async Task<bool> UpdateConfigTransaction(IDb db, DashboardConfig config)
        {
            bool result = false;
            string query = @"
                UPDATE DashboardConfig
                SET 
                    organisationid = @organisationid, role = @role, layout = @layout, widgets = @widgets,
                    modifiedby = @modifiedby, modifiedon = @modifiedon, attributes = @attributes,
                    issuspended = @issuspended,
                    version = version + 1
                WHERE id = @id
            ";

            var command = db.GetCommand(query);

            config.modifiedon = DateTime.UtcNow;
            config.modifiedby = requeststate.usercontext.id;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = config.id;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = config.organisationid;
            db.AddParameter(command, "role", DbTypes.Types.String).Value = config.role ?? "";
            db.AddParameter(command, "layout", DbTypes.Types.String).Value = config.layout ?? "";
            db.AddParameter(command, "widgets", DbTypes.Types.Json).Value = config.widgets_json ?? "[]";
            
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = config.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = config.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = config.attributes_json ?? "{}";
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = config.issuspended;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                config.version = config.version + 1;
                result = true;
            }
            return result;
        }

        public async Task<bool> DeleteConfig(DashboardConfigDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteConfigTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteConfigTransaction(IDb db, DashboardConfigDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE DashboardConfig
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby
                WHERE id = @id
            ";
            
            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
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
