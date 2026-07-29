import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { RoomDefinitionCard, RoomNotFoundPanel } from "@/components/rooms/RoomDefinitionCard";
import { RoomDefinitionForm } from "@/components/rooms/RoomDefinitionForm";
import "@/components/rooms/room-definitions.css";
import "@/components/rooms/room-status.css";
import { emptyRoom, normalizePickableImage, normalizeRoom, type PickableImage, type RoomDefinition } from "@/models/room";
import { stayApi } from "@/services/stay.service";

export default function RoomDefinitionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  const roomId = searchParams.get("id") ?? undefined;
  const creating = searchParams.get("create") === "true";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rooms-select", roomId, creating],
    queryFn: () => stayApi.rooms.select(roomId, creating || undefined),
  });

  const rooms = useMemo(
    () => ((data?.rooms as Record<string, unknown>[]) ?? []).map(normalizeRoom),
    [data?.rooms]
  );

  const pickableImages = useMemo(
    () => ((data?.pickableImages as Record<string, unknown>[]) ?? []).map(normalizePickableImage),
    [data?.pickableImages]
  );

  const selected: RoomDefinition | null = useMemo(() => {
    if (creating) {
      const raw = data?.selected as Record<string, unknown> | null | undefined;
      return raw ? normalizeRoom(raw) : emptyRoom();
    }
    if (roomId && data?.selected) {
      return normalizeRoom(data.selected as Record<string, unknown>);
    }
    return null;
  }, [creating, roomId, data?.selected]);

  const showForm = creating || Boolean(roomId);
  const roomNotFound = Boolean(roomId && !creating && !isLoading && !data?.selected);

  useEffect(() => {
    if (!showForm && !roomNotFound) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showForm, roomNotFound]);

  const openRoom = useCallback(
    (id: string) => setSearchParams({ id }),
    [setSearchParams]
  );

  const openCreate = useCallback(() => setSearchParams({ create: "true" }), [setSearchParams]);

  const closeForm = useCallback(() => setSearchParams({}), [setSearchParams]);

  const onSaved = useCallback(
    (id: string) => {
      setSearchParams({ id });
      void refetch();
    },
    [refetch, setSearchParams]
  );

  const filteredRooms = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((room) => {
      const text = `${room.RoomNumber} ${room.RoomName} ${room.RoomType} ${room.Guest?.Name ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [rooms, search]);

  return (
    <StaffLayout>
      <div className="room-def-shell -mx-3 -my-3 sm:-mx-4 sm:-my-3 lg:-mx-5 lg:-my-5">
        <div className="room-def-list-panel">
          <header className="room-def-header">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Operations</p>
                <h1 className="font-display text-lg font-semibold">Room definitions</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  placeholder="Search rooms…"
                  className="room-def-input max-w-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search rooms"
                />
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> New room
                </button>
              </div>
            </div>
          </header>

          <div className="room-def-scroll">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="rs-grid">
                  {filteredRooms.map((room) => (
                    <RoomDefinitionCard
                      key={room.Id}
                      room={room}
                      selected={room.Id === roomId}
                      onSelect={() => openRoom(room.Id)}
                    />
                  ))}
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  Showing {filteredRooms.length} room{filteredRooms.length === 1 ? "" : "s"}
                </p>
              </>
            )}
          </div>
        </div>

        {(showForm || roomNotFound) && (
          <button
            type="button"
            className="room-def-detail-backdrop"
            aria-label="Close room editor"
            onClick={closeForm}
          />
        )}

        {roomNotFound && <RoomNotFoundPanel onBack={closeForm} />}

        {selected && !roomNotFound && (
          <RoomDefinitionForm
            key={`${selected.Id || "new"}-${creating}`}
            room={selected}
            pickableImages={pickableImages}
            onCancel={closeForm}
            onSaved={onSaved}
            onDeleted={() => {
              closeForm();
              void refetch();
            }}
          />
        )}
      </div>
    </StaffLayout>
  );
}
