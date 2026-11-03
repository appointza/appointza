using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using appointza.Models;

namespace appointza.Services
{
    public static class OrganisationSalesProfileBuilder
    {
        const string IntelStart = "[[LEAD_INTELLIGENCE]]";
        const string IntelEnd = "[[/LEAD_INTELLIGENCE]]";

        public static OrganisationSalesProfileContent Build(OrganisationCrmCatalogueOverview overview)
        {
            if (overview == null)
            {
                throw new InvalidOperationException("Catalogue is required.");
            }

            var org = overview.organisation ?? new OrganisationCrmOrgSummary();
            var services = (overview.services ?? new List<OrganisationCrmServiceItem>())
                .Where(s => s != null && s.isactive && s.id > 0 && !string.IsNullOrWhiteSpace(s.name))
                .OrderBy(s => s.name)
                .ToList();
            var events = (overview.events ?? new List<OrganisationCrmEventItem>())
                .Where(e => e != null && e.isactive && e.id > 0 && !string.IsNullOrWhiteSpace(e.event_name))
                .ToList();
            var locations = (overview.locations ?? new List<OrganisationCrmLocationItem>())
                .Where(l => l != null && l.isactive)
                .ToList();
            var rooms = (overview.rooms ?? new List<OrganisationCrmRoomItem>())
                .Where(r => r != null && r.isactive)
                .ToList();

            var kind = DetectKind(org);
            var cities = locations
                .Select(l => (l.city ?? "").Trim())
                .Where(c => c.Length > 0)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var priorities = BuildPriorities(services, events);
            var fields = BuildResearchFields(kind);

            var knowledge = new OrganisationSalesKnowledge
            {
                ideal_customers = IdealCustomers(kind, cities),
                value_proposition = ValueProposition(org, services, events, cities),
                differentiators = Differentiators(org, services, events, locations, rooms),
                proof = Proof(org),
                priorities = priorities,
                approved_claims = priorities.Select(p => p.name).Where(n => !string.IsNullOrWhiteSpace(n)).Distinct().ToList(),
                discount_limit = "Do not offer a discount unless a limit is written here.",
                do_not_promise = DoNotPromise(services, events),
            };

            var strategy = new OrganisationAiSalesStrategy
            {
                qualification_rules = new List<string>
                {
                    "The prospect's need matches an offer in this profile.",
                    "A listed location can serve them, or they have not named a place yet.",
                    "The offer still exists in the live catalogue.",
                    "Do not qualify a prospect from a stored price.",
                },
                offer_matching = priorities.Select(p => new OrganisationOfferRule
                {
                    kind = p.kind,
                    offer_id = p.offer_id,
                    name = p.name,
                    when = "Use when the prospect's research matches " + p.name + ". Confirm the live catalogue before quoting a price, date, or slot.",
                }).ToList(),
                objections = new List<string>
                {
                    "Price: open the live catalogue and confirm the current price. Do not invent a discount.",
                    "Timing: check live availability or remaining slots before promising a date.",
                    "Not sure: ask the first discovery question that is still empty.",
                },
                discovery_questions = fields.Select(f => f.instructions).Where(q => !string.IsNullOrWhiteSpace(q)).ToList(),
                tone = "Clear and specific. Use only approved claims.",
                channel = locations.Any(l => !string.IsNullOrWhiteSpace(l.mobile))
                    ? "Phone or WhatsApp, using a number from the live location record."
                    : "Reply on the channel the lead already used.",
                follow_up = "Follow up on the next action for this lead. Stop when the lead opts out.",
                opt_out = "If the prospect asks to stop, record it and do not continue.",
                escalation = kind == "clinic"
                    ? "Hand medical or professional advice to a practitioner."
                    : "Hand a discount, a complaint, or custom terms to a person.",
            };

            return new OrganisationSalesProfileContent
            {
                knowledge = knowledge,
                lead_research = new OrganisationLeadResearchConfig { fields = fields },
                strategy = strategy,
            };
        }

