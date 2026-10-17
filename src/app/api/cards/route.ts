import { NextResponse } from "next/server";
import { getDbPool, initDatabaseTables } from "@/lib/db";

// Helper to map DB row to BankCard object
function mapRowToCard(r: any) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    nationalId: r.national_id || "",
    cblPhone: r.cbl_phone || "",
    bank: r.bank || "",
    accountNumber: r.account_number || "",
    iban: r.iban || "",
    depositAmt: parseFloat(r.deposit_amt) || 0,
    cardPrice: parseFloat(r.card_price) || 0,
    totalCost: parseFloat(r.total_cost) || 0,
    depositDate: r.deposit_date || "",
    bookingDate: r.booking_date || "",
    cardNum: r.card_num || "",
    pinLocal: r.pin_local || "",
    pinDollar: r.pin_dollar || "",
    expiry: r.expiry || "09/29",
    status: r.status || "1. إدخال البيانات",
    notes: r.notes || "",
    refSlipNo: r.ref_slip_no || "",
    withdrawLocation: r.withdraw_location || "",
    usdAmount: parseFloat(r.usd_amount) || 0,
    rate: parseFloat(r.rate) || 0,
    netProfitLYD: parseFloat(r.net_profit_lyd) || 0,
    destinationVault: r.destination_vault || "",
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  };
}

// GET: Fetch cards (or single card by query q)
export async function GET(req: Request) {
  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    await initDatabaseTables();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim().toLowerCase();

    if (q) {
      const [rows]: any = await pool.query(
        `SELECT * FROM cards 
         WHERE LOWER(name) LIKE ? 
            OR national_id LIKE ? 
            OR cbl_phone LIKE ? 
            OR LOWER(code) LIKE ? 
            OR card_num LIKE ? 
         ORDER BY updated_at DESC LIMIT 50`,
        [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]
      );
      return NextResponse.json({ success: true, cards: rows.map(mapRowToCard) });
    }

    const [rows]: any = await pool.query(`SELECT * FROM cards ORDER BY updated_at DESC LIMIT 1000`);
    return NextResponse.json({ success: true, cards: rows.map(mapRowToCard) });
  } catch (err: any) {
    console.error("GET /api/cards error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Save or Update a card
export async function POST(req: Request) {
  const pool = getDbPool();
  if (!pool) {
    return NextResponse.json({ success: false, error: "Database not configured" }, { status: 503 });
  }

  try {
    await initDatabaseTables();
    const body = await req.json();

    const {
      id,
      code,
      name,
      nationalId = "",
      cblPhone = "",
      bank = "",
      accountNumber = "",
      iban = "",
      depositAmt = 0,
      cardPrice = 0,
      totalCost = 0,
      depositDate = "",
      bookingDate = "",
      cardNum = "",
      pinLocal = "",
      pinDollar = "",
      expiry = "09/29",
      status = "1. إدخال البيانات",
      notes = "",
      refSlipNo = "",
      withdrawLocation = "",
      usdAmount = 0,
      rate = 0,
      netProfitLYD = 0,
      destinationVault = "",
    } = body;

    const assignedCode = code || id || `CRD-${Date.now().toString().slice(-4)}`;
    const assignedId = id || assignedCode;

    await pool.query(
      `INSERT INTO cards (
        id, code, name, national_id, cbl_phone, bank, account_number, iban,
        deposit_amt, card_price, total_cost, deposit_date, booking_date, card_num,
        pin_local, pin_dollar, expiry, status, notes, ref_slip_no, withdraw_location,
        usd_amount, rate, net_profit_lyd, destination_vault
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        national_id = VALUES(national_id),
        cbl_phone = VALUES(cbl_phone),
        bank = VALUES(bank),
        account_number = VALUES(account_number),
        iban = VALUES(iban),
        deposit_amt = VALUES(deposit_amt),
        card_price = VALUES(card_price),
        total_cost = VALUES(total_cost),
        deposit_date = VALUES(deposit_date),
        booking_date = VALUES(booking_date),
        card_num = VALUES(card_num),
        pin_local = VALUES(pin_local),
        pin_dollar = VALUES(pin_dollar),
        expiry = VALUES(expiry),
        status = VALUES(status),
        notes = VALUES(notes),
        ref_slip_no = VALUES(ref_slip_no),
        withdraw_location = VALUES(withdraw_location),
        usd_amount = VALUES(usd_amount),
        rate = VALUES(rate),
        net_profit_lyd = VALUES(net_profit_lyd),
        destination_vault = VALUES(destination_vault)
      `,
      [
        assignedId,
        assignedCode,
        name,
        nationalId,
        cblPhone,
        bank,
        accountNumber,
        iban,
        depositAmt,
        cardPrice,
        totalCost,
        depositDate,
        bookingDate,
        cardNum,
        pinLocal,
        pinDollar,
        expiry,
        status,
        notes,
        refSlipNo,
        withdrawLocation,
        usdAmount,
        rate,
        netProfitLYD,
        destinationVault,
      ]
    );

    return NextResponse.json({
      success: true,
      card: { ...body, id: assignedId, code: assignedCode },
    });
  } catch (err: any) {
    console.error("POST /api/cards error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
