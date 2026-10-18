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
