import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Building2,
  CalendarClock,
  CalendarOff,
  CloudSun,
  CreditCard,
  HelpCircle,
  ImageIcon,
  Images,
  Info,
  LayoutTemplate,
  MapPin,
  MessageSquare,
  Package,
  Search,
  Sparkles,
  Star,
  UtensilsCrossed,
  ConciergeBell,
  Tag,
  MapPinned,
  Phone,
  Globe,
} from "lucide-react";
import type { ProfileSectionId } from "@/models/stay";
import { sectionGroups, countForSection } from "@/config/profileSections";

const SECTION_ICONS: Record<ProfileSectionId, LucideIcon> = {
  basic: Info,
  location: MapPin,
  contact: Phone,
  policies: CalendarClock,
  schedule: CalendarOff,
  website: Globe,
  uploads: ImageIcon,
  seo: Search,
  messaging: MessageSquare,
  payments: CreditCard,
  weather: CloudSun,
  highlights: Sparkles,
  amenities: Building2,
  packages: Package,
  "guest-services": ConciergeBell,
  offers: Tag,
  images: Images,
  nearby: MapPinned,
  activities: Activity,
  reviews: Star,
  food: UtensilsCrossed,
  travel: MapPin,
  faq: HelpCircle,
};

interface ProfileSectionNavProps {
  active: ProfileSectionId;
  org: Record<string, unknown>;
  assets?: Record<string, unknown>[];
  onSelect: (id: ProfileSectionId) => void;
}

export function ProfileSectionNav({ active, org, assets, onSelect }: ProfileSectionNavProps) {
  return (
    <nav className="org-profile-nav" aria-label="Profile sections">
      {sectionGroups().map(([group, sections]) => (
        <div key={group} className="org-profile-nav-group">
          <p className="org-profile-nav-group-title">{group}</p>
          {sections.map((s) => {
            const count =
              s.id === "uploads"
                ? countForSection(org, s.id, assets)
                : countForSection(org, s.id);
            const Icon = SECTION_ICONS[s.id] ?? LayoutTemplate;
            return (
              <button
                key={s.id}
                type="button"
                className={`org-profile-nav-link${active === s.id ? " org-profile-nav-link-active" : ""}${
                  s.id === "uploads" ? " org-profile-nav-link-asset" : ""
                }`}
                onClick={() => onSelect(s.id)}
              >
                <span className="org-profile-nav-link-label">
                  <Icon className="org-profile-nav-icon" aria-hidden />
                  <span>{s.title}</span>
                </span>
                {count > 0 && <span className="org-profile-nav-count">{count}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function ProfileSectionMobileSelect({
  active,
  onSelect,
}: {
  active: ProfileSectionId;
  onSelect: (id: ProfileSectionId) => void;
}) {
  const groups = sectionGroups();
  return (
    <div className="md:hidden mt-3">
      <label className="org-profile-label" htmlFor="profile-section-mobile">
        Section
      </label>
      <select
        id="profile-section-mobile"
        className="org-profile-input mt-1"
        value={active}
        onChange={(e) => onSelect(e.target.value as ProfileSectionId)}
      >
        {groups.flatMap(([group, sections]) =>
          sections.map((s) => (
            <option key={s.id} value={s.id}>
              {group} · {s.title}
            </option>
          ))
        )}
      </select>
    </div>
  );
}

export function ProfileOutletHeader({
  title,
  mode,
  showEdit,
  onEdit,
}: {
  title: string;
  mode: string;
  showEdit: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="org-profile-outlet-header">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{mode}</p>
        <h2 className="font-display truncate text-lg font-bold tracking-tight">{title}</h2>
      </div>
      {showEdit && (
        <button type="button" className="org-profile-btn-primary shrink-0" onClick={onEdit}>
          Edit
        </button>
      )}
    </div>
  );
}

export function ProfileHeaderLinks() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/staff/dashboard" className="org-profile-btn-secondary text-sm">
        Dashboard
      </Link>
      <Link to="/property" target="_blank" rel="noopener" className="org-profile-btn-secondary text-sm">
        Preview site
      </Link>
    </div>
  );
}
