export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    }

    // 🔥 Nombre único para evitar cache
    const blob = await put(
      `avatars/${userId}-${Date.now()}.jpg`,
      file,
      {
        access: "public",
      }
    );

    // Guardar URL pública en DB
    await prisma.user.update({
      where: { id: userId },
      data: { image: blob.url },
    });

    return NextResponse.json({
      success: true,
      image: blob.url,
    });

  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}