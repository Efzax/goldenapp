export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { Category } from "@prisma/client";
import * as XLSX from "xlsx";

type Row = {
  chain: string;
  externalCode: string;
  category: string;
  storeName: string;
  sku: string;
  family: string;
  stock: number;
  exhib: boolean;
  minStock: number;
};

export async function POST(req: Request) {

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

  // si NO es admin → obtener tiendas asignadas
  if (user.role !== "ADMIN") {

    const relations = await prisma.userStore.findMany({
      where: { userId },
      select: { storeId: true },
    });

    allowedStoreIds = relations.map((r) => r.storeId);
  }

const rows: Row[] = await req.json();
const results: any[] = [];
const inventoryOps: any[] = [];

// cache para evitar buscar la misma familia muchas veces
const familyCache = new Map<string, string>();

// cache de tiendas
const storeCache = new Map<string, { id: string; chainId: string }>();

// cache de productos por SKU
const productCache = new Map<string, string>();

for (const row of rows) {
    // NORMALIZAR A MAYÚSCULAS
    const familyName = row.family.toUpperCase().trim();
    const sku = row.sku.toUpperCase().trim();
    const category = row.category.toUpperCase().trim() as Category;
    const chainName = row.chain.toUpperCase().trim();
    const externalCode = row.externalCode.toUpperCase().trim();

    // 🔒 BUSCAR CADENA (NO CREAR)
const chain = await prisma.chain.findFirst({
  where: { name: chainName },
});

if (!chain) {
  results.push({
    ...row,
    status: "ERROR",
    message: "Cadena no registrada",
  });

  continue;
}

    // 🔒 BUSCAR TIENDA POR externalCode (NO CREAR)
let store = storeCache.get(externalCode);

if (!store) {
  const dbStore = await prisma.store.findUnique({
    where: { externalCode },
  });

if (!dbStore) {
  results.push({
    ...row,
    status: "ERROR",
    message: "Tienda no registrada",
  });

  continue;
}

  store = {
    id: dbStore.id,
    chainId: dbStore.chainId,
  };

  storeCache.set(externalCode, store);
}

    // 🔒 validar permiso de tienda para supervisor
if (allowedStoreIds && !allowedStoreIds.includes(store.id)) {
  return NextResponse.json(
    {
      error: "El archivo contiene tiendas que no están asignadas a tu usuario",
      externalCode: row.externalCode,
    },
    { status: 403 }
  );
}

// 🔒 VALIDAR QUE LA TIENDA PERTENEZCA A ESA CADENA
if (store.chainId !== chain.id) {
  results.push({
    ...row,
    status: "ERROR",
    message: "Tienda pertenece a otra cadena",
  });

  continue;
}

// ✅ BUSCAR O CREAR FAMILIA (con cache)
let familyId = familyCache.get(familyName);

if (!familyId) {
  let family = await prisma.productFamily.findFirst({
    where: { name: familyName },
  });

  if (!family) {
    family = await prisma.productFamily.create({
      data: { name: familyName },
    });
  }

  familyId = family.id;
  familyCache.set(familyName, familyId);
}

// ✅ BUSCAR O CREAR PRODUCTO (con cache)
let productId = productCache.get(sku);

if (!productId) {
  let product = await prisma.product.findUnique({
    where: { sku },
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        sku,
        name: sku,
        familyId,
        category,
      },
    });
  }

  productId = product.id;
  productCache.set(sku, productId);
}

    // ✅ UPSERT INVENTARIO
inventoryOps.push(
  prisma.inventory.upsert({
    where: {
      storeId_productId: {
        storeId: store.id,
        productId,
      },
    },
    update: {
      stock: row.stock,
      exhib: row.exhib,
      minStock: row.minStock,
    },
    create: {
      storeId: store.id,
      productId,
      stock: row.stock,
      exhib: row.exhib,
      minStock: row.minStock,
    },
  })
);
    results.push({
  ...row,
  status: "OK",
  message: "Inventario actualizado",
});
  }
  // ejecutar todas las operaciones de inventario en una transacción
if (inventoryOps.length > 0) {
  await prisma.$transaction(inventoryOps);
}

// crear hoja de Excel con los resultados
const worksheet = XLSX.utils.json_to_sheet(results);
const workbook = XLSX.utils.book_new();

XLSX.utils.book_append_sheet(workbook, worksheet, "Resultado Import");

const buffer = XLSX.write(workbook, {
  type: "buffer",
  bookType: "xlsx",
});

return new NextResponse(buffer, {
  headers: {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": "attachment; filename=import-resultado.xlsx",
  },
});
}