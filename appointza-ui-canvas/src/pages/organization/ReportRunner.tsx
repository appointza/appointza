import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DynamicReportFilters } from "@/components/reports/DynamicReportFilters";
import { DynamicReportChart } from "@/components/reports/DynamicReportChart";
import type { ReportDefinitionDto, ReportExecutionResult } from "@/models/dynamicReport.model";
import { orgReportsService } from "@/services/orgReports.service";

export default function OrganizationReportRunner() {
  const { id } = useParams();
  const reportId = Number(id);
  const { toast } = useToast();

  const [report, setReport] = useState<ReportDefinitionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [result, setResult] = useState<ReportExecutionResult | null>(null);

  const load = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    setError("");
    try {
      const def = await orgReportsService.get(reportId);
      setReport(def);
      const defaults: Record<string, unknown> = {};
      for (const p of def.parameters ?? []) {
        if (p.default_value !== undefined && p.default_value !== "") {
          defaults[p.parameter_name] = p.default_value;
        }
      }
      setValues(defaults);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load report");
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(() => {
    if (report?.columns?.length) {
      return report.columns.filter((c) => c.is_visible).sort((a, b) => a.sort_order - b.sort_order);
    }
    return (result?.columns ?? []).map((c, i) => ({
      column_key: c,
      display_name: c,
      is_visible: true,
      format_type: "text",
      sort_order: i,
    }));
  }, [report, result]);

  const run = async () => {
    setRunning(true);
    try {
      const data = await orgReportsService.execute(reportId, values);
      setResult(data);
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Execution failed",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const doExport = async (format: "csv" | "excel" | "pdf") => {
    setExporting(format);
    try {
      await orgReportsService.export(reportId, format, values);
      toast({ title: `Exported ${format.toUpperCase()}` });
    } catch (e) {
      toast({
        title: e instanceof Error ? e.message : "Export failed",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading report…</div>;
  }

  if (error || !report) {
    return (
      <div className="space-y-3 p-6">
        <p className="text-sm text-red-600">{error || "Report not found"}</p>
        <Button variant="outline" asChild>
          <Link to="/organization/reports">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
            <Link to="/organization/reports">
              <ArrowLeft className="mr-1 h-4 w-4" />
              All reports
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{report.name}</h1>
          {report.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {report.export_csv ? (
            <Button variant="outline" size="sm" disabled={!!exporting} onClick={() => void doExport("csv")}>
              {exporting === "csv" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
              CSV
            </Button>
          ) : null}
          {report.export_excel ? (
            <Button variant="outline" size="sm" disabled={!!exporting} onClick={() => void doExport("excel")}>
              {exporting === "excel" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
              Excel
            </Button>
          ) : null}
          {report.export_pdf ? (
            <Button variant="outline" size="sm" disabled={!!exporting} onClick={() => void doExport("pdf")}>
              {exporting === "pdf" ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Download className="mr-1 h-4 w-4" />}
              PDF
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <DynamicReportFilters
          parameters={report.parameters}
          values={values}
          onChange={(name, value) => setValues((prev) => ({ ...prev, [name]: value }))}
        />
        <Button disabled={running} onClick={() => void run()}>
          {running ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
          Run report
        </Button>
      </div>

      {result ? (
        <div className="space-y-4">
          <DynamicReportChart chart={report.chart} rows={result.rows} />
          <div className="overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {columns.map((c) => (
                    <th key={c.column_key} className="px-3 py-2 text-left font-medium">
                      {c.display_name || c.column_key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-t">
                    {columns.map((c) => {
                      const val =
                        row[c.column_key] ??
                        row[Object.keys(row).find((k) => k.toLowerCase() === c.column_key.toLowerCase()) ?? ""];
                      return (
                        <td key={c.column_key} className="px-3 py-2">
                          {val === null || val === undefined ? "" : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
              {result.row_count} rows · {result.duration_ms} ms
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
