import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { sendToGoogleScript, fetchFromGoogleScript } from "@/lib/googleSync";
import { DEFAULT_GOOGLE_SCRIPT_URL } from "@/lib/constants";

function resolveScriptUrl(scriptUrl?: string): string {
  let url = (scriptUrl || "").trim();
  if (!url) {
    url =
      (process.env.GOOGLE_SHEETS_WEBAPP_URL || "").trim() ||
      (process.env.GOOGLE_SHEET_URL || "").trim() ||
      DEFAULT_GOOGLE_SCRIPT_URL ||
      "";
  }
  return url;
}

// Normalizes a card coming from Google Sheets into standard BankCard shape
function normalizeCard(c: any): any {
  const code = (c.code || c.id || "").toString().trim();
  const name = (c.name || c.clientName || "").toString().trim();
  const depositAmt = parseFloat(c.depositAmt) || 0;
  const cardPrice = parseFloat(c.cardPrice) || 0;
  let totalCost = depositAmt + cardPrice;
  if (typeof c.totalCost === "number" && !isNaN(c.totalCost) && c.totalCost > 0) {
    totalCost = c.totalCost;
  }

  return {
    id: code,
    code: code,
    name: name,
    nationalId: (c.nationalId || "").toString().trim(),
    cblPhone: (c.cblPhone || "").toString().trim(),
    bank: c.bank || "مصرف التجارة والتنمية",
    accountNumber: (c.accountNumber || "").toString().trim(),
    iban: (c.iban || "").toString().trim(),
    depositAmt,
    cardPrice,
    totalCost,
    depositDate: (c.depositDate || "").toString().trim(),
    bookingDate: (c.bookingDate || "").toString().trim(),
    cardNum: (c.cardNum || c.cardNumber || "").toString().trim(),
    pinLocal: (c.pinLocal || "").toString().trim(),
    pinDollar: (c.pinDollar || "").toString().trim(),
    expiry: (c.expiry || c.expiryDate || "09/29").toString().trim(),
    status: (c.status || "1. إدخال البيانات").toString().trim(),
    notes: (c.notes || "").toString().trim(),
    refSlipNo: (c.refSlipNo || "").toString().trim(),
    withdrawLocation: (c.withdrawLocation || "").toString().trim(),
    usdAmount: parseFloat(c.usdAmount) || 0,
    rate: parseFloat(c.rate) || 0,
    netProfitLYD: parseFloat(c.netProfitLYD) || 0,
    destinationVault: (c.destinationVault || "").toString().trim(),
    createdAt: c.createdAt || new Date().toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = resolveScriptUrl(searchParams.get("scriptUrl") || undefined);
    const action = searchParams.get("action") || "getCards";

    if (!targetUrl) {
      return NextResponse.json({
        success: false,
        error: "رابط Google Apps Script Web App غير محدد",
      });
    }

    if (action === "getTreasury") {
      let result = await fetchFromGoogleScript(targetUrl, "getTreasury");
      if (!result.success || !Array.isArray((result as any).treasury)) {
        result = await sendToGoogleScript(targetUrl, { action: "getTreasury" });
      }
      return NextResponse.json(result);
    }

    // Use GET fetch first (fastest and most reliable for Google Apps Script Web Apps)
    let result = await fetchFromGoogleScript(targetUrl, "getCards");
    if (!result.success || !Array.isArray(result.cards)) {
      result = await sendToGoogleScript(targetUrl, { action: "getCards" });
    }

    if (result.success && Array.isArray(result.cards)) {
      result.cards = result.cards.map(normalizeCard);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("GET /api/google-sync error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, scriptUrl, card, cards, employeeName = "موقع المنظومة" } = body;

    const targetUrl = resolveScriptUrl(scriptUrl);

    // 0. Get Cards from Google Sheets
    if (action === "get_cards") {
      if (!targetUrl) {
        return NextResponse.json({
          success: false,
          error: "الرجاء إدخال رابط Google Apps Script Web App الخاص بالشيت أولاً.",
        });
      }

      // Try GET request first
      let syncResult = await fetchFromGoogleScript(targetUrl, "getCards");
      if (!syncResult.success || !Array.isArray(syncResult.cards)) {
        syncResult = await sendToGoogleScript(targetUrl, { action: "getCards" });
      }

      if (syncResult.success && Array.isArray(syncResult.cards)) {
        syncResult.cards = syncResult.cards.map(normalizeCard);
      }

      return NextResponse.json(syncResult);
    }

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

      // Also sync treasury balances if provided
      if (Array.isArray(body.vaults) && body.vaults.length > 0) {
        try {
          await sendToGoogleScript(targetUrl, {
            action: "syncTreasury",
            vaults: body.vaults,
            employeeName,
          });
        } catch (tErr) {
          console.error("Treasury sync within export_all failed:", tErr);
        }
      }

      return NextResponse.json(syncResult);
    }

    // 2. Live Sync Single Card
    if (action === "sync_card") {
      if (!card) {
        return NextResponse.json({ success: false, error: "بيانات البطاقة مفقودة" });
      }

      if (!targetUrl) {
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

      let testResult = await fetchFromGoogleScript(targetUrl, "getCards");
      if (!testResult.success) {
        testResult = await sendToGoogleScript(targetUrl, { action: "getCards" });
      }

      if (testResult.success) {
        return NextResponse.json({
          success: true,
          message: "الاتصال بشيت جوجل ناجح وجاهز",
          cardCount: Array.isArray(testResult.cards) ? testResult.cards.length : 0,
        });
      }

      return NextResponse.json(testResult);
    }

    // 4. Sell Accumulated USD
    if (action === "sell_usd") {
      if (!targetUrl) {
        return NextResponse.json({ success: true, message: "تم تحديث الخزائن محلياً" });
      }

      const syncResult = await sendToGoogleScript(targetUrl, {
        action: "sellUsd",
        sellData: body.sellData,
        employeeName,
      });

      return NextResponse.json(syncResult);
    }

    // 5. Sync Treasury Balances (Export Vaults to Google Sheets)
    if (action === "sync_treasury") {
      const vaultsList = body.vaults || [];
      if (!Array.isArray(vaultsList) || vaultsList.length === 0) {
        return NextResponse.json({ success: false, error: "قائمة الخزائن مفقودة" });
      }

      if (!targetUrl) {
        return NextResponse.json({
          success: false,
          error: "الرجاء إدخال رابط Google Apps Script Web App أولاً",
        });
      }

      const syncResult = await sendToGoogleScript(targetUrl, {
        action: "syncTreasury",
        vaults: vaultsList,
        employeeName,
      });

      // Detect if remote Apps Script is still running the old code without syncTreasury handler
      if (
        syncResult.success &&
        (syncResult as any).updated === undefined &&
        ((syncResult as any).message || "").includes("نشط وجاهز")
      ) {
        return NextResponse.json({
          success: false,
          needsScriptUpdate: true,
          error:
            "⚠️ تنبيه: كود Google Apps Script المنشور في شيت جوجل قديم ولا يحتوي على كود مزامنة الخزائن. يرجى الضغط على زر (نسخ الكود كاملاً) وتحديث الكود في الشيت ثم عمل New version.",
        });
      }

      return NextResponse.json(syncResult);
    }

    // 6. Get Treasury Balances from Google Sheets
    if (action === "get_treasury") {
      if (!targetUrl) {
        return NextResponse.json({
          success: false,
          error: "الرجاء إدخال رابط Google Apps Script Web App أولاً",
        });
      }

      let syncResult = await fetchFromGoogleScript(targetUrl, "getTreasury");
      if (!syncResult.success || !Array.isArray((syncResult as any).treasury)) {
        syncResult = await sendToGoogleScript(targetUrl, { action: "getTreasury" });
      }

      return NextResponse.json(syncResult);
    }

    return NextResponse.json({ success: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/google-sync error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
