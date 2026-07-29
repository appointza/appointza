import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { DeviceIcon } from "./DeviceIcons";

export type Viewport = "desktop" | "tablet" | "mobile";
export type TemplateMode = "blocks" | "html";

interface BuilderTopBarProps {
  siteName: string;
  viewport: Viewport;
  onViewportChange: (v: Viewport) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPublish: () => void;
  onSyncFromOrganisation?: () => void;
  syncing?: boolean;
  saving: boolean;
  dirty: boolean;
  templateMode: TemplateMode;
  onTemplateModeChange: (mode: TemplateMode) => void;
}

export function BuilderTopBar({
  siteName,
  viewport,
  onViewportChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPublish,
  onSyncFromOrganisation,
  syncing = false,
  saving,
  dirty,
  templateMode,
  onTemplateModeChange,
}: BuilderTopBarProps) {
  const devices: { id: Viewport; label: string }[] = [
    { id: "desktop", label: "Desktop" },
    { id: "tablet", label: "Tablet" },
    { id: "mobile", label: "Mobile" },
  ];

  const projectSlug = siteName.replace(/\s+/g, "_").toUpperCase() || "UNTITLED_SITE";

  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-[#e5e7eb] bg-white px-3 py-2 pl-14 lg:pl-5 md:h-12 md:flex-nowrap md:gap-0">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="struct-logo hidden sm:block">STRUCT.</span>
        <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium tracking-wide">
          <span className="shrink-0 uppercase tracking-wider text-[#9ca3af]">Project</span>
          <span className="text-[#9ca3af]">/</span>
          <span className="truncate font-bold uppercase tracking-wider text-black">{projectSlug}</span>
        </div>
        <div className="flex items-center gap-0.5 text-[#9ca3af]">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="min-h-[32px] min-w-[32px] rounded px-2 text-sm hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-35"
            title="Undo"
          >
            ↶
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="min-h-[32px] min-w-[32px] rounded px-2 text-sm hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-35"
            title="Redo"
          >
            ↷
          </button>
        </div>
      </div>

      <div className="mr-2 flex shrink-0 items-center rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] p-0.5">
        {(["blocks", "html"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onTemplateModeChange(mode)}
            className={`min-h-[32px] rounded-md px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
              templateMode === mode
                ? "bg-white text-black shadow-sm"
                : "text-[#6b7280] hover:text-black"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] p-0.5">
        {templateMode === "blocks"
          ? devices.map((device) => (
          <button
            key={device.id}
            type="button"
            onClick={() => onViewportChange(device.id)}
            className={`flex min-h-[32px] items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition sm:px-3 ${
              viewport === device.id
                ? "bg-white text-black shadow-sm"
                : "text-[#6b7280] hover:text-black"
            }`}
          >
            <DeviceIcon type={device.id} />
            <span className="hidden sm:inline">{device.label}</span>
          </button>
        ))
          : null}
      </div>

      <div className="flex flex-1 items-center justify-end gap-2">
        {onSyncFromOrganisation ? (
          <button
            type="button"
            disabled={syncing || saving}
            onClick={onSyncFromOrganisation}
            className="min-h-[32px] hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-[#f9fafb] disabled:opacity-60"
            title="Pull latest organisation profile into website blocks"
          >
            {syncing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Sync profile
          </button>
        ) : null}
        <Link
          to="/property"
          target="_blank"
          className="min-h-[32px] inline-flex items-center rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-[#f9fafb]"
        >
          Preview
        </Link>
        <button
          type="button"
          disabled={saving || !dirty}
          onClick={onPublish}
          className="min-h-[32px] inline-flex items-center gap-1.5 rounded-md bg-[#6366f1] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#4f46e5] disabled:opacity-60"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? "Saving…" : "Publish"}
        </button>
      </div>
    </header>
  );
}
