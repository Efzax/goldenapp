import { PrismaClient } from "@prisma/client";

function createPrisma() {
  const base = new PrismaClient({
    log: ["query"],
  });

  return base.$extends({
    query: {
      store: {
        async update({ args, query }) {
          if (args.data?.externalCode !== undefined) {
            throw new Error(
              "externalCode no puede modificarse una vez creado"
            );
          }
          return query(args);
        },
        async updateMany({ args, query }) {
          if (args.data?.externalCode !== undefined) {
            throw new Error(
              "externalCode no puede modificarse una vez creado"
            );
          }
          return query(args);
        },
      },
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrisma> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}