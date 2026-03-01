export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
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

  if (!user) {
    return NextResponse.json({ error: "Invalid user" }, { status: 401 });
  }

return NextResponse.json({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  image: user.image,
  stores: user.stores.map((us) => ({
    id: us.store.id,
    name: us.store.name,
    code: us.store.code,
  })),
});
}

