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
      // If HTML was returned, it might be a Google Auth interstitial
      if (text.includes("accounts.google.com") || text.includes("Page Not Found")) {
        return {
          success: false,
          error: "تنبيه: يتطلب نشر تطبيق Google Apps Script إتاحة الوصول للجميع (Anyone) ليعمل التحديث الحي دون مصادقة.",
        };
      }
      return { success: true, message: text.slice(0, 150) };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "فشل الاتصال برابط شيت جوجل" };
  }
}
