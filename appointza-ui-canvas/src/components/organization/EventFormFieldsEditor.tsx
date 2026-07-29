import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  EVENT_BOOKING_FIELD_TYPES,
  type EventBookingFormField,
  ensureUniqueEventBookingFieldKey,
  isValidEventBookingFieldKey,
  nextEventBookingFieldDisplayOrder,
  slugifyEventBookingFieldKey,
  sortEventBookingFormFieldsByDisplayOrder,
} from "@/utils/eventBookingFormFields.util";

/** Add booking form fields one-by-one; stored as `{ fields: [...] }` JSON in reference value notes. */
export function EventFormFieldsEditor({
  fields,
  onChange,
  idPrefix,
}: {
  fields: EventBookingFormField[];
  onChange: (next: EventBookingFormField[]) => void;
  idPrefix: string;
}) {
  const { toast } = useToast();
  const [draftKey, setDraftKey] = useState("");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftType, setDraftType] = useState<string>("string");
  const [draftRequired, setDraftRequired] = useState(false);

  const handleAddField = () => {
    const label = draftLabel.trim();
    if (!label) {
      toast({
        title: "Missing label",
        description: "Enter the text guests will see, then add the field.",
        variant: "destructive",
      });
      return;
    }
    let key = draftKey.trim();
    if (!key || !isValidEventBookingFieldKey(key)) {
      key = slugifyEventBookingFieldKey(label);
    }
    key = ensureUniqueEventBookingFieldKey(fields, key);
    if (!isValidEventBookingFieldKey(key)) {
      toast({
        title: "Could not create key",
        description: "Try a short English key (e.g. husband_name) or tap “Suggest key”.",
        variant: "destructive",
      });
      return;
    }
    onChange([
      ...fields,
      {
        key,
        label,
        type: draftType,
        required: draftRequired,
        DisplayOrder: nextEventBookingFieldDisplayOrder(fields),
      },
    ]);
    setDraftKey("");
    setDraftLabel("");
    setDraftType("string");
    setDraftRequired(false);
  };

  const suggestedKey = draftLabel.trim() ? slugifyEventBookingFieldKey(draftLabel) : "";
  const draftKeyOk = draftKey.trim() === "" || isValidEventBookingFieldKey(draftKey);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/20 px-3 py-2.5 sm:px-4">
        <Label className="text-base font-semibold">Booking form fields</Label>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Guests only see the <strong>label</strong>. The <strong>key</strong> is internal (letters, numbers,
          underscores). If you leave key blank, a safe key is created from the label. Use{" "}
          <strong>Order</strong> for the sequence on the booking page (lower first).
        </p>
      </div>
      {fields.length > 0 ? (
        <ul className="list-none space-y-2">
          {sortEventBookingFormFieldsByDisplayOrder([...fields]).map((f) => (
            <li
              key={f.key}
              className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm ring-1 ring-border/60 sm:flex-row sm:items-stretch sm:justify-between sm:gap-4"
            >
              <div className="min-w-0 flex-1 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`${idPrefix}-lbl-${f.key}`} className="text-xs text-muted-foreground">
                      Label
                    </Label>
                    <Input
                      id={`${idPrefix}-lbl-${f.key}`}
                      className="h-11 sm:h-10"
                      value={f.label}
                      onChange={(e) =>
                        onChange(fields.map((x) => (x.key === f.key ? { ...x, label: e.target.value } : x)))
                      }
                      placeholder="e.g. Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${idPrefix}-key-${f.key}`} className="text-xs text-muted-foreground">
                      Key
                    </Label>
                    <Input
                      id={`${idPrefix}-key-${f.key}`}
                      className={cn(
                        "h-11 font-mono text-sm sm:h-10",
                        !isValidEventBookingFieldKey(f.key) && "border-destructive",
                      )}
                      value={f.key}
                      onChange={(e) => {
                        const raw = e.target.value;
                        onChange(fields.map((x) => (x.key === f.key ? { ...x, key: raw } : x)));
                      }}
                      onBlur={() => {
                        const current = fields.find((x) => x.key === f.key);
                        if (!current) return;
                        const desired = current.key.trim();
                        let normalized = desired;
                        if (!normalized || !isValidEventBookingFieldKey(normalized)) {
                          normalized = slugifyEventBookingFieldKey(current.label || "field");
                        }
                        const others = fields.filter((x) => x !== current);
                        normalized = ensureUniqueEventBookingFieldKey(others, normalized);
                        if (normalized !== current.key) {
                          onChange(
                            fields.map((x) => (x === current ? { ...x, key: normalized } : x)),
                          );
                        }
                      }}
                      placeholder="e.g. husband_name"
                    />
                    {!isValidEventBookingFieldKey(f.key) ? (
                      <p className="text-xs text-destructive">
                        Use a letter first, then letters, numbers, or underscores only.
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {f.type || "string"}
                  </Badge>
                  {f.required ? (
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      Required
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-row items-center justify-between gap-3 border-t pt-3 sm:w-auto sm:border-0 sm:pt-0">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`${idPrefix}-ord-${f.key}`}
                    className="whitespace-nowrap text-xs text-muted-foreground"
                  >
                    Order
                  </Label>
                  <Input
                    id={`${idPrefix}-ord-${f.key}`}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    className="h-10 w-[5.25rem] min-w-0 px-2 sm:h-9"
                    value={f.DisplayOrder ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      if (raw === "") {
                        onChange(
                          fields.map((x) =>
                            x.key === f.key ? { ...x, DisplayOrder: undefined } : x,
                          ),
                        );
                        return;
                      }
                      const v = parseInt(raw, 10);
                      if (Number.isNaN(v) || v < 1) return;
                      onChange(
                        fields.map((x) => (x.key === f.key ? { ...x, DisplayOrder: v } : x)),
                      );
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 touch-manipulation sm:h-9 sm:w-9"
                  onClick={() => onChange(fields.filter((x) => x.key !== f.key))}
                  aria-label={`Remove ${f.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed bg-muted/10 px-3 py-4 text-center text-sm text-muted-foreground">
          No fields yet. Add the first field below.
        </p>
      )}
      <div className="space-y-3 rounded-xl border bg-muted/25 p-3 sm:p-4">
        <p className="text-sm font-semibold">New field</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-label`}>Label (shown to guest)</Label>
            <Input
              id={`${idPrefix}-label`}
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              placeholder="e.g. Name"
              autoComplete="off"
              className="h-11 sm:h-10"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <Label htmlFor={`${idPrefix}-key`}>Internal key (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 touch-manipulation text-xs"
                disabled={!draftLabel.trim()}
                onClick={() => setDraftKey(slugifyEventBookingFieldKey(draftLabel))}
              >
                <Wand2 className="mr-1.5 h-3.5 w-3.5" />
                Suggest key
              </Button>
            </div>
            <Input
              id={`${idPrefix}-key`}
              value={draftKey}
              onChange={(e) => setDraftKey(e.target.value)}
              placeholder="Leave blank to auto-generate when you add"
              autoComplete="off"
              className={cn("h-11 font-mono text-sm sm:h-10", !draftKeyOk && "border-destructive")}
            />
            {!draftKeyOk ? (
              <p className="text-xs text-destructive">
                Use a letter first, then letters, numbers, or underscores only.
              </p>
            ) : suggestedKey ? (
              <p className="text-xs text-muted-foreground">
                If left blank: <code className="rounded bg-muted px-1 py-0.5 font-mono">{suggestedKey}</code>
              </p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-type`}>Answer type</Label>
            <Select value={draftType} onValueChange={setDraftType}>
              <SelectTrigger id={`${idPrefix}-type`} className="h-11 w-full touch-manipulation sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_BOOKING_FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-h-[2.75rem] items-center gap-2 rounded-md border border-input bg-background px-3 py-2 sm:justify-center">
            <Checkbox
              id={`${idPrefix}-required`}
              checked={draftRequired}
              onCheckedChange={(c) => setDraftRequired(c === true)}
              className="touch-manipulation"
            />
            <Label htmlFor={`${idPrefix}-required`} className="cursor-pointer text-sm font-normal leading-none">
              Required
            </Label>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
          onClick={handleAddField}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add field
        </Button>
      </div>
    </div>
  );
}
