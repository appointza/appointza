import { getDepartmentLabel, getRoleLabel } from "@/config/userCatalog";
import type { StayUser } from "@/models/stayUser";

interface UserCardProps {
  user: StayUser;
  selected: boolean;
  onSelect: () => void;
}

export function UserCard({ user, selected, onSelect }: UserCardProps) {
  const initial = user.Name.trim() ? user.Name.trim()[0].toUpperCase() : "?";
  const searchText = `${user.Name} ${user.Phone} ${getRoleLabel(user.Role)} ${getDepartmentLabel(user.Department)}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      data-search={searchText}
      className={`room-def-card w-full text-left${selected ? " room-def-card-selected" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-primary-foreground">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-semibold">{user.Name || "Unnamed"}</p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                user.Status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
              }`}
            >
              {user.Status}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{user.Phone || "—"}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {getRoleLabel(user.Role)}
            </span>
            <span className="rounded-lg bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {getDepartmentLabel(user.Department)}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-right text-xs font-medium text-primary">{selected ? "Close" : "Edit"} →</p>
    </button>
  );
}
