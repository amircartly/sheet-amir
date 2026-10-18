import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // If DISABLE_BASIC_AUTH is set to "true" (or in preview mode), bypass HTTP Basic Auth
  // because the application now has a full in-app modern login portal gate with 3 roles and PIN verification.
  if (process.env.DISABLE_BASIC_AUTH === "true" || process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  const basicAuth = req.headers.get("authorization");

  if (basicAuth) {
    const authValue = basicAuth.split(" ")[1];
    if (authValue) {
      try {
        // Decode base64 credentials
        const decoded = atob(authValue);
        const colonIndex = decoded.indexOf(":");
        if (colonIndex !== -1) {
          const user = decoded.substring(0, colonIndex);
          const pwd = decoded.substring(colonIndex + 1);

          const expectedUser = process.env.BASIC_AUTH_USER || "amiralzwe";
          const expectedPass = process.env.BASIC_AUTH_PASS || "Tt@100100";

          if (user === expectedUser && pwd === expectedPass) {
            return NextResponse.next();
          }
        }
      } catch {
        // In case of malformed base64
      }
    }
  }

  return new NextResponse("Authentication Required - يرجى تسجيل الدخول لمنظومة أمير", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure AMIR Cards System"',
    },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
