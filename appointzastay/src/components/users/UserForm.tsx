import { useEffect, useState } from "react";
import {
  MVP_ROLES,
  USER_DEPARTMENTS,
  USER_PERMISSIONS,
  USER_STATUSES,
  getRoleDescription,
  getRoleLabel,
} from "@/config/userCatalog";
import type { StayUser } from "@/models/stayUser";
import { userPermissionKeys } from "@/models/stayUser";
import { stayApi } from "@/services/stay.service";
import { useToast } from "@/hooks/use-toast";

interface UserFormProps {
  user: StayUser;
  onCancel: () => void;
  onSaved: (id: string) => void;
  onDeleted: () => void;
}

export function UserForm({ user: initial, onCancel, onSaved, onDeleted }: UserFormProps) {
  const { toast } = useToast();
  const [user, setUser] = useState(initial);
  const [permissionKeys, setPermissionKeys] = useState<string[]>(() => userPermissionKeys(initial));
  const [saving, setSaving] = useState(false);

  const isNew = !user.Id;

  useEffect(() => {
    setUser(initial);
    setPermissionKeys(userPermissionKeys(initial));
  }, [initial]);

  const togglePermission = (key: string) => {
    setPermissionKeys((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));
  };

  const handleRoleChange = async (role: string) => {
    setUser((u) => ({ ...u, Role: role }));
    try {
      const data = await stayApi.users.roleDefaults(role);
      setUser((u) => ({ ...u, Role: role, Department: data.department }));
      setPermissionKeys(data.permissions);
    } catch {
      // keep manual selections on failure
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.Name.trim() || !user.Phone.trim()) {
      toast({ title: "Name and phone are required", variant: "destructive" });
      return;
    }
    if (isNew && !user.Password.trim()) {
      toast({ title: "Password is required for new users", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...user };
      if (!isNew && !payload.Password.trim()) {
        payload.Password = "";
      }
      const saved = await stayApi.users.save(payload, permissionKeys);
      toast({ title: isNew ? "User created" : "User saved" });
      onSaved(saved.Id);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: msg || "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user.Id || !confirm("Delete this user?")) return;
    setSaving(true);
    try {
      await stayApi.users.delete(user.Id);
      toast({ title: "User deleted" });
      onDeleted();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const title = isNew ? "New user" : user.Name;

  return (
    <aside className="room-def-detail-panel flex flex-col">
      <form onSubmit={handleSave} className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 pt-2 pb-0 flex justify-center md:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-muted-foreground/25" />
        </div>
        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <button type="button" onClick={onCancel} className="text-sm font-medium text-primary">
            ← Back
          </button>
          <span className="truncate text-sm font-semibold">{title}</span>
        </div>

        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold">{title}</h2>
            <p className="text-[10px] text-muted-foreground">{isNew ? "Create staff account" : "Edit user"}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 detail-panel-sections-2col">
          <div className="room-def-form-section detail-panel-col-span-2">
            <p className="room-def-section-title">Account</p>
            <div className="detail-panel-fields-2">
              <div>
                <label className="room-def-label">Name *</label>
                <input
                  className="room-def-input"
                  value={user.Name}
                  onChange={(e) => setUser((u) => ({ ...u, Name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="room-def-label">Phone *</label>
                <input
                  className="room-def-input"
                  value={user.Phone}
                  onChange={(e) => setUser((u) => ({ ...u, Phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="room-def-label">Email</label>
                <input
                  type="email"
                  className="room-def-input"
                  value={user.Email}
                  onChange={(e) => setUser((u) => ({ ...u, Email: e.target.value }))}
                />
              </div>
              <div>
                <label className="room-def-label">Password {isNew ? "*" : ""}</label>
                <input
                  type="password"
                  className="room-def-input"
                  value={user.Password}
                  onChange={(e) => setUser((u) => ({ ...u, Password: e.target.value }))}
                  required={isNew}
                  placeholder={isNew ? "Set password" : "Leave blank to keep current"}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <div className="room-def-form-section">
            <p className="room-def-section-title">Role & department</p>
            <div className="detail-panel-fields-2">
              <div className="detail-panel-col-span-2">
                <label className="room-def-label">Role *</label>
                <select
                  className="room-def-input"
                  value={user.Role}
                  onChange={(e) => void handleRoleChange(e.target.value)}
                >
                  {MVP_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {getRoleDescription(user.Role) || getRoleLabel(user.Role)}
                </p>
              </div>
              <div>
                <label className="room-def-label">Department</label>
                <select
                  className="room-def-input"
                  value={user.Department}
                  onChange={(e) => setUser((u) => ({ ...u, Department: e.target.value }))}
                >
                  {USER_DEPARTMENTS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="room-def-label">Status</label>
                <select
                  className="room-def-input"
                  value={user.Status}
                  onChange={(e) => setUser((u) => ({ ...u, Status: e.target.value }))}
                >
                  {USER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="room-def-form-section detail-panel-col-span-2">
            <p className="room-def-section-title">Permissions</p>
            <div className="detail-panel-fields-2">
              {USER_PERMISSIONS.map((p) => (
                <label
                  key={p.key}
                  className="flex cursor-pointer items-center gap-2 rounded border border-border px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={permissionKeys.includes(p.key)}
                    onChange={() => togglePermission(p.key)}
                  />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t border-border bg-background p-4">
          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
              disabled={saving}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="ml-auto rounded-lg border border-border px-3 py-2 text-xs font-medium"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save user"}
          </button>
        </div>
      </form>
    </aside>
  );
}
