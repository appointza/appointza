using appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace appointza.Filters.AppointzaStay;

/// <summary>Requires an AppointzaStay super_admin JWT.</summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireSuperAdminAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = RequireStaffAttribute.GetCurrentUser(context.HttpContext);
        if (user != null && StayAuthService.IsPlatformAdmin(user))
        {
            context.HttpContext.Items["appointzastay_current_user"] = user;
            return;
        }

        context.Result = new JsonResult(new { message = "Platform admin access required" })
        {
            StatusCode = StatusCodes.Status403Forbidden,
        };
    }
}
