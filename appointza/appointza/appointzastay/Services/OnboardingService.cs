using appointza.Data.AppointzaStay;
using appointza.Models.AppointzaStay;

namespace appointza.Services.AppointzaStay;

public class OnboardingService
{
    private readonly OrganisationResolver _org;

    private static readonly HashSet<string> OptionalProfileSections = new(StringComparer.OrdinalIgnoreCase)
    {
        // Website / settings extras
        "seo", "messaging", "payments", "weather", "schedule",
        // Entire Content group — can skip during first-time setup
        "highlights", "amenities", "packages", "guest-services", "offers", "images",
        "nearby", "activities", "reviews", "food", "travel", "faq",
    };

    public OnboardingService(OrganisationResolver org) => _org = org;

    public OnboardingProgress GetProgress(Organisation org, int roomCount, int packageCount)
    {
        org.Onboarding ??= new OrganisationOnboardingState();
        org.Onboarding.CompletedSteps ??= [];

        var steps = new List<OnboardingStep>();

        foreach (var section in ProfileSectionCatalog.All)
        {
            var complete = IsStepComplete(org, section.Id);
            steps.Add(new OnboardingStep
            {
                Id = section.Id,
                Title = section.Title,
                Description = DescribeProfileSection(section.Id),
                IsComplete = complete,
                ActionLabel = complete ? "Review" : "Fill in",
                SectionId = section.Id,
                Href = $"/staff/onboarding?step={section.Id}",
                Group = section.Group,
                Required = !OptionalProfileSections.Contains(section.Id),
                StepType = "profile",
            });
        }

        steps.Add(new OnboardingStep
        {
            Id = "rooms",
            Title = "Room definitions",
            Description = "Add at least one room with number, rates, capacity, and amenities.",
            IsComplete = IsStepComplete(org, "rooms", roomCount),
            ActionLabel = roomCount > 0 ? "Review rooms" : "Add room",
            Href = "/staff/onboarding?step=rooms",
            Group = "Operations",
            Required = true,
            StepType = "rooms",
        });

        steps.Add(new OnboardingStep
        {
            Id = "site-builder",
            Title = "Website & launch",
            Description = "Review your auto-built website in the site builder and publish when ready.",
            IsComplete = IsStepComplete(org, "site-builder", roomCount),
            ActionLabel = "Open site builder",
            Href = "/staff/onboarding?step=site-builder",
            Group = "Website",
            Required = true,
            StepType = "site-builder",
        });

        return new OnboardingProgress
        {
            Steps = steps,
            CurrentStepId = ResolveResumeStepId(org, steps),
        };
    }

    public void MarkStep(string stepId, bool skipped = false, int roomCount = 0, int packageCount = 0)
    {
        if (string.IsNullOrWhiteSpace(stepId))
            return;

        var org = _org.Current;
        org.Onboarding ??= new OrganisationOnboardingState();
        org.Onboarding.CompletedSteps ??= [];

        if (!org.Onboarding.CompletedSteps.Contains(stepId, StringComparer.OrdinalIgnoreCase))
            org.Onboarding.CompletedSteps.Add(stepId);

        // Recompute so resume points at the next unfinished step after logout/login.
        var progress = GetProgress(org, roomCount, packageCount);
        org.Onboarding.CurrentStepId = progress.CurrentStepId
            ?? progress.Steps.LastOrDefault()?.Id
            ?? stepId;
        _org.Save(org);
    }

    public void SetCurrentStep(string stepId)
    {
        if (string.IsNullOrWhiteSpace(stepId))
            return;
        var org = _org.Current;
        org.Onboarding ??= new OrganisationOnboardingState();
        org.Onboarding.CurrentStepId = stepId;
        _org.Save(org);
    }

    private static string? ResolveResumeStepId(Organisation org, List<OnboardingStep> steps)
    {
        var saved = org.Onboarding?.CurrentStepId;
        if (!string.IsNullOrWhiteSpace(saved))
        {
            var savedStep = steps.FirstOrDefault(s =>
                string.Equals(s.Id, saved, StringComparison.OrdinalIgnoreCase));
            if (savedStep != null && !savedStep.IsComplete)
                return savedStep.Id;
        }

        return steps.FirstOrDefault(s => !s.IsComplete)?.Id
            ?? steps.FirstOrDefault()?.Id;
    }

    public void DismissBanner()
    {
        var org = _org.Current;
        org.Onboarding.BannerDismissed = true;
        org.Onboarding.BannerDismissedAt = DateTime.UtcNow;
        _org.Save(org);
    }

