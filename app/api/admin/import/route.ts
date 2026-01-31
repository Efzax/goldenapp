export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { Category } from "@prisma/client";

type Row = {
  category: string;
  storeName: string;
  sku: string;
  family: string;
  stock: number;
  exhib: boolean;
  minStock: number;
};

export async function POST(req: Request) {
  const rows: Row[] = await req.json();

  for (const row of rows) {
    // NORMALIZAR A MAYÚSCULAS
    const storeName = row.storeName.toUpperCase().trim();
    const familyName = row.family.toUpperCase().trim();
    const sku = row.sku.toUpperCase().trim();
    const category = row.category.toUpperCase().trim() as Category;

    // BUSCAR TIENDA
    let store = await prisma.store.findFirst({
      where: { name: storeName },
    });

    if (!store) continue;

    // BUSCAR O CREAR FAMILIA
    let family = await prisma.productFamily.findFirst({
      where: { name: familyName },
    });

    if (!family) {
      family = await prisma.productFamily.create({
        data: { name: familyName },
      });
    }

    // BUSCAR O CREAR PRODUCTO
    let product = await prisma.product.findUnique({
      where: { sku },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          sku,
          name: sku,
          familyId: family.id,
          category,
        },
      });
    }

    // UPSERT INVENTARIO
    await prisma.inventory.upsert({
      where: {
        storeId_productId: {
          storeId: store.id,
          productId: product.id,
        },
      },
      update: {
        stock: row.stock,
        exhib: row.exhib,
        minStock: row.minStock,
      },
      create: {
        storeId: store.id,
        productId: product.id,
        stock: row.stock,
        exhib: row.exhib,
        minStock: row.minStock,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
