import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
const COOKIE = "fruit_admin_session"; const TTL = 60 * 60 * 12;
function secret() { const value = process.env.ADMIN_SESSION_SECRET; if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must be at least 32 characters"); return value; }
function sign(payload: string) { return createHmac("sha256", secret()).update(payload).digest("base64url"); }
export async function createAdminSession(username: string) { const payload = Buffer.from(JSON.stringify({ username, exp: Math.floor(Date.now() / 1000) + TTL })).toString("base64url"); (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: TTL }); }
export async function clearAdminSession() { (await cookies()).delete(COOKIE); }
export async function isAdmin() { try { const token = (await cookies()).get(COOKIE)?.value; if (!token) return false; const [payload, signature] = token.split("."); if (!payload || !signature) return false; const expected = sign(payload); if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false; const data = JSON.parse(Buffer.from(payload, "base64url").toString()); return data.exp > Math.floor(Date.now() / 1000) && data.username === process.env.ADMIN_USERNAME; } catch { return false; } }
