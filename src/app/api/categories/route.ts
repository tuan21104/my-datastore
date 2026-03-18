import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/mongodb";
import mongoose from "mongoose";

// Định nghĩa Schema đơn giản cho Category
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);

export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, action, id } = body;

    if (action === "DELETE") {
      if (!id) {
        return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
      }
      await Category.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    }

    if (!name) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }
    const newCat = await Category.create({ name });
    return NextResponse.json({ success: true, data: newCat });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to process request" }, { status: 500 });
  }
}