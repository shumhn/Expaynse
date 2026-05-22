"use client";

import { useCallback } from "react";
import useSWR from "swr";

import { walletAuthenticatedFetch } from "@/lib/client/wallet-auth-fetch";

export interface WorkspaceEmployeeLite {
  id: string;
  wallet: string;
  name: string;
  payrollMode?: "streaming" | "private_payroll";
  notes?: string;
  department?: string;
  role?: string;
  employmentType?: "full_time" | "part_time" | "contract";
  paySchedule?: "monthly" | "semi_monthly" | "biweekly" | "weekly";
  monthlySalaryUsd?: number;
  startDate?: string | null;
  privateRecipientInitializedAt?: string | null;
  privateRecipientInitStatus?: "pending" | "processing" | "confirmed" | "failed";
  privateRecipientInitRequestedAt?: string | null;
  privateRecipientInitLastAttemptAt?: string | null;
  privateRecipientInitConfirmedAt?: string | null;
  privateRecipientInitTxSignature?: string | null;
  privateRecipientInitError?: string | null;
  compensationAmountUsd?: number;
  compensationUnit?: string;
  weeklyHours?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceStreamLite {
  id: string;
  employeeId: string;
  status: "active" | "paused" | "stopped" | "pending";
  ratePerSecond: number;
  totalPaid: number;
  startsAt?: string | null;
  endsAt?: string | null;
  payoutMode?: "base" | "private";
  employeePda?: string | null;
  privatePayrollPda?: string | null;
  permissionPda?: string | null;
  lastPaidAt?: string | null;
  delegatedAt?: string | null;
  recipientPrivateInitializedAt?: string | null;
  checkpointCrankStatus?: "idle" | "pending" | "active" | "failed" | "stopped" | "stale" | null;
}

export interface WorkspaceCompanyLite {
  id: string;
  name: string;
  treasuryPubkey: string;
}

export interface EmployerWorkspaceSnapshot {
  company: WorkspaceCompanyLite | null;
  employees: WorkspaceEmployeeLite[];
  streams: WorkspaceStreamLite[];
}

export function useEmployerWorkspaceSWR(input: {
  walletAddr?: string;
  signMessage?: ((message: Uint8Array) => Promise<Uint8Array>) | null;
}) {
  const walletAddr = input.walletAddr ?? "";
  const signMessage = input.signMessage ?? null;

  const fetchSnapshot = useCallback(async (): Promise<EmployerWorkspaceSnapshot> => {
    if (!walletAddr || !signMessage) {
      return { company: null, employees: [], streams: [] };
    }

    const [employeesRes, streamsRes, companyRes] = await Promise.all([
      walletAuthenticatedFetch({
        wallet: walletAddr,
        signMessage,
        path: `/api/employees?employerWallet=${walletAddr}`,
      }),
      walletAuthenticatedFetch({
        wallet: walletAddr,
        signMessage,
        path: `/api/streams?employerWallet=${walletAddr}`,
      }),
      walletAuthenticatedFetch({
        wallet: walletAddr,
        signMessage,
        path: `/api/company/me?employerWallet=${walletAddr}`,
      }),
    ]);

    const [employeesJson, streamsJson, companyJson] = await Promise.all([
      employeesRes.json().catch(() => ({})),
      streamsRes.json().catch(() => ({})),
      companyRes.json().catch(() => ({})),
    ]);

    if (!employeesRes.ok) {
      throw new Error(
        (employeesJson as { error?: string }).error || "Failed to load employees",
      );
    }
    if (!streamsRes.ok) {
      throw new Error(
        (streamsJson as { error?: string }).error || "Failed to load streams",
      );
    }

    return {
      company: (companyJson as { company?: WorkspaceCompanyLite }).company ?? null,
      employees:
        ((employeesJson as { employees?: WorkspaceEmployeeLite[] }).employees ?? []),
      streams: ((streamsJson as { streams?: WorkspaceStreamLite[] }).streams ?? []),
    };
  }, [walletAddr, signMessage]);

  return useSWR(
    walletAddr && signMessage ? ["employer-workspace", walletAddr] : null,
    fetchSnapshot,
  );
}
