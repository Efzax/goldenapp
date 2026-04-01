export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import { promises as fs } from "fs";
import path from "path";

type DashboardPayload = {
  fileName: string;
  generatedAt: string;
  notes?: string[];
  filters: {
    defaultStore?: string;
    defaultMonth?: string;
    defaultCoverage?: string;
    months: string[];
    stores: string[];
    coverages: string[];
  };
  targets?: Array<Record<string, unknown>>;
  storeCodes?: Array<Record<string, unknown>>;
  sellOutStores?: Array<Record<string, unknown>>;
  tvavSummary?: Array<Record<string, unknown>>;
  stockDi?: Array<Record<string, unknown>>;
  ihsMaster?: Array<Record<string, unknown>>;
  benchmarks2025?: Array<Record<string, unknown>>;
  products?: Array<Record<string, unknown>>;
};

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeStoreKey(value: unknown) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function normalizeExternalCode(value: unknown) {
  return normalizeText(value).toUpperCase();
}

async function loadDashboardPayload() {
  const candidatePaths = [
    path.join(process.cwd(), "app", "data", "dashboard-data.json"),
    path.join(process.cwd(), "DashPSI", "data", "dashboard-data.json"),
    path.join(process.cwd(), "..", "DashPSI", "data", "dashboard-data.json"),
  ];

  for (const filePath of candidatePaths) {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw) as DashboardPayload;
    } catch {
      continue;
    }
  }

  throw new Error("No se encontró dashboard-data.json para el módulo comercial.");
}

function filterByAllowedStores<T extends Record<string, unknown>>(
  collection: T[] | undefined,
  allowedStoreKeys: Set<string>,
  allowedStoreCodes: Set<string>
) {
  if (!Array.isArray(collection)) {
    return [];
  }

  return collection.filter((row) => {
    const storeKey = normalizeStoreKey(row.store);
    const storeCode = normalizeExternalCode(row.storeCode);

    if (storeCode && allowedStoreCodes.has(storeCode)) {
      return true;
    }

    if (storeKey && allowedStoreKeys.has(storeKey)) {
      return true;
    }

    return false;
  });
}

export async function GET() {
  try {
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

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const payload = await loadDashboardPayload();

    if (user.role === Role.ADMIN) {
      return NextResponse.json(payload);
    }

    const allowedStoreKeys = new Set(
      user.stores.map((item) => normalizeStoreKey(item.store.name)).filter(Boolean)
    );
    const allowedStoreCodes = new Set(
      user.stores.map((item) => normalizeExternalCode(item.store.externalCode)).filter(Boolean)
    );

    const filteredStoreCodes = filterByAllowedStores(payload.storeCodes, allowedStoreKeys, allowedStoreCodes);
    const filteredTargets = filterByAllowedStores(payload.targets, allowedStoreKeys, allowedStoreCodes);
    const filteredSellOutStores = filterByAllowedStores(payload.sellOutStores, allowedStoreKeys, allowedStoreCodes);
    const filteredTvavSummary = filterByAllowedStores(payload.tvavSummary, allowedStoreKeys, allowedStoreCodes);
    const filteredStockDi = filterByAllowedStores(payload.stockDi, allowedStoreKeys, allowedStoreCodes);
    const filteredIhsMaster = filterByAllowedStores(payload.ihsMaster, allowedStoreKeys, allowedStoreCodes);
    const filteredBenchmarks2025 = filterByAllowedStores(payload.benchmarks2025, allowedStoreKeys, allowedStoreCodes);
    const filteredProducts = filterByAllowedStores(payload.products, allowedStoreKeys, allowedStoreCodes);

    const monthOrder = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const filteredStores = [
      ...new Set(
        filteredIhsMaster
          .map((item) => normalizeText(item.store))
          .filter(Boolean)
      ),
    ];
    const filteredMonths = [
      ...new Set(
        filteredIhsMaster
          .map((item) => normalizeText(item.month))
          .filter(Boolean)
      ),
    ].sort((a, b) => monthOrder.indexOf(a.toLowerCase()) - monthOrder.indexOf(b.toLowerCase()));
    const filteredCoverages = [
      ...new Set(
        filteredIhsMaster
          .map((item) => normalizeText(item.coverage))
          .filter(Boolean)
      ),
    ];

    const filteredPayload: DashboardPayload = {
      ...payload,
      filters: {
        ...payload.filters,
        months: filteredMonths,
        stores: filteredStores,
        coverages: filteredCoverages,
        defaultStore: filteredStores.includes(normalizeText(payload.filters.defaultStore))
          ? payload.filters.defaultStore
          : filteredStores[0] || "",
        defaultMonth: filteredMonths[filteredMonths.length - 1] || payload.filters.defaultMonth || "",
        defaultCoverage: filteredCoverages[0] || payload.filters.defaultCoverage || "",
      },
      storeCodes: filteredStoreCodes,
      targets: filteredTargets,
      sellOutStores: filteredSellOutStores,
      tvavSummary: filteredTvavSummary,
      stockDi: filteredStockDi,
      ihsMaster: filteredIhsMaster,
      benchmarks2025: filteredBenchmarks2025,
      products: filteredProducts,
    };

    return NextResponse.json(filteredPayload);
  } catch (error) {
    console.error("commercial-dashboard error", error);
    return NextResponse.json({ error: "No fue posible cargar la data comercial" }, { status: 500 });
  }
}
