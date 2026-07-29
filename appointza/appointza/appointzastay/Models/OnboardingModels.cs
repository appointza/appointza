namespace appointza.Models.AppointzaStay;

public class OrganisationOnboardingState
{
    public bool BannerDismissed { get; set; }
    public DateTime? BannerDismissedAt { get; set; }
    /// <summary>Step ids the user completed or skipped during onboarding.</summary>
    public List<string> CompletedSteps { get; set; } = [];
    public string? CurrentStepId { get; set; }
}

public class OnboardingStep
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public bool IsComplete { get; set; }
    public string ActionLabel { get; set; } = "Open";
    public string Controller { get; set; } = "";
    public string Action { get; set; } = "";
    public object? RouteValues { get; set; }
    /// <summary>Organisation profile section id when this step maps to /staff/organisation.</summary>
    public string? SectionId { get; set; }
    /// <summary>React staff route for this step.</summary>
    public string? Href { get; set; }
    public string Group { get; set; } = "";
    public bool Required { get; set; } = true;
    public string StepType { get; set; } = "profile";
}

public class OnboardingProgress
{
    public IReadOnlyList<OnboardingStep> Steps { get; set; } = [];
    public string? CurrentStepId { get; set; }
    public int CompletedCount => Steps.Count(s => s.IsComplete);
    public int TotalCount => Steps.Count;
    public int RequiredCount => Steps.Count(s => s.Required);
    public int RequiredCompletedCount => Steps.Count(s => s.Required && s.IsComplete);
    public int Percent => TotalCount == 0 ? 0 : (int)Math.Round(100.0 * CompletedCount / TotalCount);
    public bool IsComplete => RequiredCount > 0 && RequiredCompletedCount >= RequiredCount;
}
