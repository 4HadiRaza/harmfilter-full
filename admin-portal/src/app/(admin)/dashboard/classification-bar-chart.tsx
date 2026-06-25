"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import type { ChartDataPoint } from "@/lib/types";

export function ClassificationBarChart({ data }: { data: ChartDataPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5),
  }));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4">
        Classification Breakdown (14 days)
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="label" stroke="#52525b" fontSize={10} tickLine={false} />
          <YAxis stroke="#52525b" fontSize={10} tickLine={false} width={35} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            labelStyle={{ color: "#a1a1aa" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }}
            iconType="square"
            iconSize={8}
          />
          <Bar dataKey="normal" name="Normal" fill="#22c55e" radius={[2, 2, 0, 0]} stackId="a" />
          <Bar dataKey="offensive" name="Offensive" fill="#f59e0b" radius={[0, 0, 0, 0]} stackId="a" />
          <Bar dataKey="hateful" name="Hateful" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
