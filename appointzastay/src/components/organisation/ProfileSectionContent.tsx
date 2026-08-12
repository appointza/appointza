import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LocateFixed } from "lucide-react";
import type { ProfileSectionId } from "@/models/stay";
import { getSectionDef } from "@/config/profileSections";
import { stayApi } from "@/services/stay.service";
import { useToast } from "@/hooks/use-toast";
import { resolveMediaUrl } from "@/utils/environment";
import { getCurrentPositionCoords, reverseGeocode } from "@/utils/geolocation";
import { ListEditor, stripEmptyRows } from "./ListEditor";
import {
  PackagesEditor,
  emptyPackageDraft,
  packageDraftToPayload,
  packageFromOrgItem,
  type PackageDraft,
} from "./PackagesEditor";
import {
  NearbyPlacesEditor,
  emptyNearbyDraft,
  nearbyDraftToPayload,
  nearbyFromOrgItem,
  type NearbyPlaceDraft,
} from "./NearbyPlacesEditor";
import {
  PropertyImagesEditor,
  propertyImageDraftToPayload,
  propertyImageFromOrgItem,
  type PropertyImageDraft,
} from "./PropertyImagesEditor";
import {
  ScheduleEditor,
  ScheduleView,
  emptyClosureDraft,
  emptySlotDraft,
  stripSchedulePayload,
  type ClosureDraft,
  type SlotDraft,
} from "./ScheduleEditor";
import { AssetImagePicker, findLibraryAsset, toLibraryAssets } from "./AssetImagePicker";
import { UploadsSection } from "./UploadsSection";
import {
  ProfileCard,
  ProfileDl,
  ProfileDlRow,
  ProfileEmpty,
  ProfileFields,
  ProfileForm,
  ProfileFormFooter,
  ProfileInput,
  ProfileTextarea,
  FieldLabel,
  dash,
  formatUtcDate,
  orgList,
  orgObj,
  orgStr,
} from "./ProfileUi";
import { buildPropertyWebsiteUrl, getDomainSuffix, getSubdomainParentHost } from "@/utils/subdomain";

const DOMAIN_SUFFIX = getDomainSuffix();

function bookingTypeLabel(value: string): string {
  return value === "hourly" ? "Hourly (per hour / slots)" : "Overnight (per night)";
}

function PoliciesEditForm({
  org,
  footer,
  onSavePolicies,
}: {
  org: Record<string, unknown>;
  footer: ReactNode;
  onSavePolicies: (payload: Record<string, unknown>) => void;
}) {
  const rules = orgObj(org, "rules");
  const houseRules = orgList<string>(rules as Record<string, unknown>, "houseRules");
  const [bookingType, setBookingType] = useState(
    () => orgStr(org, "bookingType") || "overnight",
  );

  return (
    <ProfileForm
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const type = String(fd.get("bookingType") || "overnight");
        onSavePolicies({
          bookingType: type,
          minimumHours: type === "hourly" ? Number(fd.get("minimumHours") || 2) : 0,
          checkInTime: fd.get("checkInTime"),
          checkOutTime: fd.get("checkOutTime"),
          overnightTimeMode: fd.get("overnightTimeMode"),
          cancellationPolicy: fd.get("cancellationPolicy"),
          paymentPolicy: fd.get("paymentPolicy"),
          petPolicy: fd.get("petPolicy"),
          idProofRequired: fd.get("idProofRequired"),
          refundPolicy: fd.get("refundPolicy"),
          houseRules: fd.get("houseRules"),
        });
      }}
    >
      <ProfileFields>
        <div className="span-2">
          <FieldLabel info="Overnight: guests book by check-in / check-out nights. Hourly: guests book a date with start and end time — use for party halls and short slots. Saved on your organisation profile.">
            Booking type
          </FieldLabel>
          <select
            name="bookingType"
            className="org-profile-input"
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value)}
          >
            <option value="overnight">Overnight (per night)</option>
            <option value="hourly">Hourly (per hour / slots)</option>
          </select>
        </div>
        {bookingType === "hourly" ? (
          <div>
            <FieldLabel info="Shortest slot guests can book (in hours). Example: 2 if the hall must be rented for at least 2 hours.">
              Minimum hours
            </FieldLabel>
            <ProfileInput
              name="minimumHours"
              type="number"
              min={1}
              defaultValue={String(org.minimumHours ?? 2)}
            />
          </div>
        ) : null}
        <div>
          <FieldLabel info="Standard arrival time for overnight stays (e.g. 14:00). Guests see this on your site and booking confirmation.">
            Check-in time
          </FieldLabel>
          <ProfileInput name="checkInTime" defaultValue={orgStr(org, "checkInTime")} placeholder="14:00" />
        </div>
        <div>
          <FieldLabel info="Standard departure time for overnight stays (e.g. 11:00). Late checkout can be handled as a special request.">
            Check-out time
          </FieldLabel>
          <ProfileInput name="checkOutTime" defaultValue={orgStr(org, "checkOutTime")} placeholder="11:00" />
        </div>
        <div className="span-2">
          <FieldLabel info="Fixed: booking form locks to your check-in/out times. Dynamic: guests may pick different times. Only applies to overnight booking type — hourly always uses start/end time.">
            Overnight times (booking form)
          </FieldLabel>
          <select
            name="overnightTimeMode"
            className="org-profile-input"
            defaultValue={orgStr(org, "overnightTimeMode") || "fixed"}
          >
            <option value="fixed">Fixed — guests use these times only</option>
            <option value="dynamic">Dynamic — guests can change times</option>
          </select>
        </div>
        <div className="span-2">
          <FieldLabel info="Explain when guests can cancel and any fees (e.g. free cancel until 24 hours before check-in). Shown on your public page and booking flow.">
            Cancellation policy
          </FieldLabel>
          <ProfileTextarea name="cancellationPolicy" rows={3} defaultValue={orgStr(org, "cancellationPolicy")} />
        </div>
        <div className="span-2">
          <FieldLabel info="How and when guests pay — advance, deposit, full amount at check-in, accepted methods (UPI, card, cash), etc.">
            Payment policy
          </FieldLabel>
          <ProfileTextarea name="paymentPolicy" rows={3} defaultValue={orgStr(org, "paymentPolicy")} />
        </div>
        <div>
          <FieldLabel info="Are pets allowed? Add any limits (size, breed, fee). Example: “Pets not allowed” or “Small pets welcome with prior notice”.">
            Pet policy
          </FieldLabel>
          <ProfileInput name="petPolicy" defaultValue={String(rules.petPolicy || "")} />
        </div>
        <div>
          <FieldLabel info="What ID guests must show at check-in (e.g. Aadhaar, passport, driving licence). Example: “Government photo ID required”.">
            ID proof required
          </FieldLabel>
          <ProfileInput name="idProofRequired" defaultValue={String(rules.idProofRequired || "")} />
        </div>
        <div className="span-2">
          <FieldLabel info="When refunds are given and how long they take. Can overlap with cancellation — keep it clear for guests.">
            Refund policy
          </FieldLabel>
          <ProfileTextarea name="refundPolicy" rows={2} defaultValue={String(rules.refundPolicy || "")} />
        </div>
        <div className="span-2">
          <FieldLabel info="Property rules guests should follow. Enter one rule per line (e.g. No smoking indoors, Quiet hours after 10 PM).">
            House rules (one per line)
          </FieldLabel>
          <ProfileTextarea name="houseRules" rows={4} defaultValue={houseRules.join("\n")} />
        </div>
      </ProfileFields>
      {footer}
    </ProfileForm>
  );
}

