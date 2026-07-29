using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace appointza.Filters.AppointzaStay;

/// <summary>Requires an active AppointzaStay staff JWT. Guests receive 401.</summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireStaffAttribute : Attribute, IAuthorizationFilter
{
    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var user = GetCurrentUser(context.HttpContext);
        if (user != null && StayAuthService.IsStaff(user))
        {
            context.HttpContext.Items["appointzastay_current_user"] = user;
            return;
        }

        context.Result = new JsonResult(new { message = "Staff authentication required" })
        {
            StatusCode = StatusCodes.Status401Unauthorized,
        };
    }

    internal static User? GetCurrentUser(HttpContext context)
    {
        if (context.Items["appointzastay_current_user"] is User cached)
            return cached;

        if (context.Items["appointzastay_usercontext"] is AppointzaStayUserContext stayCtx
            && !string.IsNullOrEmpty(stayCtx.userId))
        {
            var data = context.RequestServices.GetRequiredService<AppDataStore>();
            return data.Users.FirstOrDefault(u => u.Id == stayCtx.userId);
        }

        return null;
    }
}
