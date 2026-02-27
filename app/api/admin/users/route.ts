export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

/* =======================
   GET → listar usuarios
   ======================= */
export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { stores: true },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // 🔴 ADMIN
  if (currentUser.role === Role.ADMIN) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        stores: {
          select: {
            store: { select: { id: true, name: true } },
          },
        },
        _count: { select: { stores: true } },
      },
    });

    return NextResponse.json(users);
  }

  // 🟡 SUPERVISOR
  else if (currentUser.role === Role.SUPERVISOR) {
    const storeIds = currentUser.stores.map((s) => s.storeId);

    const users = await prisma.user.findMany({
      where: {
        stores: {
          some: {
            storeId: { in: storeIds },
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        stores: {
          select: {
            store: { select: { id: true, name: true } },
          },
        },
        _count: { select: { stores: true } },
      },
    });

    return NextResponse.json(users);
  }

  // 🔵 USER
  else {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
}

/* =======================
   POST → crear usuario
   ======================= */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo ADMIN" }, { status: 403 });
    }

    const { name, email, password, role, storeIds } = await req.json();

    // 🔒 Validación obligatoria de tiendas
    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      return NextResponse.json(
        { error: "El usuario debe tener al menos una tienda asignada" },
        { status: 400 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 10);

    // 🔒 Transacción segura
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hash,
          role,
        },
      });

      await tx.userStore.createMany({
        data: storeIds.map((storeId: string) => ({
          userId: newUser.id,
          storeId,
        })),
      });

      return newUser;
    });

    return NextResponse.json(user);

  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}