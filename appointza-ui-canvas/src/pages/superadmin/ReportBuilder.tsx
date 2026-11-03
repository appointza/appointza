import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Play, Plus, Save, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type {
  ReportChartDto,
  ReportColumnDto,
  ReportDefinitionUpsertReq,
  ReportExecutionResult,
  ReportParameterDto,
  ReportPermissionDto,
  ReportValidateResult,
} from "@/models/dynamicReport.model";
import { superAdminErrorMessage, superAdminService } from "@/services/superAdmin.service";
import { Card, ErrorBox, PageHeader, Spinner, selectCls, tableCls, tdCls, thCls } from "@/components/superadmin/ui";
import { cn } from "@/lib/utils";

const TABS = ["Basics", "SQL", "Parameters", "Columns", "Chart", "Access"] as const;
type Tab = (typeof TABS)[number];

function emptyParam(name: string, order: number): ReportParameterDto {
  return {
    parameter_name: name,
    display_name: name.replace(/_/g, " "),
    data_type: name.toLowerCase().includes("date") ? "date" : "string",
    input_type: name.toLowerCase().includes("date") ? "date" : "text",
    is_required: false,
    is_visible: true,
    default_value: "",
    options_source: "none",
    options_config: "",
    sort_order: order,
  };
}

function emptyForm(): ReportDefinitionUpsertReq {
  return {
    id: null,
    name: "",
    description: "",
    category: "General",
    sql_query:
      "SELECT COUNT(*)::int AS booking_count\nFROM appoinment\nWHERE organizationid = @OrgId\n  AND (@StartDate IS NULL OR appoinmentdate >= @StartDate::date);",
    is_active: true,
    is_published: false,
    export_excel: true,
    export_csv: true,
    export_pdf: true,
    max_rows: 5000,
    timeout_seconds: 30,
    parameters: [],
    columns: [],
    chart: {
      chart_type: "none",
      x_column: "",
      y_column: "",
      title: "",
      is_enabled: false,
    },
    permissions: [],
  };
}

