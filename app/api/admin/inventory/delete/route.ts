export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST(req: Request) {
  try {
    const { storeCode, sku } = await req.json();

    const store = await prisma.store.findUnique({
      where: { code: storeCode },
    });

    const product = await prisma.product.findUnique({
      where: { sku },
    });

    if (!store || !product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.inventory.delete({
      where: {
        storeId_productId: {
          storeId: store.id,
          productId: product.id,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Error deleting" }, { status: 500 });
  }
}
