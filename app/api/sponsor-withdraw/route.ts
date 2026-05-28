import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import bs58 from "bs58";
import { withdraw, DEVNET_USDC, deserializeTx } from "@/lib/magicblock-api";

/**
 * POST /api/sponsor-withdraw
 *
 * True Gasless Withdrawal:
 * Builds a MagicBlock withdraw transaction for the employee, then re-writes
 * the fee-payer to the server-side Sponsor wallet.
 * This ensures the Phantom wallet UI shows "Sponsored" and does not
 * deduct any SOL from the employee's wallet.
 *
 * Body: { owner: string, amount: number, token?: string }
 * Returns: { transactionBase64: string, sendTo: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { owner, amount, token } = body as {
      owner: string;
      amount: number;
      token?: string;
    };

    if (!owner || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid owner or amount" },
        { status: 400 },
      );
    }

    // --- 1. Load the Sponsor keypair ---
    const sponsorPkStr = process.env.SPONSOR_PRIVATE_KEY;
    if (!sponsorPkStr) {
      return NextResponse.json(
        { error: "Server sponsor wallet is not configured" },
        { status: 500 },
      );
    }
    const sponsor = Keypair.fromSecretKey(bs58.decode(sponsorPkStr));

    const conn = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
      "confirmed",
    );

    // --- 2. Always Pre-fund exactly 0.00051 SOL for MagicBlock protocol fee ---
    // MagicBlock explicitly deducts 0.0005 SOL from the owner.
    // Even if the employee has their own SOL, we want the Company to pay for this, 
    // so we unconditionally send exactly the amount they are about to lose.
    const employeePub = new PublicKey(owner);
    const MAGICBLOCK_PROTOCOL_FEE = 0.0005;
    const fundAmount = MAGICBLOCK_PROTOCOL_FEE + 0.00001; // tiny buffer

    console.log(`[sponsor-withdraw] Pre-funding employee with ${fundAmount} SOL so they don't spend their personal money.`);
    
    const { SystemProgram, Transaction } = await import("@solana/web3.js");
    const fundTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: sponsor.publicKey,
        toPubkey: employeePub,
        lamports: Math.ceil(fundAmount * 1e9),
      })
    );
    
    const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
    fundTx.recentBlockhash = blockhash;
    fundTx.feePayer = sponsor.publicKey;
    fundTx.sign(sponsor);
    
    const fundSig = await conn.sendRawTransaction(fundTx.serialize(), { skipPreflight: false });
    await conn.confirmTransaction({ signature: fundSig, blockhash, lastValidBlockHeight }, "confirmed");
    console.log(`[sponsor-withdraw] Pre-funded exact amount. Sig: ${fundSig}`);

    // --- 3. Call MagicBlock withdraw API to get unsigned tx ---
    const buildRes = await withdraw(owner, amount, token);
    if (!buildRes.transactionBase64) {
      return NextResponse.json(
        { error: "MagicBlock API did not return a transaction" },
        { status: 502 },
      );
    }

    // --- 4. Decompile and reconstruct the transaction ---
    const tx = deserializeTx(buildRes.transactionBase64);
    
    const mintPub = new PublicKey(DEVNET_USDC);
    const employeeAta = await getAssociatedTokenAddress(mintPub, employeePub);
    const ataInfo = await conn.getAccountInfo(employeeAta);

    let allInstructions = [];

    if (tx instanceof VersionedTransaction) {
      const decompiledMessage = TransactionMessage.decompile(tx.message);
      allInstructions = [...decompiledMessage.instructions];
    } else {
      allInstructions = [...tx.instructions];
    }

    // Check if employee's ATA exists; if not, prepend creation instruction
    // with sponsor as payer
    if (!ataInfo) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        sponsor.publicKey, // payer
        employeeAta,       // ATA address
        employeePub,       // owner
        mintPub            // mint
      );
      // Avoid duplicating the initATA instruction if MagicBlock already added it
      // (MagicBlock's `initAtasIfMissing` uses the owner as payer, so we replace it)
      allInstructions = allInstructions.filter(
        ix => !(ix.programId.equals(createAtaIx.programId) && ix.keys.some(k => k.pubkey.equals(employeeAta)))
      );
      allInstructions.unshift(createAtaIx);
    }

    // Build a new versioned transaction with sponsor as fee payer
    const { blockhash: newBlockhash } = await conn.getLatestBlockhash("confirmed");
    const newMessage = new TransactionMessage({
      payerKey: sponsor.publicKey,
      recentBlockhash: newBlockhash,
      instructions: allInstructions,
    }).compileToV0Message();

    const newTx = new VersionedTransaction(newMessage);

    // Sponsor partially signs
    newTx.sign([sponsor]);

    // --- 4. Serialize and return ---
    const serialized = Buffer.from(newTx.serialize()).toString("base64");
    return NextResponse.json({
      transactionBase64: serialized,
      sendTo: buildRes.sendTo || "base",
      sponsored: true,
    });
  } catch (err) {
    console.error("[sponsor-withdraw] Error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
