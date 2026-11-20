import { describe, expect, it } from "vitest";
import {
  formatAppointzaDate,
  formatAppointzaDateTime,
  formatAppointzaInr,
  formatAppointzaTime,
} from "@/utils/appointzaFormatters";

describe("appointzaFormatters", () => {
  it("formats IST dates as weekday day mon year", () => {
    const formatted = formatAppointzaDate("2026-11-19T12:00:00+05:30");
    expect(formatted).toMatch(/Nov,? 2026/);
    expect(formatted).toMatch(/19/);
  });

  it("converts 24h time strings to 12h", () => {
    expect(formatAppointzaTime("15:00:00")).toMatch(/3:00\s*pm/i);
    expect(formatAppointzaTime("10:00")).toMatch(/10:00\s*am/i);
  });

  it("combines date and time with a middle dot", () => {
    const formatted = formatAppointzaDateTime("2026-11-19T15:00:00+05:30");
    expect(formatted).toContain("·");
    expect(formatted).toMatch(/Nov,? 2026/);
  });

  it("always prefixes rupees for numeric and string amounts", () => {
    expect(formatAppointzaInr(100)).toBe("₹100");
    expect(formatAppointzaInr("200")).toBe("₹200");
    expect(formatAppointzaInr(null)).toBe("₹0");
  });
});
