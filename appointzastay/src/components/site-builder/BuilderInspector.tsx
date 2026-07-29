import { useState } from "react";
import { getBlockDefForType, getKindForType } from "./blocks";
import {
  getConfigFieldsForKind,
  getContentFieldsForKind,
  STYLE_FIELDS,
  type BlockFieldDef,
} from "./fieldDefinitions";
import type { PageBlock } from "./types";

type InspectorTab = "content" | "style" | "config";

interface BuilderInspectorProps {
  block: PageBlock | null;
  pageSettings: { backgroundColor?: string; backgroundImage?: string; textColor?: string };
  onUpdateProp: (key: string, value: unknown) => void;
  onUpdateLayout: (patch: Partial<NonNullable<PageBlock["layout"]>>) => void;
  onUpdatePageSettings: (patch: Partial<typeof pageSettings>) => void;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: BlockFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-[#e5e7eb]"
        />
        <span className="text-xs text-[#374151]">{field.label}</span>
      </label>
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <select
        value={String(value ?? field.options[0]?.value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="struct-input"
      >
        {field.options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  }

  if (field.type === "color") {
    return (
      <div className="flex gap-2">
        <input
          type="color"
          value={String(value || "#ffffff")}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-[#e5e7eb] bg-white p-0.5"
        />
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="struct-input flex-1 font-mono text-xs"
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="struct-input struct-textarea"
        rows={4}
      />
    );
  }

  return (
    <input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      className="struct-input"
    />
  );
}

function SpacingControls({
  label,
  values,
  onChange,
}: {
  label: string;
  values: { top: number; right: number; bottom: number; left: number };
  onChange: (side: "top" | "right" | "bottom" | "left", value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="struct-field-label">{label}</p>
      <div className="grid grid-cols-4 gap-1.5">
        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <label key={side} className="block space-y-1">
            <span className="text-[9px] uppercase text-[#9ca3af]">{side[0]}</span>
            <input
              type="number"
              value={values[side]}
              onChange={(e) => onChange(side, Number(e.target.value))}
              className="struct-input px-1.5 text-center text-xs"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <p className="text-xs font-semibold text-black">No block selected</p>
      <p className="mt-2 max-w-[220px] text-[10px] leading-relaxed text-[#9ca3af]">
        Click a block on the canvas or add one from the library to edit content, style, and spacing.
      </p>
    </div>
  );
}

export function BuilderInspector({
  block,
  pageSettings,
  onUpdateProp,
  onUpdateLayout,
  onUpdatePageSettings,
}: BuilderInspectorProps) {
  const [tab, setTab] = useState<InspectorTab>("content");

  const tabs: { id: InspectorTab; label: string }[] = [
    { id: "content", label: "Content" },
    { id: "style", label: "Style" },
    { id: "config", label: "Config" },
  ];

  if (!block) {
    return (
      <aside className="hidden lg:flex h-full w-80 shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
        <div className="border-b border-[#e5e7eb] px-4 py-4">
          <p className="text-xs font-semibold text-black">Page settings</p>
          <p className="mt-1 text-[10px] text-[#9ca3af]">Background for the whole site preview.</p>
        </div>
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div>
            <label className="struct-field-label">Background color</label>
            <FieldInput
              field={{ key: "backgroundColor", label: "Background", type: "color" }}
              value={pageSettings.backgroundColor ?? "#FAF8F3"}
              onChange={(v) => onUpdatePageSettings({ backgroundColor: String(v) })}
            />
          </div>
          <div>
            <label className="struct-field-label">Text color</label>
            <FieldInput
              field={{ key: "textColor", label: "Text", type: "color" }}
              value={pageSettings.textColor ?? "#1F2937"}
              onChange={(v) => onUpdatePageSettings({ textColor: String(v) })}
            />
          </div>
          <p className="text-[10px] text-[#9ca3af] leading-relaxed pt-4">
            Select a block on the canvas to edit its content, style, and spacing.
          </p>
        </div>
      </aside>
    );
  }

  const def = getBlockDefForType(block.type);
  const kind = getKindForType(block.type);
  const contentFields = kind ? getContentFieldsForKind(kind) : [];
  const configFields = kind ? getConfigFieldsForKind(kind) : [];
  const padding = {
    top: block.layout?.padding?.top ?? 80,
    right: block.layout?.padding?.right ?? 40,
    bottom: block.layout?.padding?.bottom ?? 80,
    left: block.layout?.padding?.left ?? 40,
  };

  const seenKeys = new Set<string>();
  const uniqueContentFields = contentFields.filter((f) => {
    if (seenKeys.has(f.key)) return false;
    seenKeys.add(f.key);
    return true;
  });

  return (
    <aside className="hidden lg:flex h-full w-80 shrink-0 flex-col border-l border-[#e5e7eb] bg-white">
      <div className="flex shrink-0 border-b border-[#e5e7eb] bg-[#f9fafb] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 min-h-[40px] rounded-md px-2 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
              tab === t.id
                ? "bg-white text-[#111827] shadow-sm"
                : "text-[#6b7280] hover:text-[#111827]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="border-b border-[#e5e7eb] bg-white px-4 py-4">
        <p className="text-xs font-semibold text-black">{def?.label ?? block.type}</p>
        <p className="mt-1 font-mono text-[10px] text-[#9ca3af] truncate">{block.id}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {tab === "content" && (
          <>
            {uniqueContentFields.map((field) => (
              <div key={field.key}>
                <label className="struct-field-label">{field.label}</label>
                <FieldInput
                  field={field}
                  value={block.props[field.key]}
                  onChange={(v) => onUpdateProp(field.key, v)}
                />
              </div>
            ))}
            <p className="text-[10px] text-[#9ca3af] leading-relaxed pt-2 border-t border-[#e5e7eb]">
              {kind === "hotelAllRooms"
                ? "Room cards load live from Staff → Rooms (name, photo, price, status)."
                : "Lists (rooms, amenities, reviews) sync from your organisation profile."}
            </p>
          </>
        )}

        {tab === "style" && (
          <>
            {STYLE_FIELDS.map((field) => (
              <div key={field.key}>
                <label className="struct-field-label">{field.label}</label>
                <FieldInput
                  field={field}
                  value={block.props[field.key]}
                  onChange={(v) => onUpdateProp(field.key, v)}
                />
              </div>
            ))}
            {STYLE_FIELDS.length === 0 && (
              <p className="text-xs text-[#9ca3af]">No style overrides for this block.</p>
            )}
          </>
        )}

        {tab === "config" && (
          <>
            {configFields.length > 0 ? (
              configFields.map((field) => (
                <div key={field.key}>
                  {field.type === "boolean" ? (
                    <FieldInput
                      field={field}
                      value={block.props[field.key]}
                      onChange={(v) => onUpdateProp(field.key, v)}
                    />
                  ) : (
                    <>
                      <label className="struct-field-label">{field.label}</label>
                      <FieldInput
                        field={field}
                        value={block.props[field.key]}
                        onChange={(v) => onUpdateProp(field.key, v)}
                      />
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-[#9ca3af]">No config options for this block type.</p>
            )}
          </>
        )}
      </div>

      <div className="shrink-0 space-y-4 border-t border-[#e5e7eb] bg-white p-4">
        <h3 className="struct-section-title">Layout &amp; spacing</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="struct-field-label">Width</label>
            <div className="struct-input flex items-center text-xs text-[#6b7280]">W 100%</div>
          </div>
          <div>
            <label className="struct-field-label">Height</label>
            <div className="struct-input flex items-center text-xs text-[#6b7280]">H Auto</div>
          </div>
        </div>
        <SpacingControls
          label="Padding"
          values={padding}
          onChange={(side, value) =>
            onUpdateLayout({
              padding: { ...padding, [side]: value },
            })
          }
        />
      </div>
    </aside>
  );
}
