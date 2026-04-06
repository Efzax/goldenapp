import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { storeCode, sku, familyName, stock, exhib, minStock, category } = body;

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

    // 2️⃣ Buscar o crear familia
    let family = await prisma.productFamily.findUnique({
      where: { name: familyName },
    });

    if (!family) {
      family = await prisma.productFamily.create({
        data: { name: familyName },
      });
    }

    // 3️⃣ Buscar o crear producto
    let product = await prisma.product.findUnique({
      where: { sku },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          sku,
          name: sku, // puedes mejorar esto luego
          familyId: family.id,
          category,
        },
      });
    }

    // 4️⃣ Crear inventario
    await prisma.inventory.create({
      data: {
        storeId: store.id,
        productId: product.id,
        stock,
        exhib,
        minStock,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
