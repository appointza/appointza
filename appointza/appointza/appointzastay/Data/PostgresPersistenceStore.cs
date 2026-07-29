using System.Globalization;
using System.Text.Json;
using appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Npgsql;
using NpgsqlTypes;

namespace appointza.Data.AppointzaStay;

public sealed class PostgresPersistenceStore
{
    private readonly string _connectionString;

    public PostgresPersistenceStore(string connectionString) =>
        _connectionString = connectionString;

    public bool HasAnyData()
    {
        using var conn = Open();
        using var cmd = new NpgsqlCommand(
            """
            SELECT
              EXISTS(SELECT 1 FROM organisations LIMIT 1)
              OR EXISTS(SELECT 1 FROM users LIMIT 1)
              OR EXISTS(SELECT 1 FROM rooms LIMIT 1)
              OR EXISTS(SELECT 1 FROM customers LIMIT 1)
              OR EXISTS(SELECT 1 FROM booking_details LIMIT 1)
              OR EXISTS(SELECT 1 FROM organisation_billing LIMIT 1)
              OR EXISTS(SELECT 1 FROM logs LIMIT 1)
            """,
            conn);
        return cmd.ExecuteScalar() is true;
    }

    public AppDataSnapshot Load()
    {
        using var conn = Open();
        var orgs = LoadOrganisations(conn);
        return new AppDataSnapshot
        {
            Users = LoadUsers(conn),
            Organisations = orgs,
            Customers = LoadCustomers(conn),
            BookingDetails = LoadBookings(conn),
            Logs = LoadLogs(conn),
            Rooms = LoadRooms(conn),
            BillingAccounts = LoadBilling(conn),
        };
    }

    public void SaveUsers(IReadOnlyList<User> users) => UpsertUsers(users);
    public void SaveCustomers(IReadOnlyList<Customer> customers) => UpsertCustomers(customers);
    public void SaveRooms(IReadOnlyList<Room> rooms) => UpsertRooms(rooms);
    public void SaveBookings(IReadOnlyList<BookingDetail> bookings) => UpsertBookings(bookings);
    public void SaveLogs(IReadOnlyList<LogEntry> logs) => UpsertLogs(logs);

    public void SaveLog(LogEntry log)
    {
        if (string.IsNullOrWhiteSpace(log.OrganisationId))
            return;
        using var conn = Open();
        UpsertLog(conn, log);
    }

    public void SaveBilling(IReadOnlyList<OrganisationBilling> accounts) => UpsertBilling(accounts);

    public void SaveOrganisations(IReadOnlyList<Organisation> organisations)
    {
        using var conn = Open();
        foreach (var org in organisations)
            UpsertOrganisation(conn, org);
    }

    public void SaveOrganisation(Organisation org)
    {
        using var conn = Open();
        UpsertOrganisation(conn, org);
    }

