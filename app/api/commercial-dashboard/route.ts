export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";
import dashboardData from "@/app/data/dashboard-data.json";

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

type StoreDirectoryEntry = {
  name: string;
  externalCode: string | null;
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
  return dashboardData as DashboardPayload;
}

function buildRawStoreCodeMap(payload: DashboardPayload) {
  const map = new Map<string, string>();

  for (const row of payload.storeCodes || []) {
    const storeKey = normalizeStoreKey(row.store);
    const storeCode = normalizeExternalCode(row.storeCode);
    if (storeKey && storeCode) {
      map.set(storeKey, storeCode);
    }
  }

  return map;
}

function buildCanonicalStoreNameByRawKey(
  collection: Array<Record<string, unknown>> | undefined,
  codeToName: Map<string, string>
) {
  const map = new Map<string, string>();

  for (const row of collection || []) {
    const rawStoreKey = normalizeStoreKey(row.store);
    const storeCode = normalizeExternalCode(row.storeCode);
    const canonicalName = storeCode ? codeToName.get(storeCode) : null;

    if (rawStoreKey && canonicalName) {
      map.set(rawStoreKey, canonicalName);
    }
  }

  return map;
}

function canonicalizeCollection<T extends Record<string, unknown>>(
  collection: T[] | undefined,
  codeToName: Map<string, string>,
  rawStoreCodeMap: Map<string, string>,
  canonicalStoreNameByRawKey: Map<string, string>
) {
  if (!Array.isArray(collection)) {
    return [];
  }

  return collection.map((row) => {
    const storeCode = normalizeExternalCode(row.storeCode) || rawStoreCodeMap.get(normalizeStoreKey(row.store));
    const canonicalName =
      (storeCode ? codeToName.get(storeCode) : null) ||
      canonicalStoreNameByRawKey.get(normalizeStoreKey(row.store));

    if (!canonicalName) {
      return row;
    }

    return {
      ...row,
      store: canonicalName,
      ...(row.storeCode ? { storeCode } : {}),
    };
  });
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
    const storeDirectory = await prisma.store.findMany({
      select: {
        name: true,
        externalCode: true,
      },
    });

    const codeToName = new Map<string, string>(
      (storeDirectory as StoreDirectoryEntry[])
        .map((item) => [normalizeExternalCode(item.externalCode), item.name] as const)
        .filter(([code]) => Boolean(code))
    );
    const rawStoreCodeMap = buildRawStoreCodeMap(payload);
    const canonicalStoreNameByRawKey = buildCanonicalStoreNameByRawKey(payload.storeCodes, codeToName);

    const canonicalStoreCodes = canonicalizeCollection(payload.storeCodes, codeToName, rawStoreCodeMap, canonicalStoreNameByRawKey);
    const canonicalTargets = canonicalizeCollection(payload.targets, codeToName, rawStoreCodeMap, canonicalStoreNameByRawKey);
    const canonicalSellOutStores = canonicalizeCollection(payload.sellOutStores, codeToName, rawStoreCodeMap, canonicalStoreNameByRawKey);
    const canonicalTvavSummary = canonicalizeCollection(payload.tvavSummary, codeToName, rawStoreCodeMap, canonicalStoreNameByRawKey);
    const canonicalStockDi = canonicalizeCollection(payload.stockDi, codeToName, rawStoreCodeMap, canonicalStoreNameByRawKey);
    const canonicalIhsMaster = canonicalizeCollection(payload.ihsMaster, codeToName, rawStoreCodeMap, canonicalStoreNameByRawKey);
    const canonicalBenchmarks2025 = canonicalizeCollection(payload.benchmarks2025, codeToName, rawStoreCodeMap, canonicalStoreNameByRawKey);
    const canonicalProducts = canonicalizeCollection(payload.products, codeToName, rawStoreCodeMap, canonicalStoreNameByRawKey);

    const canonicalDefaultStoreCode =
      rawStoreCodeMap.get(normalizeStoreKey(payload.filters.defaultStore)) ||
      normalizeExternalCode(payload.filters.defaultStore);
    const canonicalDefaultStore = canonicalDefaultStoreCode
      ? codeToName.get(canonicalDefaultStoreCode) || payload.filters.defaultStore
      : payload.filters.defaultStore;

    if (user.role === Role.ADMIN) {
      const adminStores = [
        ...new Set(
          canonicalStoreCodes
            .map((item) => normalizeText(item.store))
            .filter(Boolean)
        ),
      ];

      return NextResponse.json({
        ...payload,
        filters: {
          ...payload.filters,
          stores: adminStores,
          defaultStore: adminStores.includes(normalizeText(canonicalDefaultStore))
            ? canonicalDefaultStore
            : adminStores[0] || "",
        },
        storeCodes: canonicalStoreCodes,
        targets: canonicalTargets,
        sellOutStores: canonicalSellOutStores,
        tvavSummary: canonicalTvavSummary,
        stockDi: canonicalStockDi,
        ihsMaster: canonicalIhsMaster,
        benchmarks2025: canonicalBenchmarks2025,
        products: canonicalProducts,
      });
    }

    const allowedStoreKeys = new Set(
      user.stores.map((item) => normalizeStoreKey(item.store.name)).filter(Boolean)
    );
    const allowedStoreCodes = new Set(
      user.stores.map((item) => normalizeExternalCode(item.store.externalCode)).filter(Boolean)
    );

    const filteredStoreCodes = filterByAllowedStores(canonicalStoreCodes, allowedStoreKeys, allowedStoreCodes);
    const filteredTargets = filterByAllowedStores(canonicalTargets, allowedStoreKeys, allowedStoreCodes);
    const filteredSellOutStores = filterByAllowedStores(canonicalSellOutStores, allowedStoreKeys, allowedStoreCodes);
    const filteredTvavSummary = filterByAllowedStores(canonicalTvavSummary, allowedStoreKeys, allowedStoreCodes);
    const filteredStockDi = filterByAllowedStores(canonicalStockDi, allowedStoreKeys, allowedStoreCodes);
    const filteredIhsMaster = filterByAllowedStores(canonicalIhsMaster, allowedStoreKeys, allowedStoreCodes);
    const filteredBenchmarks2025 = filterByAllowedStores(canonicalBenchmarks2025, allowedStoreKeys, allowedStoreCodes);
    const filteredProducts = filterByAllowedStores(canonicalProducts, allowedStoreKeys, allowedStoreCodes);

    const monthOrder = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    const filteredStores = [
      ...new Set(
        filteredStoreCodes
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
        defaultStore: filteredStores.includes(normalizeText(canonicalDefaultStore))
          ? canonicalDefaultStore
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
