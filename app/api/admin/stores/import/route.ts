export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

type Row = {
  chain: string;
  externalCode: string;
  storeName: string;
};

export async function POST(req: Request) {

  // 🔐 PROTEGER ENDPOINT SOLO ADMIN
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  }

  const rows: Row[] = await req.json();
  const result = [];

  for (const row of rows) {

    const chainName = row.chain?.toUpperCase().trim();
    const externalCode = row.externalCode?.toUpperCase().trim();
    const storeName = row.storeName?.toUpperCase().trim();

    if (!chainName || !externalCode || !storeName) {
      result.push({
        ...row,
        status: "ERROR",
        message: "Campos obligatorios vacíos",
      });
      continue;
    }

    // 🔒 Verificar cadena existente
    const chain = await prisma.chain.findFirst({
      where: { name: chainName },
    });

    if (!chain) {
      result.push({
        ...row,
        status: "ERROR",
        message: "Cadena no registrada",
      });
      continue;
    }

    // 🔍 Buscar tienda por externalCode
    const existingStore = await prisma.store.findUnique({
      where: { externalCode },
    });

    // 🆕 Crear tienda nueva
    if (!existingStore) {

      // generar nuevo código SG automático
      const lastStore = await prisma.store.findFirst({
        where: {
          code: { startsWith: "SG" },
        },
        orderBy: { code: "desc" },
      });

      let nextNumber = 1;

      if (lastStore) {
        const lastNumber = parseInt(
          lastStore.code.replace("SG", ""),
          10
        );
        nextNumber = lastNumber + 1;
      }

      const newCode = `SG${String(nextNumber).padStart(4, "0")}`;

      await prisma.store.create({
        data: {
          name: storeName,
          code: newCode,
          externalCode,
          chainId: chain.id,
        },
      });

      result.push({
        ...row,
        status: "CREATED",
        message: "Tienda creada correctamente",
      });

      continue;
    }

    // 🚨 Si existe pero pertenece a otra cadena
    if (existingStore.chainId !== chain.id) {
      result.push({
        ...row,
        status: "ERROR",
        message: "ExternalCode pertenece a otra cadena",
      });
      continue;
    }

    // 🔄 Si existe y misma cadena → actualizar nombre si cambió
    if (existingStore.name !== storeName) {
      await prisma.store.update({
        where: { id: existingStore.id },
        data: { name: storeName },
      });

      result.push({
        ...row,
        status: "UPDATED",
        message: "Nombre actualizado",
      });

      continue;
    }

    // ✔ Si todo igual
    result.push({
      ...row,
      status: "UNCHANGED",
      message: "Sin cambios",
    });
  }

  return NextResponse.json(result);
}