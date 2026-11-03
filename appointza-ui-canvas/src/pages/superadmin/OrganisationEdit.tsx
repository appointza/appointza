import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Organisation, OrganisationSelectReq } from "@/models/organisation.model";
import { OrganisationLocation, OrganisationLocationSelectReq } from "@/models/organisationlocation.model";
import { OrganisationServices, OrganisationServicesSelectReq } from "@/models/organisationservices.model";
import {
  OrganisationServiceTiming,
  OrganisationServiceTimingBulkSaveReq,
  OrganisationServiceTimingSelectReq,
  OrganisationServiceTimingSlotReq,
} from "@/models/organisationservicetiming.model";
import {
  OrganisationRoom,
  OrganisationRoomSelectReq,
  normalizeOrganisationRoom,
} from "@/models/hospitality.model";
import { OrganisationService } from "@/services/organisation.service";
import { OrganisationLocationService } from "@/services/organisationlocation.service";
import { OrganisationServicesService } from "@/services/organisationservices.service";
import { OrganisationServiceTimingService } from "@/services/organisationservicetiming.service";
import { HospitalityService } from "@/services/hospitality.service";
import {
  superAdminService,
  superAdminErrorMessage,
} from "@/services/superAdmin.service";
import {
  applyAssumedOrganisationSession,
  isAssumingOrganisation,
  restoreSuperAdminSession,
  stashSuperAdminSession,
} from "@/utils/superAdminAssumeOrg.util";
import {
  Card,
  ErrorBox,
  PageHeader,
  Pill,
  Spinner,
  selectCls,
  tableCls,
  tdCls,
  thCls,
} from "@/components/superadmin/ui";

type TabId = "profile" | "locations" | "services" | "rooms" | "hours" | "website";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "locations", label: "Locations" },
  { id: "services", label: "Services" },
  { id: "rooms", label: "Rooms" },
  { id: "hours", label: "Opening hours" },
  { id: "website", label: "Website" },
];

/** Matches organisation Timing page: Monday=1 … Sunday=7 */
const DAYS = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 7, label: "Sun" },
];

