import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const appSource = readFileSync(resolve(process.cwd(), "src/App.tsx"), "utf8");

describe("Production organization routes", () => {
  it("redirects legacy /organization/bookings and /organization/customers to real pages", () => {
    expect(appSource).toContain(
      '<Route path="bookings" element={<Navigate to="/organization/appointments" replace />} />',
    );
    expect(appSource).toContain(
      '<Route path="customers" element={<Navigate to="/organization/clients" replace />} />',
    );
  });

  it("renders NotFound for unknown organization and top-level routes", () => {
    const matches = appSource.match(/<Route path="\*" element=\{<NotFound \/>\} \/>/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("does not mount any demo/mock organization components", () => {
    expect(appSource).not.toMatch(/CityMedical|DemoOrganization|MockBookings/i);
  });
});
