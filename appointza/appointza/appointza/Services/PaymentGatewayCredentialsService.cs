using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class PaymentGatewayCredentialsService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;

        public PaymentGatewayCredentialsService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }

        public async Task<List<PaymentGatewayCredentials>> Select(PaymentGatewayCredentialsSelectReq req)
        {
            List<PaymentGatewayCredentials> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<PaymentGatewayCredentials>> SelectTransaction(IDb db, PaymentGatewayCredentialsSelectReq req)
        {
            List<PaymentGatewayCredentials> result = new List<PaymentGatewayCredentials>();
            string query = @"
                SELECT 
                    id, gateway_id, organization_id, gateway_name, 
                    api_key, api_secret, upi_id, webhook_secret, environment, 
                    is_active, created_at, updated_at
                FROM payment_gateway_credentials
                ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            if (req.id.HasValue && req.id.Value > 0)
            {
                queryBuilder.AddParameter("payment_gateway_credentials.id", "=", "id", req.id.Value, DbTypes.Types.Long);
            }

            if (req.gateway_id.HasValue && req.gateway_id.Value > 0)
            {
                queryBuilder.AddParameter("payment_gateway_credentials.gateway_id", "=", "gateway_id", req.gateway_id.Value, DbTypes.Types.Long);
            }

            if (req.organization_id.HasValue && req.organization_id.Value > 0)
            {
                queryBuilder.AddParameter("payment_gateway_credentials.organization_id", "=", "organization_id", req.organization_id.Value, DbTypes.Types.Long);
            }

            if (!string.IsNullOrEmpty(req.gateway_name))
            {
                queryBuilder.AddParameter("payment_gateway_credentials.gateway_name", "=", "gateway_name", req.gateway_name, DbTypes.Types.String);
            }

            if (req.is_active.HasValue)
            {
                queryBuilder.AddParameter("payment_gateway_credentials.is_active", "=", "is_active", req.is_active.Value, DbTypes.Types.Boolean);
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "payment_gateway_credentials.id");
            var command = queryBuilder.GetCommand(db);

            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    PaymentGatewayCredentials temp = new PaymentGatewayCredentials();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.gateway_id = reader["gateway_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["gateway_id"]);
                    temp.organization_id = reader["organization_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organization_id"]);
                    temp.gateway_name = reader["gateway_name"] == DBNull.Value ? "" : reader["gateway_name"].ToString();
                    temp.api_key = reader["api_key"] == DBNull.Value ? "" : reader["api_key"].ToString();
                    temp.api_secret = reader["api_secret"] == DBNull.Value ? "" : reader["api_secret"].ToString();
                    temp.upi_id = reader["upi_id"] == DBNull.Value ? null : reader["upi_id"].ToString();
                    temp.webhook_secret = reader["webhook_secret"] == DBNull.Value ? null : reader["webhook_secret"].ToString();
                    temp.environment = reader["environment"] == DBNull.Value ? "production" : reader["environment"].ToString();
                    temp.is_active = reader["is_active"] == DBNull.Value ? false : Convert.ToBoolean(reader["is_active"]);
                    temp.created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]);
                    temp.updated_at = reader["updated_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["updated_at"]);
                    result.Add(temp);
                }
            }
            return result;
        }

        public async Task<PaymentGatewayCredentials> Insert(PaymentGatewayCredentialsInsertReq req)
        {
            PaymentGatewayCredentials credentials = new PaymentGatewayCredentials();
            credentials.gateway_id = req.gateway_id;
            credentials.organization_id = req.organization_id;
            credentials.gateway_name = req.gateway_name;
            credentials.api_key = req.api_key;
            credentials.api_secret = req.api_secret;
            credentials.upi_id = req.upi_id;
            credentials.webhook_secret = req.webhook_secret;
            credentials.environment = req.environment;
            credentials.is_active = req.is_active;
            credentials.created_at = DateTime.UtcNow;
            credentials.updated_at = DateTime.UtcNow;

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, credentials);
            }
            return credentials;
        }

        public async Task InsertTransaction(IDb db, PaymentGatewayCredentials credentials)
        {
            string query = @"
                INSERT INTO payment_gateway_credentials (
                    gateway_id, organization_id, gateway_name, 
                    api_key, api_secret, upi_id, webhook_secret, environment, 
                    is_active, created_at, updated_at
                )
                VALUES (
                    @gateway_id, @organization_id, @gateway_name, 
                    @api_key, @api_secret, @upi_id, @webhook_secret, @environment, 
                    @is_active, @created_at, @updated_at
                )
                RETURNING id;
                ";

            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "gateway_id", DbTypes.Types.Long).Value = credentials.gateway_id;
                db.AddParameter(command, "organization_id", DbTypes.Types.Long).Value = credentials.organization_id;
                db.AddParameter(command, "gateway_name", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.gateway_name) ? "" : credentials.gateway_name;
                db.AddParameter(command, "api_key", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.api_key) ? "" : credentials.api_key;
                db.AddParameter(command, "api_secret", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.api_secret) ? "" : credentials.api_secret;
                db.AddParameter(command, "upi_id", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.upi_id) ? (object)DBNull.Value : credentials.upi_id;
                db.AddParameter(command, "webhook_secret", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.webhook_secret) ? (object)DBNull.Value : credentials.webhook_secret;
                db.AddParameter(command, "environment", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.environment) ? "production" : credentials.environment;
                db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = credentials.is_active;
                db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = credentials.created_at;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = credentials.updated_at;

                using (DbDataReader reader = await db.Execute(command))
                {
                    if (await reader.ReadAsync())
                    {
                        credentials.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    }
                }
            }
        }

        public async Task<PaymentGatewayCredentials> SetIsActive(PaymentGatewayCredentialsSetActiveReq req)
        {
            return await this.Update(new PaymentGatewayCredentialsUpdateReq
            {
                id = req.id,
                is_active = req.is_active
            });
        }

        public async Task<PaymentGatewayCredentials> Update(PaymentGatewayCredentialsUpdateReq req)
        {
            PaymentGatewayCredentials credentials = new PaymentGatewayCredentials();
            credentials.id = req.id;

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                
                // First, get the existing record
                var existing = await this.SelectTransaction(db, new PaymentGatewayCredentialsSelectReq { id = req.id });
                if (existing == null || existing.Count == 0)
                {
                    throw new Exception("Payment gateway credentials not found");
                }

                var existingCred = existing[0];
                credentials.gateway_id = req.gateway_id ?? existingCred.gateway_id;
                credentials.organization_id = req.organization_id ?? existingCred.organization_id;
                credentials.gateway_name = req.gateway_name ?? existingCred.gateway_name;
                
                // For sensitive fields, preserve existing value if new value is null or empty (to avoid overwriting with masked/empty values)
                credentials.api_key = string.IsNullOrEmpty(req.api_key) ? existingCred.api_key : req.api_key;
                credentials.api_secret = string.IsNullOrEmpty(req.api_secret) ? existingCred.api_secret : req.api_secret;
                credentials.webhook_secret = string.IsNullOrEmpty(req.webhook_secret) ? existingCred.webhook_secret : req.webhook_secret;
                
                credentials.upi_id = req.upi_id ?? existingCred.upi_id;
                credentials.environment = req.environment ?? existingCred.environment;
                credentials.is_active = req.is_active ?? existingCred.is_active;
                credentials.created_at = existingCred.created_at;
                credentials.updated_at = DateTime.UtcNow;

                await this.UpdateTransaction(db, credentials);
            }
            return credentials;
        }

        public async Task UpdateTransaction(IDb db, PaymentGatewayCredentials credentials)
        {
            string query = @"
                UPDATE payment_gateway_credentials
                SET 
                    gateway_id = @gateway_id,
                    organization_id = @organization_id,
                    gateway_name = @gateway_name,
                    api_key = @api_key,
                    api_secret = @api_secret,
                    upi_id = @upi_id,
                    webhook_secret = @webhook_secret,
                    environment = @environment,
                    is_active = @is_active,
                    updated_at = @updated_at
                WHERE id = @id;
                ";

            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = credentials.id;
                db.AddParameter(command, "gateway_id", DbTypes.Types.Long).Value = credentials.gateway_id;
                db.AddParameter(command, "organization_id", DbTypes.Types.Long).Value = credentials.organization_id;
                db.AddParameter(command, "gateway_name", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.gateway_name) ? "" : credentials.gateway_name;
                db.AddParameter(command, "api_key", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.api_key) ? "" : credentials.api_key;
                db.AddParameter(command, "api_secret", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.api_secret) ? "" : credentials.api_secret;
                db.AddParameter(command, "upi_id", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.upi_id) ? (object)DBNull.Value : credentials.upi_id;
                db.AddParameter(command, "webhook_secret", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.webhook_secret) ? (object)DBNull.Value : credentials.webhook_secret;
                db.AddParameter(command, "environment", DbTypes.Types.String).Value = string.IsNullOrEmpty(credentials.environment) ? "production" : credentials.environment;
                db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = credentials.is_active;
                db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = credentials.updated_at;

                await db.ExecuteNonQuery(command);
            }
        }

        public async Task<bool> Delete(long id)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, id);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, long id)
        {
            string query = @"
                DELETE FROM payment_gateway_credentials
                WHERE id = @id;
                ";

            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = id;
                int rowsAffected = await db.ExecuteNonQuery(command);
                return rowsAffected > 0;
            }
        }
    }
}

