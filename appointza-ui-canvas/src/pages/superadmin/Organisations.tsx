import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSuperAdminAssumeOrg } from "@/hooks/useSuperAdminAssumeOrg";
import {
  superAdminService,
  superAdminErrorMessage,
  type SuperAdminOrganisationList,
} from "@/services/superAdmin.service";
import {
  ErrorBox,
  OrgStatusPill,
  PageHeader,
  Pager,
  Spinner,
  formatDate,
  selectCls,
  tableCls,
  tdCls,
  thCls,
} from "@/components/superadmin/ui";

const PAGE_SIZE = 20;

export default function SuperAdminOrganisations() {
  const { openOrganisationEditor } = useSuperAdminAssumeOrg();
  const [data, setData] = useState<SuperAdminOrganisationList | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(
        await superAdminService.listOrganisations({
          page,
          pageSize: PAGE_SIZE,
          search: query,
          isActive: status === "inactive" ? false : status === "active" ? true : null,
          isSuspended: status === "suspended" ? true : status === "active" ? false : null,
        }),
      );
    } catch (e) {
      setError(superAdminErrorMessage(e, "Could not load organisations"));
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title="Organisations" subtitle="Every organisation on the platform." />
      <form
        className="mb-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search);
        }}
      >
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#7a8494]" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, GST, owner, email, mobile or id"
            className="pl-8"
            aria-label="Search organisations"
          />
        </div>
        <select
          className={selectCls}
          value={status}
          aria-label="Filter by status"
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as typeof status);
          }}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </form>

      {error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : loading && !data ? (
        <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e6eaf0] bg-white">
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Organisation</th>
                <th className={thCls}>Owner</th>
                <th className={thCls}>Type</th>
                <th className={thCls}>Locations</th>
                <th className={thCls}>Users</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Created</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((o) => (
                <tr key={o.id} className="hover:bg-[#f9fafc]">
                  <td className={tdCls}>
                    <Link to={`/super-admin/organisations/${o.id}`} className="font-medium text-[#2a5af5] hover:underline">
                      {o.name || `Organisation #${o.id}`}
                    </Link>
                    <div className="text-xs text-[#7a8494]">
                      #{o.id}
                      {o.gstnumber ? ` | GST ${o.gstnumber}` : ""}
                    </div>
                  </td>
                  <td className={tdCls}>
                    <div>{o.ownername || "-"}</div>
                    <div className="text-xs text-[#7a8494]">{o.owneremail || o.ownermobile}</div>
                  </td>
                  <td className={tdCls}>{[o.primarytypecode, o.secondarytypecode].filter(Boolean).join(" / ") || "-"}</td>
                  <td className={tdCls}>{o.locationcount}</td>
                  <td className={tdCls}>{o.usercount}</td>
                  <td className={tdCls}>
                    <OrgStatusPill isactive={o.isactive} issuspended={o.issuspended} />
                  </td>
                  <td className={tdCls}>{formatDate(o.createdon)}</td>
                  <td className={tdCls}>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      title="Edit organisation (profile, locations, services, rooms, hours, website…)"
                      aria-label={`Edit ${o.name || `organisation ${o.id}`}`}
                      onClick={() => openOrganisationEditor(o.id)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {data && data.items.length === 0 ? (
                <tr>
                  <td className={tdCls} colSpan={8}>
                    No organisations match.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
      {data ? <Pager page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} /> : null}
    </>
  );
}