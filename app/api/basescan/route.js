import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const module = searchParams.get("module");
  const action = searchParams.get("action");
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  try {
    // 1. Transactions list
    if (module === "account" && action === "txlist") {
      const res = await fetch(`https://base.blockscout.com/api/v2/addresses/${address}/transactions`);
      if (!res.ok) throw new Error(`Blockscout error: ${res.status}`);
      const data = await res.json();
      
      // Map Blockscout V2 format to Etherscan format for frontend compatibility
      const mapped = (data.items || []).map(tx => ({
        timeStamp: Math.floor(new Date(tx.timestamp).getTime() / 1000).toString(),
        gasUsed: tx.gas_used,
        gasPrice: tx.gas_price,
        to: tx.to ? tx.to.hash : null,
      }));
      return NextResponse.json({ status: "1", message: "OK", result: mapped });
    }

    // 2. Token transfers (for unique tokens)
    if (module === "account" && action === "tokentx") {
      const res = await fetch(`https://base.blockscout.com/api/v2/addresses/${address}/token-transfers?type=ERC-20,ERC-721,ERC-1155`);
      if (!res.ok) throw new Error(`Blockscout error: ${res.status}`);
      const data = await res.json();
      
      const mapped = (data.items || []).map(tx => ({
        contractAddress: tx.token ? tx.token.address_hash : null,
      }));
      return NextResponse.json({ status: "1", message: "OK", result: mapped });
    }

    // 3. Balance
    if (module === "account" && action === "balance") {
      const res = await fetch(`https://base.blockscout.com/api/v2/addresses/${address}`);
      if (!res.ok) {
        // If not found, return 0 balance to let frontend handle it gracefully
        if (res.status === 404) return NextResponse.json({ status: "1", message: "OK", result: "0" });
        throw new Error(`Blockscout error: ${res.status}`);
      }
      const data = await res.json();
      
      return NextResponse.json({ status: "1", message: "OK", result: data.coin_balance });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });

  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch from Blockscout: ${err.message}` },
      { status: 500 }
    );
  }
}
