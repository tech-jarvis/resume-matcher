import { createAdminClient } from "@/lib/supabase/admin";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function findUserByEmail(email) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findUserById(id) {
  const db = createAdminClient();
  const { data, error } = await db.from("users").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createUser({ email, password, full_name }) {
  const db = createAdminClient();
  const password_hash = await hashPassword(password);
  const { data, error } = await db
    .from("users")
    .insert({
      email: email.trim().toLowerCase(),
      password_hash,
      full_name: full_name?.trim() || "",
      email_verified: true,
    })
    .select("id, email, full_name, email_verified, created_at")
    .single();
  if (error) {
    if (error.code === "23505") throw new Error("An account with this email already exists.");
    throw error;
  }
  return data;
}

export async function verifyUserCredentials(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;
  return user;
}

export async function updateUserPassword(userId, newPassword) {
  const db = createAdminClient();
  const password_hash = await hashPassword(newPassword);
  const { error } = await db.from("users").update({ password_hash }).eq("id", userId);
  if (error) throw error;
}

export async function updateUserProfile(userId, fields) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("users")
    .update(fields)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export function sanitizeUser(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
}
