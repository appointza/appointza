import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { stayApi } from "@/services/stay.service";
import { BuilderBlockLibrary } from "./BuilderBlockLibrary";
import { BuilderCanvas } from "./BuilderCanvas";
import { BuilderInspector } from "./BuilderInspector";
import { BuilderTopBar, type TemplateMode, type Viewport } from "./BuilderTopBar";
import { HtmlTemplateEditor } from "./HtmlTemplateEditor";
import { StayBlocksPromptDialog } from "./StayBlocksPromptDialog";
import { DEFAULT_STAY_HTML } from "./defaultStayHtml";
import { createPageBlockFromKind, getKindForType, type BlockKind } from "./blocks";
import { hydrateBlocksWithRooms } from "./hydrateBlocksWithRooms";
import { normalizePageBlocks } from "./normalizePageBlock";
import { useBuilderHistory } from "./useBuilderHistory";
import type { PageBlock, SitePageSettings } from "./types";
import "./builder.css";

interface SiteBuilderAppProps {
  initialBlocks: PageBlock[];
  pageSettings?: SitePageSettings;
  siteName?: string;
  liveRooms?: unknown[];
  onSyncFromOrganisation?: () => Promise<void>;
  initialTemplateMode?: TemplateMode;
  initialCustomHtml?: string;
  initialRenderedHtml?: string;
}

export function SiteBuilderApp({
  initialBlocks,
  pageSettings: initialPageSettings,
  siteName = "Your property",
  liveRooms = [],
  onSyncFromOrganisation,
  initialTemplateMode = "html",
  initialCustomHtml = "",
  initialRenderedHtml = "",
}: SiteBuilderAppProps) {
  const [seed] = useState(() => normalizePageBlocks(initialBlocks));
  const { blocks, setBlocks, undo, redo, canUndo, canRedo } = useBuilderHistory(seed);
  const [selectedId, setSelectedId] = useState<string | null>(seed[0]?.id ?? null);
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [pageSettings, setPageSettings] = useState<SitePageSettings>(initialPageSettings ?? {});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [templateMode, setTemplateMode] = useState<TemplateMode>(initialTemplateMode);
  const [customHtml, setCustomHtml] = useState(
    () => initialCustomHtml.trim() || (initialTemplateMode === "html" ? DEFAULT_STAY_HTML : ""),
  );
  const [renderedHtml, setRenderedHtml] = useState(initialRenderedHtml);
  const [previewingHtml, setPreviewingHtml] = useState(false);

  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) ?? null, [blocks, selectedId]);
  const kindsOnPage = useMemo(() => {
    const set = new Set<BlockKind>();
    for (const b of blocks) {
      const kind = getKindForType(b.type);
      if (kind) set.add(kind);
    }
    return set;
  }, [blocks]);

  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    if (templateMode !== "html") return;
    const source = customHtml.trim() || DEFAULT_STAY_HTML;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPreviewingHtml(true);
      try {
        const rendered = await stayApi.siteBuilder.renderHtmlPreview(source);
        if (!cancelled) setRenderedHtml(rendered || "");
      } catch {
        if (!cancelled) toast.error("Could not refresh HTML preview");
      } finally {
        if (!cancelled) setPreviewingHtml(false);
      }
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [customHtml, templateMode]);

  const addBlock = (kind: BlockKind) => {
    const block = createPageBlockFromKind(kind, siteName);
    setBlocks((prev) => [...prev, block]);
    setSelectedId(block.id);
    markDirty();
  };

  const duplicateBlock = (id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const source = prev[idx];
      const copy: PageBlock = {
        ...structuredClone(source),
        id: crypto.randomUUID(),
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    markDirty();
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
    markDirty();
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
    markDirty();
  };

  const updateSelectedProp = (key: string, value: unknown) => {
    if (!selected) return;
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === selected.id ? { ...b, props: { ...b.props, [key]: value } } : b,
      ),
    );
    markDirty();
  };

  const updateSelectedLayout = (patch: Partial<NonNullable<PageBlock["layout"]>>) => {
    if (!selected) return;
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === selected.id
          ? {
              ...b,
              layout: {
                width: b.layout?.width ?? 100,
                height: b.layout?.height ?? "auto",
                padding: { top: 80, right: 40, bottom: 80, left: 40, ...b.layout?.padding, ...patch.padding },
                margin: { top: 0, right: 0, bottom: 0, left: 0, ...b.layout?.margin, ...patch.margin },
                ...patch,
              },
            }
          : b,
      ),
    );
    markDirty();
  };

  const [syncing, setSyncing] = useState(false);

  const syncFromOrganisation = async () => {
    if (!onSyncFromOrganisation) return;
    setSyncing(true);
    try {
      await onSyncFromOrganisation();
      toast.success("Synced from organisation profile");
    } catch {
      toast.error("Could not sync from organisation");
    } finally {
      setSyncing(false);
    }
  };

  const publish = async () => {
    setSaving(true);
    try {
      await stayApi.siteBuilder.saveBlocks({
        blocks,
        settings: pageSettings,
        profileSync: { syncFromOrganisation: true },
        templateMode,
        customHtml,
      });
      setDirty(false);
      toast.success("Website published");
    } catch {
      toast.error("Could not save website");
    } finally {
      setSaving(false);
    }
  };

  const previewBlocks = useMemo(
    () => hydrateBlocksWithRooms(blocks, liveRooms),
    [blocks, liveRooms],
  );

  return (
    <div className="site-builder-root">
      <BuilderTopBar
        siteName={siteName}
        viewport={viewport}
        onViewportChange={setViewport}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onPublish={publish}
        onSyncFromOrganisation={onSyncFromOrganisation ? syncFromOrganisation : undefined}
        syncing={syncing}
        saving={saving}
        dirty={dirty}
        templateMode={templateMode}
        onTemplateModeChange={(mode) => {
          setTemplateMode(mode);
          if (mode === "html" && !customHtml.trim()) {
            setCustomHtml(DEFAULT_STAY_HTML);
          }
          markDirty();
        }}
      />

      {templateMode === "html" ? (
        <HtmlTemplateEditor
          propertyName={siteName}
          html={customHtml}
          renderedHtml={renderedHtml}
          previewing={previewingHtml}
          onChange={(value) => {
            setCustomHtml(value);
            markDirty();
          }}
          onResetDefault={() => {
            setCustomHtml(DEFAULT_STAY_HTML);
            markDirty();
            toast.success("Restored default elegant template");
          }}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-white px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Drag sections from the library, or generate a full page with Blocks AI.
            </p>
            <StayBlocksPromptDialog
              propertyName={siteName}
              onApplyBlocks={(next) => {
                setBlocks(next);
                setSelectedId(next[0]?.id ?? null);
                markDirty();
                toast.success("Blocks applied from AI");
              }}
            />
          </div>
          <div className="flex min-h-0 flex-1">
            <BuilderBlockLibrary onAddBlock={addBlock} kindsOnPage={kindsOnPage} />

            <BuilderCanvas
              blocks={previewBlocks}
              pageSettings={pageSettings}
              viewport={viewport}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDuplicate={duplicateBlock}
              onRemove={removeBlock}
              onMove={moveBlock}
            />

            <BuilderInspector
              block={selected}
              pageSettings={pageSettings}
              onUpdateProp={updateSelectedProp}
              onUpdateLayout={updateSelectedLayout}
              onUpdatePageSettings={(patch) => {
                setPageSettings((p) => ({ ...p, ...patch }));
                markDirty();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
