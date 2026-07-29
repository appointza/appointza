using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using appointza.Models;
using System.Linq;
using System.Reflection;

namespace appointza.Authentication.Utils
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
    public class AuthenticateAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            if (AllowsAnonymous(context))
                return;

            var user = (UsersContext)context.HttpContext.Items["usercontext"];
            if (user == null)
            {
                context.Result = new JsonResult(new { message = "Unauthorized" }) { StatusCode = StatusCodes.Status401Unauthorized };
                return;
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

