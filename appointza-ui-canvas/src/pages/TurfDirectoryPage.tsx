import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, MapPin, Phone, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PublicBrowseShell } from "@/components/layout/PublicBrowseShell";
import { TURF_DIRECTORY_DATA_URL, type TurfVenue } from "@/models/turfDirectory.model";
import { cn } from "@/lib/utils";

const TurfDirectoryPage = () => {
  const [venues, setVenues] = useState<TurfVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [constituencyFilter, setConstituencyFilter] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(TURF_DIRECTORY_DATA_URL);
        if (!response.ok) {
          throw new Error(`Failed to load turf directory (${response.status})`);
        }
        const data = (await response.json()) as TurfVenue[];
        if (!cancelled) {
          setVenues(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load directory");
          setVenues([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cities = useMemo(() => {
    const values = new Set<string>();
    venues.forEach((v) => {
      if (v.City?.trim()) values.add(v.City.trim());
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [venues]);

  const constituencies = useMemo(() => {
    const values = new Set<string>();
    venues.forEach((v) => {
      if (v.Constituency?.trim()) values.add(v.Constituency.trim());
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [venues]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return venues.filter((venue) => {
      if (cityFilter && venue.City !== cityFilter) return false;
      if (constituencyFilter && venue.Constituency !== constituencyFilter) return false;
      if (!q) return true;

      const haystack = [
        venue.Name,
        venue.Category,
        venue.Address,
        venue.City,
        venue.Constituency,
        venue.Phone,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [venues, searchTerm, cityFilter, constituencyFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setCityFilter("");
    setConstituencyFilter("");
  };

  return (
    <PublicBrowseShell
      title="Turf Directory — Tamil Nadu | Appointza"
      metaDescription="Browse turf grounds, sports clubs, and indoor arenas across Tamil Nadu."
      heading="Turf & sports venues — Tamil Nadu"
      description="Directory of turfs, cricket grounds, and indoor sports arenas. Filter by city or constituency and open the location on Google Maps."
      footnote={
        <>
          Are you a turf owner?{" "}
          <a href="/register" className="text-orange-600 hover:underline font-medium">
            List your business on Appointza
          </a>
          .
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="turf-search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" aria-hidden />
              <Input
                id="turf-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, area, address, phone…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="turf-city">City</Label>
            <select
              id="turf-city"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="turf-constituency">Constituency</Label>
            <select
              id="turf-constituency"
              value={constituencyFilter}
              onChange={(e) => setConstituencyFilter(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All constituencies</option>
              {constituencies.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              Showing <span className="font-semibold text-zinc-900">{filtered.length}</span> of{" "}
              <span className="font-semibold text-zinc-900">{venues.length}</span> venues
            </p>
            {(searchTerm || cityFilter || constituencyFilter) && (
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center text-zinc-600">
            <Loader2 className="mr-2 size-5 animate-spin" aria-hidden />
            Loading turf directory…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-zinc-600">
            No venues match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((venue, index) => (
              <article
                key={`${venue.Name}-${venue.Address}-${index}`}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {venue.ImageURL ? (
                  <img
                    src={venue.ImageURL}
                    alt={venue.Name}
                    className="h-44 w-full object-cover bg-zinc-100"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-zinc-100 text-sm text-zinc-500">
                    No image
                  </div>
                )}

                <div className="space-y-3 p-5">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">{venue.Name}</h2>
                    {venue.Category ? (
                      <p className="text-sm font-medium text-orange-600">{venue.Category}</p>
                    ) : null}
                  </div>

                  <p className="flex items-start gap-2 text-sm text-zinc-600">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-zinc-400" aria-hidden />
                    <span>
                      {venue.Address || `${venue.City}, ${venue.State}`}
                    </span>
                  </p>

                  <p className="text-xs text-zinc-500">
                    {venue.City}
                    {venue.Constituency ? ` • ${venue.Constituency}` : ""}
                    {venue.State ? ` • ${venue.State}` : ""}
                  </p>

                  {venue.Phone ? (
                    <p className="flex items-center gap-2 text-sm text-zinc-700">
                      <Phone className="size-4 text-zinc-400" aria-hidden />
                      <a href={`tel:${venue.Phone.replace(/\s/g, "")}`} className="hover:text-orange-600">
                        {venue.Phone}
                      </a>
                    </p>
                  ) : null}

                  {venue.MapURL ? (
                    <a
                      href={venue.MapURL}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700",
                      )}
                    >
                      Open in Maps
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </PublicBrowseShell>
  );
};

export default TurfDirectoryPage;
