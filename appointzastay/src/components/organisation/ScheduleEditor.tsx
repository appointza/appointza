import { stripEmptyRows } from "./ListEditor";

export type SlotDraft = Record<string, unknown>;
export type ClosureDraft = Record<string, unknown>;

const DAY_OPTIONS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const CLOSURE_REASONS = [
  { value: "leave", label: "Leave" },
  { value: "holiday", label: "Holiday" },
  { value: "closed", label: "Closed" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

export function emptySlotDraft(bookingType: string): SlotDraft {
  const hourly = bookingType === "hourly";
  return {
    id: "",
    name: "",
    kind: hourly ? "hourly" : "overnight",
    startTime: hourly ? "10:00" : "14:00",
    endTime: hourly ? "14:00" : "11:00",
    daysOfWeek: [],
    note: "",
    isActive: true,
    sortOrder: 0,
  };
}

export function emptyClosureDraft(): ClosureDraft {
  return {
    id: "",
    fromDate: "",
    toDate: "",
    reason: "leave",
    note: "",
  };
}

function daysLabel(days: unknown): string {
  const list = Array.isArray(days) ? days.map(Number) : [];
  if (list.length === 0) return "Every day";
  return list
    .map((d) => DAY_OPTIONS.find((o) => o.value === d)?.label ?? String(d))
    .join(", ");
}

function reasonLabel(reason: unknown): string {
  const r = String(reason || "leave");
  return CLOSURE_REASONS.find((x) => x.value === r)?.label ?? r;
}

/** Normalize stored time to HH:mm for <input type="time"> */
function toTimeInputValue(value: unknown, fallback = "10:00"): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return fallback;
  const h = Math.min(23, Math.max(0, Number(match[1])));
  const m = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function ScheduleEditor({
  slots,
  closures,
  bookingType,
  onSlotsChange,
  onClosuresChange,
  hideAddButtons = false,
}: {
  slots: SlotDraft[];
  closures: ClosureDraft[];
  bookingType: string;
  onSlotsChange: (items: SlotDraft[]) => void;
  onClosuresChange: (items: ClosureDraft[]) => void;
  hideAddButtons?: boolean;
}) {
  const toggleDay = (index: number, day: number) => {
    const base = slots.length ? slots : [emptySlotDraft(bookingType)];
    onSlotsChange(
      base.map((row, i) => {
        if (i !== index) return row;
        const current = Array.isArray(row.daysOfWeek) ? (row.daysOfWeek as number[]) : [];
        const next = current.includes(day)
          ? current.filter((d) => d !== day)
          : [...current, day].sort((a, b) => a - b);
        return { ...row, daysOfWeek: next };
      }),
    );
  };

  const setSlotKind = (index: number, kind: string) => {
    const base = slots.length ? slots : [emptySlotDraft(bookingType)];
    onSlotsChange(
      base.map((row, i) => {
        if (i !== index) return row;
        const hourly = kind === "hourly";
        return {
          ...row,
          kind,
          startTime: hourly ? String(row.startTime || "10:00") : String(row.startTime || "14:00"),
          endTime: hourly ? String(row.endTime || "14:00") : String(row.endTime || "11:00"),
        };
      }),
    );
  };

  const setClosureReason = (index: number, reason: string) => {
    const base = closures.length ? closures : [emptyClosureDraft()];
    onClosuresChange(base.map((row, i) => (i === index ? { ...row, reason } : row)));
  };

  const slotRows = slots.length ? slots : [emptySlotDraft(bookingType)];
  const closureRows = closures.length ? closures : [emptyClosureDraft()];

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Bookable slots</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Create hourly windows (e.g. 10:00–14:00) or overnight check-in/out templates. When slots
            exist, guests must pick one of them.
          </p>
        </div>
        {!hideAddButtons ? (
          <div className="org-profile-editor-toolbar">
            <button
              type="button"
              className="org-profile-add-row org-profile-add-row-top"
              onClick={() => onSlotsChange([...slotRows, emptySlotDraft(bookingType)])}
            >
              + Add slot
            </button>
          </div>
        ) : null}
        <div className="org-profile-rows">
          {slotRows.map((row, index) => (
            <div key={index} className="org-profile-row org-profile-row-3 !items-start">
              <input
                className="org-profile-input"
                placeholder="Slot name"
                value={String(row.name ?? "")}
                onChange={(e) =>
                  onSlotsChange(
                    slotRows.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)),
                  )
                }
              />
              <select
                className="org-profile-input"
                value={String(row.kind ?? "hourly")}
                onChange={(e) => setSlotKind(index, e.target.value)}
              >
                <option value="hourly">Hourly</option>
                <option value="overnight">Overnight</option>
              </select>
              <div className="flex flex-col gap-1 min-w-[7.5rem]">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Start
                </span>
                <input
                  type="time"
                  className="org-profile-input"
                  value={toTimeInputValue(
                    row.startTime,
                    String(row.kind ?? "hourly") === "overnight" ? "14:00" : "10:00",
                  )}
                  onChange={(e) =>
                    onSlotsChange(
                      slotRows.map((r, i) =>
                        i === index ? { ...r, startTime: e.target.value } : r,
                      ),
                    )
                  }
                />
              </div>
              <div className="flex flex-col gap-1 min-w-[7.5rem]">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  End
                </span>
                <input
                  type="time"
                  className="org-profile-input"
                  value={toTimeInputValue(
                    row.endTime,
                    String(row.kind ?? "hourly") === "overnight" ? "11:00" : "14:00",
                  )}
                  onChange={(e) =>
                    onSlotsChange(
                      slotRows.map((r, i) => (i === index ? { ...r, endTime: e.target.value } : r)),
                    )
                  }
                />
              </div>
              <input
                className="org-profile-input"
                placeholder="Note"
                value={String(row.note ?? "")}
                onChange={(e) =>
                  onSlotsChange(
                    slotRows.map((r, i) => (i === index ? { ...r, note: e.target.value } : r)),
                  )
                }
              />
              <label className="flex items-center gap-1 text-xs whitespace-nowrap pt-2">
                <input
                  type="checkbox"
                  checked={row.isActive !== false}
                  onChange={(e) =>
                    onSlotsChange(
                      slotRows.map((r, i) => (i === index ? { ...r, isActive: e.target.checked } : r)),
                    )
                  }
                />
                Active
              </label>
              <div className="span-2 flex flex-wrap gap-1.5 pt-1">
                {DAY_OPTIONS.map((d) => {
                  const selected = Array.isArray(row.daysOfWeek)
                    ? (row.daysOfWeek as number[]).includes(d.value)
                    : false;
                  return (
                    <button
                      key={d.value}
                      type="button"
                      className={`rounded border px-2 py-0.5 text-[11px] ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground"
                      }`}
                      onClick={() => toggleDay(index, d.value)}
                    >
                      {d.label}
                    </button>
                  );
                })}
                <span className="text-[11px] text-muted-foreground self-center ml-1">
                  (none = every day)
                </span>
              </div>
              <button
                type="button"
                className="org-profile-row-remove"
                onClick={() => {
                  const next = slotRows.filter((_, i) => i !== index);
                  onSlotsChange(next.length ? next : [emptySlotDraft(bookingType)]);
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Leave &amp; closed dates</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Mark leave, holidays, maintenance, or any days when the property is closed. Guests cannot
            book overlapping dates.
          </p>
        </div>
        {!hideAddButtons ? (
          <div className="org-profile-editor-toolbar">
            <button
              type="button"
              className="org-profile-add-row org-profile-add-row-top"
              onClick={() => onClosuresChange([...closureRows, emptyClosureDraft()])}
            >
              + Add closed period
            </button>
          </div>
        ) : null}
        <div className="org-profile-rows">
          {closureRows.map((row, index) => (
            <div key={index} className="org-profile-row org-profile-row-3">
              <input
                className="org-profile-input"
                type="date"
                value={String(row.fromDate ?? "")}
                onChange={(e) =>
                  onClosuresChange(
                    closureRows.map((r, i) => (i === index ? { ...r, fromDate: e.target.value } : r)),
                  )
                }
              />
              <input
                className="org-profile-input"
                type="date"
                value={String(row.toDate ?? row.fromDate ?? "")}
                onChange={(e) =>
                  onClosuresChange(
                    closureRows.map((r, i) => (i === index ? { ...r, toDate: e.target.value } : r)),
                  )
                }
              />
              <select
                className="org-profile-input"
                value={String(row.reason ?? "leave")}
                onChange={(e) => setClosureReason(index, e.target.value)}
              >
                {CLOSURE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <input
                className="org-profile-input span-2"
                placeholder="Note (optional)"
                value={String(row.note ?? "")}
                onChange={(e) =>
                  onClosuresChange(
                    closureRows.map((r, i) => (i === index ? { ...r, note: e.target.value } : r)),
                  )
                }
              />
              <button
                type="button"
                className="org-profile-row-remove"
                onClick={() => {
                  const next = closureRows.filter((_, i) => i !== index);
                  onClosuresChange(next.length ? next : [emptyClosureDraft()]);
                }}
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ScheduleView({
  slots,
  closures,
}: {
  slots: SlotDraft[];
  closures: ClosureDraft[];
}) {
  if (slots.length === 0 && closures.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {slots.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold mb-2">Slots</h3>
          <div className="org-profile-items">
            {slots.map((item, i) => (
              <article key={i} className="org-profile-item">
                <strong>{String(item.name)}</strong>
                <span className="text-xs text-muted-foreground ml-2 uppercase tracking-wide">
                  {String(item.kind || "hourly")}
                </span>
                <p className="text-sm mt-1">
                  {String(item.startTime)} – {String(item.endTime)} · {daysLabel(item.daysOfWeek)}
                </p>
                {item.note ? (
                  <p className="text-xs text-muted-foreground mt-1">{String(item.note)}</p>
                ) : null}
                {item.isActive === false ? (
                  <span className="text-xs text-muted-foreground">Inactive</span>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {closures.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold mb-2">Closed / leave</h3>
          <div className="org-profile-items">
            {closures.map((item, i) => (
              <article key={i} className="org-profile-item">
                <strong>{reasonLabel(item.reason)}</strong>
                <p className="text-sm mt-1">
                  {String(item.fromDate)}
                  {item.toDate && item.toDate !== item.fromDate ? ` → ${String(item.toDate)}` : ""}
                </p>
                {item.note ? (
                  <p className="text-xs text-muted-foreground mt-1">{String(item.note)}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function stripSchedulePayload(slots: SlotDraft[], closures: ClosureDraft[]) {
  return {
    slots: stripEmptyRows(slots, "name").map((row, i) => ({
      ...row,
      sortOrder: i,
      daysOfWeek: Array.isArray(row.daysOfWeek) ? row.daysOfWeek : [],
      isActive: row.isActive !== false,
    })),
    closures: stripEmptyRows(closures, "fromDate").map((row) => ({
      ...row,
      toDate: String(row.toDate || row.fromDate || ""),
      reason: String(row.reason || "leave"),
    })),
  };
}
