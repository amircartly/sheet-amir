import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const file = url.searchParams.get("file");

    if (file === "Index.html" || file === "html") {
      const filePath = path.join(process.cwd(), "google-apps-script", "Index.html");
      const code = fs.readFileSync(filePath, "utf-8");
      return new Response(code, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": 'attachment; filename="Index.html"',
          "Cache-Control": "no-store",
        },
      });
    }

    const filePath = path.join(process.cwd(), "google-apps-script", "Code.gs");
    const code = fs.readFileSync(filePath, "utf-8");
    return new Response(code, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="Code.gs"',
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
