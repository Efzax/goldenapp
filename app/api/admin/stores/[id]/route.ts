import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {

  const { id } = await context.params;

  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  }

  // 🔒 Verificar inventario
  const inventoryCount = await prisma.inventory.count({
    where: { storeId: id },
  });

  if (inventoryCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar. La tienda tiene inventario asociado." },
      { status: 400 }
    );
  }

  // 🔒 Verificar usuarios asignados
  const userCount = await prisma.userStore.count({
    where: { storeId: id },
  });

  if (userCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar. La tienda está asignada a usuarios." },
      { status: 400 }
    );
  }

  await prisma.store.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}