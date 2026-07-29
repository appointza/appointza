using Microsoft.AspNetCore.Mvc;
using appointza.Models;
using appointza.Services;
using appointza.Utils;
using appointza.ViewModels;

namespace appointza.ViewComponents
{
    public class AppHeaderMobileViewComponent : ViewComponent
    {
        private RequestState _requestState;
        
        public AppHeaderMobileViewComponent(RequestState requestState)
        {
            _requestState = requestState;
            
        }
        public async Task<IViewComponentResult> InvokeAsync()
        {
            AppHeaderMobileViewModel data = new AppHeaderMobileViewModel();
            
            return View(data);
        }
    }
}
