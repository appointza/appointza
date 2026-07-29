using appointza.Models;
using appointza.Utils;
using System.Data.Common;
using System.Diagnostics.Metrics;
using System.Reflection;

namespace appointza.Services
{
    public class StaffService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        
        public StaffService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
        }
        public async Task<List<Staff>> Select(StaffSelectReq req)
        {
            List<Staff> result = null;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.SelectTransaction(db, req);
                }
            return result;
        }
        public async Task<List<Staff>> SelectTransaction(IDb db, StaffSelectReq req)
        {
            List<Staff> result = new List<Staff>();
                string query = @"
                SELECT Staff.id,Staff.userid,Staff.organisationid,Staff.roles,Staff.image,Staff.version,Staff.createdby,Staff.createdon,Staff.modifiedby,Staff.modifiedon,Staff.attributes,Staff.isactive,Staff.issuspended,Staff.organisationlocationid,Staff.isfactory,Staff.notes
                FROM Staff
                ";
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
                if (req.id > 0)
                {
                    queryBuilder.AddParameter("Staff.id", "=", "id", req.id, DbTypes.Types.Long);
                }
                if (req.userid > 0)
                {
                    queryBuilder.AddParameter("Staff.userid", "=", "userid", req.userid, DbTypes.Types.Long);
                }
                if (req.organisationid > 0)
                {
                    queryBuilder.AddParameter("Staff.organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
                }
                if (req.organisationlocationid > 0)
                {
                    queryBuilder.AddParameter("Staff.organisationlocationid", "=", "organisationlocationid", req.organisationlocationid, DbTypes.Types.Long);
                }
                queryBuilder.AddParameter("Staff.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

                queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Staff.id");
                var command = queryBuilder.GetCommand(db);
                using (DbDataReader reader = await db.Execute(command))
                {
                    while (await reader.ReadAsync())
                    {
                        Staff temp = new Staff();
                         temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
 temp.userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]);
temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
temp.roles_json = reader["roles"] == DBNull.Value ? "null" : reader["roles"].ToString();
 temp.image = reader["image"] == DBNull.Value ? 0 : Convert.ToInt64(reader["image"]);
 temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
 temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
 temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
 temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
 temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
 temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
 temp.isfactory = reader["isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfactory"]);
temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                        result.Add(temp);
                    }
                }
            return result;
        }
        public async Task<Staff> Insert(Staff staff)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.InsertTransaction(db, staff);
                }
            return staff;
        }
        public async Task InsertTransaction(IDb db, Staff staff)
        {
                String query = @"
                INSERT INTO Staff (
                    userid,organisationid,roles,image,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,organisationlocationid,isfactory,notes
                )
                VALUES (
                   @userid,@organisationid,@roles,@image,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@organisationlocationid,@isfactory,@notes
                )
                RETURNING id;
                ";
                staff.isactive = true;
                staff.version = 1;
                staff.createdon = DateTime.UtcNow;
                staff.createdby = requeststate.usercontext.id;
                staff.modifiedon = DateTime.UtcNow;
                staff.modifiedby = requeststate.usercontext.id;

                using (DbCommand command = db.GetCommand(query))
                {
                    db.AddParameter(command, "userid", DbTypes.Types.Long).Value = staff.userid;
                    db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = staff.organisationid;
                    db.AddParameter(command, "roles", DbTypes.Types.Json).Value = staff.roles_json;
                    db.AddParameter(command, "image", DbTypes.Types.Long).Value = staff.image;
                    db.AddParameter(command, "version", DbTypes.Types.Integer).Value = staff.version;
                    db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = staff.createdby;
                    db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = staff.createdon;
                    db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = staff.modifiedby;
                    db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = staff.modifiedon;
                    db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = staff.attributes_json;
                    db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = staff.isactive;
                    db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = staff.issuspended;
                    db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = staff.organisationlocationid;
                    db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = staff.isfactory;
                    db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(staff.notes) ? "" : staff.notes;
                    
                    using (DbDataReader reader = await db.Execute(command))
                    {
                        if (await reader.ReadAsync())
                        {
                            staff.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                        }
                    }
                }

                // Update user's organisationlocationid to match staff location
                await UpdateUserLocationTransaction(db, staff.userid, staff.organisationlocationid);
            }
        public async Task<Staff> Update(Staff staff)
        {
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    await this.UpdateTransaction(db, staff);
                }
            return staff;
        }
        public async Task<bool> UpdateTransaction(IDb db, Staff staff)
        {
            bool result = false;
                String query = @"
                UPDATE Staff
                    SET 
                        userid = @userid,organisationid = @organisationid,roles = @roles,image = @image,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,organisationlocationid = @organisationlocationid,isfactory = @isfactory,notes = @notes,
                        version = version + 1
                ";
                
                var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

                queryBuilder.AddParameter("id", "=", "id", staff.id, DbTypes.Types.Long);

                if (staff.version > 0)
                {
                    queryBuilder.AddParameter("version", "=", "version", staff.version, DbTypes.Types.Integer);
                }

                var command = queryBuilder.GetCommand(db);
                
                staff.modifiedon = DateTime.UtcNow;
                staff.modifiedby = requeststate.usercontext.id;
                
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = staff.id;
db.AddParameter(command, "userid", DbTypes.Types.Long).Value = staff.userid;
db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = staff.organisationid;
db.AddParameter(command, "roles", DbTypes.Types.Json).Value = staff.roles_json;
db.AddParameter(command, "image", DbTypes.Types.Long).Value = staff.image;
db.AddParameter(command, "version", DbTypes.Types.Integer).Value = staff.version;
db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = staff.modifiedby;
db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = staff.modifiedon;
db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = staff.attributes_json;
db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = staff.issuspended;
db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = staff.organisationlocationid;
db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = staff.isfactory;
db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(staff.notes) ? "" : staff.notes;

                if (await db.ExecuteNonQuery(command) > 0)
                {
                    staff.version = staff.version + 1;
                    result = true;
                    
                    // Update user's organisationlocationid to match staff location
                    await UpdateUserLocationTransaction(db, staff.userid, staff.organisationlocationid);
                }
            return result;
        }
        public async Task<bool> Delete(StaffDeleteReq staff)
        {
             bool result = false;
                using (IDb db = await dbprovider.GetDb())
                {
                    await db.Connect();
                    result = await this.DeleteTransaction(db, staff);
                    
                }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, StaffDeleteReq staff)
        {
            bool result = false;
            
            // First, get the userid from the staff record before deleting
            long userId = 0;
            String getUserQuery = "SELECT userid FROM Staff WHERE id = @id";
            using (DbCommand getUserCommand = db.GetCommand(getUserQuery))
            {
                db.AddParameter(getUserCommand, "id", DbTypes.Types.Long).Value = staff.id;
                using (DbDataReader reader = await db.Execute(getUserCommand))
                {
                    if (await reader.ReadAsync())
                    {
                        userId = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]);
                        Console.WriteLine($"🔍 Found userid {userId} for staff id {staff.id}");
                    }
                }
            }
            
            // Update Staff record to inactive
            String query = @"
                UPDATE Staff
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                WHERE id = @id
            ";
            
            // Add version check if provided
            if (staff.version > 0)
            {
                query += " AND version = @version";
            }
            
            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "id", DbTypes.Types.Long).Value = staff.id;
                db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
                db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                
                if (staff.version > 0)
                {
                    db.AddParameter(command, "version", DbTypes.Types.Integer).Value = staff.version;
                }
                
                if (await db.ExecuteNonQuery(command) > 0)
                {
                    result = true;
                    Console.WriteLine($"✅ Staff record {staff.id} marked as inactive");
                    
                    // Now update the user's locationid to 0
                    if (userId > 0)
                    {
                        String updateUserQuery = @"
                            UPDATE Users 
                            SET locationid = 0,
                                modifiedby = @modifiedby,
                                modifiedon = @modifiedon,
                                version = version + 1
                            WHERE id = @userid
                        ";
                        
                        using (DbCommand updateUserCommand = db.GetCommand(updateUserQuery))
                        {
                            db.AddParameter(updateUserCommand, "userid", DbTypes.Types.Long).Value = userId;
                            db.AddParameter(updateUserCommand, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.id;
                            db.AddParameter(updateUserCommand, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
                            
                            int userUpdateResult = await db.ExecuteNonQuery(updateUserCommand);
                            if (userUpdateResult > 0)
                            {
                                Console.WriteLine($"✅ User {userId} locationid set to 0");
                            }
                            else
                            {
                                Console.WriteLine($"❌ Failed to update user {userId} locationid");
                            }
                        }
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ No userid found for staff {staff.id}, skipping user update");
                    }
                }
            }
            
            return result;
        }


        public async Task<List<staffuser>> SelectStaffDetail(StaffSelectReq req)
        {
            List<staffuser> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectStaffDetailTransaction(db, req);
            }
            return result;
        }
        public async Task<List<staffuser>> SelectStaffDetailTransaction(IDb db, StaffSelectReq req)
        {
            List<staffuser> result = new List<staffuser>();
            string query = @"
                SELECT Staff.id,Staff.userid,Staff.organisationid,Staff.roles,Staff.image,Staff.version,Staff.createdby,
Staff.createdon,Staff.modifiedby,Staff.modifiedon,Staff.attributes,Staff.isactive,Staff.issuspended,
Staff.organisationlocationid,Staff.isfactory,Staff.notes,
 users.name ,
users.email ,
 users.mobile ,
 users.mobilecountrycode ,
 users.designation, 
 organisationlocation.name  locationname, 
 organisationlocation.addressline1 ,
 organisationlocation.addressline2 ,
 organisationlocation.city ,
 organisationlocation.state ,
 organisationlocation.country 
FROM Staff
left join users on users.id = staff.userid
left join organisationlocation on  organisationlocation.id  = staff.organisationlocationid
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            if (req.id > 0)
            {
                queryBuilder.AddParameter("Staff.id", "=", "id", req.id, DbTypes.Types.Long);
            }

            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("Staff.organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }
            if (req.organisationlocationid > 0)
            {
                queryBuilder.AddParameter("Staff.organisationlocationid", "=", "organisationlocationid", req.organisationlocationid, DbTypes.Types.Long);
            }

            queryBuilder.AddParameter("Staff.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Staff.id");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    staffuser temp = new staffuser();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.userid = reader["userid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["userid"]);
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.roles_json = reader["roles"] == DBNull.Value ? "null" : reader["roles"].ToString();
                    temp.image = reader["image"] == DBNull.Value ? 0 : Convert.ToInt64(reader["image"]);
                    temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                    temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                    temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
                    temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
                    temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
                    temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
                    temp.organisationlocationid = reader["organisationlocationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationlocationid"]);
                    temp.isfactory = reader["isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfactory"]);
                    temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();

                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.email = reader["email"] == DBNull.Value ? "" : reader["email"].ToString();
                    temp.mobile = reader["mobile"] == DBNull.Value ? "" : reader["mobile"].ToString();
                    temp.mobilecountrycode = reader["mobilecountrycode"] == DBNull.Value ? "" : reader["mobilecountrycode"].ToString();
                    temp.designation = reader["designation"] == DBNull.Value ? "" : reader["designation"].ToString();
                    
                    temp.locationname = reader["locationname"] == DBNull.Value ? "" : reader["locationname"].ToString();
                    temp.addressline1 = reader["addressline1"] == DBNull.Value ? "" : reader["addressline1"].ToString();
                    temp.addressline2 = reader["addressline2"] == DBNull.Value ? "" : reader["addressline2"].ToString();
                    temp.city = reader["city"] == DBNull.Value ? "" : reader["city"].ToString();
                    temp.state = reader["state"] == DBNull.Value ? "" : reader["state"].ToString();
                    temp.country = reader["country"] == DBNull.Value ? "" : reader["country"].ToString();
                    result.Add(temp);
                }
            }
            return result;
        }

        /// <summary>
        /// Updates the user's organisationlocationid in the Users table
        /// </summary>
        /// <param name="db">Database connection</param>
        /// <param name="userid">User ID to update</param>
        /// <param name="organisationlocationid">New organisation location ID</param>
        /// <returns></returns>
        private async Task UpdateUserLocationTransaction(IDb db, long userid, long organisationlocationid)
        {
            string query = @"
                UPDATE Users 
                SET locationid = @organisationlocationid,
                    modifiedby = @modifiedby,
                    modifiedon = @modifiedon,
                    version = version + 1
                WHERE id = @userid
            ";

            using (DbCommand command = db.GetCommand(query))
            {
                db.AddParameter(command, "userid", DbTypes.Types.Long).Value = userid;
                db.AddParameter(command, "organisationlocationid", DbTypes.Types.Long).Value = organisationlocationid;
                db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.userid;
                db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

                await db.Execute(command);
            }
        }
    }
}
