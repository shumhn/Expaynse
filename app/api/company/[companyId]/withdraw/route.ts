import { NextRequest, NextResponse } from "next/server";
import { VersionedTransaction, Transaction, PublicKey, Connection } from "@solana/web3.js";
import { buildPrivateTransfer, DEVNET_USDC, withdraw, signAndSend } from "@/lib/magicblock-api";
import { loadCompanyKeypair } from "@/lib/server/company-key-vault";
import { getSponsorKeypair } from "@/lib/server/sponsor";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } from "@solana/spl-token";
import {
  CompanyRouteAuthError,
  requireCompanyOwnerRequest,
} from "@/lib/server/company-route-auth";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await context.params;

  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody || "{}");

    if (!body.amount || typeof body.amount !== "number") {
      return NextResponse.json({ ok: false, error: "Invalid amount" }, { status: 400 });
    }
    if (!body.destinationAddress) {
      return NextResponse.json({ ok: false, error: "Missing destinationAddress" }, { status: 400 });
    }

    await requireCompanyOwnerRequest({
      request,
      companyId,
      body: rawBody,
    });

    // Load the treasury keypair from the encrypted vault
    const treasuryKeypair = await loadCompanyKeypair({
      companyId,
      kind: "treasury",
    });

    const treasuryPubkey = treasuryKeypair.publicKey.toBase58();

    // We use a two-step process to avoid MagicBlock's cross-layer transfer bug:
    // Step 1: Withdraw from Treasury's Ephemeral Vault -> Treasury's Base Wallet
    const withdrawRes = await withdraw(treasuryPubkey, body.amount);
    
    if (!withdrawRes.transactionBase64) {
      throw new Error("Failed to build withdraw transaction");
    }

    // Sign and send the withdraw transaction
    const signWithdrawTx = async (tx: Transaction | VersionedTransaction) => {
      if (tx instanceof VersionedTransaction) {
        tx.sign([treasuryKeypair]);
      } else {
        tx.sign(treasuryKeypair);
      }
      return tx;
    };
    await signAndSend(withdrawRes.transactionBase64, signWithdrawTx, {
      sendTo: withdrawRes.sendTo,
    });

    // Step 2: Transfer from Treasury's Base Wallet -> Employer's Base Wallet
    const sponsorKeypair = getSponsorKeypair();
    if (!sponsorKeypair) {
      throw new Error("Missing sponsor keypair for withdrawal fees");
    }

    const rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.devnet.solana.com";
    const conn = new Connection(rpcUrl, "confirmed");

    const treasuryAta = await getAssociatedTokenAddress(new PublicKey(DEVNET_USDC), treasuryKeypair.publicKey);
    const destinationAta = await getAssociatedTokenAddress(new PublicKey(DEVNET_USDC), new PublicKey(body.destinationAddress));

    const tx = new Transaction();

    // Ensure the destination ATA exists, if not, create it
    const accountInfo = await conn.getAccountInfo(destinationAta);
    if (!accountInfo) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          sponsorKeypair.publicKey, // payer
          destinationAta, // ata
          new PublicKey(body.destinationAddress), // owner
          new PublicKey(DEVNET_USDC) // mint
        )
      );
    }

    tx.add(
      createTransferInstruction(
        treasuryAta, // source
        destinationAta, // dest
        treasuryKeypair.publicKey, // owner
        Math.round(body.amount * 1_000_000)
      )
    );

    const latestBlockhash = await conn.getLatestBlockhash("confirmed");
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.feePayer = sponsorKeypair.publicKey;

    // Both sponsor (fee payer) and treasury (owner) must sign
    tx.sign(sponsorKeypair, treasuryKeypair);
    
    const signature = await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    await conn.confirmTransaction({
      signature,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
    }, "confirmed");

    return NextResponse.json({
      ok: true,
      signature,
      amount: body.amount,
    });
  } catch (error) {
    if (error instanceof CompanyRouteAuthError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: error.status },
      );
    }
    console.error("Treasury withdraw error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to withdraw from treasury.",
      },
      { status: 500 }
    );
  }
}
