export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function calculateStatus(stockTotal: number, min: number) {
  if (stockTotal <= min * 0.5) return "CRITICO";
  if (stockTotal < min) return "BAJO";
  return "OK";
}

export async function POST() {
  // Datos fijos por ahora
  const storeCode = "PMA";
  const sku = "QN43Q7FAAGXZS";

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

  const stock = 7;
  const exhib = false;
  const minStock = 8;

  const inventory = await prisma.inventory.create({
    data: {
      storeId: store.id,
      productId: product.id,
      stock,
      exhib,
      minStock,
    },
  });

  const stockTotal = stock + (exhib ? 1 : 0);
  const status = calculateStatus(stockTotal, minStock);
  const empuje = Math.max(minStock - stockTotal, 0);

  return NextResponse.json({
    inventory,
    stockTotal,
    status,
    empuje,
  });
}
