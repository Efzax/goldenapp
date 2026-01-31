export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { storeCode, sku, stock, exhib } = body;

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

  // 👇 BUSCAMOS EL INVENTARIO ACTUAL
  const currentInventory = await prisma.inventory.findUnique({
    where: {
      storeId_productId: {
        storeId: store.id,
        productId: product.id,
      },
    },
  });

  if (!currentInventory) {
    return NextResponse.json(
      { error: "Inventory not found" },
      { status: 404 }
    );
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
      minStock: currentInventory.minStock, // 👈 SE REENVÍA
    },
  });

  return NextResponse.json(inventory);
}

