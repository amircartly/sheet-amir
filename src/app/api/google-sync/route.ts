import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { sendToGoogleScript } from "@/lib/googleSync";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, scriptUrl, card, cards, employeeName = "موقع المنظومة" } = body;

    const targetUrl =
      scriptUrl ||
      process.env.GOOGLE_SHEETS_WEBAPP_URL ||
      process.env.GOOGLE_SHEET_URL ||
      "";

    // 1. Export All Cards to Google Sheets
    if (action === "export_all") {
      let cardList = cards;

      // If cards not provided directly in body, query central MySQL database
      if (!Array.isArray(cardList) || cardList.length === 0) {
        const pool = getDbPool();
        if (pool) {
          try {
            const [rows]: any = await pool.query(
              `SELECT * FROM cards ORDER BY updated_at DESC LIMIT 2000`
            );
            cardList = rows.map((r: any) => ({
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
            }));
          } catch (dbErr) {
            console.error("DB query failed in export_all:", dbErr);
          }
        }
      }

      if (!cardList || cardList.length === 0) {
        return NextResponse.json({
          success: false,
          error: "لا توجد بطاقات مسجلة لتصديرها",
        });
      }

      if (!targetUrl) {
        return NextResponse.json({
          success: false,
          error: "الرجاء إدخال رابط Google Apps Script Web App الخاص بالشيت أولاً.",
        });
      }

      const syncResult = await sendToGoogleScript(targetUrl, {
        action: "batchSync",
        cards: cardList,
        employeeName,
      });

      return NextResponse.json(syncResult);
    }

    // 2. Live Sync Single Card
    if (action === "sync_card") {
      if (!card) {
        return NextResponse.json({ success: false, error: "بيانات البطاقة مفقودة" });
      }

      if (!targetUrl) {
        // Silently succeed or note that Google Sync URL is not yet configured
        return NextResponse.json({
          success: false,
          error: "رابط شيت جوجل غير مضبوط",
          skipped: true,
        });
      }

      const syncResult = await sendToGoogleScript(targetUrl, {
        action: "syncCard",
        card,
        employeeName,
      });

      return NextResponse.json(syncResult);
    }

    // 3. Test Connection
    if (action === "test_connection") {
      if (!targetUrl) {
        return NextResponse.json({
          success: false,
          error: "الرجاء إدخال رابط Google Apps Script Web App لفحصه.",
        });
      }

      const testResult = await sendToGoogleScript(targetUrl, {
        action: "getCards",
      });

      return NextResponse.json(testResult);
    }

    return NextResponse.json({ success: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/google-sync error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
