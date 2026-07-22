"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

const DEFAULT_DATA_TYPES = [
  "Suku Bunga The Fed",
  "Suku Bunga Acuan BI (BI Rate)",
  "Tingkat Bunga Penjaminan LPS",
  "Inflasi Indonesia",
  "Inflasi Sumut",
  "Cadangan Devisa",
];

interface MacroDataPoint {
  id: string;
  data_type: string;
  data_date: string;
  value: string;
  is_auto_date: boolean;
}

interface MacroMonitoringChartProps {
  token: string | null;
  /** Pass submissions only for legacy fallback (old JSON-based data). New data will come from API. */
  submissions?: { title: string; tableData: string; createdAt: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseVal(val: string): number {
  if (!val) return NaN;
  
  // Clean currency tags, percentages, devisa labels, and formatting
  let cleaned = val
    .replace(/USD/gi, "")
    .replace(/IDR/gi, "")
    .replace(/RP/gi, "")
    .replace(/%/g, "")
    .replace(/M/gi, "")
    .trim();

  // Replace comma with dot for decimal compatibility (Indonesian style)
  cleaned = cleaned.replace(/,/g, ".");

  // Handle range values like "3.50-3.75" by returning their average
  // Support standard hyphen (-), en-dash (–), em-dash (—), and minus sign (−)
  const dashRegex = /[-\u2013\u2014\u2212]/;
  if (dashRegex.test(cleaned)) {
    const parts = cleaned.split(dashRegex);
    const val1 = parseFloat(parts[0]);
    const val2 = parseFloat(parts[1]);
    if (!isNaN(val1) && !isNaN(val2)) {
      return (val1 + val2) / 2;
    }
  }

  return parseFloat(cleaned);
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function toLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toISODate(dateStr: string): string {
  try {
    return toLocalISODate(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

const MONTHS_ID = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function parseIndonesianDate(dateStr: string, fallbackYear?: number): Date | null {
  if (!dateStr) return null;
  let s = dateStr.toLowerCase().trim();
  
  // If there is a range like "18-19 Maret 2026" or "30 April-1 Mei 2025",
  // split by dash and take the second part which contains the full month and year.
  const dashRegex = /[-\u2013\u2014\u2212]/;
  if (dashRegex.test(s)) {
    const parts = s.split(dashRegex);
    if (parts.length > 1) {
      s = parts[1].trim(); // e.g. "19 maret 2026" or "1 mei 2025"
    }
  }

  // Replace Indonesian month names with English ones
  const monthsMap: Record<string, string> = {
    "januari": "january", "jan": "january",
    "februari": "february", "febuari": "february", "feb": "february",
    "maret": "march", "mar": "march",
    "april": "april", "apr": "april",
    "mei": "may",
    "juni": "june", "jun": "june",
    "juli": "july", "jul": "july",
    "agustus": "august", "agu": "august", "agt": "august",
    "september": "september", "sep": "september",
    "oktober": "october", "okt": "october",
    "november": "november", "nov": "november",
    "desember": "december", "des": "december",
  };

  for (const [id, en] of Object.entries(monthsMap)) {
    if (s.includes(id)) {
      s = s.replace(new RegExp(id, "g"), en);
      break;
    }
  }

  // If it only contains month and year (e.g. "june 2026"), prepend "01 "
  if (/^[a-z]+ \d{4}$/.test(s)) {
    s = "01 " + s;
  }

  // Check if a 4-digit year exists in the string. If not, append fallback year
  const hasYear = /\d{4}/.test(s);
  if (!hasYear && fallbackYear) {
    s = s + ` ${fallbackYear}`;
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;

  // Fallback: try parsing direct formats like DD/MM/YYYY or DD-MM-YYYY
  const parts = s.split(/[\/\-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    const dFallback = new Date(year, month, day);
    if (!isNaN(dFallback.getTime())) return dFallback;
  }

  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MacroMonitoringChart({ token, submissions }: MacroMonitoringChartProps) {
  const apiLoading = false;

  // Filter states
  const [selectedParameter, setSelectedParameter] = React.useState<string>("");
  const [filterMode, setFilterMode] = React.useState<"all" | "month" | "year" | "5years">("all");
  const [filterMonth, setFilterMonth] = React.useState<number>(new Date().getMonth()); // 0-indexed
  const [filterYear, setFilterYear] = React.useState<number>(new Date().getFullYear());

  // ─── Also parse legacy submissions (old JSON format) ────────────────────

  const legacyPoints: MacroDataPoint[] = React.useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    const result: MacroDataPoint[] = [];
    [...submissions]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .forEach((sub) => {
        try {
          const parsed = JSON.parse(sub.tableData);
          const sheet = parsed?.sheets?.find((s: any) => s.name.toLowerCase().trim() === "makro monitoring");
          if (!sheet) return;
          
          const headers = sheet.columns;
          const dtIdx = headers.findIndex((h: string) => h.toLowerCase().trim() === "data type" || h.toLowerCase().trim() === "rate type");
          if (dtIdx === -1) return;

          // Detect inner header row (such as Row 3 in screenshot with first cell "RATE TYPE")
          let innerHeaderRowIdx = -1;
          sheet.rows.forEach((row: string[], rIdx: number) => {
            const firstCell = row[dtIdx]?.toLowerCase().trim();
            if (rIdx > 0 && (firstCell === "rate type" || firstCell === "data type")) {
              innerHeaderRowIdx = rIdx;
            }
          });

          sheet.rows.forEach((row: string[], rIdx: number) => {
            if (rIdx === innerHeaderRowIdx) return; // skip the inner header row itself
            
            const dtVal = row[dtIdx];
            if (!dtVal || !dtVal.trim()) return;

            headers.forEach((colName: string, colIdx: number) => {
              const colLower = colName.toLowerCase().trim();
              // Skip No, Data Type, and Change columns
              if (colLower === "data type" || colLower === "rate type" || colLower === "change" || colLower === "no" || colLower === "nomor" || colLower === "previous") {
                return;
              }

              // Determine correct date for this row:
              // - If row index is above inner header row -> use top column header date (colName)
              // - If row index is below inner header row -> use inner header date cell (row 3)
              let dateStr = colName;
              if (innerHeaderRowIdx !== -1 && rIdx > innerHeaderRowIdx) {
                const innerDate = sheet.rows[innerHeaderRowIdx][colIdx];
                if (innerDate && innerDate.trim()) {
                  dateStr = innerDate;
                }
              }

              const fallbackYear = new Date(sub.createdAt).getFullYear();
              const dateObj = parseIndonesianDate(dateStr, fallbackYear);
              const dateISO = dateObj ? toLocalISODate(dateObj) : toISODate(sub.createdAt);
              const val = row[colIdx];
              if (!val || val.trim() === "" || val.toLowerCase().trim() === "isi...") return;

              result.push({
                id: `legacy-${sub.createdAt}-${dtVal}-${dateStr}`,
                data_type: dtVal.trim(),
                data_date: dateISO,
                value: val.trim(),
                is_auto_date: false,
              });
            });
          });
        } catch (e) {
          console.error("Error parsing legacy:", e);
        }
      });
    return result;
  }, [submissions]);

  // Sort legacy points by date
  const mergedPoints: MacroDataPoint[] = React.useMemo(() => {
    return [...legacyPoints].sort(
      (a, b) => new Date(a.data_date).getTime() - new Date(b.data_date).getTime()
    );
  }, [legacyPoints]);

  // ─── Available parameters ────────────────────────────────────────────────

  const availableParameters = React.useMemo(() => {
    const seen = new Set<string>();
    mergedPoints.forEach((p) => seen.add(p.data_type));
    // Use default order
    const ordered = DEFAULT_DATA_TYPES.filter((dt) => seen.has(dt));
    // Add any extras not in default list
    Array.from(seen).forEach((dt) => { if (!ordered.includes(dt)) ordered.push(dt); });
    return ordered;
  }, [mergedPoints]);

  // ─── Initialize selected parameter ──────────────────────────────────────

  React.useEffect(() => {
    if (availableParameters.length > 0 && (!selectedParameter || !availableParameters.includes(selectedParameter))) {
      const fed = availableParameters.find((p) => p.toLowerCase().includes("the fed") || p.toLowerCase().includes("fed"));
      setSelectedParameter(fed ?? availableParameters[0]);
    }
  }, [availableParameters, selectedParameter]);

  // ─── Available years from merged data ───────────────────────────────────

  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    mergedPoints.forEach((p) => years.add(new Date(p.data_date).getFullYear()));
    return Array.from(years).sort((a, b) => a - b);
  }, [mergedPoints]);

  // ─── Apply filter ────────────────────────────────────────────────────────

  const filteredPoints = React.useMemo(() => {
    if (!selectedParameter) return [];
    let pts = mergedPoints.filter((p) => p.data_type === selectedParameter);

    if (filterMode === "month") {
      pts = pts.filter((p) => {
        const d = new Date(p.data_date);
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      });
    } else if (filterMode === "year") {
      pts = pts.filter((p) => new Date(p.data_date).getFullYear() === filterYear);
    } else if (filterMode === "5years") {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 5);
      pts = pts.filter((p) => new Date(p.data_date) >= cutoff);
    }

    return pts;
  }, [mergedPoints, selectedParameter, filterMode, filterMonth, filterYear]);

  // ─── Build chart series ──────────────────────────────────────────────────

  const chartData = React.useMemo(() => {
    if (filteredPoints.length === 0) return null;
    const categories = filteredPoints.map((p) => formatDateLabel(p.data_date));
    const data = filteredPoints.map((p) => {
      const v = parseVal(p.value);
      return isNaN(v) ? 0 : v;
    });
    return { categories, series: [{ name: selectedParameter, data }] };
  }, [filteredPoints, selectedParameter]);

  const isDevisa = selectedParameter.toLowerCase().includes("devisa") || selectedParameter.toLowerCase().includes("cadangan");

  // ─── Empty states ────────────────────────────────────────────────────────

  const hasAnyData = mergedPoints.length > 0;

  if (apiLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent" />
          <p className="text-xs text-gray-500">Memuat data makro...</p>
        </div>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Perbandingan Makro Monitoring</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1">
          Grafik tren historis akan terbentuk setelah Anda menambahkan data historis di editor Makro Monitoring.
        </p>
      </div>
    );
  }

  // ─── Chart Options ───────────────────────────────────────────────────────

  const options: ApexOptions = {
    legend: { show: false },
    colors: ["#3B82F6"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 270,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
    },
    dataLabels: {
      enabled: false,
      formatter: (val, opts) => {
        const idx = opts?.dataPointIndex;
        if (idx !== undefined && filteredPoints[idx]) {
          return filteredPoints[idx].value;
        }
        return val;
      },
      style: {
        fontSize: "9px",
        fontFamily: "Outfit, sans-serif",
        fontWeight: "bold",
        colors: ["#FFFFFF"]
      },
      background: {
        enabled: true,
        foreColor: "#FFFFFF",
        backgroundColor: "#3B82F6",
        padding: 4,
        borderRadius: 4,
        borderWidth: 0,
      }
    },
    xaxis: {
      categories: chartData?.categories ?? [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: "#667085", fontSize: "10px", fontWeight: 500 }, rotate: -30 },
    },
    yaxis: {
      labels: {
        formatter: (val) => isDevisa ? `${val.toLocaleString("id-ID")} M` : `${val}%`,
        style: { colors: "#667085", fontSize: "11px", fontWeight: 500 },
      },
    },
    grid: {
      borderColor: "#F1F5F9",
      strokeDashArray: 5,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      strokeColors: ["#3B82F6"],
      colors: ["#FFFFFF"],
      hover: { size: 6 },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      x: { show: true },
      y: {
        formatter: (val, opts) => {
          const idx = opts?.dataPointIndex;
          if (idx !== undefined && filteredPoints[idx]) {
            const rawVal = filteredPoints[idx].value;
            if (isDevisa) {
              return rawVal.toLowerCase().includes("usd") ? rawVal : `USD ${rawVal}`;
            }
            return rawVal.includes("%") ? rawVal : `${rawVal}%`;
          }
          return isDevisa ? `${val.toLocaleString("id-ID")} M` : `${val}%`;
        }
      },
    },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-750 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 mb-1.5">
            Tren Data Makro Lintas Periode
          </span>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Visualisasi Makro Monitoring</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Tren historis indikator makro berdasarkan titik data yang tercatat.
          </p>
        </div>

        {/* Parameter Selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Parameter:</span>
          <select
            value={selectedParameter}
            onChange={(e) => setSelectedParameter(e.target.value)}
            className="text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-750 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm max-w-[180px]"
          >
            {availableParameters.map((param) => (
              <option key={param} value={param}>{param}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-gray-800">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Filter:</span>

        {/* Filter Mode Buttons */}
        {(["all", "year", "month", "5years"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setFilterMode(mode)}
            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition select-none ${
              filterMode === mode
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {mode === "all" ? "Semua" : mode === "year" ? "Per Tahun" : mode === "month" ? "Per Bulan" : "5 Tahun Terakhir"}
          </button>
        ))}

        {/* Year Picker */}
        {(filterMode === "year" || filterMode === "month") && (
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="text-[10px] font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
          >
            {(availableYears.length > 0 ? availableYears : [new Date().getFullYear()]).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}

        {/* Month Picker */}
        {filterMode === "month" && (
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="text-[10px] font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
          >
            {MONTHS_ID.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        )}

        {/* Data point count */}
        <span className="ml-auto text-[10px] text-gray-400">
          {filteredPoints.length} titik data
        </span>
      </div>

      {/* Chart or Empty State */}
      {!chartData || filteredPoints.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Tidak ada data untuk filter ini</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Coba ubah filter atau tambah data pada periode yang dipilih.</p>
        </div>
      ) : (
        <div className="w-full">
          <ReactApexChart options={options} series={chartData.series} type="area" height={270} />
        </div>
      )}
    </div>
  );
}
