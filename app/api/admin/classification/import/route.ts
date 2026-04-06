export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { ClassificationType } from "@prisma/client";

type Row = {
  month: string;            // 👈 NUEVO
  externalCode: string;
  sku: string;
  type: string;             // PS | PE | PS Audio
};

export async function POST(req: Request) {

  // 🔐 SOLO ADMIN
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

  // 🔹 VALIDAR Y GUARDAR MES
  const detectedMonth = rows[0]?.month;

  if (!detectedMonth) {
    return NextResponse.json(
      { error: "Mes no especificado en archivo" },
      { status: 400 }
    );
  }

  // 🔹 Borrar mes anterior
  await prisma.classificationMeta.deleteMany({});

  // 🔹 Guardar nuevo mes
  await prisma.classificationMeta.create({
    data: {
      month: detectedMonth.toUpperCase(),
    },
  });

  // 🔹 PROCESAR FILAS
  for (const row of rows) {

    const externalCode = row.externalCode?.toUpperCase().trim();
    const sku = row.sku?.toUpperCase().trim();
    const rawType = row.type?.toUpperCase().trim();

    if (!externalCode || !sku || !rawType) {
      result.push({
        ...row,
        status: "ERROR",
        message: "Campos obligatorios vacíos",
      });
      continue;
    }

    // 🔄 Normalizar type
    let type: ClassificationType | null = null;

    if (rawType === "PS") type = "PS";
    else if (rawType === "PE") type = "PE";
    else if (rawType === "PS AUDIO") type = "PS_AUDIO";

    if (!type) {
      result.push({
        ...row,
        status: "ERROR",
        message: "Tipo inválido (usar PS, PE o PS Audio)",
      });
      continue;
    }

    // 🔍 Buscar tienda
    const store = await prisma.store.findUnique({
      where: { externalCode },
    });

    if (!store) {
      result.push({
        ...row,
        status: "ERROR",
        message: "ExternalCode no registrado",
      });
      continue;
    }

    // 🔍 Buscar producto
    const product = await prisma.product.findUnique({
      where: { sku },
    });

    if (!product) {
      result.push({
        ...row,
        status: "ERROR",
        message: "SKU no registrado",
      });
      continue;
    }

    // ✅ Crear clasificación
    await prisma.productClassification.create({
      data: {
        storeId: store.id,
        productId: product.id,
        type,
      },
    });

    result.push({
      ...row,
      status: "CREATED",
      message: "Clasificación creada",
    });
  }

  return NextResponse.json(result);
}
