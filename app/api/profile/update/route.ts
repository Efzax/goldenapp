export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function PUT(req: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const body = await req.json();
  const { name } = body;

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { name: name.trim() },
  });

  return NextResponse.json({
    success: true,
    name: updatedUser.name,
  });
}