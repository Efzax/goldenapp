import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST() {
  try {
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