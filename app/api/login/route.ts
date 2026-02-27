export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    return NextResponse.json(
      { error: "Usuario o clave incorrecta" },
      { status: 401 }
    );
  }

  const valid = await bcrypt.compare(password, user.password);

  if (!valid) {
    return NextResponse.json(
      { error: "Usuario o clave incorrecta" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({
    ok: true,
    role: user.role,
  });

  // ✅ Guardamos userId
  res.cookies.set("userId", user.id, {
    path: "/",
    httpOnly: true,
  });

  // ✅ Guardamos role
  res.cookies.set("role", user.role, {
    path: "/",
    httpOnly: true,
  });

  return res;
}