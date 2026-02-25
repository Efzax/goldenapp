import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { storeCode, sku } = body;

    if (!storeCode || !sku) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // 1️⃣ Buscar tienda
    const store = await prisma.store.findUnique({
      where: { code: storeCode },
    });

    if (!store) {
      return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
    }

    // 2️⃣ Buscar producto
    const product = await prisma.product.findUnique({
      where: { sku },
    });

    if (!product) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    // 3️⃣ Eliminar inventory (solo esa tienda)
    await prisma.inventory.delete({
      where: {
        storeId_productId: {
          storeId: store.id,
          productId: product.id,
        },
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}