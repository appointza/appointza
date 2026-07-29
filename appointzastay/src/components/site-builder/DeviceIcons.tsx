type Device = "desktop" | "tablet" | "mobile";

export function DeviceIcon({ type }: { type: Device }) {
  if (type === "mobile") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18.01" />
      </svg>
    );
  }
  if (type === "tablet") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <line x1="12" y1="17" x2="12" y2="17.01" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <line x1="8" y1="20" x2="16" y2="20" />
      <line x1="12" y1="18" x2="12" y2="20" />
    </svg>
  );
}
