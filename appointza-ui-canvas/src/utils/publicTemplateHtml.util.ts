/** Avoid iframe srcDoc reloads when the bound HTML string is unchanged. */
export function nextHtmlIfChanged(previous: string, next: string): string {
  return previous === next ? previous : next;
}
