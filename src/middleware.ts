import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const password = process.env.HQ_PASSWORD;

  if (!password) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("HQ password is not configured.", { status: 503 });
    }

    return NextResponse.next();
  }

  const username = process.env.HQ_USERNAME ?? "jack";
  const authorization = request.headers.get("authorization");
  const credentials = readBasicAuth(authorization);

  if (credentials?.username === username && credentials.password === password) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Jack\'s Cookies HQ"',
    },
  });
}

function readBasicAuth(authorization: string | null) {
  if (!authorization) return null;

  const [scheme, encoded] = authorization.split(" ");
  if (scheme !== "Basic" || !encoded) return null;

  try {
    const decoded = atob(encoded);
    const separator = decoded.indexOf(":");
    if (separator === -1) return null;

    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1),
    };
  } catch {
    return null;
  }
}

export const config = {
  matcher: "/hq/:path*",
};