        public static string Fingerprint(OrganisationCrmCatalogueOverview overview)
        {
            var org = overview?.organisation ?? new OrganisationCrmOrgSummary();
            var sb = new StringBuilder();
            sb.Append("type:").Append(Norm(org.organisation_type)).Append('\n');
            sb.Append("org:").Append(org.id).Append('|').Append(Norm(org.name)).Append('|').Append(org.isactive).Append('\n');
            foreach (var location in (overview?.locations ?? new List<OrganisationCrmLocationItem>()).OrderBy(l => l.id))
            {
                sb.Append("loc:").Append(location.id).Append('|').Append(Norm(location.city)).Append('|').Append(location.isactive).Append('\n');
            }
            foreach (var service in (overview?.services ?? new List<OrganisationCrmServiceItem>()).OrderBy(s => s.id))
            {
                sb.Append("svc:")
                    .Append(service.id).Append('|')
                    .Append(Norm(service.name)).Append('|')
                    .Append(Money(service.price)).Append('|')
                    .Append(Money(service.weekday_price)).Append('|')
                    .Append(Money(service.weekend_price)).Append('|')
                    .Append(service.duration_minutes).Append('|')
                    .Append(service.show_price).Append('|')
                    .Append(service.isactive).Append('\n');
            }
            foreach (var ev in (overview?.events ?? new List<OrganisationCrmEventItem>()).OrderBy(e => e.id))
            {
                sb.Append("evt:")
                    .Append(ev.id).Append('|')
                    .Append(Norm(ev.event_name)).Append('|')
                    .Append(Norm(ev.status)).Append('|')
                    .Append(Money(ev.entry_amount)).Append('|')
                    .Append(ev.slot_limit).Append('|')
                    .Append(ev.remainingslot).Append('|')
                    .Append(ev.isactive).Append('\n');
            }
            foreach (var room in (overview?.rooms ?? new List<OrganisationCrmRoomItem>()).OrderBy(r => r.id))
            {
                sb.Append("room:").Append(room.id).Append('|').Append(Norm(room.status)).Append('|').Append(room.isactive).Append('\n');
            }
            return sb.ToString();
        }

        public static List<string> SectionsForCatalogueChange(string previousCanonical, string nextCanonical)
        {
            if (string.Equals(previousCanonical ?? "", nextCanonical ?? "", StringComparison.Ordinal))
            {
                return new List<string>();
            }

            var sections = new List<string>
            {
                OrganisationSalesProfileSection.SalesKnowledge,
                OrganisationSalesProfileSection.AiSalesStrategy,
            };
            if (!string.Equals(TypeOf(previousCanonical ?? ""), TypeOf(nextCanonical ?? ""), StringComparison.OrdinalIgnoreCase))
            {
                sections.Add(OrganisationSalesProfileSection.LeadResearch);
            }
            return sections;
        }

        public static string StatusAfterFailedGenerate(string previousStatus, int approvedVersion)
        {
            if (approvedVersion > 0)
            {
                if (string.Equals(previousStatus, OrganisationSalesProfileStatus.RefreshRequired, StringComparison.Ordinal))
                {
                    return OrganisationSalesProfileStatus.RefreshRequired;
                }
                return OrganisationSalesProfileStatus.Approved;
            }
            return OrganisationSalesProfileStatus.NotGenerated;
        }

        public static OrganisationLeadSalesAction MatchLead(
            OrganisationSalesProfileContent profile,
            OrganisationCrmCatalogueOverview catalogue,
            Enquiry enquiry,
            string profileStatus,
            bool catalogueChanged)
        {
            if (profile == null) throw new InvalidOperationException("Approved sales profile is required.");
            if (enquiry == null) throw new InvalidOperationException("Lead is required.");

            var knowledge = profile.knowledge ?? new OrganisationSalesKnowledge();
            var researchConfig = profile.lead_research ?? new OrganisationLeadResearchConfig();
            var facts = ReadProspectFacts(enquiry);
            var answers = new List<OrganisationLeadResearchAnswer>();
            foreach (var field in researchConfig.fields ?? new List<OrganisationLeadResearchField>())
            {
                if (field == null) continue;
                var value = Fact(enquiry, field.key ?? "", facts);
                answers.Add(new OrganisationLeadResearchAnswer
                {
                    key = field.key ?? "",
                    label = field.label ?? "",
                    instructions = field.instructions ?? "",
                    value = value,
                    missing = string.IsNullOrWhiteSpace(value),
                });
            }

            var matches = new List<OrganisationOfferMatch>();
            foreach (var priority in knowledge.priorities ?? new List<OrganisationSalesPriority>())
            {
                matches.Add(CheckOffer(catalogue, priority));
            }

            var missing = answers.FirstOrDefault(a => a.missing);
            var recommended = BestOffer(matches, enquiry);
            string next = SalesMessage(enquiry, recommended, missing);

            if (catalogueChanged)
            {
                next += " The organisation profile needs review because the catalogue changed. This step still uses the last approved profile and the live catalogue.";
            }

            return new OrganisationLeadSalesAction
            {
                organisation_id = enquiry.organisation_id,
                enquiry_id = enquiry.id,
                profile_status = profileStatus ?? "",
                catalogue_changed = catalogueChanged,
                research = answers,
                offer_matches = matches,
                recommended_offer_id = recommended?.offer_id ?? 0,
                recommended_offer_kind = recommended?.kind ?? "",
                recommended_offer_name = recommended?.name ?? "",
                fit_percent = FitPercent(profile, catalogue, enquiry),
                next_action = next.Trim(),
            };
        }

