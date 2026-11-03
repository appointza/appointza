import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportChartDto } from "@/models/dynamicReport.model";

const COLORS = ["#2a5af5", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

type Props = {
  chart?: ReportChartDto | null;
  rows: Record<string, unknown>[];
};

export function DynamicReportChart({ chart, rows }: Props) {
  if (!chart?.is_enabled || !chart.chart_type || chart.chart_type === "none") return null;
  if (!chart.x_column || !chart.y_column || rows.length === 0) return null;

  const data = rows.map((row) => ({
    name: String(row[chart.x_column] ?? row[Object.keys(row).find((k) => k.toLowerCase() === chart.x_column.toLowerCase()) ?? ""] ?? ""),
    value: Number(
      row[chart.y_column] ??
        row[Object.keys(row).find((k) => k.toLowerCase() === chart.y_column.toLowerCase()) ?? ""] ??
        0,
    ),
  }));

  return (
    <div className="h-72 w-full rounded-lg border border-border bg-card p-3">
      {chart.title ? <p className="mb-2 text-sm font-medium">{chart.title}</p> : null}
      <ResponsiveContainer width="100%" height="90%">
        {chart.chart_type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#2a5af5" strokeWidth={2} />
          </LineChart>
        ) : chart.chart_type === "pie" ? (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} label>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#2a5af5" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
