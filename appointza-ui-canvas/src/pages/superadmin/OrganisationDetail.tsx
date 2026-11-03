import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSuperAdminAssumeOrg } from "@/hooks/useSuperAdminAssumeOrg";
import {
  superAdminService,
  superAdminErrorMessage,
  type SuperAdminOrganisationDetail,
} from "@/services/superAdmin.service";
import {
  Card,
  ErrorBox,
  OrgStatusPill,
  PageHeader,
  Pill,
  Spinner,
  formatDate,
  tableCls,
  tdCls,
  thCls,
} from "@/components/superadmin/ui";

export default function SuperAdminOrganisationDetailPage() {
  const { id } = useParams();
  const orgId = Number(id);
  const { toast } = useToast();
  const { openOrganisationEditor, assumeOrganisation } = useSuperAdminAssumeOrg();
  const [detail, setDetail] = useState<SuperAdminOrganisationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(orgId) || orgId <= 0) {
      setError("Invalid organisation id");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setDetail(await superAdminService.getOrganisation(orgId));
    } catch (e) {
      setError(superAdminErrorMessage(e, "Could not load organisation"));
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (action: () => Promise<boolean>, okMsg: string) => {
    setBusy(true);
    try {
      await action();
      toast({ title: okMsg });
      await load();
    } catch (e) {
      toast({ title: "Action failed", description: superAdminErrorMessage(e), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (loading && !detail) return <Spinner />;
  if (error || !detail) return <ErrorBox message={error || "Organisation not found"} onRetry={load} />;

  const o = detail.organisation;

  return (
    <>
      <Link to="/super-admin/organisations" className="mb-3 inline-flex items-center gap-1 text-sm text-[#2a5af5] hover:underline">
        <ArrowLeft className="h-4 w-4" /> All organisations
      </Link>
      <PageHeader
        title={o.name || `Organisation #${o.id}`}
        subtitle={o.tagline || undefined}
        actions={
          <>
            <OrgStatusPill isactive={o.isactive} issuspended={o.issuspended} />
            <Button size="sm" disabled={busy} onClick={() => openOrganisationEditor(o.id)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit organisation
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void assumeOrganisation(o.id, o.name).finally(() => setBusy(false));
              }}
            >
              Open live workspace
            </Button>
            {o.issuspended ? (
              <Button size="sm" disabled={busy} onClick={() => run(() => superAdminService.activateOrganisation(o.id), "Organisation activated")}>
                Activate
              </Button>
            ) : (
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  const reason = window.prompt("Reason for suspending this organisation?");
                  if (reason === null) return;
                  void run(() => superAdminService.suspendOrganisation(o.id, reason), "Organisation suspended");
                }}
              >
                Suspend
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Details" className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-[#7a8494]">Organisation id</dt>
            <dd>{o.id}</dd>
            <dt className="text-[#7a8494]">GST number</dt>
            <dd>{o.gstnumber || "-"}</dd>
            <dt className="text-[#7a8494]">Type</dt>
            <dd>{[o.primarytypecode, o.secondarytypecode].filter(Boolean).join(" / ") || "-"}</dd>
            <dt className="text-[#7a8494]">Owner</dt>
            <dd>
              {o.ownername || "-"}
              <div className="text-xs text-[#7a8494]">{[o.owneremail, o.ownermobile].filter(Boolean).join(" | ")}</div>
            </dd>
            <dt className="text-[#7a8494]">Created</dt>
            <dd>{formatDate(o.createdon)}</dd>
            <dt className="text-[#7a8494]">Last modified</dt>
            <dd>{formatDate(detail.modifiedon)}</dd>
            <dt className="text-[#7a8494]">Notes</dt>
            <dd className="whitespace-pre-wrap">{detail.notes || "-"}</dd>
          </dl>
        </Card>
        <Card title="Appointments">
          <p className="text-2xl font-semibold">{detail.totalappointments}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {detail.appointmentstatuscounts.map((s) => (
              <li key={s.statuscode} className="flex justify-between">
                <span>{s.statuscode}</span>
                <strong>{s.count}</strong>
              </li>
            ))}
            {detail.appointmentstatuscounts.length === 0 ? <li className="text-[#7a8494]">No appointments yet</li> : null}
          </ul>
        </Card>
      </div>

      <Card title={`Locations (${detail.locations.length})`} className="mt-4">
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Name</th>
                <th className={thCls}>Address</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Verified</th>
                <th className={thCls}>Created</th>
              </tr>
            </thead>
            <tbody>
              {detail.locations.map((l) => (
                <tr key={l.id}>
                  <td className={tdCls}>
                    <Link to={`/super-admin/locations?search=${encodeURIComponent(l.name)}`} className="text-[#2a5af5] hover:underline">
                      {l.name || `#${l.id}`}
                    </Link>
                  </td>
                  <td className={tdCls}>
                    {[l.addressline1, l.addressline2, l.city, l.state, l.pincode, l.country].filter(Boolean).join(", ") || "-"}
                  </td>
                  <td className={tdCls}>{l.isactive ? <Pill tone="green">Active</Pill> : <Pill tone="gray">Inactive</Pill>}</td>
                  <td className={tdCls}>{l.isverified ? <Pill tone="blue">Verified</Pill> : <Pill tone="amber">Pending</Pill>}</td>
                  <td className={tdCls}>{formatDate(l.createdon)}</td>
                </tr>
              ))}
              {detail.locations.length === 0 ? (
                <tr>
                  <td className={tdCls} colSpan={5}>
                    No locations.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={`Users (${detail.users.length})`} className="mt-4">
        <div className="overflow-x-auto">
          <table className={tableCls}>
            <thead>
              <tr>
                <th className={thCls}>Name</th>
                <th className={thCls}>Email</th>
                <th className={thCls}>Mobile</th>
                <th className={thCls}>Role</th>
                <th className={thCls}>Status</th>
              </tr>
            </thead>
            <tbody>
              {detail.users.map((u) => (
                <tr key={u.id}>
                  <td className={tdCls}>{u.name || `#${u.id}`}</td>
                  <td className={tdCls}>{u.email || "-"}</td>
                  <td className={tdCls}>{u.mobile || "-"}</td>
                  <td className={tdCls}>{u.designation || "-"}</td>
                  <td className={tdCls}>
                    {u.issuspended ? <Pill tone="red">Suspended</Pill> : u.isactive ? <Pill tone="green">Active</Pill> : <Pill tone="gray">Inactive</Pill>}
                  </td>
                </tr>
              ))}
              {detail.users.length === 0 ? (
                <tr>
                  <td className={tdCls} colSpan={5}>
                    No users.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}