function BasicInfoEditForm({
  org,
  footer,
  onSubmitBasic,
}: {
  org: Record<string, unknown>;
  footer: ReactNode;
  onSubmitBasic: (payload: Record<string, unknown>) => void;
}) {
  const [bookingType, setBookingType] = useState(
    () => orgStr(org, "bookingType") || "overnight"
  );

  return (
    <ProfileForm
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const type = String(fd.get("bookingType") || "overnight");
        onSubmitBasic({
          name: fd.get("name"),
          tagline: fd.get("tagline"),
          description: fd.get("description"),
          slug: fd.get("slug"),
          propertyType: fd.get("propertyType"),
          bookingType: type,
          // Overnight stays don't use a minimum-hours rule.
          minimumHours: type === "hourly" ? Number(fd.get("minimumHours") || 2) : 0,
        });
      }}
    >
      <ProfileFields>
        <div>
          <FieldLabel info="The public name of your property. Guests see this on your page and in booking confirmation emails.">
            Property name
          </FieldLabel>
          <ProfileInput name="name" defaultValue={orgStr(org, "name")} required />
        </div>
        <div>
          <FieldLabel info="A short one-line pitch under your name (e.g. “Lakefront rooms near the old town”). Keep it under ~80 characters.">
            Tagline
          </FieldLabel>
          <ProfileInput name="tagline" defaultValue={orgStr(org, "tagline")} />
        </div>
        <div>
          <FieldLabel info="Pick the category that best matches what you offer. This helps guests understand the stay and can shape how the site is presented.">
            Property type
          </FieldLabel>
          <select
            name="propertyType"
            className="org-profile-input"
            defaultValue={orgStr(org, "propertyType") || "hotel"}
          >
            <option value="resort">Resort</option>
            <option value="hotel">Hotel</option>
            <option value="villa">Villa</option>
            <option value="homestay">Homestay</option>
            <option value="party_hall">Party Hall</option>
          </select>
        </div>
        <div>
          <FieldLabel info="Overnight: guests book by check-in / check-out nights. Hourly: guests book a date with start and end time — use this for party halls and short slots.">
            Booking type
          </FieldLabel>
          <select
            name="bookingType"
            className="org-profile-input"
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value)}
          >
            <option value="overnight">Overnight (per night)</option>
            <option value="hourly">Hourly (party hall / slots)</option>
          </select>
        </div>
        {bookingType === "hourly" ? (
          <div>
            <FieldLabel info="Shortest slot guests can book (in hours). Example: enter 2 if the hall must be rented for at least 2 hours. Not used for overnight stays.">
              Minimum hours
            </FieldLabel>
            <ProfileInput
              name="minimumHours"
              type="number"
              min={1}
              defaultValue={String(org.minimumHours ?? 2)}
            />
          </div>
        ) : null}
        <div className="span-2">
          <FieldLabel info="URL-friendly id for your public page (lowercase letters, numbers, hyphens). Example: lakeview-resort → your site path / property link.">
            URL slug
          </FieldLabel>
          <ProfileInput name="slug" defaultValue={orgStr(org, "slug")} placeholder="my-property" />
        </div>
        <div className="span-2">
          <FieldLabel info="Tell guests what makes the place special — location highlights, amenities, vibe. This appears on your public property page.">
            Description
          </FieldLabel>
          <ProfileTextarea name="description" rows={4} defaultValue={orgStr(org, "description")} />
        </div>
      </ProfileFields>
      {footer}
    </ProfileForm>
  );
}

function LocationEditForm({
  org,
  footer,
  onSubmitLocation,
}: {
  org: Record<string, unknown>;
  footer: ReactNode;
  onSubmitLocation: (payload: Record<string, unknown>) => void;
}) {
  const { toast } = useToast();
  const [locating, setLocating] = useState(false);
  const [address, setAddress] = useState(() => orgStr(org, "address"));
  const [city, setCity] = useState(() => orgStr(org, "city"));
  const [state, setState] = useState(() => orgStr(org, "state"));
  const [country, setCountry] = useState(() => orgStr(org, "country"));
  const [pincode, setPincode] = useState(() => orgStr(org, "pincode"));
  const [latitude, setLatitude] = useState(() =>
    org.latitude != null ? String(org.latitude) : ""
  );
  const [longitude, setLongitude] = useState(() =>
    org.longitude != null ? String(org.longitude) : ""
  );

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const coords = await getCurrentPositionCoords();
      const lat = Number(coords.latitude.toFixed(6));
      const lng = Number(coords.longitude.toFixed(6));
      setLatitude(String(lat));
      setLongitude(String(lng));

      const place = await reverseGeocode(lat, lng);
      if (place) {
        if (place.address) setAddress(place.address);
        if (place.city) setCity(place.city);
        if (place.state) setState(place.state);
        if (place.country) setCountry(place.country);
        if (place.pincode) setPincode(place.pincode);
        toast({ title: "Location filled from your device" });
      } else {
        toast({
          title: "Coordinates filled",
          description: "Address lookup was unavailable — you can edit city and address manually.",
        });
      }
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Could not get location",
        variant: "destructive",
      });
    } finally {
      setLocating(false);
    }
  }

  return (
    <ProfileForm
      onSubmit={(e) => {
        e.preventDefault();
        onSubmitLocation({
          address,
          city,
          state,
          country,
          pincode,
          latitude: latitude ? Number(latitude) : null,
          longitude: longitude ? Number(longitude) : null,
        });
      }}
    >
      <div className="org-profile-locate-row">
        <button
          type="button"
          className="org-profile-btn-secondary org-profile-locate-btn"
          disabled={locating}
          onClick={() => void useCurrentLocation()}
        >
          <LocateFixed className="h-4 w-4" aria-hidden />
          {locating ? "Detecting…" : "Use current location"}
        </button>
        <p className="org-profile-hint mb-0">
          Fills coordinates from your device and tries to fill address fields. You can edit anything after.
        </p>
      </div>
      <ProfileFields>
        <div className="span-2">
          <FieldLabel info="Street or full postal address guests and maps will use. Prefer the property entrance address.">
            Address
          </FieldLabel>
          <ProfileTextarea
            name="address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel info="City or town where the property is located.">City</FieldLabel>
          <ProfileInput name="city" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <FieldLabel info="State, province, or region.">State</FieldLabel>
          <ProfileInput name="state" value={state} onChange={(e) => setState(e.target.value)} />
        </div>
        <div>
          <FieldLabel info="Country name as guests expect to see it.">Country</FieldLabel>
          <ProfileInput name="country" value={country} onChange={(e) => setCountry(e.target.value)} />
        </div>
        <div>
          <FieldLabel info="Postal / ZIP / PIN code for the property. Filled automatically when you use current location, if available.">
            Pincode
          </FieldLabel>
          <ProfileInput
            name="pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="e.g. 643001"
            autoComplete="postal-code"
          />
        </div>
        <div>
          <FieldLabel info="Map latitude (−90 to 90). Use “Use current location” or paste from Google Maps.">
            Latitude
          </FieldLabel>
          <ProfileInput
            name="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel info="Map longitude (−180 to 180). Pair with latitude for the map pin on your public page.">
            Longitude
          </FieldLabel>
          <ProfileInput
            name="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
          />
        </div>
      </ProfileFields>
      {footer}
    </ProfileForm>
  );
}

export interface ProfileSectionContentProps {
  section: ProfileSectionId;
  editing: boolean;
  org: Record<string, unknown>;
  assets?: Record<string, unknown>[];
  logoUrl?: string | null;
  owner?: { name?: string };
  roomCount?: number;
  saved?: boolean;
  onCancel: () => void;
  onSaved: (section: ProfileSectionId) => void;
  /** When set (e.g. onboarding uploads), refresh assets without advancing the wizard. */
  onRefresh?: () => void;
  onboarding?: boolean;
  allowSkip?: boolean;
  onSkip?: () => void;
}