        public static int FitPercent(
            OrganisationSalesProfileContent profile,
            OrganisationCrmCatalogueOverview catalogue,
            Enquiry enquiry)
        {
            if (profile == null || enquiry == null) return 0;

            var knowledge = profile.knowledge ?? new OrganisationSalesKnowledge();
            var fields = (profile.lead_research?.fields ?? new List<OrganisationLeadResearchField>())
                .Where(field => field != null && !string.IsNullOrWhiteSpace(field.key))
                .ToList();
            var facts = ReadProspectFacts(enquiry);
            int known = fields.Count == 0
                ? 0
                : (int)Math.Round(100.0 * fields.Count(field => !string.IsNullOrWhiteSpace(Fact(enquiry, field.key ?? "", facts))) / fields.Count);
            int place = PlaceScore(catalogue, enquiry);
            int offer = OfferScore(knowledge, catalogue, enquiry);

            return Math.Clamp((int)Math.Round((offer * 0.5) + (place * 0.3) + (known * 0.2)), 0, 100);
        }

        static int PlaceScore(OrganisationCrmCatalogueOverview catalogue, Enquiry enquiry)
        {
            var cities = (catalogue?.locations ?? new List<OrganisationCrmLocationItem>())
                .Select(location => (location?.city ?? "").Trim())
                .Where(city => city.Length >= 3)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var leadPlace = string.Join(" ", new[] { enquiry.city, enquiry.area, enquiry.address, enquiry.state }
                .Where(part => !string.IsNullOrWhiteSpace(part)));
            if (cities.Count == 0) return 50;
            if (string.IsNullOrWhiteSpace(leadPlace)) return 25;
            if (cities.Any(city => leadPlace.IndexOf(city, StringComparison.OrdinalIgnoreCase) >= 0)) return 100;
            return 10;
        }

