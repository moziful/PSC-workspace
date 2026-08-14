import { NextResponse } from "next/server";
import { getCustomCliparts, saveCustomClipart } from "@/lib/db";

export async function GET() {
  try {
    const list = await getCustomCliparts();
    return NextResponse.json({ success: true, cliparts: list });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const nameEnglish = formData.get("nameEnglish");
    const nameBangla = formData.get("nameBangla");
    const imageFile = formData.get("image");

    if (!nameEnglish || !imageFile) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "ImgBB API key not configured on server" }, { status: 500 });
    }

    // Convert file to base64 for ImgBB API
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Upload to ImgBB
    const imgbbFormData = new FormData();
    imgbbFormData.append("image", base64Image);

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: imgbbFormData
    });

    const imgbbData = await imgbbRes.json();
    if (!imgbbData.success) {
      return NextResponse.json({ success: false, error: imgbbData.error?.message || "Failed to upload to ImgBB" }, { status: 500 });
    }

    const imageUrl = imgbbData.data.url;
    const clipartId = `custom_${Math.random().toString(36).substring(2, 9)}`;

    const newClipart = {
      id: clipartId,
      nameEnglish,
      nameBangla: nameBangla || "",
      url: imageUrl,
      isCustom: true
    };

    await saveCustomClipart(newClipart);

    return NextResponse.json({ success: true, clipart: newClipart });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
