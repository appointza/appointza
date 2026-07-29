using appointza.Filters.AppointzaStay;
using appointza.Models;
using StayModels = appointza.Models.AppointzaStay;
using appointza.Services.AppointzaStay;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers.AppointzaStay;

[Route("api/appointzastay/[controller]")]
[ApiController]
[RequireStaff]
public class DashboardController : ControllerBase
{
    private readonly OrganisationService _org;
    private readonly RoomService _rooms;
    private readonly UserService _users;
    private readonly CustomerService _customers;
    private readonly PackageService _packages;
    private readonly OnboardingService _onboarding;

    public DashboardController(
        OrganisationService org,
        RoomService rooms,
        UserService users,
        CustomerService customers,
        PackageService packages,
        OnboardingService onboarding)
    {
        _org = org;
        _rooms = rooms;
        _users = users;
        _customers = customers;
        _packages = packages;
        _onboarding = onboarding;
    }

    [HttpGet("Index")]
    public ActionResult<ActionRes<object>> Index()
    {
        var org = _org.Get();
        var roomCount = _rooms.GetAll().Count;
        var packageCount = _packages.GetAll().Count;

        return Ok(new ActionRes<object>
        {
            item = new
            {
                organisation = org,
                stats = new StayModels.DashboardStatsDto
                {
                    rooms = roomCount,
                    users = _users.GetAll().Count,
                    customers = _customers.GetAll().Count,
                    packages = packageCount,
                },
                onboarding = MapOnboarding(_onboarding.GetProgress(org, roomCount, packageCount)),
            },
        });
    }

    private static object MapOnboarding(StayModels.OnboardingProgress progress) => new
    {
        steps = progress.Steps.Select(s => new
        {
            id = s.Id,
            title = s.Title,
            description = s.Description,
            done = s.IsComplete,
            isComplete = s.IsComplete,
            label = s.Title,
            actionLabel = s.ActionLabel,
            sectionId = s.SectionId,
            href = s.Href,
            group = s.Group,
            required = s.Required,
            stepType = s.StepType,
        }),
        percent = progress.Percent,
        completedCount = progress.CompletedCount,
        totalCount = progress.TotalCount,
        isComplete = progress.IsComplete,
        currentStepId = progress.CurrentStepId,
    };

    [HttpGet("Onboarding")]
    public ActionResult<ActionRes<object>> Onboarding()
    {
        var org = _org.Get();
        var roomCount = _rooms.GetAll().Count;
        var packageCount = _packages.GetAll().Count;
        var progress = _onboarding.GetProgress(org, roomCount, packageCount);

        return Ok(new ActionRes<object>
        {
            item = new
            {
                organisation = org,
                roomCount,
                packageCount,
                onboarding = MapOnboarding(progress),
            },
        });
    }

    [HttpPost("MarkOnboardingStep")]
    public ActionResult<ActionRes<object>> MarkOnboardingStep(ActionReq<StayModels.MarkOnboardingStepReq> req)
    {
        var roomCount = _rooms.GetAll().Count;
        var packageCount = _packages.GetAll().Count;
        _onboarding.MarkStep(req.item.stepId, req.item.skipped, roomCount, packageCount);
        var org = _org.Get();
        var progress = _onboarding.GetProgress(org, roomCount, packageCount);

        return Ok(new ActionRes<object>
        {
            item = new
            {
                onboarding = MapOnboarding(progress),
            },
        });
    }

    [HttpPost("SetOnboardingStep")]
    public ActionResult<ActionRes<object>> SetOnboardingStep(ActionReq<StayModels.MarkOnboardingStepReq> req)
    {
        _onboarding.SetCurrentStep(req.item.stepId);
        var org = _org.Get();
        var roomCount = _rooms.GetAll().Count;
        var packageCount = _packages.GetAll().Count;
        var progress = _onboarding.GetProgress(org, roomCount, packageCount);
        return Ok(new ActionRes<object>
        {
            item = new { onboarding = MapOnboarding(progress) },
        });
    }

    [HttpPost("DismissOnboardingBanner")]
    public ActionResult<ActionRes<bool>> DismissOnboardingBanner()
    {
        _onboarding.DismissBanner();
        return Ok(new ActionRes<bool> { item = true });
    }
}
