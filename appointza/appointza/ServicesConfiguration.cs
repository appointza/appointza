using appointza.AwsS3;
using appointza.Services;
using appointza.Authentication.Services;
using appointza.FirebaseNotification.Services;
using appointza.Sms.Services;
using appointza.WhatsAppMsg.Services;
using appointza.Utils;
using appointza.Data.AppointzaStay;
using appointza.Services.AppointzaStay;
using CampuszaServices = appointza.Services.Campusza;
using StayServices = appointza.Services.AppointzaStay;

namespace appointza
{
    public static class ServicesConfiguration
    {
        public static void AddCustomServices(this IServiceCollection services)
        {
            services.AddSingleton<UserSocketService>();
            services.AddSingleton<IQueryBuilderProvider, QueryBuilderProvider>();
            services.AddTransient<CustomCryptography>();

            // AWS S3
            services.AddSingleton<AwsS3Service>();

            // HTTP Client for Razorpay
            services.AddHttpClient<Razorpay.RazorpayService>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
                client.DefaultRequestHeaders.Add("User-Agent", "appointza/1.0");
            });
            services.AddScoped<Razorpay.RazorpayService>();
            
            // HTTP Client for Firebase Notifications
            services.AddHttpClient<FirebaseNotificationService>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
                client.DefaultRequestHeaders.Add("User-Agent", "appointza/1.0");
            });
            services.AddScoped<FirebaseNotificationService>();
            
            // Firebase Admin SDK for Notifications
            services.AddScoped<FirebaseAdminNotificationService>();

            // HTTP Client for WhatsApp API
            services.AddHttpClient<WhatsAppMsg.Services.WhatsAppService>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
                client.DefaultRequestHeaders.Add("User-Agent", "appointza/1.0");
            });
            services.AddScoped<WhatsAppMsg.Services.WhatsAppService>();

            // HTTP Client for Google Geocoding API
            services.AddHttpClient<GoogleGeocodingService>(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
                client.DefaultRequestHeaders.Add("User-Agent", "appointza/1.0");
            });
            services.AddScoped<GoogleGeocodingService>();

            // SMS Service
            services.AddScoped<Sms.Services.SmsService>();

            //DB - Optimized service lifetimes
            services.AddScoped<FilesService>(); // Changed from Transient to Scoped
          
            services.AddScoped<OrganisationLocationService>(); // Changed from Transient to Scoped
            services.AddScoped<appointza.Services.OrganisationService>(); // Changed from Transient to Scoped
            services.AddScoped<Authentication.Services.UserSessionService>(); // Changed from Transient to Scoped - moved to Authentication
            services.AddScoped<Authentication.Services.UsersService>(); // Changed from Transient to Scoped - moved to Authentication
            services.AddScoped<Authentication.Services.AuthService>(); // Authentication service
            services.AddScoped<CampuszaAuthService>();
            services.AddScoped<AppointzaStayAuthService>();
            services.AddScoped<PlatformUserCredentialService>();
            services.AddScoped<UserProductProfileService>();
            services.AddScoped<ReferenceTypeService>(); // Changed from Transient to Scoped
            services.AddScoped<ReferenceValueService>();
            services.AddScoped<OrganisationServicesService>();
            services.AddScoped<OrganisationServiceTimingService>();
            services.AddScoped<AppoinmentService>();
            services.AddScoped<StaffService>();
            services.AddScoped<TimelineService>();
            services.AddScoped<PaymentService>();
            services.AddScoped<LeaveDatesService>();
            services.AddScoped<OrganisationSiteService>();
            services.AddScoped<QRCoderService>();
            services.AddScoped<AdminService>();
            services.AddScoped<AppointmentRecordService>();
            services.AddScoped<EventService>();
            services.AddScoped<EventBookingService>();
            services.AddScoped<ReviewService>();
            services.AddScoped<PaymentGatewayCredentialsService>();
            services.AddScoped<ApplicationSettingsService>();
            services.AddScoped<WebsiteService>();
            services.AddScoped<EnquiryService>();
            services.AddScoped<IntegrationTokenService>();
            services.AddScoped<B2BLeadsImportService>();
            services.AddScoped<SubscriptionPlanService>();
            services.AddScoped<CreditWalletService>();
            services.AddScoped<CreditWalletRechargeService>();
            services.AddScoped<OrganisationSubscriptionService>();
            services.AddScoped<OrganisationReferralService>();
            services.AddScoped<OrganisationBillingStatsService>();
            services.AddScoped<BookingFeeService>();
            services.AddScoped<SubscriptionTopUpService>();
            //        services.AddScoped<OrganisationServiceTimingService>();

            // Campusza product services
            services.AddScoped<CampuszaServices.UserLoginService>();
            services.AddScoped<CampuszaServices.UserService>();
            services.AddScoped<CampuszaServices.EmailService>();
            services.AddScoped<CampuszaServices.OrganizationService>();
            services.AddScoped<CampuszaServices.OrganizationRegistrationService>();
            services.AddScoped<CampuszaServices.AssessmentService>();
            services.AddScoped<CampuszaServices.AttendanceService>();
            services.AddScoped<CampuszaServices.CertificateService>();
            services.AddScoped<CampuszaServices.ClassConfigurationService>();
            services.AddScoped<CampuszaServices.ClassService>();
            services.AddScoped<CampuszaServices.DashboardService>();
            services.AddScoped<CampuszaServices.DocumentRequirementStudentService>();
            services.AddScoped<CampuszaServices.FeeService>();
            services.AddScoped<CampuszaServices.GradeService>();
            services.AddScoped<CampuszaServices.ReferenceValueService>();
            services.AddScoped<CampuszaServices.ReportService>();
            services.AddScoped<CampuszaServices.SettingsService>();
            services.AddScoped<CampuszaServices.StaffService>();
            services.AddScoped<CampuszaServices.StaffLeaveService>();
            services.AddScoped<CampuszaServices.StaffReplacementService>();
            services.AddScoped<CampuszaServices.StaffScheduleService>();
            services.AddScoped<CampuszaServices.StudentGradeService>();
            services.AddScoped<CampuszaServices.StudentPromotionService>();
            services.AddScoped<CampuszaServices.StudentService>();
            services.AddScoped<CampuszaServices.StudentTermService>();
            services.AddScoped<CampuszaServices.SubjectService>();
            services.AddScoped<CampuszaServices.TermService>();

            // AppointzaStay product services
            services.AddSingleton<AppDataStore>();
            services.AddSingleton<OrganisationResolver>();
            services.AddSingleton<StayServices.LogService>();
            services.AddSingleton<StayServices.BookingDetailService>();
            services.AddSingleton<StayServices.UserService>();
            services.AddSingleton<StayServices.CustomerService>();
            services.AddSingleton<StayServices.RoomService>();
            services.AddSingleton<StayServices.PackageService>();
            services.AddSingleton<StayServices.WebsiteProfileSyncService>();
            services.AddSingleton<StayServices.OrganisationService>();
            services.AddSingleton<StayServices.OnboardingService>();
            services.AddSingleton<StayServices.GuestBookingService>();
            services.AddSingleton<StayServices.StaffBookingService>();
            services.AddSingleton<StayServices.CreditService>();
            services.AddSingleton<StayServices.SiteBuilderService>();
            services.AddSingleton<StayServices.AssetService>();
            services.AddSingleton<StayServices.StayAuthService>();
            services.AddSingleton<StayServices.StayPaymentService>();
            services.AddSingleton<StayServices.PlatformAdminService>();

        }
    }
}
