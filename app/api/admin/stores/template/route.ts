import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { cookies } from "next/headers";

export async function GET() {

  // 🔐 SOLO ADMIN
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  }

  // Plantilla vacía con encabezados
  const data = [
    {
      Cadena: "",
      ExternalCode: "",
      Tienda: "",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tiendas");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        "attachment; filename=plantilla_tiendas.xlsx",
    },
  });
}