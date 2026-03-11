import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";

function calculateStatus(stockTotal: number, min: number) {
  if (stockTotal <= min * 0.5) return "CRITICO";
  if (stockTotal < min) return "BAJO";
  return "OK";
}

export async function GET() {

  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario inválido" }, { status: 401 });
  }

  let allowedStoreIds: string[] | null = null;

  if (user.role !== "ADMIN") {
    const relations = await prisma.userStore.findMany({
      where: { userId },
      select: { storeId: true },
    });

    allowedStoreIds = relations.map((r) => r.storeId);
  }
  const inventory = await prisma.inventory.findMany({
  where: allowedStoreIds
    ? { storeId: { in: allowedStoreIds } }
    : undefined,
include: {
  store: {
    include: {
      chain: true,
    },
  },
  product: {
    include: {
      family: true,
    },
  },
},
  });

  const rows = inventory.map((i) => {
    const stockTotal = i.stock + (i.exhib ? 1 : 0);
    const status = calculateStatus(stockTotal, i.minStock);
    const empuje = Math.max(i.minStock - stockTotal, 0);

return {
  Cadena: i.store.chain?.name ?? "",
  Tienda: i.store.name,
  ExternalCode: i.store.externalCode ?? "",
  Categoria: i.product.category,
  SKU: i.product.sku,
  Familia: i.product.family.name,
  Stock: i.stock,
  Exhib: i.exhib ? "SI" : "NO",
  Min: i.minStock,
  "Stock Total": stockTotal,
  Status: status,
  Empuje: empuje,
};
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=export-inventario.xlsx",
    },
  });
}
