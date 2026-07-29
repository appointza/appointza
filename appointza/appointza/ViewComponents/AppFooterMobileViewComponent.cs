using Microsoft.AspNetCore.Mvc;
using appointza.Models;
using appointza.Services;
using appointza.Utils;
using appointza.ViewModels;

namespace appointza.ViewComponents
{
    public class AppFooterMobileViewComponent : ViewComponent
    {
        RequestState requeststate;
        public AppFooterMobileViewComponent(RequestState requeststate)
        {
            this.requeststate = requeststate;
           
        }
        public async Task<IViewComponentResult> InvokeAsync()
        {
            AppFooterMobileViewModel data = new AppFooterMobileViewModel();
            

            return View(data);
        }
    }
}