export function ProfileSectionContent(props: ProfileSectionContentProps) {
  const {
    section,
    editing,
    org,
    assets = [],
    logoUrl,
    owner,
    roomCount,
    saved,
    onCancel,
    onSaved,
    onRefresh,
    onboarding,
    allowSkip,
    onSkip,
  } = props;
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const def = getSectionDef(section);
  const wide = def.wide;

  if (section === "uploads") {
    return (
      <UploadsSection
        org={org}
        assets={assets}
        logoUrl={logoUrl}
        saved={saved}
        onRefresh={() => {
          if (onRefresh) onRefresh();
          else onSaved("uploads");
        }}
      />
    );
  }

  const save = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    try {
      await fn();
      toast({ title: "Saved" });
      onSaved(section);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: msg || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <ProfileFormFooter
      onCancel={onCancel}
      saving={saving}
      mode={onboarding ? "onboarding" : "default"}
      showSkip={allowSkip}
      onSkip={onSkip}
    />
  );

  // ── Basic ─────────────────────────────────────────────────────────────
  if (section === "basic") {
    if (editing) {
      return (
        <ProfileCard id="basic" title="Basic information" saved={saved}>
          <BasicInfoEditForm
            org={org}
            footer={footer}
            onSubmitBasic={(payload) => {
              void save(() => stayApi.organisation.saveBasic(payload));
            }}
          />
        </ProfileCard>
      );
    }
    const propertyType = orgStr(org, "propertyType") || "hotel";
    const bookingType = orgStr(org, "bookingType") || "overnight";
    const propertyTypeLabel: Record<string, string> = {
      resort: "Resort",
      hotel: "Hotel",
      villa: "Villa",
      homestay: "Homestay",
      party_hall: "Party Hall",
    };
    return (
      <ProfileCard id="basic" title="Basic information" saved={saved}>
        <ProfileDl>
          <ProfileDlRow label="Property name">{dash(orgStr(org, "name"))}</ProfileDlRow>
          <ProfileDlRow label="Tagline">{dash(orgStr(org, "tagline"))}</ProfileDlRow>
          <ProfileDlRow label="Property type">{propertyTypeLabel[propertyType] || propertyType}</ProfileDlRow>
          <ProfileDlRow label="Booking type">{bookingType === "hourly" ? "Hourly" : "Overnight"}</ProfileDlRow>
          {bookingType === "hourly" && (
            <ProfileDlRow label="Minimum hours">{String(org.minimumHours ?? 2)}</ProfileDlRow>
          )}
          <ProfileDlRow label="URL slug">{dash(orgStr(org, "slug"))}</ProfileDlRow>
          <ProfileDlRow label="Description">
            <span className="org-profile-multiline">{dash(orgStr(org, "description"))}</span>
          </ProfileDlRow>
          <ProfileDlRow label="Organisation ID">{dash(org.id)}</ProfileDlRow>
          <ProfileDlRow label="Owner">{dash(owner?.name || org.ownerId)}</ProfileDlRow>
          <ProfileDlRow label="Rooms in system">{roomCount ?? 0}</ProfileDlRow>
          <ProfileDlRow label="Created">{formatUtcDate(org.createdAt)}</ProfileDlRow>
          <ProfileDlRow label="Last updated">{formatUtcDate(org.updatedAt)}</ProfileDlRow>
        </ProfileDl>
      </ProfileCard>
    );
  }

  // ── Location ──────────────────────────────────────────────────────────
  if (section === "location") {
    if (editing) {
      return (
        <ProfileCard id="location" title="Location" saved={saved}>
          <LocationEditForm
            org={org}
            footer={footer}
            onSubmitLocation={(payload) => {
              void save(() => stayApi.organisation.saveLocation(payload));
            }}
          />
        </ProfileCard>
      );
    }
    const full = [org.address, org.city, org.state, org.pincode, org.country].filter(Boolean).join(", ");
    return (
      <ProfileCard id="location" title="Location" saved={saved}>
        <ProfileDl>
          <ProfileDlRow label="Full address">{dash(full)}</ProfileDlRow>
          <ProfileDlRow label="Pincode">{dash(org.pincode)}</ProfileDlRow>
          <ProfileDlRow label="Coordinates">
            {org.latitude != null && org.longitude != null ? `${org.latitude}, ${org.longitude}` : "—"}
          </ProfileDlRow>
        </ProfileDl>
      </ProfileCard>
    );
  }

  // ── Contact ───────────────────────────────────────────────────────────
  if (section === "contact") {
    const contact = orgObj(org, "contactInfo");
    if (editing) {
      return (
        <ProfileCard id="contact" title="Contact" saved={saved}>
          <ProfileForm
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void save(() =>
                stayApi.organisation.saveContact({
                  phone: fd.get("phone"),
                  whatsapp: fd.get("whatsapp"),
                  email: fd.get("email"),
                  mapEmbedUrl: fd.get("mapEmbedUrl"),
                })
              );
            }}
          >
            <ProfileFields>
              <div>
                <FieldLabel info="Main phone number guests can call. Include country code if you take international bookings.">
                  Phone
                </FieldLabel>
                <ProfileInput name="phone" defaultValue={orgStr(org, "phone")} />
              </div>
              <div>
                <FieldLabel info="WhatsApp number for chat (digits with country code, e.g. 919876543210).">
                  WhatsApp
                </FieldLabel>
                <ProfileInput name="whatsapp" defaultValue={orgStr(org, "whatsApp")} />
              </div>
              <div>
                <FieldLabel info="Public email for booking questions and confirmations.">
                  Email
                </FieldLabel>
                <ProfileInput name="email" type="email" defaultValue={orgStr(org, "email")} />
              </div>
              <div className="span-2">
                <FieldLabel info="Paste your Google Maps link so guests see a map on your website. Open Google Maps → find your property → Share → Copy link (or “Embed a map” → copy the src URL). Example: https://maps.google.com/?q=your+place">
                  Google Maps link
                </FieldLabel>
                <ProfileInput
                  name="mapEmbedUrl"
                  defaultValue={String(contact.mapEmbedUrl || "")}
                  placeholder="https://maps.google.com/?q=…"
                />
                <p className="org-profile-hint mt-1 mb-0">
                  Optional if you already saved latitude/longitude — we can build a map from those. Paste a link if you want a specific Google Maps place.
                </p>
              </div>
            </ProfileFields>
            {footer}
          </ProfileForm>
        </ProfileCard>
      );
    }
    return (
      <ProfileCard id="contact" title="Contact" saved={saved}>
        <ProfileDl>
          <ProfileDlRow label="Phone">{dash(org.phone)}</ProfileDlRow>
          <ProfileDlRow label="WhatsApp">{dash(orgStr(org, "whatsApp"))}</ProfileDlRow>
          <ProfileDlRow label="Email">{dash(org.email)}</ProfileDlRow>
          <ProfileDlRow label="Google Maps link">{dash(contact.mapEmbedUrl)}</ProfileDlRow>
        </ProfileDl>
      </ProfileCard>
    );
  }

  // ── Policies ──────────────────────────────────────────────────────────
  if (section === "policies") {
    const rules = orgObj(org, "rules");
    const houseRules = orgList<string>(rules as Record<string, unknown>, "houseRules");
    if (editing) {
      return (
        <ProfileCard id="policies" title="Check-in & policies" saved={saved}>
          <PoliciesEditForm
            org={org}
            footer={footer}
            onSavePolicies={(payload) =>
              void save(() => stayApi.organisation.savePolicies(payload))
            }
          />
        </ProfileCard>
      );
    }
    return (
      <ProfileCard id="policies" title="Check-in & policies" saved={saved}>
        <ProfileDl>
          <ProfileDlRow label="Booking type">
            {bookingTypeLabel(orgStr(org, "bookingType") || "overnight")}
          </ProfileDlRow>
          {orgStr(org, "bookingType") === "hourly" ?
            <ProfileDlRow label="Minimum hours">{dash(org.minimumHours)}</ProfileDlRow>
          : null}
          <ProfileDlRow label="Check-in">{dash(org.checkInTime)}</ProfileDlRow>
          <ProfileDlRow label="Check-out">{dash(org.checkOutTime)}</ProfileDlRow>
          <ProfileDlRow label="Overnight times">
            {(orgStr(org, "overnightTimeMode") || "fixed") === "dynamic"
              ? "Dynamic — guests can change"
              : "Fixed — property times only"}
          </ProfileDlRow>
          <ProfileDlRow label="Cancellation"><span className="org-profile-multiline">{dash(org.cancellationPolicy)}</span></ProfileDlRow>
          <ProfileDlRow label="Payment"><span className="org-profile-multiline">{dash(org.paymentPolicy)}</span></ProfileDlRow>
          <ProfileDlRow label="Pet policy">{dash(rules.petPolicy)}</ProfileDlRow>
          <ProfileDlRow label="ID proof">{dash(rules.idProofRequired)}</ProfileDlRow>
          <ProfileDlRow label="Refund">{dash(rules.refundPolicy)}</ProfileDlRow>
          <ProfileDlRow label="House rules">
            {houseRules.length ? (
              <ul className="org-profile-list">
                {houseRules.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            ) : (
              "—"
            )}
          </ProfileDlRow>
        </ProfileDl>
      </ProfileCard>
    );
  }

  // ── Website ───────────────────────────────────────────────────────────
  if (section === "website") {
    const subdomain = orgStr(org, "subdomain");
    const resolvedWebsiteUrl =
      orgStr(org, "websiteUrl") || (subdomain ? buildPropertyWebsiteUrl(subdomain) : "");
    if (editing) {
      return (
        <ProfileCard id="website" title="Website & domain" saved={saved}>
          <ProfileForm
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void save(() =>
                stayApi.organisation.saveWebsite({
                  subdomain: fd.get("subdomain"),
                  websiteUrl: fd.get("websiteUrl"),
                })
              );
            }}
          >
            <ProfileFields>
              <div>
                <FieldLabel>Subdomain</FieldLabel>
                <div className="flex items-center gap-1">
                  <ProfileInput name="subdomain" defaultValue={subdomain} placeholder="my-property" />
                  <span className="text-sm text-muted-foreground shrink-0">.{getSubdomainParentHost()}</span>
                </div>
              </div>
              <div>
                <FieldLabel>Website URL</FieldLabel>
                <ProfileInput
                  name="websiteUrl"
                  defaultValue={resolvedWebsiteUrl}
                  placeholder="https://…"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Saved automatically from your subdomain on this environment (e.g.{" "}
                  {subdomain ? buildPropertyWebsiteUrl(subdomain) : `${window.location.protocol}//myhotel.localhost:${window.location.port || "5001"}/`}).
                </p>
              </div>
            </ProfileFields>
            {footer}
          </ProfileForm>
        </ProfileCard>
      );
    }
    const customDomain = subdomain ? `${subdomain}.${getSubdomainParentHost()}` : "";
    const websiteUrl = resolvedWebsiteUrl;
    return (
      <ProfileCard id="website" title="Website & domain" saved={saved}>
        <ProfileDl>
          <ProfileDlRow label="Subdomain">{dash(subdomain)}</ProfileDlRow>
          <ProfileDlRow label="Address">{dash(customDomain)}</ProfileDlRow>
          <ProfileDlRow label="Website URL">
            {websiteUrl ? (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                {websiteUrl}
              </a>
            ) : (
              "—"
            )}
          </ProfileDlRow>
          <ProfileDlRow label="Production domain">
            {subdomain ? `${subdomain}.${DOMAIN_SUFFIX}` : "—"}
          </ProfileDlRow>
          <ProfileDlRow label="Site builder">
            <Link to="/staff/site-builder" className="text-primary hover:underline">
              Open site builder
            </Link>
          </ProfileDlRow>
        </ProfileDl>
      </ProfileCard>
    );
  }

  // ── SEO ───────────────────────────────────────────────────────────────
  if (section === "seo") {
    return (
      <SeoSection
        org={org}
        assets={assets}
        editing={editing}
        saved={saved}
        footer={footer}
        save={save}
      />
    );
  }

  // ── Messaging ─────────────────────────────────────────────────────────
  if (section === "messaging") {
    const m = orgObj(org, "messaging");
    if (editing) {
      return (
        <ProfileCard id="messaging" title="SMS & WhatsApp" wide saved={saved}>
          <ProfileForm
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void save(() =>
                stayApi.organisation.saveMessaging({
                  smsEnabled: fd.get("smsEnabled") === "on",
                  smsProvider: fd.get("smsProvider"),
                  smsApiKey: fd.get("smsApiKey"),
                  smsSenderId: fd.get("smsSenderId"),
                  whatsAppEnabled: fd.get("whatsAppEnabled") === "on",
                  whatsAppApiKey: fd.get("whatsAppApiKey"),
                  whatsAppPhoneNumberId: fd.get("whatsAppPhoneNumberId"),
                  whatsAppBusinessNumber: fd.get("whatsAppBusinessNumber"),
                  bookingConfirmationTemplate: fd.get("bookingConfirmationTemplate"),
                  checkInReminderTemplate: fd.get("checkInReminderTemplate"),
                  paymentReceiptTemplate: fd.get("paymentReceiptTemplate"),
                })
              );
            }}
          >
            <ProfileFields>
              <div className="span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="smsEnabled" defaultChecked={Boolean(m.smsEnabled)} />
                  SMS enabled
                </label>
              </div>
              <div><FieldLabel>SMS provider</FieldLabel><ProfileInput name="smsProvider" defaultValue={String(m.smsProvider || "")} /></div>
              <div><FieldLabel>SMS sender ID</FieldLabel><ProfileInput name="smsSenderId" defaultValue={String(m.smsSenderId || "")} /></div>
              <div className="span-2"><FieldLabel>SMS API key</FieldLabel><ProfileInput name="smsApiKey" type="password" autoComplete="off" defaultValue={String(m.smsApiKey || "")} /></div>
              <div className="span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="whatsAppEnabled" defaultChecked={m.whatsAppEnabled !== false} />
                  WhatsApp enabled
                </label>
              </div>
              <div><FieldLabel>WhatsApp business number</FieldLabel><ProfileInput name="whatsAppBusinessNumber" defaultValue={String(m.whatsAppBusinessNumber || "")} /></div>
              <div><FieldLabel>WhatsApp phone ID</FieldLabel><ProfileInput name="whatsAppPhoneNumberId" defaultValue={String(m.whatsAppPhoneNumberId || "")} /></div>
              <div className="span-2"><FieldLabel>WhatsApp API key</FieldLabel><ProfileInput name="whatsAppApiKey" type="password" autoComplete="off" defaultValue={String(m.whatsAppApiKey || "")} /></div>
            </ProfileFields>
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="org-profile-subhead">Message templates</h4>
              <p className="org-profile-hint">
                Placeholders: {"{guest_name}"}, {"{booking_code}"}, {"{property_name}"}, {"{check_in}"}, {"{amount}"}, {"{balance}"}
              </p>
              <ProfileFields>
                <div className="span-2">
                  <FieldLabel>Booking confirmation</FieldLabel>
                  <ProfileTextarea name="bookingConfirmationTemplate" rows={3} defaultValue={String(m.bookingConfirmationTemplate || "")} />
                </div>
                <div className="span-2">
                  <FieldLabel>Check-in reminder</FieldLabel>
                  <ProfileTextarea name="checkInReminderTemplate" rows={3} defaultValue={String(m.checkInReminderTemplate || "")} />
                </div>
                <div className="span-2">
                  <FieldLabel>Payment receipt</FieldLabel>
                  <ProfileTextarea name="paymentReceiptTemplate" rows={3} defaultValue={String(m.paymentReceiptTemplate || "")} />
                </div>
              </ProfileFields>
            </div>
            {footer}
          </ProfileForm>
        </ProfileCard>
      );
    }
    return (
      <ProfileCard id="messaging" title="SMS & WhatsApp" wide saved={saved}>
        <ProfileDl>
          <ProfileDlRow label="SMS">{m.smsEnabled ? "Enabled" : "Disabled"}</ProfileDlRow>
          <ProfileDlRow label="SMS provider">{dash(m.smsProvider)}</ProfileDlRow>
          <ProfileDlRow label="WhatsApp">{m.whatsAppEnabled !== false ? "Enabled" : "Disabled"}</ProfileDlRow>
          <ProfileDlRow label="WhatsApp number">{dash(m.whatsAppBusinessNumber)}</ProfileDlRow>
        </ProfileDl>
      </ProfileCard>
    );
  }

  // ── Payments (Razorpay) ───────────────────────────────────────────────
  if (section === "payments") {
    const p = orgObj(org, "paymentGateway");
    if (editing) {
      return (
        <ProfileCard id="payments" title="Payments (Razorpay)" wide saved={saved}>
          <ProfileForm
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void save(() =>
                stayApi.organisation.savePaymentGateway({
                  gatewayName: "razorpay",
                  apiKey: fd.get("apiKey"),
                  apiSecret: fd.get("apiSecret"),
                  upiId: fd.get("upiId"),
                  webhookSecret: fd.get("webhookSecret"),
                  environment: fd.get("environment"),
                  isActive: fd.get("isActive") === "on",
                  collectAtBooking: fd.get("collectAtBooking") === "on",
                })
              );
            }}
          >
            <p className="org-profile-hint mb-4">
              Guest booking payments go directly to this property&apos;s Razorpay account. Online checkout runs only when{" "}
              <strong>both</strong> are on: Status Enabled and Collect at booking Yes. Otherwise guests book directly
              without paying online.
            </p>
            <ProfileFields>
              <div className="span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={Boolean(p.isActive)} />
                  Enable Razorpay for this property (Status)
                </label>
              </div>
              <div className="span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="collectAtBooking" defaultChecked={p.collectAtBooking !== false} />
                  Collect payment at online booking
                </label>
                <p className="org-profile-hint mt-1">
                  Enabled + Collect = pay &amp; verify, then confirm. If either is off = book directly (pay at property).
                </p>
              </div>
              <div>
                <FieldLabel>Environment</FieldLabel>
                <select
                  name="environment"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue={String(p.environment || "test")}
                >
                  <option value="test">Test</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div>
                <FieldLabel>UPI ID (optional)</FieldLabel>
                <ProfileInput name="upiId" defaultValue={String(p.upiId || "")} />
              </div>
              <div className="span-2">
                <FieldLabel>Razorpay Key ID</FieldLabel>
                <ProfileInput
                  name="apiKey"
                  autoComplete="off"
                  placeholder="Leave blank to keep current key"
                  defaultValue=""
                />
                {p.apiKey ? <p className="org-profile-hint mt-1">Saved: {String(p.apiKey)}</p> : null}
              </div>
              <div className="span-2">
                <FieldLabel>Razorpay Key Secret</FieldLabel>
                <ProfileInput
                  name="apiSecret"
                  type="password"
                  autoComplete="off"
                  placeholder="Leave blank to keep current secret"
                  defaultValue=""
                />
              </div>
              <div className="span-2">
                <FieldLabel>Webhook secret (optional)</FieldLabel>
                <ProfileInput
                  name="webhookSecret"
                  type="password"
                  autoComplete="off"
                  placeholder="Leave blank to keep current"
                  defaultValue=""
                />
              </div>
            </ProfileFields>
            {footer}
          </ProfileForm>
        </ProfileCard>
      );
    }
    return (
      <ProfileCard id="payments" title="Payments (Razorpay)" wide saved={saved}>
        <ProfileDl>
          <ProfileDlRow label="Status">{p.isActive ? "Enabled" : "Disabled"}</ProfileDlRow>
          <ProfileDlRow label="Collect at booking">{p.collectAtBooking !== false ? "Yes" : "No"}</ProfileDlRow>
          <ProfileDlRow label="Online checkout">
            {p.isActive && p.collectAtBooking !== false && String(p.apiKey || "").trim()
              ? "Pay → verify → book"
              : "Book directly (no online payment)"}
          </ProfileDlRow>
          <ProfileDlRow label="Environment">{dash(p.environment)}</ProfileDlRow>
          <ProfileDlRow label="Key ID">{dash(p.apiKey)}</ProfileDlRow>
          <ProfileDlRow label="UPI ID">{dash(p.upiId)}</ProfileDlRow>
        </ProfileDl>
      </ProfileCard>
    );
  }

  // ── Weather ───────────────────────────────────────────────────────────
  if (section === "weather") {
    const w = orgObj(org, "weather");
    const locationLabel = [org.city, org.state, org.country].filter(Boolean).join(", ");
    const hasCoords = org.latitude != null && org.longitude != null;
    const showOnSiteDefault =
      w.showOnSite === true || w.showOnSite === "true" || (!w.configured && hasCoords);

    if (editing) {
      return (
        <ProfileCard id="weather" title="Weather" saved={saved}>
          <ProfileForm
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              void save(() =>
                stayApi.organisation.saveWeather({
                  showOnSite: fd.get("showOnSite") === "yes",
                })
              );
            }}
          >
            <div className="space-y-4">
              <p className="org-profile-hint mb-0">
                We fetch live weather from your property location — you do not enter temperature or forecast
                yourself.
              </p>
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Location used
                </p>
                <p className="font-medium">
                  {locationLabel || "No city yet"}
                  {hasCoords ? (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {String(org.latitude)}, {String(org.longitude)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground font-normal"> · add coordinates on Location for best results</span>
                  )}
                </p>
              </div>
              <fieldset className="space-y-2">
                <FieldLabel info="If yes, a weather section appears on your public site and updates automatically from this location.">
                  Show weather on your website?
                </FieldLabel>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="showOnSite"
                    value="yes"
                    defaultChecked={showOnSiteDefault}
                    className="mt-1"
                  />
                  <span>
                    <strong>Yes</strong> — show live weather based on this location
                  </span>
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="showOnSite"
                    value="no"
                    defaultChecked={!showOnSiteDefault}
                    className="mt-1"
                  />
                  <span>
                    <strong>No</strong> — hide the weather section from the site
                  </span>
                </label>
              </fieldset>
            </div>
            {footer}
          </ProfileForm>
        </ProfileCard>
      );
    }
    return (
      <ProfileCard id="weather" title="Weather" saved={saved}>
        <ProfileDl>
          <ProfileDlRow label="Show on site">
            {w.configured
              ? w.showOnSite === true || w.showOnSite === "true"
                ? "Yes — live from location"
                : "No"
              : "Not decided yet"}
          </ProfileDlRow>
          <ProfileDlRow label="Location">{dash(locationLabel || (hasCoords ? `${org.latitude}, ${org.longitude}` : ""))}</ProfileDlRow>
        </ProfileDl>
      </ProfileCard>
    );
  }

  // ── Slots & closures ──────────────────────────────────────────────────
  if (section === "schedule") {
    return (
      <ScheduleSection
        org={org}
        editing={editing}
        wide={wide}
        saved={saved}
        footer={footer}
        save={save}
      />
    );
  }

  // ── List-based content sections ───────────────────────────────────────
  return (
    <ListSection
      section={section}
      org={org}
      assets={assets}
      logoUrl={logoUrl}
      editing={editing}
      wide={wide}
      saved={saved}
      onCancel={onCancel}
      onSaved={onSaved}
      footer={footer}
      save={save}
    />
  );
}

