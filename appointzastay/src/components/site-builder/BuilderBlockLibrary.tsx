import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { BlockKind } from "./blocks";
import { CATEGORY_ORDER, getCatalogByCategory } from "./blocks";

interface BuilderBlockLibraryProps {
  onAddBlock: (kind: BlockKind) => void;
  kindsOnPage: Set<BlockKind>;
}

export function BuilderBlockLibrary({ onAddBlock, kindsOnPage }: BuilderBlockLibraryProps) {
  const [query, setQuery] = useState("");
  const catalog = useMemo(() => getCatalogByCategory(), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.kind.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [catalog, query]);

  return (
    <aside className="flex h-full w-full flex-col border-r border-[#e5e7eb] bg-white md:w-72 md:shrink-0">
      <div className="border-b border-[#e5e7eb] px-4 py-4">
        <span className="struct-logo block mb-3">STRUCT.</span>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ca3af]" />
          <input
            type="search"
            placeholder="Search blocks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="struct-input pl-8 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {filtered.map((group) => (
          <section key={group.id} className="mb-6">
            <h2 className="struct-section-title mb-3 px-1">
              {String(group.order).padStart(2, "0")} / {group.label}
            </h2>
            <ul className="space-y-1.5 border-l border-[#e5e7eb] pl-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                const onPage = kindsOnPage.has(item.kind);
                return (
                  <li key={item.kind}>
                    <button
                      type="button"
                      onClick={() => onAddBlock(item.kind)}
                      className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left transition ${
                        onPage
                          ? "border-[#6366f1]/30 bg-[#6366f1]/5 hover:border-[#6366f1]/50"
                          : "border-transparent bg-[#f3f4f6] hover:border-[#e5e7eb] hover:bg-[#eceef1]"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[#6366f1] shadow-sm">
                        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-[#111827]">{item.label}</span>
                        <span className="text-[10px] text-[#9ca3af]">
                          {onPage ? "On page · click to add another" : "Click to add"}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="shrink-0 border-t border-[#e5e7eb] p-3">
        <p className="text-[10px] leading-relaxed text-[#9ca3af]">
          {CATEGORY_ORDER.length} categories · {filtered.reduce((n, g) => n + g.items.length, 0)} blocks shown
        </p>
      </div>
    </aside>
  );
}
