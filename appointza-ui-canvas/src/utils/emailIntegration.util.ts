import type { EmailProvider } from "@/models/organisationCommunicationIntegration.model";

export type EmailAuthMode = "app_password" | "oauth" | "smtp";

export type SmtpPreset = {
  host: string;
  port: number;
  tls_mode: string;
  /** Short help shown under the password field. */
  passwordHint: string;
  /** Label for the secret field (App password vs SMTP password). */
  passwordLabel: string;
};

/** Default SMTP settings for known mailbox providers. */
export function smtpPresetForProvider(provider: EmailProvider | string): SmtpPreset {
  switch (provider) {
    case "gmail":
    case "google_workspace":
      return {
        host: "smtp.gmail.com",
        port: 587,
        tls_mode: "starttls",
        passwordHint:
          "Create an App password in Google Account → Security → 2-Step Verification → App passwords.",
        passwordLabel: "App password",
      };
    case "microsoft365":
      return {
        host: "smtp.office365.com",
        port: 587,
        tls_mode: "starttls",
        passwordHint:
          "Use your Microsoft 365 mailbox password, or an app password if your org requires MFA.",
        passwordLabel: "App password / mailbox password",
      };
    default:
      return {
        host: "",
        port: 587,
        tls_mode: "starttls",
        passwordHint: "SMTP password for your mail server.",
        passwordLabel: "SMTP password",
      };
  }
}

/** Providers that support simple app-password (SMTP) setup. */
export function providerSupportsAppPassword(provider: EmailProvider | string): boolean {
  return provider === "gmail" || provider === "google_workspace" || provider === "microsoft365";
}

export function defaultAuthModeForProvider(provider: EmailProvider | string): EmailAuthMode {
  if (provider === "smtp") return "smtp";
  if (providerSupportsAppPassword(provider)) return "app_password";
  return "oauth";
}

export function applyProviderSmtpDefaults(
  provider: EmailProvider | string,
  current: { smtp_host: string; smtp_port: number; smtp_tls_mode: string; smtp_username: string; email_address: string },
): { smtp_host: string; smtp_port: number; smtp_tls_mode: string; smtp_username: string } {
  if (provider === "smtp") {
    return {
      smtp_host: current.smtp_host,
      smtp_port: current.smtp_port || 587,
      smtp_tls_mode: current.smtp_tls_mode || "starttls",
      smtp_username: current.smtp_username || current.email_address,
    };
  }
  const preset = smtpPresetForProvider(provider);
  return {
    smtp_host: preset.host,
    smtp_port: preset.port,
    smtp_tls_mode: preset.tls_mode,
    smtp_username: (current.smtp_username || current.email_address || "").trim(),
  };
}