function ScheduleSection({
  org,
  editing,
  wide,
  saved,
  footer,
  save,
}: {
  org: Record<string, unknown>;
  editing: boolean;
  wide?: boolean;
  saved?: boolean;
  footer: ReactNode;
  save: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const bookingType = orgStr(org, "bookingType") || "overnight";
  const initialSlots = orgList(org, "slots");
  const initialClosures = orgList(org, "closures");
  const [slots, setSlots] = useState<SlotDraft[]>(() =>
    initialSlots.length ? initialSlots : [emptySlotDraft(bookingType)],
  );
  const [closures, setClosures] = useState<ClosureDraft[]>(() =>
    initialClosures.length ? initialClosures : [emptyClosureDraft()],
  );

  useEffect(() => {
    setSlots(initialSlots.length ? initialSlots : [emptySlotDraft(bookingType)]);
    setClosures(initialClosures.length ? initialClosures : [emptyClosureDraft()]);
  }, [editing, org]);

  if (editing) {
    return (
      <ProfileCard
        id="schedule"
        title="Slots & closures"
        wide={wide}
        saved={saved}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className="org-profile-add-row"
              onClick={() => setSlots((prev) => [...(prev.length ? prev : []), emptySlotDraft(bookingType)])}
            >
              + Slot
            </button>
            <button
              type="button"
              className="org-profile-add-row"
              onClick={() => setClosures((prev) => [...(prev.length ? prev : []), emptyClosureDraft()])}
            >
              + Closed period
            </button>
          </div>
        }
      >
        <ProfileForm
          onSubmit={(e) => {
            e.preventDefault();
            void save(async () => {
              const payload = stripSchedulePayload(slots, closures);
              await stayApi.organisation.saveSlots(payload.slots);
              await stayApi.organisation.saveClosures(payload.closures);
            });
          }}
        >
          <ScheduleEditor
            slots={slots}
            closures={closures}
            bookingType={bookingType}
            onSlotsChange={setSlots}
            onClosuresChange={setClosures}
            hideAddButtons
          />
          {footer}
        </ProfileForm>
      </ProfileCard>
    );
  }

  if (initialSlots.length === 0 && initialClosures.length === 0) {
    return (
      <ProfileCard id="schedule" title="Slots & closures" wide={wide} saved={saved}>
        <ProfileEmpty>
          No slots or closed dates yet. Add hourly/overnight slots and mark leave or holidays when
          the property is closed.
        </ProfileEmpty>
      </ProfileCard>
    );
  }

  return (
    <ProfileCard id="schedule" title="Slots & closures" wide={wide} saved={saved}>
      <ScheduleView slots={initialSlots} closures={initialClosures} />
    </ProfileCard>
  );
}

