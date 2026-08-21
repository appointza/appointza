import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const STATUS_PIE_COLORS: Record<string, string> = {
  Completed: "#10B981",
  Confirmed: "#3B82F6",
  Pending: "#F59E0B",
  Cancelled: "#EF4444",
};

const CHART_CORAL = "#2563EB";
const CHART_CORAL_LIGHT = "#3B82F6";

export type DashboardTrendPoint = { name: string; appointments: number };
export type DashboardStatusPoint = { name: string; value: number };
export type DashboardRevenuePoint = { name: string; revenue: number };

type DashboardChartsPanelProps = {
  trendChartData: DashboardTrendPoint[];
  statusChartData: DashboardStatusPoint[];
  revenueMonthBars: DashboardRevenuePoint[];
};

/** Isolated so recharts stays out of the Dashboard route's critical path until this chunk loads. */
export default function DashboardChartsPanel({
  trendChartData,
  statusChartData,
  revenueMonthBars,
}: DashboardChartsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-none sm:p-6">
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400">Trend</h3>
        <p className="mb-4 text-base font-semibold text-appointza-navy">Appointments · last 7 days</p>
        <div className="h-[200px] w-full md:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F0EB" />
              <XAxis dataKey="name" tick={{ fill: "#78716c", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#78716c", fontSize: 12 }} width={36} />
              <RechartsTooltip
                contentStyle={{ borderRadius: "12px", borderColor: "#E7E5E4" }}
                formatter={(v: number) => [v, "Appointments"]}
              />
              <Line
                type="monotone"
                dataKey="appointments"
                stroke={CHART_CORAL}
                strokeWidth={2}
                dot={{ r: 4, fill: CHART_CORAL }}
                activeDot={{ r: 6 }}
                name="Appointments"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-none sm:p-6">
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400">Breakdown</h3>
        <p className="mb-4 text-base font-semibold text-appointza-navy">Appointment status</p>
        <div className="mx-auto h-[200px] w-full max-w-xs md:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={82}
                paddingAngle={2}
              >
                {statusChartData.map((row) => (
                  <Cell key={row.name} fill={STATUS_PIE_COLORS[row.name] ?? "#94a3b8"} />
                ))}
              </Pie>
              <RechartsTooltip
                formatter={(value: number) => [value, "Appointments"]}
                contentStyle={{ borderRadius: "12px", borderColor: "#E7E5E4" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-stone-600">
          {statusChartData.map((row) => (
            <span
              key={row.name}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 py-1"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: STATUS_PIE_COLORS[row.name] }}
              />
              {row.name}: {row.value}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-none sm:p-6 lg:col-span-2">
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400">Revenue</h3>
        <p className="mb-4 text-base font-semibold text-appointza-navy">This month · by week</p>
        <div className="h-[200px] w-full md:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueMonthBars} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F0EB" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#78716c", fontSize: 12 }} />
              <YAxis tick={{ fill: "#78716c", fontSize: 12 }} tickFormatter={(v) => `₹${v}`} width={52} />
              <RechartsTooltip
                formatter={(v: number) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                contentStyle={{ borderRadius: "12px", borderColor: "#E7E5E4" }}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                fill={CHART_CORAL_LIGHT}
                radius={[8, 8, 0, 0]}
                maxBarSize={56}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
