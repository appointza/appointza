import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Sparkles, Wrench } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { RoomStatusCard } from "@/components/rooms/RoomStatusCard";
import { RoomStatusDetailPanel } from "@/components/rooms/RoomStatusDetailPanel";
import "@/components/rooms/room-definitions.css";
import "@/components/rooms/room-status.css";
import { ROOM_STATUSES } from "@/config/roomCatalog";
import {
  findRoomInFloors,
  parseCleaningStaff,
  parseCounts,
  parseFloors,
} from "@/models/roomStatus";
import type { RoomDefinition } from "@/models/room";
import { stayApi } from "@/services/stay.service";
import { useAuth } from "@/contexts/AuthContext";

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatBoardDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function RoomStatusPage() {
  const { user } = useAuth();
  const organisationId = user?.organizationId ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("id") ?? undefined;
  const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [asOf, setAsOf] = useState(() => searchParams.get("date") || todayIso());

  useEffect(() => {
    const fromUrl = searchParams.get("date");
    if (fromUrl && fromUrl !== asOf) setAsOf(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { data, isLoading, refetch, isError, isFetching } = useQuery({
    queryKey: ["rooms-status", organisationId, selectedId, asOf],
    queryFn: () => stayApi.rooms.status(selectedId, asOf),
    enabled: !!organisationId && !!asOf,
  });

  const boardDate = String(data?.asOf || asOf);
  const today = String(data?.today || todayIso());
  const isLiveBoard = boardDate === today;

  const counts = useMemo(() => parseCounts(data?.counts), [data?.counts]);
  const floors = useMemo(() => parseFloors(data?.floors), [data?.floors]);
  const cleaningStaff = useMemo(() => parseCleaningStaff(data?.cleaningStaff), [data?.cleaningStaff]);
  const totalRooms = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

  const allRooms = useMemo(() => floors.flatMap((g) => g.rooms), [floors]);
  const floorOptions = useMemo(() => floors.map((g) => g.floor).sort((a, b) => a - b), [floors]);

  const filteredRooms = useMemo(() => {
    return allRooms.filter((room) => {
      if (floorFilter !== "all" && String(room.FloorNumber) !== floorFilter) return false;
      if (statusFilters.size > 0 && !statusFilters.has(room.Status)) return false;
      return true;
    });
  }, [allRooms, floorFilter, statusFilters]);

  const selected = useMemo(
    () => (selectedId ? findRoomInFloors(floors, selectedId) : null),
    [selectedId, floors]
  );

  const syncParams = useCallback(
    (next: { id?: string | null; date?: string }) => {
      const params = new URLSearchParams(searchParams);
      if (next.id === null) params.delete("id");
      else if (next.id) params.set("id", next.id);
      if (next.date) params.set("date", next.date);
      setSearchParams(params, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const openRoom = useCallback(
    (id: string) => {
      if (id === selectedId) syncParams({ id: null, date: asOf });
      else syncParams({ id, date: asOf });
    },
    [selectedId, syncParams, asOf]
  );

  const closeDetail = useCallback(() => syncParams({ id: null, date: asOf }), [syncParams, asOf]);

  const setBoardDate = (next: string) => {
    setAsOf(next);
    syncParams({ id: selectedId ?? null, date: next });
  };

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  const toggleStatusFilter = (status: string) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  return (
    <StaffLayout>
      <div className="room-status-page">
        <div className="rs-mobile-filters">
          <button
            type="button"
            className={`rs-chip${statusFilters.size === 0 ? " rs-chip-active" : ""}`}
            onClick={() => setStatusFilters(new Set())}
          >
            All ({totalRooms})
          </button>
          {ROOM_STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              className={`rs-chip${statusFilters.has(s.value) ? " rs-chip-active" : ""}`}
              onClick={() => toggleStatusFilter(s.value)}
            >
              {s.emoji} {s.label} ({counts[s.value] ?? 0})
            </button>
          ))}
        </div>

        <div className="room-status-body">
          <aside className="rs-sidebar">
            <div>
              <p className="rs-filter-title">Board date</p>
              <input
                type="date"
                className="rs-floor-select mt-2"
                value={asOf}
                onChange={(e) => setBoardDate(e.target.value)}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button type="button" className="rs-chip" onClick={() => setBoardDate(today)}>
                  Today
                </button>
                <button
                  type="button"
                  className="rs-chip"
                  onClick={() => setBoardDate(addDaysIso(today, 1))}
                >
                  Tomorrow
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-[#6b7280]">
                {isLiveBoard
                  ? "Live board — status from today’s bookings and room state."
                  : "Availability for this date from bookings (maintenance / blocked still apply)."}
              </p>
            </div>

            <div>
              <p className="rs-filter-title">Room status</p>
              <div className="rs-filter-group mt-3">
                <label className="rs-filter-option">
                  <input
                    type="checkbox"
                    checked={statusFilters.size === 0}
                    onChange={() => setStatusFilters(new Set())}
                  />
                  All rooms ({totalRooms})
                </label>
                {ROOM_STATUSES.map((s) => (
                  <label key={s.value} className="rs-filter-option">
                    <input
                      type="checkbox"
                      checked={statusFilters.has(s.value)}
                      onChange={() => toggleStatusFilter(s.value)}
                    />
                    {s.emoji} {s.label} ({counts[s.value] ?? 0})
                  </label>
                ))}
              </div>
            </div>

            {floorOptions.length > 1 && (
              <div>
                <p className="rs-filter-title">Floor</p>
                <select
                  className="rs-floor-select mt-2"
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                >
                  <option value="all">All floors</option>
                  {floorOptions.map((f) => (
                    <option key={f} value={String(f)}>
                      Floor {f}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-auto rounded-lg border border-dashed border-[#e5e7eb] bg-white p-3 text-xs text-[#6b7280]">
              <Sparkles className="mb-1 h-4 w-4 text-indigo-500" />
              Pick a date to see which rooms are free or booked that day. Click{" "}
              <strong>Room details</strong> to manage the live room.
            </div>
          </aside>

          <div className="room-status-board">
            {!organisationId ? (
              <div className="rs-empty">
                <p className="font-medium">Organisation not found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sign in with an AppointzaStay staff account to view rooms for your property.
                </p>
              </div>
            ) : isError ? (
              <div className="rs-empty">
                <p className="font-medium">Could not load room status</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your session may be missing organisation context. Try signing out and back in.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : allRooms.length === 0 ? (
              <div className="rs-empty">
                <Wrench className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">No rooms yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Add room definitions to start tracking status.</p>
                <Link
                  to="/staff/rooms/definitions?create=true"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Add room definitions →
                </Link>
              </div>
            ) : (
              <>
                <div className="rs-board-header">
                  <div>
                    <h2 className="rs-board-title">
                      {floorFilter === "all" ? "All rooms" : `Floor ${floorFilter}`}
                    </h2>
                    <p className="rs-board-meta">
                      {formatBoardDate(boardDate)}
                      {isLiveBoard ? " · Live" : " · From bookings"}
                      {" · "}
                      Showing {filteredRooms.length} of {allRooms.length} rooms
                      {isFetching ? " · Updating…" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    onClick={() => void refetch()}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                </div>

                {filteredRooms.length === 0 ? (
                  <div className="rs-empty">
                    <p className="font-medium">No rooms match your filters</p>
                    <button
                      type="button"
                      className="mt-3 text-sm font-medium text-primary hover:underline"
                      onClick={() => {
                        setStatusFilters(new Set());
                        setFloorFilter("all");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="rs-grid">
                    {filteredRooms.map((room: RoomDefinition) => (
                      <RoomStatusCard
                        key={room.Id}
                        room={room}
                        selected={room.Id === selectedId}
                        onSelect={() => openRoom(room.Id)}
                        asOf={boardDate}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {selected && (
          <>
            <button
              type="button"
              className="room-def-detail-backdrop"
              aria-label="Close room details"
              onClick={closeDetail}
            />
            <RoomStatusDetailPanel
              key={`${selected.Id}-${boardDate}`}
              room={selected}
              cleaningStaff={cleaningStaff}
              onClose={closeDetail}
              onUpdated={() => void refetch()}
            />
          </>
        )}
      </div>
    </StaffLayout>
  );
}