function SeoSection({
  org,
  assets,
  editing,
  saved,
  footer,
  save,
}: {
  org: Record<string, unknown>;
  assets: Record<string, unknown>[];
  editing: boolean;
  saved?: boolean;
  footer: ReactNode;
  save: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const seo = orgObj(org, "seo");
  const keywords = orgList<string>(seo as Record<string, unknown>, "keywords");
  const logoAssetId = String(org.logoAssetId ?? "");
  const library = toLibraryAssets(assets, { logoAssetId, includeLogo: true });
  const [ogAssetId, setOgAssetId] = useState(
    () => String(seo.ogImageAssetId ?? seo.OgImageAssetId ?? ""),
  );
  const [ogImageUrl, setOgImageUrl] = useState(() => String(seo.ogImageUrl || ""));

  useEffect(() => {
    setOgAssetId(String(seo.ogImageAssetId ?? seo.OgImageAssetId ?? ""));
    setOgImageUrl(String(seo.ogImageUrl || ""));
  }, [seo.ogImageAssetId, seo.OgImageAssetId, seo.ogImageUrl, editing]);

  const selectedOgId = ogAssetId || findLibraryAsset(library, ogImageUrl)?.id || "";

  if (editing) {
    return (
      <ProfileCard id="seo" title="SEO" saved={saved}>
        <ProfileForm
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void save(() =>
              stayApi.organisation.saveSeo({
                metaTitle: fd.get("metaTitle"),
                metaDescription: fd.get("metaDescription"),
                keywords: fd.get("keywords"),
                ogImageUrl,
                ogImageAssetId: selectedOgId || null,
              }),
            );
          }}
        >
          <ProfileFields>
            <div className="span-2">
              <FieldLabel>Meta title</FieldLabel>
              <ProfileInput name="metaTitle" defaultValue={String(seo.metaTitle || "")} />
            </div>
            <div className="span-2">
              <FieldLabel>Meta description</FieldLabel>
              <ProfileTextarea name="metaDescription" rows={3} defaultValue={String(seo.metaDescription || "")} />
            </div>
            <div className="span-2">
              <FieldLabel>Keywords (comma-separated)</FieldLabel>
              <ProfileInput name="keywords" defaultValue={keywords.join(", ")} />
            </div>
            <div className="span-2 space-y-3">
              <FieldLabel>OG image (from library)</FieldLabel>
              {ogImageUrl ? (
                <img
                  src={resolveMediaUrl(ogImageUrl)}
                  alt=""
                  className="h-20 w-32 rounded-md border object-cover"
                />
              ) : null}
              <AssetImagePicker
                assets={library}
                selectedIds={selectedOgId ? [selectedOgId] : []}
                includeLogo
                logoAssetId={logoAssetId || undefined}
                label="Choose social preview image"
                onChange={(selected) => {
                  const asset = selected[0];
                  setOgAssetId(asset?.id ?? "");
                  setOgImageUrl(asset?.url ?? "");
                }}
              />
            </div>
          </ProfileFields>
          {footer}
        </ProfileForm>
      </ProfileCard>
    );
  }

  return (
    <ProfileCard id="seo" title="SEO" saved={saved}>
      <ProfileDl>
        <ProfileDlRow label="Meta title">{dash(seo.metaTitle)}</ProfileDlRow>
        <ProfileDlRow label="Meta description">
          <span className="org-profile-multiline">{dash(seo.metaDescription)}</span>
        </ProfileDlRow>
        <ProfileDlRow label="Keywords">{keywords.length ? keywords.join(", ") : "—"}</ProfileDlRow>
        <ProfileDlRow label="OG image">{dash(seo.ogImageUrl)}</ProfileDlRow>
      </ProfileDl>
    </ProfileCard>
  );
}

