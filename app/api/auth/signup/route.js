import { isDevsincEmail } from "@/lib/auth";
import { setSessionCookie } from "@/lib/session";
import { createUser, sanitizeUser } from "@/lib/users";

export async function POST(request) {
  try {
    const { email, password, full_name } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (!isDevsincEmail(email)) {
      return Response.json(
        { error: "Only @devsinc.com email addresses can register." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const user = await createUser({ email, password, full_name });
    await setSessionCookie(user);

    return Response.json({
      user: sanitizeUser(user),
      message: "Account created. You are now signed in.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    return Response.json(
      { error: err.message ?? "Signup failed." },
      { status: 400 }
    );
  }
}
