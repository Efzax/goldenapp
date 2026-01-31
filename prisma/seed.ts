import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@goldenapp.cl";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin GoldenApp",
      email: adminEmail,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin creado:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