function ListSection({
  section,
  org,
  assets,
  logoUrl,
  editing,
  wide,
  saved,
  onCancel,
  onSaved,
  footer,
  save,
}: {
  section: ProfileSectionId;
  org: Record<string, unknown>;
  assets: Record<string, unknown>[];
  logoUrl?: string | null;
  editing: boolean;
  wide?: boolean;
  saved?: boolean;
  onCancel: () => void;
  onSaved: (s: ProfileSectionId) => void;
  footer: ReactNode;
  save: (fn: () => Promise<unknown>) => Promise<void>;
}) {
  const def = getSectionDef(section);
  const config = LIST_CONFIG[section];
  if (!config) return null;

  const initial = config.getItems(org);
  const [items, setItems] = useState(initial);
  const [packageItems, setPackageItems] = useState<PackageDraft[]>(() =>
    section === "packages"
      ? (initial.length ? initial.map((row, i) => packageFromOrgItem(row, i)) : [emptyPackageDraft(0)])
      : [],
  );
  const [nearbyItems, setNearbyItems] = useState<NearbyPlaceDraft[]>(() =>
    section === "nearby"
      ? (initial.length ? initial.map((row) => nearbyFromOrgItem(row)) : [emptyNearbyDraft()])
      : [],
  );
  const [imageItems, setImageItems] = useState<PropertyImageDraft[]>(() =>
    section === "images" ? initial.map((row) => propertyImageFromOrgItem(row)) : [],
  );
  const logoAssetId = String(org.logoAssetId ?? "");

  useEffect(() => {
    const next = config.getItems(org);
    setItems(next);
    if (section === "packages") {
      setPackageItems(
        next.length ? next.map((row, i) => packageFromOrgItem(row, i)) : [emptyPackageDraft(0)],
      );
    }
    if (section === "nearby") {
      setNearbyItems(next.length ? next.map((row) => nearbyFromOrgItem(row)) : [emptyNearbyDraft()]);
    }
    if (section === "images") {
      setImageItems(next.map((row) => propertyImageFromOrgItem(row)));
    }
  }, [section, editing, org]);

  const count = initial.length;

  if (editing) {
    const addButton =
      section === "images" ? null : (
      <button
        type="button"
        className="org-profile-add-row org-profile-add-row-top"
        onClick={() => {
          if (section === "packages") {
            setPackageItems((prev) => [...prev, emptyPackageDraft(prev.length)]);
            return;
          }
          if (section === "nearby") {
            setNearbyItems((prev) => [...prev, emptyNearbyDraft()]);
            return;
          }
          setItems((prev) => [...(prev.length ? prev : [config.emptyRow()]), config.emptyRow()]);
        }}
      >
        {section === "packages"
          ? "+ Add package"
          : section === "nearby"
            ? "+ Add place"
            : config.addLabel}
      </button>
    );

    return (
      <ProfileCard id={section} title={def.title} count={count} wide={wide} saved={saved} actions={addButton}>
        {section === "packages" && (
          <p className="org-profile-hint mb-4">
            Define stay packages. Pick cover and gallery photos from your{" "}
            <Link to="/staff/organisation?section=uploads" className="text-primary hover:underline">
              image library
            </Link>{" "}
            (saved by asset id).
          </p>
        )}
        {section === "nearby" && (
          <p className="org-profile-hint mb-4">
            Add landmarks near your property. Select a photo from the image library for each place.
          </p>
        )}
        {section === "images" && (
          <p className="org-profile-hint mb-4">
            Select gallery photos from everything you uploaded. Need more? Add them under{" "}
            <Link to="/staff/organisation?section=uploads" className="text-primary hover:underline">
              Images &amp; assets
            </Link>
            .
          </p>
        )}
        <ProfileForm
          onSubmit={(e) => {
            e.preventDefault();
            void save(async () => {
              if (section === "packages") {
                const payload = packageItems
                  .map(packageDraftToPayload)
                  .filter((row) => String(row.name ?? "").trim().length > 0);
                await config.save(payload);
                return;
              }
              if (section === "nearby") {
                const payload = nearbyItems
                  .map(nearbyDraftToPayload)
                  .filter((row) => String(row.name ?? "").trim().length > 0);
                await config.save(payload);
                return;
              }
              if (section === "images") {
                const payload = imageItems
                  .map(propertyImageDraftToPayload)
                  .filter(
                    (row) =>
                      String(row.label ?? "").trim().length > 0 ||
                      String(row.url ?? "").trim().length > 0 ||
                      String(row.assetId ?? "").trim().length > 0,
                  );
                await config.save(payload);
                return;
              }
              const payload = stripEmptyRows(items, config.requiredKey);
              await config.save(payload);
            });
          }}
        >
          {section === "packages" ? (
            <PackagesEditor
              items={packageItems}
              assets={assets}
              logoAssetId={logoAssetId || undefined}
              onChange={setPackageItems}
              hideAddButton
            />
          ) : section === "nearby" ? (
            <NearbyPlacesEditor
              items={nearbyItems}
              assets={assets}
              logoAssetId={logoAssetId || undefined}
              onChange={setNearbyItems}
              hideAddButton
            />
          ) : section === "images" ? (
            <PropertyImagesEditor
              items={imageItems}
              assets={assets}
              logoAssetId={logoAssetId || undefined}
              onChange={setImageItems}
              uploadsHref="/staff/onboarding?step=uploads"
            />
          ) : (
            <ListEditor
              items={items}
              onChange={setItems}
              fields={config.fields}
              emptyRow={config.emptyRow}
              addLabel={config.addLabel}
              rowClassName={config.rowClassName}
              hideAddButton
            />
          )}
          {footer}
        </ProfileForm>
      </ProfileCard>
    );
  }

  if (count === 0) {
    return (
      <ProfileCard id={section} title={def.title} wide={wide} saved={saved}>
        <ProfileEmpty>No {def.title.toLowerCase()} yet. Click Edit to add.</ProfileEmpty>
      </ProfileCard>
    );
  }

  return (
    <ProfileCard id={section} title={def.title} count={count} wide={wide} saved={saved}>
      {config.renderView(initial)}
    </ProfileCard>
  );
}

