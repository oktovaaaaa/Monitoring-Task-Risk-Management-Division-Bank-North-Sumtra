"use client";

import React from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface MacroMonitoringChartProps {
  tableDataList: string[];
}

export default function MacroMonitoringChart({ tableDataList }: MacroMonitoringChartProps) {
  // Parse data
  const chartData = React.useMemo(() => {
    let macroSheet: any = null;
    
    // Find the latest table data that contains "Makro Monitoring" sheet
    for (let i = tableDataList.length - 1; i >= 0; i--) {
      const dataStr = tableDataList[i];
      if (!dataStr) continue;
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed && parsed.sheets) {
          const sheet = parsed.sheets.find(
            (s: any) => s.name.toLowerCase().trim() === "makro monitoring"
          );
          if (sheet) {
            macroSheet = sheet;
            break;
          }
        }
      } catch (e) {
        // Ignore
      }
    }

    if (!macroSheet) return null;

    const { columns, rows } = macroSheet;
    if (!columns || !rows || columns.length === 0) return null;

    // Normalize column headers to lowercase trimmed
    const headers = columns.map((col: string) => col.toLowerCase().trim());
    
    // Find indexes
    const dataTypeIdx = headers.indexOf("data type");
    const currentIdx = headers.indexOf("current");
    const previousIdx = headers.indexOf("previous");

    if (dataTypeIdx === -1 || currentIdx === -1 || previousIdx === -1) return null;

    // Helper to parse percentages/ranges to float
    const parseVal = (val: string): number => {
      if (!val) return 0;
      const cleanVal = val.replace(/%/g, "").trim();
      if (cleanVal.includes("-")) {
        const parts = cleanVal.split("-").map(p => parseFloat(p.replace(",", ".")));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return parseFloat(((parts[0] + parts[1]) / 2).toFixed(3)); // Average
        }
      }
      const parsed = parseFloat(cleanVal.replace(",", "."));
      return isNaN(parsed) ? 0 : parsed;
    };

    const categories: string[] = [];
    const currentData: number[] = [];
    const previousData: number[] = [];

    rows.forEach((row: string[]) => {
      const name = row[dataTypeIdx];
      if (!name) return;
      
      categories.push(name);
      currentData.push(parseVal(row[currentIdx]));
      previousData.push(parseVal(row[previousIdx]));
    });

    if (categories.length === 0) return null;

    return {
      categories,
      series: [
        {
          name: "Current (Kini)",
          data: currentData,
        },
        {
          name: "Previous (Lalu)",
          data: previousData,
        }
      ]
    };
  }, [tableDataList]);

  if (!chartData) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Perbandingan Makro Monitoring</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1">
          Grafik area perbandingan akan otomatis terbentuk setelah Anda mengisi dan mengirimkan data sheet "Makro Monitoring" dengan kolom "Data Type", "Current", dan "Previous".
        </p>
      </div>
    );
  }

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
      fontFamily: "Outfit, sans-serif",
      labels: {
        colors: "#667085",
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    colors: ["#3B82F6", "#8B5CF6"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 320,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false
      }
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 90, 100]
      }
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
        formatter: (val) => `${val}%`,
        style: {
          colors: "#667085",
          fontSize: "11px",
          fontWeight: 500,
        },
      },
    },
    grid: {
      borderColor: "#F1F5F9",
      strokeDashArray: 5,
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
      size: 5,
      strokeWidth: 2,
      strokeColors: ["#3B82F6", "#8B5CF6"],
      colors: ["#FFFFFF", "#FFFFFF"],
      hover: {
        size: 7,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      x: {
        show: true,
      },
      y: {
        formatter: (val) => `${val}%`
      }
    },
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm">
      <div className="mb-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-750 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 mb-2">
          Komparasi Data Makro
        </span>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Visualisasi Makro Monitoring
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Perbandingan nilai Current vs Previous untuk setiap parameter indikator makro.
        </p>
      </div>

      <div className="w-full">
        <ReactApexChart
          options={options}
          series={chartData.series}
          type="area"
          height={320}
        />
      </div>
    </div>
  );
}
