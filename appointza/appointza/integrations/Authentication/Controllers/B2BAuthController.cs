using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using appointza.Authentication.Services;
using appointza.Authentication.Models;
using appointza.Models;
using appointza.Utils;
using appointza.Services;

namespace appointza.integrations.Authentication.Controllers
{
    [ApiController]
    [Route("api/b2b/auth")]
    public class B2BAuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly AuthService _authService;
        private readonly UsersService _usersService;
        private readonly OrganisationService _organisationService;
        private readonly OrganisationLocationService _organisationLocationService;
        private readonly IDbProvider _dbProvider;
        private readonly ILogger<B2BAuthController> _logger;

        public B2BAuthController(
            IConfiguration configuration, 
            AuthService authService,
            UsersService usersService,
            OrganisationService organisationService,
            OrganisationLocationService organisationLocationService,
            IDbProvider dbProvider,
            ILogger<B2BAuthController> logger)
        {
            _configuration = configuration;
            _authService = authService;
            _usersService = usersService;
            _organisationService = organisationService;
            _organisationLocationService = organisationLocationService;
            _dbProvider = dbProvider;
            _logger = logger;
        }

        [HttpPost("token")]
        public async Task<IActionResult> GetToken([FromBody] B2BTokenRequest request)
        {
            // 1️⃣ Validate client credentials (for simplicity)
            if (!ValidateClient(request.ClientId, request.ClientSecret))
            {
                return Unauthorized(new { message = "Invalid client credentials" });
            }

            // 2️⃣ Create claims for the server token
            var claims = new[]
            {
                new Claim("client_id", request.ClientId),
                new Claim("company", request.Company),
                new Claim("scope", "read"),
                new Claim(JwtRegisteredClaimNames.Iss, request.Company),
                new Claim(JwtRegisteredClaimNames.Aud, "appointza-api")
            };

            // 3️⃣ Generate token
            var secretKey = _configuration["ApplicationSettings:B2BAuth:SharedSecret"];
            if (string.IsNullOrEmpty(secretKey))
            {
                return StatusCode(500, new { message = "B2B authentication not configured" });
            }
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: request.Company,
                audience: "appointza-api",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(10),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // 4️⃣ Get user details if mobile or email is provided
            UsersContext? userContext = null;
            if (!string.IsNullOrEmpty(request.Mobile) || !string.IsNullOrEmpty(request.Email))
            {
                try
                {
                    userContext = await GetUserContextByMobileOrEmail(request.Mobile, request.Email);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get user context for mobile/email in B2B token request");
                    // Continue without user context if lookup fails
                }
            }

            // 5️⃣ Return token and user context if available
            var response = new
            {
                access_token = tokenString,
                expires_in = 600,
                user = userContext
            };

            return Ok(response);
        }

        private async Task<UsersContext?> GetUserContextByMobileOrEmail(string? mobile, string? email)
        {
            if (string.IsNullOrEmpty(mobile) && string.IsNullOrEmpty(email))
            {
                return null;
            }

            using (IDb db = await _dbProvider.GetDb())
            {
                await db.Connect();
                
                // Get user by mobile or email
                var users = await _usersService.SelectTransaction(db, new UsersSelectReq
                {
                    mobile = mobile ?? "",
                    email = email ?? ""
                });

                var user = users?.FirstOrDefault();
                if (user == null)
                {
                    return null;
                }

                // Build UsersContext similar to RefreshTokenTransaction
                var result = new UsersContext();

                var organisation = new Organisation();
                if (user.organisationid > 0)
                {
                    var organisations = await _organisationService.SelectTransaction(db, new OrganisationSelectReq
                    {
                        id = user.organisationid
                    });
                    organisation = organisations?.FirstOrDefault() ?? new Organisation();
                }

                var organisationlocation = new OrganisationLocation();
                if (user.locationid > 0)
                {
                    var locations = await _organisationLocationService.SelectTransaction(db, new OrganisationLocationSelectReq
                    {
                        id = user.locationid
                    });
                    organisationlocation = locations?.FirstOrDefault() ?? new OrganisationLocation();
                }

                // Determine if staff
                bool isStaff = false;
                if (user.locationid > 0 && user.organisationid == 0)
                {
                    isStaff = true;
                    result.organisationlocationid = user.locationid;
                    result.organisationlocationname = organisationlocation?.name ?? "";
                    result.organisationid = 0;
                    result.organisationname = "";
                }
                else if (user.organisationid > 0 && user.locationid > 0)
                {
                    isStaff = false;
                    result.organisationid = organisation?.id ?? 0;
                    result.organisationname = organisation?.name ?? "";
                    result.organisationlocationid = organisationlocation?.id ?? 0;
                    result.organisationlocationname = organisationlocation?.name ?? "";
                }
                else if (user.organisationid > 0 && user.locationid == 0)
                {
                    isStaff = false;
                    result.organisationid = organisation?.id ?? 0;
                    result.organisationname = organisation?.name ?? "";
                    result.organisationlocationid = 0;
                    result.organisationlocationname = "";
                }
                else
                {
                    isStaff = false;
                    result.organisationid = 0;
                    result.organisationname = "";
                    result.organisationlocationid = 0;
                    result.organisationlocationname = "";
                }

                result.userid = user.id;
                result.usermobile = user.mobile;
                result.username = user.name;
                result.useremail = user.email;
                result.profileimage = user.profileimage;
                result.userpermission = user.attributes?.permission;
                result.isStaff = isStaff;
                result.refreshtoken = ""; // No refresh token for B2B token endpoint
                result.accesstoken = ""; // Access token is separate for B2B

                return result;
            }
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<ActionRes<UsersContext>>> RefreshToken(ActionReq<RefreshTokenRequest> req)
        {
            ActionRes<UsersContext> result = new ActionRes<UsersContext>();
            try
            {
                if (req == null || req.item == null)
                {
                    return BadRequest(new { message = "Invalid request" });
                }

                // Use the same RefreshToken method as regular auth to get full user context
                result.item = await _authService.RefreshToken(req.item);
                
                if (result.item == null)
                {
                    return Unauthorized(new { message = "Invalid refresh token" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error refreshing B2B token");
                return BadRequest(new { error = ex.Message, message = "Token refresh failed" });
            }
        }

        private bool ValidateClient(string clientId, string clientSecret)
        {
            // For demo, hardcoded clients. Replace with DB/config in production.
            return (clientId, clientSecret) switch
            {
                ("appointza-client", "appointza-secret") => true,
                ("latrexa-client", "latrexa-secret") => true,
                ("momantza-client", "momantza-secret") => true,
                ("campusza-client", "campusza-secret") => true,
                ("crm-client", "crm-secret") => true,
                _ => false
            };
        }
    }

    public class B2BTokenRequest
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string Company { get; set; } = string.Empty;
        public string? Mobile { get; set; }
        public string? Email { get; set; }
    }
}
