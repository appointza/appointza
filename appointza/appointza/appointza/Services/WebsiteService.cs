using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class WebsiteService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public WebsiteService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<Website>> Select(WebsiteSelectReq req)
        {
            List<Website> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<Website>> SelectTransaction(IDb db, WebsiteSelectReq req)
        {
            List<Website> result = new List<Website>();
            string query = @"
                SELECT websites.id, websites.user_id, websites.name, websites.type, websites.data, websites.created_at, websites.updated_at, 
                       websites.export_paid, websites.export_payment_date, websites.export_payment_order_id
                FROM websites
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (req.id > 0)
            {
                queryBuilder.AddParameter("websites.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (req.user_id > 0)
            {
                queryBuilder.AddParameter("websites.user_id", "=", "user_id", req.user_id, DbTypes.Types.Long);
            }
            if (!String.IsNullOrEmpty(req.type))
            {
                queryBuilder.AddParameter("websites.type", "=", "type", req.type, DbTypes.Types.String);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "websites.created_at");
            var command = queryBuilder.GetCommand(db);
            
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Website temp = new Website();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.user_id = reader["user_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["user_id"]);
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.type = reader["type"] == DBNull.Value ? "" : reader["type"].ToString();
                    temp.data_json = reader["data"] == DBNull.Value ? "null" : reader["data"].ToString();
                    temp.created_at = reader["created_at"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["created_at"]);
                    temp.updated_at = reader["updated_at"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["updated_at"]);
                    temp.export_paid = reader["export_paid"] != DBNull.Value && Convert.ToBoolean(reader["export_paid"]);
                    temp.export_payment_date = reader["export_payment_date"] == DBNull.Value ? null : Convert.ToDateTime(reader["export_payment_date"]);
                    temp.export_payment_order_id = reader["export_payment_order_id"] == DBNull.Value ? null : reader["export_payment_order_id"].ToString();
                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<Website> Insert(Website website)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, website);
            }
            return website;
        }

        public async Task InsertTransaction(IDb db, Website website)
        {
            String query = @"
                INSERT INTO websites (
                    user_id, name, type, data, created_at, updated_at, export_paid, export_payment_date, export_payment_order_id
                )
                VALUES (
                    @user_id, @name, @type, @data, @created_at, @updated_at, @export_paid, @export_payment_date, @export_payment_order_id
                )
                RETURNING id;
                ";
            
            website.created_at = DateTime.UtcNow;
            website.updated_at = DateTime.UtcNow;
            
            // Set user_id from request state if not provided
            if (website.user_id <= 0 && requeststate.usercontext != null)
            {
                website.user_id = requeststate.usercontext.userid;
            }

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "user_id", DbTypes.Types.Long).Value = website.user_id;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = String.IsNullOrEmpty(website.name) ? "" : website.name;
            db.AddParameter(command, "type", DbTypes.Types.String).Value = String.IsNullOrEmpty(website.type) ? "normal" : website.type;
            db.AddParameter(command, "data", DbTypes.Types.Json).Value = website.data_json;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = website.created_at;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = website.updated_at;
            db.AddParameter(command, "export_paid", DbTypes.Types.Boolean).Value = website.export_paid;
            db.AddParameter(command, "export_payment_date", DbTypes.Types.DateTime).Value = website.export_payment_date ?? (object)DBNull.Value;
            db.AddParameter(command, "export_payment_order_id", DbTypes.Types.String).Value = String.IsNullOrEmpty(website.export_payment_order_id) ? (object)DBNull.Value : website.export_payment_order_id;
            
            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    website.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }

        public async Task<Website> Update(Website website)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, website);
            }
            return website;
        }

        public async Task<bool> UpdateTransaction(IDb db, Website website)
        {
            bool result = false;
            String query = @"
                UPDATE websites
                    SET 
                        name = @name,
                        type = @type,
                        data = @data,
                        updated_at = @updated_at,
                        export_paid = @export_paid,
                        export_payment_date = @export_payment_date,
                        export_payment_order_id = @export_payment_order_id
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("id", "=", "id", website.id, DbTypes.Types.Long);
            
            // Optionally filter by user_id for security
            if (website.user_id > 0)
            {
                queryBuilder.AddParameter("websites.user_id", "=", "user_id", website.user_id, DbTypes.Types.Long);
            }

            var command = queryBuilder.GetCommand(db);
            
            website.updated_at = DateTime.UtcNow;
            
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = website.id;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = String.IsNullOrEmpty(website.name) ? "" : website.name;
            db.AddParameter(command, "type", DbTypes.Types.String).Value = String.IsNullOrEmpty(website.type) ? "normal" : website.type;
            db.AddParameter(command, "data", DbTypes.Types.Json).Value = website.data_json;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = website.updated_at;
            db.AddParameter(command, "export_paid", DbTypes.Types.Boolean).Value = website.export_paid;
            db.AddParameter(command, "export_payment_date", DbTypes.Types.DateTime).Value = website.export_payment_date ?? (object)DBNull.Value;
            db.AddParameter(command, "export_payment_order_id", DbTypes.Types.String).Value = String.IsNullOrEmpty(website.export_payment_order_id) ? (object)DBNull.Value : website.export_payment_order_id;
            
            if (website.user_id > 0)
            {
                db.AddParameter(command, "user_id", DbTypes.Types.Long).Value = website.user_id;
            }

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        public async Task<bool> Delete(WebsiteDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, WebsiteDeleteReq req)
        {
            bool result = false;
            String query = @"
                DELETE FROM websites
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.Long);
            
            // Require user_id for security
            if (req.user_id > 0)
            {
                queryBuilder.AddParameter("websites.user_id", "=", "user_id", req.user_id, DbTypes.Types.Long);
            }

            DbCommand command = queryBuilder.GetCommand(db);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = req.id;
            
            if (req.user_id > 0)
            {
                db.AddParameter(command, "user_id", DbTypes.Types.Long).Value = req.user_id;
            }

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }
    }
}

