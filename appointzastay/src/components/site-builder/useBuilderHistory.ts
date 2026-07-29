import { useCallback, useState } from "react";
import type { PageBlock } from "./types";

const MAX_HISTORY = 50;

function cloneBlocks(items: PageBlock[]) {
  return structuredClone(items);
}

export function useBuilderHistory(initial: PageBlock[]) {
  const [past, setPast] = useState<PageBlock[][]>([]);
  const [future, setFuture] = useState<PageBlock[][]>([]);
  const [blocks, setBlocksState] = useState(initial);

  const setBlocks = useCallback((updater: PageBlock[] | ((prev: PageBlock[]) => PageBlock[])) => {
    setBlocksState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next === prev) return prev;
      setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), cloneBlocks(prev)]);
      setFuture([]);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      setBlocksState((current) => {
        setFuture((f) => [...f, cloneBlocks(current)]);
        return previous;
      });
      return p.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[f.length - 1];
      setBlocksState((current) => {
        setPast((p) => [...p, cloneBlocks(current)]);
        return next;
      });
      return f.slice(0, -1);
    });
  }, []);

  return {
    blocks,
    setBlocks,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
