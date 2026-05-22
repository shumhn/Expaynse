import { NextRequest, NextResponse } from "next/server";
import {
  createStream,
  getEmployeeById,
  listStreams,
  updateEmployee,
  updateStreamStatus,
} from "@/lib/server/payroll-store";
import {
  isWalletAuthorizationError,
  verifyAuthorizedWalletRequest,
} from "@/lib/wallet-request-auth";

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseMonthlySalary(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("monthlySalaryUsd must be a positive number");
  }
  return amount;
}

function parseDateRange(startDate: string, endDate: string) {
  const startsAt = new Date(`${startDate}T00:00:00.000Z`);
  const endsAt = new Date(`${endDate}T23:59:59.999Z`);
  if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime())) {
    throw new Error("Invalid cycle date range");
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new Error("Cycle end must be after cycle start");
  }
  return {
    startsAtIso: startsAt.toISOString(),
    endsAtIso: endsAt.toISOString(),
    durationSeconds: Math.floor((endsAt.getTime() - startsAt.getTime()) / 1000),
  };
}

function getLatestNonStoppedStream(streams: Awaited<ReturnType<typeof listStreams>>, employeeId: string) {
  for (let i = streams.length - 1; i >= 0; i -= 1) {
    const stream = streams[i];
    if (stream.employeeId === employeeId && stream.status !== "stopped") {
      return stream;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody || "{}") as {
      employerWallet?: string;
      employeeId?: string;
      monthlySalaryUsd?: number;
      startDate?: string;
      endDate?: string;
    };

    if (!body.employerWallet) return badRequest("employerWallet is required");
    if (!body.employeeId) return badRequest("employeeId is required");
    if (!body.startDate || !body.endDate) {
      return badRequest("startDate and endDate are required");
    }

    await verifyAuthorizedWalletRequest({
      headers: request.headers,
      expectedWallet: body.employerWallet,
      method: request.method,
      path: request.nextUrl.pathname,
      body: rawBody,
    });

    const employee = await getEmployeeById(body.employerWallet, body.employeeId);
    if (!employee) return badRequest("Employee not found", 404);

    const monthlySalaryUsd = parseMonthlySalary(
      body.monthlySalaryUsd ?? employee.monthlySalaryUsd ?? employee.compensationAmountUsd,
    );
    const range = parseDateRange(body.startDate, body.endDate);
    const now = new Date().toISOString();

    const updatedEmployee = await updateEmployee(body.employerWallet, body.employeeId, {
      monthlySalaryUsd,
      compensationAmountUsd: monthlySalaryUsd,
      paySchedule: "monthly",
      compensationUnit: "monthly",
      nextCyclePlan: {
        monthlySalaryUsd,
        startsAt: range.startsAtIso,
        endsAt: range.endsAtIso,
        status: "scheduled",
        createdAt: employee.nextCyclePlan?.createdAt ?? now,
        updatedAt: now,
      },
    });

    return NextResponse.json({
      employee: updatedEmployee,
      nextCyclePlan: updatedEmployee.nextCyclePlan ?? null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to save next cycle plan";
    return badRequest(message, isWalletAuthorizationError(error) ? 401 : 400);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody || "{}") as {
      employerWallet?: string;
      employeeId?: string;
      force?: boolean;
    };

    if (!body.employerWallet) return badRequest("employerWallet is required");
    if (!body.employeeId) return badRequest("employeeId is required");

    await verifyAuthorizedWalletRequest({
      headers: request.headers,
      expectedWallet: body.employerWallet,
      method: request.method,
      path: request.nextUrl.pathname,
      body: rawBody,
    });

    const employee = await getEmployeeById(body.employerWallet, body.employeeId);
    if (!employee) return badRequest("Employee not found", 404);
    if (!employee.nextCyclePlan) {
      return badRequest("No next cycle plan found for this employee", 409);
    }

    const plan = employee.nextCyclePlan;
    const durationSeconds = Math.floor(
      (new Date(plan.endsAt).getTime() - new Date(plan.startsAt).getTime()) / 1000,
    );
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
      return badRequest("Saved next cycle plan is invalid");
    }

    const streams = await listStreams(body.employerWallet);
    const currentStream = getLatestNonStoppedStream(streams, body.employeeId);
    const nowMs = Date.now();
    const currentEndMs = currentStream?.endsAt ? new Date(currentStream.endsAt).getTime() : null;
    const beforeCurrentEnd =
      currentEndMs !== null && Number.isFinite(currentEndMs) && nowMs < currentEndMs;
    if (beforeCurrentEnd && !body.force) {
      return badRequest(
        "Current stream cycle has not ended yet. Activate after cycle end or pass force=true.",
        409,
      );
    }

    if (currentStream) {
      await updateStreamStatus({
        employerWallet: body.employerWallet,
        streamId: currentStream.id,
        status: "stopped",
      });
    }

    const ratePerSecond = plan.monthlySalaryUsd / durationSeconds;
    const createdStream = await createStream({
      employerWallet: body.employerWallet,
      employeeId: body.employeeId,
      ratePerSecond,
      startsAt: plan.startsAt,
      endsAt: plan.endsAt,
      status: "active",
      payoutMode: currentStream?.payoutMode ?? "base",
      allowedPayoutModes: currentStream?.allowedPayoutModes ?? ["base"],
      compensationSnapshot: {
        employmentType: employee.employmentType,
        paySchedule: "monthly",
        compensationUnit: "monthly",
        compensationAmountUsd: plan.monthlySalaryUsd,
        monthlySalaryUsd: plan.monthlySalaryUsd,
        startsAt: plan.startsAt,
        endsAt: plan.endsAt,
      },
    });

    const updatedEmployee = await updateEmployee(body.employerWallet, body.employeeId, {
      monthlySalaryUsd: plan.monthlySalaryUsd,
      compensationAmountUsd: plan.monthlySalaryUsd,
      paySchedule: "monthly",
      compensationUnit: "monthly",
      startDate: plan.startsAt,
      nextCyclePlan: null,
    });

    return NextResponse.json({
      employee: updatedEmployee,
      stream: createdStream,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to activate next cycle";
    return badRequest(message, isWalletAuthorizationError(error) ? 401 : 400);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody || "{}") as {
      employerWallet?: string;
      employeeId?: string;
    };

    if (!body.employerWallet) return badRequest("employerWallet is required");
    if (!body.employeeId) return badRequest("employeeId is required");

    await verifyAuthorizedWalletRequest({
      headers: request.headers,
      expectedWallet: body.employerWallet,
      method: request.method,
      path: request.nextUrl.pathname,
      body: rawBody,
    });

    const employee = await getEmployeeById(body.employerWallet, body.employeeId);
    if (!employee) return badRequest("Employee not found", 404);

    const updatedEmployee = await updateEmployee(body.employerWallet, body.employeeId, {
      nextCyclePlan: null,
    });

    return NextResponse.json({
      employee: updatedEmployee,
      nextCyclePlan: null,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to clear next cycle plan";
    return badRequest(message, isWalletAuthorizationError(error) ? 401 : 400);
  }
}
