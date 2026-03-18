import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

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
    select: { role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario inválido" }, { status: 401 });
  }

  let allowedStoreIds: string[] | null = null;

  if (user.role !== "ADMIN") {
    const userStores = await prisma.userStore.findMany({
      where: { userId },
      select: { storeId: true },
    });

    allowedStoreIds = userStores.map((s) => s.storeId);
  }

  const rows: Row[] = await req.json();

  const result = [];

  for (const row of rows) {
    let valid = true;
    let error = "";

    const familyName = row.family?.toUpperCase().trim();
    const categoryName = row.category?.toUpperCase().trim();
    const chainName = row.chain?.toUpperCase().trim();
    const externalCode = row.externalCode?.toUpperCase().trim();
    const sku = row.sku?.toUpperCase().trim();

    if (!chainName || !externalCode) {
      valid = false;
      error = "Cadena o ExternalCode vacío";
    }

    if (!sku || !familyName) {
      valid = false;
      error = "Campos obligatorios vacíos";
    }

    if (isNaN(row.stock) || isNaN(row.minStock)) {
      valid = false;
      error = "Stock o Min no es número";
    }

    // 🔒 VALIDAR EXISTENCIA DE CADENA
    const chain = await prisma.chain.findFirst({
      where: { name: chainName },
    });

    if (!chain) {
      valid = false;
      error = "Cadena no registrada";
    }

    // 🔒 VALIDAR EXISTENCIA DE TIENDA POR externalCode
    const store = await prisma.store.findUnique({
      where: { externalCode },
    });

    if (!store) {
      valid = false;
      error = "ExternalCode no registrado";
    }

    if (store && allowedStoreIds && !allowedStoreIds.includes(store.id)) {
      valid = false;
      error = "Tienda no asignada a tu usuario";
    }

    // 🔒 VALIDAR QUE LA TIENDA PERTENEZCA A ESA CADENA
    if (store && chain && store.chainId !== chain.id) {
      valid = false;
      error = "La tienda no pertenece a esa cadena";
    }

    result.push({
      ...row,
      chain: chainName,
      externalCode,
      family: familyName,
      category: categoryName,
      valid,
      error,
    });
  }

  return NextResponse.json(result);
}
