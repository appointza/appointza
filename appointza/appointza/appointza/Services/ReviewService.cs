using appointza.Models;
using appointza.Utils;
using System.Data.Common;

namespace appointza.Services
{
    public class ReviewService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public ReviewService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        
        public async Task<List<Review>> Select(ReviewSelectReq req)
        {
            List<Review> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }
        
        public async Task<List<Review>> SelectTransaction(IDb db, ReviewSelectReq req)
        {
            List<Review> result = new List<Review>();
            string query = @"
                SELECT reviews.id,reviews.user_id,reviews.organisation_service_id,reviews.event_id,reviews.rating,reviews.comment,reviews.created_at,reviews.updated_at,reviews.isactive
                FROM reviews
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            // Always filter by isactive = TRUE
            queryBuilder.AddParameter("reviews.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            if (req.id > 0 || req.user_id > 0 || req.organisation_service_id.HasValue || req.event_id.HasValue)
            {
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("reviews.id", "=", "id", req.id, DbTypes.Types.Long);
                }
                if (req.user_id > 0)
                {
                    queryBuilder.AddParameter("reviews.user_id", "=", "user_id", req.user_id, DbTypes.Types.Long);
                }
                if (req.organisation_service_id.HasValue && req.organisation_service_id.Value > 0)
                {
                    queryBuilder.AddParameter("reviews.organisation_service_id", "=", "organisation_service_id", req.organisation_service_id.Value, DbTypes.Types.Long);
                }
                if (req.event_id.HasValue && req.event_id.Value > 0)
                {
                    queryBuilder.AddParameter("reviews.event_id", "=", "event_id", req.event_id.Value, DbTypes.Types.Long);
                }
            }

            queryBuilder.AddOrderBy(QueryBuilder.Order.DESC, "reviews.created_at");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Review temp = new Review();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.user_id = reader["user_id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["user_id"]);
                    temp.organisation_service_id = reader["organisation_service_id"] == DBNull.Value ? null : (long?)Convert.ToInt64(reader["organisation_service_id"]);
                    temp.event_id = reader["event_id"] == DBNull.Value ? null : (long?)Convert.ToInt64(reader["event_id"]);
                    temp.rating = reader["rating"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["rating"]);
                    temp.comment = reader["comment"] == DBNull.Value ? "" : reader["comment"].ToString();
                    temp.created_at = reader["created_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["created_at"]);
                    temp.updated_at = reader["updated_at"] == DBNull.Value ? DateTime.UtcNow : Convert.ToDateTime(reader["updated_at"]);
                    temp.isactive = reader["isactive"] == DBNull.Value ? true : Convert.ToBoolean(reader["isactive"]);
                    
                    result.Add(temp);
                }
            }
            return result;
        }
        
