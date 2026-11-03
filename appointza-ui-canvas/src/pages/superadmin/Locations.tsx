import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { superAdminService, superAdminErrorMessage, type SuperAdminLocationRow } from "@/services/superAdmin.service";
import { ErrorBox, PageHeader, Pager, Pill, Spinner, formatDate, selectCls, tableCls, tdCls, thCls } from "@/components/superadmin/ui";

const PAGE_SIZE = 25;

export function locationAddress(l: SuperAdminLocationRow) {
  return [l.addressline1, l.addressline2, l.city, l.state, l.pincode, l.country].filter(Boolean).join(", ");
}

/** Hook shared by the list and detail pages. */
export function useAllLocations() {
  const [rows, setRows] = useState<SuperAdminLocationRow[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    try {
      setRows(await superAdminService.listAllLocations());
    } catch (e) {
      setError(superAdminErrorMessage(e, "Could not load locations"));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return { rows, error, reload: load };
}

export default function SuperAdminLocations() {
  const [params, setParams] = useSearchParams();
  const { rows, error, reload } = useAllLocations();
  const { toast } = useToast();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "inactive">("all");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = (params.get("search") ?? "").trim().toLowerCase();
    return (rows ?? []).filter((l) => {
      if (filter === "pending" && (l.isverified || l.isactive === false)) return false;
      if (filter === "verified" && !l.isverified) return false;
      if (filter === "inactive" && l.isactive !== false) return false;
      if (!q) return true;
      return [l.name, l.organisationname, l.city, l.state, l.pincode, l.organisationmobile, l.usermobile, String(l.id)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, params, filter]);

  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const act = async (l: SuperAdminLocationRow, fn: () => Promise<boolean>, msg: string) => {
    setBusyId(l.id);
    try {
      await fn();
      toast({ title: msg });
      await reload();
    } catch (e) {
      toast({ title: "Action failed", description: superAdminErrorMessage(e), variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="Locations" subtitle="All organisation locations; verify or deactivate them." />
      <form
        className="mb-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setParams(search.trim() ? { search: search.trim() } : {});
        }}
      >
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#7a8494]" aria-hidden />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search location, organisation, city, mobile" className="pl-8" aria-label="Search locations" />
        </div>
        <select
          className={selectCls}
          value={filter}
          aria-label="Filter locations"
          onChange={(e) => {
            setPage(1);
            setFilter(e.target.value as typeof filter);
          }}
        >
          <option value="all">All</option>
          <option value="pending">Pending verification</option>
          <option value="verified">Verified</option>
          <option value="inactive">Inactive</option>
        </select>
      </form>

      {error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : !rows ? (
        <Spinner />
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[#e6eaf0] bg-white">
            <table className={tableCls}>
              <thead>
                <tr>
                  <th className={thCls}>Location</th>
                  <th className={thCls}>Organisation</th>
                  <th className={thCls}>Address</th>
                  <th className={thCls}>Status</th>
                  <th className={thCls}>Created</th>
                  <th className={thCls}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((l) => (
                  <tr key={l.id} className="hover:bg-[#f9fafc]">
                    <td className={tdCls}>
                      <Link to={`/super-admin/locations/${l.id}`} className="font-medium text-[#2a5af5] hover:underline">
                        {l.name || `Location #${l.id}`}
                      </Link>
                    </td>
                    <td className={tdCls}>
                      {l.organisationid ? (
                        <Link to={`/super-admin/organisations/${l.organisationid}`} className="text-[#2a5af5] hover:underline">
                          {l.organisationname || `#${l.organisationid}`}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className={tdCls}>{locationAddress(l) || "-"}</td>
                    <td className={tdCls}>
                      <div className="flex flex-wrap gap-1">
                        {l.isactive === false ? <Pill tone="gray">Inactive</Pill> : <Pill tone="green">Active</Pill>}
                        {l.isverified ? <Pill tone="blue">Verified</Pill> : <Pill tone="amber">Pending</Pill>}
                      </div>
                    </td>
                    <td className={tdCls}>{formatDate(l.createdon)}</td>
                    <td className={tdCls}>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === l.id}
                          onClick={() => act(l, () => superAdminService.toggleLocationVerification(l.id, !l.isverified), l.isverified ? "Verification removed" : "Location verified")}
                        >
                          {l.isverified ? "Unverify" : "Verify"}
                        </Button>
                        {l.isactive === false ? (
                          <Button size="sm" variant="outline" disabled={busyId === l.id} onClick={() => act(l, () => superAdminService.activateLocation(l.id), "Location activated")}>
                            Activate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === l.id}
                            onClick={() => {
                              if (window.confirm(`Deactivate location "${l.name}"?`)) {
                                void act(l, () => superAdminService.deactivateLocation(l.id), "Location deactivated");
                              }
                            }}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td className={tdCls} colSpan={6}>
                      No locations match.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <Pager page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
        </>
      )}
    </>
  );
}