export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { Category } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { storeCode, sku, familyName, stock, exhib, minStock, category } =
      await req.json();

    const store = await prisma.store.findUnique({
      where: { code: storeCode },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const family = await prisma.productFamily.findFirst({
      where: {
        name: {
          equals: familyName.toUpperCase(),
          mode: "insensitive",
        },
      },
    });

    if (!family) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 });
    }

    let product = await prisma.product.findUnique({
      where: { sku: sku.toUpperCase() },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          sku: sku.toUpperCase(),
          name: sku.toUpperCase(),
          familyId: family.id,
          category: category === "AV" ? Category.AV : Category.TV,
        },
      });
    }

    await prisma.inventory.create({
      data: {
        storeId: store.id,
        productId: product.id,
        stock: Number(stock),
        exhib: Boolean(exhib),
        minStock: Number(minStock),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Error creating inventory" }, { status: 500 });
  }
}
