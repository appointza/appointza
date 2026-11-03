import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileBarChart2, Plus, Power, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { ReportListItemDto } from "@/models/dynamicReport.model";
import { superAdminErrorMessage, superAdminService } from "@/services/superAdmin.service";
import { Card, ErrorBox, PageHeader, Pill, Spinner, tableCls, tdCls, thCls } from "@/components/superadmin/ui";

export default function SuperAdminReports() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ReportListItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await superAdminService.listReports());
    } catch (e) {
      setError(superAdminErrorMessage(e, "Could not load reports"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q),
    );
  }, [rows, query]);

  const toggleActive = async (row: ReportListItemDto) => {
    setBusyId(row.id);
    try {
      await superAdminService.setReportActive(row.id, !row.is_active);
      toast({ title: row.is_active ? "Report deactivated" : "Report activated" });
      await load();
    } catch (e) {
      toast({ title: superAdminErrorMessage(e, "Update failed"), variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (row: ReportListItemDto) => {
    if (!window.confirm(`Delete report "${row.name}"? This cannot be undone.`)) return;
    setBusyId(row.id);
    try {
      await superAdminService.deleteReport(row.id);
      toast({ title: "Report deleted" });
      await load();
    } catch (e) {
      toast({ title: superAdminErrorMessage(e, "Delete failed"), variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Builder"
        description="Create and publish metadata-driven reports for organisations."
        actions={
          <Button asChild className="bg-[#2a5af5] hover:bg-[#2148c9]">
            <Link to="/super-admin/reports/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New report
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8494]" />
          <Input
            className="pl-9"
            placeholder="Search reports…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Card>

      {error ? <ErrorBox message={error} onRetry={() => void load()} /> : null}
      {loading ? (
        <Spinner />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Report</th>
                <th className={thCls}>Category</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Updated</th>
                <th className={thCls} />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td className={tdCls} colSpan={5}>
                    <div className="flex flex-col items-center gap-2 py-10 text-[#7a8494]">
                      <FileBarChart2 className="h-8 w-8 opacity-50" />
                      <p>No reports yet. Create your first dynamic report.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-t border-[#e8ecf2]">
                    <td className={tdCls}>
                      <Link
                        to={`/super-admin/reports/${row.id}`}
                        className="font-medium text-[#1a2332] hover:text-[#2a5af5]"
                      >
                        {row.name}
                      </Link>
                      {row.description ? (
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#7a8494]">{row.description}</p>
                      ) : null}
                    </td>
                    <td className={tdCls}>{row.category || "General"}</td>
                    <td className={tdCls}>
                      <div className="flex flex-wrap gap-1.5">
                        <Pill tone={row.is_active ? "green" : "gray"}>
                          {row.is_active ? "Active" : "Inactive"}
                        </Pill>
                        <Pill tone={row.is_published ? "blue" : "gray"}>
                          {row.is_published ? "Published" : "Draft"}
                        </Pill>
                      </div>
                    </td>
                    <td className={tdCls}>
                      {row.updated_at ? new Date(row.updated_at).toLocaleString() : "—"}
                    </td>
                    <td className={tdCls}>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === row.id}
                          onClick={() => void toggleActive(row)}
                          title={row.is_active ? "Deactivate" : "Activate"}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busyId === row.id}
                          onClick={() => void remove(row)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
