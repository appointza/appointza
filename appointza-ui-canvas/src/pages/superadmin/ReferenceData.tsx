import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { REFERENCETYPE } from "@/models/users.model";
import {
  superAdminService,
  superAdminErrorMessage,
  type ReferenceTypeItem,
  type ReferenceValueItem,
} from "@/services/superAdmin.service";
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
import { cn } from "@/lib/utils";

const emptyForm = {
  id: 0,
  identifier: "",
  displaytext: "",
  description: "",
  notes: "",
  parentid: 0,
  version: 0,
};

function isPrimaryType(t: ReferenceTypeItem | undefined) {
  if (!t) return false;
  return (
    t.id === REFERENCETYPE.ORGANISATIONPRIMARYTYPE ||
    (t.identifier || "").toUpperCase() === "ORGANISATIONPRIMARYTYPE"
  );
}

function isSecondaryType(t: ReferenceTypeItem | undefined) {
  if (!t) return false;
  return (
    t.id === REFERENCETYPE.ORGANISATIONSECONDARYTYPE ||
    (t.identifier || "").toUpperCase() === "ORGANISATIONSECONDARYTYPE"
  );
}

function slugifyIdentifier(text: string) {
  return text
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export default function SuperAdminReferenceData() {
  const { toast } = useToast();
  const [types, setTypes] = useState<ReferenceTypeItem[] | null>(null);
  const [typeId, setTypeId] = useState<number>(0);
  const [values, setValues] = useState<ReferenceValueItem[]>([]);
  const [primaryValues, setPrimaryValues] = useState<ReferenceValueItem[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterPrimaryId, setFilterPrimaryId] = useState(0);
  const [typeQuery, setTypeQuery] = useState("");
  const [valueQuery, setValueQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const selectedType = useMemo(() => types?.find((t) => t.id === typeId), [types, typeId]);
  const secondaryMode = isSecondaryType(selectedType);
  const primaryMode = isPrimaryType(selectedType);
  const editing = form.id > 0;

  const primaryById = useMemo(() => {
    const map = new Map<number, ReferenceValueItem>();
    for (const p of primaryValues) map.set(p.id, p);
    return map;
  }, [primaryValues]);

  const filteredTypes = useMemo(() => {
    const q = typeQuery.trim().toLowerCase();
    if (!q) return types ?? [];
    return (types ?? []).filter(
      (t) =>
        (t.displaytext || "").toLowerCase().includes(q) ||
        (t.identifier || "").toLowerCase().includes(q),
    );
  }, [types, typeQuery]);

  const visibleValues = useMemo(() => {
    let rows = values;
    if (secondaryMode && filterPrimaryId > 0) {
      rows = rows.filter((v) => Number(v.parentid || 0) === filterPrimaryId);
    }
    const q = valueQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (v) =>
          (v.displaytext || "").toLowerCase().includes(q) ||
          (v.identifier || "").toLowerCase().includes(q) ||
          (v.description || "").toLowerCase().includes(q),
      );
    }
    return rows;
  }, [values, secondaryMode, filterPrimaryId, valueQuery]);

  const loadTypes = useCallback(async () => {
    setError("");
    try {
      const t = await superAdminService.listReferenceTypes();
      setTypes(t);
      setTypeId((cur) => cur || t[0]?.id || 0);
    } catch (e) {
      setError(superAdminErrorMessage(e, "Could not load reference types"));
    }
  }, []);

  const loadPrimaryValues = useCallback(async () => {
    try {
      const rows = await superAdminService.listReferenceValues(REFERENCETYPE.ORGANISATIONPRIMARYTYPE);
      setPrimaryValues((rows || []).filter((r) => r.isactive !== false));
    } catch {
      setPrimaryValues([]);
    }
  }, []);

  const loadValues = useCallback(async (id: number) => {
    if (!id) {
      setValues([]);
      return;
    }
    setLoadingValues(true);
    try {
      setValues(await superAdminService.listReferenceValues(id));
    } catch (e) {
      setError(superAdminErrorMessage(e, "Could not load reference values"));
    } finally {
      setLoadingValues(false);
    }
  }, []);

  useEffect(() => {
    void loadTypes();
    void loadPrimaryValues();
  }, [loadTypes, loadPrimaryValues]);

  useEffect(() => {
    void loadValues(typeId);
    setForm(emptyForm);
    setFilterPrimaryId(0);
    setValueQuery("");
    setFormOpen(false);
  }, [typeId, loadValues]);

  const openAdd = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (v: ReferenceValueItem) => {
    setForm({
      id: v.id,
      identifier: v.identifier,
      displaytext: v.displaytext,
      description: v.description ?? "",
      notes: v.notes ?? "",
      parentid: Number(v.parentid || 0),
      version: v.version ?? 0,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setForm(emptyForm);
    setFormOpen(false);
  };

  const saveValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeId) return;

    const parentid = primaryMode ? 0 : Number(form.parentid) || 0;
    if (secondaryMode && parentid <= 0) {
      toast({
        title: "Primary type required",
        description: "Secondary types must be linked to a primary organisation type.",
        variant: "destructive",
      });
      return;
    }

    const identifier = form.identifier.trim() || slugifyIdentifier(form.displaytext);
    if (!identifier || !form.displaytext.trim()) {
      toast({ title: "Identifier and display text are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await superAdminService.saveReferenceValue({
        id: form.id,
        identifier,
        displaytext: form.displaytext.trim(),
        description: form.description.trim(),
        notes: form.notes.trim() || "",
        parentid,
        version: form.version,
        referencetypeid: typeId,
      });
      toast({ title: form.id ? "Value updated" : "Value added" });
      closeForm();
      await loadValues(typeId);
      if (primaryMode) await loadPrimaryValues();
    } catch (err) {
      toast({ title: "Could not save", description: superAdminErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const removeValue = async (v: ReferenceValueItem) => {
    if (!window.confirm(`Delete "${v.displaytext}"?`)) return;
    try {
      const ok = await superAdminService.deleteReferenceValue(v.id, v.version ?? 0);
      toast({ title: ok ? "Value deleted" : "Nothing deleted (factory values are protected)" });
      if (form.id === v.id) closeForm();
      await loadValues(typeId);
      if (primaryMode) await loadPrimaryValues();
    } catch (err) {
      toast({ title: "Could not delete", description: superAdminErrorMessage(err), variant: "destructive" });
    }
  };

  if (error && !types) return <ErrorBox message={error} onRetry={loadTypes} />;
  if (!types) return <Spinner />;

  return (
    <div className="flex min-h-0 flex-col">
      <PageHeader
        title="Reference data"
        subtitle="Pick a type on the left, then add values only. Types are fixed."
        actions={
          <Button type="button" className="h-9" disabled={!typeId} onClick={openAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add value
          </Button>
        }
      />

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Types */}
        <Card className="flex max-h-[calc(100dvh-10rem)] flex-col overflow-hidden p-0 lg:sticky lg:top-2">
          <div className="border-b border-[#eef1f5] px-3 py-2.5">
            <p className="text-[13px] font-semibold text-[#1a1a1a]">Types</p>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98a2b3]" />
              <Input
                value={typeQuery}
                onChange={(e) => setTypeQuery(e.target.value)}
                placeholder="Search types…"
                className="h-8 border-[#e6eaf0] pl-7 text-[13px] shadow-none"
              />
            </div>
            {/* Mobile type picker */}
            <div className="mt-2 lg:hidden">
              <select
                className={`${selectCls} w-full`}
                value={typeId}
                onChange={(e) => setTypeId(Number(e.target.value) || 0)}
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.displaytext || t.identifier}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ul className="hidden min-h-0 flex-1 overflow-y-auto p-1.5 lg:block">
            {filteredTypes.map((t) => {
              const active = t.id === typeId;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setTypeId(t.id)}
                    className={cn(
                      "w-full rounded-md px-2.5 py-2 text-left transition-colors",
                      active
                        ? "bg-[#eef2ff] text-[#1a1a1a]"
                        : "text-[#344054] hover:bg-[#f4f6f9]",
                    )}
                  >
                    <span className="block text-[13px] font-medium leading-snug">
                      {t.displaytext || t.identifier}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-[#98a2b3]">
                      {t.identifier}
                    </span>
                  </button>
                </li>
              );
            })}
            {filteredTypes.length === 0 ? (
              <li className="px-2 py-4 text-center text-[12px] text-[#98a2b3]">No types match</li>
            ) : null}
          </ul>
        </Card>

        {/* Values + form */}
        <div className="min-w-0 space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef1f5] px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-semibold text-[#1a1a1a]">
                  {selectedType?.displaytext || selectedType?.identifier || "Values"}
                </h2>
                <p className="mt-0.5 font-mono text-[11px] text-[#98a2b3]">
                  {selectedType?.identifier}
                  {selectedType ? ` · id ${selectedType.id}` : ""}
                  {" · "}
                  {visibleValues.length}
                  {visibleValues.length !== values.length ? ` of ${values.length}` : ""} values
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {secondaryMode ? (
                  <select
                    className={`${selectCls} h-8 min-w-[10rem] text-[12px]`}
                    value={filterPrimaryId}
                    onChange={(e) => setFilterPrimaryId(Number(e.target.value) || 0)}
                  >
                    <option value={0}>All primary types</option>
                    {primaryValues.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displaytext || p.identifier}
                      </option>
                    ))}
                  </select>
                ) : null}
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#98a2b3]" />
                  <Input
                    value={valueQuery}
                    onChange={(e) => setValueQuery(e.target.value)}
                    placeholder="Search values…"
                    className="h-8 w-[11rem] border-[#e6eaf0] pl-7 text-[12px] shadow-none sm:w-[14rem]"
                  />
                </div>
              </div>
            </div>

            {loadingValues ? (
              <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-[#667085]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading values…
              </div>
            ) : visibleValues.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-[13px] font-medium text-[#1a1a1a]">No values yet</p>
                <p className="mt-1 text-[12px] text-[#667085]">
                  {valueQuery || filterPrimaryId
                    ? "Try clearing search or filters."
                    : "Add the first lookup value for this type."}
                </p>
                {!valueQuery && !filterPrimaryId ? (
                  <Button type="button" className="mt-4 h-9" onClick={openAdd}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add value
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className={tableCls}>
                  <thead>
                    <tr className="bg-[#fafbfc]">
                      <th className={thCls}>Display</th>
                      <th className={thCls}>Identifier</th>
                      {secondaryMode ? <th className={thCls}>Primary</th> : null}
                      <th className={thCls}>Description</th>
                      <th className={thCls}>Scope</th>
                      <th className={cn(thCls, "w-28 text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleValues.map((v) => {
                      const parent = secondaryMode
                        ? primaryById.get(Number(v.parentid || 0))
                        : undefined;
                      const selected = form.id === v.id;
                      return (
                        <tr
                          key={v.id}
                          className={cn(
                            "transition-colors",
                            selected ? "bg-[#eef2ff]" : "hover:bg-[#fafbfc]",
                          )}
                        >
                          <td className={tdCls}>
                            <span className="font-medium">{v.displaytext}</span>
                          </td>
                          <td className={cn(tdCls, "font-mono text-[12px] text-[#5b6572]")}>
                            {v.identifier}
                          </td>
                          {secondaryMode ? (
                            <td className={tdCls}>
                              {parent ? (
                                <span className="text-[13px]">
                                  {parent.displaytext}{" "}
                                  <span className="text-[#98a2b3]">#{parent.id}</span>
                                </span>
                              ) : Number(v.parentid || 0) > 0 ? (
                                <span className="text-[12px] text-amber-700">
                                  Missing #{v.parentid}
                                </span>
                              ) : (
                                <span className="text-[12px] text-rose-600">Unlinked</span>
                              )}
                            </td>
                          ) : null}
                          <td className={cn(tdCls, "max-w-[14rem] truncate text-[#5b6572]")}>
                            {v.description || "—"}
                          </td>
                          <td className={tdCls}>
                            {v.isfactory ? (
                              <Pill tone="blue">Factory</Pill>
                            ) : (
                              <Pill tone="gray">Custom</Pill>
                            )}
                          </td>
                          <td className={tdCls}>
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                aria-label={`Edit ${v.displaytext}`}
                                onClick={() => openEdit(v)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {!v.isfactory ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                                  aria-label={`Delete ${v.displaytext}`}
                                  onClick={() => void removeValue(v)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {formOpen ? (
            <Card className="border-[#c7d7ff] shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[14px] font-semibold text-[#1a1a1a]">
                  {editing
                    ? "Edit value"
                    : secondaryMode
                      ? "Add secondary value"
                      : "Add value"}
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Close form"
                  onClick={closeForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={(e) => void saveValue(e)} className="grid gap-3 sm:grid-cols-2">
                {secondaryMode ? (
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-[#5b6572]">Primary type (required)</Label>
                    <select
                      className={`${selectCls} mt-1 w-full`}
                      value={form.parentid || 0}
                      onChange={(e) =>
                        setForm({ ...form, parentid: Number(e.target.value) || 0 })
                      }
                      required
                    >
                      <option value={0}>Select primary organisation type…</option>
                      {primaryValues.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displaytext || p.identifier} (#{p.id})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {!primaryMode && !secondaryMode ? (
                  <div>
                    <Label className="text-xs text-[#5b6572]">Parent id (optional)</Label>
                    <Input
                      type="number"
                      className="mt-1"
                      placeholder="0 = none"
                      value={form.parentid}
                      onChange={(e) =>
                        setForm({ ...form, parentid: Number(e.target.value) || 0 })
                      }
                    />
                  </div>
                ) : null}

                <div>
                  <Label className="text-xs text-[#5b6572]">Display text</Label>
                  <Input
                    className="mt-1"
                    placeholder="e.g. Salon"
                    value={form.displaytext}
                    onChange={(e) => {
                      const displaytext = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        displaytext,
                        identifier:
                          prev.id > 0 ||
                          (prev.identifier &&
                            prev.identifier !== slugifyIdentifier(prev.displaytext))
                            ? prev.identifier
                            : slugifyIdentifier(displaytext),
                      }));
                    }}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#5b6572]">Identifier</Label>
                  <Input
                    className="mt-1 font-mono text-[13px]"
                    placeholder="e.g. SALON"
                    value={form.identifier}
                    onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#5b6572]">Description</Label>
                  <Input
                    className="mt-1"
                    placeholder="Optional"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#5b6572]">Notes</Label>
                  <Input
                    className="mt-1"
                    placeholder="Optional"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={saving || !typeId || (secondaryMode && !form.parentid)}
                  >
                    {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                    {editing ? "Save changes" : "Add value"}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
