import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("123456", 10);

  await prisma.user.update({
    where: { email: "admin@goldenapp.cl" },
    data: { password: hash },
  });

  console.log("Password asignado al admin");
}

main();