        public async Task<Review> Insert(Review review)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, review);
            }
            return review;
        }
        
        public async Task InsertTransaction(IDb db, Review review)
        {
            String query = @"
                INSERT INTO reviews (
                    user_id,organisation_service_id,event_id,rating,comment,created_at,updated_at,isactive
                )
                VALUES (
                   @user_id,@organisation_service_id,@event_id,@rating,@comment,@created_at,@updated_at,@isactive
                )
                RETURNING id;
                ";
            
            review.created_at = DateTime.UtcNow;
            review.updated_at = DateTime.UtcNow;
            review.isactive = true; // Always set to active when creating

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "user_id", DbTypes.Types.Long).Value = review.user_id;
            db.AddParameter(command, "organisation_service_id", DbTypes.Types.Long).Value = review.organisation_service_id.HasValue ? (object)review.organisation_service_id.Value : DBNull.Value;
            db.AddParameter(command, "event_id", DbTypes.Types.Long).Value = review.event_id.HasValue ? (object)review.event_id.Value : DBNull.Value;
            db.AddParameter(command, "rating", DbTypes.Types.Decimal).Value = review.rating;
            db.AddParameter(command, "comment", DbTypes.Types.String).Value = String.IsNullOrEmpty(review.comment) ? "" : review.comment;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = review.created_at;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = review.updated_at;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = review.isactive;
            
            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    review.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
            
            // Update average rating in organisationservices table if review is for a service
            if (review.organisation_service_id.HasValue && review.organisation_service_id.Value > 0)
            {
                await UpdateServiceRating(db, review.organisation_service_id.Value, review.rating);
            }
        }
        
        private async Task UpdateServiceRating(IDb db, long serviceId, decimal? newReviewRating = null)
        {
            try
            {
                // Get current (old) rating from organisationservices table
                string getCurrentRatingQuery = @"
                    SELECT rating
                    FROM organisationservices
                    WHERE id = @service_id
                ";
                
                DbCommand getCurrentCommand = db.GetCommand(getCurrentRatingQuery);
                db.AddParameter(getCurrentCommand, "service_id", DbTypes.Types.Long).Value = serviceId;
                
                decimal? oldRating = null;
                using (DbDataReader reader = await db.Execute(getCurrentCommand))
                {
                    if (await reader.ReadAsync())
                    {
                        oldRating = reader["rating"] == DBNull.Value ? null : (decimal?)Convert.ToDecimal(reader["rating"]);
                    }
                }
                
                // Get all active reviews count and calculate average from active reviews only
                string reviewsQuery = @"
                    SELECT 
                        COUNT(*) as review_count,
                        COALESCE(AVG(rating), 0) as avg_rating,
                        COALESCE(SUM(rating), 0) as total_rating_sum
                    FROM reviews
                    WHERE organisation_service_id = @service_id AND isactive = TRUE
                ";
                
                DbCommand reviewsCommand = db.GetCommand(reviewsQuery);
                db.AddParameter(reviewsCommand, "service_id", DbTypes.Types.Long).Value = serviceId;
                
                int reviewCount = 0;
                decimal averageRating = 0;
                decimal totalRatingSum = 0;
                
                using (DbDataReader reader = await db.Execute(reviewsCommand))
                {
                    if (await reader.ReadAsync())
                    {
                        reviewCount = reader["review_count"] == DBNull.Value ? 0 : Convert.ToInt32(reader["review_count"]);
                        averageRating = reader["avg_rating"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["avg_rating"]);
                        totalRatingSum = reader["total_rating_sum"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["total_rating_sum"]);
                    }
                }
                
                // Round to 2 decimal places for rating (0.00 to 5.00)
                averageRating = Math.Round(averageRating, 2);
                
                Console.WriteLine($"📊 Updating service rating for service ID {serviceId}:");
                Console.WriteLine($"   Old rating in organisationservices: {oldRating?.ToString("F2") ?? "NULL"}");
                if (newReviewRating.HasValue)
                {
                    Console.WriteLine($"   New review rating being added: {newReviewRating.Value:F2}");
                }
                Console.WriteLine($"   Total reviews count: {reviewCount}");
                Console.WriteLine($"   Total rating sum: {totalRatingSum:F2}");
                Console.WriteLine($"   Calculated average (from all reviews): {averageRating:F2}");
                
                // Update the service rating with the calculated average from all reviews
                string updateQuery = @"
                    UPDATE organisationservices
                    SET rating = @rating, modifiedon = @modifiedon, modifiedby = @modifiedby
                    WHERE id = @service_id
                ";
                
                DbCommand updateCommand = db.GetCommand(updateQuery);
                db.AddParameter(updateCommand, "service_id", DbTypes.Types.Long).Value = serviceId;
                db.AddParameter(updateCommand, "rating", DbTypes.Types.Decimal).Value = averageRating;
                db.AddParameter(updateCommand, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                db.AddParameter(updateCommand, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext?.id ?? 0;
                
                int rowsAffected = await db.ExecuteNonQuery(updateCommand);
                
                if (rowsAffected > 0)
                {
                    Console.WriteLine($"✅ Service rating updated: {oldRating?.ToString("F2") ?? "NULL"} → {averageRating:F2}");
                }
                else
                {
                    Console.WriteLine($"⚠️ No rows updated - service ID {serviceId} may not exist");
                }
            }
            catch (Exception ex)
            {
                // Log error but don't fail the review insertion
                Console.WriteLine($"❌ Error updating service rating: {ex.Message}");
                Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
            }
        }
        
        public async Task<Review> Update(Review review)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, review);
            }
            return review;
        }
        
        public async Task<bool> UpdateTransaction(IDb db, Review review)
        {
            bool result = false;
            
            // Get the old review to check if service_id changed
            long? oldServiceId = null;
            string oldQuery = "SELECT organisation_service_id FROM reviews WHERE id = @id";
            DbCommand oldCommand = db.GetCommand(oldQuery);
            db.AddParameter(oldCommand, "id", DbTypes.Types.Long).Value = review.id;
            using (DbDataReader reader = await db.Execute(oldCommand))
            {
                if (await reader.ReadAsync())
                {
                    oldServiceId = reader["organisation_service_id"] == DBNull.Value ? null : (long?)Convert.ToInt64(reader["organisation_service_id"]);
                }
            }
            
            String query = @"
                UPDATE reviews
                    SET 
                        user_id = @user_id,organisation_service_id = @organisation_service_id,event_id = @event_id,rating = @rating,comment = @comment,updated_at = @updated_at,isactive = @isactive
                WHERE id = @id
                ";
            
            review.updated_at = DateTime.UtcNow;
            
            DbCommand command = db.GetCommand(query);
            
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = review.id;
            db.AddParameter(command, "user_id", DbTypes.Types.Long).Value = review.user_id;
            db.AddParameter(command, "organisation_service_id", DbTypes.Types.Long).Value = review.organisation_service_id.HasValue ? (object)review.organisation_service_id.Value : DBNull.Value;
            db.AddParameter(command, "event_id", DbTypes.Types.Long).Value = review.event_id.HasValue ? (object)review.event_id.Value : DBNull.Value;
            db.AddParameter(command, "rating", DbTypes.Types.Decimal).Value = review.rating;
            db.AddParameter(command, "comment", DbTypes.Types.String).Value = String.IsNullOrEmpty(review.comment) ? "" : review.comment;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = review.updated_at;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = review.isactive;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
                
                // Update ratings for both old and new service if changed
                if (oldServiceId.HasValue && oldServiceId.Value > 0)
                {
                    await UpdateServiceRating(db, oldServiceId.Value, null);
                }
                if (review.organisation_service_id.HasValue && review.organisation_service_id.Value > 0)
                {
                    await UpdateServiceRating(db, review.organisation_service_id.Value, review.rating);
                }
            }
            return result;
        }
        
        public async Task<bool> Delete(ReviewDeleteReq review)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, review);
            }
            return result;
        }
        
        public async Task<bool> DeleteTransaction(IDb db, ReviewDeleteReq review)
        {
            bool result = false;
            
            // Get service_id before deleting to update rating
            long? serviceId = null;
            string getServiceQuery = "SELECT organisation_service_id FROM reviews WHERE id = @id";
            DbCommand getServiceCommand = db.GetCommand(getServiceQuery);
            db.AddParameter(getServiceCommand, "id", DbTypes.Types.Long).Value = review.id;
            using (DbDataReader reader = await db.Execute(getServiceCommand))
            {
                if (await reader.ReadAsync())
                {
                    serviceId = reader["organisation_service_id"] == DBNull.Value ? null : (long?)Convert.ToInt64(reader["organisation_service_id"]);
                }
            }
            
            // Soft delete: Set isactive = false instead of deleting
            String query = @"
                UPDATE reviews
                SET isactive = FALSE, updated_at = @updated_at
                WHERE id = @id
                ";
            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = review.id;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            
            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
                
                // Update average rating after soft deletion (only count active reviews)
                if (serviceId.HasValue && serviceId.Value > 0)
                {
                    await UpdateServiceRating(db, serviceId.Value, null);
                }
            }
            return result;
        }
    }
}


