using appointza.Models;
using appointza.Services;
using Xunit;

namespace appointza.Tests
{
    public class OrganisationSalesProfileBuilderTests
    {
        [Fact]
        public void Build_StoresOfferIds_AndLeavesPricesInTheCatalogue()
        {
            var overview = Sample();
            var content = OrganisationSalesProfileBuilder.Build(overview);
            var stored = System.Text.Json.JsonSerializer.Serialize(content);

            Assert.Contains(content.knowledge.priorities, p => p.kind == "service" && p.offer_id == 9 && p.name == "Haircut");
            Assert.DoesNotContain("18001", stored);
            Assert.DoesNotContain("99002", stored);
            Assert.Equal("Do not offer a discount unless a limit is written here.", content.knowledge.discount_limit);
            Assert.Contains(content.strategy.offer_matching, rule => rule.offer_id == 9 && rule.kind == "service");
            Assert.Contains(content.lead_research.fields, field => field.key == "preferred_time");
        }

        [Fact]
        public void Fingerprint_ChangesWhenPriceChanges_AndFlagsSalesSectionsOnly()
        {
            var before = OrganisationSalesProfileBuilder.Fingerprint(Sample());
            var afterOverview = Sample();
            afterOverview.services[0].price = 18002;
            var after = OrganisationSalesProfileBuilder.Fingerprint(afterOverview);

            Assert.NotEqual(before, after);
            var sections = OrganisationSalesProfileBuilder.SectionsForCatalogueChange(before, after);
            Assert.Contains(OrganisationSalesProfileSection.SalesKnowledge, sections);
            Assert.Contains(OrganisationSalesProfileSection.AiSalesStrategy, sections);
            Assert.DoesNotContain(OrganisationSalesProfileSection.LeadResearch, sections);
        }

        [Fact]
        public void Fingerprint_TypeChange_AlsoFlagsLeadResearch()
        {
            var before = OrganisationSalesProfileBuilder.Fingerprint(Sample());
            var afterOverview = Sample();
            afterOverview.organisation.organisation_type = "clinic";
            var sections = OrganisationSalesProfileBuilder.SectionsForCatalogueChange(
                before,
                OrganisationSalesProfileBuilder.Fingerprint(afterOverview));

            Assert.Contains(OrganisationSalesProfileSection.LeadResearch, sections);
        }

        [Fact]
        public void FailedRefresh_KeepsTheLastApprovedStatus()
        {
            Assert.Equal(
                OrganisationSalesProfileStatus.Approved,
                OrganisationSalesProfileBuilder.StatusAfterFailedGenerate(OrganisationSalesProfileStatus.Approved, 3));
            Assert.Equal(
                OrganisationSalesProfileStatus.RefreshRequired,
                OrganisationSalesProfileBuilder.StatusAfterFailedGenerate(OrganisationSalesProfileStatus.RefreshRequired, 3));
            Assert.Equal(
                OrganisationSalesProfileStatus.NotGenerated,
                OrganisationSalesProfileBuilder.StatusAfterFailedGenerate(OrganisationSalesProfileStatus.Generating, 0));
        }

        [Fact]
        public void MatchLead_LeavesTheServiceBlank_WhenNothingIsKnown()
        {
            var content = OrganisationSalesProfileBuilder.Build(Sample());
            var action = OrganisationSalesProfileBuilder.MatchLead(
                content,
                Sample(),
                new Enquiry { id = 4, organisation_id = 1, name = "Asha" },
                OrganisationSalesProfileStatus.Approved,
                false);

            Assert.Equal(0, action.recommended_offer_id);
            Assert.DoesNotContain("Haircut", action.next_action);
            Assert.Contains("Not enough is known", action.next_action);
        }

        [Fact]
        public void MatchLead_ChoosesTheServiceFromWebsiteAndBusinessType()
        {
            var catalogue = new OrganisationCrmCatalogueOverview
            {
                organisation = new OrganisationCrmOrgSummary { id = 1, name = "Appointza", organisation_type = "software", isactive = true },
                locations = new List<OrganisationCrmLocationItem> { new() { id = 1, city = "Panruti", isactive = true } },
                services = new List<OrganisationCrmServiceItem>
                {
                    new() { id = 85, name = "Customer Relationship Management (CRM)", price = 1, show_price = true, isactive = true },
                    new() { id = 84, name = "Event Management", price = 1, show_price = true, isactive = true },
                    new() { id = 83, name = "Online Booking Website", price = 1, show_price = true, isactive = true },
                },
            };
            var content = OrganisationSalesProfileBuilder.Build(catalogue);

            var noWebsite = OrganisationSalesProfileBuilder.MatchLead(
                content, catalogue,
                new Enquiry { organisation_id = 1, business_name = "Asha Salon", category = "Salon", city = "Panruti" },
                OrganisationSalesProfileStatus.Approved, false);
            var hasWebsite = OrganisationSalesProfileBuilder.MatchLead(
                content, catalogue,
                new Enquiry { organisation_id = 1, business_name = "Asha Salon", category = "Salon", website = "https://asha.example", city = "Panruti" },
                OrganisationSalesProfileStatus.Approved, false);
            var eventLead = OrganisationSalesProfileBuilder.MatchLead(
                content, catalogue,
                new Enquiry { organisation_id = 1, business_name = "Town Cup", category = "Tournament", city = "Cuddalore" },
                OrganisationSalesProfileStatus.Approved, false);
            var unknown = OrganisationSalesProfileBuilder.MatchLead(
                content, catalogue,
                new Enquiry { organisation_id = 1, business_name = "North Kitchen", website = "https://north.example", city = "Panruti" },
                OrganisationSalesProfileStatus.Approved, false);

            Assert.Equal(83, noWebsite.recommended_offer_id);
            Assert.Equal(85, hasWebsite.recommended_offer_id);
            Assert.Equal(84, eventLead.recommended_offer_id);
            Assert.Equal(0, unknown.recommended_offer_id);
        }

