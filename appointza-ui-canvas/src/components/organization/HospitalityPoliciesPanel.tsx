import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ResponsiveEditSheet } from "@/components/organization/ResponsiveEditSheet";
import {
  HospitalityProfileSettingsReq,
  OrganisationHospitalityProfile,
} from "@/models/hospitality.model";
import { hospitalityService } from "@/services/hospitality.service";
import { useToast } from "@/hooks/use-toast";

type HospitalityPoliciesPanelProps = {
  organisationId: number;
  profile: OrganisationHospitalityProfile | null;
  loading: boolean;
  onSaved: (profile: OrganisationHospitalityProfile) => void;
};

function bookingTypeLabel(value: string): string {
  return value === "hourly" ? "Hourly (per hour)" : "Overnight (per night)";
}

export function HospitalityPoliciesPanel({
  organisationId,
  profile,
  loading,
  onSaved,
}: HospitalityPoliciesPanelProps) {
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(() => new HospitalityProfileSettingsReq());

  useEffect(() => {
    if (!profile) return;
    const next = new HospitalityProfileSettingsReq();
    next.organisation_id = organisationId;
    next.organisation_type = profile.organisation_type;
    next.property_type = profile.property_type;
    next.booking_type = profile.booking_type || "overnight";
    next.minimum_hours = profile.minimum_hours || 2;
    next.checkin_time = profile.checkin_time || "14:00";
    next.checkout_time = profile.checkout_time || "11:00";
    next.overnight_time_mode = profile.overnight_time_mode || "fixed";
    next.cancellation_policy = profile.cancellation_policy || "";
    next.payment_policy = profile.payment_policy || "";
    setDraft(next);
  }, [organisationId, profile]);

  const savePolicies = async () => {
    if (organisationId <= 0) return;
    setSaving(true);
    try {
      const payload = { ...draft, organisation_id: organisationId };
      if (payload.booking_type !== "hourly") payload.minimum_hours = 0;
      const updated = await hospitalityService.saveSettings(payload);
      onSaved(updated);
      setEditorOpen(false);
      toast({ title: "Saved", description: "Policies updated." });
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 text-stone-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading policies…
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle className="text-lg">Check-in & policies</CardTitle>
            <p className="text-sm text-stone-500">
              Booking type and guest policies stored on your organisation profile.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditorOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-stone-400">Booking type</p>
            <p className="text-stone-800">{bookingTypeLabel(profile?.booking_type || "overnight")}</p>
          </div>
          {profile?.booking_type === "hourly" ?
            <div>
              <p className="text-xs font-medium uppercase text-stone-400">Minimum hours</p>
              <p className="text-stone-800">{profile.minimum_hours}</p>
            </div>
          : null}
          <div>
            <p className="text-xs font-medium uppercase text-stone-400">Check-in</p>
            <p className="text-stone-800">{profile?.checkin_time || "14:00"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-stone-400">Check-out</p>
            <p className="text-stone-800">{profile?.checkout_time || "11:00"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase text-stone-400">Cancellation policy</p>
            <p className="whitespace-pre-wrap text-stone-800">
              {profile?.cancellation_policy || "—"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium uppercase text-stone-400">Payment policy</p>
            <p className="whitespace-pre-wrap text-stone-800">{profile?.payment_policy || "—"}</p>
          </div>
        </CardContent>
      </Card>

      <ResponsiveEditSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        title="Edit — Check-in & policies"
        subtitle="Booking type, times, and guest policies for your organisation."
        isEdit
        saving={saving}
        onCancel={() => setEditorOpen(false)}
        onSave={() => void savePolicies()}
        saveLabel="Save policies"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Booking type</Label>
            <Select
              value={draft.booking_type}
              onValueChange={(value) =>
                setDraft({ ...draft, booking_type: value, minimum_hours: value === "hourly" ? draft.minimum_hours || 2 : 0 })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overnight">Overnight (per night)</SelectItem>
                <SelectItem value="hourly">Hourly (per hour / slots)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {draft.booking_type === "hourly" ?
            <div className="space-y-1">
              <Label>Minimum hours</Label>
              <Input
                type="number"
                min={1}
                value={draft.minimum_hours || ""}
                onChange={(e) =>
                  setDraft({ ...draft, minimum_hours: Number(e.target.value) || 2 })
                }
              />
            </div>
          : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>Check-in time</Label>
              <Input
                type="time"
                value={draft.checkin_time}
                onChange={(e) => setDraft({ ...draft, checkin_time: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Check-out time</Label>
              <Input
                type="time"
                value={draft.checkout_time}
                onChange={(e) => setDraft({ ...draft, checkout_time: e.target.value })}
              />
            </div>
          </div>
          {draft.booking_type === "overnight" ?
            <div className="space-y-1">
              <Label>Overnight times on booking form</Label>
              <Select
                value={draft.overnight_time_mode}
                onValueChange={(value) => setDraft({ ...draft, overnight_time_mode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed — guests use property times only</SelectItem>
                  <SelectItem value="dynamic">Dynamic — guests can change times</SelectItem>
                </SelectContent>
              </Select>
            </div>
          : null}
          <div className="space-y-1">
            <Label>Cancellation policy</Label>
            <Textarea
              value={draft.cancellation_policy}
              onChange={(e) => setDraft({ ...draft, cancellation_policy: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label>Payment policy</Label>
            <Textarea
              value={draft.payment_policy}
              onChange={(e) => setDraft({ ...draft, payment_policy: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </ResponsiveEditSheet>
    </>
  );
}
