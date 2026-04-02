"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./di-dashboard.module.css";

type StockDiRow = {
  store?: string;
  coverage?: string;
  division?: string;
  family?: string;
  serie?: string;
  sku?: string;
  week?: string;
  classification?: string;
  stock?: number;
  wws?: number;
  month?: string | null;
};

type CommercialPayload = {
  generatedAt: string;
  filters: {
    defaultMonth?: string;
    defaultCoverage?: string;
    defaultStore?: string;
    months: string[];
    stores: string[];
    coverages: string[];
  };
  stockDi?: StockDiRow[];
};

type UserInfo = {
  role?: string;
};

type DiDetailRow = {
  key: string;
  family: string;
  serie: string;
  sku: string;
  stock: number;
  wws: number;
  diStock: number;
  isDi: boolean;
};

const DI_BASELINE = 0.106;
const percentFormatter = new Intl.NumberFormat("es-CL", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const numberFormatter = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

function cx(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ");
}

function normalizeText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeMonth(value: unknown) {
  return normalizeText(value);
}

function normalizeStore(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`´]/g, "")
    .trim()
    .toLowerCase();
}

function safeNumber(value: unknown) {
  return typeof value === "number" && !Number.isNaN(value) ? value : Number(value || 0);
}

function formatPercent(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return percentFormatter.format(value);
}

function formatNumber(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return numberFormatter.format(value);
}

function sum<T>(items: T[], accessor: (item: T) => unknown) {
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

function repairMojibake(value: string) {
  return value
    .replace(/ViÃ±a/gi, "Viña")
    .replace(/VIĄA/gi, "VIÑA")
    .replace(/Vina/gi, "Viña")
    .replace(/Valparaiso/gi, "Valparaíso");
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStoreLabel(value: string) {
  const repaired = repairMojibake(String(value ?? "").trim()).replace(/[’'`´]/g, "");
  const normalized = normalizeStore(repaired);
  if (normalized === "falabella vina ii") return "Falabella Viña 2 Mall";
  if (normalized === "la polar vina del mar") return "La Polar Viña del Mar";
  return toTitleCase(repaired).replace(/Vina/g, "Viña").replace(/Viña Ii/g, "Viña 2 Mall");
}

function formatWeekLabel(value: string) {
  const text = String(value ?? "").trim();
  const match = text.match(/(\d{1,2})$/);
  return match ? `Week ${String(Number(match[1])).padStart(2, "0")}` : text;
}

