using Microsoft.AspNetCore.Mvc;
using appointza.Models;
using appointza.Services;
using appointza.Utils;
using appointza.ViewModels;

namespace appointza.ViewComponents
{
    public class AppFooterViewComponent : ViewComponent
    {

        RequestState requeststate;
        public AppFooterViewComponent( RequestState requeststate)
        {
            this.requeststate = requeststate;
        }
        public async Task<IViewComponentResult> InvokeAsync()
        {
            AppFooterViewModel data = new AppFooterViewModel();
            
            return View(data);
        }
    }
}
