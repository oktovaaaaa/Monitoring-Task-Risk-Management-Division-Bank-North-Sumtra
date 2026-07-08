"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MarketRiskChartProps {
  tableDataList: string[];
}

export default function MarketRiskChart({ tableDataList }: MarketRiskChartProps) {
  // Parse data
  const chartData = React.useMemo(() => {
    let marketRiskSheet: any = null;
    
    // Find the latest table data that contains "Market Risk" sheet
    for (let i = tableDataList.length - 1; i >= 0; i--) {
      const dataStr = tableDataList[i];
      if (!dataStr) continue;
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed && parsed.sheets) {
          const sheet = parsed.sheets.find(
            (s: any) => s.name.toLowerCase().trim() === "market risk"
          );
          if (sheet) {
            marketRiskSheet = sheet;
            break;
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    if (!marketRiskSheet) return null;

    const { columns, rows } = marketRiskSheet;
    if (!columns || !rows || columns.length === 0) return null;

    // Filter columns to find date columns (exclude No, Uraian, empty, and actions)
    const dateCols = columns.filter((col: string) => {
      const val = col.toLowerCase().trim();
      return val !== "no" && val !== "uraian" && val !== "" && val !== "action" && val !== "actions";
    });

    if (dateCols.length === 0) return null;

    // Find index of date columns
    const dateIndices = dateCols.map((col: string) => columns.indexOf(col));

    // Find index of Uraian column
    let nameColIdx = columns.findIndex((col: string) => col.toLowerCase().trim() === "uraian");
    if (nameColIdx === -1) {
      nameColIdx = columns.findIndex((col: string) => col.toLowerCase().trim() === "kolom 1");
    }
    if (nameColIdx === -1) nameColIdx = 1; // Fallback

    const series = rows.map((row: string[]) => {
      const name = row[nameColIdx] || "Parameter";
      const data = dateIndices.map((idx: number) => {
        const cellVal = row[idx];
        if (!cellVal) return 0;
        const clean = cellVal.replace(/[^\d.-]/g, ""); // Keep numbers, negative sign, and decimal point
        return parseFloat(clean) || 0;
      });
      return { name, data };
    });

    return {
      categories: dateCols,
      series
    };
  }, [tableDataList]);

  // Track which series names are checked/active
  const [activeSeriesNames, setActiveSeriesNames] = React.useState<string[]>([]);

  // Automatically check only USD/IDR by default on first load
  React.useEffect(() => {
    if (chartData && chartData.series.length > 0 && activeSeriesNames.length === 0) {
      const usdSeries = chartData.series.find((s: any) => {
        const lower = s.name.toLowerCase().trim();
        return lower.includes("nilai tukar usd") || lower.includes("usd/idr") || lower.includes("usd idr") || lower.includes("nilai tukar");
      });
      if (usdSeries) {
        setActiveSeriesNames([usdSeries.name]);
      } else {
        setActiveSeriesNames([chartData.series[0].name]);
      }
    }
  }, [chartData, activeSeriesNames]);

  const filteredSeries = React.useMemo(() => {
    if (!chartData) return [];
    return chartData.series.filter((s: any) => activeSeriesNames.includes(s.name));
  }, [chartData, activeSeriesNames]);

  if (!chartData) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Tren Harian Market Risk</h4>
        <p className="text-xs text-gray-550 dark:text-gray-400 max-w-xs mt-1">
          Grafik garis akan otomatis terbentuk setelah Anda mengisi dan mengirimkan data sheet "Market Risk" dengan kolom tanggal harian.
        </p>
      </div>
    );
  }

  const seriesColors = ["#465FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

  const options: ApexOptions = {
    legend: {
      show: false, // Hide default legend
    },
    colors: chartData.series.map((s: any, idx: number) => seriesColors[idx % seriesColors.length]),
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "line",
      height: 320,
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "smooth",
      width: 3.5,
    },
    xaxis: {
      categories: chartData.categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          colors: "#667085",
          fontSize: "11px",
          fontWeight: 500,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#667085",
          fontSize: "11px",
          fontWeight: 500,
        },
      },
    },
    grid: {
      borderColor: "#E2E8F0",
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    markers: {
      size: 4,
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      x: {
        show: true,
      },
    },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Tren Harian Market Risk
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Perkembangan indikator Market Risk berdasarkan tanggal penginputan harian
        </p>
      </div>

      {/* Interactive Legend Badges */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {chartData.series.map((s: any, idx: number) => {
          const isActive = activeSeriesNames.includes(s.name);
          const color = seriesColors[idx % seriesColors.length];
          const activeBgClass = "bg-purple-50/50 border-purple-200 text-purple-700 dark:bg-purple-500/5 dark:border-purple-900/50 dark:text-purple-400 shadow-xs";
          const inactiveBgClass = "bg-gray-50/50 border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:bg-gray-900/50 dark:border-gray-800 dark:hover:bg-white/5 dark:hover:text-gray-300";

          return (
            <button
              key={s.name}
              type="button"
              onClick={() => {
                if (isActive) {
                  // Keep at least one series active to avoid blank chart
                  if (activeSeriesNames.length > 1) {
                    setActiveSeriesNames(activeSeriesNames.filter(n => n !== s.name));
                  }
                } else {
                  setActiveSeriesNames([...activeSeriesNames, s.name]);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition duration-200 cursor-pointer select-none ${isActive ? activeBgClass : inactiveBgClass}`}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full transition-all duration-200" 
                style={{ backgroundColor: color, transform: isActive ? "scale(1.15)" : "scale(0.85)" }} 
              />
              <span>{s.name}</span>
            </button>
          );
        })}
      </div>

      <div className="w-full">
        <ReactApexChart
          options={options}
          series={filteredSeries}
          type="line"
          height={320}
        />
      </div>
    </div>
  );
}
