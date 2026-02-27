export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { Category } from "@prisma/client";

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
  const rows: Row[] = await req.json();

  for (const row of rows) {
    // NORMALIZAR A MAYÚSCULAS
    const storeName = row.storeName.toUpperCase().trim();
    const familyName = row.family.toUpperCase().trim();
    const sku = row.sku.toUpperCase().trim();
    const category = row.category.toUpperCase().trim() as Category;
    const chainName = row.chain.toUpperCase().trim();
    const externalCode = row.externalCode.toUpperCase().trim();

    // BUSCAR O CREAR CADENA
let chain = await prisma.chain.findFirst({
  where: { name: chainName },
});

if (!chain) {
  chain = await prisma.chain.create({
    data: { name: chainName },
  });
}

// BUSCAR TIENDA POR externalCode
let store = await prisma.store.findUnique({
  where: { externalCode },
});

// SI NO EXISTE → CREARLA
if (!store) {
  
  // BUSCAR ÚLTIMO CÓDIGO SG
  const lastStore = await prisma.store.findFirst({
    where: {
      code: {
        startsWith: "SG",
      },
    },
    orderBy: {
      code: "desc",
    },
  });

  let nextNumber = 1;

  if (lastStore) {
    const lastNumber = parseInt(lastStore.code.replace("SG", ""), 10);
    nextNumber = lastNumber + 1;
  }

  const newCode = `SG${String(nextNumber).padStart(4, "0")}`;

  store = await prisma.store.create({
    data: {
      name: storeName,
      code: newCode,
      externalCode,
      chainId: chain.id,
    },
  });
}

// VALIDAR QUE LA TIENDA PERTENEZCA A LA MISMA CADENA
if (store.chainId !== chain.id) {
  continue; // puedes luego mejorar esto con manejo de error acumulado
}

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
