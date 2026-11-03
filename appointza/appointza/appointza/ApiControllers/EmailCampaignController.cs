using appointza.Authentication.Utils;
using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.ApiControllers
{
    [ApiController]
    [Route("api/crm/email/campaigns")]
    [Authenticate]
    public class EmailCampaignController : ControllerBase
    {
        private readonly EmailCampaignService _campaigns;
        private readonly OrganisationEmailMailService _mail;

        public EmailCampaignController(EmailCampaignService campaigns, OrganisationEmailMailService mail)
        {
            _campaigns = campaigns;
            _mail = mail;
        }

        [HttpGet]
        public async Task<ActionResult<ActionRes<List<EmailCampaignDto>>>> List(
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] int limit = 50,
            [FromQuery] int offset = 0)
        {
            try
            {
                var item = await _campaigns.Select(new EmailCampaignSelectReq
                {
                    search = search ?? "",
                    status = status ?? "",
                    limit = limit,
                    offset = offset,
                });
                return Ok(new ActionRes<List<EmailCampaignDto>> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:long}")]
        public async Task<ActionResult<ActionRes<EmailCampaignDto>>> Get(long id)
        {
            try
            {
                var item = await _campaigns.GetById(id);
                if (item == null) return NotFound(new { success = false, message = "Campaign not found." });
                return Ok(new ActionRes<EmailCampaignDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("{id:long}/recipients")]
        public async Task<ActionResult<ActionRes<List<EmailCampaignRecipientDto>>>> Recipients(long id)
        {
            try
            {
                var item = await _campaigns.ListRecipients(id);
                return Ok(new ActionRes<List<EmailCampaignRecipientDto>> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ActionRes<EmailCampaignDto>>> Create([FromBody] EmailCampaignUpsertReq? body)
        {
            try
            {
                var item = await _campaigns.Create(body ?? new EmailCampaignUpsertReq());
                return Ok(new ActionRes<EmailCampaignDto> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("{id:long}/send")]
        public async Task<ActionResult<ActionRes<EmailSendResult>>> Send(long id)
        {
            try
            {
                var item = await _campaigns.SendNow(id);
                return Ok(new ActionRes<EmailSendResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("test-send")]
        public async Task<ActionResult<ActionRes<EmailSendResult>>> TestSend([FromBody] EmailTestSendReq? body)
        {
            try
            {
                var item = await _campaigns.TestSend(body ?? new EmailTestSendReq());
                return Ok(new ActionRes<EmailSendResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("inbox/sync")]
        public async Task<ActionResult<ActionRes<EmailInboxSyncResult>>> SyncInbox([FromQuery] int limit = 40)
        {
            try
            {
                var item = await _mail.SyncInbox(limit);
                return Ok(new ActionRes<EmailInboxSyncResult> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("inbox")]
        public async Task<ActionResult<ActionRes<List<EmailMessageDto>>>> Inbox([FromQuery] int limit = 50)
        {
            try
            {
                var item = await _mail.ListMessages(limit);
                return Ok(new ActionRes<List<EmailMessageDto>> { item = item });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
