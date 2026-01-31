import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    const store = await prisma.store.findUnique({
      where: { code: params.code },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: store.name,
      code: store.code,
    });
  } catch (err) {
    console.error("STORE API ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

