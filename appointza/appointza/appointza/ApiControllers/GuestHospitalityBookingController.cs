using appointza.Models;
using appointza.Models.Hospitality;
using appointza.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GuestHospitalityBookingController : ControllerBase
    {
        readonly ILogger<GuestHospitalityBookingController> logger;
        readonly GuestHospitalityBookingService guestHospitalityBookingService;

        public GuestHospitalityBookingController(
            ILogger<GuestHospitalityBookingController> logger,
            GuestHospitalityBookingService guestHospitalityBookingService)
        {
            this.logger = logger;
            this.guestHospitalityBookingService = guestHospitalityBookingService;
        }

        [HttpGet("Index")]
        [AllowAnonymous]
        public async Task<ActionResult<ActionRes<object>>> Index(
            long organisationId,
            long organisationLocationId,
            string? roomId = null,
            string? packageId = null,
            string? checkIn = null,
            string? checkOut = null,
            string? checkInTime = null,
            string? checkOutTime = null)
        {
            try
            {
                var item = await guestHospitalityBookingService.Index(new GuestHospitalityBookingIndexReq
                {
                    organisation_id = organisationId,
                    organisation_location_id = organisationLocationId,
                    room_id = roomId,
                    package_id = packageId,
                    check_in = checkIn,
                    check_out = checkOut,
                    check_in_time = checkInTime,
                    check_out_time = checkOutTime,
                });
                return Ok(new ActionRes<object> { item = item });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ActionRes<object> { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GuestHospitalityBooking Index failed");
                return BadRequest(new ActionRes<object> { error = ex.Message });
            }
        }

        [HttpGet("Quote")]
        [AllowAnonymous]
        public async Task<ActionResult<ActionRes<HospitalityBookingQuote>>> Quote(
            long organisationId,
            long organisationLocationId,
            string checkIn,
            string checkOut,
            string? roomId = null,
            int persons = 2,
            int extraBeds = 0,
            string? packageIds = null,
            string? serviceIds = null,
            string? checkInTime = null,
            string? checkOutTime = null)
        {
            try
            {
                var quote = await guestHospitalityBookingService.Quote(new GuestHospitalityBookingQuoteReq
                {
                    organisation_id = organisationId,
                    organisation_location_id = organisationLocationId,
                    check_in = checkIn,
                    check_out = checkOut,
                    room_id = roomId,
                    persons = persons,
                    extra_beds = extraBeds,
                    package_ids = SplitIds(packageIds),
                    guest_service_ids = SplitIds(serviceIds),
                    check_in_time = checkInTime,
                    check_out_time = checkOutTime,
                });
                return Ok(new ActionRes<HospitalityBookingQuote> { item = quote });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ActionRes<HospitalityBookingQuote> { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GuestHospitalityBooking Quote failed");
                return BadRequest(new ActionRes<HospitalityBookingQuote> { error = ex.Message });
            }
        }

        [HttpPost("Create")]
        [AllowAnonymous]
        public async Task<ActionResult<ActionRes<GuestHospitalityBookingResult>>> Create(
            ActionReq<GuestHospitalityBookingCreateReq>? req)
        {
            if (req?.item == null)
                return BadRequest(new ActionRes<GuestHospitalityBookingResult> { error = "Booking payload is required." });

            try
            {
                var result = await guestHospitalityBookingService.Create(req.item);
                return Ok(new ActionRes<GuestHospitalityBookingResult> { item = result });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new ActionRes<GuestHospitalityBookingResult> { error = ex.Message });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "GuestHospitalityBooking Create failed");
                return BadRequest(new ActionRes<GuestHospitalityBookingResult> { error = ex.Message });
            }
        }

        static List<string>? SplitIds(string? value) =>
            string.IsNullOrWhiteSpace(value)
                ? null
                : value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
    }
}