        static int OfferScore(OrganisationSalesKnowledge knowledge, OrganisationCrmCatalogueOverview catalogue, Enquiry enquiry)
        {
            var names = (knowledge.priorities ?? new List<OrganisationSalesPriority>())
                .Where(priority => priority != null && !string.IsNullOrWhiteSpace(priority.name) && CheckOffer(catalogue, priority).available)
                .Select(priority => priority.name.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            var leadBits = string.Join(" ", new[] { enquiry.category, enquiry.message, enquiry.business_name, enquiry.tags, enquiry.lead_type }
                .Where(part => !string.IsNullOrWhiteSpace(part)));
            if (names.Count == 0 || string.IsNullOrWhiteSpace(leadBits)) return 0;

            int exact = names.Count(name => name.Length >= 3 && leadBits.IndexOf(name, StringComparison.OrdinalIgnoreCase) >= 0);
            if (exact > 0) return Math.Max(70, (int)Math.Round(100.0 * exact / names.Count));

            var targets = Words(string.Join(" ", names.Append(catalogue?.organisation?.organisation_type ?? ""))).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var leadWords = Words(leadBits).ToHashSet(StringComparer.OrdinalIgnoreCase);
            if (targets.Count == 0 || leadWords.Count == 0) return 0;
            int shared = targets.Count(token => leadWords.Contains(token));
            return (int)Math.Round(100.0 * shared / targets.Count);
        }

        static IEnumerable<string> Words(string text)
        {
            var word = new StringBuilder();
            foreach (var ch in text ?? "")
            {
                if (char.IsLetterOrDigit(ch))
                {
                    word.Append(char.ToLowerInvariant(ch));
                    continue;
                }
                if (word.Length == 0) continue;
                var token = word.ToString();
                word.Clear();
                if (token.Length >= 4 && !FitStopWords.Contains(token)) yield return token;
            }
            if (word.Length >= 4 && !FitStopWords.Contains(word.ToString())) yield return word.ToString();
        }

        static readonly HashSet<string> FitStopWords = new(StringComparer.OrdinalIgnoreCase)
        {
            "customer", "need", "needs", "meant", "solve", "confirm", "people", "listed",
            "service", "services", "offer", "offers", "business", "their", "with", "from",
            "this", "that", "your", "they", "want", "book", "booking", "about", "have",
        };

        public static Dictionary<string, string> ReadProspectFacts(Enquiry enquiry)
        {
            var facts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            var notes = enquiry?.notes ?? "";
            var start = notes.IndexOf(IntelStart, StringComparison.Ordinal);
            if (start < 0) return facts;
            var end = notes.IndexOf(IntelEnd, start + IntelStart.Length, StringComparison.Ordinal);
            if (end < 0) return facts;
            var raw = notes.Substring(start + IntelStart.Length, end - (start + IntelStart.Length)).Trim();
            try
            {
                var parsed = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(raw);
                if (parsed == null) return facts;
                foreach (var pair in parsed)
                {
                    if (pair.Value.ValueKind == JsonValueKind.Null) continue;
                    var text = pair.Value.ValueKind == JsonValueKind.String
                        ? pair.Value.GetString()
                        : pair.Value.ToString();
                    if (!string.IsNullOrWhiteSpace(text)) facts[pair.Key] = text.Trim();
                }
            }
            catch (JsonException)
            {
                return facts;
            }
            return facts;
        }

        static OrganisationOfferMatch CheckOffer(OrganisationCrmCatalogueOverview catalogue, OrganisationSalesPriority priority)
        {
            var kind = (priority?.kind ?? "").Trim().ToLowerInvariant();
            var match = new OrganisationOfferMatch
            {
                kind = kind,
                offer_id = priority?.offer_id ?? 0,
                name = priority?.name ?? "",
                available = false,
                live_check = "This offer is not in the live catalogue. Do not promise it.",
            };

            if (kind == "service")
            {
                var service = (catalogue?.services ?? new List<OrganisationCrmServiceItem>())
                    .FirstOrDefault(s => s.id == match.offer_id && s.isactive);
                if (service == null) return match;
                match.name = string.IsNullOrWhiteSpace(service.name) ? match.name : service.name;
                if (!service.show_price)
                {
                    match.available = true;
                    match.live_check = "The live catalogue hides this price. Do not quote one.";
                    return match;
                }
                match.available = true;
                if (service.weekday_price > 0 || service.weekend_price > 0)
                {
                    match.live_check = "Live catalogue: weekday " + Inr(service.weekday_price) + ", weekend " + Inr(service.weekend_price) + ". Confirm before you commit.";
                }
                else
                {
                    match.live_check = "Live catalogue price is " + Inr(service.price) + ". Confirm before you commit.";
                }
                return match;
            }

            if (kind == "event")
            {
                var ev = (catalogue?.events ?? new List<OrganisationCrmEventItem>())
                    .FirstOrDefault(e => e.id == match.offer_id && e.isactive);
                if (ev == null) return match;
                match.name = string.IsNullOrWhiteSpace(ev.event_name) ? match.name : ev.event_name;
                if (ev.slot_limit > 0 && ev.remainingslot <= 0)
                {
                    match.available = false;
                    match.live_check = "The live catalogue shows no remaining slots. Do not promise a place.";
                    return match;
                }
                match.available = true;
                match.live_check = "Live catalogue: entry " + Inr(ev.entry_amount) + ", remaining slots " + ev.remainingslot + ". Confirm before you commit.";
                return match;
            }

            return match;
        }

        static OrganisationOfferMatch BestOffer(List<OrganisationOfferMatch> matches, Enquiry enquiry)
        {
            var available = (matches ?? new List<OrganisationOfferMatch>())
                .Where(match => match != null && match.available && match.offer_id > 0 && !string.IsNullOrWhiteSpace(match.name))
                .ToList();
            if (available.Count == 0) return null;

            var leadBits = string.Join(" ", new[] { enquiry?.category, enquiry?.message, enquiry?.business_name, enquiry?.tags, enquiry?.lead_type }
                .Where(part => !string.IsNullOrWhiteSpace(part)));
            var named = available.FirstOrDefault(match =>
                match.name.Trim().Length >= 3 &&
                leadBits.IndexOf(match.name.Trim(), StringComparison.OrdinalIgnoreCase) >= 0);
            if (named != null) return named;

            var leadWords = Words(leadBits).ToHashSet(StringComparer.OrdinalIgnoreCase);
            OrganisationOfferMatch best = null;
            var bestScore = 0;
            foreach (var match in available)
            {
                var score = Words(match.name).Count(token => leadWords.Contains(token));
                if (score > bestScore)
                {
                    bestScore = score;
                    best = match;
                }
            }
            if (best != null) return best;

            var tokens = Tokens(leadBits);
            if (HasAny(tokens, "event", "events", "tournament", "tournaments", "camp", "camps", "workshop", "workshops", "meetup", "meetups", "wedding", "weddings"))
            {
                var eventOffer = available.FirstOrDefault(IsEventOffer);
                if (eventOffer != null) return eventOffer;
            }

            var hasWebsite = !string.IsNullOrWhiteSpace(enquiry?.website);
            if (!hasWebsite)
            {
                var bookingOffer = available.FirstOrDefault(IsBookingOffer);
                if (bookingOffer != null) return bookingOffer;
            }

            if (HasAny(tokens, "salon", "salons", "spa", "spas", "clinic", "clinics", "gym", "gyms", "parlour", "parlor", "parlors", "appointment", "appointments", "turf", "coaching", "barber", "beauty"))
            {
                var crmOffer = available.FirstOrDefault(IsCrmOffer);
                if (crmOffer != null) return crmOffer;
            }

            return null;
        }

        static bool IsBookingOffer(OrganisationOfferMatch match) => HasAny(Tokens(match?.name), "booking", "website");

        static bool IsEventOffer(OrganisationOfferMatch match) => HasAny(Tokens(match?.name), "event", "events", "tournament", "tournaments");

        static bool IsCrmOffer(OrganisationOfferMatch match)
        {
            var tokens = Tokens(match?.name);
            return tokens.Contains("crm") || (tokens.Contains("customer") && tokens.Contains("relationship"));
        }

        static bool HasAny(HashSet<string> tokens, params string[] words)
        {
            if (tokens == null || words == null) return false;
            return words.Any(word => tokens.Contains(word));
        }

        static HashSet<string> Tokens(string text)
        {
            var tokens = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var word = new StringBuilder();
            foreach (var ch in text ?? "")
            {
                if (char.IsLetterOrDigit(ch))
                {
                    word.Append(char.ToLowerInvariant(ch));
                    continue;
                }
                KeepToken(tokens, word);
            }
            KeepToken(tokens, word);
            return tokens;
        }

        static void KeepToken(HashSet<string> tokens, StringBuilder word)
        {
            if (word.Length >= 2) tokens.Add(word.ToString());
            word.Clear();
        }

        static string SalesMessage(Enquiry enquiry, OrganisationOfferMatch recommended, OrganisationLeadResearchAnswer missing)
        {
            if (recommended == null)
            {
                return "Not enough is known to choose a service.";
            }

            var who = FirstText(enquiry?.business_name, enquiry?.name, "there");
            var business = FirstText(enquiry?.business_name, "your business");
            var where = string.IsNullOrWhiteSpace(enquiry?.city) ? "" : " in " + enquiry.city.Trim();
            var message = "Hello " + who + ", " + business + where + " can use " + recommended.name.Trim() + ". " + (recommended.live_check ?? "");
            if (missing != null)
            {
                var ask = FirstText(missing.label, missing.key);
                if (!string.IsNullOrWhiteSpace(ask)) message += " Still worth asking: " + ask + ".";
            }
            return message.Trim();
        }

        static string FirstText(params string[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value)) return value.Trim();
            }
            return "";
        }

