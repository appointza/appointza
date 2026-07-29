using appointza.Authentication.Services;
using appointza.Models.Campusza;
using appointza.Utils;
using System.Data.Common;
using System.Security.Cryptography;

namespace appointza.Services.Campusza
{
    public class StaffService
    {
        ICampuszaDbProvider dbprovider;
        IDbProvider platformDbProvider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        CustomCryptography cryptography;
        EmailService emailService;
        PlatformUserCredentialService credentialService;
        UserProductProfileService productProfileService;

        public StaffService(
            ICampuszaDbProvider dbprovider,
            IDbProvider platformDbProvider,
            IQueryBuilderProvider querybuilderprovider,
            RequestState requeststate,
            CustomCryptography cryptography,
            EmailService emailService,
            PlatformUserCredentialService credentialService,
            UserProductProfileService productProfileService)
        {
            this.dbprovider = dbprovider;
            this.platformDbProvider = platformDbProvider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.cryptography = cryptography;
            this.emailService = emailService;
            this.credentialService = credentialService;
            this.productProfileService = productProfileService;
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
                SELECT 
                    id, staff_id, first_name, last_name, full_name, email, phone, date_of_birth, gender,
                    address_street, address_city, address_state, address_zip_code, address_country,
                    department, role, subjects, qualification, experience, joining_date, status,
                    photo_url, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                    salary_amount, salary_currency, salary_payment_frequency,
                    organization_id, is_active, created_at, updated_at, created_by, updated_by
                FROM staff
            ";
            
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            
            if (!string.IsNullOrWhiteSpace(req.id))
            {
                queryBuilder.AddParameter("id", "=", "id", req.id, DbTypes.Types.String);
            }
            if (!string.IsNullOrWhiteSpace(req.organizationid))
            {
                queryBuilder.AddParameter("organization_id", "=", "organization_id", req.organizationid, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.department))
            {
                queryBuilder.AddParameter("department", "=", "department", req.department, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.role))
            {
                queryBuilder.AddParameter("role", "=", "role", req.role, DbTypes.Types.String);
            }
            if (!string.IsNullOrEmpty(req.status))
            {
                queryBuilder.AddParameter("status", "=", "status", req.status, DbTypes.Types.String);
            }
            // Always filter by active unless specified otherwise
            queryBuilder.AddParameter("is_active", "=", "is_active", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "id");

            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Staff temp = new Staff();
                    temp.id = reader["staff_id"] == DBNull.Value ? "" : reader["staff_id"].ToString();
                    temp.staffid = reader["staff_id"] == DBNull.Value ? "" : reader["staff_id"].ToString();
                    temp.firstname = reader["first_name"] == DBNull.Value ? "" : reader["first_name"].ToString();
                    temp.lastname = reader["last_name"] == DBNull.Value ? "" : reader["last_name"].ToString();
                    temp.fullname = reader["full_name"] == DBNull.Value ? "" : reader["full_name"].ToString();
                    temp.email = reader["email"] == DBNull.Value ? "" : reader["email"].ToString();
                    temp.phone = reader["phone"] == DBNull.Value ? "" : reader["phone"].ToString();
                    temp.dateofbirth = reader["date_of_birth"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["date_of_birth"]);
                    temp.gender = reader["gender"] == DBNull.Value ? "" : reader["gender"].ToString();
                    
                    temp.addressstreet = reader["address_street"] == DBNull.Value ? "" : reader["address_street"].ToString();
                    temp.addresscity = reader["address_city"] == DBNull.Value ? "" : reader["address_city"].ToString();
                    temp.addressstate = reader["address_state"] == DBNull.Value ? "" : reader["address_state"].ToString();
                    temp.addresszipcode = reader["address_zip_code"] == DBNull.Value ? "" : reader["address_zip_code"].ToString();
                    temp.addresscountry = reader["address_country"] == DBNull.Value ? "" : reader["address_country"].ToString();
                    
                    temp.department = reader["department"] == DBNull.Value ? "" : reader["department"].ToString();
                    temp.role = reader["role"] == DBNull.Value ? "" : reader["role"].ToString();
                    temp.subjects_json = reader["subjects"] == DBNull.Value ? "[]" : reader["subjects"].ToString();
                    temp.qualification = reader["qualification"] == DBNull.Value ? "" : reader["qualification"].ToString();
                    temp.experience = reader["experience"] == DBNull.Value ? 0 : Convert.ToInt32(reader["experience"]);
                    temp.joiningdate = reader["joining_date"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["joining_date"]);
                    temp.status = reader["status"] == DBNull.Value ? "" : reader["status"].ToString();
                    
                    temp.photourl = reader["photo_url"] == DBNull.Value ? "" : reader["photo_url"].ToString();
                    temp.emergencycontactname = reader["emergency_contact_name"] == DBNull.Value ? "" : reader["emergency_contact_name"].ToString();
                    temp.emergencycontactrelationship = reader["emergency_contact_relationship"] == DBNull.Value ? "" : reader["emergency_contact_relationship"].ToString();
                    temp.emergencycontactphone = reader["emergency_contact_phone"] == DBNull.Value ? "" : reader["emergency_contact_phone"].ToString();
                    
                    temp.salaryamount = reader["salary_amount"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["salary_amount"]);
                    temp.salarycurrency = reader["salary_currency"] == DBNull.Value ? "" : reader["salary_currency"].ToString();
                    temp.salarypaymentfrequency = reader["salary_payment_frequency"] == DBNull.Value ? "" : reader["salary_payment_frequency"].ToString();
                    
                    temp.organizationid = reader["organization_id"] == DBNull.Value ? "" : reader["organization_id"].ToString();
                    temp.isactive = reader["is_active"] == DBNull.Value ? false : Convert.ToBoolean(reader["is_active"]);
                    temp.createdat = reader["created_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["created_at"]);
                    temp.updatedat = reader["updated_at"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["updated_at"]);
                    temp.createdby = reader["created_by"] == DBNull.Value ? "" : reader["created_by"].ToString();
                    temp.updatedby = reader["updated_by"] == DBNull.Value ? "" : reader["updated_by"].ToString();

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
                await db.BeginTransaction();
                try
                {
                    await this.InsertTransaction(db, staff);
                    await this.CreateUserForStaffTransaction(db, staff);
                    await db.CommitTransaction();
                }
                catch
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
            return staff;
        }

        public async Task InsertTransaction(IDb db, Staff staff)
        {
            if (string.IsNullOrWhiteSpace(staff.email))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Staff email is required.");

            await EnsureStaffEmailAvailableTransaction(db, staff.email.Trim(), excludeStaffId: null);

            string query = @"
                INSERT INTO staff (
                    id, staff_id, first_name, last_name, full_name, email, phone, date_of_birth, gender,
                    address_street, address_city, address_state, address_zip_code, address_country,
                    department, role, subjects, qualification, experience, joining_date, status,
                    photo_url, emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                    salary_amount, salary_currency, salary_payment_frequency,
                    organization_id, is_active, created_at, updated_at, created_by, updated_by
                )
                VALUES (
                    @id, @staff_id, @first_name, @last_name, @full_name, @email, @phone, @date_of_birth, @gender,
                    @address_street, @address_city, @address_state, @address_zip_code, @address_country,
                    @department, @role, @subjects, @qualification, @experience, @joining_date, @status,
                    @photo_url, @emergency_contact_name, @emergency_contact_relationship, @emergency_contact_phone,
                    @salary_amount, @salary_currency, @salary_payment_frequency,
                    @organization_id, @is_active, @created_at, @updated_at, @created_by, @updated_by
                );
            ";

            if (string.IsNullOrWhiteSpace(staff.organizationid) && requeststate.usercontext?.organisationid > 0)
                staff.organizationid = requeststate.usercontext.organisationid.ToString();
            if (string.IsNullOrWhiteSpace(staff.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            DateTime now = DateTime.UtcNow;
            staff.staffid = string.IsNullOrWhiteSpace(staff.staffid) ? Guid.NewGuid().ToString() : staff.staffid;
            staff.staffid = string.IsNullOrWhiteSpace(staff.staffid) ? GenerateStaffId() : staff.staffid;
            staff.fullname = string.IsNullOrWhiteSpace(staff.fullname)
                ? $"{staff.firstname} {staff.lastname}".Trim()
                : staff.fullname;
            staff.joiningdate = staff.joiningdate == DateTime.MinValue ? now.Date : staff.joiningdate;
            staff.status = string.IsNullOrWhiteSpace(staff.status) ? "active" : staff.status;
            staff.isactive = true;
            staff.createdat = now;
            staff.updatedat = now;
            staff.createdby = ResolveActor();
            staff.updatedby = staff.createdby;
            staff.salarypaymentfrequency = string.IsNullOrWhiteSpace(staff.salarypaymentfrequency)
                ? "monthly"
                : staff.salarypaymentfrequency;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "id", DbTypes.Types.String).Value = staff.staffid;
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = staff.staffid ?? "";
            db.AddParameter(command, "first_name", DbTypes.Types.String).Value = staff.firstname ?? "";
            db.AddParameter(command, "last_name", DbTypes.Types.String).Value = staff.lastname ?? "";
            db.AddParameter(command, "full_name", DbTypes.Types.String).Value = staff.fullname ?? "";
            db.AddParameter(command, "email", DbTypes.Types.String).Value = staff.email ?? "";
            db.AddParameter(command, "phone", DbTypes.Types.String).Value = staff.phone ?? "";
            db.AddParameter(command, "date_of_birth", DbTypes.Types.DateTime).Value =
                staff.dateofbirth == DateTime.MinValue ? DBNull.Value : staff.dateofbirth;
            db.AddParameter(command, "gender", DbTypes.Types.String).Value = staff.gender ?? "";

            db.AddParameter(command, "address_street", DbTypes.Types.String).Value = staff.addressstreet ?? "";
            db.AddParameter(command, "address_city", DbTypes.Types.String).Value = staff.addresscity ?? "";
            db.AddParameter(command, "address_state", DbTypes.Types.String).Value = staff.addressstate ?? "";
            db.AddParameter(command, "address_zip_code", DbTypes.Types.String).Value = staff.addresszipcode ?? "";
            db.AddParameter(command, "address_country", DbTypes.Types.String).Value = staff.addresscountry ?? "";

            db.AddParameter(command, "department", DbTypes.Types.String).Value = staff.department ?? "";
            db.AddParameter(command, "role", DbTypes.Types.String).Value = staff.role ?? "";
            db.AddParameter(command, "subjects", DbTypes.Types.Json).Value = staff.subjects_json ?? "[]";
            db.AddParameter(command, "qualification", DbTypes.Types.String).Value = staff.qualification ?? "";
            db.AddParameter(command, "experience", DbTypes.Types.Integer).Value = staff.experience;
            db.AddParameter(command, "joining_date", DbTypes.Types.DateTime).Value = staff.joiningdate;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = staff.status ?? "";

            db.AddParameter(command, "photo_url", DbTypes.Types.String).Value = staff.photourl ?? "";
            db.AddParameter(command, "emergency_contact_name", DbTypes.Types.String).Value = staff.emergencycontactname ?? "";
            db.AddParameter(command, "emergency_contact_relationship", DbTypes.Types.String).Value = staff.emergencycontactrelationship ?? "";
            db.AddParameter(command, "emergency_contact_phone", DbTypes.Types.String).Value = staff.emergencycontactphone ?? "";

            db.AddParameter(command, "salary_amount", DbTypes.Types.Decimal).Value = staff.salaryamount;
            db.AddParameter(command, "salary_currency", DbTypes.Types.String).Value = staff.salarycurrency ?? "";
            db.AddParameter(command, "salary_payment_frequency", DbTypes.Types.String).Value = staff.salarypaymentfrequency ?? "monthly";

            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = staff.organizationid ?? "";
            db.AddParameter(command, "is_active", DbTypes.Types.Boolean).Value = staff.isactive;
            db.AddParameter(command, "created_at", DbTypes.Types.DateTime).Value = staff.createdat;
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = staff.updatedat;
            db.AddParameter(command, "created_by", DbTypes.Types.String).Value = staff.createdby ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = staff.updatedby ?? "";

            await db.ExecuteNonQuery(command);
        }

        public async Task<Staff> Update(Staff staff)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await db.BeginTransaction();
                try
                {
                    var updated = await this.UpdateTransaction(db, staff);
                    if (updated)
                    {
                        await this.UpdateUserForStaffTransaction(db, staff);
                    }
                    await db.CommitTransaction();
                }
                catch
                {
                    await db.RollbackTransaction();
                    throw;
                }
            }
            return staff;
        }

