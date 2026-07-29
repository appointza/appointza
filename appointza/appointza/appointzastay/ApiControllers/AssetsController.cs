using System.Text.Json;
using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
[RequireStaff]
public class AssetsController : ControllerBase
{
    private readonly AssetService _assets;

    public AssetsController(AssetService assets) => _assets = assets;

    [HttpPost("SaveOrganization")]
    public ActionResult<ActionRes<bool>> SaveOrganization(ActionReq<StayModels.OrganisationBasicSaveReq> req)
    {
        try
        {
            _assets.SaveOrganization(req.item.name, req.item.tagline, null, null, null);
            return Ok(new ActionRes<bool> { item = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"Could not save organization: {ex.Message}" });
        }
    }

    [HttpPost("SaveSubdomain")]
    public ActionResult<ActionRes<bool>> SaveSubdomain(ActionReq<StayModels.OrganisationWebsiteSaveReq> req)
    {
        try
        {
            _assets.SaveSubdomain(req.item.subdomain ?? "");
            return Ok(new ActionRes<bool> { item = true });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("Upload")]
    public async Task<ActionResult<ActionRes<StayModels.OrganizationAsset>>> Upload(
        IFormFile? file, string title, StayModels.AssetCategory category, string? notes, string? replaceAssetId)
    {
        try
        {
            if (file == null)
                return BadRequest(new { error = "Choose an image file to upload." });

            var asset = await _assets.SaveUploadAsync(file, title, category, notes, replaceAssetId);
            return Ok(new ActionRes<StayModels.OrganizationAsset> { item = asset });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("SaveUrl")]
    public ActionResult<ActionRes<StayModels.OrganizationAsset>> SaveUrl(ActionReq<StayModels.AssetUrlSaveReq> req)
    {
        try
        {
            var asset = string.IsNullOrEmpty(req.item.title)
                ? throw new ArgumentException("Title is required.")
                : _assets.AddUrlAsset(req.item.title, req.item.category, req.item.url, req.item.notes);
            return Ok(new ActionRes<StayModels.OrganizationAsset> { item = asset });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("Delete")]
    public ActionResult<ActionRes<bool>> Delete(ActionReq<StayModels.RoomIdReq> req)
    {
        _assets.DeleteAsset(req.item.id);
        return Ok(new ActionRes<bool> { item = true });
    }

    [HttpGet("List")]
    public ContentResult List()
    {
        var profile = _assets.GetProfile();
        var pickable = _assets.GetPickableImages();
        var payload = new
        {
            organization = new
            {
                profile.Name,
                profile.Tagline,
                profile.WebsiteUrl,
                profile.Subdomain,
                customDomain = profile.CustomDomain,
                customDomainUrl = profile.CustomDomainUrl,
                profile.LogoAssetId,
                logoUrl = profile.LogoAssetId != null ? _assets.GetAsset(profile.LogoAssetId)?.Url : null,
            },
            assets = _assets.GetAssets().Select(a => new
            {
                a.Id,
                a.Title,
                kind = a.Kind.ToString(),
                category = a.Category.ToString(),
                categoryLabel = StayModels.AssetCatalog.CategoryLabel(a.Category),
                a.Url,
                a.FileName,
                a.Notes,
                isImage = StayModels.AssetCatalog.IsImageAsset(a),
            }),
            pickableImages = pickable.Select(i => new
            {
                i.Id,
                i.Title,
                i.Url,
                i.CategoryLabel,
                i.Source,
            }),
        };
        return Content(JsonSerializer.Serialize(payload, appointza.Services.AppointzaStay.JsonOptions.Default), "application/json");
    }
}