        static string Fact(Enquiry enquiry, string key, Dictionary<string, string> facts)
        {
            if (!string.IsNullOrWhiteSpace(key) && facts.TryGetValue(key, out var direct) && !string.IsNullOrWhiteSpace(direct))
            {
                return direct.Trim();
            }

            string Pick(params string[] values)
            {
                foreach (var value in values)
                {
                    if (!string.IsNullOrWhiteSpace(value)) return value.Trim();
                }
                return "";
            }

            return (key ?? "").Trim().ToLowerInvariant() switch
            {
                "business_name" => Pick(enquiry.business_name, enquiry.name),
                "website" => Pick(enquiry.website),
                "city" or "location_fit" => Pick(enquiry.city, enquiry.area, enquiry.address),
                "category" or "what_they_do" => Pick(enquiry.category, enquiry.business_name),
                "need" => Pick(enquiry.message),
                "decision_maker" => Pick(enquiry.owner_name, enquiry.name),
                "timing" => "",
                _ => "",
            };
        }

        static List<OrganisationSalesPriority> BuildPriorities(
            List<OrganisationCrmServiceItem> services,
            List<OrganisationCrmEventItem> events)
        {
            var priorities = new List<OrganisationSalesPriority>();
            foreach (var service in services.Where(s => s.show_price).Take(5))
            {
                priorities.Add(new OrganisationSalesPriority
                {
                    kind = "service",
                    offer_id = service.id,
                    name = service.name.Trim(),
                    problem_solved = "Customer need that " + service.name.Trim() + " is meant to solve. Confirm this before using it.",
                });
            }
            if (priorities.Count == 0)
            {
                foreach (var service in services.Take(5))
                {
                    priorities.Add(new OrganisationSalesPriority
                    {
                        kind = "service",
                        offer_id = service.id,
                        name = service.name.Trim(),
                        problem_solved = "Customer need that " + service.name.Trim() + " is meant to solve. Confirm this before using it.",
                    });
                }
            }
            foreach (var ev in events.Where(e => e.slot_limit <= 0 || e.remainingslot > 0).Take(3))
            {
                priorities.Add(new OrganisationSalesPriority
                {
                    kind = "event",
                    offer_id = ev.id,
                    name = ev.event_name.Trim(),
                    problem_solved = "Audience that " + ev.event_name.Trim() + " is meant to serve. Confirm this before using it.",
                });
            }
            return priorities;
        }