        public async Task<bool> UpdateTransaction(IDb db, Staff staff)
        {
            bool result = false;
            string query = @"
                UPDATE staff
                SET 
                    staff_id = @staff_id, first_name = @first_name, last_name = @last_name, full_name = @full_name,
                    email = @email, phone = @phone, date_of_birth = @date_of_birth, gender = @gender,
                    address_street = @address_street, address_city = @address_city, address_state = @address_state,
                    address_zip_code = @address_zip_code, address_country = @address_country,
                    department = @department, role = @role, subjects = @subjects, qualification = @qualification, experience = @experience,
                    joining_date = @joining_date, status = @status,
                    photo_url = @photo_url,
                    emergency_contact_name = @emergency_contact_name,
                    emergency_contact_relationship = @emergency_contact_relationship,
                    emergency_contact_phone = @emergency_contact_phone,
                    salary_amount = @salary_amount, salary_currency = @salary_currency, salary_payment_frequency = @salary_payment_frequency,
                    organization_id = @organization_id,
                    updated_by = @updated_by, updated_at = @updated_at
                WHERE id = @id AND is_active = true
            ";

            var command = db.GetCommand(query);

            if (string.IsNullOrWhiteSpace(staff.organizationid) && requeststate.usercontext?.organisationid > 0)
                staff.organizationid = requeststate.usercontext.organisationid.ToString();
            if (string.IsNullOrWhiteSpace(staff.organizationid))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Organization ID is required.");

            if (string.IsNullOrWhiteSpace(staff.email))
                throw new AppException(AppException.ErrorCodes.BadRequest, "Staff email is required.");

            await EnsureStaffEmailAvailableTransaction(db, staff.email.Trim(), staff.staffid ?? staff.id);

            staff.updatedat = DateTime.UtcNow;
            staff.updatedby = ResolveActor();

            db.AddParameter(command, "id", DbTypes.Types.String).Value = staff.staffid ?? "";
            db.AddParameter(command, "staff_id", DbTypes.Types.String).Value = staff.staffid ?? "";
            db.AddParameter(command, "first_name", DbTypes.Types.String).Value = staff.firstname ?? "";
            db.AddParameter(command, "last_name", DbTypes.Types.String).Value = staff.lastname ?? "";
            db.AddParameter(command, "full_name", DbTypes.Types.String).Value = staff.fullname ?? "";
            db.AddParameter(command, "email", DbTypes.Types.String).Value = staff.email ?? "";
            db.AddParameter(command, "phone", DbTypes.Types.String).Value = staff.phone ?? "";
            db.AddParameter(command, "date_of_birth", DbTypes.Types.DateTime).Value =
                staff.dateofbirth == DateTime.MinValue ? DBNull.Value : staff.dateofbirth;
            db.AddParameter(command, "gender", DbTypes.Types.String).Value = staff.gender ?? "";
            
            db.AddParameter(command, "address_street", DbTypes.Types.String).Value = staff.addressstreet ?? "";
            db.AddParameter(command, "address_city", DbTypes.Types.String).Value = staff.addresscity ?? "";
            db.AddParameter(command, "address_state", DbTypes.Types.String).Value = staff.addressstate ?? "";
            db.AddParameter(command, "address_zip_code", DbTypes.Types.String).Value = staff.addresszipcode ?? "";
            db.AddParameter(command, "address_country", DbTypes.Types.String).Value = staff.addresscountry ?? "";

            db.AddParameter(command, "department", DbTypes.Types.String).Value = staff.department ?? "";
            db.AddParameter(command, "role", DbTypes.Types.String).Value = staff.role ?? "";
            db.AddParameter(command, "subjects", DbTypes.Types.Json).Value = staff.subjects_json ?? "[]";
            db.AddParameter(command, "qualification", DbTypes.Types.String).Value = staff.qualification ?? "";
            db.AddParameter(command, "experience", DbTypes.Types.Integer).Value = staff.experience;
            db.AddParameter(command, "joining_date", DbTypes.Types.DateTime).Value = staff.joiningdate;
            db.AddParameter(command, "status", DbTypes.Types.String).Value = staff.status ?? "";
            
            db.AddParameter(command, "photo_url", DbTypes.Types.String).Value = staff.photourl ?? "";
            db.AddParameter(command, "emergency_contact_name", DbTypes.Types.String).Value = staff.emergencycontactname ?? "";
            db.AddParameter(command, "emergency_contact_relationship", DbTypes.Types.String).Value = staff.emergencycontactrelationship ?? "";
            db.AddParameter(command, "emergency_contact_phone", DbTypes.Types.String).Value = staff.emergencycontactphone ?? "";
            
            db.AddParameter(command, "salary_amount", DbTypes.Types.Decimal).Value = staff.salaryamount;
            db.AddParameter(command, "salary_currency", DbTypes.Types.String).Value = staff.salarycurrency ?? "";
            db.AddParameter(command, "salary_payment_frequency", DbTypes.Types.String).Value = staff.salarypaymentfrequency ?? "";
            
            db.AddParameter(command, "organization_id", DbTypes.Types.String).Value = staff.organizationid ?? "";
            
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = staff.updatedby ?? "";
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = staff.updatedat;

            if (await db.ExecuteNonQuery(command) > 0)
                result = true;
            return result;
        }

