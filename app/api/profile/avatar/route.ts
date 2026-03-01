export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";
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

    // Validación básica tipo archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${userId}.jpg`;
    const filePath = path.join(process.cwd(), "public/avatars", fileName);

    await writeFile(filePath, buffer);

    const imagePath = `/avatars/${fileName}`;

    await prisma.user.update({
      where: { id: userId },
      data: { image: imagePath },
    });

    return NextResponse.json({
      success: true,
      image: imagePath,
    });

  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}