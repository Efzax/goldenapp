"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./commercial-dashboard.module.css";

type DashboardRow = {
  store?: string;
  storeCode?: string;
  month?: string;
  coverage?: string;
  week?: string;
  weekLabel?: string;
  samsungAmount?: number;
  xBrandAmount?: number;
  tclAmount?: number;
  hisenseAmount?: number;
  othersAmount?: number;
  totalAmount?: number;
};

type TargetRow = {
  store?: string;
  target?: number;
};

type TvAvRow = {
  store?: string;
  month?: string;
  coverage?: string;
  tvSellOut?: number;
  tvCompliance?: number;
  tvBaseCompliance?: number;
  tvTarget?: number;
  tvPsAmount?: number;
  tvPsShare?: number;
  tvPeAmount?: number;
  tvPeShare?: number;
  avSellOut?: number;
  avCompliance?: number;
  avBaseCompliance?: number;
  avTarget?: number;
  avPsAmount?: number;
  avPsShare?: number;
};

type BenchmarkRow = {
  store?: string;
  month?: string;
  samsungShare?: number;
};

type ProductRow = {
  month?: string;
  store?: string;
  division?: string;
  sku?: string;
  gross?: number;
  sellOutUnits?: number;
};

type CommercialPayload = {
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
  ihsMaster: DashboardRow[];
  benchmarks2025: BenchmarkRow[];
  targets: TargetRow[];
  tvavSummary: TvAvRow[];
  products: ProductRow[];
};

type UserInfo = {
  name?: string;
  email?: string;
  image?: string | null;
  role?: string;
};

