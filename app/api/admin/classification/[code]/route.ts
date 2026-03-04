export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;

    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const parts = url.pathname.split("/");
    const storeCode = parts[parts.length - 1];

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

    const classifications = await prisma.productClassification.findMany({
      where: {
        storeId: store.id,
      },
      include: {
        product: true,
      },
    });

    const result = classifications.map((item) => ({
      sku: item.product.sku,
      type: item.type,
    }));

    return NextResponse.json({
      storeName: store.name,
      items: result,
    });

  } catch (error) {
    console.error("Classification GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}