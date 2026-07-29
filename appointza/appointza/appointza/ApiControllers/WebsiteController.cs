using appointza.Models;
using appointza.Services;
using appointza.Utils;
using appointza.Authentication.Utils;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WebsiteController : ControllerBase
    {
        ILogger<WebsiteController> logger;
        WebsiteService websiteService;
        RequestState requestState;
        ReferenceValueService referenceValueService;
        
        public WebsiteController(ILogger<WebsiteController> logger, WebsiteService websiteService, RequestState requestState, ReferenceValueService referenceValueService)
        {
            this.logger = logger;
            this.websiteService = websiteService;
            this.requestState = requestState;
            this.referenceValueService = referenceValueService;
        }

        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Website>>> Entity()
        {
            ActionRes<Website> result = new ActionRes<Website>()
            {
                item = new Website()
            };

            return Ok(result);
        }

        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Website>>>> Select(ActionReq<WebsiteSelectReq> req)
        {
            ActionRes<List<Website>> result = new ActionRes<List<Website>>();

            try
            {
                // If user_id is not provided, use current user from context
                if (req.item.user_id <= 0 && requestState.usercontext != null)
                {
                    req.item.user_id = requestState.usercontext.userid;
                }

                result.item = await websiteService.Select(req.item);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error selecting websites");
                return BadRequest(new { error = ex.Message, message = "Error fetching websites" });
            }

            return Ok(result);
        }

        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Website>>> Insert(ActionReq<Website> req)
        {
            ActionRes<Website> result = new ActionRes<Website>();

            try
            {
                // Set user_id from context if not provided
                if (req.item.user_id <= 0 && requestState.usercontext != null)
                {
                    req.item.user_id = requestState.usercontext.userid;
                }

                result.item = await websiteService.Insert(req.item);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error inserting website");
                return BadRequest(new { error = ex.Message, message = "Error creating website" });
            }

            return Ok(result);
        }

        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Website>>> Update(ActionReq<Website> req)
        {
            ActionRes<Website> result = new ActionRes<Website>();

            try
            {
                // Set user_id from context if not provided
                if (req.item.user_id <= 0 && requestState.usercontext != null)
                {
                    req.item.user_id = requestState.usercontext.userid;
                }

                await websiteService.Update(req.item);
                result.item = req.item;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error updating website");
                return BadRequest(new { error = ex.Message, message = "Error updating website" });
            }

            return Ok(result);
        }

        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Website>>> Save(ActionReq<Website> req)
        {
            ActionRes<Website> result = new ActionRes<Website>();

            try
            {
                // Set user_id from context if not provided
                if (req.item.user_id <= 0 && requestState.usercontext != null)
                {
                    req.item.user_id = requestState.usercontext.userid;
                }

                if (req.item.id > 0)
                {
                    await websiteService.Update(req.item);
                    result.item = req.item;
                }
                else
                {
                    result.item = await websiteService.Insert(req.item);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error saving website");
                return BadRequest(new { error = ex.Message, message = "Error saving website" });
            }

            return Ok(result);
        }

        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<WebsiteDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            try
            {
                // Set user_id from context if not provided
                if (req.item.user_id <= 0 && requestState.usercontext != null)
                {
                    req.item.user_id = requestState.usercontext.userid;
                }

                result.item = await websiteService.Delete(req.item);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error deleting website");
                return BadRequest(new { error = ex.Message, message = "Error deleting website" });
            }

            return Ok(result);
        }

        [HttpPost("MarkExportPaymentSuccess")]
        [Authenticate]
        public async Task<ActionResult<ActionRes<Website>>> MarkExportPaymentSuccess(ActionReq<WebsiteExportPaymentSuccessReq> req)
        {
            ActionRes<Website> result = new ActionRes<Website>();

            try
            {
                // Verify user owns the website
                var websiteReq = new WebsiteSelectReq { id = req.item.website_id };
                if (requestState.usercontext != null)
                {
                    websiteReq.user_id = requestState.usercontext.userid;
                }
                
                var websites = await websiteService.Select(websiteReq);
                var website = websites.FirstOrDefault();

                if (website == null)
                {
                    return NotFound(new { message = "Website not found" });
                }

                // Verify user owns the website
                if (requestState.usercontext != null && website.user_id != requestState.usercontext.userid)
                {
                    return Unauthorized(new { message = "Unauthorized" });
                }

                // Mark payment as successful
                website.export_paid = true;
                website.export_payment_date = DateTime.UtcNow;
                website.export_payment_order_id = req.item.order_id;

                await websiteService.Update(website);
                result.item = website;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error marking export payment as successful");
                return BadRequest(new { error = ex.Message, message = "Error updating payment status" });
            }

            return Ok(result);
        }

        [HttpPost("SaveExportedHtml")]
        [Authenticate]
        public async Task<ActionResult<ActionRes<ReferenceValue>>> SaveExportedHtml(ActionReq<WebsiteExportHtmlSaveReq> req)
        {
            ActionRes<ReferenceValue> result = new ActionRes<ReferenceValue>();

            try
            {
                // Get user context
                if (requestState.usercontext == null || requestState.usercontext.userid <= 0)
                {
                    return Unauthorized(new { message = "Unauthorized" });
                }

                // Get organization ID from user context
                int organizationId = (int)(requestState.usercontext.organisationid > 0 ? requestState.usercontext.organisationid : 0);

                // Verify user owns the website
                var websiteReq = new WebsiteSelectReq { id = req.item.website_id };
                websiteReq.user_id = requestState.usercontext.userid;
                
                var websites = await websiteService.Select(websiteReq);
                var website = websites.FirstOrDefault();

                if (website == null)
                {
                    return NotFound(new { message = "Website not found" });
                }

                // Use project name (website name) as identifier and displaytext
                string projectName = req.item.website_name ?? $"Website Export - {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}";
                string identifier = projectName;
                
                // Check if a ReferenceValue record already exists for this website
                // Search by identifier (project name), organisationid, and referencetypeid
                var existingRecords = await referenceValueService.Select(new ReferenceValueSelectReq
                {
                    identifier = identifier,
                    organisationid = organizationId,
                    referencetypeid = 5
                });
                
                var existingRecord = existingRecords.FirstOrDefault();
                
                if (existingRecord != null)
                {
                    // Update existing record
                    existingRecord.identifier = projectName;
                    existingRecord.displaytext = projectName;
                    existingRecord.description = req.item.html_content;
                    existingRecord.notes = $"Exported website: {req.item.website_name} (ID: {req.item.website_id}) - Last updated: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}";
                    existingRecord.isactive = true;
                    
                    await referenceValueService.Update(existingRecord);
                    result.item = existingRecord;
                }
                else
                {
                    // Create new ReferenceValue record
                    var referenceValue = new ReferenceValue
                    {
                        identifier = projectName,
                        displaytext = projectName,
                        description = req.item.html_content,
                        langcode = "en",
                        organizationid = organizationId,
                        referencetypeid = 5,
                        isactive = true,
                        issuspended = false,
                        parentid = 0,
                        isfactory = false,
                        notes = $"Exported website: {req.item.website_name} (ID: {req.item.website_id})"
                    };

                    result.item = await referenceValueService.Insert(referenceValue);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error saving exported HTML to ReferenceValue");
                return BadRequest(new { error = ex.Message, message = "Error saving exported HTML" });
            }

            return Ok(result);
        }
    }
}

