import { useEffect, useState } from "react";

/**
 * Only keep a heavy dialog mounted while it is actually open. This avoids
 * paying the full subtree mount cost for dialogs that are closed most of the time.
 */
export function useMountWhenOpened(open: boolean): boolean {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    setMounted(open);
  }, [open]);

  return mounted;
}
