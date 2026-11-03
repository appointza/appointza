import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { superAdminService, superAdminErrorMessage, type SuperAdminUserList } from "@/services/superAdmin.service";
import { ErrorBox, PageHeader, Pager, Pill, Spinner, formatDate, selectCls, tableCls, tdCls, thCls } from "@/components/superadmin/ui";

const PAGE_SIZE = 20;

export default function SuperAdminUsers() {
  const { toast } = useToast();
  const [data, setData] = useState<SuperAdminUserList | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(
        await superAdminService.listUsers({
          page,
          pageSize: PAGE_SIZE,
          search: query,
          isSuspended: status === "suspended" ? true : status === "active" ? false : null,
        }),
      );
    } catch (e) {
      setError(superAdminErrorMessage(e, "Could not load users"));
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: number, fn: () => Promise<boolean>, msg: string) => {
    setBusyId(id);
    try {
      await fn();
      toast({ title: msg });
      await load();
    } catch (e) {
      toast({ title: "Action failed", description: superAdminErrorMessage(e), variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader title="Users" subtitle="All users across organisations; suspend or reactivate accounts." />
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
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, mobile or organisation" className="pl-8" aria-label="Search users" />
        </div>
        <select
          className={selectCls}
          value={status}
          aria-label="Filter users"
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as typeof status);
          }}
        >
          <option value="all">All users</option>
          <option value="active">Not suspended</option>
          <option value="suspended">Suspended</option>
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
                <th className={thCls}>User</th>
                <th className={thCls}>Contact</th>
                <th className={thCls}>Organisation</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Created</th>
                <th className={thCls}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-[#f9fafc]">
                  <td className={tdCls}>
                    <div className="font-medium">{u.name || `User #${u.id}`}</div>
                    {u.issuperadmin ? <Pill tone="amber">Super Admin</Pill> : <span className="text-xs text-[#7a8494]">{u.designation}</span>}
                  </td>
                  <td className={tdCls}>
                    <div>{u.email || "-"}</div>
                    <div className="text-xs text-[#7a8494]">{u.mobile}</div>
                  </td>
                  <td className={tdCls}>
                    {u.organisationid ? (
                      <Link to={`/super-admin/organisations/${u.organisationid}`} className="text-[#2a5af5] hover:underline">
                        {u.organisationname || `#${u.organisationid}`}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className={tdCls}>
                    {u.issuspended ? <Pill tone="red">Suspended</Pill> : u.isactive ? <Pill tone="green">Active</Pill> : <Pill tone="gray">Inactive</Pill>}
                  </td>
                  <td className={tdCls}>{formatDate(u.createdon)}</td>
                  <td className={tdCls}>
                    {u.issuspended ? (
                      <Button size="sm" variant="outline" disabled={busyId === u.id} onClick={() => act(u.id, () => superAdminService.activateUser(u.id), "User reactivated")}>
                        Reactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id || u.issuperadmin}
                        title={u.issuperadmin ? "Super admins cannot be suspended here" : undefined}
                        onClick={() => {
                          const reason = window.prompt(`Reason for suspending ${u.name || "this user"}?`);
                          if (reason === null) return;
                          void act(u.id, () => superAdminService.suspendUser(u.id, reason), "User suspended");
                        }}
                      >
                        Suspend
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {data && data.items.length === 0 ? (
                <tr>
                  <td className={tdCls} colSpan={6}>
                    No users match.
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