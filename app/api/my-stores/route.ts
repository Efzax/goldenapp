export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
const cookieStore = await cookies();
const userId = cookieStore.get("userId")?.value;


  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      stores: {
        include: {
          store: true,
        },
      },
    },
  });

  const stores = user?.stores.map((us: any) => us.store) || [];

  return NextResponse.json(stores);
}
