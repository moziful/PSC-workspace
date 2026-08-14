import { NextResponse } from "next/server";
import { getPapers, savePaper, deletePaper } from "@/lib/db";

export async function GET() {
  try {
    const papers = await getPapers();
    return NextResponse.json({ success: true, papers });
  } catch (err) {
    console.error("API GET papers error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body) {
      return NextResponse.json({ success: false, error: "Missing body data" }, { status: 400 });
    }
    const saved = await savePaper(body);
    return NextResponse.json({ success: true, paper: saved });
  } catch (err) {
    console.error("API POST save paper error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing paper ID" }, { status: 400 });
    }
    const success = await deletePaper(id);
    return NextResponse.json({ success });
  } catch (err) {
    console.error("API DELETE paper error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
