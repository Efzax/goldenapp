export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { stores: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // 🔴 ADMIN → todas las tiendas
  if (user.role === Role.ADMIN) {
    const stores = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(stores);
  }

  // 🟡 SUPERVISOR y USER → solo asignadas
  const stores = await prisma.store.findMany({
    where: {
      users: {
        some: {
          userId: user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(stores);
}
