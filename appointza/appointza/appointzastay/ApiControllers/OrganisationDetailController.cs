using System.Text.Json;
using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
[RequireStaff]
public class OrganisationDetailController : ControllerBase
{
    private readonly OrganisationService _org;
    private readonly UserService _users;
    private readonly RoomService _rooms;
    private readonly AssetService _assets;

    public OrganisationDetailController(
        OrganisationService org,
        UserService users,
        RoomService rooms,
        AssetService assets)
    {
        _org = org;
        _users = users;
        _rooms = rooms;
        _assets = assets;
    }

    [HttpGet("Index")]
    public ActionResult<ActionRes<object>> Index(string? section, string? edit, string? saved)
    {
        return Ok(new ActionRes<object> { item = BuildPagePayload(section, edit, saved) });
    }

    [HttpPost("SaveBasic")]
    public ActionResult<ActionRes<bool>> SaveBasic(ActionReq<StayModels.OrganisationBasicSaveReq> req)
    {
        try
        {
            _org.SaveBasic(
                req.item.name,
                req.item.tagline,
                req.item.description,
                req.item.slug,
                req.item.propertyType,
                req.item.bookingType,
                req.item.minimumHours);
            return Ok(new ActionRes<bool> { item = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("SaveLocation")]
    public ActionResult<ActionRes<bool>> SaveLocation(ActionReq<StayModels.OrganisationLocationSaveReq> req)
    {
        _org.SaveLocation(req.item.address, req.item.city, req.item.state, req.item.country, req.item.pincode, req.item.latitude, req.item.longitude);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveContact")]
    public ActionResult<ActionRes<bool>> SaveContact(ActionReq<StayModels.OrganisationContactSaveReq> req)
    {
        _org.SaveContact(req.item.phone, req.item.whatsapp, req.item.email, req.item.mapEmbedUrl, req.item.directionsUrl, req.item.whatsappLabel);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SavePolicies")]
    public ActionResult<ActionRes<bool>> SavePolicies(ActionReq<StayModels.OrganisationPoliciesSaveReq> req)
    {
        _org.SavePolicies(req.item.checkInTime, req.item.checkOutTime, req.item.cancellationPolicy, req.item.paymentPolicy,
            req.item.petPolicy, req.item.idProofRequired, req.item.refundPolicy, req.item.houseRules,
            req.item.overnightTimeMode, req.item.bookingType, req.item.minimumHours);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveWebsite")]
    public ActionResult<ActionRes<bool>> SaveWebsite(ActionReq<StayModels.OrganisationWebsiteSaveReq> req)
    {
        try
        {
            _org.SaveWebsite(req.item.subdomain, req.item.websiteUrl, req.item.logoAssetId);
            return Ok(new ActionRes<bool> { item = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("SaveSeo")]
    public ActionResult<ActionRes<bool>> SaveSeo(ActionReq<StayModels.OrganisationSeoSaveReq> req)
    {
        _org.SaveSeo(req.item.metaTitle, req.item.metaDescription, req.item.keywords, req.item.ogImageUrl, req.item.ogImageAssetId);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveMessaging")]
    public ActionResult<ActionRes<bool>> SaveMessaging(ActionReq<StayModels.OrganisationMessagingSettings> req)
    {
        _org.SaveMessaging(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SavePaymentGateway")]
    public ActionResult<ActionRes<bool>> SavePaymentGateway(ActionReq<StayModels.OrganisationPaymentGatewaySettings> req)
    {
        _org.SavePaymentGateway(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveWeather")]
    public ActionResult<ActionRes<bool>> SaveWeather(ActionReq<StayModels.OrganisationWeatherSaveReq> req)
    {
        _org.SaveWeatherShowOnSite(req.item?.showOnSite ?? false);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveHighlights")]
    public ActionResult<ActionRes<bool>> SaveHighlights(ActionReq<List<StayModels.PropertyHighlight>> req)
    {
        _org.SaveHighlights(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveAmenities")]
    public ActionResult<ActionRes<bool>> SaveAmenities(ActionReq<List<StayModels.PropertyAmenityItem>> req)
    {
        _org.SaveAmenities(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SavePackages")]
    public ActionResult<ActionRes<bool>> SavePackages(ActionReq<List<StayModels.PropertyPackage>> req)
    {
        _org.SavePackages(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveGuestServices")]
    public ActionResult<ActionRes<bool>> SaveGuestServices(ActionReq<List<StayModels.PropertyGuestService>> req)
    {
        _org.SaveGuestServices(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveOffers")]
    public ActionResult<ActionRes<bool>> SaveOffers(ActionReq<List<StayModels.PropertyOffer>> req)
    {
        _org.SaveOffers(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveImages")]
    public ActionResult<ActionRes<bool>> SaveImages(ActionReq<List<StayModels.PropertyImage>> req)
    {
        _org.SaveImages(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveNearby")]
    public ActionResult<ActionRes<bool>> SaveNearby(ActionReq<List<StayModels.PropertyNearbyPlace>> req)
    {
        _org.SaveNearby(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveSlots")]
    public ActionResult<ActionRes<bool>> SaveSlots(ActionReq<List<StayModels.PropertySlot>> req)
    {
        _org.SaveSlots(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveClosures")]
    public ActionResult<ActionRes<bool>> SaveClosures(ActionReq<List<StayModels.PropertyClosure>> req)
    {
        _org.SaveClosures(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveActivities")]
    public ActionResult<ActionRes<bool>> SaveActivities(ActionReq<List<StayModels.PropertyActivity>> req)
    {
        _org.SaveActivities(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveReviews")]
    public ActionResult<ActionRes<bool>> SaveReviews(ActionReq<List<StayModels.PropertyReview>> req)
    {
        _org.SaveReviews(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveFoodMenu")]
    public ActionResult<ActionRes<bool>> SaveFoodMenu(ActionReq<List<StayModels.PropertyFoodItem>> req)
    {
        _org.SaveFoodMenu(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveTravel")]
    public ActionResult<ActionRes<bool>> SaveTravel(ActionReq<List<StayModels.PropertyTravelRoute>> req)
    {
        _org.SaveTravel(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SaveFaq")]
    public ActionResult<ActionRes<bool>> SaveFaq(ActionReq<List<StayModels.PropertyFaqItem>> req)
    {
        _org.SaveFaq(req.item);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("UploadLogo")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ActionRes<bool>>> UploadLogo(
        [FromForm] IFormFile? file, [FromForm] string? title, [FromForm] string? replaceLogo)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { error = "Choose a logo image to upload." });

            var org = _org.Get();
            var logoTitle = string.IsNullOrWhiteSpace(title) ? $"{org.Name} Logo" : title.Trim();
            var asset = await _assets.SaveUploadAsync(file, logoTitle, StayModels.AssetCategory.logo, notes: null, replaceAssetId: replaceLogo);
            _assets.SetOrganizationLogo(asset.Id);
            _org.SyncImageLibrary();
            return Ok(new ActionRes<bool> { item = true });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("UploadImages")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ActionRes<bool>>> UploadImages([FromForm] StayModels.UploadImagesForm form)
    {
        try
        {
            var files = form.Files;
            if (files == null || files.Count == 0)
                return BadRequest(new { error = "Choose at least one image to upload." });
            if (!StayModels.AssetCatalog.TryParseCategory(form.Category, out var assetCategory))
                return BadRequest(new { error = "Invalid image category." });
            if (assetCategory == StayModels.AssetCategory.logo)
                return BadRequest(new { error = "Use UploadLogo for logo images." });

            var uploaded = 0;
            foreach (var file in files)
            {
                if (file.Length == 0) continue;
                var title = string.IsNullOrWhiteSpace(form.TitlePrefix)
                    ? Path.GetFileNameWithoutExtension(file.FileName)
                    : files.Count == 1 ? form.TitlePrefix.Trim() : $"{form.TitlePrefix.Trim()} {uploaded + 1}";
                await _assets.SaveUploadAsync(file, title, assetCategory, notes: form.Notes);
                uploaded++;
            }

            if (uploaded == 0)
                return BadRequest(new { error = "No valid images were uploaded." });

            _org.SyncImageLibrary();
            return Ok(new ActionRes<bool> { item = true });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("AddImageUrl")]
    public ActionResult<ActionRes<bool>> AddImageUrl(ActionReq<StayModels.AssetUrlSaveReq> req)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(req.item.title) || string.IsNullOrWhiteSpace(req.item.url))
                return BadRequest(new { error = "Title and image URL are required." });
            if (req.item.category == StayModels.AssetCategory.logo)
                return BadRequest(new { error = "Use UploadLogo for logo images." });

            _assets.AddUrlAsset(req.item.title.Trim(), req.item.category, req.item.url.Trim(), req.item.notes);
            _org.SyncImageLibrary();
            return Ok(new ActionRes<bool> { item = true });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("RemoveImageAsset")]
    public ActionResult<ActionRes<bool>> RemoveImageAsset(ActionReq<StayModels.RoomIdReq> req)
    {
        _org.RemoveImageAsset(req.item.id);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("ClearLogo")]
    public ActionResult<ActionRes<bool>> ClearLogo()
    {
        _org.ClearLogo();
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpPost("SetLogoAsset")]
    public ActionResult<ActionRes<bool>> SetLogoAsset(ActionReq<StayModels.OrganisationWebsiteSaveReq> req)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(req.item.logoAssetId))
                _org.ClearLogo();
            else
                _assets.SetOrganizationLogo(req.item.logoAssetId);

            _org.SyncImageLibrary();
            return Ok(new ActionRes<bool> { item = true });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private object BuildPagePayload(string? section, string? edit, string? saved)
    {
        var user = RequireStaffAttribute.GetCurrentUser(HttpContext)!;
        var org = _org.Get();
        var active = StayModels.ProfileSectionCatalog.Normalize(edit ?? section);

        return new
        {
            organisation = StaffOrganisationView(org),
            currentUser = user,
            owner = _users.GetById(org.OwnerId),
            roomCount = _rooms.GetAll().Count,
            logoUrl = org.LogoAssetId != null ? _assets.GetAsset(org.LogoAssetId)?.Url : null,
            assets = org.Assets ?? [],
            activeSection = active,
            sectionDef = StayModels.ProfileSectionCatalog.Get(active),
            editSection = !string.IsNullOrWhiteSpace(edit) ? active : null,
            savedSection = saved,
        };
    }

    private object StaffOrganisationView(StayModels.Organisation org) => new
    {
        org.Id,
        org.OwnerId,
        org.Name,
        propertyType = org.PropertyType.ToString(),
        bookingType = org.BookingType.ToString(),
        org.MinimumHours,
        org.Slug,
        org.Tagline,
        org.Description,
        org.Address,
        org.City,
        org.State,
        org.Country,
        org.Pincode,
        org.Latitude,
        org.Longitude,
        org.Phone,
        org.WhatsApp,
        org.Email,
        org.CheckInTime,
        org.CheckOutTime,
        org.OvernightTimeMode,
        org.CancellationPolicy,
        org.PaymentPolicy,
        org.Rules,
        org.Highlights,
        org.Amenities,
        org.Images,
        org.NearbyPlaces,
        org.Activities,
        org.Packages,
        org.GuestServices,
        org.Offers,
        org.Reviews,
        org.FoodMenu,
        org.TravelInfo,
        org.Faq,
        org.Slots,
        org.Closures,
        org.Weather,
        org.ContactInfo,
        org.Seo,
        org.Messaging,
        paymentGateway = _org.GetPaymentGatewayForStaff(),
        org.Onboarding,
        org.WebsiteUrl,
        org.Subdomain,
        org.LogoAssetId,
        org.Assets,
        org.Website,
        org.CreatedAt,
        org.UpdatedAt,
        org.CustomDomain,
        org.CustomDomainUrl,
    };
}
