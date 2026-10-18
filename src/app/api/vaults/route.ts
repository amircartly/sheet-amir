import { NextResponse } from "next/server";
import { getDbPool, initDatabaseTables } from "@/lib/db";

// GET: Fetch all treasury balances
export async function GET() {
  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    await initDatabaseTables();

    const [rows]: any = await pool.query(`SELECT * FROM vaults ORDER BY id ASC`);
    const vaults = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      currency: r.currency,
      balance: parseFloat(r.balance) || 0,
      totalIncome: parseFloat(r.total_income) || 0,
    }));

    return NextResponse.json({ success: true, vaults });
  } catch (err: any) {
    console.error("GET /api/vaults error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Update or Fund a vault balance
export async function POST(req: Request) {
  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    await initDatabaseTables();
    const body = await req.json();
    const { action, vaultId, amount, mode, note, performedBy } = body;

    // Mode: "fund" (add or set)
    if (action === "fund") {
      const amt = parseFloat(amount) || 0;
      if (mode === "set") {
        await pool.query(
          `UPDATE vaults SET balance = ?, total_income = GREATEST(total_income, ?) WHERE id = ?`,
          [amt, amt, vaultId]
        );
      } else {
        await pool.query(
          `UPDATE vaults SET balance = balance + ?, total_income = total_income + ? WHERE id = ?`,
          [amt, amt, vaultId]
        );
      }

      const curr = vaultId === "cash_usd" ? "$" : "د.ل";
      await pool.query(
        `INSERT INTO movements (action_type, details, amount, performed_by) VALUES (?, ?, ?, ?)`,
        [
          "تغذية / ضبط رصيد",
          `تعديل رصيد الخزينة (${vaultId}) بمقدار: ${amt} ${curr} (${mode})`,
          amt,
          performedBy || "المنظومة",
        ]
      );
    } else if (action === "sell_usd") {
      const usd = parseFloat(body.usdAmount) || 0;
      const rate = parseFloat(body.rate) || 0;
      const totalSaleLYD = parseFloat(body.totalSaleLYD) || usd * rate;
      const destinationVault = body.destinationVault || "خزينة الكاش بالدينار";
      const refNo = body.refNo || "";

      // Deduct from cash_usd
      await pool.query(
        `UPDATE vaults SET balance = GREATEST(0, balance - ?) WHERE id = 'cash_usd'`,
        [usd]
      );

      // Add to destination LYD vault
      await pool.query(
        `UPDATE vaults SET balance = balance + ?, total_income = total_income + ? WHERE name = ? OR id = ?`,
        [totalSaleLYD, totalSaleLYD, destinationVault, destinationVault]
      );

      // Record movement in movements table
      await pool.query(
        `INSERT INTO movements (action_type, details, amount, performed_by) VALUES (?, ?, ?, ?)`,
        [
          "بيع دولار كاش",
          `بيع $${usd.toLocaleString("en-US")} بسعر ${rate} د.ل بإجمالي ${totalSaleLYD.toLocaleString("en-US")} د.ل وتوريد إلى (${destinationVault}) | إشاري: ${refNo}`,
          totalSaleLYD,
          performedBy || "المسؤول المالي ومكتب الخارج",
        ]
      );
    } else if (action === "sync_all" && Array.isArray(body.vaults)) {
      // Bulk update from UI settlement
      for (const v of body.vaults) {
        await pool.query(
          `UPDATE vaults SET balance = ?, total_income = ? WHERE id = ?`,
          [v.balance, v.totalIncome, v.id]
        );
      }
    }

    const [updatedRows]: any = await pool.query(`SELECT * FROM vaults ORDER BY id ASC`);
    const vaults = updatedRows.map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      currency: r.currency,
      balance: parseFloat(r.balance) || 0,
      totalIncome: parseFloat(r.total_income) || 0,
    }));

    return NextResponse.json({ success: true, vaults });
  } catch (err: any) {
    console.error("POST /api/vaults error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
