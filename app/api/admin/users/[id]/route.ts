import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const allowedRoles = ["ADMIN", "SUPERVISOR", "MERCHAND", "USER"];

/* =======================
   PUT → actualizar usuario
   ======================= */
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("userId")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo ADMIN" }, { status: 403 });
    }

    const { name, email, password, role, storeIds } = await req.json();

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rol inválido" },
        { status: 400 }
      );
    }

    // 🔒 Validar tiendas
    if (!storeIds || !Array.isArray(storeIds) || storeIds.length === 0) {
      return NextResponse.json(
        { error: "El usuario debe tener al menos una tienda asignada" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {

      // 1️⃣ Actualizar datos básicos
      await tx.user.update({
        where: { id },
        data: {
          name,
          email,
          role,
          ...(password
            ? { password: await bcrypt.hash(password, 10) }
            : {}),
        },
      });

      // 2️⃣ Borrar relaciones actuales
      await tx.userStore.deleteMany({
        where: { userId: id },
      });

      // 3️⃣ Crear nuevas relaciones
      await tx.userStore.createMany({
        data: storeIds.map((storeId: string) => ({
          userId: id,
          storeId,
        })),
      });
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("UPDATE USER ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}

/* =======================
   DELETE → eliminar usuario
   ======================= */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get("userId")?.value;

    if (!sessionUserId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (sessionUserId === id) {
      return NextResponse.json(
        { error: "No puedes eliminarte a ti mismo" },
        { status: 400 }
      );
    }

    const admin = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo ADMIN" }, { status: 403 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error("DELETE USER ERROR:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