function timeInputValue(value: string | Date | undefined) {
  if (!value) return "";
  if (typeof value === "string") {
    // "09:00:00" or ISO
    const m = value.match(/(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : value.slice(0, 5);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SuperAdminOrganisationEdit() {
  const { id } = useParams();
  const orgId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshAuth } = useAuth();

  const orgService = useMemo(() => new OrganisationService(), []);
  const locService = useMemo(() => new OrganisationLocationService(), []);
  const svcService = useMemo(() => new OrganisationServicesService(), []);
  const timingService = useMemo(() => new OrganisationServiceTimingService(), []);
  const roomService = useMemo(() => new HospitalityService(), []);

  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState("");
  const [tab, setTab] = useState<TabId>("profile");
  const [saving, setSaving] = useState(false);

  const [org, setOrg] = useState<Organisation | null>(null);
  const [locations, setLocations] = useState<OrganisationLocation[]>([]);
  const [locationId, setLocationId] = useState(0);
  const [services, setServices] = useState<OrganisationServices[]>([]);
  const [rooms, setRooms] = useState<OrganisationRoom[]>([]);
  const [timings, setTimings] = useState<OrganisationServiceTiming[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: "",
    gstnumber: "",
    primarytypecode: "",
    secondarytypecode: "",
    notes: "",
  });
  const [locForm, setLocForm] = useState<Partial<OrganisationLocation> | null>(null);
  const [svcForm, setSvcForm] = useState<{ id: number; Servicename: string; prize: number; timetaken: number; notes: string } | null>(
    null,
  );
  const [hourDraft, setHourDraft] = useState<Record<number, { start: string; end: string; enabled: boolean }>>({});

  const exitEditor = useCallback(() => {
    const path = restoreSuperAdminSession();
    refreshAuth();
    navigate(path.startsWith("/super-admin/organisations/") ? `/super-admin/organisations/${orgId}` : path, {
      replace: true,
    });
  }, [navigate, orgId, refreshAuth]);

  // Boot: assume org JWT for API calls, stay on this super-admin screen.
  useEffect(() => {
    if (!Number.isFinite(orgId) || orgId <= 0) {
      setBootError("Invalid organisation id");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const ctx = await superAdminService.assumeOrganisation(orgId);
        if (!ctx?.accesstoken) throw new Error("Could not open organisation for editing");
        if (!isAssumingOrganisation()) {
          stashSuperAdminSession({
            organisationid: orgId,
            organisationname: String(ctx.organisationname || `Organisation #${orgId}`),
            returnPath: `/super-admin/organisations/${orgId}`,
          });
        }
        applyAssumedOrganisationSession(ctx);
        refreshAuth();

        const req = new OrganisationSelectReq();
        req.id = orgId;
        const rows = await orgService.select(req);
        const row = rows?.[0];
        if (!row) throw new Error("Organisation not found");
        if (cancelled) return;
        setOrg(row);
        setProfileForm({
          name: row.name || "",
          gstnumber: row.gstnumber || "",
          primarytypecode: row.primarytypecode || "",
          secondarytypecode: row.secondarytypecode || "",
          notes: row.notes || "",
        });

        const locReq = new OrganisationLocationSelectReq();
        locReq.organisationid = orgId;
        const locs = (await locService.select(locReq)) || [];
        if (cancelled) return;
        setLocations(locs);
        const firstLoc = locs[0]?.id || Number(ctx.organisationlocationid || 0) || 0;
        setLocationId(firstLoc);
        setReady(true);
      } catch (e) {
        if (!cancelled) setBootError(superAdminErrorMessage(e, "Could not open organisation editor"));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const loadLocationScoped = useCallback(async () => {
    if (!orgId || !locationId) {
      setServices([]);
      setRooms([]);
      setTimings([]);
      return;
    }
    setLoadingTab(true);
    try {
      const svcReq = new OrganisationServicesSelectReq();
      svcReq.organisationid = orgId;
      svcReq.organisationlocationid = locationId;
      const svcRows = (await svcService.select(svcReq)) || [];
      setServices(svcRows);

      const roomReq = new OrganisationRoomSelectReq();
      roomReq.organisation_id = orgId;
      roomReq.organisation_location_id = locationId;
      const roomRows = await roomService.selectRooms(roomReq);
      setRooms((roomRows ?? []).map((r) => normalizeOrganisationRoom(r)));

      const timingReq = new OrganisationServiceTimingSelectReq();
      timingReq.organisationid = orgId;
      timingReq.organisationlocationid = locationId;
      const timingRows = (await timingService.select(timingReq)) || [];
      setTimings(timingRows);
      const draft: Record<number, { start: string; end: string; enabled: boolean }> = {};
      for (const day of DAYS) {
        const row = timingRows.find((t) => Number(t.day_of_week) === day.id && t.isactive !== false);
        draft[day.id] = row
          ? { start: timeInputValue(row.start_time), end: timeInputValue(row.end_time), enabled: true }
          : { start: "09:00", end: "18:00", enabled: false };
      }
      setHourDraft(draft);
    } catch (e) {
      toast({ title: "Could not load location data", description: superAdminErrorMessage(e), variant: "destructive" });
    } finally {
      setLoadingTab(false);
    }
  }, [orgId, locationId, roomService, svcService, timingService, toast]);

  useEffect(() => {
    if (!ready) return;
    void loadLocationScoped();
  }, [ready, locationId, loadLocationScoped]);

  const goToSection = (id: TabId) => {
    setTab(id);
    const el = document.getElementById(`org-edit-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const saveProfile = async () => {
    if (!org) return;
    setSaving(true);
    try {
      const next = Object.assign(new Organisation(), org, {
        name: profileForm.name.trim(),
        gstnumber: profileForm.gstnumber.trim(),
        primarytypecode: profileForm.primarytypecode.trim(),
        secondarytypecode: profileForm.secondarytypecode.trim(),
        notes: profileForm.notes.trim(),
      });
      await orgService.update(next);
      setOrg(next);
      toast({ title: "Organisation profile saved" });
    } catch (e) {
      toast({ title: "Save failed", description: superAdminErrorMessage(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveLocation = async () => {
    if (!locForm || !orgId) return;
    setSaving(true);
    try {
      const payload = Object.assign(new OrganisationLocation(), locForm, {
        organisationid: orgId,
        isactive: locForm.isactive !== false,
      });
      await locService.save(payload);
      toast({ title: locForm.id ? "Location updated" : "Location added" });
      setLocForm(null);
      const locReq = new OrganisationLocationSelectReq();
      locReq.organisationid = orgId;
      const locs = (await locService.select(locReq)) || [];
      setLocations(locs);
      if (!locationId && locs[0]?.id) setLocationId(locs[0].id);
    } catch (e) {
      toast({ title: "Location save failed", description: superAdminErrorMessage(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveService = async () => {
    if (!svcForm || !orgId || !locationId) return;
    setSaving(true);
    try {
      const payload = Object.assign(new OrganisationServices(), {
        id: svcForm.id,
        Servicename: svcForm.Servicename.trim(),
        prize: Number(svcForm.prize) || 0,
        timetaken: Number(svcForm.timetaken) || 0,
        notes: svcForm.notes.trim(),
        organisationid: orgId,
        organisationlocationid: locationId,
        isactive: true,
        show_price: true,
      });
      await svcService.save(payload);
      toast({ title: svcForm.id ? "Service updated" : "Service added" });
      setSvcForm(null);
      await loadLocationScoped();
    } catch (e) {
      toast({ title: "Service save failed", description: superAdminErrorMessage(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const saveHours = async () => {
    if (!orgId || !locationId) return;
    setSaving(true);
    try {
      const bulk = new OrganisationServiceTimingBulkSaveReq();
      bulk.organisationid = orgId;
      bulk.organisationlocationid = locationId;
      bulk.counter = timings[0]?.counter || 1;
      bulk.openbefore = timings[0]?.openbefore || 0;
      bulk.slots = Object.entries(hourDraft)
        .filter(([, v]) => v.enabled && v.start && v.end)
        .map(([day, v]) => {
          const slot = new OrganisationServiceTimingSlotReq();
          slot.day_of_week = Number(day);
          slot.start_time = v.start.length === 5 ? `${v.start}:00` : v.start;
          slot.end_time = v.end.length === 5 ? `${v.end}:00` : v.end;
          return slot;
        });
      await timingService.saveBulk(bulk);
      toast({ title: "Opening hours saved" });
      await loadLocationScoped();
    } catch (e) {
      toast({ title: "Hours save failed", description: superAdminErrorMessage(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (bootError) {
    return (
      <ErrorBox
        message={bootError}
        onRetry={() => {
          setBootError("");
          window.location.reload();
        }}
      />
    );
  }
  if (!ready || !org) return <Spinner label="Opening organisation editor" />;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm text-[#2a5af5] hover:underline"
          onClick={exitEditor}
        >
          <ArrowLeft className="h-4 w-4" /> Back to organisation
        </button>
        <Link to="/super-admin/organisations" className="text-sm text-[#7a8494] hover:underline">
          All organisations
        </Link>
      </div>

      <PageHeader
        title={`Edit · ${org.name || `Organisation #${orgId}`}`}
        subtitle="Super admin editor — profile, locations, services, rooms, opening hours and website."
        actions={
          <>
            <Pill tone="amber">Super Admin edit</Pill>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => navigate(`/organization/dashboard`)}
              title="Optional: open the live organisation workspace"
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Open live workspace
            </Button>
          </>
        }
      />

      <div className="sticky top-0 z-10 -mx-1 mb-4 space-y-3 border-b border-[#e6eaf0] bg-[#f5f7f9] px-1 pb-3 pt-1">
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => goToSection(t.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium",
                tab === t.id ? "bg-[#eef2f7] text-[#1a1a1a] ring-1 ring-[#cfd7e3]" : "text-[#5b6572] hover:bg-[#f4f6f9]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="max-w-sm">
          <Label className="text-xs text-[#5b6572]">Location context (services, rooms, hours)</Label>
          <select
            className={`${selectCls} mt-1 w-full`}
            value={locationId}
            onChange={(e) => setLocationId(Number(e.target.value) || 0)}
          >
            <option value={0}>Select location…</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name || `Location #${l.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-5">
        <section
          id="org-edit-profile"
          className={cn("scroll-mt-28 rounded-lg transition-shadow", tab === "profile" && "ring-2 ring-[#528ff0]/")}
        >
          <Card title="Organisation profile">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input className="mt-1" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </div>
              <div>
                <Label>GST</Label>
                <Input className="mt-1" value={profileForm.gstnumber} onChange={(e) => setProfileForm({ ...profileForm, gstnumber: e.target.value })} />
              </div>
              <div>
                <Label>Primary type code</Label>
                <Input className="mt-1" value={profileForm.primarytypecode} onChange={(e) => setProfileForm({ ...profileForm, primarytypecode: e.target.value })} />
              </div>
              <div>
                <Label>Secondary type code</Label>
                <Input className="mt-1" value={profileForm.secondarytypecode} onChange={(e) => setProfileForm({ ...profileForm, secondarytypecode: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>Notes</Label>
                <Input className="mt-1" value={profileForm.notes} onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })} />
              </div>
            </div>
            <Button className="mt-4" disabled={saving} onClick={() => void saveProfile()}>
              <Save className="mr-1.5 h-4 w-4" /> Save profile
            </Button>
          </Card>
        </section>

        <section
          id="org-edit-locations"
          className={cn("scroll-mt-28 space-y-4 rounded-lg transition-shadow", tab === "locations" && "ring-2 ring-[#528ff0]/")}
        >
          <Card title={`Locations (${locations.length})`}>
            <div className="overflow-x-auto">
              <table className={tableCls}>
                <thead>
                  <tr>
                    <th className={thCls}>Name</th>
                    <th className={thCls}>City</th>
                    <th className={thCls}>Custom URL</th>
                    <th className={thCls}>Status</th>
                    <th className={thCls}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((l) => (
                    <tr key={l.id}>
                      <td className={tdCls}>{l.name}</td>
                      <td className={tdCls}>{l.city || "-"}</td>
                      <td className={tdCls}>{l.customurl || "-"}</td>
                      <td className={tdCls}>{l.isactive ? <Pill tone="green">Active</Pill> : <Pill tone="gray">Inactive</Pill>}</td>
                      <td className={tdCls}>
                        <Button size="sm" variant="outline" onClick={() => setLocForm({ ...l })}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() =>
                setLocForm({
                  id: 0,
                  organisationid: orgId,
                  name: "",
                  addressline1: "",
                  city: "",
                  state: "",
                  country: "India",
                  pincode: "",
                  customurl: "",
                  email: "",
                  whatsapp_mobile: "",
                  isactive: true,
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add location
            </Button>
          </Card>
          {locForm ? (
            <Card title={locForm.id ? "Edit location" : "New location"}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Name" value={locForm.name || ""} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} />
                <Input placeholder="Custom URL slug" value={locForm.customurl || ""} onChange={(e) => setLocForm({ ...locForm, customurl: e.target.value })} />
                <Input placeholder="Address line 1" value={locForm.addressline1 || ""} onChange={(e) => setLocForm({ ...locForm, addressline1: e.target.value })} />
                <Input placeholder="Address line 2" value={locForm.addressline2 || ""} onChange={(e) => setLocForm({ ...locForm, addressline2: e.target.value })} />
                <Input placeholder="City" value={locForm.city || ""} onChange={(e) => setLocForm({ ...locForm, city: e.target.value })} />
                <Input placeholder="State" value={locForm.state || ""} onChange={(e) => setLocForm({ ...locForm, state: e.target.value })} />
                <Input placeholder="Pincode" value={locForm.pincode || ""} onChange={(e) => setLocForm({ ...locForm, pincode: e.target.value })} />
                <Input placeholder="Country" value={locForm.country || ""} onChange={(e) => setLocForm({ ...locForm, country: e.target.value })} />
                <Input placeholder="Email" value={locForm.email || ""} onChange={(e) => setLocForm({ ...locForm, email: e.target.value })} />
                <Input placeholder="WhatsApp mobile" value={locForm.whatsapp_mobile || ""} onChange={(e) => setLocForm({ ...locForm, whatsapp_mobile: e.target.value })} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button disabled={saving} onClick={() => void saveLocation()}>
                  <Save className="mr-1.5 h-4 w-4" /> Save location
                </Button>
                <Button variant="outline" onClick={() => setLocForm(null)}>
                  Cancel
                </Button>
              </div>
            </Card>
          ) : null}
        </section>

        <section
          id="org-edit-services"
          className={cn("scroll-mt-28 space-y-4 rounded-lg transition-shadow", tab === "services" && "ring-2 ring-[#528ff0]/")}
        >
          {!locationId ? (
            <Card title="Services">Select a location above to manage services.</Card>
          ) : loadingTab ? (
            <Card title="Services">
              <Spinner label="Loading services" />
            </Card>
          ) : (
            <>
              <Card title={`Services (${services.length})`}>
                <div className="overflow-x-auto">
                  <table className={tableCls}>
                    <thead>
                      <tr>
                        <th className={thCls}>Name</th>
                        <th className={thCls}>Price</th>
                        <th className={thCls}>Duration (min)</th>
                        <th className={thCls}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map((s) => (
                        <tr key={s.id}>
                          <td className={tdCls}>{s.Servicename}</td>
                          <td className={tdCls}>{s.prize}</td>
                          <td className={tdCls}>{s.timetaken}</td>
                          <td className={tdCls}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setSvcForm({
                                  id: s.id,
                                  Servicename: s.Servicename || "",
                                  prize: Number(s.prize) || 0,
                                  timetaken: Number(s.timetaken) || 0,
                                  notes: s.notes || "",
                                })
                              }
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {services.length === 0 ? (
                        <tr>
                          <td className={tdCls} colSpan={4}>
                            No services for this location.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <Button
                  className="mt-3"
                  size="sm"
                  variant="outline"
                  onClick={() => setSvcForm({ id: 0, Servicename: "", prize: 0, timetaken: 30, notes: "" })}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add service
                </Button>
              </Card>
              {svcForm ? (
                <Card title={svcForm.id ? "Edit service" : "New service"}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input placeholder="Service name" value={svcForm.Servicename} onChange={(e) => setSvcForm({ ...svcForm, Servicename: e.target.value })} />
                    <Input type="number" placeholder="Price" value={svcForm.prize} onChange={(e) => setSvcForm({ ...svcForm, prize: Number(e.target.value) || 0 })} />
                    <Input type="number" placeholder="Duration minutes" value={svcForm.timetaken} onChange={(e) => setSvcForm({ ...svcForm, timetaken: Number(e.target.value) || 0 })} />
                    <Input placeholder="Notes" value={svcForm.notes} onChange={(e) => setSvcForm({ ...svcForm, notes: e.target.value })} />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button disabled={saving} onClick={() => void saveService()}>
                      <Save className="mr-1.5 h-4 w-4" /> Save service
                    </Button>
                    <Button variant="outline" onClick={() => setSvcForm(null)}>
                      Cancel
                    </Button>
                  </div>
                </Card>
              ) : null}
            </>
          )}
        </section>

        <section
          id="org-edit-rooms"
          className={cn("scroll-mt-28 rounded-lg transition-shadow", tab === "rooms" && "ring-2 ring-[#528ff0]/")}
        >
          {!locationId ? (
            <Card title="Rooms">Select a location above to view rooms.</Card>
          ) : loadingTab ? (
            <Card title="Rooms">
              <Spinner label="Loading rooms" />
            </Card>
          ) : (
            <Card title={`Rooms (${rooms.length})`}>
              <p className="mb-3 text-xs text-[#7a8494]">
                Room definitions use the hospitality module. Use live workspace for advanced room setup if needed.
              </p>
              <div className="overflow-x-auto">
                <table className={tableCls}>
                  <thead>
                    <tr>
                      <th className={thCls}>Name / code</th>
                      <th className={thCls}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((r) => (
                      <tr key={r.id}>
                        <td className={tdCls}>
                          {r.room_name || r.room_number || r.booking_rules?.room_code || `#${r.id}`}
                        </td>
                        <td className={tdCls}>{r.isactive === false ? <Pill tone="gray">Inactive</Pill> : <Pill tone="green">Active</Pill>}</td>
                      </tr>
                    ))}
                    {rooms.length === 0 ? (
                      <tr>
                        <td className={tdCls} colSpan={2}>
                          No rooms for this location.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <Button className="mt-3" size="sm" variant="outline" onClick={() => navigate("/organization/hospitality")}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Manage rooms in workspace
              </Button>
            </Card>
          )}
        </section>

        <section
          id="org-edit-hours"
          className={cn("scroll-mt-28 rounded-lg transition-shadow", tab === "hours" && "ring-2 ring-[#528ff0]/")}
        >
          {!locationId ? (
            <Card title="Opening hours">Select a location above to edit opening hours.</Card>
          ) : loadingTab ? (
            <Card title="Opening hours">
              <Spinner label="Loading hours" />
            </Card>
          ) : (
            <Card title="Opening hours">
              <div className="space-y-2">
                {DAYS.map((day) => {
                  const row = hourDraft[day.id] || { start: "09:00", end: "18:00", enabled: false };
                  return (
                    <div key={day.id} className="flex flex-wrap items-center gap-3 rounded-md border border-[#e6eaf0] px-3 py-2">
                      <label className="flex w-24 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={(e) => setHourDraft({ ...hourDraft, [day.id]: { ...row, enabled: e.target.checked } })}
                        />
                        {day.label}
                      </label>
                      <Input
                        type="time"
                        className="w-32"
                        disabled={!row.enabled}
                        value={row.start}
                        onChange={(e) => setHourDraft({ ...hourDraft, [day.id]: { ...row, start: e.target.value } })}
                      />
                      <span className="text-xs text-[#7a8494]">to</span>
                      <Input
                        type="time"
                        className="w-32"
                        disabled={!row.enabled}
                        value={row.end}
                        onChange={(e) => setHourDraft({ ...hourDraft, [day.id]: { ...row, end: e.target.value } })}
                      />
                    </div>
                  );
                })}
              </div>
              <Button className="mt-4" disabled={saving} onClick={() => void saveHours()}>
                <Save className="mr-1.5 h-4 w-4" /> Save opening hours
              </Button>
            </Card>
          )}
        </section>

        <section
          id="org-edit-website"
          className={cn("scroll-mt-28 rounded-lg transition-shadow", tab === "website" && "ring-2 ring-[#528ff0]/")}
        >
          <Card title="Website / template">
            <p className="text-sm text-[#5b6572]">
              Website and template builder stay in the organisation workspace for the selected location.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={!locationId}
                onClick={() => navigate("/organization/template-builder")}
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open template builder
              </Button>
              <Button variant="outline" onClick={() => navigate("/organization/locations")}>
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Location website settings
              </Button>
            </div>
            {locations.map((l) => (
              <div key={l.id} className="mt-3 rounded-md border border-[#e6eaf0] px-3 py-2 text-sm">
                <div className="font-medium">{l.name}</div>
                <div className="text-xs text-[#7a8494]">
                  customurl: {l.customurl || "—"} · templateid: {l.templateid || "—"}
                </div>
              </div>
            ))}
          </Card>
        </section>
      </div>
    </>
  );
}
