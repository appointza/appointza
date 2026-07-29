
using appointza.Services;
using System.Text;

namespace appointza
{
    public class Preset
    {
        public async Task Start(WebApplication app)
        {
            using (var scope = app.Services.CreateScope())
            {
                Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
                
            }
        }
    }
}
