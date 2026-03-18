import { NextResponse } from 'next/server';
import { getLinkPreview } from 'link-preview-js';
import { connectToDatabase } from '@/lib/mongodb';
import Item from '@/lib/Item';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { url, action } = body;

    if (action === 'FETCH_PREVIEW') {
      // Ép kiểu về any để tránh lỗi TypeScript nghiêm ngặt của link-preview-js
      const data = await getLinkPreview(url, {
        followRedirects: 'follow',
      }) as any;

      return NextResponse.json({
        success: true,
        preview: {
          title: data.title || "No title found",
          description: data.description || "",
          imageUrl: data.images?.length > 0 ? data.images[0] : (data.favicons?.length > 0 ? data.favicons[0] : ''),
          url: url
        }
      });
    }

    if (action === 'SAVE_ITEM') {
      const newItem = await Item.create({
        title: body.title,
        description: body.description,
        url: body.url,
        imageUrl: body.imageUrl,
        type: body.type,
        tags: body.tags || ['Tech'],
        collectionId: body.collectionId || 'default',
      });
      return NextResponse.json({ success: true, data: newItem });
    }
    // Thêm vào trong hàm POST của route.ts
    if (action === 'DELETE_ITEM') {
      await Item.findByIdAndDelete(body.id);
      return NextResponse.json({ success: true, message: "Đã xóa thành công!" });
    }

    if (action === 'UPDATE_ITEM') {
      const updated = await Item.findByIdAndUpdate(body.id, {
        title: body.title,
        description: body.description,
        tags: body.tags
      }, { new: true });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, message: "Invalid action" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Item.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 });
  }
}