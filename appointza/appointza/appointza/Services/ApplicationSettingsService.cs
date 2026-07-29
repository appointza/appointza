using appointza.Models;
using appointza.Utils;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using System.Linq;

namespace appointza.Services
{
    public class ApplicationSettingsService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        ApplicationEnvironment applicationEnvironment;

        public ApplicationSettingsService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate, IOptions<ApplicationEnvironment> applicationEnvironment)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.applicationEnvironment = applicationEnvironment.Value;
        }

        public async Task<List<ApplicationSettings>> Select(ApplicationSettingsSelectReq req)
        {
            List<ApplicationSettings> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }

        public async Task<List<ApplicationSettings>> SelectTransaction(IDb db, ApplicationSettingsSelectReq req)
        {
            // Get payment credentials from appsettings.json (ApplicationEnvironment)
            var result = new List<ApplicationSettings>
            {
                new ApplicationSettings
                {
                    settings = new ApplicationSettingsData
                    {
                        paymentsettings = new PaymentSettings
                        {
                            razorpayconfig = new RazorpayConfig
                            {
                                appkey = applicationEnvironment.razorpay?.key_id ?? "",
                                appsecret = applicationEnvironment.razorpay?.key_secret ?? "",
                                produrl = applicationEnvironment.razorpay?.is_test_mode == true 
                                    ? "https://api.razorpay.com/v1/" 
                                    : "https://api.razorpay.com/v1/"
                            },
                            phonepeconfig = new PhonePeConfig
                            {
                                url = "",
                                basehref = "",
                                merchantid = "",
                                saltkey = "",
                                saltindex = ""
                            }
                        }
                    }
                }
            };
            return result;
        }
    }
}

