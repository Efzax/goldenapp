export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function calculateStatus(stockTotal: number, min: number) {
  if (stockTotal <= min * 0.5) return "CRITICO";
  if (stockTotal < min) return "BAJO";
  return "OK";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  const storeCode = parts[parts.length - 1];
  const categoryParam = url.searchParams.get("category");

  const category = categoryParam === "AV" ? "AV" : "TV";

  if (!storeCode) {
    return NextResponse.json(
      { error: "storeCode missing from URL" },
      { status: 400 }
    );
  }

  const store = await prisma.store.findUnique({
    where: { code: storeCode },
  });

  if (!store) {
    return NextResponse.json(
      { error: "Store not found" },
      { status: 404 }
    );
  }

  const inventory = await prisma.inventory.findMany({
    where: {
      storeId: store.id,
      product: {
        is: {
          category: category,
        },
      },
    },
include: {
  product: {
    include: {
      family: true,
      classifications: {
        where: {
          storeId: store.id,
        },
      },
    },
  },
},
  });

  const result = inventory.map((item: any) => {
    const stockTotal = item.stock + (item.exhib ? 1 : 0);
    const status = calculateStatus(stockTotal, item.minStock);
    const empuje = Math.max(item.minStock - stockTotal, 0);
const classification =
  item.product.classifications[0]?.type || null;

return {
  sku: item.product.sku,
  family: item.product.family.name,
  stock: item.stock,
  exhib: item.exhib,
  min: item.minStock,
  stockTotal,
  status,
  empuje,
  type: classification, // 👈 NUEVO
};
  });

// 🔹 Obtener mes activo
const meta = await prisma.classificationMeta.findFirst({
  orderBy: { createdAt: "desc" },
});

return NextResponse.json({
  storeName: store.name,
  month: meta?.month || null,
  items: result,
});
}

