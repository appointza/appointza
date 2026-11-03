import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarCheck, CheckCircle2, Clock } from "lucide-react";
import { superAdminService, superAdminErrorMessage, type SuperAdminDashboardStats } from "@/services/superAdmin.service";
import { Card, ErrorBox, PageHeader, Spinner } from "@/components/superadmin/ui";

function Stat({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2f7] text-[#2a5af5]">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-2xl font-semibold text-[#1a1a1a]">{value}</p>
          <p className="text-xs text-[#5b6572]">{label}</p>
        </div>
      </div>
    </Card>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminDashboardStats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await superAdminService.dashboardStats());
    } catch (e) {
      setError(superAdminErrorMessage(e, "Could not load dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={load} />;

  const org = stats?.OrganizationStats;
  const appt = stats?.AppointmentStats;

  return (
    <>
      <PageHeader title="Super Admin dashboard" subtitle="Platform-wide overview across all organisations." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Organisations" value={org?.TotalOrganizations ?? 0} icon={Building2} />
        <Stat label="Verified" value={org?.VerifiedOrganizations ?? 0} icon={CheckCircle2} />
        <Stat label="Not verified" value={org?.NotVerifiedOrganizations ?? 0} icon={Clock} />
        <Stat label="Appointments" value={appt?.TotalAppointments ?? 0} icon={CalendarCheck} />
      </div>
      {appt?.StatusCounts?.length ? (
        <Card title="Appointments by status" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {appt.StatusCounts.map((s) => (
              <span key={s.StatusCode} className="rounded-md bg-[#f4f6f9] px-3 py-1.5 text-sm text-[#1a1a1a]">
                {s.StatusCode}: <strong>{s.Count}</strong>
              </span>
            ))}
          </div>
        </Card>
      ) : null}
      <div className="mt-4">
        <Link to="/super-admin/organisations" className="text-sm font-medium text-[#2a5af5] hover:underline">
          View all organisations
        </Link>
      </div>
    </>
  );
}