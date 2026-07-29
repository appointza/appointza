import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { StaffLayout } from "@/components/layout/StaffLayout";
import { CustomerCard, CustomerDetailPanel } from "@/components/customers/CustomerCard";
import "@/components/rooms/room-definitions.css";
import { normalizeCustomerSummary, type CustomerSummary } from "@/models/customer";
import { stayApi } from "@/services/stay.service";

export default function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const customerId = searchParams.get("id") ?? undefined;
  const searchParam = searchParams.get("search") ?? "";

  const [searchInput, setSearchInput] = useState(searchParam);

  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = searchInput.trim();
      setSearchParams((prev) => {
        const current = prev.get("search") ?? "";
        if (next === current) return prev;
        const params = new URLSearchParams(prev);
        if (next) params.set("search", next);
        else params.delete("search");
        return params;
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", searchParam, customerId],
    queryFn: () => stayApi.customers.select(searchParam || undefined, customerId),
  });

  const customers = useMemo(
    () => ((data?.customers as Record<string, unknown>[]) ?? []).map(normalizeCustomerSummary),
    [data?.customers]
  );

  const selected: CustomerSummary | null = useMemo(() => {
    if (!customerId) return null;
    if (data?.selected) return normalizeCustomerSummary(data.selected as Record<string, unknown>);
    return customers.find((c) => c.Key === customerId) ?? null;
  }, [customerId, data?.selected, customers]);

  const activeCount = customers.reduce((sum, c) => sum + c.ActiveBookings, 0);
  const totalDue = customers.reduce((sum, c) => sum + c.OutstandingBalance, 0);

  const openCustomer = useCallback(
    (key: string) => {
      if (key === customerId) {
        const params: Record<string, string> = {};
        if (searchParam) params.search = searchParam;
        setSearchParams(params);
      } else {
        const params: Record<string, string> = { id: key };
        if (searchParam) params.search = searchParam;
        setSearchParams(params);
      }
    },
    [customerId, searchParam, setSearchParams]
  );

  const closeDetail = useCallback(() => {
    const params: Record<string, string> = {};
    if (searchParam) params.search = searchParam;
    setSearchParams(params);
  }, [searchParam, setSearchParams]);

  const showDetail = Boolean(selected && customerId);

  useEffect(() => {
    if (!showDetail) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showDetail]);

  return (
    <StaffLayout>
      <div className="room-def-shell -mx-3 -my-3 sm:-mx-4 sm:-my-3 lg:-mx-5 lg:-my-5">
        <div className="room-def-list-panel">
          <header className="room-def-header">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Operations
                </p>
                <h1 className="font-display text-lg font-semibold">Customers</h1>
              </div>
              <input
                type="search"
                placeholder="Search name, phone, booking…"
                className="room-def-input w-full sm:max-w-sm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search customers"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">
                {customers.length} total
              </span>
              {activeCount > 0 && (
                <span className="rounded-full bg-orange-100 px-2.5 py-1 text-orange-800">{activeCount} active</span>
              )}
              {totalDue > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">
                  ₹{totalDue.toLocaleString("en-IN")} due
                </span>
              )}
            </div>
          </header>

          <div className="room-def-scroll">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : customers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background py-16 text-center">
                <p className="text-sm font-medium">No customers found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bookings appear here when rooms have guest details.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {customers.map((c) => (
                    <CustomerCard
                      key={c.Key}
                      customer={c}
                      selected={c.Key === customerId}
                      onSelect={() => openCustomer(c.Key)}
                    />
                  ))}
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                  Showing {customers.length} customer{customers.length === 1 ? "" : "s"}
                </p>
              </>
            )}
          </div>
        </div>

        {showDetail && (
          <button
            type="button"
            className="room-def-detail-backdrop"
            aria-label="Close customer details"
            onClick={closeDetail}
          />
        )}

        {showDetail && selected && <CustomerDetailPanel customer={selected} onClose={closeDetail} />}
      </div>
    </StaffLayout>
  );
}
