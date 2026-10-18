/**
 * Google Apps Script & Google Sheets Sync Utility
 */

export interface GoogleSyncResult {
  success: boolean;
  message?: string;
  error?: string;
  updated?: number;
  inserted?: number;
  total?: number;
  cards?: any[];
  treasury?: any[];
}

/**
 * Sends a POST request to Google Apps Script Web App URL.
 * Handles HTTP 302 redirects properly (Google Apps Script standard redirect).
 */
export async function sendToGoogleScript(
  scriptUrl: string,
  payload: Record<string, any>
): Promise<GoogleSyncResult> {
  const cleanUrl = scriptUrl.trim();
  if (!cleanUrl) {
    return { success: false, error: "رابط Google Apps Script Web App غير محدد" };
  }

  try {
    const res = await fetch(cleanUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          error:
            "خطأ (404 Not Found): هذا الرابط غير نشط أو تم حذفه/أرشفته في جوجل. يرجى فتح (إدارة عمليات النشر) في الشيت والضغط على زر (نسخ) الأزرق تحت عنوان URL ولصقه هنا.",
        };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          error:
            "خطأ في الصلاحيات: يرجى التأكد من ضبط إعداد (من يملك حق الوصول) على (أي شخص / Anyone) عند نشر تطبيق الويب في Google Apps Script.",
        };
      }
      return {
        success: false,
        error: `خطأ في استجابة الخادم: كود (${res.status} ${res.statusText})`,
      };
    }

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return json;
    } catch {
      // If HTML was returned, check for known errors
      if (text.includes("accounts.google.com") || text.includes("Page Not Found")) {
        return {
          success: false,
          error:
            "تنبيه: يتطلب نشر تطبيق Google Apps Script إتاحة الوصول للجميع (Anyone) ليعمل التحديث الحي دون مصادقة.",
        };
      }
      if (text.includes("ReferenceError") && text.includes("getTreasuryBalances")) {
        return {
          success: false,
          error:
            "⚠️ تنبيه: كود شيت جوجل المنشور قديم ولا يحتوي على كود مزامنة الخزائن. يرجى نسخ الكود كاملاً وتحديث Code.gs ثم عمل إصدار جديد (New version).",
        };
      }
      if (text.includes("ReferenceError") || text.includes("Exception:")) {
        const cleanMsg = text.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
        return {
          success: false,
          error: `⚠️ تنبيه في شيت جوجل: ${cleanMsg.slice(0, 150)} - يرجى نسخ الكود كاملاً وتحديث Code.gs`,
        };
      }
      return { success: true, message: text.slice(0, 150) };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "فشل الاتصال برابط شيت جوجل" };
  }
}

/**
 * Fetches data via GET from Google Apps Script Web App URL
 */
export async function fetchFromGoogleScript(
  scriptUrl: string,
  action: string = "getCards"
): Promise<GoogleSyncResult> {
  const cleanUrl = scriptUrl.trim();
  if (!cleanUrl) {
    return { success: false, error: "رابط Google Apps Script Web App غير محدد" };
  }

  try {
    const urlWithAction = `${cleanUrl}${cleanUrl.includes("?") ? "&" : "?"}action=${encodeURIComponent(action)}`;
    const res = await fetch(urlWithAction, {
      method: "GET",
      redirect: "follow",
    });

    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          error:
            "خطأ (404 Not Found): هذا الرابط غير نشط أو تم حذفه/أرشفته في جوجل. يرجى فتح (إدارة عمليات النشر) في الشيت والضغط على زر (نسخ) الأزرق تحت عنوان URL ولصقه هنا.",
        };
      }
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          error:
            "خطأ في الصلاحيات: يرجى التأكد من ضبط إعداد (من يملك حق الوصول) على (أي شخص / Anyone) عند نشر تطبيق الويب في Google Apps Script.",
        };
      }
      return {
        success: false,
        error: `خطأ في استجابة الخادم: كود (${res.status} ${res.statusText})`,
      };
    }

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        return { success: true, cards: json };
      }
      return json;
    } catch {
      if (text.includes("accounts.google.com") || text.includes("Page Not Found")) {
        return {
          success: false,
          error: "تنبيه: يتطلب نشر تطبيق Google Apps Script إتاحة الوصول للجميع (Anyone).",
        };
      }
      if (text.includes("ReferenceError") && text.includes("getTreasuryBalances")) {
        return {
          success: false,
          error:
            "⚠️ تنبيه: كود شيت جوجل المنشور قديم ولا يحتوي على كود مزامنة الخزائن. يرجى نسخ الكود كاملاً وتحديث Code.gs ثم عمل إصدار جديد (New version).",
        };
      }
      if (text.includes("ReferenceError") || text.includes("Exception:")) {
        const cleanMsg = text.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
        return {
          success: false,
          error: `⚠️ تنبيه في شيت جوجل: ${cleanMsg.slice(0, 150)} - يرجى نسخ الكود كاملاً وتحديث Code.gs`,
        };
      }
      return { success: false, error: "استجابة غير متوقعة من شيت جوجل" };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "فشل جلب البيانات من شيت جوجل" };
  }
}
