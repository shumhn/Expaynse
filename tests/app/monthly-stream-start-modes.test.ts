import assert from "assert";

import {
  getAccruedInCycle,
  getScheduleCycleSnapshot,
  monthlyUsdToRatePerSecond,
} from "../../lib/payroll-math.ts";

type StreamStartMode = "now" | "next_cycle" | "custom";

function resolveStartAtIsoForTest(args: {
  mode: StreamStartMode;
  nowIso: string;
  customLocalValue: string;
}) {
  const { mode, nowIso, customLocalValue } = args;
  const now = new Date(nowIso);

  if (mode === "now") {
    return now.toISOString();
  }

  if (mode === "next_cycle") {
    const cycle = getScheduleCycleSnapshot("monthly", now);
    return cycle.nextStart.toISOString();
  }

  const parsed = new Date(customLocalValue);
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function run() {
  const nowIso = "2026-05-19T10:00:00.000Z";
  const nowMs = Date.parse(nowIso);
  const cycle = getScheduleCycleSnapshot("monthly", new Date(nowIso));

  const startNow = resolveStartAtIsoForTest({
    mode: "now",
    nowIso,
    customLocalValue: "",
  });
  assert.equal(startNow, nowIso, "start-now mode should use current timestamp");

  const startNextCycle = resolveStartAtIsoForTest({
    mode: "next_cycle",
    nowIso,
    customLocalValue: "",
  });
  assert.equal(
    startNextCycle,
    "2026-06-01T00:00:00.000Z",
    "next-cycle mode should point to next monthly boundary",
  );

  const customIso = resolveStartAtIsoForTest({
    mode: "custom",
    nowIso,
    customLocalValue: "2026-05-25T14:30:00.000Z",
  });
  assert.equal(
    customIso,
    "2026-05-25T14:30:00.000Z",
    "custom mode should preserve provided date-time",
  );

  const invalidCustomIso = resolveStartAtIsoForTest({
    mode: "custom",
    nowIso,
    customLocalValue: "not-a-date",
  });
  assert.equal(invalidCustomIso, null, "invalid custom date should return null");

  const monthlySalary = 2500;
  const ratePerSecond = monthlyUsdToRatePerSecond(monthlySalary);
  assert.ok(ratePerSecond > 0, "monthly salary should produce a live rate");

  const accrualWithNowStart = getAccruedInCycle({
    ratePerSecond,
    cycleStart: cycle.start,
    cycleTotalSeconds: cycle.totalSeconds,
    nowMs: nowMs + 2 * 60 * 60 * 1000, // +2h
    startsAt: startNow,
  });
  assert.ok(
    accrualWithNowStart > 0,
    "start-now mode should accrue positive payroll within the same cycle",
  );

  const accrualWithNextCycleStart = getAccruedInCycle({
    ratePerSecond,
    cycleStart: cycle.start,
    cycleTotalSeconds: cycle.totalSeconds,
    nowMs: nowMs + 2 * 60 * 60 * 1000,
    startsAt: startNextCycle,
  });
  assert.equal(
    accrualWithNextCycleStart,
    0,
    "next-cycle mode should keep current-cycle accrual at zero",
  );

  const accrualBeforeCustomStart = getAccruedInCycle({
    ratePerSecond,
    cycleStart: cycle.start,
    cycleTotalSeconds: cycle.totalSeconds,
    nowMs: Date.parse("2026-05-25T14:00:00.000Z"),
    startsAt: customIso!,
  });
  assert.equal(
    accrualBeforeCustomStart,
    0,
    "custom mode should not accrue before the custom start timestamp",
  );

  const accrualAfterCustomStart = getAccruedInCycle({
    ratePerSecond,
    cycleStart: cycle.start,
    cycleTotalSeconds: cycle.totalSeconds,
    nowMs: Date.parse("2026-05-25T16:30:00.000Z"),
    startsAt: customIso!,
  });
  assert.ok(
    accrualAfterCustomStart > 0,
    "custom mode should accrue after the custom start timestamp",
  );

  console.log("monthly stream start mode tests passed");
}

run();
