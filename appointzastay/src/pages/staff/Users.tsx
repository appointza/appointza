import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { UserCard } from "@/components/users/UserCard";
import { UserForm } from "@/components/users/UserForm";
import "@/components/rooms/room-definitions.css";
import { emptyUser, normalizeUser, type StayUser } from "@/models/stayUser";
import { stayApi } from "@/services/stay.service";

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  const userId = searchParams.get("id") ?? undefined;
  const creating = searchParams.get("create") === "true";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["users-select", userId, creating],
    queryFn: () => stayApi.users.select(userId, creating || undefined),
  });

  const users = useMemo(
    () => ((data?.users as Record<string, unknown>[]) ?? []).map(normalizeUser),
    [data?.users]
  );

  const selected: StayUser | null = useMemo(() => {
    if (creating) {
      const raw = data?.selected as Record<string, unknown> | null | undefined;
      return raw ? normalizeUser(raw) : emptyUser();
    }
    if (userId && data?.selected) {
      return normalizeUser(data.selected as Record<string, unknown>);
    }
    return null;
  }, [creating, userId, data?.selected]);

  const showForm = creating || Boolean(userId);
  const userNotFound = Boolean(userId && !creating && !isLoading && !data?.selected);

  useEffect(() => {
    if (!showForm && !userNotFound) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showForm, userNotFound]);

  const openUser = useCallback(
    (id: string) => {
      if (id === userId) setSearchParams({});
      else setSearchParams({ id });
    },
    [userId, setSearchParams]
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

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const text = `${user.Name} ${user.Phone} ${user.Role} ${user.Department}`.toLowerCase();
      return text.includes(q);
    });
  }, [users, search]);

  return (
    <StaffLayout>
      <div className="room-def-shell -mx-3 -my-3 sm:-mx-4 sm:-my-3 lg:-mx-5 lg:-my-5">
        <div className="room-def-list-panel">
          <header className="room-def-header">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">People</p>
                <h1 className="font-display text-lg font-semibold">Users</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  placeholder="Search users…"
                  className="room-def-input max-w-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search users"
                />
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" /> New user
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredUsers.map((user) => (
                    <UserCard
                      key={user.Id}
                      user={user}
                      selected={user.Id === userId}
                      onSelect={() => openUser(user.Id)}
                    />
                  ))}
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  Showing {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}
                </p>
              </>
            )}
          </div>
        </div>

        {(showForm || userNotFound) && (
          <button
            type="button"
            className="room-def-detail-backdrop"
            aria-label="Close user editor"
            onClick={closeForm}
          />
        )}

        {userNotFound && (
          <div className="room-def-detail-panel items-center justify-center p-8 text-center">
            <p className="text-sm font-medium">User not found</p>
            <button type="button" className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={closeForm}>
              Back to user list
            </button>
          </div>
        )}

        {selected && !userNotFound && (
          <UserForm
            key={`${selected.Id || "new"}-${creating}`}
            user={selected}
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
