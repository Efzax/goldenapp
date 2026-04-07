export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";

type StoreInfo = {
  name: string;
  code: string;
  externalCode: string | null;
  chain: {
    name: string;
  };
};

function normalizeSku(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const role = cookieStore.get("role")?.value;
  const userId = cookieStore.get("userId")?.value;

  return Boolean(userId && role === "ADMIN");
}

function buildConflictMap(
  sourceStores: { storeId: string; store: StoreInfo }[],
  destinationStores: { storeId: string; store: StoreInfo }[]
) {
  const destinationByStore = new Map(
    destinationStores.map((item) => [item.storeId, item.store])
  );

  return sourceStores
    .filter((item) => destinationByStore.has(item.storeId))
    .map((item) => ({
      storeId: item.storeId,
      storeName: item.store.name,
      storeCode: item.store.code,
      externalCode: item.store.externalCode,
      chainName: item.store.chain.name,
    }));
}

async function buildPreview(fromSku: string, toSku: string) {
  const source = await prisma.product.findUnique({
    where: { sku: fromSku },
    include: {
      family: true,
      _count: {
        select: {
          inventory: true,
          classifications: true,
        },
      },
    },
  });

  if (!source) {
    return {
      status: 404,
      body: { error: "SKU origen no encontrado" },
    };
  }

  const destination = await prisma.product.findUnique({
    where: { sku: toSku },
    include: {
      family: true,
      _count: {
        select: {
          inventory: true,
          classifications: true,
        },
      },
    },
  });

  const sourceInventoryStores = await prisma.inventory.findMany({
    where: { productId: source.id },
    select: {
      storeId: true,
      store: {
        select: {
          id: true,
          name: true,
          code: true,
          externalCode: true,
          chain: { select: { name: true } },
        },
      },
    },
  });

  const sourceClassificationStores =
    await prisma.productClassification.findMany({
      where: { productId: source.id },
      select: {
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            code: true,
            externalCode: true,
            chain: { select: { name: true } },
          },
        },
      },
    });

  const destinationInventoryStores = destination
    ? await prisma.inventory.findMany({
        where: { productId: destination.id },
        select: {
          storeId: true,
          store: {
            select: {
              id: true,
              name: true,
              code: true,
              externalCode: true,
              chain: { select: { name: true } },
            },
          },
        },
      })
    : [];

  const destinationClassificationStores = destination
    ? await prisma.productClassification.findMany({
        where: { productId: destination.id },
        select: {
          storeId: true,
          store: {
            select: {
              id: true,
              name: true,
              code: true,
              externalCode: true,
              chain: { select: { name: true } },
            },
          },
        },
      })
    : [];

  const inventoryConflicts = buildConflictMap(
    sourceInventoryStores,
    destinationInventoryStores
  );
  const classificationConflicts = buildConflictMap(
    sourceClassificationStores,
    destinationClassificationStores
  );
  const canApply =
    inventoryConflicts.length === 0 && classificationConflicts.length === 0;
  const impactedStoreIds = new Set([
    ...sourceInventoryStores.map((item) => item.storeId),
    ...sourceClassificationStores.map((item) => item.storeId),
  ]);

  return {
    status: 200,
    body: {
      source: {
        sku: source.sku,
        name: source.name,
        family: source.family.name,
        category: source.category,
        inventoryCount: source._count.inventory,
        classificationCount: source._count.classifications,
      },
      destination: destination
        ? {
            sku: destination.sku,
            name: destination.name,
            family: destination.family.name,
            category: destination.category,
            inventoryCount: destination._count.inventory,
            classificationCount: destination._count.classifications,
          }
        : null,
      mode: destination ? "merge" : "rename",
      canApply,
      affected: {
        storeCount: impactedStoreIds.size,
        inventoryCount: source._count.inventory,
        classificationCount: source._count.classifications,
      },
      conflicts: {
        inventory: inventoryConflicts,
        classifications: classificationConflicts,
      },
      message: canApply
        ? destination
          ? "El SKU destino existe, pero no hay conflictos por tienda. Se puede fusionar."
          : "El SKU destino no existe. Se puede renombrar directamente."
        : "Hay conflictos por tienda. Revisa el detalle antes de fusionar.",
    },
  };
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const query = normalizeSku(searchParams.get("q"));

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  const products = await prisma.product.findMany({
    where: {
      sku: {
        contains: query,
        mode: "insensitive",
      },
    },
    orderBy: { sku: "asc" },
    take: 20,
    include: {
      family: true,
      _count: {
        select: {
          inventory: true,
          classifications: true,
        },
      },
    },
  });

  return NextResponse.json(
    products.map((product) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      family: product.family.name,
      category: product.category,
      inventoryCount: product._count.inventory,
      classificationCount: product._count.classifications,
    }))
  );
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const fromSku = normalizeSku(body.fromSku);
  const toSku = normalizeSku(body.toSku);

  if (!fromSku || !toSku) {
    return NextResponse.json(
      { error: "Debes indicar SKU origen y SKU destino" },
      { status: 400 }
    );
  }

  if (fromSku === toSku) {
    return NextResponse.json(
      { error: "El SKU origen y destino deben ser distintos" },
      { status: 400 }
    );
  }

  const preview = await buildPreview(fromSku, toSku);
  return NextResponse.json(preview.body, { status: preview.status });
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const fromSku = normalizeSku(body.fromSku);
  const toSku = normalizeSku(body.toSku);

  if (!fromSku || !toSku) {
    return NextResponse.json(
      { error: "Debes indicar SKU origen y SKU destino" },
      { status: 400 }
    );
  }

  if (fromSku === toSku) {
    return NextResponse.json(
      { error: "El SKU origen y destino deben ser distintos" },
      { status: 400 }
    );
  }

  const preview = await buildPreview(fromSku, toSku);

  if (preview.status !== 200) {
    return NextResponse.json(preview.body, { status: preview.status });
  }

  if (!preview.body.canApply) {
    return NextResponse.json(
      {
        error:
          "No se puede aplicar porque existen conflictos por tienda. Revisa la previsualizacion.",
        preview: preview.body,
      },
      { status: 409 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const source = await tx.product.findUnique({
        where: { sku: fromSku },
      });

      if (!source) {
        throw new Error("SOURCE_NOT_FOUND");
      }

      const destination = await tx.product.findUnique({
        where: { sku: toSku },
      });

      if (!destination) {
        await tx.product.update({
          where: { id: source.id },
          data: {
            sku: toSku,
            name: source.name === source.sku ? toSku : source.name,
          },
        });
        return;
      }

      const sourceInventoryStores = await tx.inventory.findMany({
        where: { productId: source.id },
        select: { storeId: true },
      });
      const destinationInventoryStores = await tx.inventory.findMany({
        where: { productId: destination.id },
        select: { storeId: true },
      });
      const destinationInventoryIds = new Set(
        destinationInventoryStores.map((item) => item.storeId)
      );
      const hasInventoryConflict = sourceInventoryStores.some((item) =>
        destinationInventoryIds.has(item.storeId)
      );

      const sourceClassificationStores =
        await tx.productClassification.findMany({
          where: { productId: source.id },
          select: { storeId: true },
        });
      const destinationClassificationStores =
        await tx.productClassification.findMany({
          where: { productId: destination.id },
          select: { storeId: true },
        });
      const destinationClassificationIds = new Set(
        destinationClassificationStores.map((item) => item.storeId)
      );
      const hasClassificationConflict = sourceClassificationStores.some(
        (item) => destinationClassificationIds.has(item.storeId)
      );

      if (hasInventoryConflict || hasClassificationConflict) {
        throw new Error("SKU_CONFLICTS");
      }

      await tx.inventory.updateMany({
        where: { productId: source.id },
        data: { productId: destination.id },
      });

      await tx.productClassification.updateMany({
        where: { productId: source.id },
        data: { productId: destination.id },
      });

      await tx.product.delete({
        where: { id: source.id },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SOURCE_NOT_FOUND") {
      return NextResponse.json(
        { error: "SKU origen no encontrado" },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message === "SKU_CONFLICTS") {
      return NextResponse.json(
        {
          error:
            "No se puede aplicar porque aparecieron conflictos por tienda. Vuelve a previsualizar.",
        },
        { status: 409 }
      );
    }

    throw error;
  }

  return NextResponse.json({
    ok: true,
    message: "SKU actualizado correctamente",
  });
}
