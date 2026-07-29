import { LucideIcon } from "lucide-react";
import { settingsEmbedded } from "@/lib/settingsEmbedded";

interface SettingsEmbeddedHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  variant?: "gradient" | "plain";
}

const SettingsEmbeddedHeader = ({
  icon: Icon,
  title,
  description,
  variant = "gradient",
}: SettingsEmbeddedHeaderProps) => (
  <div
    className={
      variant === "gradient" ? settingsEmbedded.sectionHeader : settingsEmbedded.sectionHeaderPlain
    }
  >
    <h2 className={settingsEmbedded.title}>
      <span className={settingsEmbedded.iconWrap}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      {title}
    </h2>
    {description ? <p className={settingsEmbedded.description}>{description}</p> : null}
  </div>
);

export default SettingsEmbeddedHeader;