    private bool IsStepComplete(Organisation org, string stepId, int roomCount = 0)
    {
        org.Onboarding.CompletedSteps ??= [];
        if (org.Onboarding.CompletedSteps.Contains(stepId, StringComparer.OrdinalIgnoreCase))
            return true;

        return stepId switch
        {
            "basic" => HasBasic(org),
            "location" => HasLocation(org),
            "contact" => HasContact(org),
            "policies" => HasPolicies(org),
            "website" => HasWebsite(org),
            "uploads" => HasUploads(org),
            "seo" => HasSeo(org),
            "messaging" => HasMessaging(org),
            "weather" => HasWeather(org),
            "highlights" => org.Highlights.Count > 0,
            "amenities" => org.Amenities.Count > 0,
            "packages" => org.Packages.Count > 0,
            "guest-services" => org.GuestServices.Count > 0,
            "offers" => org.Offers.Count > 0,
            "images" => org.Images.Count > 0,
            "nearby" => org.NearbyPlaces.Count > 0,
            "activities" => org.Activities.Count > 0,
            "reviews" => org.Reviews.Count > 0,
            "food" => org.FoodMenu.Count > 0,
            "travel" => org.TravelInfo.Count > 0 || org.ContactInfo.TravelDistances.Count > 0,
            "faq" => org.Faq.Count > 0,
            "schedule" => org.Slots.Count > 0 || org.Closures.Count > 0,
            "rooms" => roomCount >= 1,
            "site-builder" => org.Website.Blocks.Count > 0,
            _ => false,
        };
    }

    private static bool HasBasic(Organisation org) =>
        !string.IsNullOrWhiteSpace(org.Name)
        && !string.IsNullOrWhiteSpace(org.Description);

    private static bool HasLocation(Organisation org) =>
        !string.IsNullOrWhiteSpace(org.Address)
        && !string.IsNullOrWhiteSpace(org.City)
        && !string.IsNullOrWhiteSpace(org.Country);

    private static bool HasContact(Organisation org) =>
        !string.IsNullOrWhiteSpace(org.Phone)
        && !string.IsNullOrWhiteSpace(org.Email);

    private static bool HasPolicies(Organisation org) =>
        !string.IsNullOrWhiteSpace(org.CheckInTime)
        && !string.IsNullOrWhiteSpace(org.CheckOutTime)
        && !string.IsNullOrWhiteSpace(org.CancellationPolicy);

    private static bool HasWebsite(Organisation org) =>
        !string.IsNullOrWhiteSpace(org.Subdomain) || !string.IsNullOrWhiteSpace(org.WebsiteUrl);

    private static bool HasUploads(Organisation org) =>
        !string.IsNullOrWhiteSpace(org.LogoAssetId);

    private static bool HasSeo(Organisation org) =>
        !string.IsNullOrWhiteSpace(org.Seo.MetaTitle) || !string.IsNullOrWhiteSpace(org.Seo.MetaDescription);

    private static bool HasMessaging(Organisation org) =>
        !string.IsNullOrWhiteSpace(org.Messaging.SmsSenderId)
        || !string.IsNullOrWhiteSpace(org.Messaging.WhatsAppPhoneNumberId);

    private static bool HasWeather(Organisation org) => org.Weather.Configured;

    private static string DescribeProfileSection(string id) => id switch
    {
        "basic" => "Property name, tagline, and description shown on your website.",
        "location" => "Address and map coordinates for guests and directions.",
        "contact" => "Phone, email, and WhatsApp for bookings and enquiries.",
        "policies" => "Check-in/out times, cancellation, and house rules.",
        "schedule" => "Create hourly or overnight slots, and mark leave / closed dates.",
        "website" => "Subdomain and public website URL for your property.",
        "uploads" => "Upload your logo and image library assets.",
        "seo" => "Search engine title, description, and social preview image.",
        "messaging" => "SMS and WhatsApp templates for guest communication.",
        "weather" => "Choose whether to show live weather on your site (fetched from your property location).",
        "highlights" => "Optional — key selling points for why guests choose your property.",
        "amenities" => "Facilities and services you offer.",
        "packages" => "Stay packages (weekend, honeymoon, corporate, etc.).",
        "guest-services" => "Optional add-ons guests can request — birthday cake, balloons, flowers, and more.",
        "offers" => "Limited-time deals and seasonal promotions.",
        "images" => "Property photos for gallery and hero sections.",
        "nearby" => "Attractions and landmarks close to your property.",
        "activities" => "Things guests can do during their stay.",
        "reviews" => "Guest testimonials and star ratings.",
        "food" => "Dining options, meal plans, and restaurant details.",
        "travel" => "How to reach your property — airport, railway, road.",
        "faq" => "Answers to common guest questions.",
        _ => "Complete this section of your organisation profile.",
    };
}
