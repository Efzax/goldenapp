import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {

  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  }

  const storeId = params.id;

  // 🔒 Verificar inventario
  const inventoryCount = await prisma.inventory.count({
    where: { storeId },
  });

  if (inventoryCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar. La tienda tiene inventario asociado." },
      { status: 400 }
    );
  }

  // 🔒 Verificar usuarios asignados
  const userCount = await prisma.userStore.count({
    where: { storeId },
  });

  if (userCount > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar. La tienda está asignada a usuarios." },
      { status: 400 }
    );
  }

  await prisma.store.delete({
    where: { id: storeId },
  });

  return NextResponse.json({ ok: true });
}