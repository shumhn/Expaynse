import { useState, useEffect } from "react";
import { Loader2, X, Wallet, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  deposit,
  buildPrivateTransfer,
  signAndSend,
  checkHealth,
  DEVNET_USDC,
  getBalance,
} from "@/lib/magicblock-api";
import { walletAuthenticatedFetch } from "@/lib/client/wallet-auth-fetch";
import { enqueuePendingSetupAction } from "@/lib/client/history-queue";
import { toast } from "sonner";
import Link from "next/link";

const FUNDING_HISTORY_TYPE = "fund-treasury";
const FUNDING_SUCCESS_MESSAGE = (amountUi: number) =>
  `Successfully deposited ${amountUi} USDC`;

export function DepositModal({ isOpen, onClose, baseBalance = 0, privateBalance = 0, onDepositSuccess, treasuryPubkey }: { isOpen: boolean; onClose: () => void; baseBalance?: number; privateBalance?: number; onDepositSuccess?: () => void; treasuryPubkey?: string }) {
  const { publicKey, signTransaction, signMessage } = useWallet();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [successSig, setSuccessSig] = useState<string | null>(null);
  const [depositedAmount, setDepositedAmount] = useState<number | null>(null);
  const [magicBlockHealth, setMagicBlockHealth] = useState<"checking" | "ok" | "error">("checking");
  const [liveBaseBalance, setLiveBaseBalance] = useState(baseBalance);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) return;

    const frameId = requestAnimationFrame(() => {
      setSuccessSig(null);
      setDepositedAmount(null);
      setAmount("");
      setMagicBlockHealth("checking");
    });

    checkHealth()
      .then(res => setMagicBlockHealth(res.status === "ok" ? "ok" : "error"))
      .catch(() => setMagicBlockHealth("error"));

    if (publicKey) {
      void getBalance(publicKey.toBase58())
        .then((res) => {
          const next = parseInt(res.balance ?? "0", 10) / 1_000_000;
          if (Number.isFinite(next)) {
            setLiveBaseBalance(next);
          }
        })
        .catch(() => {
          // fall back to parent-provided balance
        });
    }

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isOpen, publicKey]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSuccessSig(null);
    setDepositedAmount(null);
    setAmount("");
    onClose();
  };

  const handleDeposit = async () => {
    if (!publicKey || !signTransaction) {
      toast.error("Wallet not connected");
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    let latestBaseBalance = liveBaseBalance;
    try {
      const balanceRes = await getBalance(publicKey.toBase58());
      latestBaseBalance = parseInt(balanceRes.balance ?? "0", 10) / 1_000_000;
      if (Number.isFinite(latestBaseBalance)) {
        setLiveBaseBalance(latestBaseBalance);
      }
    } catch {
      // keep last known balance
    }

    setLoading(true);
    try {
      const owner = publicKey.toBase58();
      let transactionBase64: string | undefined;
      let sendTo: string | undefined;

      if (!Number.isFinite(val) || val <= 0) {
        toast.error("Enter a valid amount");
        return;
      }

      if (val > latestBaseBalance) {
        toast.error("Insufficient base balance");
        return;
      }

      if (latestBaseBalance <= 0) {
        toast.error("Current wallet has no live base USDC. Fund this wallet first.");
        return;
      }

      if (treasuryPubkey) {
        const buildRes = await buildPrivateTransfer({
          from: owner,
          to: treasuryPubkey,
          amount: val,
          outputMint: DEVNET_USDC,
          balances: {
            fromBalance: "base",
            toBalance: "ephemeral"
          }
        });
        transactionBase64 = buildRes.transactionBase64;
        sendTo = buildRes.sendTo;
      } else {
        const depositRes = await deposit(owner, val);
        transactionBase64 = depositRes.transactionBase64;
        sendTo = depositRes.sendTo;
      }

      if (transactionBase64 && sendTo) {
        const sig = await signAndSend(transactionBase64, signTransaction, {
          sendTo,
          signMessage: signMessage || undefined,
          publicKey: publicKey || undefined,
        });

        // Save deposit to history
        if (signMessage) {
          try {
            await walletAuthenticatedFetch({
              path: `/api/history?wallet=${owner}`,
              method: "POST",
              signMessage,
              wallet: owner,
              body: {
                kind: "setup-action",
                wallet: owner,
                type: FUNDING_HISTORY_TYPE,
                amount: val,
                txSig: sig,
                status: "success",
              },
            });
          } catch (historyErr) {
            console.error("Failed to save deposit to history", historyErr);
            enqueuePendingSetupAction({
              kind: "setup-action",
              wallet: owner,
              type: FUNDING_HISTORY_TYPE,
              amount: val,
              txSig: sig,
              status: "success",
            });
            toast.warning(
              "Deposit succeeded, but history tracking failed. We'll retry automatically in the background.",
            );
          }
        } else {
          enqueuePendingSetupAction({
            kind: "setup-action",
            wallet: owner,
            type: FUNDING_HISTORY_TYPE,
            amount: val,
            txSig: sig,
            status: "success",
          });
          toast.warning(
            "Deposit succeeded, but this wallet can't sign messages. History/analytics will sync once message signing is available.",
          );
        }

        toast.success(FUNDING_SUCCESS_MESSAGE(val));
        setDepositedAmount(val);
        setSuccessSig(sig);
        onDepositSuccess?.();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Deposit failed: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute right-6 top-6 rounded-xl p-2 text-[#a8a8aa] transition-colors hover:bg-white/5 hover:text-white"
        >
          <X size={18} />
        </button>

        {successSig ? (
          <>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <CheckCircle2 size={28} className="text-emerald-400" />
            </div>

            <h2 className="mb-1 text-2xl font-bold tracking-tight text-white">Deposit Complete</h2>
            <p className="mb-8 text-sm text-[#a8a8aa]">
              Your funds have been successfully deposited to the ephemeral vault.
            </p>

            <div className="mb-8 rounded-2xl border border-white/5 bg-white/5 p-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#a8a8aa]">
                Amount Deposited
              </p>
              <p className="text-xl font-bold text-white">
                {depositedAmount?.toFixed(2)}{" "}
                <span className="text-sm text-emerald-400">
                  USDC
                </span>
              </p>
            </div>

            <div className="mb-8 space-y-2">
              <a
                href={`https://solscan.io/tx/${successSig}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center justify-between rounded-xl border border-white/5 bg-[#111111] px-4 py-3 transition-all hover:border-white/10 hover:bg-white/5"
              >
                <span className="font-mono text-xs text-[#a8a8aa] transition-colors group-hover:text-white">
                  View on Solscan
                </span>
                <div className="flex items-center gap-1.5 font-mono text-xs text-[#1eba98]">
                  {successSig.slice(0, 8)}...
                  <ExternalLink size={11} />
                </div>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleClose}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#111111] border border-white/10 py-4 text-sm font-bold text-white transition-all hover:bg-white/5"
              >
                Close
              </button>
              <Link
                href="/people"
                onClick={handleClose}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-bold text-black transition-all hover:bg-white/90"
              >
                Go to People
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 mx-auto">
              <Wallet size={28} className="text-white" />
            </div>

            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111111] px-3 py-1.5 shadow-sm">
                <ShieldCheck
                  size={14}
                  className={
                    magicBlockHealth === "ok"
                      ? "text-[#1eba98]"
                      : magicBlockHealth === "error"
                        ? "text-amber-400"
                        : "text-[#a8a8aa]"
                  }
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${magicBlockHealth === "ok"
                    ? "text-[#1eba98]"
                    : magicBlockHealth === "error"
                      ? "text-amber-400"
                      : "text-[#a8a8aa]"
                    }`}
                >
                  {magicBlockHealth === "ok"
                    ? "Vault Secured"
                    : magicBlockHealth === "error"
                      ? "Network Degraded"
                      : "Verifying Vault"}
                </span>
              </div>
            </div>

            <div className="text-center">
              <h2 className="mb-1 text-2xl font-bold tracking-tight text-white">Deposit to Treasury</h2>
              <p className="mb-8 text-sm text-[#a8a8aa]">
                Add base-wallet USDC to the company treasury to fund payroll streams and manual disbursements.
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8a8aa] mb-1">
                  Your Wallet Balance
                </p>
                <p className="text-xl font-bold text-white">
                  {liveBaseBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-xs text-[#a8a8aa]">
                    USDC
                  </span>
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#a8a8aa] mb-1">Treasury Balance</p>
                <p className="text-xl font-bold text-white">{privateBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-[#a8a8aa]">USDC</span></p>
              </div>
            </div>

            <div className="mb-6 relative">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#a8a8aa]">
                  Amount (USDC)
                </label>
                <button
                  onClick={() => setAmount(liveBaseBalance.toString())}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#1eba98] hover:text-[#1eba98]/80 transition-colors"
                >
                  Max
                </button>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-2xl border border-white/10 bg-[#111111] px-5 py-4 font-mono text-xl text-white outline-none transition-colors focus:border-[#1eba98]/50 focus:bg-[#1eba98]/5"
                min={0}
                step={0.01}
                max={liveBaseBalance}
              />
            </div>

            <button
              onClick={handleDeposit}
              disabled={
                loading ||
                !amount ||
                parseFloat(amount) <= 0 ||
                parseFloat(amount) > liveBaseBalance
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1eba98] py-4 text-sm font-bold text-black transition-all hover:bg-[#1eba98]/80 disabled:opacity-40"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {loading ? "Processing Deposit..." : "Confirm Deposit"}
            </button>
            <p className="mt-3 text-center text-xs text-[#a8a8aa]">
              Deposit uses your connected wallet USDC and moves it into the private payroll treasury.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