        static List<string> IdealCustomers(string kind, List<string> cities)
        {
            var where = cities.Count == 0 ? "" : " in " + string.Join(", ", cities);
            return kind switch
            {
                "salon" => new List<string> { "People who want to book a listed service" + where + "." },
                "clinic" => new List<string> { "People who need a listed clinical service" + where + ", within the practitioner limits you set." },
                "event" => new List<string> { "People who fit the audience of a listed event and still have a slot." },
                "flooring" => new List<string> { "Businesses with a renovation, fit-out, or flooring project the catalogue can supply." },
                "agency" => new List<string> { "Businesses whose website or search visibility is weak enough that a listed service would help." },
                _ => new List<string> { "Customers who need a listed offer" + where + "." },
            };
        }

        static string ValueProposition(
            OrganisationCrmOrgSummary org,
            List<OrganisationCrmServiceItem> services,
            List<OrganisationCrmEventItem> events,
            List<string> cities)
        {
            if (!string.IsNullOrWhiteSpace(org.tagline)) return org.tagline.Trim();
            var names = services.Select(s => s.name.Trim()).Take(3).ToList();
            if (names.Count == 0) names = events.Select(e => e.event_name.Trim()).Take(3).ToList();
            if (names.Count == 0) return "Add services or events in the catalogue before selling.";
            var place = cities.Count == 0 ? "" : " in " + string.Join(", ", cities);
            var who = string.IsNullOrWhiteSpace(org.name) ? "This organisation" : org.name.Trim();
            return who + " offers " + string.Join(", ", names) + place + ".";
        }

        static List<string> Differentiators(
            OrganisationCrmOrgSummary org,
            List<OrganisationCrmServiceItem> services,
            List<OrganisationCrmEventItem> events,
            List<OrganisationCrmLocationItem> locations,
            List<OrganisationCrmRoomItem> rooms)
        {
            var items = new List<string>();
            if (!string.IsNullOrWhiteSpace(org.organisation_type))
            {
                items.Add("Organisation type: " + org.organisation_type.Trim() + ".");
            }
            if (locations.Count > 0) items.Add(locations.Count + " active location" + (locations.Count == 1 ? "" : "s") + ".");
            if (services.Count > 0) items.Add(services.Count + " active service" + (services.Count == 1 ? "" : "s") + ".");
            var combos = services.Count(s => s.is_combo);
            if (combos > 0) items.Add(combos + " combo offer" + (combos == 1 ? "" : "s") + ".");
            if (events.Count > 0) items.Add(events.Count + " active event" + (events.Count == 1 ? "" : "s") + ".");
            if (rooms.Count > 0) items.Add(rooms.Count + " active room" + (rooms.Count == 1 ? "" : "s") + ".");
            if (items.Count == 0) items.Add("Add catalogue facts before claiming a differentiator.");
            return items;
        }

