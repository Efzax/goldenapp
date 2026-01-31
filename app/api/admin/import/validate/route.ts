import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

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

  const result = [];

  for (const row of rows) {
    let valid = true;
    let error = "";

    const storeName = row.storeName.toUpperCase().trim();
    const familyName = row.family.toUpperCase().trim();
    const categoryName = row.category.toUpperCase().trim(); // TV / AV

    const store = await prisma.store.findFirst({
      where: { name: storeName },
    });

    if (!store) {
      valid = false;
      error = "Tienda no existe";
    }

    if (!familyName) {
      valid = false;
      error = "Familia vacía";
    }

    if (!row.sku || !row.storeName || !row.family) {
      valid = false;
      error = "Campos obligatorios vacíos";
    }

    if (isNaN(row.stock) || isNaN(row.minStock)) {
      valid = false;
      error = "Stock o Min no es número";
    }

    result.push({
      ...row,
      storeName,
      family: familyName,     // 👈 NORMALIZADO
      category: categoryName, // 👈 NORMALIZADO
      valid,
      error,
    });
  }

  return NextResponse.json(result);
}

