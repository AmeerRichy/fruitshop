export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { fallbackCategories, fallbackProducts } from "@/app/lib/fallback-data";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || "12"), 1),
      50
    );

    const search = String(searchParams.get("search") || "").trim();
    const cat = String(searchParams.get("category") || searchParams.get("cat") || "all").trim().toLowerCase();
    const sort = String(searchParams.get("sort") || "recommended");
    const availability = searchParams.get("availability");
    const maxPrice = Number(searchParams.get("maxPrice") || 0);

    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("elegance_essentials");

    const query: any = { archived: { $ne: true } };
    if (availability === "in-stock") query.$and = [{ available: true }, { stock: { $gt: 0 } }];
    if (maxPrice > 0) query.price = { $lte: maxPrice };

    if (cat && cat !== "all") {
      const category = await db.collection("categories").findOne({
        value: cat,
      });

      const categoryName = category?.name || cat;

      query.category = {
        $regex: `^${escapeRegex(categoryName)}$`,
        $options: "i",
      };
    }

    if (search) {
      const safeSearch = escapeRegex(search);

      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { slug: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const productsCollection = db.collection("products");

    const sorts: Record<string, any> = { "price-low": { price: 1 }, "price-high": { price: -1 }, newest: { createdAt: -1 }, popular: { popular: -1, createdAt: -1 }, discount: { compareAtPrice: -1 }, recommended: { featured: -1, popular: -1, createdAt: -1 } };
    const [products, total] = await Promise.all([
      productsCollection
        .find(query)
        .sort(sorts[sort] || sorts.recommended)
        .skip(skip)
        .limit(limit)
        .project({
          name: 1,
          slug: 1,
          price: 1,
          compareAtPrice: 1, discountPrice: 1,
          category: 1,
          image: 1, images: 1, shortDescription: 1, description: 1, unit: 1, minQuantity: 1, maxQuantity: 1, quantityIncrement: 1, stock: 1, available: 1, featured: 1, freshPick: 1, popular: 1, origin: 1, grade: 1,
        })
        .toArray(),

      productsCollection.countDocuments(query),
    ]);

    const formattedProducts = products.map((product) => {
      const { _id, ...rest } = product;

      return {
        ...rest,
        id: _id.toString(),
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (e) {
    const { searchParams } = new URL(req.url); const search=(searchParams.get("search")||"").toLowerCase(); const cat=(searchParams.get("category")||searchParams.get("cat")||"all").toLowerCase(); const max=Number(searchParams.get("maxPrice")||0); const categoryName=fallbackCategories.find(c=>c.value===cat)?.name;
    const products=fallbackProducts.filter(p=>(!search||`${p.name} ${p.category} ${p.description} ${p.keywords.join(" ")}`.toLowerCase().includes(search))&&(cat==="all"||p.category.toLowerCase()===String(categoryName||cat).toLowerCase())&&(!max||p.price<=max));
    const sort=searchParams.get("sort"); if(sort==="price-low")products.sort((a,b)=>a.price-b.price);if(sort==="price-high")products.sort((a,b)=>b.price-a.price);
    return NextResponse.json({products,total:products.length,page:1,limit:products.length,totalPages:1,hasMore:false,databaseAvailable:false},{headers:{"x-data-source":"fallback"}});
  }
}
