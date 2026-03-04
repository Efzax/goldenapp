export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // 🔐 Solo ADMIN
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;

    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // 📄 Datos ejemplo
const data = [
  {
    Mes: "FEBRERO 2026",
    ExternalCode: "C850_00000000000128",
    SKU: "QN43LS03FAGXZS",
    Type: "PS",
  },
  {
    Mes: "FEBRERO 2026",
    ExternalCode: "C850_00000000000128",
    SKU: "HW-S800D",
    Type: "PS Audio",
  },
];

    // 📊 Crear workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Clasificacion"
    );

    // 📦 Generar buffer
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Disposition":
          "attachment; filename=classification_template.xlsx",
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

  } catch (error) {
    console.error("Template error:", error);
    return NextResponse.json(
      { error: "Error generando plantilla" },
      { status: 500 }
    );
  }
}