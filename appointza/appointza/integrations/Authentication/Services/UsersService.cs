using Amazon.Util.Internal.PlatformServices;
using appointza.Models;
using appointza.Services;
using appointza.Utils;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using System;
using System.Data.Common;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml.Linq;

namespace appointza.Authentication.Services
{
    public class UsersService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        UserSessionService usersessionservice;
        ApplicationEnvironment applicationenvironment;
    
        OrganisationLocationService organisationlocationservice;
        GoogleGeocodingService googlegeocodingservice;
  
        ILogger<UsersService> logger;
        UserSocketService usersocketservice;
        OrganisationService organisationservice;
        StaffService staffService;
        public UsersService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate, 
            UserSessionService usersessionservice, IOptions<ApplicationEnvironment> applicationenvironment, 
            OrganisationLocationService organisationlocationservice, GoogleGeocodingService googlegeocodingservice,
            ILogger<UsersService> logger, OrganisationService organisationService, StaffService staffservice)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.usersessionservice = usersessionservice;
            this.applicationenvironment = applicationenvironment.Value;
            this.organisationlocationservice = organisationlocationservice;
            this.googlegeocodingservice = googlegeocodingservice;
            this.staffService = staffservice;
           
            this.logger = logger;
            this.organisationservice = organisationService;


        }
        public async Task<List<Users>> Select(UsersSelectReq req)
        {
            List<Users> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }
        public async Task<List<Users>> SelectTransaction(IDb db, UsersSelectReq req)
        {
            List<Users> result = new List<Users>();
            string query = @"
                SELECT Users.id,Users.name,Users.email,Users.mobile,Users.mobilecountrycode,Users.designation,Users.otp,Users.otpexpirationtime,Users.organisationid,Users.locationid,Users.profileimage,Users.version,Users.createdby,Users.createdon,Users.modifiedby,Users.modifiedon,Users.attributes,Users.isactive,Users.issuspended,Users.parentid,Users.isfactory,Users.notes,Users.isverified,Users.accountactive,Users.push_token,Users.webpushnotification,Users.iospushnotification,Users.androidpushnotification
                FROM Users
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            if (req.id > 0)
            {
                queryBuilder.AddParameter("Users.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            if (!String.IsNullOrEmpty(req.email))
            {
                queryBuilder.AddParameter("Users.email", "=", "email", req.email, DbTypes.Types.String);
            }
            if (!String.IsNullOrEmpty(req.mobile))
            {
                queryBuilder.AddParameter("Users.mobile", "=", "mobile", req.mobile, DbTypes.Types.String);
            }
            if (req.organisationid > 0)
            {
                queryBuilder.AddParameter("Users.organisationid", "=", "organisationid", req.organisationid, DbTypes.Types.Long);
            }
            if (req.accountactive.HasValue)
            {
                queryBuilder.AddParameter("Users.accountactive", "=", "accountactive", req.accountactive, DbTypes.Types.Boolean);
            }
            queryBuilder.AddParameter("Users.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Users.id");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Users temp = new Users();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.name = reader["name"] == DBNull.Value ? "" : reader["name"].ToString();
                    temp.email = reader["email"] == DBNull.Value ? "" : reader["email"].ToString();
                    temp.mobile = reader["mobile"] == DBNull.Value ? "" : reader["mobile"].ToString();
                    temp.mobilecountrycode = reader["mobilecountrycode"] == DBNull.Value ? "" : reader["mobilecountrycode"].ToString();
                    temp.designation = reader["designation"] == DBNull.Value ? "" : reader["designation"].ToString();
                    temp.otp = reader["otp"] == DBNull.Value ? "" : reader["otp"].ToString();
                    temp.otpexpirationtime = reader["otpexpirationtime"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["otpexpirationtime"]);
                    temp.organisationid = reader["organisationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["organisationid"]);
                    temp.locationid = reader["locationid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["locationid"]);
                    temp.profileimage = reader["profileimage"] == DBNull.Value ? 0 : Convert.ToInt64(reader["profileimage"]);
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
                    temp.isverified = reader["isverified"] == DBNull.Value ? false : Convert.ToBoolean(reader["isverified"]);
                    temp.accountactive = reader["accountactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["accountactive"]);
                    temp.push_token = reader["push_token"] == DBNull.Value ? "" : reader["push_token"].ToString();
                    temp.webpushnotification = reader["webpushnotification"] == DBNull.Value ? null : reader["webpushnotification"].ToString();
                    temp.iospushnotification = reader["iospushnotification"] == DBNull.Value ? null : reader["iospushnotification"].ToString();
                    temp.androidpushnotification = reader["androidpushnotification"] == DBNull.Value ? null : reader["androidpushnotification"].ToString();
                    result.Add(temp);
                }
            }
            return result;
        }
        public async Task<Users> Insert(Users users)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, users);
            }
            return users;
        }
        public async System.Threading.Tasks.Task InsertTransaction(IDb db, Users users)
        {
            String query = @"
                INSERT INTO Users (
                    name,email,mobile,mobilecountrycode,designation,otp,otpexpirationtime,organisationid,locationid,profileimage,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,parentid,isfactory,notes,isverified,accountactive,push_token,webpushnotification,iospushnotification,androidpushnotification
                )
                VALUES (
                   @name,@email,@mobile,@mobilecountrycode,@designation,@otp,@otpexpirationtime,@organisationid,@locationid,@profileimage,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@parentid,@isfactory,@notes,@isverified,@accountactive,@push_token,@webpushnotification,@iospushnotification,@androidpushnotification
                )
                RETURNING id;
                ";
            users.isactive = true;
            users.isverified = false;
            users.accountactive = false;
            users.version = 1;
            users.createdon = DateTime.UtcNow;
            users.createdby = requeststate.usercontext.userid;
            users.modifiedon = DateTime.UtcNow;
            users.modifiedby = requeststate.usercontext.userid;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "name", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.name) ? "" : users.name;
            db.AddParameter(command, "email", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.email) ? "" : users.email;
            db.AddParameter(command, "mobile", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.mobile) ? "" : users.mobile;
            db.AddParameter(command, "mobilecountrycode", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.mobilecountrycode) ? "" : users.mobilecountrycode;
            db.AddParameter(command, "designation", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.designation) ? "" : users.designation;
            db.AddParameter(command, "otp", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.otp) ? "" : users.otp;
            db.AddParameter(command, "otpexpirationtime", DbTypes.Types.DateTime).Value = users.otpexpirationtime;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = users.organisationid;
            db.AddParameter(command, "locationid", DbTypes.Types.Long).Value = users.locationid;
            db.AddParameter(command, "profileimage", DbTypes.Types.Long).Value = users.profileimage;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = users.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = users.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = users.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = users.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = users.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = users.attributes_json;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = users.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = users.issuspended;
            db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = users.parentid;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = users.isfactory;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.notes) ? "" : users.notes;
            db.AddParameter(command, "isverified", DbTypes.Types.Boolean).Value = users.isverified;
            db.AddParameter(command, "accountactive", DbTypes.Types.Boolean).Value = users.accountactive;
            db.AddParameter(command, "push_token", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.push_token) ? "" : users.push_token;
            db.AddParameter(command, "webpushnotification", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.webpushnotification) ? DBNull.Value : users.webpushnotification;
            db.AddParameter(command, "iospushnotification", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.iospushnotification) ? DBNull.Value : users.iospushnotification;
            db.AddParameter(command, "androidpushnotification", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.androidpushnotification) ? DBNull.Value : users.androidpushnotification;

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    users.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }
        public async Task<Users> Update(Users users)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, users);
            }
            return users;
        }
        public async Task<bool> UpdateTransaction(IDb db, Users users)
        {
            bool result = false;
            String query = @"
                UPDATE Users
                    SET 
                        name = @name,email = @email,mobile = @mobile,mobilecountrycode = @mobilecountrycode,designation = @designation,otp = @otp,otpexpirationtime = @otpexpirationtime,organisationid = @organisationid,locationid = @locationid,profileimage = @profileimage,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,parentid = @parentid,isfactory = @isfactory,notes = @notes,isverified = @isverified,accountactive = @accountactive,push_token = @push_token,webpushnotification = @webpushnotification,iospushnotification = @iospushnotification,androidpushnotification = @androidpushnotification,
                        version = version + 1
                ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            queryBuilder.AddParameter("id", "=", "id", users.id, DbTypes.Types.Long);

            if (users.version > 0)
            {
                queryBuilder.AddParameter("version", "=", "version", users.version, DbTypes.Types.Integer);
            }

            var command = queryBuilder.GetCommand(db);

            users.modifiedon = DateTime.UtcNow;
            users.modifiedby = requeststate.usercontext.userid;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = users.id;
            db.AddParameter(command, "name", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.name) ? "" : users.name;
            db.AddParameter(command, "email", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.email) ? "" : users.email;
            db.AddParameter(command, "mobile", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.mobile) ? "" : users.mobile;
            db.AddParameter(command, "mobilecountrycode", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.mobilecountrycode) ? "" : users.mobilecountrycode;
            db.AddParameter(command, "designation", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.designation) ? "" : users.designation;
            db.AddParameter(command, "otp", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.otp) ? "" : users.otp;
            db.AddParameter(command, "otpexpirationtime", DbTypes.Types.DateTime).Value = users.otpexpirationtime;
            db.AddParameter(command, "organisationid", DbTypes.Types.Long).Value = users.organisationid;
            db.AddParameter(command, "locationid", DbTypes.Types.Long).Value = users.locationid;
            db.AddParameter(command, "profileimage", DbTypes.Types.Long).Value = users.profileimage;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = users.version;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = users.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = users.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = users.attributes_json;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = users.issuspended;
            db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = users.parentid;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = users.isfactory;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.notes) ? "" : users.notes;
            db.AddParameter(command, "isverified", DbTypes.Types.Boolean).Value = users.isverified;
            db.AddParameter(command, "accountactive", DbTypes.Types.Boolean).Value = users.accountactive;
            db.AddParameter(command, "push_token", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.push_token) ? "" : users.push_token;
            db.AddParameter(command, "webpushnotification", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.webpushnotification) ? DBNull.Value : users.webpushnotification;
            db.AddParameter(command, "iospushnotification", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.iospushnotification) ? DBNull.Value : users.iospushnotification;
            db.AddParameter(command, "androidpushnotification", DbTypes.Types.String).Value = String.IsNullOrEmpty(users.androidpushnotification) ? DBNull.Value : users.androidpushnotification;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                users.version = users.version + 1;
                result = true;
            }
            return result;
        }
        public async Task<bool> Delete(UsersDeleteReq users)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, users);

            }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, UsersDeleteReq users)
        {
            bool result = false;
            String query = @"
                UPDATE Users
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("id", "=", "id", users.id, DbTypes.Types.Long);
            if (users.version > 0)
            {
                queryBuilder.AddParameter("version", "=", "version", users.version, DbTypes.Types.Integer);
            }
            DbCommand command = queryBuilder.GetCommand(db);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = users.id;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = users.version;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.userid;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        public async Task<UsersContext> SelectUser(UsersLoginReq req)
        {
            UsersContext result;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                try
                {
                    await db.BeginTransaction();
                    result = await SelectUserTransaction(db, req);
                    await db.CommitTransaction();
                }
                catch (Exception)
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
            return result;
        }

        public async Task<UsersContext> SelectUserTransaction(IDb db, UsersLoginReq req)
        {
            var result = new UsersContext();
            var users = await SelectTransaction(db, new UsersSelectReq
            {
                mobile = req.mobile
            });
            
            if (users == null || users.Count == 0)
            {
                throw new AppException(AppException.ErrorCodes.UsersNotFound);
            }
            
            var user = users.First();
           
            var organisation = new Organisation();
            if (user.organisationid > 0)
            {
                organisation = (await organisationservice.SelectTransaction(db, new OrganisationSelectReq
                {
                    id = user.organisationid
                })).FirstOrDefault();
            }
            
            var organisationlocation = new OrganisationLocation();
            if (user.locationid > 0)
            {
                organisationlocation = (await organisationlocationservice.SelectTransaction(db, new OrganisationLocationSelectReq
                {
                    id = user.locationid
                })).FirstOrDefault();
            }
            var usersession = new UserSession
            {
                userid = user.id,
                code = Guid.NewGuid().ToString(),
                starttime = DateTime.UtcNow,
                endtime = DateTime.UtcNow.AddYears(1),
            };
            await usersessionservice.InsertTransaction(db, usersession);

            result.userid = user.id;
            result.usermobile = user.mobile;
            result.username = user.name;
            result.useremail = user.email;
            result.profileimage = user.profileimage;
            result.userpermission = user.attributes.permission;
            result.organisationid = organisation?.id ?? 0;
            result.organisationname = organisation?.name ?? "";
            result.organisationlocationid = organisationlocation?.id ?? 0;
            result.organisationlocationname = organisationlocation?.name ?? "";
            result.refreshtoken = usersession.code;
            result.accesstoken = GenerateJwtToken(new UserGenerateJwtTokenReq
            {
                userid = user.id,
                usermobile = user.mobile,
                useremail = user.email,
                username = user.name,
                profileimage = user.profileimage,
                permissionhex = PermissionToHex(user.attributes.permission),
                organisationid = organisation?.id ?? 0,
                organisationname = organisation?.name ?? "",
                organisationlocationid = organisationlocation?.id ?? 0,
                organisationlocationname = organisationlocation?.name ?? ""
            });

            return result;
        }

        public async Task<bool> DeleteOrganisationPermananet(Organisationdeletereq users)
        {
            var result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
               result = await this.DeleteOrganisationPermananetTransaction(db, users);
            }
            return result;
        }
        public async Task<bool> DeleteOrganisationPermananetTransaction(IDb db, Organisationdeletereq req)
        {
            var result = false;

            var user = (await SelectTransaction(db, new UsersSelectReq { id = req.userid }))
        .FirstOrDefault();
            if(user.otp == req.otp)
            {
                await organisationservice.DeleteTransaction(db, new OrganisationDeleteReq
                {
                    id = req.organisationid
                });

                await organisationlocationservice.DeleteTransaction(db, new OrganisationLocationDeleteReq
                {
                    orgnaisationid = req.organisationid
                });

                //var user = (await SelectTransaction(db, new UsersSelectReq
                //{
                //    id = req.userid
                //})).FirstOrDefault();

                if (user != null)
                {
                    user.locationid = 0;
                    user.organisationid = 0;
                    await UpdateTransaction(db, user);
                }

                result = true;
                return result;
            }
            else
            {
                throw new AppException(AppException.ErrorCodes.UsersNotFound);
            }
         
        }

        public async Task<bool> Deleteuserpermanent(Organisationdeletereq users)
        {
            var result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteuserpermanentTransaction(db, users);
            }
            return result;
        }
        public async Task<bool> DeleteuserpermanentTransaction(IDb db, Organisationdeletereq req)
        {
            var result = false;

            var user = (await SelectTransaction(db, new UsersSelectReq { id = req.userid }))
           .FirstOrDefault();
            if (user.otp == req.otp)
            {
                await organisationservice.DeleteTransaction(db, new OrganisationDeleteReq
                {
                    id = req.organisationid
                });

                await organisationlocationservice.DeleteTransaction(db, new OrganisationLocationDeleteReq
                {
                    orgnaisationid = req.organisationid
                });

                await DeleteTransaction(db, new UsersDeleteReq
                {
                    id = req.userid
                });

                result = true;
                return result;
            }
            else
            {

                throw new AppException(AppException.ErrorCodes.OtpInvalid);
               
            }

          
        }

        public async Task<bool> UpdatePushToken(long userId, string pushToken, string platform)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.UpdatePushTokenTransaction(db, userId, pushToken, platform);
            }
            return result;
        }

        async Task EnsurePushTokenColumnsTransaction(IDb db)
        {
            string[] statements =
            [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS webpushnotification TEXT",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS iospushnotification TEXT",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS androidpushnotification TEXT",
            ];

            foreach (var sql in statements)
            {
                try
                {
                    DbCommand cmd = db.GetCommand(sql);
                    await db.ExecuteNonQuery(cmd);
                }
                catch
                {
                    // add_platform_push_tokens.sql is authoritative on fresh installs
                }
            }
        }

        public async Task<bool> UpdatePushTokenTransaction(IDb db, long userId, string pushToken, string platform)
        {
            if (userId <= 0)
            {
                throw new ArgumentException("userId is required", nameof(userId));
            }

            await EnsurePushTokenColumnsTransaction(db);

            platform = platform?.ToLower() ?? "android";
            
            string columnName = platform switch
            {
                "web" => "webpushnotification",
                "ios" => "iospushnotification",
                "android" => "androidpushnotification",
                _ => "androidpushnotification"
            };

            var modifiedBy = requeststate.usercontext.userid > 0
                ? requeststate.usercontext.userid
                : userId;
            
            String query = $@"
                UPDATE users
                SET {columnName} = @push_token,
                    push_token = COALESCE(@push_token, push_token),
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby,
                    version = version + 1
                WHERE id = @id
            ";

            DbCommand command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = userId;
            db.AddParameter(command, "push_token", DbTypes.Types.String).Value = String.IsNullOrEmpty(pushToken) ? DBNull.Value : pushToken;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = modifiedBy;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            return await db.ExecuteNonQuery(command) > 0;
        }

        public async Task<UserDetailsWithOrganisationRes> GetUserDetailsWithOrganisation()
        {
            UserDetailsWithOrganisationRes result = new UserDetailsWithOrganisationRes();
            
            if (requeststate.usercontext == null || requeststate.usercontext.userid <= 0)
            {
                return result;
            }

            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.GetUserDetailsWithOrganisationTransaction(db);
            }
            
            return result;
        }

        public async Task<UserDetailsWithOrganisationRes> GetUserDetailsWithOrganisationTransaction(IDb db)
        {
            UserDetailsWithOrganisationRes result = new UserDetailsWithOrganisationRes();
            
            if (requeststate.usercontext == null || requeststate.usercontext.userid <= 0)
            {
                return result;
            }

            UsersSelectReq userReq = new UsersSelectReq();
            userReq.id = requeststate.usercontext.userid;
            List<Users> users = await SelectTransaction(db, userReq);
            
            if (users != null && users.Count > 0)
            {
                result.user = users[0];
                
                if (result.user.organisationid > 0)
                {
                    OrganisationSelectReq orgReq = new OrganisationSelectReq();
                    orgReq.id = result.user.organisationid;
                    List<Organisation> organisations = await organisationservice.SelectTransaction(db, orgReq);
                    
                    if (organisations != null && organisations.Count > 0)
                    {
                        result.organisation = organisations[0];
                    }
                    
                    OrganisationLocationSelectReq locReq = new OrganisationLocationSelectReq();
                    locReq.organisationid = result.user.organisationid;
                    result.locations = await organisationlocationservice.SelectTransaction(db, locReq);
                }
            }
            
            return result;
        }

        // JWT helpers (used by SelectUserTransaction to return an access token)
        public string GenerateJwtToken(UserGenerateJwtTokenReq req)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(applicationenvironment.jwtsecret));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("userid", req.userid.ToString()),
                new Claim("usermobile", req.usermobile ?? string.Empty),
                new Claim("username", req.username ?? string.Empty),
                new Claim("useremail", req.useremail ?? string.Empty),
                new Claim("profileimage", req.profileimage.ToString()),
                new Claim("permissionhex", req.permissionhex ?? string.Empty),
                new Claim("organisationid", req.organisationid.ToString()),
                new Claim("organisationname", req.organisationname ?? string.Empty),
                new Claim("organisationtype", req.organisationtype.ToString()),
                new Claim("organisationlocationid", req.organisationlocationid.ToString()),
                new Claim("organisationlocationname", req.organisationlocationname ?? string.Empty),
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddYears(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string PermissionToHex(UsersPermissionData req)
        {
            // Keep in sync with AuthService.PermissionToHex
            StringBuilder binary = new StringBuilder();
            binary.Append("1");
            binary.Append(req.editandviewDashboard ? "1" : "0");
            binary.Append(req.editandviewAppointments ? "1" : "0");
            binary.Append(req.editandviewEvents ? "1" : "0");
            binary.Append(req.editandviewCreateService ? "1" : "0");
            binary.Append(req.editandviewCreateEvent ? "1" : "0");
            binary.Append(req.editandviewClients ? "1" : "0");
            binary.Append(req.editandviewBusinessHours ? "1" : "0");
            binary.Append(req.editandviewStaffManagement ? "1" : "0");
            binary.Append(req.editandviewLocationManagement ? "1" : "0");
            binary.Append(req.editandviewTemplates ? "1" : "0");
            binary.Append(req.editandviewPaymentSettings ? "1" : "0");
            binary.Append(req.editandviewBusinessvalues ? "1" : "0");
            return BinaryToHex(binary.ToString());
        }

        private string BinaryToHex(string binaryString)
        {
            if (string.IsNullOrEmpty(binaryString))
                throw new ArgumentException("Binary string must not be null or empty.");

            int remainder = binaryString.Length % 4;
            if (remainder != 0)
                binaryString = binaryString.PadLeft(binaryString.Length + (4 - remainder), '0');

            string hexString = "";
            for (int i = 0; i < binaryString.Length; i += 4)
            {
                string nibble = binaryString.Substring(i, 4);
                int decimalValue = Convert.ToInt32(nibble, 2);
                hexString += decimalValue.ToString("X");
            }
            return hexString;
        }
    }
}

