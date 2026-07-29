using Microsoft.AspNetCore.Mvc;
using appointza.Services;
using appointza.Utils;
using appointza.ViewModels;
using appointza.Models;
using Amazon.Util.Internal.PlatformServices;


namespace appointza.ViewComponents
{
    public class AppHeaderViewComponent : ViewComponent
    {
        private RequestState _requestState;
        
        public AppHeaderViewComponent(RequestState requestState)
        {
            _requestState = requestState;
           
        }
        public async Task<IViewComponentResult> InvokeAsync()
        {
            AppHeaderViewModel data = new AppHeaderViewModel();
           
            return View(data);
        }
    }
}
