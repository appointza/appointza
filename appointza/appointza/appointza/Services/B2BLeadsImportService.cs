using appointza.Authentication.Services;
using appointza.Models;
using appointza.Utils;

namespace appointza.Services
{
    public class B2BLeadsImportService
    {
        private readonly IDbProvider _dbProvider;
        private readonly UsersService _usersService;
        private readonly OrganisationService _organisationService;
        private readonly OrganisationLocationService _organisationLocationService;
        private readonly EnquiryService _enquiryService;
        private readonly AppoinmentService _appoinmentService;

        public B2BLeadsImportService(
            IDbProvider dbProvider,
            UsersService usersService,
            OrganisationService organisationService,
            OrganisationLocationService organisationLocationService,
            EnquiryService enquiryService,
            AppoinmentService appoinmentService)
        {
            _dbProvider = dbProvider;
            _usersService = usersService;
            _organisationService = organisationService;
            _organisationLocationService = organisationLocationService;
            _enquiryService = enquiryService;
            _appoinmentService = appoinmentService;
        }

        public async Task<OrganisationResolveRes> ResolveOrganisationByEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new ArgumentException("Email is required.");
            }

            using IDb db = await _dbProvider.GetDb();
            await db.Connect();
            return await ResolveOrganisationByEmailTransaction(db, email.Trim());
        }

        public async Task<LeadsImportRes> ImportLeads(LeadsImportReq req)
        {
            if (req == null)
            {
                throw new ArgumentException("Request is required.");
            }

            using IDb db = await _dbProvider.GetDb();
            await db.Connect();

            OrganisationResolveRes organisation;
            if (req.organisation_id > 0)
            {
                organisation = await ResolveOrganisationByIdTransaction(db, req.organisation_id);
            }
            else if (!string.IsNullOrWhiteSpace(req.email))
            {
                organisation = await ResolveOrganisationByEmailTransaction(db, req.email.Trim());
            }
            else
            {
                throw new ArgumentException("Provide email or organisation_id.");
            }

            var leads = await _enquiryService.SelectTransaction(db, new EnquirySelectReq
            {
                organisation_id = organisation.organisation_id,
                is_active = null,
            });

            var customers = await _appoinmentService.SelectUniqueClientsTransaction(db, new ClientsSelectReq
            {
                organisationid = organisation.organisation_id,
            });

            return new LeadsImportRes
            {
                organisation = organisation,
                leads = leads ?? new List<Enquiry>(),
                customers = customers ?? new List<ClientInfoRes>(),
            };
        }

        private async Task<OrganisationResolveRes> ResolveOrganisationByEmailTransaction(IDb db, string email)
        {
            var users = await _usersService.SelectTransaction(db, new UsersSelectReq
            {
                email = email,
            });

            var user = users?
                .FirstOrDefault(u => u.organisationid > 0)
                ?? users?.FirstOrDefault();

            if (user == null)
            {
                throw new KeyNotFoundException($"No Appointza user found for email '{email}'.");
            }

            return await BuildOrganisationContextTransaction(db, user);
        }

        private async Task<OrganisationResolveRes> ResolveOrganisationByIdTransaction(IDb db, long organisationId)
        {
            var organisations = await _organisationService.SelectTransaction(db, new OrganisationSelectReq
            {
                id = organisationId,
            });
            var organisation = organisations?.FirstOrDefault();
            if (organisation == null || organisation.id <= 0)
            {
                throw new KeyNotFoundException($"No organisation found for id {organisationId}.");
            }

            var users = await _usersService.SelectTransaction(db, new UsersSelectReq
            {
                organisationid = organisationId,
            });
            var owner = users?
                .FirstOrDefault(u => u.locationid == 0)
                ?? users?.FirstOrDefault();

            var result = new OrganisationResolveRes
            {
                organisation_id = organisation.id,
                organisation_name = organisation.name ?? "",
                owner_user_id = owner?.id ?? 0,
                owner_email = owner?.email ?? "",
                owner_name = owner?.name ?? "",
            };

            await FillLocationTransaction(db, owner, organisation.id, result);
            return result;
        }

        private async Task<OrganisationResolveRes> BuildOrganisationContextTransaction(IDb db, Users user)
        {
            long organisationId = user.organisationid;
            if (organisationId <= 0 && user.locationid > 0)
            {
                var staffLocations = await _organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq
                {
                    id = user.locationid,
                });
                organisationId = staffLocations?.FirstOrDefault()?.organisationid ?? 0;
            }

            if (organisationId <= 0)
            {
                throw new KeyNotFoundException("User is not linked to an organisation.");
            }

            var organisations = await _organisationService.SelectTransaction(db, new OrganisationSelectReq
            {
                id = organisationId,
            });
            var organisation = organisations?.FirstOrDefault() ?? new Organisation();

            var result = new OrganisationResolveRes
            {
                organisation_id = organisationId,
                organisation_name = organisation.name ?? "",
                owner_user_id = user.id,
                owner_email = user.email ?? "",
                owner_name = user.name ?? "",
            };

            await FillLocationTransaction(db, user, organisationId, result);
            return result;
        }

        private async Task FillLocationTransaction(
            IDb db,
            Users? user,
            long organisationId,
            OrganisationResolveRes result)
        {
            OrganisationLocation? location = null;
            if (user?.locationid > 0)
            {
                var locations = await _organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq
                {
                    id = user.locationid,
                });
                location = locations?.FirstOrDefault();
            }

            if (location == null)
            {
                var orgLocations = await _organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq
                {
                    organisationid = organisationId,
                });
                location = orgLocations?.FirstOrDefault();
            }

            if (location != null)
            {
                result.location_id = location.id;
                result.location_name = location.name ?? "";
            }
        }
    }
}
