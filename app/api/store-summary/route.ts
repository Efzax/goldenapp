export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stores: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    let query = `
      SELECT *
      FROM store_summary
    `;

    // 🔥 Si NO es ADMIN → filtrar por tiendas asignadas
    if (user.role !== "ADMIN") {
      const storeIds = user.stores.map((s) => `'${s.storeId}'`).join(",");

      if (!storeIds) {
        return NextResponse.json([]); // No tiene tiendas
      }

      query += ` WHERE store_id IN (${storeIds})`;
    }

    query += ` ORDER BY store_name, category`;

    const rawData = await prisma.$queryRawUnsafe(query) as any[];

    const data = rawData.map((row) => ({
      ...row,
      total_users: Number(row.total_users),
      total_skus: Number(row.total_skus),
      total_stock: Number(row.total_stock),
      total_ok: Number(row.total_ok),
      total_bajo: Number(row.total_bajo),
      total_critico: Number(row.total_critico),
      total_empuje: Number(row.total_empuje),
    }));

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Error store-summary:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}