import { NextResponse } from "next/server"; import { clearAdminSession, isAdmin } from "@/app/lib/admin-auth";
export async function GET() { return NextResponse.json({ authenticated: await isAdmin() }, { status: (await isAdmin()) ? 200 : 401 }); }
export async function DELETE() { await clearAdminSession(); return NextResponse.json({ success: true }); }
