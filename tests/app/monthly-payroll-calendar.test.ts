import assert from "assert";

import {
  AVERAGE_MONTH_SECONDS,
  getAccruedInCycle,
  getScheduleCycleSnapshot,
  monthlyUsdToRatePerSecond,
} from "../../lib/payroll-math.ts";

function run() {
  const now = new Date("2026-05-19T10:00:00.000Z");
  const monthlyCycle = getScheduleCycleSnapshot("monthly", now);

  assert.equal(
    monthlyCycle.start.toISOString(),
    "2026-05-01T00:00:00.000Z",
    "monthly cycle should start at UTC month boundary",
  );
  assert.equal(
    monthlyCycle.end.toISOString(),
    "2026-05-31T00:00:00.000Z",
    "monthly cycle should end on the last UTC day",
  );
  assert.equal(
    monthlyCycle.nextStart.toISOString(),
    "2026-06-01T00:00:00.000Z",
    "monthly cycle nextStart should be first day of next month",
  );

  const monthlySalary = 3100;
  const ratePerSecond = monthlyUsdToRatePerSecond(monthlySalary);

  assert.ok(ratePerSecond > 0, "monthly salary should produce positive rate");

  const reconstructedMonthly = ratePerSecond * AVERAGE_MONTH_SECONDS;
  assert.ok(
    Math.abs(reconstructedMonthly - monthlySalary) < 1e-9,
    "monthly salary -> per-second conversion should be stable",
  );

  // If stream starts on next cycle boundary, current cycle accrual must stay zero.
  const startsNextCycle = monthlyCycle.nextStart.toISOString();
  const accruedBeforeStart = getAccruedInCycle({
    ratePerSecond,
    cycleStart: monthlyCycle.start,
    cycleTotalSeconds: monthlyCycle.totalSeconds,
    nowMs: now.getTime(),
    startsAt: startsNextCycle,
  });
  assert.equal(
    accruedBeforeStart,
    0,
    "accrual should remain zero before stream start time",
  );

  const cycleEndMs =
    monthlyCycle.start.getTime() + monthlyCycle.totalSeconds * 1000;
  const projectedBeforeStart = getAccruedInCycle({
    ratePerSecond,
    cycleStart: monthlyCycle.start,
    cycleTotalSeconds: monthlyCycle.totalSeconds,
    nowMs: cycleEndMs,
    startsAt: startsNextCycle,
  });
  assert.equal(
    projectedBeforeStart,
    0,
    "projection should remain zero if start is outside current cycle window",
  );

  // If stream starts mid-cycle, only elapsed seconds since startsAt should accrue.
  const startsMidCycle = "2026-05-10T00:00:00.000Z";
  const accrualCheckpointMs = Date.parse("2026-05-20T00:00:00.000Z");
  const elapsedSeconds = 10 * 24 * 60 * 60;
  const expectedAccrued = ratePerSecond * elapsedSeconds;
  const accruedMidCycle = getAccruedInCycle({
    ratePerSecond,
    cycleStart: monthlyCycle.start,
    cycleTotalSeconds: monthlyCycle.totalSeconds,
    nowMs: accrualCheckpointMs,
    startsAt: startsMidCycle,
  });
  assert.ok(
    Math.abs(accruedMidCycle - expectedAccrued) < 1e-9,
    "mid-cycle accrual should match elapsed seconds from startsAt",
  );

  console.log("monthly payroll calendar tests passed");
}

run();
