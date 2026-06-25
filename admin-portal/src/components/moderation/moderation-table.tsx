"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatDateTime, truncateText } from "@/lib/utils";
import { LabelBadge } from "@/components/label-badge";
import { REPORT_STATUSES } from "@/lib/constants";
import { ShieldAlert, Search, FilterX, ChevronDown, ChevronUp } from "lucide-react";
import { OverrideDialog } from "./override-dialog";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Report } from "@/lib/types";

type EnrichedReport = Report & { postText?: string; reporterName?: string };

interface ModerationTableProps {
  initialReports: EnrichedReport[];
  filters: {
    currentFlag?: string;
    reportedAs?: string;
    status?: string;
    search?: string;
  };
  adminUid: string;
  adminEmail?: string;
}

export function ModerationTable({
  initialReports,
  filters,
  adminUid,
  adminEmail,
}: ModerationTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dialogConfig, setDialogConfig] = useState<{
    open: boolean;
    mode: "override" | "dismiss";
    reportId?: string;
    postId?: string;
    currentLabel?: string;
    suggestedLabel?: string;
  }>({ open: false, mode: "override" });

  const updateFilters = (key: string, value: string | null | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  return (
    <div>
      {/* ─── Filter Bar ─── */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 border-b border-zinc-800 bg-zinc-900/30">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search post text or reporter..."
            className="pl-9 bg-zinc-950 border-zinc-800"
            defaultValue={filters.search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateFilters("search", e.currentTarget.value);
              }
            }}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Select
            value={filters.status ?? "pending"}
            onValueChange={(val) => updateFilters("status", val)}
          >
            <SelectTrigger className="w-[140px] bg-zinc-950 border-zinc-800">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.currentFlag ?? "all"}
            onValueChange={(val) => updateFilters("currentFlag", val)}
          >
            <SelectTrigger className="w-[160px] bg-zinc-950 border-zinc-800">
              <SelectValue placeholder="Current Label" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
              <SelectItem value="all">Any Current</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="offensive">Offensive</SelectItem>
              <SelectItem value="hateful">Hateful</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.reportedAs ?? "all"}
            onValueChange={(val) => updateFilters("reportedAs", val)}
          >
            <SelectTrigger className="w-[160px] bg-zinc-950 border-zinc-800">
              <SelectValue placeholder="Suggested Label" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
              <SelectItem value="all">Any Suggested</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="offensive">Offensive</SelectItem>
              <SelectItem value="hateful">Hateful</SelectItem>
            </SelectContent>
          </Select>

          {(filters.search || filters.currentFlag || filters.reportedAs || (filters.status && filters.status !== "pending")) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(pathname)}
              className="text-zinc-400 hover:text-zinc-100"
              title="Clear filters"
            >
              <FilterX className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ─── Table ─── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="px-4 py-3 font-medium w-8"></th>
              <th className="px-4 py-3 font-medium min-w-[300px]">Post Text</th>
              <th className="px-4 py-3 font-medium">Labels</th>
              <th className="px-4 py-3 font-medium">Reporter</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right w-[180px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {initialReports.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={ShieldAlert}
                    title="No reports found"
                    description="You're all caught up! ✨"
                  />
                </td>
              </tr>
            ) : (
              initialReports.map((report) => {
                const isExpanded = expandedRows.has(report.id);
                const statusStyle = REPORT_STATUSES[report.status];

                return (
                  <React.Fragment key={report.id}>
                    <tr className="hover:bg-zinc-900/30 transition-colors group">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(report.id)}
                          className="text-zinc-500 hover:text-zinc-300"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-zinc-300 line-clamp-2 max-w-md">
                          {report.postText || <span className="text-zinc-600 italic">Content unavailable</span>}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <LabelBadge label={report.currentFlag} />
                          <span className="text-zinc-600">→</span>
                          <LabelBadge label={report.reportedAs} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {report.reporterName || report.reportedBy}
                      </td>
                      <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                        {formatDateTime(report.reportedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${statusStyle?.color}`}>
                          {statusStyle?.label ?? report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {report.status === "pending" && (
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-zinc-700 bg-transparent hover:bg-zinc-800 text-xs"
                              onClick={() =>
                                setDialogConfig({
                                  open: true,
                                  mode: "dismiss",
                                  reportId: report.id,
                                  postId: report.postId,
                                })
                              }
                            >
                              Dismiss
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 bg-zinc-100 text-zinc-900 hover:bg-white text-xs"
                              onClick={() =>
                                setDialogConfig({
                                  open: true,
                                  mode: "override",
                                  reportId: report.id,
                                  postId: report.postId,
                                  currentLabel: report.currentFlag,
                                  suggestedLabel: report.reportedAs,
                                })
                              }
                            >
                              Override
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-zinc-900/20">
                        <td colSpan={7} className="px-4 py-4 border-b border-zinc-800">
                          <div className="pl-12 max-w-3xl">
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Full Post Text</h4>
                            <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                              {report.postText}
                            </p>
                            <div className="mt-4 flex gap-4 text-xs text-zinc-500">
                              <span>Report ID: {report.id}</span>
                              <span>Post ID: {report.postId}</span>
                              <span>Reporter ID: {report.reportedBy}</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {dialogConfig.open && (
        <OverrideDialog
          open={dialogConfig.open}
          onOpenChange={(o) => setDialogConfig((prev) => ({ ...prev, open: o }))}
          mode={dialogConfig.mode}
          reportId={dialogConfig.reportId}
          postId={dialogConfig.postId!}
          currentLabel={dialogConfig.currentLabel}
          suggestedLabel={dialogConfig.suggestedLabel}
          adminUid={adminUid}
          adminEmail={adminEmail}
        />
      )}
    </div>
  );
}
