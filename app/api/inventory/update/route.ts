export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  const role = cookieStore.get("role")?.value;

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (role !== "ADMIN" && role !== "SUPERVISOR" && role !== "USER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { storeCode, sku, stock, exhib, minStock } = body;

  const store = await prisma.store.findUnique({
    where: { code: storeCode },
  });

  const product = await prisma.product.findUnique({
    where: { sku },
  });

  if (!store || !product) {
    return NextResponse.json(
      { error: "Store or Product not found" },
      { status: 404 }
    );
  }

  if (role !== "ADMIN") {
    const relation = await prisma.userStore.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId: store.id,
        },
      },
    });

    if (!relation) {
      return NextResponse.json(
        { error: "Tienda no asignada al usuario" },
        { status: 403 }
      );
    }
  }

  const inventory = await prisma.inventory.update({
    where: {
      storeId_productId: {
        storeId: store.id,
        productId: product.id,
      },
    },
    data: {
      stock: Number(stock),
      exhib: Boolean(exhib),
      ...(minStock !== undefined && {
        minStock: Number(minStock),
      }),
    },
  });

  return NextResponse.json(inventory);
}
