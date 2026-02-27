import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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

  const result = [];

  for (const row of rows) {
    let valid = true;
    let error = "";

    const storeName = row.storeName.toUpperCase().trim();
    const familyName = row.family.toUpperCase().trim();
    const categoryName = row.category.toUpperCase().trim(); // TV / AV
    const chainName = row.chain?.toUpperCase().trim();
    const externalCode = row.externalCode?.toUpperCase().trim();

const store = await prisma.store.findFirst({
  where: { name: storeName },
  include: { chain: true },
});

if (store) {
  if (store.externalCode !== externalCode) {
    valid = false;
    error = "ExternalCode no coincide con tienda existente";
  }

  if (store.chain?.name !== chainName) {
    valid = false;
    error = "Cadena no coincide con tienda existente";
  }
}

    if (!familyName) {
      valid = false;
      error = "Familia vacía";
    }

    if (!row.sku || !row.storeName || !row.family) {
      valid = false;
      error = "Campos obligatorios vacíos";
    }
    if (!chainName || !externalCode) {
  valid = false;
  error = "Cadena o ExternalCode vacío";
}

    if (isNaN(row.stock) || isNaN(row.minStock)) {
      valid = false;
      error = "Stock o Min no es número";
    }

result.push({
  ...row,
  chain: chainName,
  externalCode,
  storeName,
  family: familyName,
  category: categoryName,
  valid,
  error,
});
  }

  return NextResponse.json(result);
}