export default function SuperAdminReportBuilder() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("Basics");
  const [form, setForm] = useState<ReportDefinitionUpsertReq>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<ReportValidateResult | null>(null);
  const [previewOrgId, setPreviewOrgId] = useState("");
  const [previewParams, setPreviewParams] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<ReportExecutionResult | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    setError("");
    try {
      const report = await superAdminService.getReport(Number(id));
      setForm({
        id: report.id,
        name: report.name,
        description: report.description,
        category: report.category,
        sql_query: report.sql_query,
        is_active: report.is_active,
        is_published: report.is_published,
        export_excel: report.export_excel,
        export_csv: report.export_csv,
        export_pdf: report.export_pdf,
        max_rows: report.max_rows,
        timeout_seconds: report.timeout_seconds,
        parameters: report.parameters ?? [],
        columns: report.columns ?? [],
        chart: report.chart ?? emptyForm().chart,
        permissions: report.permissions ?? [],
      });
    } catch (e) {
      setError(superAdminErrorMessage(e, "Could not load report"));
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = <K extends keyof ReportDefinitionUpsertReq>(key: K, value: ReportDefinitionUpsertReq[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const syncParametersFromSql = async () => {
    try {
      const result = await superAdminService.validateReportSql(form.sql_query);
      setValidation(result);
      const existing = new Map(form.parameters.map((p) => [p.parameter_name.toLowerCase(), p]));
      const next = result.detected_parameters.map((name, i) => {
        const found = existing.get(name.toLowerCase());
        return found ? { ...found, sort_order: i } : emptyParam(name, i);
      });
      patch("parameters", next);
      toast({ title: `Detected ${next.length} parameter(s)` });
    } catch (e) {
      toast({ title: superAdminErrorMessage(e, "Validation failed"), variant: "destructive" });
    }
  };

  const runValidate = async () => {
    try {
      const result = await superAdminService.validateReportSql(form.sql_query);
      setValidation(result);
      if (result.is_valid) toast({ title: "SQL looks valid" });
      else toast({ title: "SQL has errors", variant: "destructive" });
    } catch (e) {
      toast({ title: superAdminErrorMessage(e, "Validation failed"), variant: "destructive" });
    }
  };

  const runPreview = async () => {
    const orgId = Number(previewOrgId);
    if (!orgId) {
      toast({ title: "Enter an organisation id for preview", variant: "destructive" });
      return;
    }
    setPreviewing(true);
    try {
      const params: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(previewParams)) params[k] = v;
      const result = await superAdminService.previewReport({
        report_id: form.id ?? null,
        sql_query: form.sql_query,
        organisation_id: orgId,
        parameters: params,
        sample_limit: 50,
      });
      setPreview(result);
      if ((!form.columns || form.columns.length === 0) && result.columns?.length) {
        patch(
          "columns",
          result.columns.map(
            (c, i): ReportColumnDto => ({
              column_key: c,
              display_name: c,
              is_visible: true,
              format_type: "text",
              sort_order: i,
            }),
          ),
        );
      }
      toast({ title: `Preview: ${result.row_count} row(s)` });
    } catch (e) {
      toast({ title: superAdminErrorMessage(e, "Preview failed"), variant: "destructive" });
    } finally {
      setPreviewing(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      setTab("Basics");
      return;
    }
    setSaving(true);
    try {
      const saved = await superAdminService.saveReport({
        ...form,
        name: form.name.trim(),
        chart: form.chart?.chart_type && form.chart.chart_type !== "none" ? form.chart : form.chart,
      });
      toast({ title: "Report saved" });
      if (isNew) navigate(`/super-admin/reports/${saved.id}`, { replace: true });
      else await load();
    } catch (e) {
      toast({ title: superAdminErrorMessage(e, "Save failed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const paramEditor = useMemo(() => form.parameters ?? [], [form.parameters]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={() => void load()} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNew ? "New report" : form.name || "Edit report"}
        description="Configure SQL, parameters, columns, charts and organisation access."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/super-admin/reports">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button className="bg-[#2a5af5] hover:bg-[#2148c9]" disabled={saving} onClick={() => void save()}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
              Save
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-1 border-b border-[#e8ecf2] pb-px">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-t-md px-3 py-2 text-sm font-medium",
              tab === t ? "bg-white text-[#2a5af5] shadow-sm ring-1 ring-[#e8ecf2]" : "text-[#7a8494] hover:text-[#1a2332]",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Basics" && (
        <Card className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => patch("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => patch("category", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => patch("description", e.target.value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={(e) => patch("is_active", e.target.checked)} />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_published} onChange={(e) => patch("is_published", e.target.checked)} />
              Published to orgs
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.export_csv} onChange={(e) => patch("export_csv", e.target.checked)} />
              CSV export
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.export_excel} onChange={(e) => patch("export_excel", e.target.checked)} />
              Excel export
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.export_pdf} onChange={(e) => patch("export_pdf", e.target.checked)} />
              PDF export
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Max rows</Label>
              <Input
                type="number"
                value={form.max_rows}
                onChange={(e) => patch("max_rows", Number(e.target.value) || 5000)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Timeout (seconds)</Label>
              <Input
                type="number"
                value={form.timeout_seconds}
                onChange={(e) => patch("timeout_seconds", Number(e.target.value) || 30)}
              />
            </div>
          </div>
        </Card>
      )}

      {tab === "SQL" && (
        <Card className="space-y-4 p-5">
          <p className="text-sm text-[#7a8494]">
            Read-only SELECT only. Always filter by <code className="rounded bg-[#f3f5f8] px-1">@OrgId</code> for tenant
            isolation. Named parameters like <code className="rounded bg-[#f3f5f8] px-1">@StartDate</code> become filters.
          </p>
          <Textarea
            className="min-h-[240px] font-mono text-sm"
            value={form.sql_query}
            onChange={(e) => patch("sql_query", e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void runValidate()}>
              Validate SQL
            </Button>
            <Button variant="outline" onClick={() => void syncParametersFromSql()}>
              <Wand2 className="mr-1.5 h-4 w-4" />
              Detect parameters
            </Button>
          </div>
          {validation ? (
            <div className="rounded-md border border-[#e8ecf2] bg-[#f8fafc] p-3 text-sm">
              <p className={validation.is_valid ? "text-emerald-700" : "text-red-600"}>
                {validation.is_valid ? "Valid" : "Invalid"}
              </p>
              {validation.errors?.map((e) => (
                <p key={e} className="text-red-600">
                  {e}
                </p>
              ))}
              {validation.warnings?.map((w) => (
                <p key={w} className="text-amber-700">
                  {w}
                </p>
              ))}
              {validation.detected_parameters?.length ? (
                <p className="mt-1 text-[#7a8494]">Parameters: {validation.detected_parameters.join(", ")}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-3 border-t border-[#e8ecf2] pt-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Preview organisation id</Label>
              <Input value={previewOrgId} onChange={(e) => setPreviewOrgId(e.target.value)} placeholder="e.g. 12" />
            </div>
            {paramEditor.map((p) => (
              <div key={p.parameter_name} className="space-y-1.5">
                <Label>{p.display_name || p.parameter_name}</Label>
                <Input
                  value={previewParams[p.parameter_name] ?? p.default_value ?? ""}
                  onChange={(e) =>
                    setPreviewParams((prev) => ({ ...prev, [p.parameter_name]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <Button disabled={previewing} onClick={() => void runPreview()}>
            {previewing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
            Preview
          </Button>
          {preview ? (
            <div className="overflow-auto rounded-md border border-[#e8ecf2]">
              <table className={tableCls}>
                <thead>
                  <tr>
                    {preview.columns.map((c) => (
                      <th key={c} className={thCls}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, i) => (
                    <tr key={i} className="border-t border-[#e8ecf2]">
                      {preview.columns.map((c) => (
                        <td key={c} className={tdCls}>
                          {String(row[c] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-[#e8ecf2] px-3 py-2 text-xs text-[#7a8494]">
                {preview.row_count} rows · {preview.duration_ms} ms
              </p>
            </div>
          ) : null}
        </Card>
      )}

      {tab === "Parameters" && (
        <Card className="space-y-3 p-5">
          <div className="flex justify-between">
            <p className="text-sm text-[#7a8494]">Filters rendered dynamically for organisations from this metadata.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                patch("parameters", [
                  ...paramEditor,
                  emptyParam(`Param${paramEditor.length + 1}`, paramEditor.length),
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          {paramEditor.length === 0 ? (
            <p className="text-sm text-[#7a8494]">No parameters. Detect them from SQL or add manually.</p>
          ) : (
            paramEditor.map((p, idx) => (
              <div key={`${p.parameter_name}-${idx}`} className="grid gap-2 rounded-md border border-[#e8ecf2] p-3 md:grid-cols-6">
                <Input
                  placeholder="SQL name"
                  value={p.parameter_name}
                  onChange={(e) => {
                    const next = [...paramEditor];
                    next[idx] = { ...p, parameter_name: e.target.value };
                    patch("parameters", next);
                  }}
                />
                <Input
                  placeholder="Label"
                  value={p.display_name}
                  onChange={(e) => {
                    const next = [...paramEditor];
                    next[idx] = { ...p, display_name: e.target.value };
                    patch("parameters", next);
                  }}
                />
                <select
                  className={selectCls}
                  value={p.input_type}
                  onChange={(e) => {
                    const next = [...paramEditor];
                    next[idx] = { ...p, input_type: e.target.value };
                    patch("parameters", next);
                  }}
                >
                  {["text", "number", "date", "daterange", "dropdown", "multiselect", "boolean"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  className={selectCls}
                  value={p.options_source}
                  onChange={(e) => {
                    const next = [...paramEditor];
                    next[idx] = { ...p, options_source: e.target.value };
                    patch("parameters", next);
                  }}
                >
                  <option value="none">options: none</option>
                  <option value="static">static JSON / Label=Value</option>
                  <option value="system">system lookup</option>
                  <option value="database">approved database lookup</option>
                </select>
                <Input
                  placeholder="default / options config"
                  value={p.options_source === "none" ? p.default_value : p.options_config}
                  onChange={(e) => {
                    const next = [...paramEditor];
                    if (p.options_source === "none") next[idx] = { ...p, default_value: e.target.value };
                    else next[idx] = { ...p, options_config: e.target.value };
                    patch("parameters", next);
                  }}
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={p.is_required}
                      onChange={(e) => {
                        const next = [...paramEditor];
                        next[idx] = { ...p, is_required: e.target.checked };
                        patch("parameters", next);
                      }}
                    />
                    req
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={p.is_visible}
                      onChange={(e) => {
                        const next = [...paramEditor];
                        next[idx] = { ...p, is_visible: e.target.checked };
                        patch("parameters", next);
                      }}
                    />
                    show
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => patch("parameters", paramEditor.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      {tab === "Columns" && (
        <Card className="space-y-3 p-5">
          <div className="flex justify-between">
            <p className="text-sm text-[#7a8494]">Run preview to auto-detect columns, or edit manually.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                patch("columns", [
                  ...(form.columns ?? []),
                  {
                    column_key: `col_${(form.columns?.length ?? 0) + 1}`,
                    display_name: "Column",
                    is_visible: true,
                    format_type: "text",
                    sort_order: form.columns?.length ?? 0,
                  },
                ])
              }
            >
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          {(form.columns ?? []).map((c, idx) => (
            <div key={idx} className="grid gap-2 md:grid-cols-5">
              <Input
                value={c.column_key}
                onChange={(e) => {
                  const next = [...(form.columns ?? [])];
                  next[idx] = { ...c, column_key: e.target.value };
                  patch("columns", next);
                }}
              />
              <Input
                value={c.display_name}
                onChange={(e) => {
                  const next = [...(form.columns ?? [])];
                  next[idx] = { ...c, display_name: e.target.value };
                  patch("columns", next);
                }}
              />
              <select
                className={selectCls}
                value={c.format_type}
                onChange={(e) => {
                  const next = [...(form.columns ?? [])];
                  next[idx] = { ...c, format_type: e.target.value };
                  patch("columns", next);
                }}
              >
                {["text", "number", "currency", "date", "percent"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={c.is_visible}
                  onChange={(e) => {
                    const next = [...(form.columns ?? [])];
                    next[idx] = { ...c, is_visible: e.target.checked };
                    patch("columns", next);
                  }}
                />
                Visible
              </label>
              <Button variant="ghost" size="sm" onClick={() => patch("columns", (form.columns ?? []).filter((_, i) => i !== idx))}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
        </Card>
      )}

      {tab === "Chart" && (
        <Card className="grid gap-4 p-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Chart type</Label>
            <select
              className={selectCls}
              value={form.chart?.chart_type ?? "none"}
              onChange={(e) =>
                patch("chart", {
                  ...(form.chart as ReportChartDto),
                  chart_type: e.target.value,
                  is_enabled: e.target.value !== "none",
                })
              }
            >
              {["none", "bar", "line", "pie"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={form.chart?.title ?? ""}
              onChange={(e) => patch("chart", { ...(form.chart as ReportChartDto), title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>X column</Label>
            <Input
              value={form.chart?.x_column ?? ""}
              onChange={(e) => patch("chart", { ...(form.chart as ReportChartDto), x_column: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Y column</Label>
            <Input
              value={form.chart?.y_column ?? ""}
              onChange={(e) => patch("chart", { ...(form.chart as ReportChartDto), y_column: e.target.value })}
            />
          </div>
        </Card>
      )}

      {tab === "Access" && (
        <Card className="space-y-3 p-5">
          <p className="text-sm text-[#7a8494]">
            Empty permissions = all organisations with published access. Add rows to restrict by organisation id (blank =
            all orgs).
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              patch("permissions", [
                ...(form.permissions ?? []),
                {
                  organisation_id: null,
                  role_key: "org_admin",
                  can_view: true,
                  can_export: true,
                } as ReportPermissionDto,
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add permission
          </Button>
          {(form.permissions ?? []).map((p, idx) => (
            <div key={idx} className="grid gap-2 md:grid-cols-5">
              <Input
                placeholder="Organisation id (blank = all)"
                value={p.organisation_id ?? ""}
                onChange={(e) => {
                  const next = [...(form.permissions ?? [])];
                  const v = e.target.value.trim();
                  next[idx] = { ...p, organisation_id: v ? Number(v) : null };
                  patch("permissions", next);
                }}
              />
              <Input
                value={p.role_key}
                onChange={(e) => {
                  const next = [...(form.permissions ?? [])];
                  next[idx] = { ...p, role_key: e.target.value };
                  patch("permissions", next);
                }}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={p.can_view}
                  onChange={(e) => {
                    const next = [...(form.permissions ?? [])];
                    next[idx] = { ...p, can_view: e.target.checked };
                    patch("permissions", next);
                  }}
                />
                View
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={p.can_export}
                  onChange={(e) => {
                    const next = [...(form.permissions ?? [])];
                    next[idx] = { ...p, can_export: e.target.checked };
                    patch("permissions", next);
                  }}
                />
                Export
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => patch("permissions", (form.permissions ?? []).filter((_, i) => i !== idx))}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
