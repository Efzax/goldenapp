export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }

  const relations = await prisma.userStore.findMany({
    where: { userId },
    select: { storeId: true },
  });

  const storeIds = relations.map((r) => r.storeId);

  return NextResponse.json(storeIds);
}


export async function POST(req: Request) {
  const cookieStore = await cookies();
  const adminId = cookieStore.get("userId")?.value;

  if (!adminId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo ADMIN" }, { status: 403 });
  }

  const { userId, storeIds } = await req.json();
  // storeIds = ["idStore1", "idStore2"]

  // borrar asignaciones previas
  await prisma.userStore.deleteMany({
    where: { userId },
  });

  // crear nuevas asignaciones
  for (const storeId of storeIds) {
    await prisma.userStore.create({
      data: {
        userId,
        storeId,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
