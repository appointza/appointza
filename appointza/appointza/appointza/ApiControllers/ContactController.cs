using Microsoft.AspNetCore.Mvc;
using appointza.Models;
using appointza.Services;
using appointza.Utils;

namespace appointza.Controllers
{
    /// <summary>
    /// Public marketing-site Contact Us form. Saved into the existing
    /// `enquiries` table with source = "contact_us" so the team can triage.
    /// </summary>
    [Route("api/contact")]
    [ApiController]
    public class ContactController : ControllerBase
    {
        readonly ILogger<ContactController> logger;
        readonly EnquiryService enquiryService;
        readonly RequestState requeststate;

        public ContactController(
            ILogger<ContactController> logger,
            EnquiryService enquiryService,
            RequestState requeststate)
        {
            this.logger = logger;
            this.enquiryService = enquiryService;
            this.requeststate = requeststate;
        }

        public class ContactFormResponse
        {
            public bool success { get; set; }
            public string message { get; set; } = "";
            public long enquiry_id { get; set; }
        }

        [HttpPost]
        public async Task<ActionResult<ContactFormResponse>> Submit([FromBody] ContactFormRequest req)
        {
            if (req == null)
            {
                return BadRequest(new ContactFormResponse
                {
                    success = false,
                    message = "Request body is required.",
                });
            }

            if (string.IsNullOrWhiteSpace(req.name)
                || string.IsNullOrWhiteSpace(req.email)
                || string.IsNullOrWhiteSpace(req.subject)
                || string.IsNullOrWhiteSpace(req.message))
            {
                return BadRequest(new ContactFormResponse
                {
                    success = false,
                    message = "Name, email, subject and message are required.",
                });
            }

            try
            {
                string subject = (req.subject ?? "").Trim();
                string body = (req.message ?? "").Trim();
                string composedMessage = string.IsNullOrEmpty(subject)
                    ? body
                    : $"[{subject}]\n\n{body}";

                string ip = HttpContext?.Connection?.RemoteIpAddress?.ToString() ?? "";

                // organisation_id resolution order:
                // 1. Explicit organisation_id on the request body
                //    (sent by the frontend when a signed-in org user submits the form).
                // 2. RequestState.usercontext.organisationid — populated by JwtMiddleware
                //    when a valid Bearer token is on the request, even though this
                //    endpoint is anonymous.
                // 3. 0 — anonymous marketing visitor.
                long organisationId = req.organisation_id > 0 ? req.organisation_id : 0;
                if (organisationId <= 0)
                {
                    var ctx = requeststate?.usercontext;
                    if (ctx != null && ctx.organisationid > 0)
                    {
                        organisationId = ctx.organisationid;
                    }
                }

                var enquiry = new Enquiry
                {
                    name = req.name.Trim(),
                    email = req.email.Trim(),
                    mobile = (req.phone ?? "").Trim(),
                    message = composedMessage,
                    notes = $"subject={subject}",
                    source = "contact_us",
                    status = "new",
                    is_active = true,
                    organisation_id = organisationId,
                    ip_address = ip,
                };

                var saved = await enquiryService.Insert(enquiry);

                return Ok(new ContactFormResponse
                {
                    success = true,
                    enquiry_id = saved?.id ?? 0,
                    message = "Thanks for reaching out! Our team will get back to you within 24 hours.",
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Contact form submission failed");
                return StatusCode(500, new ContactFormResponse
                {
                    success = false,
                    message = "Could not save your message right now. Please try again or email us directly.",
                });
            }
        }

        /// <summary>
        /// Friendly response when the page is opened directly via GET so users
        /// don't see a 405 — this also lets quick smoke tests confirm the route is wired.
        /// </summary>
        [HttpGet]
        public IActionResult Probe()
        {
            return Ok(new
            {
                ok = true,
                method = "POST expected",
                fields = new[] { "Name", "Email", "Phone", "Subject", "Message" },
            });
        }
    }
}
