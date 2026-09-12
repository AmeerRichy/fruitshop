import { NextResponse } from "next/server";
import { createAdminSession } from "@/app/lib/admin-auth";
import { rateLimit } from "@/app/lib/rate-limit";
import { timingSafeEqual } from "crypto";

function equal(a: string, b: string) { const aa = Buffer.from(a); const bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb); }

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || "");
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required." },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (!rateLimit(`admin:${ip}`, 5, 15 * 60_000)) return NextResponse.json({ success: false, error: "Too many attempts. Try again later." }, { status: 429 });
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !equal(username, process.env.ADMIN_USERNAME) || !equal(password, process.env.ADMIN_PASSWORD)) {
      return NextResponse.json(
        { success: false, error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    await createAdminSession(username);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Login failed." },
      { status: 500 }
    );
  }
}