const currencyFormatter = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat("es-CL", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const numberFormatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

const BRAND_COLORS: Record<string, string> = {
  Samsung: "#4265D1",
  "X-Brand": "#FD4747",
  TCL: "#F4CDCC",
  Hisense: "#88C4C4",
  Otras: "#AEAEAE",
};

function cx(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ");
}

function formatCurrency(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return currencyFormatter.format(value);
}

function formatPercent(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return percentFormatter.format(value);
}

function formatNumber(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return numberFormatter.format(value);
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeStore(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function toTitleCase(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function repairMojibake(value = "") {
  return String(value)
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã/g, "Á")
    .replace(/Ã‰/g, "É")
    .replace(/Ã/g, "Í")
    .replace(/Ã“/g, "Ó")
    .replace(/Ãš/g, "Ú")
    .replace(/Ã±/g, "ñ")
    .replace(/Ã‘/g, "Ñ");
}

function formatStoreLabel(value = "") {
  const cleaned = repairMojibake(String(value ?? ""))
    .replace(/[´`'"]/g, "")
    .replace(/vi(?:na|ña)/gi, "Vina")
    .replace(/\s+/g, " ")
    .trim();
  const normalized = normalizeStore(cleaned);
  if (normalized === "falabella vina ii") return "Falabella Viña 2 Mall";
  return toTitleCase(cleaned)
    .replace(/Vina/g, "Viña")
    .replace(/Viña Ii/g, "Viña 2 Mall");
}

function safeNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value || 0);
}

function formatStoreLabelFixed(value = "") {
  const cleaned = String(value ?? "")
    .replace(/ViÃ±a/gi, "Vi\u00f1a")
    .replace(/VI\u0104A/gi, "VI\u00d1A")
    .replace(/Vi\u00a4a/gi, "Vi\u00f1a")
    .replace(/Vina/gi, "Vi\u00f1a")
    .replace(/ValparaiSo/gi, "Valpara\u00edso")
    .replace(/Valparaiso/gi, "Valpara\u00edso")
    .replace(/L[i\u00ed]der Belloto/gi, "Lider Belloto")
    .replace(/L[i\u00ed]der Los Andes/gi, "Lider Los Andes")
    .replace(/L[i\u00ed]der Quillota/gi, "Lider Quillota")
    .replace(/L[i\u00ed]der San Felipe/gi, "Lider San Felipe")
    .replace(/L[i\u00ed]der Vi(?:\u00f1a|Ã±a|\u00a4a)[\u00aa\u00ba\u2013\u2014-]* ?Del Mar Ii/gi, "Lider Vi\u00f1a Del Mar Ii")
    .replace(/L[i\u00ed]der Vi(?:\u00f1a|Ã±a|\u00a4a)[\u00aa\u00ba\u2013\u2014-]* ?Del Mar/gi, "Lider Vi\u00f1a Del Mar")
    .replace(/[’`´]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const normalized = normalizeStore(cleaned);
  if (normalized === "falabella vina ii") return "Falabella Vi\u00f1a 2 Mall";
  if (normalized === "la polar vina del mar") return "La Polar Vi\u00f1a Del Mar";
  if (normalized === "lider vina del mar") return "Lider Vi\u00f1a Del Mar";
  if (normalized === "lider vina del mar ii") return "Lider Vi\u00f1a Del Mar Ii";

  return toTitleCase(cleaned)
    .replace(/Vina/g, "Vi\u00f1a")
    .replace(/Vi\u00f1a Ii/g, "Vi\u00f1a 2 Mall")
    .replace(/Valparaiso/g, "Valpara\u00edso");
}

function getCanonicalStoreLabel(value = "") {
  const raw = String(value ?? "");
  const lowered = raw.toLowerCase();

  if (lowered.includes("falabella") && lowered.includes("calera")) return "Falabella La Calera";
  if (lowered.includes("falabella") && lowered.includes("san felipe")) return "Falabella San Felipe";
  if (lowered.includes("falabella") && lowered.includes("valpar")) return "Falabella Valpara\u00edso";
  if (lowered.includes("falabella") && lowered.includes("ii")) return "Falabella Vi\u00f1a 2 Mall";
  if (lowered.includes("la polar") && lowered.includes("mar")) return "La Polar Vi\u00f1a Del Mar";
  if (lowered.includes("lider") && lowered.includes("belloto")) return "Lider Belloto";
  if (lowered.includes("lider") && lowered.includes("los andes")) return "Lider Los Andes";
  if (lowered.includes("lider") && lowered.includes("quillota")) return "Lider Quillota";
  if (lowered.includes("lider") && lowered.includes("san felipe")) return "Lider San Felipe";
  if (lowered.includes("lider") && lowered.includes("del mar") && lowered.includes("ii")) return "Lider Vi\u00f1a Del Mar Ii";
  if (lowered.includes("lider") && lowered.includes("del mar")) return "Lider Vi\u00f1a Del Mar";
  if (lowered.includes("paris") && lowered.includes("marina")) return "Paris Marina Arauco";
  if (lowered.includes("paris") && lowered.includes("belloto")) return "Paris Portal Belloto";
  if (lowered.includes("paris") && lowered.includes("valpar")) return "Paris Portal Valpara\u00edso";
  if (lowered.includes("ripley") && lowered.includes("marina")) return "Ripley Marina Arauco";
  if (lowered.includes("ripley") && lowered.includes("andes")) return "Ripley Los Andes";

  return formatStoreLabelFixed(raw);
}

function sum<T>(items: T[], accessor: (item: T) => number) {
  return items.reduce((total, item) => total + safeNumber(accessor(item)), 0);
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce((map, item) => {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key)?.push(item);
    return map;
  }, new Map<string, T[]>());
}

function getTooltipPosition(clientX: number, clientY: number) {
  const offset = 18;
  const padding = 12;
  const estimatedWidth = 170;
  const estimatedHeight = 76;

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;

  let x = clientX + offset;
  let y = clientY - offset;

  if (viewportWidth && x + estimatedWidth > viewportWidth - padding) {
    x = clientX - estimatedWidth - offset;
  }

  if (viewportHeight && y + estimatedHeight > viewportHeight - padding) {
    y = viewportHeight - estimatedHeight - padding;
  }

  if (y < padding) {
    y = padding;
  }

  if (x < padding) {
    x = padding;
  }

  return { x, y };
}

export default function CommercialDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const [data, setData] = useState<CommercialPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState("");
  const [coverage, setCoverage] = useState("");
  const [store, setStore] = useState("");
  const [user, setUser] = useState<UserInfo | null>(null);
  const canViewCoverageFilter =
    user?.role === "ADMIN" ||
    user?.role === "SUPERVISOR" ||
    user?.role === "MERCHAND";
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasMultipleStores, setHasMultipleStores] = useState(false);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number; visible: boolean }>({
    content: "",
    x: 0,
    y: 0,
    visible: false,
  });

  useEffect(() => {
    fetch("/api/commercial-dashboard")
      .then(async (res) => {
        if (res.status === 401 || res.status === 404) {
          router.replace("/login");
          throw new Error("Redirigiendo a login");
        }
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "No fue posible cargar el dashboard comercial");
        }
        return res.json();
      })
      .then((json: CommercialPayload) => {
        setData(json);
        setMonth(json.filters.months[json.filters.months.length - 1] || json.filters.defaultMonth || json.filters.months[0] || "");
        setCoverage(json.filters.coverages.find((item) => item !== "Todos") || json.filters.defaultCoverage || "");
        setStore(json.filters.defaultStore || json.filters.stores[0] || "");
      })
      .catch((err: Error) => {
        if (err.message === "Redirigiendo a login") return;
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (json) setUser(json);
      })
      .catch(() => setUser(null));
  }, [router]);

  useEffect(() => {
    fetch("/api/my-stores")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json) && json.length > 1) {
          setHasMultipleStores(true);
        } else {
          setHasMultipleStores(false);
        }
      })
      .catch(() => setHasMultipleStores(false));
  }, []);

  const availableStores = useMemo(() => {
    if (!data) return [];
    return [
      ...new Set(
        data.ihsMaster
          .filter((row) => normalizeText(row.month) === normalizeText(month))
          .filter((row) => !coverage || row.coverage === coverage)
          .map((row) => row.store || "")
          .filter(Boolean),
      ),
    ].sort((a, b) => String(a).localeCompare(String(b), "es"));
  }, [coverage, data, month]);

  const availableCoverages = useMemo(() => {
    if (!data) return [];
    return [
      ...new Set(
        data.ihsMaster
          .filter((row) => normalizeText(row.month) === normalizeText(month))
          .map((row) => row.coverage || "")
          .filter(Boolean),
      ),
    ];
  }, [data, month]);

  useEffect(() => {
    if (!availableCoverages.length) return;
    if (!availableCoverages.includes(coverage)) {
      setCoverage(availableCoverages[0]);
    }
  }, [availableCoverages, coverage]);

  useEffect(() => {
    if (!availableStores.length) return;
    if (!availableStores.some((item) => normalizeStore(item) === normalizeStore(store))) {
      setStore(availableStores[0]);
    }
  }, [availableStores, store]);

  if (loading) {
    return (
      <div className={cx(styles.scope, styles.pageShell)}>
        <section className={styles.loadingCard}>
          <span className={styles.eyebrow}>Cargando</span>
          <h1>Dashboard comercial</h1>
          <p className={styles.emptyState}>Cargando dashboard comercial...</p>
        </section>
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className={cx(styles.scope, styles.pageShell)}>
        <section className={styles.loadingCard}>
          <span className={styles.eyebrow}>Error</span>
          <h1>No pudimos cargar la data</h1>
          <p className={styles.emptyState}>{error || "No hay data comercial disponible."}</p>
        </section>
      </div>
    );
  }

  const safeStore = availableStores.find((item) => normalizeStore(item) === normalizeStore(store)) || "";
  const rows = data.ihsMaster
    .filter((row) => normalizeText(row.month) === normalizeText(month))
    .filter((row) => normalizeStore(row.store) === normalizeStore(safeStore))
    .filter((row) => !coverage || row.coverage === coverage);

  const totals = {
    samsung: sum(rows, (row) => row.samsungAmount || 0),
    xBrand: sum(rows, (row) => row.xBrandAmount || 0),
    tcl: sum(rows, (row) => row.tclAmount || 0),
    hisense: sum(rows, (row) => row.hisenseAmount || 0),
    others: sum(rows, (row) => row.othersAmount || 0),
    total: sum(rows, (row) => row.totalAmount || 0),
  };

  const brands = [
    { brand: "Samsung", amount: totals.samsung },
    { brand: "X-Brand", amount: totals.xBrand },
    { brand: "TCL", amount: totals.tcl },
    { brand: "Hisense", amount: totals.hisense },
    { brand: "Otras", amount: totals.others },
  ]
    .map((item) => ({
      ...item,
      color: BRAND_COLORS[item.brand],
      share: totals.total ? item.amount / totals.total : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const leader = brands[0] || { brand: "--", amount: 0, share: 0, color: BRAND_COLORS.Samsung };
  const samsung = brands.find((item) => item.brand === "Samsung") || { brand: "Samsung", amount: 0, share: 0, color: BRAND_COLORS.Samsung };
  const compareBrand = leader.brand === "Samsung" ? brands.find((item) => item.brand !== "Samsung") : leader;
  const compareBrandLabel = compareBrand?.brand === "X-Brand" ? "LG" : compareBrand?.brand || "--";
  const compareBrandAmount = compareBrand?.amount || 0;
  const leaderDelta = samsung.amount - compareBrandAmount;
  const avatarInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || "?";

  const showTooltip = (content: string, event: ReactMouseEvent<HTMLElement>) => {
    const position = getTooltipPosition(event.clientX, event.clientY);
    setTooltip({
      content,
      x: position.x,
      y: position.y,
      visible: true,
    });
  };

  const moveTooltip = (event: ReactMouseEvent<HTMLElement>) => {
    const position = getTooltipPosition(event.clientX, event.clientY);
    setTooltip((current) => ({
      ...current,
      x: position.x,
      y: position.y,
    }));
  };

  const hideTooltip = () => {
    setTooltip((current) => ({ ...current, visible: false }));
  };

  const targetRow = data.targets.find((item) => normalizeStore(item.store) === normalizeStore(safeStore));
  const benchmark = data.benchmarks2025.find(
    (item) => normalizeStore(item.store) === normalizeStore(safeStore) && normalizeText(item.month) === normalizeText(month),
  );
  const samsungShareDelta =
    typeof benchmark?.samsungShare === "number" && typeof samsung.share === "number"
      ? samsung.share - benchmark.samsungShare
      : null;
  const samsungShareTrend =
    samsungShareDelta === null || Math.abs(samsungShareDelta) < 0.0001 ? null : samsungShareDelta > 0 ? "up" : "down";
  const tvav = data.tvavSummary.find(
    (item) =>
      normalizeStore(item.store) === normalizeStore(safeStore) &&
      normalizeText(item.month) === normalizeText(month) &&
      (!coverage || item.coverage === coverage),
  );
  const tvGap = safeNumber(tvav?.tvSellOut) - safeNumber(tvav?.tvTarget);
  const avGap = safeNumber(tvav?.avSellOut) - safeNumber(tvav?.avTarget);
  const tvPsPeGood = safeNumber(tvav?.tvCompliance) > 0.6;
  const avPsGood = safeNumber(tvav?.avCompliance) > 0.8;

  const weekly = [...groupBy(rows, (row) => row.week || "").entries()]
    .map(([week, weekRows]) => {
      const total = sum(weekRows, (row) => row.totalAmount || 0);
      const samsungAmount = sum(weekRows, (row) => row.samsungAmount || 0);
      const xBrandAmount = sum(weekRows, (row) => row.xBrandAmount || 0);
      const tclAmount = sum(weekRows, (row) => row.tclAmount || 0);
      const hisenseAmount = sum(weekRows, (row) => row.hisenseAmount || 0);
      const othersAmount = sum(weekRows, (row) => row.othersAmount || 0);
      return {
        week,
        label: weekRows[0]?.weekLabel || week.replace("Week ", ""),
        total,
        shares: [
          { brand: "Samsung", color: BRAND_COLORS.Samsung, value: total ? samsungAmount / total : 0, amount: samsungAmount },
          { brand: "X-Brand", color: BRAND_COLORS["X-Brand"], value: total ? xBrandAmount / total : 0, amount: xBrandAmount },
          { brand: "TCL", color: BRAND_COLORS.TCL, value: total ? tclAmount / total : 0, amount: tclAmount },
          { brand: "Hisense", color: BRAND_COLORS.Hisense, value: total ? hisenseAmount / total : 0, amount: hisenseAmount },
          { brand: "Otras", color: BRAND_COLORS.Otras, value: total ? othersAmount / total : 0, amount: othersAmount },
        ],
      };
    })
    .sort((a, b) => Number(a.label) - Number(b.label));

  const filteredProducts = data.products.filter(
    (row) => normalizeText(row.month) === normalizeText(month) && normalizeStore(row.store) === normalizeStore(safeStore),
  );
  const productMap = new Map<string, { sku: string; division: string; units: number; gross: number }>();
  for (const row of filteredProducts) {
    const key = row.sku || "";
    if (!key) continue;
    if (!productMap.has(key)) {
      productMap.set(key, { sku: key, division: row.division || "", units: 0, gross: 0 });
    }
    const current = productMap.get(key);
    if (!current) continue;
    current.units += safeNumber(row.sellOutUnits);
    current.gross += safeNumber(row.gross);
  }
  const totalUnits = [...productMap.values()].reduce((acc, row) => acc + row.units, 0);
  const topProducts = [...productMap.values()]
    .map((item) => ({ ...item, share: totalUnits ? item.units / totalUnits : 0 }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 7);

  return (
    <div className={cx(styles.scope, styles.pageShell)}>
      <div className={styles.dashboard}>

        <div className={styles.layoutShell}>
          <main className={styles.mainContent}>
            <section className={styles.topbar}>
              <div className={styles.topbarCopy}>
                <div className={styles.topbarHeadingRow}>
                  <div>
                    <span className={styles.eyebrow}>Resumen Comercial</span>
                    <h2>{safeStore}</h2>
                  </div>
                </div>
                <span className={styles.topbarUpdated}>Updated {new Date(data.generatedAt).toLocaleDateString("es-CL")}</span>
                </div>
                  <div className={styles.topbarMeta}>
                    <div className={cx(styles.topbarFilters, !canViewCoverageFilter && styles.topbarFiltersCompact)}>
                    {canViewCoverageFilter ? (
                      <label className={styles.filterSelectCard}>
                        <span>Coverage</span>
                        <select value={coverage} onChange={(e) => setCoverage(e.target.value)}>
                          {data.filters.coverages.filter((item) => item !== "Todos").map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    <label className={styles.filterSelectCard}>
                      <span>Mes</span>
                      <select value={month} onChange={(e) => setMonth(e.target.value)}>
                      {data.filters.months.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className={styles.filterSelectStack}>
                    
                    <label className={styles.filterSelectCard}>
                      <span>Store</span>
                      <select value={safeStore} onChange={(e) => setStore(e.target.value)}>
                        {availableStores.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {tvav ? (
              <section className={styles.tvavGrid}>
                <article className={cx(styles.tvavCard, styles.tvavTv)}>
                  <div className={styles.tvavShell}>
                    <div className={styles.tvavComplianceCard}>
                      <span className={cx(styles.tvavComplianceLabelChip, styles.tvavChipTv)}>Compliance TV</span>
                      <strong className={cx(styles.tvavCompliance, safeNumber(tvav.tvCompliance) >= 1 ? styles.tvavComplianceGood : styles.tvavComplianceAlert)}>
                        {formatPercent(tvav.tvCompliance)}
                      </strong>
                      <small className={styles.tvavComplianceSubtle}>
                        {safeNumber(tvav.tvCompliance) > 0.6 ? (
                          <>
                            <span>C/Real </span>
                            <strong>{formatPercent(tvav.tvBaseCompliance)}</strong>
                          </>
                        ) : (
                          "\u00A0"
                        )}
                      </small>
                    </div>
                    <div className={styles.tvavRight}>
                      <div className={styles.tvavSelloutCard}>
                        
                        <strong>{formatCurrency(tvav.tvSellOut)}</strong>
                        <span>Target meta: {formatCurrency(tvav.tvTarget)}</span>
                      </div>
                        <div className={styles.tvavSideMetrics}>
                          <div className={styles.tvavGapCard}>
                            <span className={tvGap >= 0 ? styles.tvavComplianceGood : styles.tvavComplianceAlert}>
                              GAP {tvGap >= 0 ? "▲" : "▼"}
                            </span>
                            <strong className={tvGap >= 0 ? styles.tvavComplianceGood : styles.tvavComplianceAlert}>
                              {formatCurrency(Math.abs(tvGap))}
                            </strong>
                          </div>
                          <div className={styles.tvavMiniCard}>
                            <span>PS</span>
                            <div className={styles.tvavMiniValues}>
                              <strong className={tvPsPeGood ? styles.tvavComplianceGood : undefined}>
                                {formatPercent(tvav.tvPsShare)}
                              </strong>
                              <small>{formatCurrency(tvav.tvPsAmount)}</small>
                            </div>
                          </div>
                          <div className={styles.tvavMiniCard}>
                            <span>PE</span>
                            <div className={styles.tvavMiniValues}>
                              <strong className={tvPsPeGood ? styles.tvavComplianceGood : undefined}>
                                {formatPercent(tvav.tvPeShare)}
                              </strong>
                              <small>{formatCurrency(tvav.tvPeAmount)}</small>
                            </div>
                          </div>
                        </div>
                    </div>
                  </div>
                </article>

                <article className={cx(styles.tvavCard, styles.tvavAv)}>
                  <div className={styles.tvavShell}>
                    <div className={styles.tvavComplianceCard}>
                      <span className={cx(styles.tvavComplianceLabelChip, styles.tvavChipAv)}>Compliance AV</span>
                      <strong className={cx(styles.tvavCompliance, safeNumber(tvav.avCompliance) >= 1 ? styles.tvavComplianceGood : styles.tvavComplianceAlert)}>
                        {formatPercent(tvav.avCompliance)}
                      </strong>
                      <small className={styles.tvavComplianceSubtle}>
                        {safeNumber(tvav.avCompliance) > 0.6 ? (
                          <>
                            <span>C/Real </span>
                            <strong>{formatPercent(tvav.avBaseCompliance)}</strong>
                          </>
                        ) : (
                          "\u00A0"
                        )}
                      </small>
                    </div>
                    <div className={styles.tvavRight}>
                      <div className={styles.tvavSelloutCard}>
                      
                        <strong>{formatCurrency(tvav.avSellOut)}</strong>
                        <span>Target meta: {formatCurrency(tvav.avTarget)}</span>
                      </div>
                        <div className={styles.tvavSideMetrics}>
                          <div className={styles.tvavGapCard}>
                            <span className={avGap >= 0 ? styles.tvavComplianceGood : styles.tvavComplianceAlert}>
                              GAP {avGap >= 0 ? "▲" : "▼"}
                            </span>
                            <strong className={avGap >= 0 ? styles.tvavComplianceGood : styles.tvavComplianceAlert}>
                              {formatCurrency(Math.abs(avGap))}
                            </strong>
                          </div>
                          <div className={styles.tvavMiniCard}>
                            <span>PS AV</span>
                            <div className={styles.tvavMiniValues}>
                              <strong className={avPsGood ? styles.tvavComplianceGood : undefined}>
                                {formatPercent(tvav.avPsShare)}
                              </strong>
                              <small>{formatCurrency(tvav.avPsAmount)}</small>
                            </div>
                          </div>
                        </div>
                    </div>
                  </div>
                </article>
              </section>
            ) : null}

            <section className={styles.summaryGrid}>
              <article className={styles.summaryCard}>
                <span>Store Total Sellout</span>
                <strong>{formatCurrency(totals.total)}</strong>
                <small>IHS Target Store: {formatPercent(targetRow?.target)}</small>
              </article>
              <article className={styles.summaryCard}>
                <span>Samsung IHS</span>
                <strong className={styles.shareSplit}>
                  <span>
                    <b className={styles.shareValueRow}>
                      <span>{formatPercent(samsung.share)}</span>
                      {samsungShareTrend ? (
                        <i
                          className={cx(styles.shareTrend, samsungShareTrend === "up" ? styles.deltaPositive : styles.deltaNegative)}
                          aria-label={samsungShareTrend === "up" ? "Sobre 2025" : "Bajo 2025"}
                        >
                          {samsungShareTrend === "up" ? "▲" : "▼"}
                        </i>
                      ) : null}
                    </b>
                    <small>2026</small>
                  </span>
                  <span>
                    <b>{benchmark ? formatPercent(benchmark.samsungShare) : "--"}</b>
                    <small>2025</small>
                  </span>
                </strong>
                <small />
              </article>
              <article className={styles.summaryCard}>
                <span>First</span>
                <strong className={styles.leaderValue} style={{ color: leader.color }}>
                  {leader.brand === "X-Brand" ? "LG" : leader.brand}
                </strong>
                <small>{formatPercent(leader.share)}</small>
              </article>
              <article className={styles.summaryCard}>
                <span>Accum. Difference</span>
                <strong className={leaderDelta >= 0 ? styles.deltaPositive : styles.deltaNegative}>
                  {formatCurrency(Math.abs(leaderDelta))} {leaderDelta >= 0 ? "▲" : "▼"}
                </strong>
                <small>Samsung vs {compareBrandLabel}</small>
              </article>
            </section>

            <section className={styles.panel}>
              <div className={styles.sectionHead}>
                <div>
                  <span className={styles.eyebrow}>Mix por Marca</span>
                  <h3>Participación mensual</h3>
                </div>
              </div>
              <div className={styles.brandKpiGrid}>
                {brands.map((item) => (
                  <div key={item.brand} className={styles.brandKpiCard}>
                    <div className={styles.brandKpiTop}>
                      <span className={styles.legendDot} style={{ background: item.color }} />
                      <strong>{item.brand === "X-Brand" ? "X-Brand" : item.brand}</strong>
                    </div>
                    <div className={styles.brandKpiValue}>{formatPercent(item.share)}</div>
                    <div className={styles.brandTrack}>
                      <div className={styles.brandFill} style={{ width: `${Math.max(item.share * 100, 1)}%`, background: item.color }} />
                    </div>
                    <small>{formatCurrency(item.amount)}</small>
                  </div>
                ))}
              </div>
            </section>

            <div className={styles.contentGrid}>
              <div className={styles.contentPrimary}>
                <section className={cx(styles.panel, styles.panelLarge)}>
                  <div className={styles.sectionHead}>
                    <div>
                      <span className={styles.eyebrow}>IHS Weekly</span>
                      <h3>Composición por Week</h3>
                    </div>
                  </div>
                  <div className={styles.weeklyChart} data-weeks={weekly.length}>
                    {weekly.map((week) => (
                      <div key={week.week} className={styles.weekColumn}>
                        <span className={styles.weekTotal}>{formatCurrency(week.total)}</span>
                        <div className={styles.weekStack}>
                          {week.shares.map((share) => (
                            <span
                              key={`${week.week}-${share.brand}`}
                              className={styles.weekSegment}
                              style={{ height: `${share.value * 100}%`, background: share.color }}
                              onMouseEnter={(event) => showTooltip(`${share.brand}: ${formatPercent(share.value)} · ${formatCurrency(share.amount)}`, event)}
                              onMouseMove={moveTooltip}
                              onMouseLeave={hideTooltip}
                            >
                              {share.value >= 0.08 ? <em>{formatPercent(share.value)}</em> : null}
                            </span>
                          ))}
                        </div>
                        <strong>Week {week.label}</strong>
                      </div>
                    ))}
                  </div>
                  <div className={styles.legendInline}>
                    {brands.map((item) => (
                      <span key={item.brand}>
                        <i style={{ background: item.color }} />
                        {item.brand}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              <div className={styles.contentSecondary}>
                <section className={styles.panel}>
                  <div className={styles.sectionHead}>
                    <div>
                      <span className={styles.eyebrow}>Top SKU</span>
                      <h3>Productos relevantes</h3>
                    </div>
                  </div>
                  <div className={styles.productCompactList}>
                    {topProducts.map((product) => (
                      <div key={product.sku} className={styles.productCompactRow}>
                        <div className={cx(styles.productShareChip, normalizeText(product.division).includes("av") ? styles.productShareChipAv : styles.productShareChipTv)}>
                          {formatPercent(product.share)}
                        </div>
                        <div className={styles.productInfo}>
                          <strong>{product.sku}</strong>
                        </div>
                        <div className={styles.productMetaInline}>
                          <div
                            className={styles.productMetric}
                          >
                            <strong>{formatNumber(product.units)}</strong>
                          </div>
                          <div
                            className={styles.productGross}
                          >
                            <strong>{formatCurrency(product.gross)}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!topProducts.length ? <div className={styles.emptyState}>No hay productos para este filtro.</div> : null}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div
        className={cx(styles.floatingTooltip, tooltip.visible && styles.floatingTooltipVisible)}
        style={{ left: tooltip.x, top: tooltip.y }}
      >
        {tooltip.content}
      </div>
    </div>
  );
}
