using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using appointza.Models;
using appointza.Services;
using System.Reflection;

namespace appointza.Authentication.Utils
{
    /// <summary>
    /// Server-side gate for every super admin endpoint.
    /// Allows (a) a legacy platform-admin JWT, or (b) a normal user JWT whose user row currently has
    /// users.isfactory = true. The flag is re-read from the database on every request, so revoking it
    /// takes effect immediately and a forged/old JWT claim can never grant access.
    /// 401 = not logged in, 403 = logged in but not a super admin (the UI must not treat 403 as a session expiry).
    /// </summary>
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class SuperAdminAuthenticateAttribute : Attribute, IAsyncAuthorizationFilter
    {
        public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
        {
            if (AllowsAnonymous(context))
                return;

            var http = context.HttpContext;

            var admin = http.Items["admincontext"] as AdminContext;
            if (admin != null && admin.adminid > 0)
                return;

            var user = http.Items["usercontext"] as UsersContext;
            if (user == null || user.userid <= 0)
            {
                context.Result = new JsonResult(new { message = "Unauthorized" })
                {
                    StatusCode = StatusCodes.Status401Unauthorized
                };
                return;
            }

            var superAdminService = http.RequestServices.GetRequiredService<SuperAdminService>();
            if (!await superAdminService.IsSuperAdminUser(user.userid))
            {
                context.Result = new JsonResult(new { message = "Forbidden: super admin access required" })
                {
                    StatusCode = StatusCodes.Status403Forbidden
                };
            }
        }

        private static bool AllowsAnonymous(AuthorizationFilterContext context)
        {
            if (context.ActionDescriptor.EndpointMetadata.Any(m => m is AllowAnonymousAttribute))
                return true;

            if (context.ActionDescriptor is ControllerActionDescriptor cad)
            {
                if (cad.MethodInfo.GetCustomAttribute<AllowAnonymousAttribute>(inherit: true) != null)
                    return true;
                if (cad.ControllerTypeInfo.GetCustomAttribute<AllowAnonymousAttribute>(inherit: true) != null)
                    return true;
            }

            return false;
        }
    }
}