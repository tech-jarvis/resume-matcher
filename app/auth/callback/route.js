import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDevsincEmail, mapSupabaseAuthError } from "@/lib/auth";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const authError = mapSupabaseAuthError(searchParams);
  if (authError) {
    return NextResponse.redirect(`${origin}/login?error=${authError}`);
  }

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isDevsincEmail(user.email)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=domain`);
      }

      const dest = new URL(next, origin);
      return NextResponse.redirect(dest.toString());
    }

    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
