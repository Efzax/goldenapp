import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const role = cookieStore.get("role")?.value;

    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    await prisma.productClassification.deleteMany({});

    return NextResponse.json({
      success: true,
      message: "Clasificación eliminada correctamente",
    });
  } catch (error) {
    console.error("Error clearing classification:", error);
    return NextResponse.json(
      { success: false, message: "Error al borrar clasificación" },
      { status: 500 }
    );
  }
}
