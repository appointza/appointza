import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Clock, Loader2, Search } from "lucide-react";
import { OrganisationService } from "@/services/organisation.service";
import { OrganisationServicesService } from "@/services/organisationservices.service";
import { ReferenceValueService } from "@/services/referencevalue.service";
import { FilesService } from "@/services/files.service";
import { OrganisationDetail, OrganisationSelectReq } from "@/models/organisation.model";
import { OrganisationServices, OrganisationServicesSelectReq } from "@/models/organisationservices.model";
import { ReferenceValue, ReferenceValueSelectReq } from "@/models/referencevalue.model";
import { REFERENCETYPE } from "@/models/users.model";
import { PublicBrowseShell } from "@/components/layout/PublicBrowseShell";
import { useToast } from "@/hooks/use-toast";

interface ServiceWithOrg extends OrganisationServices {
  organisationName: string;
  organisationLocationId: number;
  organisationLocationCity: string;
  organisationLocationState: string;
}

/** Active services — same catalogue & filter behaviour as Explore → Service tab. */
const PublicBrowseServicesPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleBookSlot = (orgId: number, locationId: number) => {
    const dest = `/book-appointment/${orgId}/${locationId}`;
    if (isAuthenticated) {
      navigate(dest);
    } else {
      navigate("/login", { state: { from: dest } });
    }
  };
  const organisationService = useMemo(() => new OrganisationService(), []);
  const organisationServicesService = useMemo(() => new OrganisationServicesService(), []);
  const referenceValueService = useMemo(() => new ReferenceValueService(), []);
  const filesService = useMemo(() => new FilesService(), []);

  const [organisations, setOrganisations] = useState<OrganisationDetail[]>([]);
  const [services, setServices] = useState<ServiceWithOrg[]>([]);
  const [loading, setLoading] = useState(true);

  const serviceCardImageUrls = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of services) {
      const firstId = s.attributes?.ImageIds?.find((id) => (id ?? 0) > 0);
      if (firstId) map[`${s.organisationid}-${s.id}`] = filesService.getImageUrl(firstId);
    }
    return map;
  }, [services, filesService]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServicePrimaryType, setSelectedServicePrimaryType] = useState<number | null>(null);
  const [selectedServiceSecondaryType, setSelectedServiceSecondaryType] = useState<number | null>(null);
  const [primaryBusinessTypes, setPrimaryBusinessTypes] = useState<ReferenceValue[]>([]);
  const [secondaryBusinessTypes, setSecondaryBusinessTypes] = useState<ReferenceValue[]>([]);

  const loadReferenceTypes = useCallback(async () => {
    try {
      const req = new ReferenceValueSelectReq();
      req.referencetypeid = REFERENCETYPE.ORGANISATIONPRIMARYTYPE;
      req.organisationid = 0;
      const response = await referenceValueService.select(req);
      if (response) setPrimaryBusinessTypes(response);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load business types",
        variant: "destructive",
      });
    }
  }, [referenceValueService, toast]);

  const loadSecondaryTypes = useCallback(
    async (primaryId: number) => {
      try {
        const req = new ReferenceValueSelectReq();
        req.parentid = primaryId;
        req.referencetypeid = REFERENCETYPE.ORGANISATIONSECONDARYTYPE;
        req.organisationid = 0;
        const response = await referenceValueService.select(req);
        if (response) setSecondaryBusinessTypes(response);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load secondary business types",
          variant: "destructive",
        });
      }
    },
    [referenceValueService, toast]
  );

  const handleServicePrimaryTypeSelect = (typeId: number) => {
    setSelectedServicePrimaryType(typeId);
    setSelectedServiceSecondaryType(null);
    loadSecondaryTypes(typeId);
  };

  const handleServiceSecondaryTypeSelect = (typeId: number) => {
    setSelectedServiceSecondaryType(typeId);
  };

  const clearServiceFilters = () => {
    setSelectedServicePrimaryType(null);
    setSelectedServiceSecondaryType(null);
    setSearchTerm("");
    setSecondaryBusinessTypes([]);
  };

  useEffect(() => {
    loadReferenceTypes();
  }, [loadReferenceTypes]);

  useEffect(() => {
    let cancelled = false;

    const loadServicesForOrgs = async (orgs: OrganisationDetail[]) => {
      const out: ServiceWithOrg[] = [];
      const uniqueOrgIds = [...new Set(orgs.map((o) => o.organisationid))];

      for (const orgId of uniqueOrgIds) {
        try {
          const req = new OrganisationServicesSelectReq();
          req.organisationid = orgId;
          req.id = 0;
          const list = await organisationServicesService.select(req);
          if (!list?.length) continue;
          const orgDetails = orgs.find((o) => o.organisationid === orgId);
          list
            .filter((s) => s.isactive)
            .forEach((service) => {
              out.push({
                ...service,
                organisationName: orgDetails?.organisationname || "Business",
                organisationLocationId: orgDetails?.organisationlocationid || 0,
                organisationLocationCity: orgDetails?.organisationlocationcity || "",
                organisationLocationState: orgDetails?.organisationlocationstate || "",
              });
            });
        } catch {
          /* skip org */
        }
      }
      return out;
    };

    (async () => {
      try {
        setLoading(true);
        const req = new OrganisationSelectReq();
        const response = await organisationService.selectOrganisationDetail(req);
        if (cancelled) return;
        const orgs = Array.isArray(response) ? response.filter((o) => o.organisationlocationid > 0) : [];
        setOrganisations(orgs);
        if (!orgs.length) {
          setServices([]);
          return;
        }
        const all = await loadServicesForOrgs(orgs);
        if (!cancelled) setServices(all);
      } catch {
        if (!cancelled) {
          setOrganisations([]);
          setServices([]);
          toast({
            title: "Could not load services",
            description: "Try again shortly.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [organisationService, organisationServicesService, toast]);

  const filtered = useMemo(() => {
    let list = [...services];
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.Servicename.toLowerCase().includes(q) ||
          s.organisationName.toLowerCase().includes(q) ||
          s.organisationLocationCity.toLowerCase().includes(q) ||
          s.organisationLocationState.toLowerCase().includes(q) ||
          (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    if (selectedServicePrimaryType) {
      list = list.filter((s) => {
        const org = organisations.find((o) => o.organisationid === s.organisationid);
        return org?.organisationprimarytype === selectedServicePrimaryType;
      });
    }
    if (selectedServiceSecondaryType) {
      list = list.filter((s) => {
        const org = organisations.find((o) => o.organisationid === s.organisationid);
        return org?.organisationsecondarytype === selectedServiceSecondaryType;
      });
    }
    return list;
  }, [
    services,
    searchTerm,
    organisations,
    selectedServicePrimaryType,
    selectedServiceSecondaryType,
  ]);

  const hasActiveFilters =
    !!(searchTerm.trim() || selectedServicePrimaryType || selectedServiceSecondaryType);

  return (
    <PublicBrowseShell
      title="Services — Book on Appointza"
      metaDescription="Browse services from salons, clinics, gyms and businesses on Appointza."
      heading="Popular services"
      // description={
      //   <>
      //     Book time-based services listed by verified businesses — same catalogue as Explore, services-only layout. You may be
      //     asked to sign in when you complete a booking.
      //   </>
      // }
      footnote={
        <>
          Looking for organisations or events? See{" "}
          <Link to="/organisations" className="text-orange-600 font-medium hover:underline">
            Organisations
          </Link>
          {" · "}
          <Link to="/events" className="text-orange-600 font-medium hover:underline">
            Events
          </Link>
          .
        </>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-64 rounded-xl border border-zinc-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <span className="ml-3 text-zinc-600">Loading services…</span>
        </div>
      ) : (
        <>
          <div className="space-y-4 md:space-y-6">
            <section className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all">
              <h2 className="text-xl font-semibold text-zinc-900 mb-1">Filter by Business Type</h2>
              <p className="text-sm text-zinc-600 mb-6">
                Select primary and secondary business types, then use search below to narrow results (same as Explore).
              </p>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-orange-600 mb-3 block">Primary business type</label>
                  <div className="flex flex-wrap gap-2">
                    {primaryBusinessTypes.map((type) => {
                      const on = selectedServicePrimaryType === type.id;
                      return (
                        <Button
                          key={type.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleServicePrimaryTypeSelect(type.id)}
                          className={
                            on
                              ? "text-xs rounded-2xl border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:text-white"
                              : "text-xs rounded-2xl border-zinc-300 bg-white text-zinc-900 hover:border-orange-400 hover:bg-orange-50/50"
                          }
                        >
                          {type.displaytext}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {selectedServicePrimaryType != null && secondaryBusinessTypes.length > 0 ? (
                  <div>
                    <label className="text-sm font-medium text-orange-600 mb-3 block">Secondary business type</label>
                    <div className="flex flex-wrap gap-2">
                      {secondaryBusinessTypes.map((type) => {
                        const on = selectedServiceSecondaryType === type.id;
                        return (
                          <Button
                            key={type.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleServiceSecondaryTypeSelect(type.id)}
                            className={
                              on
                                ? "text-xs rounded-2xl border-orange-600 bg-orange-600 text-white hover:bg-orange-700 hover:text-white"
                                : "text-xs rounded-2xl border-zinc-300 bg-white text-zinc-900 hover:border-orange-400 hover:bg-orange-50/50"
                            }
                          >
                            {type.displaytext}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {hasActiveFilters ? (
                  <Button type="button" onClick={clearServiceFilters} variant="ghost" size="sm" className="text-red-600 hover:text-red-700 px-0">
                    Clear all filters
                  </Button>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all max-w-xl">
              <Label htmlFor="services-browse-search" className="text-xl font-semibold text-zinc-900 mb-1 block">
                Search
              </Label>
              <p className="text-sm text-zinc-600 mb-4">Find by service name, business, city, or state.</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" aria-hidden />
                <Input
                  id="services-browse-search"
                  placeholder="Search services by name, organisation, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-2xl border-zinc-300 bg-white h-11 focus-visible:ring-orange-500/25 focus-visible:border-orange-400"
                />
              </div>
            </section>
          </div>

          <div className="mt-8 space-y-4">
          {!filtered.length ? (
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-10 shadow-sm text-center space-y-4">
              <p className="text-zinc-600">
                {!services.length
                  ? "No services listed yet."
                  : "No services match your search or filters."}
              </p>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  onClick={clearServiceFilters}
                  className="rounded-2xl bg-white border border-zinc-300 text-zinc-900 hover:border-orange-400 hover:bg-orange-50/50"
                  variant="outline"
                >
                  Clear filters
                </Button>
              ) : (
                <Button variant="outline" asChild className="rounded-2xl bg-white border border-zinc-300 text-zinc-900 hover:border-orange-400 hover:bg-orange-50/50">
                  <Link to="/explore">Open Explore</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-500">
                {filtered.length} service{filtered.length === 1 ? "" : "s"}
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filtered.map((service) => {
                  const sub =
                    service.notes?.trim() ||
                    [service.organisationLocationCity, service.organisationLocationState].filter(Boolean).join(", ");
                  const coverUrl = serviceCardImageUrls[`${service.organisationid}-${service.id}`];
                  return (
                    <article
                      key={`${service.organisationid}-${service.id}`}
                      className="rounded-3xl border border-zinc-200 bg-zinc-50/80 overflow-hidden shadow-sm hover:border-zinc-300 hover:shadow-md transition-all flex flex-col"
                    >
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt={service.Servicename}
                          className="h-40 w-full object-cover border-b border-zinc-200"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="h-24 w-full bg-gradient-to-br from-orange-50 to-zinc-100 border-b border-zinc-200" />
                      )}
                      <div className="p-6 flex flex-col flex-1">
                      <span className="text-sm font-medium text-orange-600 line-clamp-1 mb-1">{service.organisationName}</span>
                      <h3 className="text-xl font-semibold text-zinc-900 mb-1 line-clamp-2">{service.Servicename}</h3>
                      {sub ? (
                        <p className="text-sm text-zinc-600 mb-4 flex-grow line-clamp-3">{sub}</p>
                      ) : (
                        <div className="flex-grow mb-4" />
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 mb-5">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3.5 text-zinc-400" aria-hidden />
                          {service.timetaken ? `${service.timetaken} min` : "Duration at booking"}
                        </span>
                        {service.show_price ? (
                          <span className="text-zinc-900 font-semibold">
                            {service.offerprize > 0 ? (
                              <>
                                <span className="text-zinc-400 line-through font-normal mr-1">₹{service.prize}</span>₹
                                {service.offerprize}
                              </>
                            ) : (
                              <>from ₹{service.prize}</>
                            )}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="w-full py-3.5 rounded-2xl font-medium bg-white border border-zinc-300 text-zinc-900 hover:border-orange-400 hover:bg-orange-50/50 transition-colors mt-auto"
                        onClick={() => handleBookSlot(service.organisationid, service.organisationLocationId)}
                      >
                        Book slot
                      </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
          </div>
        </>
      )}
    </PublicBrowseShell>
  );
};

export default PublicBrowseServicesPage;
