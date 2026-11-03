import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ReportParameterDto } from "@/models/dynamicReport.model";
import { cn } from "@/lib/utils";

type Props = {
  parameters: ReportParameterDto[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  className?: string;
};

export function DynamicReportFilters({ parameters, values, onChange, className }: Props) {
  const visible = (parameters ?? [])
    .filter((p) => p.is_visible)
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);

  if (visible.length === 0) return null;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {visible.map((p) => {
        const name = p.parameter_name;
        const label = p.display_name || name;
        const raw = values[name] ?? p.default_value ?? "";
        const inputType = (p.input_type || "text").toLowerCase();
        const options = p.resolved_options ?? [];

        if (inputType === "boolean") {
          return (
            <label key={name} className="flex items-center gap-2 pt-6 text-sm">
              <input
                type="checkbox"
                checked={raw === true || raw === "true" || raw === "1"}
                onChange={(e) => onChange(name, e.target.checked)}
              />
              {label}
              {p.is_required ? <span className="text-red-500">*</span> : null}
            </label>
          );
        }

        if (inputType === "dropdown") {
          return (
            <div key={name} className="space-y-1.5">
              <Label>
                {label}
                {p.is_required ? " *" : ""}
              </Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={String(raw ?? "")}
                onChange={(e) => onChange(name, e.target.value)}
              >
                <option value="">Select…</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (inputType === "multiselect") {
          const selected = Array.isArray(raw)
            ? (raw as string[])
            : String(raw || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
          return (
            <div key={name} className="space-y-1.5">
              <Label>
                {label}
                {p.is_required ? " *" : ""}
              </Label>
              <select
                multiple
                className="min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selected}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                  onChange(name, opts);
                }}
              >
                {options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        if (inputType === "daterange") {
          const from = typeof raw === "object" && raw && "from" in (raw as object)
            ? String((raw as { from?: string }).from ?? "")
            : "";
          const to = typeof raw === "object" && raw && "to" in (raw as object)
            ? String((raw as { to?: string }).to ?? "")
            : "";
          // Bind common pair: StartDate / EndDate style uses two params; for single daterange we store CSV.
          return (
            <div key={name} className="space-y-1.5 sm:col-span-2">
              <Label>
                {label}
                {p.is_required ? " *" : ""}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={from || String(raw).split(",")[0] || ""}
                  onChange={(e) => {
                    const nextTo = to || String(raw).split(",")[1] || "";
                    onChange(name, `${e.target.value},${nextTo}`);
                  }}
                />
                <Input
                  type="date"
                  value={to || String(raw).split(",")[1] || ""}
                  onChange={(e) => {
                    const nextFrom = from || String(raw).split(",")[0] || "";
                    onChange(name, `${nextFrom},${e.target.value}`);
                  }}
                />
              </div>
            </div>
          );
        }

        const htmlType =
          inputType === "number" ? "number" : inputType === "date" ? "date" : "text";

        return (
          <div key={name} className="space-y-1.5">
            <Label>
              {label}
              {p.is_required ? " *" : ""}
            </Label>
            <Input
              type={htmlType}
              value={raw === null || raw === undefined ? "" : String(raw)}
              onChange={(e) =>
                onChange(name, htmlType === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)
              }
            />
          </div>
        );
      })}
    </div>
  );
}
