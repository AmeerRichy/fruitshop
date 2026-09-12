import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { fallbackProducts } from "@/app/lib/fallback-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const client = await clientPromise;
    const db = client.db("elegance_essentials");
    const product = await db.collection("products").findOne({ slug, archived: { $ne: true } });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const related = await db.collection("products").find({ category: product.category, _id: { $ne: product._id }, archived: { $ne: true } }).limit(4).toArray();
    const formattedProduct = {
      ...product,
      id: product._id.toString(),
      _id: undefined,
      related: related.map(({ _id, ...p }) => ({ ...p, id: _id.toString() }))
    };

    return NextResponse.json(formattedProduct);
  } catch (e) {
    const { slug } = await params;
    const product = fallbackProducts.find((item) => item.slug === slug);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ ...product, related: fallbackProducts.filter((item) => item.slug !== slug).slice(0, 4) }, { headers: { "x-data-source": "fallback" } });
  }
}
