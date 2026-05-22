import { isDevsincEmail } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { sanitizeUser, verifyUserCredentials } from "@/lib/users";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (!isDevsincEmail(email)) {
      return Response.json(
        { error: "Only @devsinc.com email addresses can sign in." },
        { status: 400 }
      );
    }

    const user = await verifyUserCredentials(email, password);
    if (!user) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await setSessionCookie(user);

    return Response.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Signin error:", err);
    return Response.json(
      { error: err.message ?? "Sign in failed." },
      { status: 500 }
    );
  }
}
