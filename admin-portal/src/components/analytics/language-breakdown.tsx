"use client";

import { Globe } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface LanguageBreakdownProps {
  data: {
    name: string;
    value: number;
    percent: number;
  }[];
}

const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

export function LanguageBreakdown({ data }: LanguageBreakdownProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 h-full flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b border-zinc-800 shrink-0">
        <Globe className="w-4 h-4 text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-300">Language Breakdown</h3>
      </div>
      
      <div className="flex-1 p-4 flex flex-col min-h-[300px]">
        {data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-zinc-500">
            No language data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  borderColor: '#27272a',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                itemStyle={{ color: '#e4e4e7' }}
                formatter={(value: any, name: any, props: any) => [`${value?.toLocaleString?.() || value} (${props.payload.percent}%)`, name]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value, entry: any) => (
                  <span className="text-zinc-400 text-xs ml-1">
                    {value} <span className="text-zinc-600">({entry.payload.percent}%)</span>
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
