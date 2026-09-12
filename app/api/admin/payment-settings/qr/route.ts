import { createHash, randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/app/lib/admin-auth";

export const runtime = "nodejs";
const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cloud = process.env.CLOUDINARY_CLOUD_NAME, key = process.env.CLOUDINARY_API_KEY, secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) return NextResponse.json({ error: "Configure the server-side Cloudinary credentials before uploading." }, { status: 503 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || !allowed.has(file.type) || file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Upload a JPG, PNG or WEBP image up to 5 MB." }, { status: 400 });
  const timestamp = Math.floor(Date.now() / 1000), folder = "fruit-shop/raast-qr", publicId = `raast-${randomUUID()}`;
  const signature = createHash("sha1").update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${secret}`).digest("hex");
  const data = new FormData(); data.set("file", file); data.set("api_key", key); data.set("timestamp", String(timestamp)); data.set("folder", folder); data.set("public_id", publicId); data.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: data });
  const result = await response.json();
  if (!response.ok || !result.secure_url) return NextResponse.json({ error: "QR upload failed." }, { status: 502 });
  return NextResponse.json({ url: result.secure_url });
}
