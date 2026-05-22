"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Clock } from "lucide-react";
import { buildStreamRangeCalendar, type StreamRangeDayCell } from "@/lib/payroll-calendar";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatCurrency(value: number, digits = 2) {
  if (!Number.isFinite(value) || value < 0) return "$0.00";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function formatDate(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export interface PayrollCalendarGridProps {
  /** Stream start date (ISO string). */
  startsAt: string;
  /** Stream end date (ISO string). */
  endsAt: string;
  /** Total cycle amount in USD. */
  totalAmountUsd: number;
  /** Per-second rate. */
  ratePerSecond: number;
  /** Current live accrued amount in USD. */
  accruedAmountUsd: number;
  /** Current timestamp (ms). Updated every 250ms for live ticking. */
  nowMs: number;
  /** Stream status. */
  status: "active" | "paused" | "stopped";
}

export function PayrollCalendarGrid(props: PayrollCalendarGridProps) {
  const {
    startsAt,
    endsAt,
    totalAmountUsd,
    ratePerSecond,
    accruedAmountUsd,
    nowMs,
    status,
  } = props;

  const startDate = useMemo(() => new Date(startsAt), [startsAt]);
  const endDate = useMemo(() => new Date(endsAt), [endsAt]);

  // Month navigation anchor
  const [monthOffset, setMonthOffset] = useState(0);
  const anchorDate = useMemo(() => {
    const d = new Date(startDate);
    d.setUTCMonth(d.getUTCMonth() + monthOffset);
    return d;
  }, [startDate, monthOffset]);

  const monthLabel = anchorDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const now = useMemo(() => new Date(nowMs), [nowMs]);

  const weeks = useMemo(
    () =>
      buildStreamRangeCalendar({
        anchor: anchorDate,
        startsAt,
        endsAt,
        now,
      }),
    [anchorDate, startsAt, endsAt, now],
  );

  // Stream range stats
  const totalDurationMs = endDate.getTime() - startDate.getTime();
  const totalDurationDays = Math.max(1, Math.ceil(totalDurationMs / (86_400 * 1000)));
  const elapsedMs = Math.max(0, Math.min(nowMs - startDate.getTime(), totalDurationMs));
  const elapsedDays = Math.floor(elapsedMs / (86_400 * 1000));
  const remainingDays = Math.max(0, totalDurationDays - elapsedDays);
  const overallProgress = totalDurationMs > 0 ? Math.min(1, elapsedMs / totalDurationMs) : 0;
  const remainingAmountUsd = Math.max(0, totalAmountUsd - accruedAmountUsd);
  const dailyRate = ratePerSecond * 86_400;

  // Is the stream currently past its end date?
  const isCompleted = nowMs >= endDate.getTime();
  const hasNotStarted = nowMs < startDate.getTime();

  function getCellClasses(cell: StreamRangeDayCell) {
    const base = "relative flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200";

    if (!cell.inMonth) {
      return `${base} text-white/10`;
    }

    if (!cell.inStreamRange) {
      return `${base} text-white/20`;
    }

    if (cell.isToday) {
      return `${base} ring-2 ring-[#1eba98] bg-[#1eba98]/20 text-[#84f7dc] shadow-[0_0_12px_rgba(30,186,152,0.3)]`;
    }

    if (cell.isEarned) {
      return `${base} bg-[#1eba98]/15 text-[#6ee8c5]`;
    }

    if (cell.isFuture) {
      return `${base} bg-white/[0.03] text-white/40`;
    }

    return `${base} text-white/30`;
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b0b0d] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1eba98]/15 text-[#1eba98]">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#8f8f95]">
              Payroll Calendar
            </p>
            <p className="text-sm font-bold text-white">{monthLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonthOffset((p) => p - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-all hover:border-[#1eba98]/30 hover:text-[#1eba98]"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setMonthOffset(0)}
            className="flex h-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 text-[9px] font-bold uppercase tracking-wider text-white/50 transition-all hover:border-[#1eba98]/30 hover:text-[#1eba98]"
          >
            Today
          </button>
          <button
            onClick={() => setMonthOffset((p) => p + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-all hover:border-[#1eba98]/30 hover:text-[#1eba98]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Date Range Badge */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1eba98]/20 bg-[#1eba98]/10 px-3 py-1 text-[10px] font-bold text-[#84f7dc]">
          <Clock size={10} />
          {formatDate(startsAt)} → {formatDate(endsAt)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-bold text-white/50">
          {totalDurationDays} days
        </span>
        {isCompleted && (
          <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
            Completed
          </span>
        )}
        {hasNotStarted && (
          <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold text-amber-300">
            Scheduled
          </span>
        )}
        {!isCompleted && !hasNotStarted && status === "active" && (
          <span className="inline-flex items-center rounded-full border border-[#1eba98]/30 bg-[#1eba98]/10 px-3 py-1 text-[10px] font-bold text-[#84f7dc]">
            ● Streaming
          </span>
        )}
        {status === "paused" && !isCompleted && !hasNotStarted && (
          <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold text-amber-300">
            Paused
          </span>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="mb-5">
        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="flex h-8 items-center justify-center text-[9px] font-bold uppercase tracking-widest text-[#62626b]"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Week rows */}
        <div className="grid gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((cell) => (
                <div key={cell.isoDate} className="flex items-center justify-center">
                  <div className={getCellClasses(cell)}>
                    {cell.dayOfMonth}
                    {/* Today partial progress indicator */}
                    {cell.isToday && cell.dayProgress > 0 && cell.dayProgress < 1 && (
                      <div
                        className="absolute bottom-0.5 left-1/2 h-[2px] -translate-x-1/2 rounded-full bg-[#1eba98]"
                        style={{ width: `${Math.round(cell.dayProgress * 70)}%` }}
                      />
                    )}
                    {/* Earned dot */}
                    {cell.isEarned && (
                      <div className="absolute bottom-0.5 left-1/2 h-[2px] w-[40%] -translate-x-1/2 rounded-full bg-[#1eba98]/50" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-5 flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#1eba98]/15" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8f8f95]">Earned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-[#1eba98]/20 ring-1 ring-[#1eba98]" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8f8f95]">Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-white/[0.03]" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#8f8f95]">Remaining</span>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#8f8f95]">
            Cycle Progress
          </span>
          <span className="text-xs font-bold text-[#84f7dc]">
            {(overallProgress * 100).toFixed(1)}%
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#1eba98] to-[#84f7dc] transition-all duration-300"
            style={{ width: `${Math.min(100, overallProgress * 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#62626b]">Total</p>
          <p className="text-sm font-bold text-white">{formatCurrency(totalAmountUsd)}</p>
        </div>
        <div className="rounded-xl border border-[#1eba98]/20 bg-[#1eba98]/[0.04] p-3">
          <div className="mb-1 flex items-center gap-1">
            <TrendingUp size={8} className="text-[#1eba98]" />
            <p className="text-[8px] font-bold uppercase tracking-widest text-[#62626b]">Accrued</p>
          </div>
          <p className="text-sm font-bold text-[#84f7dc]">{formatCurrency(accruedAmountUsd, 4)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#62626b]">Remaining</p>
          <p className="text-sm font-bold text-white/70">{formatCurrency(remainingAmountUsd, 4)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="mb-1 text-[8px] font-bold uppercase tracking-widest text-[#62626b]">Days Left</p>
          <p className="text-sm font-bold text-white">{remainingDays}</p>
          <p className="mt-0.5 text-[8px] font-bold text-[#62626b]">{formatCurrency(dailyRate, 4)}/day</p>
        </div>
      </div>
    </div>
  );
}