        public async Task<bool> Delete(StaffDeleteReq req)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, req);
            }
            return result;
        }

        public async Task<bool> DeleteTransaction(IDb db, StaffDeleteReq req)
        {
            bool result = false;
            string query = @"
                UPDATE staff
                SET is_active = false,
                    updated_at = @updated_at,
                    updated_by = @updated_by
                WHERE id = @id AND is_active = true
            ";
            
            var command = db.GetCommand(query);
            db.AddParameter(command, "id", DbTypes.Types.String).Value = req.id ?? "";
            db.AddParameter(command, "updated_by", DbTypes.Types.String).Value = ResolveActor();
            db.AddParameter(command, "updated_at", DbTypes.Types.DateTime).Value = DateTime.UtcNow;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }

        private async Task CreateUserForStaffTransaction(IDb db, Staff staff)
        {
            if (string.IsNullOrWhiteSpace(staff.email))
                return;

            string email = staff.email.Trim();

            using IDb platformDb = await platformDbProvider.GetDb();
            await platformDb.Connect();

            var credential = await credentialService.GetByEmailTransaction(platformDb, email);
            if (credential != null)
            {
                await EnsureCampuszaStaffProfileAsync(platformDb, credential.id, staff);
                return;
            }

            string tempPassword = "abc123";
            string username = BuildUsername(staff);
            string status = MapUserStatus(staff.status);
            string passwordHash = cryptography.CalculateSHA256Hash(tempPassword);

            long platformUserId = await credentialService.InsertForCampuszaAsync(
                platformDb,
                username,
                email,
                staff.phone ?? "",
                passwordHash);

            await productProfileService.InsertTransaction(
                platformDb,
                platformUserId,
                appointza.Models.ProductCodes.Campusza,
                "staff",
                staff.organizationid ?? "",
                staff.staffid ?? "",
                status);

            staff.generatedpassword = tempPassword;
            await SendStaffWelcomeEmailIfConfigured(staff, tempPassword);
        }

        private async Task EnsureCampuszaStaffProfileAsync(IDb platformDb, long platformUserId, Staff staff)
        {
            var existingProfile = await productProfileService.SelectPrimaryForLoginTransaction(
                platformDb, platformUserId, appointza.Models.ProductCodes.Campusza);

            if (existingProfile != null
                && string.Equals(existingProfile.externalorgid, staff.organizationid ?? "", StringComparison.Ordinal)
                && string.Equals(existingProfile.profileid, staff.staffid ?? "", StringComparison.Ordinal))
            {
                return;
            }

            try
            {
                await productProfileService.InsertTransaction(
                    platformDb,
                    platformUserId,
                    appointza.Models.ProductCodes.Campusza,
                    "staff",
                    staff.organizationid ?? "",
                    staff.staffid ?? "",
                    MapUserStatus(staff.status));
            }
            catch
            {
                // Profile may already exist for this org; staff row is still created.
            }
        }

        private static async Task EnsureStaffEmailAvailableTransaction(IDb db, string email, string? excludeStaffId)
        {
            string query = @"
                SELECT staff_id, full_name, organization_id, is_active
                FROM staff
                WHERE lower(email) = lower(@email)
                  AND (@exclude_id = '' OR id <> @exclude_id)
                LIMIT 1;
            ";

            var cmd = db.GetCommand(query);
            db.AddParameter(cmd, "email", DbTypes.Types.String).Value = email;
            db.AddParameter(cmd, "exclude_id", DbTypes.Types.String).Value = excludeStaffId ?? "";

            using DbDataReader reader = await db.Execute(cmd);
            if (!await reader.ReadAsync())
                return;

            string existingName = reader["full_name"]?.ToString() ?? "another staff member";
            string existingStaffId = reader["staff_id"]?.ToString() ?? "";
            bool isActive = reader["is_active"] != DBNull.Value && Convert.ToBoolean(reader["is_active"]);

            string statusHint = isActive ? "already registered" : "already registered (inactive)";
            throw new AppException(
                AppException.ErrorCodes.UsersDuplicate,
                $"Email \"{email}\" is {statusHint} for {existingName} ({existingStaffId}). Use a different email or update the existing staff record.");
        }

        private async Task UpdateUserForStaffTransaction(IDb db, Staff staff)
        {
            if (string.IsNullOrWhiteSpace(staff.staffid) || string.IsNullOrWhiteSpace(staff.email))
                return;

            using IDb platformDb = await platformDbProvider.GetDb();
            await platformDb.Connect();

            var credential = await credentialService.GetByEmailTransaction(platformDb, staff.email.Trim());
            if (credential != null)
            {
                await credentialService.UpdateEmailAndPasswordAsync(
                    platformDb,
                    credential.id,
                    BuildUsername(staff),
                    staff.email.Trim(),
                    credential.passwordhash);
            }

            await productProfileService.UpdateProfileForStaffTransaction(
                platformDb,
                staff.staffid ?? "",
                staff.organizationid ?? "",
                "staff",
                MapUserStatus(staff.status));
        }

        private async Task<bool> UserExistsByEmail(string email)
        {
            return await credentialService.EmailExistsAsync(email);
        }

        private static string MapUserStatus(string staffStatus)
        {
            string normalized = staffStatus?.Trim().ToLowerInvariant() ?? "";
            return normalized switch
            {
                "inactive" => "inactive",
                "suspended" => "suspended",
                _ => "active"
            };
        }

        private static string BuildUsername(Staff staff)
        {
            string first = (staff.firstname ?? "").Trim();
            string last = (staff.lastname ?? "").Trim();
            if (!string.IsNullOrWhiteSpace(first) || !string.IsNullOrWhiteSpace(last))
            {
                string combined = $"{first}.{last}".Trim('.').Replace(" ", "").ToLowerInvariant();
                return string.IsNullOrWhiteSpace(combined) ? "staff" : combined;
            }

            if (!string.IsNullOrWhiteSpace(staff.email))
            {
                string email = staff.email.Trim().ToLowerInvariant();
                int atIndex = email.IndexOf("@", StringComparison.Ordinal);
                return atIndex > 0 ? email.Substring(0, atIndex) : email;
            }

            return "staff";
        }

        private static string GenerateTemporaryPassword(int length = 10)
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
            Span<char> buffer = stackalloc char[length];
            for (int i = 0; i < length; i++)
            {
                int index = RandomNumberGenerator.GetInt32(chars.Length);
                buffer[i] = chars[index];
            }
            return new string(buffer);
        }

        private async Task SendStaffWelcomeEmailIfConfigured(Staff staff, string tempPassword)
        {
            if (emailService == null || !emailService.IsConfigured())
                return;

            string fullName = string.IsNullOrWhiteSpace(staff.fullname)
                ? $"{staff.firstname} {staff.lastname}".Trim()
                : staff.fullname;

            string subject = "Your Appointza Staff Account";
            string htmlBody = $@"
                <div style=""font-family: Arial, sans-serif; font-size: 14px; color: #111;"">
                    <p>Hi {fullName},</p>
                    <p>Your staff account has been created. Use the temporary password below to sign in:</p>
                    <p><strong>Password:</strong> {tempPassword}</p>
                    <p>Please change your password after your first login.</p>
                    <p>Thanks,<br/>Appointza Team</p>
                </div>
            ";
            string textBody = $"Hi {fullName},\n\nYour staff account has been created.\nTemporary password: {tempPassword}\n\nPlease change your password after your first login.\n\nThanks,\nAppointza Team";

            try
            {
                await emailService.SendAsync(staff.email.Trim(), subject, htmlBody, textBody);
            }
            catch
            {
                // Ignore email failures so staff creation can proceed.
            }
        }

        private string ResolveActor()
        {
            var id = requeststate.usercontext?.userid ?? -1;
            return id > 0 ? id.ToString() : "system";
        }

        private string GenerateStaffId()
        {
            return $"STF-{DateTime.UtcNow:yyyyMMddHHmmss}";
        }
    }
}
