import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {

  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;

  if (role !== "ADMIN") {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 403 }
    );
  }

  const stores = await prisma.store.findMany({
    include: {
      chain: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(stores);
}