function formatUpdatedDate(value: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export default function DeadInventoryDashboardPage() {
  const router = useRouter();
  const [payload, setPayload] = useState<CommercialPayload | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState("");
  const [coverage, setCoverage] = useState("");
  const [store, setStore] = useState("");
  const [division, setDivision] = useState("TV");
  const [family, setFamily] = useState("Todos");
  const [week, setWeek] = useState("");

  const getStockDiRows = (data: CommercialPayload | null) => (data?.stockDi || []).filter((row) => row.week && row.store);

  useEffect(() => {
    let active = true;

    fetch("/api/me", { cache: "no-store" })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/login");
          return null;
        }
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (active && data) setUser(data);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch("/api/commercial-dashboard", { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401 || res.status === 404) {
          router.replace("/login");
          return null;
        }
        if (!res.ok) {
          throw new Error("No fue posible cargar la data DI");
        }
        return res.json();
      })
      .then((data: CommercialPayload | null) => {
        if (!active || !data) return;
        setPayload(data);
        const stockDiRows = getStockDiRows(data);
        const diMonths = [...new Set(stockDiRows.map((row) => row.month).filter(Boolean) as string[])];
        const initialMonth = diMonths.at(-1) || data.filters.defaultMonth || data.filters.months.at(-1) || "";
        const monthRows = stockDiRows.filter((row) => normalizeMonth(row.month) === normalizeMonth(initialMonth));
        const monthCoverages = [...new Set(monthRows.map((row) => row.coverage).filter((item) => item && normalizeText(item) !== "todos") as string[])];
        const initialCoverage = monthCoverages[0] || data.filters.defaultCoverage || "";
        const coverageRows = monthRows.filter((row) => !initialCoverage || normalizeText(row.coverage) === normalizeText(initialCoverage));
        const monthStores = [...new Set(coverageRows.map((row) => row.store).filter(Boolean) as string[])];

        setMonth(initialMonth);
        setCoverage(initialCoverage);
        setStore(monthStores[0] || data.filters.defaultStore || "");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "No fue posible cargar la data DI");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  const canViewCoverageFilter = user?.role === "ADMIN" || user?.role === "SUPERVISOR";

  const coverageOptions = useMemo(() => {
    const monthScopedRows = getStockDiRows(payload).filter((row) => normalizeMonth(row.month) === normalizeMonth(month));
    return [...new Set(monthScopedRows.map((row) => row.coverage).filter((item) => item && normalizeText(item) !== "todos") as string[])];
  }, [month, payload]);

  useEffect(() => {
    if (!coverageOptions.length) return;
    if (!coverageOptions.includes(coverage)) {
      setCoverage(coverageOptions[0]);
    }
  }, [coverage, coverageOptions]);

  const monthRows = useMemo(() => {
    if (!payload) return [];
    return getStockDiRows(payload).filter((row) => normalizeMonth(row.month) === normalizeMonth(month));
  }, [payload, month]);

  const monthOptions = useMemo(() => {
    return [...new Set(getStockDiRows(payload).map((row) => row.month).filter(Boolean) as string[])];
  }, [payload]);

  const storeOptions = useMemo(() => {
    const filtered = monthRows.filter((row) => !coverage || normalizeText(row.coverage) === normalizeText(coverage));
    return [...new Set(filtered.map((row) => row.store).filter(Boolean) as string[])]
      .sort((a, b) => String(a).localeCompare(String(b), "es"));
  }, [coverage, monthRows]);

  useEffect(() => {
    if (!storeOptions.length) {
      setStore("");
      return;
    }
    if (!storeOptions.some((item) => normalizeStore(item) === normalizeStore(store))) {
      setStore(storeOptions[0]);
    }
  }, [store, storeOptions]);

  const baseRows = useMemo(() => {
    return monthRows
      .filter((row) => normalizeStore(row.store) === normalizeStore(store))
      .filter((row) => !coverage || normalizeText(row.coverage) === normalizeText(coverage))
      .filter((row) => row.week);
  }, [coverage, monthRows, store]);

  const weekOptions = useMemo(() => {
    return [...new Set(baseRows.map((row) => row.week).filter(Boolean) as string[])]
      .sort((a, b) => Number(a) - Number(b))
      .slice(-4);
  }, [baseRows]);

  useEffect(() => {
    if (!weekOptions.length) {
      setWeek("");
      return;
    }
    if (!weekOptions.includes(week)) {
      setWeek(weekOptions[weekOptions.length - 1]);
    }
  }, [week, weekOptions]);

  const divisionOptions = useMemo(() => {
    const rows = baseRows.filter((row) => !week || row.week === week);
    return [...new Set(rows.map((row) => row.division).filter(Boolean) as string[])]
      .sort((a, b) => a.localeCompare(b, "es"));
  }, [baseRows, week]);

  useEffect(() => {
    if (!divisionOptions.length) {
      setDivision("TV");
      return;
    }
    if (!divisionOptions.some((item) => normalizeText(item) === normalizeText(division))) {
      setDivision(divisionOptions.includes("TV") ? "TV" : divisionOptions[0]);
    }
  }, [division, divisionOptions]);

  const familyOptions = useMemo(() => {
    const rows = baseRows
      .filter((row) => !week || row.week === week)
      .filter((row) => normalizeText(row.division) === normalizeText(division));
    return ["Todos", ...new Set(rows.map((row) => row.family).filter(Boolean) as string[])];
  }, [baseRows, division, week]);

  useEffect(() => {
    if (!familyOptions.includes(family)) {
      setFamily("Todos");
    }
  }, [family, familyOptions]);

  const evaluatedRows = useMemo(() => {
    return baseRows
      .filter((row) => !week || row.week === week)
      .map((row) => {
        const wws = safeNumber(row.wws);
        const isDi = normalizeText(row.classification) === "deadinventory" || wws >= 8;
        return {
          ...row,
          wws,
          stock: safeNumber(row.stock),
          isDi,
        };
      });
  }, [baseRows, week]);

  const divisionSummary = useMemo(() => {
    const rows = evaluatedRows.filter((row) => normalizeText(row.division) === normalizeText(division));
    const totalStock = sum(rows, (row) => row.stock);
    const diStock = sum(rows.filter((row) => row.isDi), (row) => row.stock);
    const diShare = totalStock ? diStock / totalStock : 0;

    return {
      totalStock,
      diStock,
      diShare,
      deltaShare: diShare - DI_BASELINE,
    };
  }, [division, evaluatedRows]);

  const detailRows = useMemo<DiDetailRow[]>(() => {
    const rows = evaluatedRows
      .filter((row) => normalizeText(row.division) === normalizeText(division))
      .filter((row) => family === "Todos" || normalizeText(row.family) === normalizeText(family));

    return [...groupBy(rows, (row) => `${row.family}__${row.serie}__${row.sku}`).entries()]
      .map(([key, items]) => {
        const sample = items[0];
        const wws = Math.max(...items.map((item) => safeNumber(item.wws)));
        const diStock = sum(items.filter((item) => item.isDi), (item) => item.stock);
        return {
          key,
          family: sample.family || "Sin familia",
          serie: sample.serie || "--",
          sku: sample.sku || "--",
          stock: sum(items, (item) => item.stock),
          wws,
          diStock,
          isDi: wws >= 8 || diStock > 0,
        };
      })
      .sort((a, b) => Number(b.isDi) - Number(a.isDi) || b.wws - a.wws || b.stock - a.stock || a.sku.localeCompare(b.sku, "es"));
  }, [division, evaluatedRows, family]);

  if (loading) {
    return (
      <div className={styles.page}>
        <section className={styles.panel}>
          <span className={styles.eyebrow}>DI</span>
          <h1 className={styles.title}>Cargando Dead Inventory...</h1>
        </section>
      </div>
    );
  }

  if (error || !payload) {
    return (
      <div className={styles.page}>
        <section className={styles.panel}>
          <span className={styles.eyebrow}>Error</span>
          <h1 className={styles.title}>No pudimos cargar la data DI</h1>
          <p className={styles.description}>{error || "No fue posible cargar el módulo de Dead Inventory."}</p>
        </section>
      </div>
    );
  }

  const deltaIsPositive = divisionSummary.deltaShare > 0;
  const deltaClassName = deltaIsPositive ? styles.deltaBad : styles.deltaGood;
  const deltaArrow = deltaIsPositive ? "▲" : "▼";
  const shareClassName = divisionSummary.diShare > DI_BASELINE ? styles.metricBad : styles.metricGood;

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.topbar}>
          <div className={styles.hero}>
            <span className={styles.eyebrow}>Dead Inventory</span>
            <h1 className={styles.title}>{store || "Sin tienda"}</h1>
            <p className={styles.description}>Updated {formatUpdatedDate(payload.generatedAt)}</p>
          </div>

          <div className={cx(styles.filters, !canViewCoverageFilter && styles.filtersCompact)}>
            {canViewCoverageFilter ? (
              <label className={styles.filterCard}>
                <span>Coverage</span>
                <select value={coverage} onChange={(event) => setCoverage(event.target.value)}>
                  {coverageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className={styles.filterCard}>
              <span>Mes</span>
              <select value={month} onChange={(event) => setMonth(event.target.value)}>
                {monthOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterCard}>
              <span>Store</span>
              <select value={store} onChange={(event) => setStore(event.target.value)}>
                {storeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className={styles.filterPanel}>
        <div className={styles.toggleGroup}>
          <span>Categoría</span>
          <div className={styles.chipRow}>
            {divisionOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={cx(styles.chip, normalizeText(option) === normalizeText(division) && styles.chipActive)}
                onClick={() => {
                  setDivision(option);
                  setFamily("Todos");
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.weekFilter}>
          <span>Week</span>
          <div className={styles.chipRow}>
            {weekOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={cx(styles.chip, option === week && styles.chipActive)}
                onClick={() => {
                  setWeek(option);
                  setFamily("Todos");
                }}
              >
                {formatWeekLabel(option)}
              </button>
            ))}
          </div>
        </div>

        <label className={styles.familySelect}>
          <span>Familia</span>
          <select value={family} onChange={(event) => setFamily(event.target.value)}>
            {familyOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className={cx(styles.summaryCard, normalizeText(division) === "av" ? styles.summaryAv : styles.summaryTv)}>
        <div className={styles.summaryHead}>{division}</div>
        <div className={styles.kpiStrip}>
          <div className={styles.kpiBox}>
            <span>Total Stock</span>
            <strong>{formatNumber(divisionSummary.totalStock)}</strong>
          </div>
          <div className={styles.kpiBox}>
            <span>Stock DI</span>
            <strong>{formatNumber(divisionSummary.diStock)}</strong>
          </div>
          <div className={styles.kpiBox}>
            <span>% Dead Inventory</span>
            <strong className={shareClassName}>{formatPercent(divisionSummary.diShare)}</strong>
            <small className={deltaClassName}>
              {deltaArrow} {formatPercent(Math.abs(divisionSummary.deltaShare))}
            </small>
          </div>
        </div>
      </section>

      <section className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.familyCol}>Familia</th>
              <th className={styles.serieCol}>Serie</th>
              <th>SKU</th>
              <th className={styles.numericCol}>Stock</th>
              <th className={styles.numericCol}>WWS</th>
            </tr>
          </thead>
          <tbody>
            {detailRows.length ? (
              detailRows.map((row) => (
                <tr key={row.key}>
                  <td className={styles.familyCol}>{row.family}</td>
                  <td className={styles.serieCol}>{row.serie}</td>
                  <td>{row.sku}</td>
                  <td className={cx(styles.numericCol, row.wws >= 8 && styles.wwsAlert)}>{formatNumber(row.stock)}</td>
                  <td className={cx(styles.numericCol, row.wws >= 8 && styles.wwsAlert)}>{formatNumber(row.wws)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  No hay datos DI para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
