export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;
    const userId = cookieStore.get("userId")?.value;

    if (!userId || (role !== "ADMIN" && role !== "SUPERVISOR")) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const assignedStoreIds =
      role === "SUPERVISOR"
        ? (
            await prisma.userStore.findMany({
              where: { userId },
              select: { storeId: true },
            })
          ).map((relation) => relation.storeId)
        : null;

    // 🔹 Obtener mes activo
    const meta = await prisma.classificationMeta.findFirst({
      orderBy: { createdAt: "desc" },
    });

    // 🔹 Obtener clasificaciones
    const classifications = await prisma.productClassification.findMany({
      where: assignedStoreIds
        ? { storeId: { in: assignedStoreIds } }
        : undefined,
      include: {
        store: {
          include: {
            chain: true,
          },
        },
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = classifications.map((item) => ({
      chain_name: item.store.chain.name,
      store_name: item.store.name,
      externalCode: item.store.externalCode,
      sku: item.product.sku,
      type: item.type,
    }));

    // 🔹 Devolver objeto con mes + data
    return NextResponse.json({
      month: meta?.month || "SIN MES CARGADO",
      data: result,
      canManage: role === "ADMIN",
    });

  } catch (error) {
    console.error("Classification list error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
