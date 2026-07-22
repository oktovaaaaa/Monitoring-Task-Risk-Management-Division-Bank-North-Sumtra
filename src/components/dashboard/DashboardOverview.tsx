"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ApexOptions } from "apexcharts";

// Original components for admin fallback
import { EcommerceMetrics } from "@/components/ecommerce/EcommerceMetrics";
import MonthlyTarget from "@/components/ecommerce/MonthlyTarget";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import DemographicCard from "@/components/ecommerce/DemographicCard";
import MarketRiskChart from "@/components/dashboard/MarketRiskChart";

// Dynamically import ReactApexChart to support client-side rendering
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface Unit {
  id: string;
  name: string;
  description: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  unit_id: string;
  unit?: {
    id: string;
    name: string;
  };
  status: "open" | "pending" | "approved" | "rejected";
  submission_description?: string;
  submission_file_url?: string;
  submitted_by_id?: string;
  submitted_by?: {
    full_name: string;
  };
  submitted_at?: string;
  created_at: string;
  sub_tasks?: any[];
}

export default function DashboardOverview() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Toggle state to show old e-commerce dashboard
  const [showOldDashboard, setShowOldDashboard] = useState(false);

  // Selected unit for Admin radial completion chart
  const [selectedChartUnit, setSelectedChartUnit] = useState<string>("general");

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [cyberSubmissions, setCyberSubmissions] = useState<any[]>([]);
  const [selectedRecapYear, setSelectedRecapYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // Helper to parse submissions scores and compute category averages
  const calculateYearStats = (sub: any) => {
    if (!sub) return null;
    let scoresMap: Record<string, any> = {};
    try {
      scoresMap = typeof sub.scores === "string" ? JSON.parse(sub.scores || "{}") : (sub.scores || {});
    } catch (e) {
      console.error("Error parsing sub scores", e);
    }

    const getAvg = (codes: string[]) => {
      const vals = codes
        .map((c) => scoresMap[c])
        .filter((v) => v !== undefined && v !== null && v !== "" && !isNaN(Number(v)))
        .map(Number);
      return vals.length > 0 ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
    };

    // Subcategories for Inherent Risk
    const teknologiCodes = Array.from({ length: 10 }, (_, i) => `1.${i + 1}`);
    const produkCodes = Array.from({ length: 5 }, (_, i) => `2.${i + 1}`);
    const karakterCodes = Array.from({ length: 3 }, (_, i) => `3.${i + 1}`);
    const rekamCodes = Array.from({ length: 2 }, (_, i) => `4.${i + 1}`);

    const avgTek = getAvg(teknologiCodes);
    const avgProd = getAvg(produkCodes);
    const avgChar = getAvg(karakterCodes);
    const avgRec = getAvg(rekamCodes);

    // Inherent risk average
    const avgInh = parseFloat(((avgTek + avgProd + avgChar + avgRec) / 4).toFixed(2));

    // KPMR codes
    const kpmrCodes = [
      "1.1.a", "1.1.b", "1.2.a", "1.2.b", "1.3.a", "1.3.b", "1.3.c",
      "2.1.a", "2.1.b", "2.1.c", "2.1.d", "2.2.a", "2.2.b", "2.2.c", "2.2.d",
      "2.3.a", "2.3.b", "2.3.c", "2.3.d", "2.3.e", "2.3.f", "2.3.g", "2.3.h",
      "2.3.i", "2.3.j", "2.3.k", "2.3.l", "2.3.m",
      "3.1.a", "3.1.b", "3.1.c", "3.1.d", "3.1.e", "3.1.f", "3.1.g", "3.1.h",
      "3.2.a", "3.2.b", "3.2.c", "3.2.d", "3.2.e", "3.2.f", "3.2.g",
      "3.3.a", "3.3.b", "3.3.c", "3.3.d", "3.3.e",
      "4.1.a", "4.1.b", "4.1.c", "4.1.d",
      "4.2.a", "4.2.b", "4.2.c", "4.2.d", "4.2.e"
    ];
    const avgKpmr = getAvg(kpmrCodes);

    // Ketahanan codes
    const ketaCodes = [
      "1.a", "1.b", "1.c",
      "2.a", "2.b", "2.c", "2.d", "2.e", "2.f", "2.g", "2.h", "2.i", "2.j",
      "3.a", "3.b", "3.c", "3.d", "3.e",
      "4.a", "4.b", "4.c", "4.d", "4.e", "4.f"
    ];
    const avgKeta = getAvg(ketaCodes);

    // Maturitas average
    const avgMat = parseFloat(((avgKpmr + avgKeta) / 2).toFixed(2));

    return {
      year: sub.year,
      avgTek,
      avgProd,
      avgChar,
      avgRec,
      avgInh,
      avgKpmr,
      avgKeta,
      avgMat
    };
  };

  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing auth_user in Dashboard:", err);
      }
    }
  }, []);

  // Fetch tasks and units
  useEffect(() => {
    if (token && currentUser) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Both admin and employee fetch tasks (backend handles role-based scoping automatically)
          const tasksRes = await fetch("http://localhost:8080/api/tasks", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (tasksRes.ok) {
            const data = await tasksRes.json();
            if (data.status === "success") {
              setTasks(data.data || []);
            }
          }

          // Admins also fetch all units to calculate per-unit statistics
          const isAdmin = currentUser.role === "super_admin" || currentUser.role === "unit_admin";
          if (isAdmin) {
            const unitsRes = await fetch("http://localhost:8080/api/units", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (unitsRes.ok) {
              const data = await unitsRes.json();
              // handle both unitsData.ok and data.status === "success"
              const fetchedUnits = data.ok ? data.data : (data.status === "success" ? data.data : (data.data || []));
              setUnits(fetchedUnits);
            }
          }

          // Fetch cyber submissions if role is cyber or admin
          const isCyberOrAdmin = currentUser.role === "cyber" || currentUser.role === "super_admin" || currentUser.role === "unit_admin";
          if (isCyberOrAdmin) {
            const cyberRes = await fetch("http://localhost:8080/api/cyber-risk/submissions", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (cyberRes.ok) {
              const data = await cyberRes.json();
              if (data.status === "success" && data.data) {
                setCyberSubmissions(data.data || []);
                if (data.data.length > 0) {
                  setSelectedRecapYear(data.data[0].year);
                }
              }
            }
          }
        } catch (err) {
          console.error("Failed to load dashboard data:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [token, currentUser]);

  // Extract all table_data JSON strings from tasks' sub_task submissions
  const tableDataList = React.useMemo(() => {
    const list: string[] = [];
    tasks.forEach((t) => {
      if (t.sub_tasks) {
        t.sub_tasks.forEach((st: any) => {
          if (st.submissions) {
            st.submissions.forEach((subm: any) => {
              if (subm.table_data) {
                list.push(subm.table_data);
              }
            });
          }
        });
      }
    });
    return list;
  }, [tasks]);

  // --- Calculations for Cyber Risk Recap Dashboard ---
  const cyberStatsHistory = React.useMemo(() => {
    return cyberSubmissions
      .map((sub) => calculateYearStats(sub))
      .filter((x): x is Exclude<typeof x, null> => x !== null)
      .sort((a, b) => a.year - b.year);
  }, [cyberSubmissions]);

  const activeYearStats = React.useMemo(() => {
    const sub = cyberSubmissions.find((s) => s.year === selectedRecapYear);
    return calculateYearStats(sub);
  }, [cyberSubmissions, selectedRecapYear]);

  // Band calculation helpers for Cyber Risk Recap
  const getBand = (n: number | null) => {
    if (n === null || n === undefined) return 0;
    if (n <= 1) return 1;
    if (n <= 2) return 2;
    if (n <= 3) return 3;
    if (n <= 4) return 4;
    return 5;
  };

  const NM = {
    inh: { 0: "—", 1: "LOW", 2: "LOW TO MODERATE", 3: "MODERATE", 4: "MODERATE TO HIGH", 5: "HIGH" } as Record<number, string>,
    kpmr: { 0: "—", 1: "STRONG", 2: "SATISFACTORY", 3: "FAIR", 4: "MARGINAL", 5: "UNSATISFACTORY" } as Record<number, string>,
    keta: { 0: "—", 1: "STRONG", 2: "SATISFACTORY", 3: "FAIR", 4: "MARGINAL", 5: "UNSATISFACTORY" } as Record<number, string>,
    mat: { 0: "—", 1: "TINGKAT 1", 2: "TINGKAT 2", 3: "TINGKAT 3", 4: "TINGKAT 4", 5: "TINGKAT 5" } as Record<number, string>,
    risk: { 0: "—", 1: "LOW", 2: "LOW TO MODERATE", 3: "MODERATE", 4: "MODERATE TO HIGH", 5: "HIGH" } as Record<number, string>
  };

  const C = {
    0: "#94a3b8",
    1: "#10b981", // Emerald
    2: "#5f9a2f", // Light Green
    3: "#cf9c05", // Yellow
    4: "#dd7a1f", // Orange
    5: "#c0392b"  // Red
  } as Record<number, string>;

  // Trend Chart Series and Options
  const trendChartSeries = [
    {
      name: "Risiko Inheren",
      data: cyberStatsHistory.map((s) => s.avgInh)
    },
    {
      name: "KPMR Siber",
      data: cyberStatsHistory.map((s) => s.avgKpmr)
    },
    {
      name: "Ketahanan Siber",
      data: cyberStatsHistory.map((s) => s.avgKeta)
    },
    {
      name: "Maturitas Siber",
      data: cyberStatsHistory.map((s) => s.avgMat)
    }
  ];

  const trendChartOptions: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontSize: "11px",
      fontFamily: "Inter"
    },
    colors: ["#ea580c", "#475569", "#10b981", "#3b82f6"],
    chart: {
      type: "line",
      height: 320,
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false
      }
    },
    stroke: {
      width: 3,
      curve: "smooth"
    },
    xaxis: {
      categories: cyberStatsHistory.map((s) => s.year.toString()),
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "11px"
        }
      }
    },
    yaxis: {
      min: 1,
      max: 5,
      tickAmount: 4,
      labels: {
        formatter: (val) => val.toFixed(1),
        style: {
          colors: "#64748b",
          fontSize: "11px"
        }
      }
    },
    tooltip: {
      x: {
        show: true
      }
    }
  };

  // Category Breakdown Chart (Bar Chart)
  const breakdownSeries = [
    {
      name: "Skor Rata-Rata",
      data: activeYearStats ? [
        activeYearStats.avgTek,
        activeYearStats.avgProd,
        activeYearStats.avgChar,
        activeYearStats.avgRec,
        activeYearStats.avgKpmr,
        activeYearStats.avgKeta
      ] : []
    }
  ];

  const breakdownOptions: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      type: "bar",
      height: 320,
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: true,
        barHeight: "50%",
        dataLabels: {
          position: "right"
        }
      }
    },
    dataLabels: {
      enabled: true,
      textAnchor: "start",
      style: {
        colors: ["#0f172a"],
        fontSize: "11px",
        fontWeight: "bold"
      },
      formatter: (val: number) => val.toFixed(2),
      offsetX: 10
    },
    xaxis: {
      categories: [
        "A. Teknologi",
        "B. Produk Bank",
        "C. Karakteristik Org.",
        "D. Rekam Jejak Insiden",
        "E. KPMR Siber",
        "F. Ketahanan Siber"
      ],
      min: 1,
      max: 5,
      labels: {
        style: {
          colors: "#64748b",
          fontSize: "10px"
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: "#475569",
          fontSize: "11px",
          fontWeight: "bold"
        }
      }
    },
    tooltip: {
      y: {
        formatter: (val) => `${val.toFixed(2)} (Skor 1-5)`
      }
    }
  };

  // If page hasn't mounted on client, show a loading spinner
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  // Determine user role
  const isAdmin = currentUser && (currentUser.role === "super_admin" || currentUser.role === "unit_admin");
  const isEmployee = currentUser && (currentUser.role === "employee" || currentUser.role === "market_liquidity_risk" || currentUser.role === "cyber");

  // Fallback to default Admin dashboard if user is not employee and selected showOldDashboard
  if ((!isEmployee && showOldDashboard) || (!isAdmin && !isEmployee)) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 space-y-6 xl:col-span-7">
            <EcommerceMetrics />
            <MonthlySalesChart />
          </div>
          <div className="col-span-12 xl:col-span-5">
            <MonthlyTarget />
          </div>
          <div className="col-span-12">
            <StatisticsChart />
          </div>
          <div className="col-span-12 xl:col-span-5">
            <DemographicCard />
          </div>
          <div className="col-span-12 xl:col-span-7">
            <RecentOrders />
          </div>
        </div>

        {/* Restore Toggle Button */}
        {isAdmin && (
          <div className="flex justify-center pt-8 border-t border-gray-150 dark:border-gray-800">
            <button
              onClick={() => setShowOldDashboard(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl transition"
            >
              Kembali ke Dashboard Monitoring Tugas
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Calculations for Statistics ---
  const getTaskProgress = (task: any) => {
    if (!task.sub_tasks || task.sub_tasks.length === 0) {
      return task.status === "approved" ? 100 : 0;
    }
    const approvedSubtasks = task.sub_tasks.filter((st: any) => {
      return st.submissions && st.submissions.some((subm: any) => subm.status === "approved");
    }).length;
    return parseFloat(((approvedSubtasks / task.sub_tasks.length) * 100).toFixed(1));
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "approved").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const openTasks = tasks.filter((t) => t.status === "open").length;
  const rejectedTasks = tasks.filter((t) => t.status === "rejected").length;
  const activeTasks = openTasks + rejectedTasks;

  const totalTasksProgressSum = tasks.reduce((sum, t) => sum + getTaskProgress(t), 0);
  const completionPercentage =
    totalTasks > 0 ? parseFloat((totalTasksProgressSum / totalTasks).toFixed(1)) : 0;



  // Chart configuration for radial progress bar
  const chartSeries = [completionPercentage];
  const chartOptions: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 320,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: {
          size: "75%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5,
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: "14px",
            color: "#667085",
            offsetY: 20,
          },
          value: {
            fontSize: "32px",
            fontWeight: "700",
            offsetY: -20,
            color: "#1D2939",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: ["#00C9FF"], // Sleek blue gradient
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Selesai"],
  };

  // Dynamic variables for Admin radial chart
  let adminChartPercentage = completionPercentage;
  let adminChartLabel = "Selesai";
  let adminChartSubtext = `Progres Sistem: ${completedTasks} / ${totalTasks} Tugas selesai`;

  if (selectedChartUnit !== "general") {
    const targetUnit = units.find((u) => u.id === selectedChartUnit);
    const unitTasks = tasks.filter((t) => t.unit_id === selectedChartUnit);
    const unitTotal = unitTasks.length;
    const unitCompleted = unitTasks.filter((t) => t.status === "approved").length;
    const unitProgressSum = unitTasks.reduce((sum, t) => sum + getTaskProgress(t), 0);
    adminChartPercentage =
      unitTotal > 0 ? parseFloat((unitProgressSum / unitTotal).toFixed(1)) : 0;
    adminChartLabel = targetUnit ? targetUnit.name : "Unit";
    adminChartSubtext = `Progres Unit ${adminChartLabel}: ${unitCompleted} / ${unitTotal} Tugas selesai`;
  }

  // Chart configuration for Admin radial progress bar
  const adminChartSeries = [adminChartPercentage];
  const adminChartOptions: ApexOptions = {
    ...chartOptions,
    labels: [adminChartLabel],
  };

  // --- RENDER 1: EMPLOYEE DASHBOARD ---
  if (isEmployee) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
        {/* Welcome & Greetings Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-950/20 dark:to-brand-900/10 border border-gray-150 dark:border-gray-800 p-6 shadow-sm md:p-8">
          <div className="relative z-10 space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 uppercase tracking-wider">
              Dashboard Karyawan
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-gray-900 dark:text-white">
              Halo, {currentUser.full_name}!
            </h1>
            <p className="text-sm text-gray-700 dark:text-gray-300 max-w-xl font-normal leading-relaxed">
              Selamat datang kembali. Anda tergabung dalam unit{" "}
              <strong className="font-bold text-gray-950 dark:text-white underline underline-offset-4 decoration-2 decoration-brand-500">
                {currentUser.unit?.name || "Divisi Tugas"}
              </strong>
              . Berikut adalah laporan progres pengerjaan tugas divisi Anda.
            </p>
          </div>
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-brand-500/5 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-brand-400/10 blur-2xl pointer-events-none"></div>
        </div>

        {/* Cyber Risk Recap Dashboard (Only for role 'cyber' or admin) */}
        {(currentUser.role === "cyber" || currentUser.role === "super_admin") && cyberSubmissions.length > 0 && (
          <div className="space-y-6">
            {/* Header section with year selector */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Rekapitulasi Penilaian Keamanan Siber Tahunan
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Ringkasan historis tingkat kematangan dan profil risiko keamanan siber
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pilih Tahun:</span>
                <select
                  value={selectedRecapYear}
                  onChange={(e) => setSelectedRecapYear(Number(e.target.value))}
                  className="bg-gray-50 border border-gray-300 dark:bg-gray-900 dark:border-gray-800 text-gray-950 dark:text-white text-xs rounded-xl px-3 py-1.5 focus:outline-hidden focus:border-brand-500 font-semibold cursor-pointer"
                >
                  {cyberSubmissions.map((sub) => (
                    <option key={sub.year} value={sub.year}>
                      Tahun {sub.year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected year KPI cards */}
            {activeYearStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Risiko Inheren */}
                <div className="rounded-3xl border border-orange-200 dark:border-orange-950/20 bg-orange-50/10 p-5 shadow-theme-xs flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                    <span>Risiko Inheren</span>
                    <span className="opacity-60">(20 Parameter)</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                      {activeYearStats.avgInh.toFixed(2)}
                    </span>
                    <span
                      style={{ backgroundColor: C[getBand(activeYearStats.avgInh)] }}
                      className="text-[9px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
                    >
                      {NM.inh[getBand(activeYearStats.avgInh)]}
                    </span>
                  </div>
                </div>

                {/* 2. KPMR Siber */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800/40 bg-slate-50/20 p-5 shadow-theme-xs flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    <span>KPMR Siber</span>
                    <span className="opacity-60">(56 Parameter)</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                      {activeYearStats.avgKpmr.toFixed(2)}
                    </span>
                    <span
                      style={{ backgroundColor: C[getBand(activeYearStats.avgKpmr)] }}
                      className="text-[9px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
                    >
                      {NM.kpmr[getBand(activeYearStats.avgKpmr)]}
                    </span>
                  </div>
                </div>

                {/* 3. Ketahanan Siber */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800/40 bg-slate-50/20 p-5 shadow-theme-xs flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                    <span>Ketahanan Siber</span>
                    <span className="opacity-60">(24 Parameter)</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                      {activeYearStats.avgKeta.toFixed(2)}
                    </span>
                    <span
                      style={{ backgroundColor: C[getBand(activeYearStats.avgKeta)] }}
                      className="text-[9px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
                    >
                      {NM.keta[getBand(activeYearStats.avgKeta)]}
                    </span>
                  </div>
                </div>

                {/* 4. Maturitas Siber */}
                <div className="rounded-3xl border border-emerald-200 dark:border-emerald-950/20 bg-emerald-50/10 p-5 shadow-theme-xs flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <span>Maturitas Siber</span>
                    <span className="opacity-60">(Rata-rata)</span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                      {activeYearStats.avgMat.toFixed(2)}
                    </span>
                    <span
                      style={{ backgroundColor: C[getBand(activeYearStats.avgMat)] }}
                      className="text-[9px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase"
                    >
                      {NM.mat[getBand(activeYearStats.avgMat)]}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left: Annual Trend Line Chart */}
              <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm lg:col-span-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Tren Perkembangan Penilaian Siber Tahunan
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Perbandingan nilai atribut dari tahun ke tahun
                  </p>
                </div>
                <div className="mt-4 flex-1">
                  {cyberStatsHistory.length > 0 ? (
                    <ReactApexChart
                      options={trendChartOptions}
                      series={trendChartSeries}
                      type="line"
                      height={280}
                    />
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-sm text-gray-400 italic">
                      Data tidak mencukupi untuk membuat tren tahunan.
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Category Breakdown Bar Chart */}
              <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm lg:col-span-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Rincian Penilaian per Bidang ({selectedRecapYear})
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Skor rata-rata per bidang/faktor kuesioner siber
                  </p>
                </div>
                <div className="mt-4 flex-1">
                  {activeYearStats ? (
                    <ReactApexChart
                      options={breakdownOptions}
                      series={breakdownSeries}
                      type="bar"
                      height={280}
                    />
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-sm text-gray-400 italic">
                      Pilih tahun yang memiliki data penilaian valid.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Divider */}
            <div className="border-b border-gray-100 dark:border-gray-800 my-4" />
          </div>
        )}

        {/* Stats and Radial chart */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Completion circular gauge */}
          <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between lg:col-span-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Penyelesaian Tugas Unit
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Rasio tugas kelompok unit yang disetujui (Approved)
              </p>
            </div>

            <div className="relative flex justify-center py-6">
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-brand-500 border-t-transparent"></div>
                </div>
              ) : totalTasks === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-xs font-semibold text-gray-400">Tidak ada tugas unit</div>
                </div>
              ) : (
                <div className="w-full max-w-[280px]">
                  <ReactApexChart
                    options={chartOptions}
                    series={chartSeries}
                    type="radialBar"
                    height={240}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Progres kolektif:{" "}
                <strong className="font-bold text-gray-900 dark:text-white">
                  {completedTasks} dari {totalTasks} Tugas
                </strong>{" "}
                telah diselesaikan.
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 lg:col-span-7">
            {/* Card: Total */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Total Tugas
                </span>
                <div className="flex items-center justify-center w-10 h-10 bg-brand-50 rounded-xl dark:bg-brand-500/10 text-brand-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {loading ? "..." : totalTasks}
                </h4>
                <p className="text-[11px] text-gray-450 dark:text-gray-400 mt-1">
                  Seluruh beban tugas divisi unit
                </p>
              </div>
            </div>

            {/* Card: Selesai */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Tugas Selesai
                </span>
                <div className="flex items-center justify-center w-10 h-10 bg-success-50 rounded-xl dark:bg-success-500/10 text-success-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-extrabold text-success-600 dark:text-success-400">
                  {loading ? "..." : completedTasks}
                </h4>
                <p className="text-[11px] text-gray-450 dark:text-gray-400 mt-1">
                  Terkunci dan disetujui Admin
                </p>
              </div>
            </div>

            {/* Card: Menunggu Review */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Menunggu Review
                </span>
                <div className="flex items-center justify-center w-10 h-10 bg-warning-50 rounded-xl dark:bg-warning-500/10 text-warning-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-extrabold text-warning-600 dark:text-warning-400">
                  {loading ? "..." : pendingTasks}
                </h4>
                <p className="text-[11px] text-gray-450 dark:text-gray-400 mt-1">
                  Laporan pengerjaan dikirim
                </p>
              </div>
            </div>

            {/* Card: Aktif */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Tugas Aktif
                </span>
                <div className="flex items-center justify-center w-10 h-10 bg-error-50 rounded-xl dark:bg-error-500/10 text-error-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-3xl font-extrabold text-error-600 dark:text-error-455">
                  {loading ? "..." : activeTasks}
                </h4>
                <p className="text-[11px] text-gray-450 dark:text-gray-400 mt-1">
                  Belum dilaporkan atau ditolak
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Market Risk Daily Trend Line Chart */}
        <MarketRiskChart tableDataList={tableDataList} />

        {/* Tasks List Table */}
        <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3 dark:border-gray-800">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Tugas Aktif Unit Kerja
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Daftar status tugas kelompok yang sedang berlangsung
              </p>
            </div>
            <Link
              href="/my-tasks"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              Buka Halaman Tugas
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4.5">Nama Tugas</th>
                  <th scope="col" className="px-6 py-4.5">Status</th>
                  <th scope="col" className="px-6 py-4.5">Terakhir Dilaporkan</th>
                  <th scope="col" className="px-6 py-4.5 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                {tasks.slice(0, 5).map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white truncate max-w-xs">{task.title}</div>
                      <div className="text-xs text-gray-450 dark:text-gray-400 truncate max-w-sm mt-0.5">{task.description || "-"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.status === "open" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          Open
                        </span>
                      )}
                      {task.status === "pending" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-100/30">
                          Menunggu Review
                        </span>
                      )}
                      {task.status === "approved" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-100/30">
                          Selesai
                        </span>
                      )}
                      {task.status === "rejected" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400 border border-error-100/30">
                          Ditolak
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {task.submitted_by ? (
                        <div>
                          <span className="font-semibold text-gray-850 dark:text-white">{task.submitted_by.full_name}</span>
                          <span className="block text-[9px] text-gray-400 mt-0.5">{task.submitted_at ? new Date(task.submitted_at).toLocaleDateString() : ""}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Belum ada pengerjaan</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        href="/my-tasks"
                        className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-theme-xs transition"
                      >
                        {task.status === "approved" ? "Detail" : "Kerjakan"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER 2: ADMIN DASHBOARD ---
  // Get pending tasks count
  const pendingReviewTasks = tasks.filter((t) => t.status === "pending");

  // Calculate statistics per unit
  const unitProgressData = units.map((unit) => {
    const unitTasks = tasks.filter((t) => t.unit_id === unit.id);
    const total = unitTasks.length;
    const completed = unitTasks.filter((t) => t.status === "approved").length;
    const progressSum = unitTasks.reduce((sum, t) => sum + getTaskProgress(t), 0);
    const percentage = total > 0 ? Math.round(progressSum / total) : 0;
    return {
      id: unit.id,
      name: unit.name,
      total,
      completed,
      percentage,
    };
  }).sort((a, b) => b.percentage - a.percentage); // Sort by highest completion percentage

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Welcome Card for Admins */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-950/20 dark:to-brand-900/10 border border-gray-150 dark:border-gray-800 p-6 shadow-sm md:p-8">
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-warning-500/10 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300 border border-warning-200 dark:border-warning-800/40 uppercase tracking-wider">
            {currentUser.role === "super_admin" ? "Super Admin Panel" : "Unit Admin Panel"}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-gray-900 dark:text-white">
            Selamat Datang, {currentUser.full_name}!
          </h1>
          <p className="text-sm text-gray-700 dark:text-gray-300 max-w-xl font-normal leading-relaxed">
            Anda login sebagai <strong className="font-bold text-gray-950 dark:text-white">{currentUser.role === "super_admin" ? "Super Admin" : "Admin Unit"}</strong>. 
            Berikut adalah laporan ringkasan penyelesaian dan review tugas kerja seluruh divisi unit.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-brand-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-warning-400/10 blur-2xl pointer-events-none"></div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Tasks */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Total Tugas Sistem
            </span>
            <div className="flex items-center justify-center w-10 h-10 bg-brand-50 rounded-xl dark:bg-brand-500/10 text-brand-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {loading ? "..." : totalTasks}
            </h4>
            <p className="text-[11px] text-gray-450 dark:text-gray-400 mt-1">
              Seluruh tugas yang telah dibuat
            </p>
          </div>
        </div>

        {/* Pending Review */}
        <div className="rounded-3xl border border-warning-200 bg-warning-50/10 p-6 dark:border-warning-900/30 dark:bg-warning-500/[0.02] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-warning-700 dark:text-warning-400">
              Menunggu Review
            </span>
            <div className="flex items-center justify-center w-10 h-10 bg-warning-100 rounded-xl dark:bg-warning-500/20 text-warning-600">
              <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-extrabold text-warning-600 dark:text-warning-400">
              {loading ? "..." : pendingTasks}
            </h4>
            <p className="text-[11px] text-warning-500 dark:text-warning-500 mt-1 font-medium">
              Memerlukan tindakan persetujuan
            </p>
          </div>
        </div>

        {/* Approved Tasks */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Tugas Selesai (Approved)
            </span>
            <div className="flex items-center justify-center w-10 h-10 bg-success-50 rounded-xl dark:bg-success-500/10 text-success-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-extrabold text-success-600 dark:text-success-400">
              {loading ? "..." : completedTasks}
            </h4>
            <p className="text-[11px] text-gray-450 dark:text-gray-400 mt-1">
              Pengerjaan yang telah disetujui
            </p>
          </div>
        </div>

        {/* Active Tasks */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Tugas Aktif (Open/Rjct)
            </span>
            <div className="flex items-center justify-center w-10 h-10 bg-error-50 rounded-xl dark:bg-error-500/10 text-error-500">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h4 className="text-3xl font-extrabold text-error-600 dark:text-error-455">
              {loading ? "..." : activeTasks}
            </h4>
            <p className="text-[11px] text-gray-450 dark:text-gray-400 mt-1">
              Tugas dalam proses / perlu revisi
            </p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Overall Completion Circular Gauge with Dropdown selector */}
        <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between lg:col-span-5">
          <div className="flex items-center justify-between gap-4 border-b pb-3 dark:border-gray-800">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Progres Tugas
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Rasio tugas selesai ter-approve
              </p>
            </div>
            
            {/* Dropdown Selector */}
            <select
              value={selectedChartUnit}
              onChange={(e) => setSelectedChartUnit(e.target.value)}
              className="h-8 rounded-lg border border-gray-200 bg-white dark:bg-gray-900 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 dark:border-gray-850 shadow-theme-xs focus:border-brand-500 focus:outline-hidden cursor-pointer"
            >
              <option value="general">Semua Unit (General)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit: {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex justify-center py-6">
            {loading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-brand-500 border-t-transparent"></div>
              </div>
            ) : (selectedChartUnit === "general" ? totalTasks : tasks.filter(t => t.unit_id === selectedChartUnit).length) === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-gray-400">Belum ada data tugas dibuat</div>
              </div>
            ) : (
              <div className="w-full max-w-[280px]">
                <ReactApexChart
                  key={selectedChartUnit}
                  options={adminChartOptions}
                  series={adminChartSeries}
                  type="radialBar"
                  height={240}
                />
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              <strong className="font-bold text-gray-900 dark:text-white">
                {adminChartSubtext}
              </strong>
            </span>
          </div>
        </div>

        {/* Right: Per-Unit Tasks Progress */}
        <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm flex flex-col lg:col-span-7">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Persentase Progres per Unit Kerja
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Statistik penyelesaian tugas per divisi unit kerja aktif
            </p>
          </div>

          <div className="mt-6 flex-1 space-y-5 overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
            {loading ? (
              <div className="space-y-4 py-8">
                <div className="h-4 bg-gray-100 rounded-md animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded-md animate-pulse w-5/6"></div>
                <div className="h-4 bg-gray-100 rounded-md animate-pulse w-2/3"></div>
              </div>
            ) : unitProgressData.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400 italic">
                Belum ada unit kerja yang terdaftar.
              </div>
            ) : (
              unitProgressData.map((unit) => (
                <div key={unit.id} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <span className="truncate max-w-[250px] font-bold text-gray-900 dark:text-white">{unit.name}</span>
                    <span>
                      {unit.completed}/{unit.total} Tugas
                      <span className="ml-2 font-extrabold text-brand-650 dark:text-brand-400">{unit.percentage}%</span>
                    </span>
                  </div>
                  {/* Custom progress bar */}
                  <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      style={{ width: `${unit.percentage}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-blue-400 transition-all duration-500"
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Review Actions Section */}
      <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Persetujuan & Laporan Tugas Terbaru
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Daftar tugas terkirim oleh karyawan yang sedang menunggu review Anda
            </p>
          </div>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
          >
            Kelola Halaman Tugas
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Pending approvals table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-brand-500 border-t-transparent"></div>
              <p className="text-xs text-gray-450">Memuat data review...</p>
            </div>
          ) : pendingReviewTasks.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 bg-success-50 dark:bg-success-500/10 text-success-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-gray-850 dark:text-white">Semua Bersih!</h4>
              <p className="text-xs text-gray-450 dark:text-gray-400">
                Tidak ada laporan tugas karyawan yang sedang menunggu review Anda saat ini.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4.5">Nama Tugas</th>
                  <th scope="col" className="px-6 py-4.5">Unit / Divisi</th>
                  <th scope="col" className="px-6 py-4.5">Dikirim Oleh</th>
                  <th scope="col" className="px-6 py-4.5">Waktu Kirim</th>
                  <th scope="col" className="px-6 py-4.5 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                {pendingReviewTasks.slice(0, 5).map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-750 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                        {task.unit?.name || "Divisi"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">
                      {task.submitted_by?.full_name || "Karyawan"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-450 dark:text-gray-400">
                      {task.submitted_at ? new Date(task.submitted_at).toLocaleString("id-ID") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        href="/tasks"
                        className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-white bg-warning-500 hover:bg-warning-600 rounded-lg shadow-theme-xs transition"
                      >
                        Buka Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Toggle section to return to template dashboard */}
      <div className="flex justify-center pt-8 border-t border-gray-150 dark:border-gray-800">
        <button
          onClick={() => setShowOldDashboard(true)}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all uppercase tracking-wider"
        >
          Tampilkan Dashboard Template E-commerce
        </button>
      </div>
    </div>
  );
}
