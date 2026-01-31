export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function POST() {
  const family = await prisma.productFamily.findUnique({
    where: { name: "QLED" },
  });

  if (!family) {
    return NextResponse.json(
      { error: "Family not found" },
      { status: 404 }
    );
  }

  const product = await prisma.product.create({
    data: {
      sku: "QN43Q7FAAGXZS",
      name: "Samsung QLED 43 Q7F",
      familyId: family.id,
    },
  });

  return NextResponse.json(product);
}

export async function GET() {
  const products = await prisma.product.findMany({
    include: { family: true },
  });

  return NextResponse.json(products);
}