type ListConfig = {
  getItems: (org: Record<string, unknown>) => Record<string, unknown>[];
  requiredKey: string;
  fields: import("./ListEditor").ListField[];
  emptyRow: () => Record<string, unknown>;
  addLabel: string;
  rowClassName?: string;
  save: (items: Record<string, unknown>[]) => Promise<unknown>;
  renderView: (items: Record<string, unknown>[]) => React.ReactNode;
};

const LIST_CONFIG: Partial<Record<ProfileSectionId, ListConfig>> = {
  highlights: {
    getItems: (o) => orgList(o, "highlights"),
    requiredKey: "title",
    fields: [
      { key: "title", label: "Title", placeholder: "Title" },
      { key: "description", label: "Description", placeholder: "Description" },
    ],
    emptyRow: () => ({ icon: "", title: "", description: "" }),
    addLabel: "+ Add highlight",
    save: (items) => stayApi.organisation.saveHighlights(items),
    renderView: (items) => (
      <div className="org-profile-items">
        {items.map((item, i) => (
          <article key={i} className="org-profile-item">
            <strong>{String(item.title)}</strong>
            <p>{String(item.description)}</p>
          </article>
        ))}
      </div>
    ),
  },
  amenities: {
    getItems: (o) => orgList(o, "amenities"),
    requiredKey: "name",
    fields: [
      { key: "name", label: "Name", placeholder: "Name" },
      { key: "description", label: "Description", placeholder: "Description" },
      { key: "group", label: "Group", placeholder: "Group" },
    ],
    emptyRow: () => ({ icon: "", name: "", description: "", group: "" }),
    addLabel: "+ Add amenity",
    save: (items) => stayApi.organisation.saveAmenities(items),
    renderView: (items) => (
      <div className="org-profile-items">
        {items.map((item, i) => (
          <article key={i} className="org-profile-item">
            <strong>{String(item.name)}</strong>
            {item.group ? <span className="text-xs text-muted-foreground"> ({String(item.group)})</span> : null}
            <p>{String(item.description)}</p>
          </article>
        ))}
      </div>
    ),
  },
  packages: {
    getItems: (o) => orgList(o, "packages").sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)),
    requiredKey: "name",
    fields: [
      { key: "name", label: "Name", placeholder: "Name" },
      { key: "price", label: "Price", placeholder: "Price" },
    ],
    emptyRow: () => emptyPackageDraft(0) as unknown as Record<string, unknown>,
    addLabel: "+ Add package",
    rowClassName: "org-profile-row-package",
    save: (items) => stayApi.organisation.savePackages(items),
    renderView: (items) => (
      <div className="org-profile-items space-y-3">
        {items.map((item, i) => {
          const includes = Array.isArray(item.includes)
            ? (item.includes as unknown[]).map(String).filter(Boolean)
            : [];
          const addOns = Array.isArray(item.addOns)
            ? (item.addOns as unknown[]).map(String).filter(Boolean)
            : Array.isArray(item.AddOns)
              ? (item.AddOns as unknown[]).map(String).filter(Boolean)
              : [];
          return (
            <article key={String(item.id || i)} className="org-profile-item rounded-lg border border-border/70 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <strong>{String(item.name)}</strong>
                  {item.badge ? (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                      {String(item.badge)}
                    </span>
                  ) : null}
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {String(item.price || "—")}
                    {item.roomType ? ` · ${String(item.roomType)}` : ""}
                    {item.kind === "addon" ? " · Add-on" : " · Stay package"}
                  </p>
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    item.isActive === false ? "text-muted-foreground" : "text-emerald-700"
                  }`}
                >
                  {item.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>
              {item.description ? (
                <p className="text-sm mt-2">{String(item.description)}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {(item.validFrom || item.validTo) && (
                  <span>
                    Valid {String(item.validFrom || "—")} → {String(item.validTo || "—")}
                  </span>
                )}
                {Number(item.minimumNights) > 0 && <span>Min {String(item.minimumNights)} night(s)</span>}
                {Number(item.includedGuests) > 0 && (
                  <span>Includes {String(item.includedGuests)} guest(s)</span>
                )}
                {Number(item.extraGuestCharge) > 0 && (
                  <span>+₹{String(item.extraGuestCharge)} / extra guest</span>
                )}
                {Number(item.maxGuests) > 0 && <span>Max {String(item.maxGuests)} guest(s)</span>}
              </div>
              {includes.length > 0 && (
                <p className="text-xs mt-2">
                  <span className="font-medium text-foreground">Includes:</span> {includes.join(", ")}
                </p>
              )}
              {addOns.length > 0 && (
                <p className="text-xs mt-1">
                  <span className="font-medium text-foreground">Add-ons:</span> {addOns.join(", ")}
                </p>
              )}
              {item.imageUrl ? (
                <img
                  src={String(item.imageUrl)}
                  alt={String(item.name)}
                  className="mt-3 h-28 w-full max-w-xs rounded-md object-cover border"
                />
              ) : null}
            </article>
          );
        })}
      </div>
    ),
  },
  "guest-services": {
    getItems: (o) => orgList(o, "guestServices").sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0)),
    requiredKey: "name",
    fields: [
      { key: "name", label: "Name", placeholder: "Birthday cake" },
      { key: "price", label: "Price", placeholder: "₹500" },
      { key: "description", label: "Description", placeholder: "Chocolate cake with candles" },
      { key: "category", label: "Category", placeholder: "celebration", defaultValue: "celebration" },
      { key: "icon", label: "Icon", placeholder: "🎂" },
      { key: "sortOrder", label: "Sort", type: "number", defaultValue: "0" },
      { key: "isActive", label: "Active", type: "checkbox", defaultValue: true },
    ],
    emptyRow: () => ({
      id: "",
      name: "",
      price: "",
      description: "",
      category: "celebration",
      icon: "",
      sortOrder: 0,
      isActive: true,
    }),
    addLabel: "+ Add service",
    rowClassName: "org-profile-row-guest-service",
    save: (items) => stayApi.organisation.saveGuestServices(items),
    renderView: (items) => (
      <div className="org-profile-items">
        {items.map((item, i) => (
          <article key={i} className="org-profile-item">
            {item.icon ? <span className="mr-1">{String(item.icon)}</span> : null}
            <strong>{String(item.name)}</strong> — {String(item.price)}
            {item.description ? (
              <p className="text-sm text-muted-foreground mt-1">{String(item.description)}</p>
            ) : null}
            {item.category ? (
              <span className="text-xs text-muted-foreground ml-1">({String(item.category)})</span>
            ) : null}
            {item.isActive === false && <span className="text-xs text-muted-foreground"> (inactive)</span>}
          </article>
        ))}
      </div>
    ),
  },
  offers: {
    getItems: (o) => orgList(o, "offers"),
    requiredKey: "title",
    fields: [
      { key: "title", label: "Title", placeholder: "Title" },
      { key: "price", label: "Price", placeholder: "Price" },
      { key: "description", label: "Description", placeholder: "Description" },
    ],
    emptyRow: () => ({ title: "", price: "", description: "", validUntil: "" }),
    addLabel: "+ Add offer",
    save: (items) => stayApi.organisation.saveOffers(items),
    renderView: (items) => (
      <div className="org-profile-items">
        {items.map((item, i) => (
          <article key={i} className="org-profile-item">
            <strong>{String(item.title)}</strong> — {String(item.price)}
            <p>{String(item.description)}</p>
          </article>
        ))}
      </div>
    ),
  },
  images: {
    getItems: (o) => orgList(o, "images"),
    requiredKey: "label",
    fields: [
      { key: "label", label: "Label", placeholder: "Label" },
      { key: "category", label: "Category", placeholder: "Category" },
      { key: "url", label: "URL", placeholder: "Image URL", readOnly: false },
    ],
    emptyRow: () => ({ assetId: "", label: "", category: "", url: "" }),
    addLabel: "+ Add image",
    save: (items) => stayApi.organisation.saveImages(items),
    renderView: (items) => (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-2 pr-3">Preview</th>
              <th className="py-2 pr-3">Label</th>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2">URL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const url = String(item.url ?? "").trim();
              return (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 pr-3">
                    {url ? (
                      <img
                        src={resolveMediaUrl(url)}
                        alt={String(item.label ?? "")}
                        className="h-10 w-10 rounded border border-border object-cover"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 pr-3">{String(item.label)}</td>
                  <td className="py-2 pr-3">{String(item.category)}</td>
                  <td className="py-2 truncate max-w-[12rem]">{url || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    ),
  },
  nearby: {
    getItems: (o) => orgList(o, "nearbyPlaces"),
    requiredKey: "name",
    fields: [
      { key: "name", label: "Name", placeholder: "Name" },
      { key: "distance", label: "Distance", placeholder: "Distance" },
      { key: "travelTime", label: "Travel time", placeholder: "Travel time" },
    ],
    emptyRow: () => ({ name: "", distance: "", travelTime: "", icon: "", imageUrl: "", mapUrl: "" }),
    addLabel: "+ Add place",
    save: (items) => stayApi.organisation.saveNearby(items),
    renderView: (items) => (
      <ul className="org-profile-list space-y-3">
        {items.map((item, i) => {
          const imageUrl = String(item.imageUrl ?? item.ImageUrl ?? "").trim();
          const mapUrl = String(item.mapUrl ?? item.MapUrl ?? "").trim();
          return (
            <li key={i} className="flex items-start gap-3">
              {imageUrl ? (
                <img
                  src={resolveMediaUrl(imageUrl)}
                  alt={String(item.name)}
                  className="h-14 w-14 shrink-0 rounded-md border border-border object-cover"
                />
              ) : null}
              <div>
                <strong>{String(item.name)}</strong> — {String(item.distance)}
                {item.travelTime ? `, ${String(item.travelTime)}` : ""}
                {mapUrl ? (
                  <div className="mt-1">
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    ),
  },
  activities: {
    getItems: (o) => orgList(o, "activities"),
    requiredKey: "title",
    fields: [
      { key: "title", label: "Title", placeholder: "Title" },
      { key: "description", label: "Description", placeholder: "Description" },
    ],
    emptyRow: () => ({ title: "", description: "", icon: "" }),
    addLabel: "+ Add activity",
    save: (items) => stayApi.organisation.saveActivities(items),
    renderView: (items) => (
      <div className="org-profile-items">
        {items.map((item, i) => (
          <article key={i} className="org-profile-item">
            <strong>{String(item.title)}</strong>
            <p>{String(item.description)}</p>
          </article>
        ))}
      </div>
    ),
  },
  reviews: {
    getItems: (o) => orgList(o, "reviews"),
    requiredKey: "author",
    fields: [
      { key: "author", label: "Author", placeholder: "Author" },
      { key: "rating", label: "Rating", type: "number", defaultValue: "5" },
      { key: "quote", label: "Quote", placeholder: "Quote" },
    ],
    emptyRow: () => ({ author: "", rating: 5, quote: "", date: "", photos: [] }),
    addLabel: "+ Add review",
    save: (items) => stayApi.organisation.saveReviews(items),
    renderView: (items) => (
      <div className="org-profile-items">
        {items.map((item, i) => (
          <article key={i} className="org-profile-item">
            <strong>{String(item.author)}</strong> ({String(item.rating)}/5)
            <p className="italic">&ldquo;{String(item.quote)}&rdquo;</p>
          </article>
        ))}
      </div>
    ),
  },
  food: {
    getItems: (o) => orgList(o, "foodMenu"),
    requiredKey: "title",
    fields: [
      { key: "meal", label: "Meal", placeholder: "Breakfast" },
      { key: "title", label: "Title", placeholder: "Title" },
      { key: "description", label: "Description", placeholder: "Description" },
    ],
    emptyRow: () => ({ meal: "", title: "", description: "", cuisines: [] }),
    addLabel: "+ Add menu item",
    save: (items) => stayApi.organisation.saveFoodMenu(items),
    renderView: (items) => (
      <div className="org-profile-items">
        {items.map((item, i) => (
          <article key={i} className="org-profile-item">
            <strong>{String(item.title)}</strong>
            {item.meal ? <span className="text-xs text-muted-foreground"> ({String(item.meal)})</span> : null}
            <p>{String(item.description)}</p>
          </article>
        ))}
      </div>
    ),
  },
  travel: {
    getItems: (o) => {
      const travel = orgList(o, "travelInfo");
      const contact = orgObj(o, "contactInfo");
      const distances = orgList(contact as Record<string, unknown>, "travelDistances");
      return [...travel, ...distances];
    },
    requiredKey: "from",
    fields: [
      { key: "from", label: "From", placeholder: "From" },
      { key: "distance", label: "Distance", placeholder: "Distance" },
      { key: "travelTime", label: "Travel time", placeholder: "Travel time" },
    ],
    emptyRow: () => ({ from: "", distance: "", travelTime: "", notes: "", icon: "" }),
    addLabel: "+ Add route",
    save: (items) => stayApi.organisation.saveTravel(items),
    renderView: (items) => (
      <ul className="org-profile-list">
        {items.map((item, i) => (
          <li key={i}>
            <strong>{String(item.from)}</strong> — {String(item.distance)}, {String(item.travelTime)}
          </li>
        ))}
      </ul>
    ),
  },
  faq: {
    getItems: (o) => orgList(o, "faq"),
    requiredKey: "question",
    fields: [
      { key: "question", label: "Question", placeholder: "Question" },
      { key: "answer", label: "Answer", placeholder: "Answer" },
    ],
    emptyRow: () => ({ question: "", answer: "" }),
    addLabel: "+ Add FAQ",
    save: (items) => stayApi.organisation.saveFaq(items),
    renderView: (items) => (
      <div className="org-profile-items">
        {items.map((item, i) => (
          <article key={i} className="org-profile-item">
            <strong>{String(item.question)}</strong>
            <p>{String(item.answer)}</p>
          </article>
        ))}
      </div>
    ),
  },
};
