export const dynamic = "force-dynamic";


import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST() {
  const family = await prisma.productFamily.create({
    data: {
      name: "QLED",
    },
  });

  return NextResponse.json(family);
}

export async function GET() {
  const families = await prisma.productFamily.findMany();
  return NextResponse.json(families);
}