    /// <summary>Inserts a new organisation and owner in one transaction (circular FK on owner_id / organisation_id).</summary>
    public void RegisterOrganisationWithOwner(Organisation org, User owner)
    {
        using var conn = Open();
        using var tx = conn.BeginTransaction();
        try
        {
            DropOwnerForeignKey(conn, tx);
            UpsertOrganisation(conn, org, tx);
            UpsertUser(conn, owner, tx);
            EnsureOwnerForeignKey(conn, tx);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public void SaveSnapshot(AppDataSnapshot snapshot)
    {
        using var conn = Open();
        using var tx = conn.BeginTransaction();
        try
        {
            DropOwnerForeignKey(conn, tx);
            foreach (var org in snapshot.Organisations)
                UpsertOrganisation(conn, org, tx);
            foreach (var user in snapshot.Users)
                UpsertUser(conn, user, tx);
            foreach (var customer in snapshot.Customers)
                UpsertCustomer(conn, customer, tx);
            foreach (var room in snapshot.Rooms)
            {
                RoomHydrator.StripForPersist(room);
                UpsertRoom(conn, room, tx);
            }
            foreach (var booking in snapshot.BookingDetails)
                UpsertBooking(conn, booking, tx);
            foreach (var billing in snapshot.BillingAccounts)
                UpsertBillingAccount(conn, billing, tx);
            foreach (var log in snapshot.Logs)
                UpsertLog(conn, log, tx);
            EnsureOwnerForeignKey(conn, tx);
            tx.Commit();
        }
        catch
        {
            tx.Rollback();
            throw;
        }
    }

    public void SeedInitialData(AppDataSnapshot snapshot) => SaveSnapshot(snapshot);

    private static void DropOwnerForeignKey(NpgsqlConnection conn, NpgsqlTransaction tx)
    {
        using var cmd = new NpgsqlCommand(
            "ALTER TABLE organisations DROP CONSTRAINT IF EXISTS fk_organisations_owner", conn, tx);
        cmd.ExecuteNonQuery();
    }

    private static void EnsureOwnerForeignKey(NpgsqlConnection conn, NpgsqlTransaction tx)
    {
        using var cmd = new NpgsqlCommand(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_organisations_owner') THEN
                    ALTER TABLE organisations
                        ADD CONSTRAINT fk_organisations_owner
                        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT;
                END IF;
            END $$;
            """, conn, tx);
        cmd.ExecuteNonQuery();
    }

    private NpgsqlConnection Open()
    {
        var conn = new NpgsqlConnection(_connectionString);
        conn.Open();
        return conn;
    }

    private List<User> LoadUsers(NpgsqlConnection conn)
    {
        var users = new List<User>();
        using var cmd = new NpgsqlCommand(
            """
            SELECT id, organisation_id, name, phone, email, password_hash, role, department, status, permissions, created_at, updated_at
            FROM users
            ORDER BY created_at
            """, conn);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            users.Add(new User
            {
                Id = reader.GetString(0),
                OrganisationId = reader.GetString(1),
                Name = reader.GetString(2),
                Phone = reader.GetString(3),
                Email = reader.GetString(4),
                Password = reader.GetString(5),
                Role = ParseEnum<UserRole>(reader.GetString(6)),
                Department = ParseEnum<UserDepartment>(reader.GetString(7)),
                Status = ParseEnum<UserStatus>(reader.GetString(8)),
                Permissions = ReadJson<UserPermissions>(reader, 9) ?? new(),
                CreatedAt = reader.GetDateTime(10),
                UpdatedAt = reader.GetDateTime(11),
            });
        }
        return users;
    }

    private List<Organisation> LoadOrganisations(NpgsqlConnection conn)
    {
        var orgs = new List<Organisation>();
        using var cmd = new NpgsqlCommand("SELECT * FROM organisations ORDER BY created_at", conn);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            orgs.Add(new Organisation
            {
                Id = reader.GetString(reader.GetOrdinal("id")),
                OwnerId = reader.GetString(reader.GetOrdinal("owner_id")),
                Name = reader.GetString(reader.GetOrdinal("name")),
                PropertyType = TryReadEnum(reader, "property_type", PropertyType.hotel),
                BookingType = TryReadEnum(reader, "booking_type", PropertyBookingType.overnight),
                MinimumHours = TryReadInt(reader, "minimum_hours", 2),
                Slug = reader.GetString(reader.GetOrdinal("slug")),
                Tagline = reader.GetString(reader.GetOrdinal("tagline")),
                Description = reader.GetString(reader.GetOrdinal("description")),
                Address = reader.GetString(reader.GetOrdinal("address")),
                City = reader.GetString(reader.GetOrdinal("city")),
                State = reader.GetString(reader.GetOrdinal("state")),
                Country = reader.GetString(reader.GetOrdinal("country")),
                Pincode = TryReadString(reader, "pincode", ""),
                Latitude = reader.IsDBNull(reader.GetOrdinal("latitude")) ? null : reader.GetDecimal(reader.GetOrdinal("latitude")),
                Longitude = reader.IsDBNull(reader.GetOrdinal("longitude")) ? null : reader.GetDecimal(reader.GetOrdinal("longitude")),
                Phone = reader.GetString(reader.GetOrdinal("phone")),
                WhatsApp = reader.GetString(reader.GetOrdinal("whatsapp")),
                Email = reader.GetString(reader.GetOrdinal("email")),
                CheckInTime = ((TimeSpan)reader.GetValue(reader.GetOrdinal("checkin_time"))).ToString(@"hh\:mm"),
                CheckOutTime = ((TimeSpan)reader.GetValue(reader.GetOrdinal("checkout_time"))).ToString(@"hh\:mm"),
                OvernightTimeMode = TryReadString(reader, "overnight_time_mode", "fixed"),
                CancellationPolicy = reader.GetString(reader.GetOrdinal("cancellation_policy")),
                PaymentPolicy = reader.GetString(reader.GetOrdinal("payment_policy")),
                Rules = ReadJson<PropertyRules>(reader, reader.GetOrdinal("rules")) ?? new(),
                Highlights = ReadJson<List<PropertyHighlight>>(reader, reader.GetOrdinal("highlights")) ?? [],
                Amenities = ReadJson<List<PropertyAmenityItem>>(reader, reader.GetOrdinal("amenities")) ?? [],
                Images = ReadJson<List<PropertyImage>>(reader, reader.GetOrdinal("images")) ?? [],
                NearbyPlaces = ReadJson<List<PropertyNearbyPlace>>(reader, reader.GetOrdinal("nearby_places")) ?? [],
                Activities = ReadJson<List<PropertyActivity>>(reader, reader.GetOrdinal("activities")) ?? [],
                Packages = ReadJson<List<PropertyPackage>>(reader, reader.GetOrdinal("packages")) ?? [],
                GuestServices = ReadJson<List<PropertyGuestService>>(reader, reader.GetOrdinal("guest_services")) ?? [],
                Offers = ReadJson<List<PropertyOffer>>(reader, reader.GetOrdinal("offers")) ?? [],
                Reviews = ReadJson<List<PropertyReview>>(reader, reader.GetOrdinal("reviews")) ?? [],
                FoodMenu = ReadJson<List<PropertyFoodItem>>(reader, reader.GetOrdinal("food_menu")) ?? [],
                TravelInfo = ReadJson<List<PropertyTravelRoute>>(reader, reader.GetOrdinal("travel_info")) ?? [],
                Faq = ReadJson<List<PropertyFaqItem>>(reader, reader.GetOrdinal("faq")) ?? [],
                Slots = TryReadJson<List<PropertySlot>>(reader, "slots") ?? [],
                Closures = TryReadJson<List<PropertyClosure>>(reader, "closures") ?? [],
                Weather = ReadJson<PropertyWeatherSettings>(reader, reader.GetOrdinal("weather")) ?? new(),
                ContactInfo = ReadJson<PropertyContactInfo>(reader, reader.GetOrdinal("contact_info")) ?? new(),
                Seo = ReadJson<PropertySeo>(reader, reader.GetOrdinal("seo")) ?? new(),
                Messaging = ReadJson<OrganisationMessagingSettings>(reader, reader.GetOrdinal("messaging")) ?? new(),
                PaymentGateway = TryReadJson<OrganisationPaymentGatewaySettings>(reader, "payment_gateway") ?? new(),
                Onboarding = ReadJson<OrganisationOnboardingState>(reader, reader.GetOrdinal("onboarding")) ?? new(),
                WebsiteUrl = reader.GetString(reader.GetOrdinal("website_url")),
                Subdomain = reader.GetString(reader.GetOrdinal("subdomain")),
                ReferralCode = TryReadString(reader, "referral_code", ""),
                ReferredByOrganisationId = reader.IsDBNull(reader.GetOrdinal("referred_by_organisation_id")) ? null : reader.GetString(reader.GetOrdinal("referred_by_organisation_id")),
                IsVerified = TryReadBool(reader, "is_verified", false),
                VerifiedAt = TryReadDateTime(reader, "verified_at"),
                VerifiedByUserId = TryReadNullableString(reader, "verified_by_user_id"),
                LogoAssetId = reader.IsDBNull(reader.GetOrdinal("logo_asset_id")) ? null : reader.GetString(reader.GetOrdinal("logo_asset_id")),
                Website = ReadJson<SitePage>(reader, reader.GetOrdinal("website")) ?? new(),
                CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at")),
                UpdatedAt = reader.GetDateTime(reader.GetOrdinal("updated_at")),
            });
        }
        reader.Close();

        foreach (var org in orgs)
            org.Assets = LoadAssets(conn, org.Id);

        return orgs;
    }

    private static List<OrganizationAsset> LoadAssets(NpgsqlConnection conn, string organisationId)
    {
        var assets = new List<OrganizationAsset>();
        using var cmd = new NpgsqlCommand(
            """
            SELECT id, title, kind, category, url, file_name, mime_type, notes, created_at, updated_at
            FROM organisation_assets WHERE organisation_id = @org ORDER BY created_at
            """, conn);
        cmd.Parameters.AddWithValue("org", organisationId);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            assets.Add(new OrganizationAsset
            {
                Id = reader.GetString(0),
                Title = reader.GetString(1),
                Kind = ParseEnum<AssetKind>(reader.GetString(2)),
                Category = ParseEnum<AssetCategory>(reader.GetString(3)),
                Url = reader.GetString(4),
                FileName = reader.IsDBNull(5) ? null : reader.GetString(5),
                MimeType = reader.IsDBNull(6) ? null : reader.GetString(6),
                Notes = reader.IsDBNull(7) ? null : reader.GetString(7),
                CreatedAt = reader.GetDateTime(8),
                UpdatedAt = reader.GetDateTime(9),
            });
        }
        return assets;
    }

    private List<Customer> LoadCustomers(NpgsqlConnection conn)
    {
        var items = new List<Customer>();
        using var cmd = new NpgsqlCommand(
            "SELECT id, organisation_id, name, phone, email, user_account_id, created_at, updated_at FROM customers ORDER BY created_at", conn);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            items.Add(new Customer
            {
                Id = reader.GetString(0),
                OrganisationId = reader.GetString(1),
                Name = reader.GetString(2),
                Phone = reader.GetString(3),
                Email = reader.IsDBNull(4) ? null : reader.GetString(4),
                UserAccountId = reader.IsDBNull(5) ? null : reader.GetString(5),
                CreatedAt = reader.GetDateTime(6),
                UpdatedAt = reader.GetDateTime(7),
            });
        }
        return items;
    }

    private List<Room> LoadRooms(NpgsqlConnection conn)
    {
        var rooms = new List<Room>();
        using var cmd = new NpgsqlCommand(
            """
            SELECT id, organisation_id, room_number, room_name, room_type, floor_number, building_wing, status,
                   capacity, pricing, amenities, main_photo, gallery_photos, room_video, booking_rules, cleaning_assignment,
                   created_at, updated_at
            FROM rooms ORDER BY floor_number, room_number
            """, conn);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            rooms.Add(new Room
            {
                Id = reader.GetString(0),
                OrganisationId = reader.GetString(1),
                RoomNumber = reader.GetString(2),
                RoomName = reader.GetString(3),
                RoomType = ParseEnum<RoomType>(reader.GetString(4)),
                FloorNumber = reader.GetInt32(5),
                BuildingWing = reader.GetString(6),
                Status = ParseEnum<RoomStatus>(reader.GetString(7)),
                Capacity = ReadJson<RoomCapacity>(reader, 8) ?? new(),
                Pricing = ReadJson<RoomPricing>(reader, 9) ?? new(),
                Amenities = ReadJson<List<string>>(reader, 10) ?? [],
                MainPhoto = reader.GetString(11),
                GalleryPhotos = ReadJson<List<string>>(reader, 12) ?? [],
                RoomVideo = reader.GetString(13),
                BookingRules = ReadJson<RoomBookingRules>(reader, 14) ?? new(),
                CleaningAssignment = ReadJson<CleaningAssignment>(reader, 15),
                CreatedAt = reader.GetDateTime(16),
                UpdatedAt = reader.GetDateTime(17),
            });
        }
        return rooms;
    }

    private List<BookingDetail> LoadBookings(NpgsqlConnection conn)
    {
        var items = new List<BookingDetail>();
        using var cmd = new NpgsqlCommand(
            """
            SELECT id, organisation_id, customer_id, room_id, booking_code, check_in, check_out,
                   check_in_time, check_out_time, nights,
                   persons, extra_beds, total_amount, paid_amount, balance_amount, status, guest_services, packages,
                   created_at, updated_at, payment_reference, razorpay_order_id, booking_type, duration, hours
            FROM booking_details ORDER BY check_in DESC
            """, conn);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            var nights = reader.GetInt32(9);
            var bookingType = reader.FieldCount > 22 && !reader.IsDBNull(22)
                ? reader.GetString(22)
                : "overnight";
            var duration = reader.FieldCount > 23 && !reader.IsDBNull(23) ? reader.GetInt32(23) : 0;
            var hours = reader.FieldCount > 24 && !reader.IsDBNull(24) ? reader.GetInt32(24) : 0;
            if (duration <= 0)
                duration = string.Equals(bookingType, "hourly", StringComparison.OrdinalIgnoreCase) ? hours : nights;
            items.Add(new BookingDetail
            {
                Id = reader.GetString(0),
                OrganisationId = reader.GetString(1),
                CustomerId = reader.GetString(2),
                RoomId = reader.IsDBNull(3) ? "" : reader.GetString(3),
                BookingCode = reader.GetString(4),
                CheckIn = reader.GetDateTime(5).ToString("yyyy-MM-dd"),
                CheckOut = reader.GetDateTime(6).ToString("yyyy-MM-dd"),
                CheckInTime = reader.IsDBNull(7) ? "14:00" : reader.GetString(7),
                CheckOutTime = reader.IsDBNull(8) ? "11:00" : reader.GetString(8),
                Nights = nights,
                Persons = reader.IsDBNull(10) ? 2 : reader.GetInt32(10),
                ExtraBeds = reader.IsDBNull(11) ? 0 : reader.GetInt32(11),
                Total = reader.GetDecimal(12),
                Paid = reader.GetDecimal(13),
                Balance = reader.GetDecimal(14),
                Status = ParseEnum<BookingDetailStatus>(reader.GetString(15)),
                GuestServices = ReadJson<List<BookingGuestServiceLine>>(reader, 16) ?? [],
                Packages = ReadJson<List<BookingPackageLine>>(reader, 17) ?? [],
                CreatedAt = reader.GetDateTime(18),
                UpdatedAt = reader.GetDateTime(19),
                PaymentReference = reader.FieldCount > 20 && !reader.IsDBNull(20) ? reader.GetString(20) : "",
                RazorpayOrderId = reader.FieldCount > 21 && !reader.IsDBNull(21) ? reader.GetString(21) : "",
                BookingType = bookingType,
                Duration = duration,
                Hours = hours,
            });
        }
        return items;
    }

    private List<LogEntry> LoadLogs(NpgsqlConnection conn)
    {
        var items = new List<LogEntry>();
        using var cmd = new NpgsqlCommand(
            "SELECT id, organisation_id, user_id, action, entity_type, entity_id, message, created_at FROM logs ORDER BY created_at DESC LIMIT 500", conn);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            items.Add(new LogEntry
            {
                Id = reader.GetString(0),
                OrganisationId = reader.GetString(1),
                UserId = reader.IsDBNull(2) ? null : reader.GetString(2),
                Action = reader.GetString(3),
                EntityType = reader.GetString(4),
                EntityId = reader.IsDBNull(5) ? null : reader.GetString(5),
                Message = reader.GetString(6),
                CreatedAt = reader.GetDateTime(7),
            });
        }
        return items;
    }

    private List<OrganisationBilling> LoadBilling(NpgsqlConnection conn)
    {
        var accounts = new List<OrganisationBilling>();
        using var cmd = new NpgsqlCommand(
            """
            SELECT organisation_id, plan_id, booking_credits, plan_started_at, plan_renews_at,
                   billing_mode, wallet_credit_balance, wallet_free_used_month, wallet_free_month_key, credits_per_booking
            FROM organisation_billing
            """, conn);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            accounts.Add(new OrganisationBilling
            {
                OrganisationId = reader.GetString(0),
                PlanId = reader.GetString(1),
                BookingCredits = reader.GetInt32(2),
                PlanStartedAt = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                PlanRenewsAt = reader.IsDBNull(4) ? null : reader.GetDateTime(4),
                BillingMode = ParseBillingMode(reader.IsDBNull(5) ? null : reader.GetString(5)),
                WalletCreditBalance = reader.IsDBNull(6) ? 0 : reader.GetInt32(6),
                WalletFreeBookingsUsedThisMonth = reader.IsDBNull(7) ? 0 : reader.GetInt32(7),
                WalletFreeMonthKey = reader.IsDBNull(8) ? "" : reader.GetString(8),
                CreditsPerBooking = reader.IsDBNull(9) ? 1 : reader.GetInt32(9),
            });
        }
        reader.Close();

        foreach (var account in accounts)
            account.Transactions = LoadCreditTransactions(conn, account.OrganisationId);

        return accounts;
    }

    private static List<CreditTransaction> LoadCreditTransactions(NpgsqlConnection conn, string organisationId)
    {
        var items = new List<CreditTransaction>();
        using var cmd = new NpgsqlCommand(
            "SELECT id, type, amount, description, created_at FROM credit_transactions WHERE organisation_id = @org ORDER BY created_at DESC",
            conn);
        cmd.Parameters.AddWithValue("org", organisationId);
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            items.Add(new CreditTransaction
            {
                Id = reader.GetString(0),
                Type = ParseEnum<CreditType>(reader.GetString(1)),
                Amount = reader.GetInt32(2),
                Description = reader.GetString(3),
                CreatedAt = reader.GetDateTime(4),
            });
        }
        return items;
    }

    private void UpsertUsers(IReadOnlyList<User> users)
    {
        using var conn = Open();
        using var tx = conn.BeginTransaction();
        DeleteExcept(conn, tx, "users", users.Select(u => u.Id));
        foreach (var user in users)
            UpsertUser(conn, user, tx);
        tx.Commit();
    }

    private void UpsertUser(NpgsqlConnection conn, User user, NpgsqlTransaction? tx = null)
    {
        using var cmd = new NpgsqlCommand(
            """
            INSERT INTO users (id, organisation_id, name, phone, email, password_hash, role, department, status, permissions, created_at, updated_at)
            VALUES (@id, @org, @name, @phone, @email, @password, @role, @department, @status, @permissions, @created, @updated)
            ON CONFLICT (id) DO UPDATE SET
                organisation_id = EXCLUDED.organisation_id, name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email,
                password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, department = EXCLUDED.department,
                status = EXCLUDED.status, permissions = EXCLUDED.permissions, updated_at = EXCLUDED.updated_at
            """, conn, tx);
        AddUserParams(cmd, user);
        cmd.ExecuteNonQuery();
    }

    private void UpsertOrganisation(NpgsqlConnection conn, Organisation org, NpgsqlTransaction? tx = null)
    {
        using var cmd = new NpgsqlCommand(
            """
            INSERT INTO organisations (
                id, owner_id, name, property_type, booking_type, minimum_hours, overnight_time_mode, slug, tagline, description, address, city, state, country, pincode, latitude, longitude,
                phone, whatsapp, email, checkin_time, checkout_time, cancellation_policy, payment_policy,
                rules, highlights, amenities, images, nearby_places, activities, packages, guest_services, offers, reviews,
                food_menu, travel_info, faq, slots, closures, weather, contact_info, seo, messaging, payment_gateway, onboarding,
                website_url, subdomain, referral_code, referred_by_organisation_id, is_verified, verified_at, verified_by_user_id,
                logo_asset_id, website, created_at, updated_at
            ) VALUES (
                @id, @owner, @name, @propertyType, @bookingType, @minimumHours, @overnightTimeMode, @slug, @tagline, @description, @address, @city, @state, @country, @pincode, @lat, @lng,
                @phone, @whatsapp, @email, @checkin, @checkout, @cancel, @payment,
                @rules, @highlights, @amenities, @images, @nearby, @activities, @packages, @guest_services, @offers, @reviews,
                @food, @travel, @faq, @slots, @closures, @weather, @contact, @seo, @messaging, @payment_gateway, @onboarding,
                @website_url, @subdomain, @referral_code, @referred_by_organisation_id, @is_verified, @verified_at, @verified_by_user_id,
                @logo, @website, @created, @updated
            )
            ON CONFLICT (id) DO UPDATE SET
                owner_id = EXCLUDED.owner_id, name = EXCLUDED.name,
                property_type = EXCLUDED.property_type, booking_type = EXCLUDED.booking_type, minimum_hours = EXCLUDED.minimum_hours,
                overnight_time_mode = EXCLUDED.overnight_time_mode,
                slug = EXCLUDED.slug, tagline = EXCLUDED.tagline,
                description = EXCLUDED.description, address = EXCLUDED.address, city = EXCLUDED.city, state = EXCLUDED.state,
                country = EXCLUDED.country, pincode = EXCLUDED.pincode, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
                phone = EXCLUDED.phone, whatsapp = EXCLUDED.whatsapp, email = EXCLUDED.email,
                checkin_time = EXCLUDED.checkin_time, checkout_time = EXCLUDED.checkout_time,
                cancellation_policy = EXCLUDED.cancellation_policy, payment_policy = EXCLUDED.payment_policy,
                rules = EXCLUDED.rules, highlights = EXCLUDED.highlights, amenities = EXCLUDED.amenities,
                images = EXCLUDED.images, nearby_places = EXCLUDED.nearby_places, activities = EXCLUDED.activities,
                packages = EXCLUDED.packages, guest_services = EXCLUDED.guest_services, offers = EXCLUDED.offers, reviews = EXCLUDED.reviews,
                food_menu = EXCLUDED.food_menu, travel_info = EXCLUDED.travel_info, faq = EXCLUDED.faq,
                slots = EXCLUDED.slots, closures = EXCLUDED.closures,
                weather = EXCLUDED.weather, contact_info = EXCLUDED.contact_info, seo = EXCLUDED.seo,
                messaging = EXCLUDED.messaging, payment_gateway = EXCLUDED.payment_gateway, onboarding = EXCLUDED.onboarding,
                website_url = EXCLUDED.website_url, subdomain = EXCLUDED.subdomain,
                referral_code = EXCLUDED.referral_code, referred_by_organisation_id = EXCLUDED.referred_by_organisation_id,
                is_verified = EXCLUDED.is_verified, verified_at = EXCLUDED.verified_at, verified_by_user_id = EXCLUDED.verified_by_user_id,
                logo_asset_id = EXCLUDED.logo_asset_id,
                website = EXCLUDED.website, updated_at = EXCLUDED.updated_at
            """, conn, tx);
        cmd.Parameters.AddWithValue("id", org.Id);
        cmd.Parameters.AddWithValue("owner", org.OwnerId);
        cmd.Parameters.AddWithValue("name", org.Name);
        cmd.Parameters.AddWithValue("propertyType", org.PropertyType.ToString());
        cmd.Parameters.AddWithValue("bookingType", org.BookingType.ToString());
        cmd.Parameters.AddWithValue("minimumHours", org.MinimumHours > 0 ? org.MinimumHours : 2);
        cmd.Parameters.AddWithValue("overnightTimeMode",
            string.Equals(org.OvernightTimeMode, "dynamic", StringComparison.OrdinalIgnoreCase) ? "dynamic" : "fixed");
        cmd.Parameters.AddWithValue("slug", org.Slug);
        cmd.Parameters.AddWithValue("tagline", org.Tagline);
        cmd.Parameters.AddWithValue("description", org.Description);
        cmd.Parameters.AddWithValue("address", org.Address);
        cmd.Parameters.AddWithValue("city", org.City);
        cmd.Parameters.AddWithValue("state", org.State);
        cmd.Parameters.AddWithValue("country", org.Country);
        cmd.Parameters.AddWithValue("pincode", org.Pincode ?? "");
        cmd.Parameters.AddWithValue("lat", (object?)org.Latitude ?? DBNull.Value);
        cmd.Parameters.AddWithValue("lng", (object?)org.Longitude ?? DBNull.Value);
        cmd.Parameters.AddWithValue("phone", org.Phone);
        cmd.Parameters.AddWithValue("whatsapp", org.WhatsApp);
        cmd.Parameters.AddWithValue("email", org.Email);
        cmd.Parameters.AddWithValue("checkin", ParseTime(org.CheckInTime));
        cmd.Parameters.AddWithValue("checkout", ParseTime(org.CheckOutTime));
        cmd.Parameters.AddWithValue("cancel", org.CancellationPolicy);
        cmd.Parameters.AddWithValue("payment", org.PaymentPolicy);
        AddJson(cmd, "rules", org.Rules);
        AddJson(cmd, "highlights", org.Highlights);
        AddJson(cmd, "amenities", org.Amenities);
        AddJson(cmd, "images", org.Images);
        AddJson(cmd, "nearby", org.NearbyPlaces);
        AddJson(cmd, "activities", org.Activities);
        AddJson(cmd, "packages", org.Packages);
        AddJson(cmd, "guest_services", org.GuestServices);
        AddJson(cmd, "offers", org.Offers);
        AddJson(cmd, "reviews", org.Reviews);
        AddJson(cmd, "food", org.FoodMenu);
        AddJson(cmd, "travel", org.TravelInfo);
        AddJson(cmd, "faq", org.Faq);
        AddJson(cmd, "slots", org.Slots);
        AddJson(cmd, "closures", org.Closures);
        AddJson(cmd, "weather", org.Weather);
        AddJson(cmd, "contact", org.ContactInfo);
        AddJson(cmd, "seo", org.Seo);
        AddJson(cmd, "messaging", org.Messaging);
        AddJson(cmd, "payment_gateway", org.PaymentGateway);
        AddJson(cmd, "onboarding", org.Onboarding);
        cmd.Parameters.AddWithValue("website_url", org.WebsiteUrl);
        cmd.Parameters.AddWithValue("subdomain", org.Subdomain);
        cmd.Parameters.AddWithValue("referral_code", org.ReferralCode ?? "");
        cmd.Parameters.AddWithValue("referred_by_organisation_id", string.IsNullOrWhiteSpace(org.ReferredByOrganisationId) ? DBNull.Value : org.ReferredByOrganisationId);
        cmd.Parameters.AddWithValue("is_verified", org.IsVerified);
        cmd.Parameters.AddWithValue("verified_at", (object?)org.VerifiedAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("verified_by_user_id", string.IsNullOrWhiteSpace(org.VerifiedByUserId) ? DBNull.Value : org.VerifiedByUserId);
        cmd.Parameters.AddWithValue("logo", (object?)org.LogoAssetId ?? DBNull.Value);
        AddJson(cmd, "website", org.Website);
        cmd.Parameters.AddWithValue("created", org.CreatedAt);
        cmd.Parameters.AddWithValue("updated", org.UpdatedAt);
        cmd.ExecuteNonQuery();

        SyncAssets(conn, org, tx);
    }

    private static void SyncAssets(NpgsqlConnection conn, Organisation org, NpgsqlTransaction? tx)
    {
        using var del = new NpgsqlCommand("DELETE FROM organisation_assets WHERE organisation_id = @org", conn, tx);
        del.Parameters.AddWithValue("org", org.Id);
        del.ExecuteNonQuery();

        foreach (var asset in org.Assets)
        {
            using var cmd = new NpgsqlCommand(
                """
                INSERT INTO organisation_assets (id, organisation_id, title, kind, category, url, file_name, mime_type, notes, created_at, updated_at)
                VALUES (@id, @org, @title, @kind, @category, @url, @file, @mime, @notes, @created, @updated)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title, kind = EXCLUDED.kind, category = EXCLUDED.category, url = EXCLUDED.url,
                    file_name = EXCLUDED.file_name, mime_type = EXCLUDED.mime_type, notes = EXCLUDED.notes, updated_at = EXCLUDED.updated_at
                """, conn, tx);
            cmd.Parameters.AddWithValue("id", asset.Id);
            cmd.Parameters.AddWithValue("org", org.Id);
            cmd.Parameters.AddWithValue("title", asset.Title);
            cmd.Parameters.AddWithValue("kind", asset.Kind.ToString());
            cmd.Parameters.AddWithValue("category", asset.Category.ToString());
            cmd.Parameters.AddWithValue("url", asset.Url);
            cmd.Parameters.AddWithValue("file", (object?)asset.FileName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("mime", (object?)asset.MimeType ?? DBNull.Value);
            cmd.Parameters.AddWithValue("notes", (object?)asset.Notes ?? DBNull.Value);
            cmd.Parameters.AddWithValue("created", asset.CreatedAt);
            cmd.Parameters.AddWithValue("updated", asset.UpdatedAt);
            cmd.ExecuteNonQuery();
        }
    }

    private void UpsertCustomers(IReadOnlyList<Customer> customers)
    {
        using var conn = Open();
        using var tx = conn.BeginTransaction();
        DeleteExcept(conn, tx, "customers", customers.Select(c => c.Id));
        foreach (var c in customers)
            UpsertCustomer(conn, c, tx);
        tx.Commit();
    }

    private static void UpsertCustomer(NpgsqlConnection conn, Customer customer, NpgsqlTransaction? tx = null)
    {
        using var cmd = new NpgsqlCommand(
            """
            INSERT INTO customers (id, organisation_id, name, phone, email, user_account_id, created_at, updated_at)
            VALUES (@id, @org, @name, @phone, @email, @user, @created, @updated)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, phone = EXCLUDED.phone, email = EXCLUDED.email,
                user_account_id = EXCLUDED.user_account_id, updated_at = EXCLUDED.updated_at
            """, conn, tx);
        cmd.Parameters.AddWithValue("id", customer.Id);
        cmd.Parameters.AddWithValue("org", customer.OrganisationId);
        cmd.Parameters.AddWithValue("name", customer.Name);
        cmd.Parameters.AddWithValue("phone", customer.Phone);
        cmd.Parameters.AddWithValue("email", (object?)customer.Email ?? DBNull.Value);
        cmd.Parameters.AddWithValue("user", (object?)customer.UserAccountId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("created", customer.CreatedAt);
        cmd.Parameters.AddWithValue("updated", customer.UpdatedAt);
        cmd.ExecuteNonQuery();
    }

    private void UpsertRooms(IReadOnlyList<Room> rooms)
    {
        using var conn = Open();
        using var tx = conn.BeginTransaction();
        DeleteExcept(conn, tx, "rooms", rooms.Select(r => r.Id));
        foreach (var room in rooms)
        {
            RoomHydrator.StripForPersist(room);
            UpsertRoom(conn, room, tx);
        }
        tx.Commit();
    }

    private static void UpsertRoom(NpgsqlConnection conn, Room room, NpgsqlTransaction? tx = null)
    {
        using var cmd = new NpgsqlCommand(
            """
            INSERT INTO rooms (
                id, organisation_id, room_number, room_name, room_type, floor_number, building_wing, status,
                capacity, pricing, amenities, main_photo, gallery_photos, room_video, booking_rules, cleaning_assignment,
                created_at, updated_at
            ) VALUES (
                @id, @org, @num, @name, @type, @floor, @wing, @status,
                @capacity, @pricing, @amenities, @photo, @gallery, @video, @rules, @cleaning,
                @created, @updated
            )
            ON CONFLICT (id) DO UPDATE SET
                room_number = EXCLUDED.room_number, room_name = EXCLUDED.room_name, room_type = EXCLUDED.room_type,
                floor_number = EXCLUDED.floor_number, building_wing = EXCLUDED.building_wing, status = EXCLUDED.status,
                capacity = EXCLUDED.capacity, pricing = EXCLUDED.pricing, amenities = EXCLUDED.amenities,
                main_photo = EXCLUDED.main_photo, gallery_photos = EXCLUDED.gallery_photos, room_video = EXCLUDED.room_video,
                booking_rules = EXCLUDED.booking_rules, cleaning_assignment = EXCLUDED.cleaning_assignment, updated_at = EXCLUDED.updated_at
            """, conn, tx);
        cmd.Parameters.AddWithValue("id", room.Id);
        cmd.Parameters.AddWithValue("org", room.OrganisationId);
        cmd.Parameters.AddWithValue("num", room.RoomNumber ?? "");
        cmd.Parameters.AddWithValue("name", room.RoomName ?? "");
        cmd.Parameters.AddWithValue("type", room.RoomType.ToString());
        cmd.Parameters.AddWithValue("floor", room.FloorNumber);
        cmd.Parameters.AddWithValue("wing", room.BuildingWing ?? "");
        cmd.Parameters.AddWithValue("status", room.Status.ToString());
        AddJson(cmd, "capacity", room.Capacity);
        AddJson(cmd, "pricing", room.Pricing);
        AddJson(cmd, "amenities", room.Amenities);
        cmd.Parameters.AddWithValue("photo", room.MainPhoto ?? "");
        AddJson(cmd, "gallery", room.GalleryPhotos);
        cmd.Parameters.AddWithValue("video", room.RoomVideo ?? "");
        AddJson(cmd, "rules", room.BookingRules);
        AddJson(cmd, "cleaning", room.CleaningAssignment);
        cmd.Parameters.AddWithValue("created", room.CreatedAt);
        cmd.Parameters.AddWithValue("updated", room.UpdatedAt);
        cmd.ExecuteNonQuery();
    }

    private void UpsertBookings(IReadOnlyList<BookingDetail> bookings)
    {
        using var conn = Open();
        using var tx = conn.BeginTransaction();
        DeleteExcept(conn, tx, "booking_details", bookings.Select(b => b.Id));
        foreach (var b in bookings)
            UpsertBooking(conn, b, tx);
        tx.Commit();
    }

    private static void UpsertBooking(NpgsqlConnection conn, BookingDetail booking, NpgsqlTransaction? tx = null)
    {
        using var cmd = new NpgsqlCommand(
            """
            INSERT INTO booking_details (
                id, organisation_id, customer_id, room_id, booking_code, check_in, check_out,
                check_in_time, check_out_time, nights, duration, hours, booking_type,
                persons, extra_beds, total_amount, paid_amount, balance_amount, status, guest_services, packages,
                payment_reference, razorpay_order_id,
                created_at, updated_at
            ) VALUES (
                @id, @org, @customer, @room, @code, @in, @out,
                @checkInTime, @checkOutTime, @nights, @duration, @hours, @bookingType,
                @persons, @extraBeds, @total, @paid, @balance, @status, @guestServices, @packages,
                @paymentRef, @razorpayOrder,
                @created, @updated
            )
            ON CONFLICT (id) DO UPDATE SET
                customer_id = EXCLUDED.customer_id, room_id = EXCLUDED.room_id, booking_code = EXCLUDED.booking_code,
                check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out,
                check_in_time = EXCLUDED.check_in_time, check_out_time = EXCLUDED.check_out_time,
                nights = EXCLUDED.nights, duration = EXCLUDED.duration, hours = EXCLUDED.hours,
                booking_type = EXCLUDED.booking_type,
                persons = EXCLUDED.persons, extra_beds = EXCLUDED.extra_beds,
                total_amount = EXCLUDED.total_amount, paid_amount = EXCLUDED.paid_amount, balance_amount = EXCLUDED.balance_amount,
                status = EXCLUDED.status, guest_services = EXCLUDED.guest_services, packages = EXCLUDED.packages,
                payment_reference = EXCLUDED.payment_reference, razorpay_order_id = EXCLUDED.razorpay_order_id,
                updated_at = EXCLUDED.updated_at
            """, conn, tx);
        cmd.Parameters.AddWithValue("id", booking.Id);
        cmd.Parameters.AddWithValue("org", booking.OrganisationId);
        cmd.Parameters.AddWithValue("customer", booking.CustomerId);
        cmd.Parameters.AddWithValue("room", string.IsNullOrWhiteSpace(booking.RoomId) ? DBNull.Value : booking.RoomId);
        cmd.Parameters.AddWithValue("code", booking.BookingCode);
        cmd.Parameters.AddWithValue("in", DateTime.Parse(booking.CheckIn));
        cmd.Parameters.AddWithValue("out", DateTime.Parse(booking.CheckOut));
        cmd.Parameters.AddWithValue("checkInTime", string.IsNullOrWhiteSpace(booking.CheckInTime) ? "14:00" : booking.CheckInTime);
        cmd.Parameters.AddWithValue("checkOutTime", string.IsNullOrWhiteSpace(booking.CheckOutTime) ? "11:00" : booking.CheckOutTime);
        cmd.Parameters.AddWithValue("nights", booking.Nights);
        cmd.Parameters.AddWithValue("duration", booking.Duration > 0 ? booking.Duration : (booking.Hours > 0 ? booking.Hours : booking.Nights));
        cmd.Parameters.AddWithValue("hours", booking.Hours);
        cmd.Parameters.AddWithValue("bookingType", string.IsNullOrWhiteSpace(booking.BookingType) ? "overnight" : booking.BookingType);
        cmd.Parameters.AddWithValue("persons", booking.Persons);
        cmd.Parameters.AddWithValue("extraBeds", booking.ExtraBeds);
        cmd.Parameters.AddWithValue("total", booking.Total);
        cmd.Parameters.AddWithValue("paid", booking.Paid);
        cmd.Parameters.AddWithValue("balance", booking.Balance);
        cmd.Parameters.AddWithValue("status", booking.Status.ToString());
        AddJson(cmd, "guestServices", booking.GuestServices);
        AddJson(cmd, "packages", booking.Packages);
        cmd.Parameters.AddWithValue("paymentRef", booking.PaymentReference ?? "");
        cmd.Parameters.AddWithValue("razorpayOrder", booking.RazorpayOrderId ?? "");
        cmd.Parameters.AddWithValue("created", booking.CreatedAt);
        cmd.Parameters.AddWithValue("updated", booking.UpdatedAt);
        cmd.ExecuteNonQuery();
    }

    private void UpsertLogs(IReadOnlyList<LogEntry> logs)
    {
        using var conn = Open();
        using var tx = conn.BeginTransaction();
        foreach (var log in logs.Where(l => !string.IsNullOrWhiteSpace(l.OrganisationId)))
            UpsertLog(conn, log, tx);
        tx.Commit();
    }

    private static void UpsertLog(NpgsqlConnection conn, LogEntry log, NpgsqlTransaction? tx = null)
    {
        using var cmd = new NpgsqlCommand(
            """
            INSERT INTO logs (id, organisation_id, user_id, action, entity_type, entity_id, message, created_at)
            VALUES (@id, @org, @user, @action, @type, @entity, @message, @created)
            ON CONFLICT (id) DO NOTHING
            """, conn, tx);
        cmd.Parameters.AddWithValue("id", log.Id);
        cmd.Parameters.AddWithValue("org", log.OrganisationId);
        cmd.Parameters.AddWithValue("user", (object?)log.UserId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("action", log.Action);
        cmd.Parameters.AddWithValue("type", log.EntityType);
        cmd.Parameters.AddWithValue("entity", (object?)log.EntityId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("message", log.Message);
        cmd.Parameters.AddWithValue("created", log.CreatedAt);
        cmd.ExecuteNonQuery();
    }

    private void UpsertBilling(IReadOnlyList<OrganisationBilling> accounts)
    {
        using var conn = Open();
        using var tx = conn.BeginTransaction();
        foreach (var account in accounts)
            UpsertBillingAccount(conn, account, tx);
        tx.Commit();
    }

    private static void UpsertBillingAccount(NpgsqlConnection conn, OrganisationBilling account, NpgsqlTransaction? tx = null)
    {
        using var cmd = new NpgsqlCommand(
            """
            INSERT INTO organisation_billing (
                organisation_id, plan_id, booking_credits, plan_started_at, plan_renews_at,
                billing_mode, wallet_credit_balance, wallet_free_used_month, wallet_free_month_key, credits_per_booking,
                created_at, updated_at)
            VALUES (@org, @plan, @credits, @started, @renews, @mode, @wallet, @freeUsed, @freeMonth, @perBooking, NOW(), NOW())
            ON CONFLICT (organisation_id) DO UPDATE SET
                plan_id = EXCLUDED.plan_id, booking_credits = EXCLUDED.booking_credits,
                plan_started_at = EXCLUDED.plan_started_at, plan_renews_at = EXCLUDED.plan_renews_at,
                billing_mode = EXCLUDED.billing_mode, wallet_credit_balance = EXCLUDED.wallet_credit_balance,
                wallet_free_used_month = EXCLUDED.wallet_free_used_month,
                wallet_free_month_key = EXCLUDED.wallet_free_month_key,
                credits_per_booking = EXCLUDED.credits_per_booking,
                updated_at = NOW()
            """, conn, tx);
        cmd.Parameters.AddWithValue("org", account.OrganisationId);
        cmd.Parameters.AddWithValue("plan", CreditCatalog.NormalizePlanId(account.PlanId));
        cmd.Parameters.AddWithValue("credits", account.BookingCredits);
        cmd.Parameters.AddWithValue("started", (object?)account.PlanStartedAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("renews", (object?)account.PlanRenewsAt ?? DBNull.Value);
        cmd.Parameters.AddWithValue("mode", account.BillingMode.ToString());
        cmd.Parameters.AddWithValue("wallet", account.WalletCreditBalance);
        cmd.Parameters.AddWithValue("freeUsed", account.WalletFreeBookingsUsedThisMonth);
        cmd.Parameters.AddWithValue("freeMonth", account.WalletFreeMonthKey ?? "");
        cmd.Parameters.AddWithValue("perBooking", account.CreditsPerBooking);
        cmd.ExecuteNonQuery();

        using var del = new NpgsqlCommand("DELETE FROM credit_transactions WHERE organisation_id = @org", conn, tx);
        del.Parameters.AddWithValue("org", account.OrganisationId);
        del.ExecuteNonQuery();

        foreach (var txItem in account.Transactions)
        {
            using var ins = new NpgsqlCommand(
                """
                INSERT INTO credit_transactions (id, organisation_id, type, amount, description, created_at)
                VALUES (@id, @org, @type, @amount, @desc, @created)
                ON CONFLICT (id) DO NOTHING
                """, conn, tx);
            ins.Parameters.AddWithValue("id", txItem.Id);
            ins.Parameters.AddWithValue("org", account.OrganisationId);
            ins.Parameters.AddWithValue("type", txItem.Type.ToString());
            ins.Parameters.AddWithValue("amount", txItem.Amount);
            ins.Parameters.AddWithValue("desc", txItem.Description);
            ins.Parameters.AddWithValue("created", txItem.CreatedAt);
            ins.ExecuteNonQuery();
        }
    }

    private static void AddUserParams(NpgsqlCommand cmd, User user)
    {
        cmd.Parameters.AddWithValue("id", user.Id);
        cmd.Parameters.AddWithValue("org", user.OrganisationId);
        cmd.Parameters.AddWithValue("name", user.Name);
        cmd.Parameters.AddWithValue("phone", user.Phone);
        cmd.Parameters.AddWithValue("email", user.Email);
        cmd.Parameters.AddWithValue("password", user.Password);
        cmd.Parameters.AddWithValue("role", user.Role.ToString());
        cmd.Parameters.AddWithValue("department", user.Department.ToString());
        cmd.Parameters.AddWithValue("status", user.Status.ToString());
        AddJson(cmd, "permissions", user.Permissions);
        cmd.Parameters.AddWithValue("created", user.CreatedAt);
        cmd.Parameters.AddWithValue("updated", user.UpdatedAt);
    }

    private static void AddJson<T>(NpgsqlCommand cmd, string name, T value)
    {
        var param = cmd.Parameters.Add(name, NpgsqlDbType.Jsonb);
        param.Value = JsonSerializer.Serialize(value, JsonOptions.Default);
    }

    private static T? ReadJson<T>(NpgsqlDataReader reader, int ordinal)
    {
        if (reader.IsDBNull(ordinal))
            return default;
        return JsonSerializer.Deserialize<T>(reader.GetString(ordinal), JsonOptions.Default);
    }

    private static T? TryReadJson<T>(NpgsqlDataReader reader, string column)
    {
        try
        {
            var ordinal = reader.GetOrdinal(column);
            return ReadJson<T>(reader, ordinal);
        }
        catch (IndexOutOfRangeException)
        {
            return default;
        }
        catch (ArgumentException)
        {
            return default;
        }
    }

    private static TEnum TryReadEnum<TEnum>(NpgsqlDataReader reader, string column, TEnum fallback)
        where TEnum : struct, Enum
    {
        try
        {
            var ordinal = reader.GetOrdinal(column);
            if (reader.IsDBNull(ordinal)) return fallback;
            return ParseEnum<TEnum>(reader.GetString(ordinal));
        }
        catch
        {
            return fallback;
        }
    }

    private static int TryReadInt(NpgsqlDataReader reader, string column, int fallback)
    {
        try
        {
            var ordinal = reader.GetOrdinal(column);
            if (reader.IsDBNull(ordinal)) return fallback;
            return reader.GetInt32(ordinal);
        }
        catch
        {
            return fallback;
        }
    }

    private static string TryReadString(NpgsqlDataReader reader, string column, string fallback)
    {
        try
        {
            var ordinal = reader.GetOrdinal(column);
            if (reader.IsDBNull(ordinal)) return fallback;
            var value = reader.GetString(ordinal);
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }
        catch
        {
            return fallback;
        }
    }

    private static string? TryReadNullableString(NpgsqlDataReader reader, string column)
    {
        try
        {
            var ordinal = reader.GetOrdinal(column);
            return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
        }
        catch
        {
            return null;
        }
    }

    private static bool TryReadBool(NpgsqlDataReader reader, string column, bool fallback)
    {
        try
        {
            var ordinal = reader.GetOrdinal(column);
            if (reader.IsDBNull(ordinal)) return fallback;
            return reader.GetBoolean(ordinal);
        }
        catch
        {
            return fallback;
        }
    }

    private static DateTime? TryReadDateTime(NpgsqlDataReader reader, string column)
    {
        try
        {
            var ordinal = reader.GetOrdinal(column);
            return reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
        }
        catch
        {
            return null;
        }
    }

    private static T ParseEnum<T>(string value) where T : struct, Enum =>
        Enum.TryParse<T>(value, ignoreCase: true, out var result) ? result : default;

    private static BillingMode ParseBillingMode(string? value) =>
        Enum.TryParse<BillingMode>(value, ignoreCase: true, out var result)
            ? result
            : BillingMode.subscription;

    private static TimeSpan ParseTime(string value) =>
        TimeSpan.TryParse(value, CultureInfo.InvariantCulture, out var result)
            ? result
            : TimeSpan.FromHours(14);

    private static void DeleteExcept(
        NpgsqlConnection conn,
        NpgsqlTransaction tx,
        string table,
        IEnumerable<string> keepIds)
    {
        var ids = keepIds.Distinct().ToArray();
        if (ids.Length == 0)
            return;
        using var cmd = new NpgsqlCommand(
            $"DELETE FROM {table} WHERE NOT (id = ANY(@ids))",
            conn,
            tx);
        cmd.Parameters.AddWithValue("ids", ids);
        cmd.ExecuteNonQuery();
    }
}

public sealed class AppDataSnapshot
{
    public List<User> Users { get; set; } = [];
    public List<Organisation> Organisations { get; set; } = [];
    public List<Customer> Customers { get; set; } = [];
    public List<BookingDetail> BookingDetails { get; set; } = [];
    public List<LogEntry> Logs { get; set; } = [];
    public List<Room> Rooms { get; set; } = [];
    public List<OrganisationBilling> BillingAccounts { get; set; } = [];
}
