import { NextResponse } from "next/server";
import { getDbPool, initDatabaseTables } from "@/lib/db";

export async function POST(req: Request) {
  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    await initDatabaseTables();
    const body = await req.json();
    const { pin, initialCashLYD = 0, initialDollarUSD = 0 } = body;

    if (pin !== "9999" && pin.trim().toLowerCase() !== "تصفير") {
      return NextResponse.json({ success: false, error: "رمز PIN غير مصرح به" }, { status: 403 });
    }

    const cashLYD = parseFloat(initialCashLYD) || 0;
    const dollarUSD = parseFloat(initialDollarUSD) || 0;

    // 1. Clear cards table
    await pool.query(`TRUNCATE TABLE cards`);

    // 2. Clear movements table
    await pool.query(`TRUNCATE TABLE movements`);

    // 3. Reset vaults
    await pool.query(`UPDATE vaults SET balance = 0, total_income = 0`);
    await pool.query(`UPDATE vaults SET balance = ?, total_income = ? WHERE id = 'cash_lyd'`, [
      cashLYD,
      cashLYD,
    ]);
    await pool.query(`UPDATE vaults SET balance = ?, total_income = ? WHERE id = 'cash_usd'`, [
      dollarUSD,
      dollarUSD,
    ]);

    // 4. Log reset movement
    await pool.query(
      `INSERT INTO movements (action_type, details, amount, performed_by) VALUES (?, ?, ?, ?)`,
      [
        "تصفير المنظومة",
        `تم تصفير المنظومة وإعادة ضبط الأرصدة الافتتاحية (كاش ليبي: ${cashLYD} د.ل | دولار: $${dollarUSD})`,
        cashLYD,
        "المدير العام (أمير)",
      ]
    );

    const [updatedVaults]: any = await pool.query(`SELECT * FROM vaults ORDER BY id ASC`);
    const vaults = updatedVaults.map((r: any) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      currency: r.currency,
      balance: parseFloat(r.balance) || 0,
      totalIncome: parseFloat(r.total_income) || 0,
    }));

    return NextResponse.json({ success: true, vaults });
  } catch (err: any) {
    console.error("POST /api/system-reset error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
