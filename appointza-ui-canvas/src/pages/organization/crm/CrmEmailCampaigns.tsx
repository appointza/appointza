import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Inbox,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Send,
  TestTube2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type {
  EmailCampaignDto,
  EmailMessageDto,
} from "@/models/emailCampaign.model";
import { EmailCampaignService } from "@/services/emailCampaign.service";
import { cn } from "@/lib/utils";
import { org } from "@/lib/orgTheme";

function apiError(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  return err instanceof Error ? err.message : fallback;
}

function statusClass(status: string) {
  switch ((status || "").toLowerCase()) {
    case "sent":
      return "bg-emerald-50 text-emerald-700";
    case "sent_with_errors":
      return "bg-amber-50 text-amber-800";
    case "failed":
      return "bg-rose-50 text-rose-700";
    case "sending":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-stone-100 text-stone-600";
  }
}

export default function CrmEmailCampaigns() {
  const { toast } = useToast();
  const api = useMemo(() => new EmailCampaignService(), []);

  const [campaigns, setCampaigns] = useState<EmailCampaignDto[]>([]);
  const [inbox, setInbox] = useState<EmailMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audienceMode, setAudienceMode] = useState("leads_with_email");
  const [manualEmails, setManualEmails] = useState("");
  const [testTo, setTestTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, messages] = await Promise.all([
        api.select({ limit: 50 }),
        api.listInbox(40),
      ]);
      setCampaigns(c);
      setInbox(messages);
    } catch (err) {
      toast({
        title: "Could not load email campaigns",
        description: apiError(err, "Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const createAndSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: "Subject and body are required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const manual =
        audienceMode === "manual"
          ? manualEmails
              .split(/[\n,;]+/)
              .map((e) => e.trim())
              .filter(Boolean)
          : undefined;
      const created = await api.create({
        name: name.trim() || subject.trim(),
        subject: subject.trim(),
        body_text: body.trim(),
        audience_mode: audienceMode,
        manual_emails: manual,
      });
      const result = await api.send(created.id);
      toast({
        title: result.success ? "Campaign sent" : "Send finished with errors",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      setName("");
      setSubject("");
      setBody("");
      setManualEmails("");
      await load();
    } catch (err) {
      toast({
        title: "Could not send campaign",
        description: apiError(
          err,
          "Check Profile → Email app password, then try again.",
        ),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const runTestSend = async () => {
    if (!testTo.trim()) {
      toast({ title: "Enter a test recipient email", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const result = await api.testSend({
        to_email: testTo.trim(),
        subject: subject.trim() || "Appointza test email",
        body_text: body.trim() || "This is a test email from Appointza.",
      });
      toast({ title: "Test sent", description: result.message });
      await load();
    } catch (err) {
      toast({
        title: "Test send failed",
        description: apiError(err, "Check your Gmail app password connection."),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const syncInbox = async () => {
    setBusy(true);
    try {
      const result = await api.syncInbox(40);
      toast({ title: "Inbox synced", description: result.message });
      await load();
    } catch (err) {
      toast({
        title: "Inbox sync failed",
        description: apiError(
          err,
          "Enable IMAP in Gmail and use an app password under Profile → Email.",
        ),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-[#f5f7f9] p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-appointza-navy md:text-xl">
              Email Campaigns
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Send through your connected Gmail/SMTP account and sync inbound mail via IMAP.{" "}
              <Link
                to="/organization/profile?tab=email"
                className="font-medium text-blue-600 hover:underline"
              >
                Email settings
              </Link>
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(org.btnOutline, "h-9")}
            disabled={busy || loading}
            onClick={() => void load()}
          >
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-appointza-navy">Compose & send</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Campaign name (optional)</Label>
              <Input
                className={cn(org.input, "mt-1.5")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="March outreach"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Subject</Label>
              <Input
                className={cn(org.input, "mt-1.5")}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Quick update from our team"
              />
            </div>
            <div className="md:col-span-2">
              <Label>Body</Label>
              <Textarea
                className={cn(org.input, "mt-1.5 min-h-[120px]")}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email…"
              />
            </div>
            <div>
              <Label>Audience</Label>
              <Select value={audienceMode} onValueChange={setAudienceMode}>
                <SelectTrigger className={cn(org.input, "mt-1.5")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leads_with_email">
                    CRM leads with email
                  </SelectItem>
                  <SelectItem value="manual">Manual email list</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {audienceMode === "manual" ? (
              <div>
                <Label>Emails (comma or new line)</Label>
                <Textarea
                  className={cn(org.input, "mt-1.5 min-h-[80px]")}
                  value={manualEmails}
                  onChange={(e) => setManualEmails(e.target.value)}
                  placeholder="a@x.com, b@y.com"
                />
              </div>
            ) : (
              <div className="flex items-end">
                <p className="text-[12px] text-stone-500">
                  Sends to active leads/contacts that have an email on file (max 500).
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className={cn(org.btnPrimary, "h-9")}
              disabled={busy}
              onClick={() => void createAndSend()}
            >
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Create & send now
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <TestTube2 className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-appointza-navy">Test send</h2>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[16rem] flex-1">
              <Label htmlFor="test-to">Send one test email to</Label>
              <Input
                id="test-to"
                type="email"
                className={cn(org.input, "mt-1.5")}
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="you@gmail.com"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className={cn(org.btnOutline, "h-9")}
              disabled={busy}
              onClick={() => void runTestSend()}
            >
              Send test
            </Button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3 sm:px-5">
            <Mail className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-appointza-navy">Campaigns</h2>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs tabular-nums text-stone-600">
              {campaigns.length}
            </span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-8 text-sm text-stone-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : campaigns.length === 0 ? (
            <p className="px-4 py-8 text-sm text-stone-500 sm:px-5">
              No campaigns yet. Compose above to send your first email blast.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {campaigns.map((c) => (
                <li key={c.id} className="px-4 py-3.5 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-appointza-navy">{c.name || c.subject}</p>
                      <p className="mt-0.5 text-[12px] text-stone-500">{c.subject}</p>
                      <p className="mt-1 text-[12px] text-stone-500">
                        Selected {c.selected_count} · Sent {c.sent_count} · Failed {c.failed_count}
                        {c.sent_at
                          ? ` · ${format(new Date(c.sent_at), "dd MMM yyyy HH:mm")}`
                          : ""}
                      </p>
                      {c.last_error ? (
                        <p className="mt-1 text-[12px] text-rose-600">{c.last_error}</p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-medium capitalize",
                        statusClass(c.status),
                      )}
                    >
                      {c.status.replaceAll("_", " ")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-appointza-navy">Inbox (IMAP)</h2>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs tabular-nums text-stone-600">
                {inbox.length}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              className={cn(org.btnPrimary, "h-8")}
              disabled={busy}
              onClick={() => void syncInbox()}
            >
              {busy ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              )}
              Sync inbox
            </Button>
          </div>
          {inbox.length === 0 ? (
            <p className="px-4 py-8 text-sm text-stone-500 sm:px-5">
              No messages yet. Click Sync inbox to pull recent mail from Gmail IMAP.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {inbox.map((m) => (
                <li key={m.id} className="px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        m.direction === "outbound"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {m.direction}
                    </span>
                    <p className="text-[13px] font-medium text-appointza-navy">
                      {m.subject || "(no subject)"}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[12px] text-stone-500">
                    {m.direction === "outbound" ? `To ${m.to_address}` : `From ${m.from_address}`}
                    {m.received_at
                      ? ` · ${format(new Date(m.received_at), "dd MMM yyyy HH:mm")}`
                      : ""}
                  </p>
                  {m.body_preview ? (
                    <p className="mt-1 line-clamp-2 text-[12px] text-stone-600">{m.body_preview}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
