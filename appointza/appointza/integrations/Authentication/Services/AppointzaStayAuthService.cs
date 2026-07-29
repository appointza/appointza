using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using appointza.Utils;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace appointza.Authentication.Services
{
    /// <summary>
    /// Product-scoped auth for AppointzaStay routed through the central Auth API.
    /// </summary>
    public class AppointzaStayAuthService
    {
        private readonly StayAuthService stayAuthService;
        private readonly AppDataStore dataStore;
        private readonly ApplicationEnvironment applicationEnvironment;

        public AppointzaStayAuthService(
            StayAuthService stayAuthService,
            AppDataStore dataStore,
            IOptions<ApplicationEnvironment> applicationEnvironment)
        {
            this.stayAuthService = stayAuthService;
            this.dataStore = dataStore;
            this.applicationEnvironment = applicationEnvironment.Value;
        }

        public AppointzaStayAuthRes Login(AppointzaStayLoginReq req)
        {
            var user = stayAuthService.ValidateLogin(req.login, req.password)
                ?? throw new AppException(AppException.ErrorCodes.InvalidCredential, "Invalid email/phone or password.");

            return ToAuthResponse(user);
        }

        public AppointzaStayAuthRes Register(AppointzaStaySignupReq req)
        {
            var (success, error, user) = stayAuthService.Register(req);
            if (!success || user == null)
                throw new AppException(AppException.ErrorCodes.BadRequest, error ?? "Could not create account.");

            return ToAuthResponse(user);
        }

        private AppointzaStayAuthRes ToAuthResponse(User user)
        {
            var org = dataStore.GetOrganisation(user.OrganisationId);
            return new AppointzaStayAuthRes
            {
                userId = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role.ToString(),
                organizationId = org.Id,
                organizationName = org.Name,
                organizationSlug = org.Slug,
                accesstoken = GenerateAppointzaStayJwtToken(user, org),
            };
        }

        public string GenerateAppointzaStayJwtToken(User user, Organisation org)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(applicationEnvironment.jwtsecret));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("product", "appointzastay"),
                new Claim("userid", user.Id),
                new Claim("appointzastay_userid", user.Id),
                new Claim("useremail", user.Email ?? ""),
                new Claim("username", user.Name ?? ""),
                new Claim("appointzastay_role", user.Role.ToString()),
                new Claim("appointzastay_organization_id", org.Id ?? ""),
                new Claim("appointzastay_organization_name", org.Name ?? ""),
                new Claim("appointzastay_organization_slug", org.Slug ?? ""),
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddYears(1),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public static AppointzaStayUserContext? JwtTokenToAppointzaStayUser(string token, string jwtSecret)
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
                if (jwtToken.Claims.FirstOrDefault(x => x.Type == "product")?.Value != "appointzastay")
                    return null;

                return new AppointzaStayUserContext
                {
                    userId = jwtToken.Claims.FirstOrDefault(x => x.Type == "appointzastay_userid")?.Value ?? "",
                    email = jwtToken.Claims.FirstOrDefault(x => x.Type == "useremail")?.Value ?? "",
                    name = jwtToken.Claims.FirstOrDefault(x => x.Type == "username")?.Value ?? "",
                    role = jwtToken.Claims.FirstOrDefault(x => x.Type == "appointzastay_role")?.Value ?? "",
                    organizationId = jwtToken.Claims.FirstOrDefault(x => x.Type == "appointzastay_organization_id")?.Value ?? "",
                    organizationName = jwtToken.Claims.FirstOrDefault(x => x.Type == "appointzastay_organization_name")?.Value ?? "",
                    organizationSlug = jwtToken.Claims.FirstOrDefault(x => x.Type == "appointzastay_organization_slug")?.Value ?? "",
                };
            }
            catch
            {
                return null;
            }
        }
    }
}
