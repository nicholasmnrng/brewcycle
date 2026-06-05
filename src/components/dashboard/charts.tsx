"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChartDatum = Record<string, string | number>;

const colors = ["#2F7D5A", "#6F4E37", "#F4B860", "#3E2A1F", "#94A3B8"];

export function InteractiveChartCard({
  title,
  description,
  data,
  dataKey,
  labelKey = "label",
  type = "area"
}: {
  title: string;
  description?: string;
  data: ChartDatum[];
  dataKey: string;
  labelKey?: string;
  type?: "area" | "bar" | "line" | "pie";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <p className="text-sm leading-6 text-slate-500">{description}</p> : null}
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          {data.length ? (
            <ResponsiveContainer width="100%" height="100%">
              {type === "bar" ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7DED3" />
                  <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey={dataKey} fill="#2F7D5A" radius={[10, 10, 0, 0]} />
                </BarChart>
              ) : type === "line" ? (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7DED3" />
                  <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey={dataKey} stroke="#6F4E37" strokeWidth={3} dot={false} />
                </LineChart>
              ) : type === "pie" ? (
                <PieChart>
                  <Tooltip />
                  <Pie data={data} dataKey={dataKey} nameKey={labelKey} innerRadius={58} outerRadius={94} paddingAngle={3}>
                    {data.map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id={`gradient-${title.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2F7D5A" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2F7D5A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7DED3" />
                  <XAxis dataKey={labelKey} tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke="#2F7D5A"
                    strokeWidth={3}
                    fill={`url(#gradient-${title.replace(/\W/g, "")})`}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl bg-coffee-soft text-sm text-slate-500">
              Belum ada data untuk divisualisasikan.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TinyBars({ data }: { data: Array<{ label: string; value: number }> }) {
  return (
    <div className="h-20">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <Bar dataKey="value" fill="#2F7D5A" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