        [Fact]
        public void MatchLead_UsesLiveCatalogue_AndSkipsAFullEvent()
        {
            var content = OrganisationSalesProfileBuilder.Build(Sample());
            foreach (var field in content.lead_research.fields)
            {
                field.key = field.key;
            }
            var enquiry = new Enquiry
            {
                id = 4,
                organisation_id = 1,
                name = "Asha",
                business_name = "Asha Studio",
                message = "Needs a haircut",
                city = "Chennai",
                owner_name = "Asha",
                notes = "[[LEAD_INTELLIGENCE]]{\"timing\":\"Friday\",\"preferred_time\":\"Morning\"}[[/LEAD_INTELLIGENCE]]",
            };

            var catalogue = Sample();
            catalogue.services[0].price = 18002;
            catalogue.events[0].remainingslot = 0;

            var action = OrganisationSalesProfileBuilder.MatchLead(
                content,
                catalogue,
                enquiry,
                OrganisationSalesProfileStatus.Approved,
                false);

            Assert.Equal(9, action.recommended_offer_id);
            Assert.Contains("18002", action.next_action);
            Assert.Contains("Confirm before you commit", action.next_action);
            Assert.Contains(action.offer_matches, match => match.offer_id == 3 && !match.available);
            Assert.DoesNotContain("18001", action.next_action);
        }

        [Fact]
        public void MatchLead_DoesNotQuoteAHiddenPrice()
        {
            var overview = Sample();
            overview.services[0].show_price = false;
            var content = OrganisationSalesProfileBuilder.Build(overview);
            var enquiry = new Enquiry
            {
                id = 4,
                organisation_id = 1,
                business_name = "Asha Studio",
                message = "Needs a haircut",
                city = "Chennai",
                owner_name = "Asha",
                notes = "[[LEAD_INTELLIGENCE]]{\"timing\":\"Friday\",\"preferred_time\":\"Morning\"}[[/LEAD_INTELLIGENCE]]",
            };

            var action = OrganisationSalesProfileBuilder.MatchLead(
                content,
                overview,
                enquiry,
                OrganisationSalesProfileStatus.RefreshRequired,
                true);

            Assert.Contains("hides this price", action.next_action);
            Assert.DoesNotContain("18001", action.next_action);
            Assert.Contains("needs review", action.next_action);
        }

        [Fact]
        public void FitPercent_RisesWhenTheLeadMatchesThisBusiness()
        {
            var content = OrganisationSalesProfileBuilder.Build(Sample());
            var empty = OrganisationSalesProfileBuilder.FitPercent(
                content,
                Sample(),
                new Enquiry { id = 4, organisation_id = 1, name = "Asha" });
            var matched = OrganisationSalesProfileBuilder.FitPercent(
                content,
                Sample(),
                new Enquiry
                {
                    id = 4,
                    organisation_id = 1,
                    business_name = "Asha Studio",
                    message = "Needs a Haircut",
                    city = "Chennai",
                    owner_name = "Asha",
                    notes = "[[LEAD_INTELLIGENCE]]{\"timing\":\"Friday\",\"preferred_time\":\"Morning\"}[[/LEAD_INTELLIGENCE]]",
                });

            Assert.True(matched > empty);
            Assert.InRange(matched, 1, 100);
        }

        [Fact]
        public void FitPercent_DiffersWhenTheLeadDoesNotMatchTheBusiness()
        {
            var content = OrganisationSalesProfileBuilder.Build(Sample());
            var catalogue = Sample();
            var salon = OrganisationSalesProfileBuilder.FitPercent(
                content,
                catalogue,
                new Enquiry
                {
                    organisation_id = 1,
                    business_name = "Asha Studio",
                    category = "Salon",
                    message = "Needs a Haircut",
                    city = "Chennai",
                    name = "Asha",
                });
            var other = OrganisationSalesProfileBuilder.FitPercent(
                content,
                catalogue,
                new Enquiry
                {
                    organisation_id = 1,
                    business_name = "North Kitchen",
                    category = "Restaurant",
                    message = "Looking for a new oven",
                    city = "Mumbai",
                    name = "Ravi",
                });

            Assert.True(salon > other);
            Assert.NotEqual(salon, other);
        }

        static OrganisationCrmCatalogueOverview Sample()
        {
            return new OrganisationCrmCatalogueOverview
            {
                organisation = new OrganisationCrmOrgSummary
                {
                    id = 1,
                    name = "Asha Salon",
                    organisation_type = "salon",
                    tagline = "Cuts and colour",
                    isactive = true,
                },
                locations = new List<OrganisationCrmLocationItem>
                {
                    new() { id = 2, name = "Main", city = "Chennai", mobile = "9000000000", isactive = true },
                },
                services = new List<OrganisationCrmServiceItem>
                {
                    new()
                    {
                        id = 9,
                        name = "Haircut",
                        price = 18001,
                        weekday_price = 0,
                        weekend_price = 0,
                        duration_minutes = 30,
                        show_price = true,
                        isactive = true,
                    },
                },
                events = new List<OrganisationCrmEventItem>
                {
                    new()
                    {
                        id = 3,
                        event_name = "Colour day",
                        entry_amount = 99002,
                        slot_limit = 10,
                        remainingslot = 4,
                        isactive = true,
                    },
                },
            };
        }
    }
}
