import type { ReactNode } from "react";
import { Children, isValidElement } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import "./organisation-profile.css";

export function dash(value: unknown): string {
  if (value == null || value === "") return "—";
  return String(value);
}

export function orgStr(org: Record<string, unknown>, key: string): string {
  if (Object.prototype.hasOwnProperty.call(org, key)) {
    const v = org[key];
    return v == null ? "" : String(v);
  }
  // WhatsApp → whatsApp after Pascal→camel; UI often looks up "whatsapp"
  const lower = key.toLowerCase();
  for (const [k, v] of Object.entries(org)) {
    if (k.toLowerCase() === lower) return v == null ? "" : String(v);
  }
  return "";
}

export function orgObj(org: Record<string, unknown>, key: string): Record<string, unknown> {
  const v = org[key];
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function orgList<T = Record<string, unknown>>(org: Record<string, unknown>, key: string): T[] {
  const v = org[key];
  return Array.isArray(v) ? (v as T[]) : [];
}

export function formatUtcDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return dash(value);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function ProfileCard({
  id,
  title,
  count,
  wide,
  saved,
  actions,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  wide?: boolean;
  saved?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={`section-${id}`}
      className={`org-profile-card${wide ? " org-profile-card-wide" : ""}${saved ? " org-profile-card-saved" : ""}`}
    >
      <div className="org-profile-card-header">
        <div className="org-profile-card-heading">
          <h3 className="org-profile-card-title">{title}</h3>
          {count != null && count > 0 && <span className="org-profile-count">{count}</span>}
        </div>
        {actions ? <div className="org-profile-card-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function ProfileDl({ children }: { children: React.ReactNode }) {
  return <dl className="org-profile-dl">{children}</dl>;
}

export function ProfileDlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function ProfileFormFooter({
  onCancel,
  saving,
  mode = "default",
  onSkip,
  showSkip = false,
}: {
  onCancel: () => void;
  saving?: boolean;
  mode?: "default" | "onboarding";
  onSkip?: () => void;
  showSkip?: boolean;
}) {
  return (
    <div className="org-profile-form-footer">
      <button type="button" className="org-profile-btn-secondary" onClick={onCancel} disabled={saving}>
        {mode === "onboarding" ? "Back" : "Cancel"}
      </button>
      <div className="flex gap-2">
        {showSkip && onSkip ? (
          <button type="button" className="org-profile-btn-secondary" onClick={onSkip} disabled={saving}>
            Skip for now
          </button>
        ) : null}
        <button type="submit" className="org-profile-btn-primary" disabled={saving}>
          {saving ? "Saving…" : mode === "onboarding" ? "Save & continue" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

export function ProfileEmpty({ children }: { children: React.ReactNode }) {
  return <p className="org-profile-empty">{children}</p>;
}

export function FieldInfoTip({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="org-profile-field-info"
          aria-label="About this field"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="top" className="org-profile-field-info-pop w-64 p-3 text-sm leading-snug">
        {text}
      </PopoverContent>
    </Popover>
  );
}

export function FieldLabel({ children, info }: { children: React.ReactNode; info?: string }) {
  return (
    <label className="org-profile-label">
      <span>{children}</span>
      {info ? <FieldInfoTip text={info} /> : null}
    </label>
  );
}

export function ProfileInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`org-profile-input${props.className ? ` ${props.className}` : ""}`} />;
}

export function ProfileTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`org-profile-input${props.className ? ` ${props.className}` : ""}`} />;
}

export function ProfileFields({ children }: { children: React.ReactNode }) {
  return <div className="org-profile-fields">{children}</div>;
}

export function ProfileForm({
  onSubmit,
  children,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  const items = Children.toArray(children);
  let footer: ReactNode = null;
  let body = items;
  const last = items[items.length - 1];
  if (isValidElement(last) && last.type === ProfileFormFooter) {
    footer = last;
    body = items.slice(0, -1);
  }

  return (
    <form onSubmit={onSubmit} className="org-profile-form">
      <div className="org-profile-form-scroll">{body}</div>
      {footer}
    </form>
  );
}
