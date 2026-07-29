using appointza.Models.Campusza;
using appointza.Services.Campusza;
using appointza.Utils;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace appointza.Authentication.Services
{
    /// <summary>
    /// Product-scoped auth for Campusza (email/password) routed through the platform Auth API.
    /// </summary>
    public class CampuszaAuthService
    {
        private readonly UserLoginService userLoginService;
        private readonly ApplicationEnvironment applicationEnvironment;

        public CampuszaAuthService(
            UserLoginService userLoginService,
            IOptions<ApplicationEnvironment> applicationEnvironment)
        {
            this.userLoginService = userLoginService;
            this.applicationEnvironment = applicationEnvironment.Value;
        }

        public async Task<CampuszaAuthRes> Login(UserLoginReq req)
        {
            var user = await userLoginService.Login(req);
            return ToAuthResponse(user);
        }

        public async Task<CampuszaAuthRes> UpdateProfile(UserProfileUpdateReq req)
        {
            var user = await userLoginService.UpdateProfile(req);
            return ToAuthResponse(user);
        }

        private CampuszaAuthRes ToAuthResponse(UserLoginRes user)
        {
            return new CampuszaAuthRes
            {
                userId = user.userId,
                email = user.email,
                role = user.role,
                organizationId = user.organizationId,
                organizationName = user.organizationName,
                organizationSlug = user.organizationSlug,
                staffId = user.staffId,
                accesstoken = GenerateCampuszaJwtToken(user)
            };
        }

        public string GenerateCampuszaJwtToken(UserLoginRes user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(applicationEnvironment.jwtsecret));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("product", "campusza"),
                new Claim("userid", user.userId ?? ""),
                new Claim("campusza_userid", user.userId ?? ""),
                new Claim("useremail", user.email ?? ""),
                new Claim("campusza_role", user.role ?? ""),
                new Claim("campusza_organization_id", user.organizationId ?? ""),
                new Claim("campusza_organization_name", user.organizationName ?? ""),
                new Claim("campusza_organization_slug", user.organizationSlug ?? ""),
                new Claim("campusza_staff_id", user.staffId ?? ""),
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddYears(1),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public static UserLoginRes? JwtTokenToCampuszaUser(string token, string jwtSecret)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(jwtSecret);
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero,
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;
                if (jwtToken.Claims.FirstOrDefault(x => x.Type == "product")?.Value != "campusza")
                    return null;

                return new UserLoginRes
                {
                    userId = jwtToken.Claims.FirstOrDefault(x => x.Type == "campusza_userid")?.Value ?? "",
                    email = jwtToken.Claims.FirstOrDefault(x => x.Type == "useremail")?.Value ?? "",
                    role = jwtToken.Claims.FirstOrDefault(x => x.Type == "campusza_role")?.Value ?? "",
                    organizationId = jwtToken.Claims.FirstOrDefault(x => x.Type == "campusza_organization_id")?.Value ?? "",
                    organizationName = jwtToken.Claims.FirstOrDefault(x => x.Type == "campusza_organization_name")?.Value ?? "",
                    organizationSlug = jwtToken.Claims.FirstOrDefault(x => x.Type == "campusza_organization_slug")?.Value ?? "",
                    staffId = jwtToken.Claims.FirstOrDefault(x => x.Type == "campusza_staff_id")?.Value ?? "",
                };
            }
            catch
            {
                return null;
            }
        }
    }
}
