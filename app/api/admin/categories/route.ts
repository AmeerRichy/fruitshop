export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import clientPromise from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";
import { isAdmin } from "@/app/lib/admin-auth";


export async function GET(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("elegance_essentials");
    const categories = await db.collection("categories").find({}).toArray();
    return NextResponse.json(categories);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("elegance_essentials");
    const body = await req.json();

    const result = await db.collection("categories").insertOne(body);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("elegance_essentials");
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id || !ObjectId.isValid(_id)) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }

    const categoryId = new ObjectId(_id);

    // Fetch the old category name before updating
    const oldCategory = await db.collection("categories").findOne({ _id: categoryId });

    const result = await db.collection("categories").updateOne(
      { _id: categoryId },
      { $set: updateData }
    );

    // If the category name was updated, cascade the update to the products collection
    if (result.modifiedCount > 0 && oldCategory && oldCategory.name !== updateData.name) {
      await db.collection("products").updateMany(
        { category: oldCategory.name },
        { $set: { category: updateData.name } }
      );
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("Failed to update category:", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("elegance_essentials");
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const result = await db.collection("categories").deleteMany({
      _id: { $in: ids.map((id: string) => new ObjectId(id)) }
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