        static List<string> Proof(OrganisationCrmOrgSummary org)
        {
            if (!string.IsNullOrWhiteSpace(org.notes))
            {
                return new List<string> { "Organisation notes: " + org.notes.Trim() };
            }
            return new List<string> { "Add case studies or proof before the AI cites them." };
        }

        static List<string> DoNotPromise(List<OrganisationCrmServiceItem> services, List<OrganisationCrmEventItem> events)
        {
            var rules = new List<string>
            {
                "Check the live catalogue before promising a price, date, slot, or remaining capacity.",
            };
            foreach (var service in services.Where(s => !s.show_price))
            {
                rules.Add("Do not quote a price for " + service.name.Trim() + ".");
            }
            foreach (var ev in events.Where(e => e.slot_limit > 0 && e.remainingslot <= 0))
            {
                rules.Add("Do not promise a place at " + ev.event_name.Trim() + " while it has no remaining slots.");
            }
            if (services.Count == 0 && events.Count == 0)
            {
                rules.Add("There is nothing active to sell until the catalogue has an offer.");
            }
            return rules;
        }

        static List<OrganisationLeadResearchField> BuildResearchFields(string kind)
        {
            var fields = new List<OrganisationLeadResearchField>
            {
                Field("business_name", "Business or customer", "What the prospect does or who they are."),
                Field("need", "Problem to solve", "Which problem they want a listed offer to solve."),
                Field("timing", "Timing", "When they need the work, visit, or event."),
                Field("location_fit", "Place", "Which branch, area, or service location they need."),
                Field("decision_maker", "Decision maker", "Who can agree to buy."),
            };
            switch (kind)
            {
                case "flooring":
                    fields.Add(Field("floor_area", "Floor area", "Area to cover and the project type, such as a renovation."));
                    break;
                case "agency":
                    fields.Add(Field("website", "Website", "Their current site and how weak search visibility looks."));
                    break;
                case "salon":
                    fields.Add(Field("preferred_time", "Preferred time", "Which branch and time they want to book."));
                    break;
                case "clinic":
                    fields.Add(Field("appointment_type", "Appointment type", "Which listed service they need, and any restriction that must go to a practitioner."));
                    break;
                case "event":
                    fields.Add(Field("audience", "Audience", "Who would attend and how many places they need."));
                    break;
            }
            return fields;
        }

        static OrganisationLeadResearchField Field(string key, string label, string instructions)
        {
            return new OrganisationLeadResearchField
            {
                key = key,
                label = label,
                field_type = "string",
                instructions = instructions,
            };
        }

        public static string DetectKind(OrganisationCrmOrgSummary org)
        {
            var text = ((org?.organisation_type ?? "") + " " + (org?.name ?? "")).ToLowerInvariant();
            if (ContainsAny(text, "salon", "spa", "beauty", "barber")) return "salon";
            if (ContainsAny(text, "clinic", "hospital", "dental", "doctor", "physio")) return "clinic";
            if (ContainsAny(text, "event", "wedding", "ticket")) return "event";
            if (ContainsAny(text, "floor", "tile", "carpet", "textile", "fabric")) return "flooring";
            if (ContainsAny(text, "seo", "website", "digital", "agency")) return "agency";
            return "general";
        }

        static bool ContainsAny(string text, params string[] tokens)
        {
            foreach (var token in tokens)
            {
                if (text.Contains(token, StringComparison.Ordinal)) return true;
            }
            return false;
        }

        static string TypeOf(string canonical)
        {
            if (string.IsNullOrEmpty(canonical)) return "";
            var line = canonical.Split('\n')[0];
            return line.StartsWith("type:", StringComparison.Ordinal) ? line.Substring(5) : "";
        }

        static string Norm(string value) => (value ?? "").Trim().ToLowerInvariant();

        static string Money(decimal value) => value.ToString("0.##", CultureInfo.InvariantCulture);

        static string Inr(decimal value) => "₹" + value.ToString("0.##", CultureInfo.GetCultureInfo("en-IN"));

        public static string FingerprintKey(string canonical)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(canonical ?? ""));
            return Convert.ToHexString(bytes);
        }
    }
}
