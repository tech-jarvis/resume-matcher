import { NextResponse } from "next/server";
import { isDevsincEmail, mapSupabaseAuthError } from "@/lib/auth";
import { verifySessionToken } from "@/lib/session";

const COOKIE_NAME = "devsinc_session";
const PUBLIC_PREFIXES = ["/login", "/auth"];

function isPublicPath(pathname) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function updateSession(request) {
  const { pathname, searchParams } = request.nextUrl;

  const authError = mapSupabaseAuthError(searchParams);
  if (authError) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", authError);
    return NextResponse.redirect(url);
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const user = session?.id && isDevsincEmail(session.email) ? session : null;

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
