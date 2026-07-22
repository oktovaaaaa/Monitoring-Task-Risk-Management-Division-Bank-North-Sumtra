"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import * as XLSX from "xlsx";
import MarketRiskChart from "@/components/dashboard/MarketRiskChart";
import MacroMonitoringChart from "@/components/dashboard/MacroMonitoringChart";

interface Unit {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
}

interface MarketLiquidityRiskSubmission {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  table_data: string; // JSON string of SheetData[]
  created_at: string;
  updated_at: string;
}

interface SheetData {
  name: string;
  columns: string[];
  rows: string[][];
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  merges?: { s: { r: number; c: number }; e: { r: number; c: number } }[];
}

export default function MarketLiquidityRiskDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<MarketLiquidityRiskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("Semua");

  // Dynamic available years from submissions
  const availableYears = React.useMemo(() => {
    const years = new Set<string>();
    submissions.forEach(sub => {
      if (sub.created_at) {
        const yr = new Date(sub.created_at).getFullYear().toString();
        years.add(yr);
      }
    });
    // Add current year if empty
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [submissions]);

  // Submissions filtered by year
  const filteredSubmissionsByYear = React.useMemo(() => {
    if (selectedYear === "Semua") return submissions;
    return submissions.filter(sub => {
      if (!sub.created_at) return false;
      const yr = new Date(sub.created_at).getFullYear().toString();
      return yr === selectedYear;
    });
  }, [submissions, selectedYear]);

  // Workspace Mode (instead of modals)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"create" | "edit" | "view">("create");
  const [selectedSubmission, setSelectedSubmission] = useState<MarketLiquidityRiskSubmission | null>(null);

  // Form Fields
  const [reportType, setReportType] = useState<"monthly" | "yearly">("monthly");
  const [reportMonth, setReportMonth] = useState<string>("Juli");
  const [reportYear, setReportYear] = useState<string>("2026");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFileURL, setFormFileURL] = useState("");
  const [formFileName, setFormFileName] = useState("");
  const [formTableData, setFormTableData] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Toast / Popup states
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (type: "success" | "error", message: string) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupOpen(true);
  };

  // Detail Modal states
  const [viewingSheetData, setViewingSheetData] = useState<{ title: string; columns: string[]; rows: string[][] } | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [macroYearSelectorOpen, setMacroYearSelectorOpen] = useState(false);

  const openSheetDetail = (sheetName: string, modalTitle: string) => {
    let latestSubmission = null;
    for (let i = filteredSubmissionsByYear.length - 1; i >= 0; i--) {
      if (filteredSubmissionsByYear[i].table_data) {
        try {
          const parsed = JSON.parse(filteredSubmissionsByYear[i].table_data);
          if (parsed && parsed.sheets && parsed.sheets.length > 0) {
            latestSubmission = parsed;
            break;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (!latestSubmission) {
      showPopup("error", "Belum ada data sheet yang tersimpan.");
      return;
    }

    // Special case for Cost of Fund (CoF) history across submissions
    if (sheetName.toLowerCase().includes("cost of fund") && extractedStats?.cof) {
      const cof = extractedStats.cof;
      if (!cof.isMonthlyInSheet) {
        setViewingSheetData({
          title: "Riwayat Lengkap Cost of Fund (CoF) Bulanan",
          columns: ["Bulan / Periode", "Nilai Cost of Fund"],
          rows: cof.allModalItems.map(item => [item.name, item.rate])
        });
        setIsDetailModalOpen(true);
        return;
      }
    }

    const sheet = latestSubmission.sheets.find(
      (s: any) => s.name.toLowerCase().trim().includes(sheetName.toLowerCase().trim())
    );

    if (!sheet || !sheet.rows || sheet.rows.length === 0) {
      showPopup("error", `Data untuk sheet "${sheetName}" tidak ditemukan atau masih kosong.`);
      return;
    }

    setViewingSheetData({
      title: modalTitle,
      columns: sheet.columns,
      rows: sheet.rows
    });
    setIsDetailModalOpen(true);
  };

  const handleDownloadExcel = () => {
    if (filteredSubmissionsByYear.length === 0) {
      showPopup("error", "Belum ada laporan yang dapat diunduh untuk tahun ini.");
      return;
    }
    
    let latestTableDataStr = "";
    let latestTitle = "Laporan_Market_Liquidity_Risk";
    
    const sorted = [...filteredSubmissionsByYear].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].table_data) {
        try {
          const parsed = JSON.parse(sorted[i].table_data);
          if (parsed && parsed.sheets && parsed.sheets.length > 0) {
            latestTableDataStr = sorted[i].table_data;
            latestTitle = sorted[i].title;
            break;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    if (!latestTableDataStr) {
      showPopup("error", "Tidak ditemukan data spreadsheet dalam laporan terbaru.");
      return;
    }

    try {
      const data = JSON.parse(latestTableDataStr);
      if (!data.sheets || data.sheets.length === 0) {
        showPopup("error", "Tidak ada sheet dalam data laporan.");
        return;
      }

      const wb = XLSX.utils.book_new();

      data.sheets.forEach((sheet: any) => {
        const sheetData: any[][] = [];
        sheetData.push(sheet.columns);
        if (sheet.rows && sheet.rows.length > 0) {
          sheetData.push(...sheet.rows);
        }

        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        const sheetName = sheet.name.substring(0, 30);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });

      const cleanTitle = latestTitle.replace(/[^a-zA-Z0-9_\-]/g, "_");
      const fileName = `${cleanTitle}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      showPopup("success", `Berhasil mengunduh 5 sheet Excel: ${fileName}`);
    } catch (err: any) {
      showPopup("error", `Gagal mengunduh Excel: ${err.message || err}`);
    }
  };

  const scrollToInputList = () => {
    const element = document.getElementById("daftar-input-data");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Load Auth State
  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse auth user:", err);
      }
    }
  }, []);

  // Fetch Market & Liquidity Risk Submissions
  const fetchSubmissions = useCallback(async (tok: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/market-liquidity-risk/submissions", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setSubmissions(data.data || []);
      } else {
        console.error("Failed to fetch submissions:", data.message);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchSubmissions(token);
    }
  }, [token, fetchSubmissions]);

  // Handle file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !token) return;
    const file = files[0];

    // Validate size limit (25MB)
    const maxFileSize = 25 * 1024 * 1024;
    if (file.size > maxFileSize) {
      showPopup("error", "Ukuran file melebihi batas maksimal 25MB");
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8080/api/tasks/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setFormFileURL(data.data.file_url);
        setFormFileName(data.data.file_name);
        showPopup("success", `File "${file.name}" berhasil diunggah!`);
      } else {
        throw new Error(data.message || "Gagal mengunggah file");
      }
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan saat mengunggah file.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Open Workspace for Creating
  // Helper to extract period from title
  const parseReportPeriodFromTitle = (title: string) => {
    const isYearly = title.toLowerCase().includes("makro monitoring");
    setReportType(isYearly ? "yearly" : "monthly");
    
    // Extract year and month if possible
    // Monthly titles look like: "Laporan Market & Liquidity Risk - Juli 2026"
    // Yearly titles look like: "Makro Monitoring - 2026"
    const parts = title.split(" - ");
    if (parts.length > 1) {
      const periodStr = parts[1].trim();
      if (isYearly) {
        setReportYear(periodStr);
      } else {
        const subParts = periodStr.split(" ");
        if (subParts.length === 2) {
          setReportMonth(subParts[0]);
          setReportYear(subParts[1]);
        }
      }
    }
  };

  const getPeriodFromTitle = (title: string) => {
    const parts = title.split(" - ");
    if (parts.length > 1) {
      return parts[1].trim();
    }
    return "-";
  };

  const clearTableDataValues = (tableDataStr: string) => {
    try {
      const parsed = JSON.parse(tableDataStr);
      if (!parsed || !parsed.sheets) return tableDataStr;
      
      parsed.sheets = parsed.sheets.map((sheet: any) => {
        const nameLower = sheet.name.toLowerCase().trim();
        const nextRows = sheet.rows ? sheet.rows.map((row: string[]) => {
          const newRow = [...row];
          if (nameLower.includes("rasio likuiditas")) {
            // Rasio Likuiditas: clear index 2 (Value)
            if (newRow.length > 2) newRow[2] = "";
          } else if (nameLower.includes("deposito tertinggi")) {
            // Deposito Tertinggi: clear index 1, 2, 3 (Nama Deposan, Nominal Deposito, Suku Bunga)
            for (let i = 1; i < newRow.length; i++) {
              newRow[i] = "";
            }
          } else if (nameLower.includes("market risk")) {
            // Market Risk: clear index 2 (Value)
            if (newRow.length > 2) newRow[2] = "";
          } else {
            // Custom sheets: clear columns index >= 2
            for (let i = 2; i < newRow.length; i++) {
              newRow[i] = "";
            }
          }
          return newRow;
        }) : [];

        if (nameLower.includes("market risk") && sheet.columns && sheet.columns.length > 2) {
          sheet.columns[2] = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
        }

        return {
          ...sheet,
          rows: nextRows
        };
      });
      return JSON.stringify(parsed);
    } catch (e) {
      return tableDataStr;
    }
  };

  const getLatestMonthlyTemplate = () => {
    let templateTableData = "";
    if (submissions && submissions.length > 0) {
      const sorted = [...submissions]
        .filter(s => !s.title.toLowerCase().includes("makro monitoring"))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].table_data) {
          try {
            const parsed = JSON.parse(sorted[i].table_data);
            if (parsed && parsed.sheets && parsed.sheets.length > 0) {
              // Filter out both yearly sheets from monthly template
              parsed.sheets = parsed.sheets.filter(
                (s: any) => s.name.toLowerCase().trim() !== "makro monitoring" && s.name.toLowerCase().trim() !== "cost of fund"
              );
              templateTableData = clearTableDataValues(JSON.stringify(parsed));
              break;
            }
          } catch (e) {}
        }
      }
    }

    if (!templateTableData) {
      // Default structure for monthly sheets: Rasio Likuiditas, Deposito Tertinggi, Market Risk
      templateTableData = JSON.stringify({
        sheets: [
          {
            name: "Rasio Likuiditas",
            color: "blue",
            columns: ["No", "Rasio", "Value", "Risk Appetite", "Risk Tolerance", "Risk Limit"],
            rows: [
              ["1", "LDR", "", "<92%", "92% - 95%", ">95%"],
              ["2", "AL/DPK", "", ">15%", "13% - 15%", "<13%"],
              ["3", "AL/NCD", "", ">60%", "55% - 60%", "<55%"],
              ["4", "AL/NAB/NCD", "", "≥70%", "65% - 70%", "<65%"],
              ["5", "LCR", "", "100%", "95% - 100%", "<95%"],
              ["6", "NSFR", "", "100%", "95% - 100%", "<95%"]
            ]
          },
          {
            name: "Deposito Tertinggi",
            color: "green",
            columns: ["No", "Nama Deposan", "Nominal Deposito", "Suku Bunga"],
            rows: [
              ["1", "", "", ""],
              ["2", "", "", ""],
              ["3", "", "", ""]
            ]
          },
          {
            name: "Market Risk",
            color: "purple",
            columns: ["No", "Uraian", new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })],
            rows: [
              ["1", "Nilai Tukar USD/IDR", ""],
              ["2", "Suku Bunga JIBOR 1 Bulan", ""],
              ["3", "Yield Surat Berharga Negara 10 Tahun", ""]
            ]
          }
        ]
      });
    }
    return templateTableData;
  };

  const cleanAndMigrateYearlyTableData = (tableDataStr: string): string => {
    try {
      const parsed = JSON.parse(tableDataStr);
      if (!parsed || !parsed.sheets) return tableDataStr;

      // 1. Strip duplicate "No" column from sheets if present
      parsed.sheets = parsed.sheets.map((sheet: any) => {
        if (sheet.columns && sheet.columns.length > 0) {
          const firstCol = sheet.columns[0]?.toLowerCase().trim();
          if (firstCol === "no") {
            return {
              ...sheet,
              columns: sheet.columns.slice(1),
              rows: sheet.rows ? sheet.rows.map((row: string[]) => row.slice(1)) : []
            };
          }
        }
        return sheet;
      });

      // 2. Check if Cost of Fund sheet is present and has data
      let cofSheet = parsed.sheets.find(
        (s: any) => s.name.toLowerCase().trim().includes("cost of fund") || s.name.toLowerCase().trim().includes("cof")
      );

      const hasCofData = cofSheet && cofSheet.rows && cofSheet.rows.some((row: string[]) => row.some((cell: string, cellIdx: number) => cellIdx > 0 && cell && cell.trim() !== ""));

      if (!hasCofData) {
        // Find existing Cost of Fund data from older submissions
        let existingCofSheet: any = null;
        if (submissions && submissions.length > 0) {
          const sorted = [...submissions].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].table_data) {
              try {
                const oldParsed = JSON.parse(sorted[i].table_data);
                const found = oldParsed?.sheets?.find(
                  (s: any) => s.name.toLowerCase().trim().includes("cost of fund") || s.name.toLowerCase().trim().includes("cof")
                );
                const oldHasCof = found && found.rows && found.rows.some((row: string[]) => row.some((cell: string, cellIdx: number) => cellIdx > 0 && cell && cell.trim() !== ""));
                if (oldHasCof) {
                  existingCofSheet = found;
                  break;
                }
              } catch (e) {}
            }
          }
        }

        if (existingCofSheet) {
          // Strip "No" column if present
          const firstCol = existingCofSheet.columns[0]?.toLowerCase().trim();
          if (firstCol === "no") {
            existingCofSheet = {
              ...existingCofSheet,
              columns: existingCofSheet.columns.slice(1),
              rows: existingCofSheet.rows.map((row: string[]) => row.slice(1))
            };
          }

          if (cofSheet) {
            // Replace the empty cofSheet with the one that has data!
            parsed.sheets = parsed.sheets.map((s: any) => 
              (s.name.toLowerCase().trim().includes("cost of fund") || s.name.toLowerCase().trim().includes("cof")) ? existingCofSheet : s
            );
          } else {
            // Append the existing cofSheet
            parsed.sheets.push(existingCofSheet);
          }
        }
      }

      return JSON.stringify(parsed);
    } catch (e) {
      return tableDataStr;
    }
  };

  const getMacroTemplate = (yearStr?: string) => {
    const yr = yearStr || new Date().getFullYear().toString();
    return JSON.stringify({
      sheets: [
        {
          name: "Makro Monitoring",
          color: "blue",
          columns: ["Data Type", `18 Juni ${yr}`],
          rows: [
            ["Suku Bunga The Fed", ""],
            ["Suku Bunga Acuan BI (BI Rate)", ""],
            ["Tingkat Bunga Penjaminan LPS", ""],
            ["Inflasi Indonesia", ""],
            ["Inflasi Sumut", ""],
            ["Cadangan Devisa", ""]
          ]
        },
        {
          name: "Cost of Fund",
          color: "yellow",
          columns: ["No", "Bulan", "CoF"],
          rows: [
            ["1", "Januari", ""],
            ["2", "Februari", ""],
            ["3", "Maret", ""],
            ["4", "April", ""],
            ["5", "Mei", ""],
            ["6", "Juni", ""],
            ["7", "Juli", ""],
            ["8", "Agustus", ""],
            ["9", "September", ""],
            ["10", "Oktober", ""],
            ["11", "November", ""],
            ["12", "Desember", ""]
          ]
        }
      ]
    });
  };

  // Sync formTitle with selection in create mode
  useEffect(() => {
    if (workspaceMode === "create") {
      if (reportType === "monthly") {
        setFormTitle(`Laporan Market & Liquidity Risk - ${reportMonth} ${reportYear}`);
      } else {
        setFormTitle(`Makro Monitoring - ${reportYear}`);
      }
    }
  }, [reportType, reportMonth, reportYear, workspaceMode]);

  const handleReportTypeChange = (type: "monthly" | "yearly") => {
    if (workspaceMode !== "create") return;
    setReportType(type);
    if (type === "monthly") {
      setFormTableData(getLatestMonthlyTemplate());
    } else {
      setFormTableData(getMacroTemplate(reportYear));
    }
  };

  // Open Workspace for Creating
  const openCreateWorkspace = () => {
    setWorkspaceMode("create");
    setSelectedSubmission(null);
    setReportType("monthly");
    
    const dateObj = new Date();
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const currentMonth = months[dateObj.getMonth()];
    const currentYear = dateObj.getFullYear().toString();
    setReportMonth(currentMonth);
    setReportYear(currentYear);
    
    setFormTitle(`Laporan Market & Liquidity Risk - ${currentMonth} ${currentYear}`);
    setFormDescription("");
    setFormFileURL("");
    setFormFileName("");
    
    setFormTableData(getLatestMonthlyTemplate());
    setIsWorkspaceOpen(true);
  };

  // Open Workspace using a specific submission as a template
  const openCreateWithTemplate = (sub: MarketLiquidityRiskSubmission, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkspaceMode("create");
    setSelectedSubmission(null);
    
    parseReportPeriodFromTitle(sub.title);
    
    setFormDescription(sub.description);
    setFormFileURL(""); // Clear attachment so they can upload a new one
    setFormFileName("");
    
    let templateData = "";
    if (sub.table_data) {
      try {
        const parsed = JSON.parse(sub.table_data);
        if (parsed && parsed.sheets) {
          // Filter out yearly sheets from monthly copies
          parsed.sheets = parsed.sheets.filter(
            (s: any) => s.name.toLowerCase().trim() !== "makro monitoring" && s.name.toLowerCase().trim() !== "cost of fund"
          );
          templateData = clearTableDataValues(JSON.stringify(parsed));
        }
      } catch (err) {}
    }
    
    setFormTableData(templateData || JSON.stringify({
      sheets: [
        { name: "Sheet 1", columns: ["Kolom 1", "Kolom 2"], rows: [["", ""]] }
      ]
    }));
    setIsWorkspaceOpen(true);
  };

  // Open Workspace for Creating a Dedicated yearly Macro Monitoring Submission
  const openCreateMacroWorkspace = () => {
    setWorkspaceMode("create");
    setSelectedSubmission(null);
    setReportType("yearly");
    
    const currentYear = new Date().getFullYear().toString();
    setReportYear(currentYear);
    setFormTitle(`Makro Monitoring - ${currentYear}`);
    setFormDescription("Laporan Parameter Makro Monitoring Tahunan");
    setFormFileURL("");
    setFormFileName("");
    
    const rawTemplate = getMacroTemplate(currentYear);
    setFormTableData(cleanAndMigrateYearlyTableData(rawTemplate));
    setIsWorkspaceOpen(true);
  };

  const openCreateMacroWorkspaceForYear = (year: string) => {
    setWorkspaceMode("create");
    setSelectedSubmission(null);
    setReportType("yearly");
    
    setReportYear(year);
    setFormTitle(`Makro Monitoring - ${year}`);
    setFormDescription(`Laporan Parameter Makro Monitoring Tahunan - ${year}`);
    setFormFileURL("");
    setFormFileName("");
    
    const rawTemplate = getMacroTemplate(year);
    setFormTableData(cleanAndMigrateYearlyTableData(rawTemplate));
    setIsWorkspaceOpen(true);
    setMacroYearSelectorOpen(false);
  };

  const openEditMacroWorkspaceForSub = (sub: MarketLiquidityRiskSubmission, e: React.MouseEvent) => {
    openEditWorkspace(sub, e);
    setMacroYearSelectorOpen(false);
  };

  // Global button handler for Macro Monitoring (opens a year selector modal)
  const handleManageMacro = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMacroYearSelectorOpen(true);
  };

  // Open Workspace for Editing
  const openEditWorkspace = (sub: MarketLiquidityRiskSubmission, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkspaceMode("edit");
    setSelectedSubmission(sub);
    parseReportPeriodFromTitle(sub.title);
    setFormTitle(sub.title);
    setFormDescription(sub.description);
    setFormFileURL(sub.file_url);
    setFormFileName(sub.file_name);
    
    const cleanData = sub.title.toLowerCase().includes("makro monitoring") 
      ? cleanAndMigrateYearlyTableData(sub.table_data || "")
      : sub.table_data;

    setFormTableData(cleanData || JSON.stringify({
      sheets: [
        { name: "Sheet 1", columns: ["Kolom 1", "Kolom 2"], rows: [["", ""]] }
      ]
    }));
    setIsWorkspaceOpen(true);
  };

  // Open Workspace for Viewing Detail
  const openViewWorkspace = (sub: MarketLiquidityRiskSubmission) => {
    setWorkspaceMode("view");
    setSelectedSubmission(sub);
    parseReportPeriodFromTitle(sub.title);
    setFormTitle(sub.title);
    setFormDescription(sub.description);
    setFormFileURL(sub.file_url);
    setFormFileName(sub.file_name);
    setFormTableData(sub.table_data || JSON.stringify({
      sheets: [
        { name: "Sheet 1", columns: ["Kolom 1", "Kolom 2"], rows: [["", ""]] }
      ]
    }));
    setIsWorkspaceOpen(true);
  };



  // Close Workspace
  const closeWorkspace = () => {
    setIsWorkspaceOpen(false);
    setSelectedSubmission(null);
  };

  // Save Submission (Create or Update)
  const handleSaveSubmission = async (editorDataStr: string) => {
    if (!formTitle.trim()) {
      showPopup("error", "Judul laporan wajib diisi");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: formTitle,
      description: formDescription,
      file_url: formFileURL,
      file_name: formFileName,
      table_data: editorDataStr,
    };

    try {
      const isEditing = workspaceMode === "edit";
      const url = isEditing && selectedSubmission
        ? `http://localhost:8080/api/market-liquidity-risk/submissions/${selectedSubmission.id}`
        : "http://localhost:8080/api/market-liquidity-risk/submissions";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan laporan");
      }

      showPopup("success", isEditing ? "Laporan berhasil diperbarui!" : "Laporan pribadi berhasil disimpan!");
      setIsWorkspaceOpen(false);
      if (token) fetchSubmissions(token);
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Submission
  const handleDeleteSubmission = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Apakah Anda yakin ingin menghapus data "${title}" secara permanen?`)) return;

    try {
      const res = await fetch(`http://localhost:8080/api/market-liquidity-risk/submissions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus laporan");
      }

      showPopup("success", "Laporan berhasil dihapus!");
      if (token) fetchSubmissions(token);
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    }
  };

  // Filter client side
  const filteredSubmissions = filteredSubmissionsByYear.filter((sub) => {
    const q = searchQuery.toLowerCase();
    return sub.title.toLowerCase().includes(q) || sub.description.toLowerCase().includes(q);
  });

  // Get latest periods for subtitle summary badges
  const latestMonthlyPeriod = React.useMemo(() => {
    const monthlySubs = submissions.filter(s => !s.title.toLowerCase().includes("makro monitoring"));
    if (monthlySubs.length === 0) return null;
    const sorted = [...monthlySubs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return getPeriodFromTitle(sorted[0].title);
  }, [submissions]);

  const latestYearlyPeriod = React.useMemo(() => {
    const yearlySubs = submissions.filter(s => s.title.toLowerCase().includes("makro monitoring"));
    if (yearlySubs.length === 0) return null;
    const sorted = [...yearlySubs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return getPeriodFromTitle(sorted[0].title);
  }, [submissions]);

  // Stats calculation
  const totalReports = filteredSubmissionsByYear.length;
  const totalFiles = filteredSubmissionsByYear.filter((s) => s.file_url !== "").length;
  const totalSpreadsheets = filteredSubmissionsByYear.filter((s) => {
    try {
      const parsed = JSON.parse(s.table_data);
      return parsed.sheets && parsed.sheets.some((sh: any) => sh.rows && sh.rows.length > 0 && sh.rows[0].some((c: any) => c !== ""));
    } catch {
      return false;
    }
  }).length;

  // Extracted Stats for Deposito and Cost of Fund
  const extractedStats = React.useMemo(() => {
    let depSheet = null;
    let depSubmission = null;
    let cofSheet = null;
    let cofSubmission = null;
    let liqSheet = null;
    let liqSubmission = null;

    // Helper to check if string contains month names
    const isMonthName = (str: string): boolean => {
      if (!str) return false;
      const lower = str.toLowerCase().trim();
      const months = [
        "januari", "februari", "maret", "april", "mei", "juni", 
        "juli", "agustus", "september", "oktober", "november", "desember",
        "jan", "feb", "mar", "apr", "mei", "jun", "jul", "agu", "sep", "okt", "nov", "des"
      ];
      return months.some(m => lower.includes(m));
    };

    // Scan submissions from newest to oldest to find latest sheet instances
    for (let i = filteredSubmissionsByYear.length - 1; i >= 0; i--) {
      const sub = filteredSubmissionsByYear[i];
      if (sub.table_data) {
        try {
          const parsed = JSON.parse(sub.table_data);
          if (parsed && parsed.sheets) {
            if (!depSheet) {
              const found = parsed.sheets.find(
                (s: any) => s.name.toLowerCase().trim().includes("deposito tertinggi") || s.name.toLowerCase().trim().includes("deposito")
              );
              if (found) {
                depSheet = found;
                depSubmission = parsed;
              }
            }
            if (!cofSheet) {
              const found = parsed.sheets.find(
                (s: any) => s.name.toLowerCase().trim().includes("cost of fund") || s.name.toLowerCase().trim().includes("cof")
              );
              if (found) {
                cofSheet = found;
                cofSubmission = parsed;
              }
            }
            if (!liqSheet) {
              const found = parsed.sheets.find(
                (s: any) => s.name.toLowerCase().trim().includes("likuiditas") || s.name.toLowerCase().trim().includes("rasio")
              );
              if (found) {
                liqSheet = found;
                liqSubmission = parsed;
              }
            }
          }
        } catch (e) {}
      }
    }

    let depositoData: { topItems: { name: string; amount: string; rate: string }[]; maxAmount: string; maxRate: string } | null = null;
    let cofData: { 
      overallRate: string; 
      isMonthlyInSheet: boolean;
      cardItems: { name: string; rate: string; amount?: string }[];
      allModalItems: { name: string; rate: string; amount?: string }[];
      rawColumns?: string[];
      rawRows?: string[][];
    } | null = null;
    let likuiditasData: {
      greenCount: number;
      yellowCount: number;
      redCount: number;
      items: { name: string; value: string; color: "green" | "yellow" | "red" | "gray" }[];
    } | null = null;

    // 1. Parse Deposito
    if (depSheet && depSheet.rows && depSheet.rows.length > 0) {
      const columns = depSheet.columns.map((c: string) => c.toLowerCase().trim());
      const nameIdx = columns.findIndex((c: string) => c.includes("nama") || c.includes("deposan") || c.includes("nasabah") || c.includes("uraian") || c.includes("kolom 1") || c.includes("data type") || c.includes("komponen"));
      const nominalIdx = columns.findIndex((c: string) => c.includes("nominal") || c.includes("jumlah") || c.includes("nilai") || c.includes("volume") || c.includes("saldo"));
      const rateIdx = columns.findIndex((c: string) => c.includes("rate") || c.includes("bunga") || c.includes("suku bunga") || c.includes("current"));

      const rowsData = depSheet.rows.map((row: string[]) => {
        const name = nameIdx !== -1 ? row[nameIdx] : "";
        const amount = nominalIdx !== -1 ? row[nominalIdx] : "";
        const rate = rateIdx !== -1 ? row[rateIdx] : "";
        return { name, amount, rate };
      }).filter((r: any) => r.name || r.amount);

      let maxAmount = "";
      let maxRate = "";
      let maxVal = -1;
      
      rowsData.forEach((r: any) => {
        if (r.amount) {
          const clean = r.amount.replace(/[^\d]/g, "");
          const num = parseInt(clean, 10);
          if (!isNaN(num) && num > maxVal) {
            maxVal = num;
            maxAmount = r.amount;
          }
        }
        if (r.rate) {
          const cleanRate = parseFloat(r.rate.replace(/%/g, "").replace(",", "."));
          const currentMaxRate = parseFloat(maxRate.replace(/%/g, "").replace(",", "."));
          if (!isNaN(cleanRate) && (isNaN(currentMaxRate) || cleanRate > currentMaxRate)) {
            maxRate = r.rate;
          }
        }
      });

      depositoData = {
        topItems: rowsData.slice(0, 3),
        maxAmount: maxAmount || (rowsData[0] ? rowsData[0].amount : "-"),
        maxRate: maxRate || (rowsData[0] ? rowsData[0].rate : "-"),
      };
    }

    // 2. Parse Cost of Fund
    if (cofSheet && cofSheet.rows && cofSheet.rows.length > 0) {
      const columns = cofSheet.columns.map((c: string) => c.toLowerCase().trim());
      const nameIdx = columns.findIndex((c: string) => c.includes("sumber") || c.includes("komponen") || c.includes("dana") || c.includes("nama") || c.includes("uraian") || c.includes("kolom 1") || c.includes("data type") || c.includes("bulan"));
      const rateIdx = columns.findIndex((c: string) => c.includes("rate") || c.includes("bunga") || c.includes("cost") || c.includes("suku bunga") || c.includes("current") || c.includes("persen") || c.includes("cof"));
      const amountIdx = columns.findIndex((c: string) => c.includes("nominal") || c.includes("jumlah") || c.includes("nilai") || c.includes("volume") || c.includes("saldo"));

      const rowsData = cofSheet.rows.map((row: string[]) => {
        const name = nameIdx !== -1 ? row[nameIdx] : "";
        const rate = rateIdx !== -1 ? row[rateIdx] : "";
        const amount = amountIdx !== -1 ? row[amountIdx] : "";
        return { name, rate, amount };
      }).filter((r: any) => r.name || r.rate);

      const hasMonths = rowsData.some((r: any) => isMonthName(r.name));

      if (hasMonths) {
        const monthlyRows = rowsData.filter((r: any) => isMonthName(r.name));
        const latestRow = monthlyRows[monthlyRows.length - 1];
        
        cofData = {
          overallRate: latestRow ? latestRow.rate : "-",
          isMonthlyInSheet: true,
          cardItems: monthlyRows.slice(-3).reverse(),
          allModalItems: monthlyRows,
          rawColumns: cofSheet.columns,
          rawRows: cofSheet.rows
        };
      } else {
        let overallRate = "";
        const totalRow = rowsData.find((r: any) => r.name.toLowerCase().includes("total") || r.name.toLowerCase().includes("cost of fund") || r.name.toLowerCase().includes("overall") || r.name.toLowerCase().includes("cof"));
        
        if (totalRow) {
          overallRate = totalRow.rate;
        } else {
          const lastRow = rowsData[rowsData.length - 1];
          if (lastRow) {
            overallRate = lastRow.rate;
          }
        }

        const historicalCof: { name: string; rate: string }[] = [];
        const sortedSubs = [...filteredSubmissionsByYear].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        sortedSubs.forEach((sub) => {
          if (sub.table_data) {
            try {
              const parsed = JSON.parse(sub.table_data);
              const subCofSheet = parsed.sheets.find(
                (s: any) => s.name.toLowerCase().trim().includes("cost of fund") || s.name.toLowerCase().trim().includes("cof")
              );
              if (subCofSheet && subCofSheet.rows && subCofSheet.rows.length > 0) {
                const subCols = subCofSheet.columns.map((c: string) => c.toLowerCase().trim());
                const subRateIdx = subCols.findIndex((c: string) => c.includes("rate") || c.includes("bunga") || c.includes("cost") || c.includes("suku bunga") || c.includes("cof"));
                const subNameIdx = subCols.findIndex((c: string) => c.includes("sumber") || c.includes("komponen") || c.includes("dana") || c.includes("nama") || c.includes("uraian"));
                
                const subRows = subCofSheet.rows.map((row: string[]) => {
                  const name = subNameIdx !== -1 ? row[subNameIdx] : "";
                  const rate = subRateIdx !== -1 ? row[subRateIdx] : "";
                  return { name, rate };
                }).filter((r: any) => r.name || r.rate);

                let subOverall = "";
                const subTotalRow = subRows.find((r: any) => r.name.toLowerCase().includes("total") || r.name.toLowerCase().includes("cost of fund") || r.name.toLowerCase().includes("overall") || r.name.toLowerCase().includes("cof"));
                
                if (subTotalRow) {
                  subOverall = subTotalRow.rate;
                } else {
                  const lastRow = subRows[subRows.length - 1];
                  if (lastRow) {
                    subOverall = lastRow.rate;
                  }
                }

                if (subOverall) {
                  const dateObj = new Date(sub.created_at);
                  const monthName = dateObj.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
                  if (!historicalCof.some(h => h.name === monthName)) {
                    historicalCof.push({
                      name: monthName,
                      rate: subOverall
                    });
                  }
                }
              }
            } catch (e) {}
          }
        });

        cofData = {
          overallRate: overallRate || "-",
          isMonthlyInSheet: false,
          cardItems: historicalCof.slice(0, 3),
          allModalItems: historicalCof,
          rawColumns: cofSheet.columns,
          rawRows: cofSheet.rows
        };
      }
    }

    // 3. Parse Rasio Likuiditas
    if (liqSheet && liqSheet.rows && liqSheet.rows.length > 0) {
      const columns = liqSheet.columns.map((c: string) => c.toLowerCase().trim());
      const nameIdx = columns.findIndex((c: string) => c.includes("rasio") || c.includes("nama") || c.includes("uraian") || c.includes("kolom 1") || c.includes("parameter"));
      const valIdx = columns.findIndex((c: string) => c.includes("value") || c.includes("realisasi") || c.includes("current") || c.includes("kini") || c.includes("nilai") || c.includes("hasil"));

      const colTypes = columns.map((col: string) => {
        const name = col.toLowerCase().trim();
        if (name.includes("hijau mud") || name.includes("hijau terang") || name.includes("hijau muda")) return "hijau_muda";
        if (name.includes("hijau") || name.includes("appetite") || name.includes("target")) return "hijau_tua";
        if (name.includes("kuning") || name.includes("yellow") || name.includes("jingga") || name.includes("oranye") || name.includes("tolerance") || name.includes("toleransi")) return "kuning";
        if (name.includes("merah mud") || name.includes("merah mu") || name.includes("pink")) return "merah_muda";
        if (name.includes("merah tu") || name.includes("merah") || name.includes("red") || name.includes("limit") || name.includes("batas")) return "merah_tua";
        if (name.includes("parameter") || name.includes("rasio") || name.includes("indikator")) return "parameter";
        return "realization";
      });

      let greenCount = 0;
      let yellowCount = 0;
      let redCount = 0;
      const items: { name: string; value: string; color: "green" | "yellow" | "red" | "gray" }[] = [];

      liqSheet.rows.forEach((row: string[]) => {
        const name = nameIdx !== -1 ? row[nameIdx] : "";
        const value = valIdx !== -1 ? row[valIdx] : "";
        if (!name) return;

        let cellColor: "green" | "yellow" | "red" | "gray" = "gray";
        if (value && value.trim() !== "") {
          let matchedType = "";
          for (let i = 0; i < colTypes.length; i++) {
            const type = colTypes[i];
            if (type === "realization" || type === "parameter") continue;
            const ruleText = row[i];
            if (!ruleText || ruleText.trim() === "") continue;
            const rule = parseRule(ruleText);
            if (rule && matchRule(value, rule)) {
              matchedType = type;
              break;
            }
          }

          if (matchedType === "hijau_tua" || matchedType === "hijau_muda") {
            cellColor = "green";
            greenCount++;
          } else if (matchedType === "kuning") {
            cellColor = "yellow";
            yellowCount++;
          } else if (matchedType === "merah_tua" || matchedType === "merah_muda") {
            cellColor = "red";
            redCount++;
          } else {
            cellColor = "green";
            greenCount++;
          }
        }

        items.push({ name, value, color: cellColor });
      });

      likuiditasData = {
        greenCount,
        yellowCount,
        redCount,
        items
      };
    }

    return {
      deposito: depositoData,
      cof: cofData,
      likuiditas: likuiditasData
    };
  }, [filteredSubmissionsByYear]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  // Guard: Role check
  if (!token || !currentUser || currentUser.role !== "market_liquidity_risk") {
    return (
      <div className="p-6 text-center bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800 max-w-md mx-auto my-10 shadow-md">
        <h2 className="text-error-500 font-semibold text-lg mb-2">Akses Ditolak</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Halaman ini hanya dapat diakses oleh karyawan dengan peran khusus Market & Liquidity Risk.
        </p>
        <Link href="/" className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  // ============================================
  // RENDER WORKSPACE (INLINE FULL-PAGE VIEW)
  // ============================================
  if (isWorkspaceOpen) {
    const isViewMode = workspaceMode === "view";
    const isEditMode = workspaceMode === "edit";

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-gray-800">
          <div className="space-y-1">
            <button
              onClick={closeWorkspace}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-purple-600 dark:text-gray-400 mb-2 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali ke Daftar Input
            </button>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {isViewMode 
                ? `Detail Laporan: ${formTitle}` 
                : isEditMode 
                ? `Ruang Kerja Edit: ${formTitle}` 
                : "Ruang Kerja Laporan Baru"}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
              {isViewMode 
                ? `Dibuat pada: ${selectedSubmission ? new Date(selectedSubmission.created_at).toLocaleString("id-ID") : ""}` 
                : "Input rincian data dan lembar spreadsheet pribadi Anda."}
            </p>
          </div>
          
          <button
            type="button"
            onClick={closeWorkspace}
            className="px-4 py-2.5 text-xs font-bold text-gray-650 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl shadow-theme-xs transition cursor-pointer"
          >
            Tutup & Kembali
          </button>
        </div>

        {/* Catatan Keterangan box */}
        {isViewMode ? (
          formDescription && (
            <div className="p-5 bg-purple-50/50 dark:bg-purple-500/[0.02] border border-purple-100 dark:border-purple-500/10 rounded-2xl space-y-1.5 shadow-theme-xs">
              <h3 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Catatan Keterangan:</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
                {formDescription}
              </p>
            </div>
          )
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div className="space-y-1.5">
                <Label>Tipe Laporan</Label>
                <select
                  disabled={workspaceMode !== "create"}
                  value={reportType}
                  onChange={(e) => handleReportTypeChange(e.target.value as "monthly" | "yearly")}
                  className="w-full h-11 text-sm rounded-xl border border-gray-300 dark:border-gray-800 bg-transparent px-4 focus:border-purple-500 focus:outline-hidden dark:text-white dark:bg-gray-800 cursor-pointer"
                >
                  <option value="monthly">Laporan Bulanan (Rasio, Deposito, CoF, Market Risk)</option>
                  <option value="yearly">Laporan Tahunan (Makro Monitoring)</option>
                </select>
              </div>

              {reportType === "monthly" && (
                <div className="space-y-1.5">
                  <Label>Bulan Laporan</Label>
                  <select
                    disabled={workspaceMode !== "create"}
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-full h-11 text-sm rounded-xl border border-gray-300 dark:border-gray-800 bg-transparent px-4 focus:border-purple-500 focus:outline-hidden dark:text-white dark:bg-gray-800 cursor-pointer"
                  >
                    {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Tahun Laporan</Label>
                <select
                  disabled={workspaceMode !== "create"}
                  value={reportYear}
                  onChange={(e) => setReportYear(e.target.value)}
                  className="w-full h-11 text-sm rounded-xl border border-gray-300 dark:border-gray-800 bg-transparent px-4 focus:border-purple-500 focus:outline-hidden dark:text-white dark:bg-gray-800 cursor-pointer"
                >
                  {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Judul Laporan</Label>
                <input
                  type="text"
                  readOnly
                  value={formTitle}
                  className="w-full h-11 text-sm rounded-xl border border-gray-300 bg-gray-50/50 dark:border-gray-800 dark:bg-white/[0.02] px-4 text-gray-500 focus:outline-hidden dark:text-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label>Unggah File Lampiran (Opsional)</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="risk-file-upload"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="risk-file-upload"
                    className={`flex-1 h-11 flex items-center justify-center gap-2 border border-dashed rounded-xl cursor-pointer transition text-xs font-semibold px-4 ${
                      formFileURL
                        ? "border-success-300 bg-success-50/10 text-success-600 hover:bg-success-50/20"
                        : "border-gray-300 hover:border-purple-400 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 dark:text-gray-300"
                    }`}
                  >
                    {uploadingFile ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-500 border-t-transparent"></div>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                    <span>{formFileURL ? `Ganti File (${formFileName})` : "Pilih Berkas..."}</span>
                  </label>
                  {formFileURL && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormFileURL("");
                        setFormFileName("");
                      }}
                      className="p-3 text-error-550 hover:bg-error-50 dark:hover:bg-error-500/10 border border-error-100 rounded-xl transition"
                      title="Hapus Lampiran"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Keterangan / Catatan</Label>
              <textarea
                placeholder="Tambahkan keterangan rincian pengerjaan laporan Anda..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                maxLength={500}
                className="w-full text-sm rounded-xl border border-gray-300 dark:border-gray-800 bg-transparent px-4 py-3 placeholder:text-gray-450 focus:border-purple-500 focus:outline-hidden dark:text-white h-20 resize-none"
              />
            </div>
          </div>
        )}

        {/* File attachment box for view mode */}
        {isViewMode && formFileURL && (
          <div className="p-4 border border-success-100 bg-success-50/10 dark:bg-success-500/[0.02] rounded-2xl flex items-center justify-between max-w-4xl shadow-theme-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-100 rounded-xl dark:bg-success-500/20 text-success-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h5 className="text-xs font-bold text-gray-900 dark:text-white">Lampiran File Terunduh</h5>
                <span className="text-[10px] text-gray-455 dark:text-gray-400 mt-0.5 block">{formFileName || "Download file lampiran"}</span>
              </div>
            </div>
            <a
              href={formFileURL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-success-600 hover:bg-success-700 rounded-xl transition cursor-pointer"
            >
              Unduh File
            </a>
          </div>
        )}

        {/* Table/Spreadsheet Editor or Viewer */}
        <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm">
          <TableEditor
            initialData={formTableData}
            onSubmit={isViewMode ? undefined : handleSaveSubmission}
            disabled={submitting}
          />
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER MAIN DATA LIST BANNER & STATS
  // ============================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Header gradient banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500 via-indigo-650 to-brand-600 p-6 shadow-xl md:p-8 text-white">
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white uppercase tracking-wider backdrop-blur-xs">
            Ruang Kerja Pribadi
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Dashboard Market & Liquidity Risk
          </h1>
          <p className="text-sm text-purple-100 max-w-xl font-normal leading-relaxed">
            Selamat datang di ruang penyimpanan pribadi Anda. Di sini Anda bisa menginput data spreadsheet, mengunggah laporan, dan memantau progres pengerjaan pribadi Anda. Data di dasbor ini sepenuhnya privat dan hanya Anda yang bisa melihatnya.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
        <div>
          <h2 className="text-lg font-bold text-gray-905 dark:text-white">Pemantauan Parameter Kunci</h2>
          <p className="text-xs text-gray-455 dark:text-gray-400">Ringkasan status kepatuhan limit, deposito, dan biaya dana</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-100 rounded-xl transition cursor-pointer shadow-xs"
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Unduh Excel (5 Sheet)
          </button>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1">Filter Tahun:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-750 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer shadow-sm"
          >
            <option value="Semua">Semua Tahun</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>Tahun {yr}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {/* Card: Rasio Likuiditas */}
        <div 
          onClick={() => openSheetDetail("likuiditas", "Rincian Data Rasio Likuiditas")}
          className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between min-h-[190px] cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-900/50 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
        >
          <div>
            <div className="flex items-center justify-between border-b pb-2.5 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-emerald-50 rounded-lg dark:bg-emerald-500/10 text-emerald-600">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rasio Likuiditas</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-100/30">
                Limit & Appetite
              </span>
            </div>
            
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <h4 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {loading ? "..." : `${extractedStats?.likuiditas?.greenCount || 0}`}
                </h4>
                <span className="text-xs text-gray-455 dark:text-gray-400 font-semibold">Aman</span>
              </div>
              <p className="text-[10px] text-gray-450 dark:text-gray-400 mt-0.5 font-medium">
                {extractedStats?.likuiditas?.yellowCount || 0} Toleransi &bull; {extractedStats?.likuiditas?.redCount || 0} Limit Breach
              </p>
            </div>
          </div>

          {/* Sub-list of Likuiditas indicators with status dots */}
          {extractedStats?.likuiditas?.items && extractedStats.likuiditas.items.length > 0 ? (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 space-y-1.5">
              {extractedStats.likuiditas.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      item.color === "green" 
                        ? "bg-emerald-500" 
                        : item.color === "yellow" 
                        ? "bg-amber-500" 
                        : item.color === "red"
                        ? "bg-red-500"
                        : "bg-gray-400"
                    }`}></span>
                    <span className="text-gray-500 dark:text-gray-400 truncate max-w-[130px] font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{item.value || "-"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 text-center">
              <span className="text-[10px] text-gray-455 italic">Isi sheet "Rasio Likuiditas" untuk melihat rincian</span>
            </div>
          )}
        </div>

        {/* Card 1: Deposito Tertinggi */}
        <div 
          onClick={() => openSheetDetail("deposito", "Rincian Data Deposito Tertinggi")}
          className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between min-h-[190px] cursor-pointer hover:border-purple-400 dark:hover:border-purple-900/50 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
        >
          <div>
            <div className="flex items-center justify-between border-b pb-2.5 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-lg dark:bg-purple-500/10 text-purple-600">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deposito Tertinggi</span>
              </div>
              {extractedStats?.deposito?.maxRate && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-100/30">
                  Rate: {extractedStats.deposito.maxRate}
                </span>
              )}
            </div>
            
            <div className="mt-4">
              <h4 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {loading ? "..." : (extractedStats?.deposito?.maxAmount || "Belum Ada Data")}
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Saldo nominal deposan tertinggi saat ini</p>
            </div>
          </div>

          {/* Sub-list of top depositors */}
          {extractedStats?.deposito?.topItems && extractedStats.deposito.topItems.length > 0 ? (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 space-y-1.5">
              {extractedStats.deposito.topItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-gray-400 truncate max-w-[150px] font-medium">{item.name || `Deposan ${idx + 1}`}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{item.amount}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 text-center">
              <span className="text-[10px] text-gray-450 italic">Isi sheet "Deposito Tertinggi" untuk melihat rincian</span>
            </div>
          )}
        </div>

        {/* Card 2: Cost of Fund (CoF) */}
        <div 
          onClick={() => openSheetDetail("cost of fund", "Rincian Data Cost of Fund")}
          className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between min-h-[190px] cursor-pointer hover:border-blue-400 dark:hover:border-blue-900/50 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
        >
          <div>
            <div className="flex items-center justify-between border-b pb-2.5 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-50 rounded-lg dark:bg-blue-500/10 text-blue-500">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost of Fund (CoF)</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-750 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100/30">
                Rasio Pendanaan
              </span>
            </div>
            
            <div className="mt-4">
              <h4 className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 tracking-tight">
                {loading ? "..." : (extractedStats?.cof?.overallRate && extractedStats.cof.overallRate !== "-" ? (extractedStats.cof.overallRate.includes("%") ? extractedStats.cof.overallRate : `${extractedStats.cof.overallRate}%`) : "Belum Ada Data")}
              </h4>
              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">Rata-rata tertimbang suku bunga dana</p>
            </div>
          </div>

          {/* Sub-list of CoF components */}
          {extractedStats?.cof?.cardItems && extractedStats.cof.cardItems.length > 0 ? (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 space-y-1.5">
              {extractedStats.cof.cardItems.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-gray-400 truncate max-w-[150px] font-medium">{comp.name || `Periode ${idx + 1}`}</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{comp.rate ? (comp.rate.includes("%") ? comp.rate : `${comp.rate}%`) : (comp.amount || "-")}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 text-center">
              <span className="text-[10px] text-gray-450 italic">Isi sheet "Cost of Fund" untuk melihat rincian</span>
            </div>
          )}
        </div>

        {/* Card 3: Ringkasan Aktivitas */}
        <div 
          onClick={scrollToInputList}
          className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex flex-col justify-between min-h-[190px] cursor-pointer hover:border-success-400 dark:hover:border-success-900/50 hover:shadow-md hover:scale-[1.01] transition-all duration-200"
        >
          <div>
            <div className="flex items-center justify-between border-b pb-2.5 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-50 rounded-lg dark:bg-purple-500/10 text-purple-600">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aktivitas Laporan</span>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-100/30">
                Pribadi
              </span>
            </div>
            
            <div className="mt-4">
              <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {loading ? "..." : totalReports}
              </h4>
              <p className="text-[10px] text-gray-450 dark:text-gray-400 mt-0.5">Total input laporan yang tersimpan</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="block text-[10px] text-gray-450">Spreadsheet</span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{totalSpreadsheets} Aktif</span>
            </div>
            <div className="border-l border-gray-100 dark:border-gray-800/60">
              <span className="block text-[10px] text-gray-450">File Lampiran</span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{totalFiles} Unggah</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarketRiskChart tableDataList={filteredSubmissionsByYear.map((sub) => sub.table_data)} />
        <MacroMonitoringChart 
          token={token}
          submissions={filteredSubmissionsByYear.map((sub) => ({
            title: sub.title,
            tableData: sub.table_data,
            createdAt: sub.created_at
          }))} 
        />
      </div>

      {/* Main List Section */}
      <div id="daftar-input-data" className="scroll-mt-6 bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daftar Input Data</h3>
            <div className="flex flex-wrap items-center gap-2.5 mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">Kelola berkas excel dan laporan pribadi yang Anda input</p>
              {latestMonthlyPeriod && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-550/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
                  Update Bulanan Terakhir: {latestMonthlyPeriod}
                </span>
              )}
              {latestYearlyPeriod && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                  Update Makro Terakhir: {latestYearlyPeriod}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari judul data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={50}
                className="h-10 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-transparent pl-9 pr-3 text-xs shadow-theme-xs placeholder:text-gray-450 focus:border-brand-500 focus:outline-hidden dark:text-white"
              />
            </div>
            <button
              onClick={handleManageMacro}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 rounded-xl transition shadow-sm cursor-pointer"
            >
              <svg className="w-4.5 h-4.5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Kelola Makro (Pertahun)
            </button>
            <button
              onClick={openCreateWorkspace}
              className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Input Data Baru
            </button>
          </div>
        </div>

        {/* Data list view */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
            <p className="text-xs text-gray-400">Memuat data personal...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/10 text-purple-400 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-gray-850 dark:text-white">Belum Ada Data Input</h3>
            <p className="text-xs text-gray-450 dark:text-gray-400 max-w-xs mx-auto leading-normal">
              {searchQuery
                ? `Tidak ditemukan kecocokan untuk pencarian "${searchQuery}"`
                : "Klik tombol '+ Input Data Baru' di atas untuk mulai membuat lembar spreadsheet excel dan file pribadi Anda."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-150 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4.5 w-12 text-center">No</th>
                  <th scope="col" className="px-6 py-4.5">Nama Laporan</th>
                  <th scope="col" className="px-6 py-4.5">Periode Laporan</th>
                  <th scope="col" className="px-6 py-4.5">Lampiran Berkas</th>
                  <th scope="col" className="px-6 py-4.5">Tanggal Input</th>
                  <th scope="col" className="px-6 py-4.5 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                {filteredSubmissions.map((sub, idx) => (
                  <tr 
                    key={sub.id} 
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-all duration-150 cursor-pointer"
                    onClick={() => openViewWorkspace(sub)}
                  >
                    <td className="px-6 py-4 text-center text-gray-450 dark:text-gray-500 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white line-clamp-1 hover:text-purple-650 dark:hover:text-purple-400 transition-colors">
                        {sub.title}
                      </div>
                      <div className="text-xs text-gray-455 dark:text-gray-400 line-clamp-1 mt-0.5 font-normal">
                        {sub.description || "Tidak ada keterangan."}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        sub.title.toLowerCase().includes("makro monitoring")
                          ? "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-100/30"
                          : "bg-purple-550/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-100/30"
                      }`}>
                        {getPeriodFromTitle(sub.title)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sub.file_url ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-100/30 max-w-[200px] truncate" title={sub.file_name}>
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="truncate text-[11px]">{sub.file_name || "Attachment"}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic font-normal">Tanpa File</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-normal">
                      {new Date(sub.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openViewWorkspace(sub)}
                          className="px-3 py-1.5 text-xs font-bold text-gray-650 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
                          title="Buka Ruang Kerja"
                        >
                          Buka
                        </button>
                        <button
                          onClick={(e) => openCreateWithTemplate(sub, e)}
                          className="p-2 text-gray-450 hover:text-purple-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition"
                          title="Gunakan sebagai Template Laporan Baru"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => openEditWorkspace(sub, e)}
                          className="p-2 text-gray-450 hover:text-purple-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition"
                          title="Edit Laporan"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDeleteSubmission(sub.id, sub.title, e)}
                          className="p-2 text-gray-450 hover:text-error-550 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition"
                          title="Hapus Laporan"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pop up success / error message */}
      <Modal isOpen={popupOpen} onClose={() => setPopupOpen(false)} className="max-w-[400px] p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          {popupType === "success" ? (
            <div className="w-16 h-16 bg-success-50 dark:bg-success-500/10 text-success-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 bg-error-50 dark:bg-error-500/10 text-error-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {popupType === "success" ? "Berhasil" : "Gagal"}
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {popupMessage}
          </p>
          
          <div className="pt-2 w-full">
            <button
              onClick={() => setPopupOpen(false)}
              className={`w-full py-2.5 rounded-xl text-white font-semibold transition ${
                popupType === "success" 
                  ? "bg-purple-600 hover:bg-purple-700" 
                  : "bg-error-500 hover:bg-error-600"
              }`}
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal for Deposito / Cost of Fund */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        className="max-w-4xl p-6"
      >
        <div className="space-y-4">
          <div className="border-b pb-3 dark:border-gray-800 flex justify-between items-center pr-10">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {viewingSheetData?.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Data lengkap yang diambil dari laporan spreadsheet terbaru.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-150 dark:border-gray-800 max-h-[450px]">
            <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 backdrop-blur-xs">
                <tr>
                  {viewingSheetData?.columns.map((col, idx) => (
                    <th key={idx} scope="col" className="px-6 py-4">
                      {col || `Kolom ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-850/80 text-sm">
                {viewingSheetData?.rows.map((row, rIdx) => (
                  <tr 
                    key={rIdx} 
                    className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors"
                  >
                    {row.map((cell, cIdx) => {
                      const colorClass = getCellColorClass(rIdx, cIdx, viewingSheetData.columns, row);
                      return (
                        <td 
                          key={cIdx} 
                          className={`px-6 py-3.5 ${
                            colorClass 
                              ? `${colorClass} border-r border-gray-150 dark:border-gray-800` 
                              : "text-gray-800 dark:text-gray-200 border-r border-gray-150 dark:border-gray-800 last:border-0"
                          }`}
                        >
                          {cell || "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-3 border-t dark:border-gray-850">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Select Year for Macro Monitoring */}
      {macroYearSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setMacroYearSelectorOpen(false)}
          />
          
          {/* Content */}
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transition-all z-10">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-outfit">
                Pilih Tahun Makro Monitoring
              </h3>
              <button 
                onClick={() => setMacroYearSelectorOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-4 space-y-3">
              {["2024", "2025", "2026", "2027", "2028"].map(yr => {
                const existing = submissions.find(
                  s => s.title.toLowerCase().includes("makro monitoring") && s.title.includes(yr)
                );
                
                return (
                  <div 
                    key={yr}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-white/[0.01]"
                  >
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">Tahun {yr}</div>
                      <div className="mt-0.5">
                        {existing ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-100/30">
                            Terisi (Makro & CoF)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400">
                            Belum Ada Data
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {existing ? (
                      <button
                        onClick={(e) => openEditMacroWorkspaceForSub(existing, e)}
                        className="px-3.5 py-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30 rounded-xl transition cursor-pointer"
                      >
                        Buka & Edit
                      </button>
                    ) : (
                      <button
                        onClick={() => openCreateMacroWorkspaceForYear(yr)}
                        className="px-3.5 py-1.5 text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs cursor-pointer"
                      >
                        Buat Baru
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// TABLE EDITOR & SPREADSHEET IMPLEMENTATION
// ============================================
interface Rule {
  op: "range" | ">" | "<" | ">=" | "<=" | "unknown";
  val1: number;
  val2?: number;
  isPercent: boolean;
}

function parseRule(str: string): Rule | null {
  if (!str) return null;
  let clean = str.toLowerCase().trim().replace(/\s+/g, "");
  clean = clean.replace(/s\/d|sampai|to|–|—/g, "-");
  
  const isPercent = clean.includes("%");
  const nums = clean.match(/[\d.,]+/g);
  if (!nums) return null;

  const parseNum = (s: string) => parseFloat(s.replace(",", "."));

  if (clean.includes("-") && nums.length >= 2) {
    const val1 = parseNum(nums[0]);
    const val2 = parseNum(nums[1]);
    return {
      op: "range",
      val1: Math.min(val1, val2),
      val2: Math.max(val1, val2),
      isPercent
    };
  }

  let op: Rule["op"] = "unknown";
  if (clean.startsWith(">=") || clean.startsWith("≥")) op = ">=";
  else if (clean.startsWith("<=") || clean.startsWith("≤")) op = "<=";
  else if (clean.startsWith(">")) op = ">";
  else if (clean.startsWith("<")) op = "<";
  else if (clean.startsWith("=") || clean.startsWith("==")) op = "range";

  if (op !== "unknown") {
    const val1 = parseNum(nums[0]);
    return { op, val1, isPercent };
  }

  const val1 = parseNum(nums[0]);
  return { op: "range", val1, val2: val1, isPercent };
}

function matchRule(valStr: string, rule: Rule): boolean {
  if (!valStr) return false;
  const cleanVal = valStr.trim();
  const hasPercent = cleanVal.includes("%");
  const numMatch = cleanVal.match(/[\d.,]+/);
  if (!numMatch) return false;
  let val = parseFloat(numMatch[0].replace(",", "."));

  if (rule.isPercent && !hasPercent && val <= 1.0) {
    val = val * 100;
  }

  switch (rule.op) {
    case ">":
      return val > rule.val1;
    case "<":
      return val < rule.val1;
    case ">=":
      return val >= rule.val1;
    case "<=":
      return val <= rule.val1;
    case "range":
      if (rule.val2 !== undefined) {
        return val >= rule.val1 && val <= rule.val2;
      }
      return val === rule.val1;
    default:
      return false;
  }
}

function getCellColorClass(
  rIdx: number,
  cIdx: number,
  columns: string[],
  row: string[]
): string {
  const colTypes = columns.map((col) => {
    const name = col.toLowerCase().trim();
    if (name.includes("hijau mud") || name.includes("hijau terang") || name.includes("hijau muda")) {
      return "hijau_muda";
    }
    if (name.includes("hijau") || name.includes("appetite") || name.includes("target")) {
      return "hijau_tua";
    }
    if (name.includes("kuning") || name.includes("yellow") || name.includes("jingga") || name.includes("oranye") || name.includes("tolerance") || name.includes("toleransi")) {
      return "kuning";
    }
    if (name.includes("merah mud") || name.includes("merah mu") || name.includes("pink")) {
      return "merah_muda";
    }
    if (name.includes("merah tu") || name.includes("merah") || name.includes("red") || name.includes("limit") || name.includes("batas")) {
      return "merah_tua";
    }
    if (name.includes("parameter") || name.includes("rasio") || name.includes("indikator")) {
      return "parameter";
    }
    return "realization";
  });

  if (colTypes[cIdx] !== "realization") {
    return "";
  }

  const valStr = row[cIdx];
  if (!valStr || valStr.trim() === "") return "";

  for (let i = 0; i < colTypes.length; i++) {
    const type = colTypes[i];
    if (type === "realization" || type === "parameter") continue;

    const ruleText = row[i];
    if (!ruleText || ruleText.trim() === "") continue;

    const rule = parseRule(ruleText);
    if (rule && matchRule(valStr, rule)) {
      switch (type) {
        case "hijau_tua":
          return "bg-green-600/20 text-green-800 dark:bg-green-600/30 dark:text-green-400 font-bold border-green-300 dark:border-green-800/60";
        case "hijau_muda":
          return "bg-teal-500/10 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400 font-semibold border-teal-200 dark:border-teal-800/40";
        case "kuning":
          return "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 font-semibold border-amber-200 dark:border-amber-800/40";
        case "merah_muda":
          return "bg-pink-500/10 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400 font-semibold border-pink-200 dark:border-pink-800/40";
        case "merah_tua":
          return "bg-red-600/20 text-red-800 dark:bg-red-650/30 dark:text-red-400 font-extrabold border-red-300 dark:border-red-900/60";
      }
    }
  }

  return "";
}

function checkCellMerge(rIdx: number, cIdx: number, merges?: any[]) {
  if (!merges) return { rowSpan: 1, colSpan: 1, isHidden: false };

  for (const m of merges) {
    if (rIdx === m.s.r && cIdx === m.s.c) {
      return {
        rowSpan: m.e.r - m.s.r + 1,
        colSpan: m.e.c - m.s.c + 1,
        isHidden: false
      };
    }
    if (rIdx >= m.s.r && rIdx <= m.e.r && cIdx >= m.s.c && cIdx <= m.e.c) {
      return {
        rowSpan: 1,
        colSpan: 1,
        isHidden: true
      };
    }
  }

  return { rowSpan: 1, colSpan: 1, isHidden: false };
}

function TableEditor({
  initialData,
  onSubmit,
  disabled
}: {
  initialData?: string;
  onSubmit?: (dataStr: string) => void;
  disabled?: boolean;
}) {
  const [subtitle, setSubtitle] = useState("");
  const [sheets, setSheets] = useState<SheetData[]>([
    { name: "Sheet 1", columns: ["Kolom 1", "Kolom 2"], rows: [["", ""]] }
  ]);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [showRowNumbers, setShowRowNumbers] = useState(true);
  const [editingSheetIdx, setEditingSheetIdx] = useState<number | null>(null);
  const [tempSheetName, setTempSheetName] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [sheetIdxToDelete, setSheetIdxToDelete] = useState<number | null>(null);
  const [successPopupOpen, setSuccessPopupOpen] = useState(false);
  const [successPopupMessage, setSuccessPopupMessage] = useState("");
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [tempImportedSheets, setTempImportedSheets] = useState<SheetData[] | null>(null);

  // Makro Monitoring period date picker states
  const [addPeriodOpen, setAddPeriodOpen] = useState(false);
  const [newPeriodDate, setNewPeriodDate] = useState(new Date().toISOString().split("T")[0]);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleExportActiveSheet = () => {
    const current = sheets[activeSheetIdx];
    if (!current) return;
    try {
      const wb = XLSX.utils.book_new();
      const sheetData: any[][] = [];
      sheetData.push(current.columns);
      if (current.rows && current.rows.length > 0) {
        sheetData.push(...current.rows);
      }
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const sheetName = current.name.substring(0, 30);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      const fileName = `${sheetName.replace(/[^a-zA-Z0-9_\-]/g, "_")}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err: any) {
      alert(`Gagal mengekspor sheet: ${err.message || err}`);
    }
  };

  const handleExportAllSheets = () => {
    if (sheets.length === 0) return;
    try {
      const wb = XLSX.utils.book_new();
      sheets.forEach((sheet) => {
        const sheetData: any[][] = [];
        sheetData.push(sheet.columns);
        if (sheet.rows && sheet.rows.length > 0) {
          sheetData.push(...sheet.rows);
        }
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        const sheetName = sheet.name.substring(0, 30);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
      const fileName = `Laporan_Market_Liquidity_Risk_Lengkap.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err: any) {
      alert(`Gagal mengekspor semua sheet: ${err.message || err}`);
    }
  };

  const handleStartRenameSheet = (idx: number, currentName: string) => {
    if (disabled) return;
    setEditingSheetIdx(idx);
    setTempSheetName(currentName);
  };

  const handleSaveSheetName = (idx: number) => {
    if (!tempSheetName.trim()) {
      setEditingSheetIdx(null);
      return;
    }
    const nextSheets = [...sheets];
    nextSheets[idx].name = tempSheetName.trim();
    setSheets(nextSheets);
    setEditingSheetIdx(null);
  };

  const getTabBgClass = (color?: string) => {
    switch (color) {
      case "green":
        return "bg-green-600 text-white shadow-theme-xs hover:bg-green-700";
      case "yellow":
        return "bg-amber-500 text-white shadow-theme-xs hover:bg-amber-600";
      case "red":
        return "bg-red-600 text-white shadow-theme-xs hover:bg-red-700";
      case "purple":
        return "bg-purple-600 text-white shadow-theme-xs hover:bg-purple-700";
      case "blue":
      default:
        return "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600";
    }
  };

  const getHeaderBgClass = (color?: string) => {
    switch (color) {
      case "green":
        return "bg-green-600 text-white dark:bg-green-700";
      case "yellow":
        return "bg-amber-500 text-white dark:bg-amber-600";
      case "red":
        return "bg-red-600 text-white dark:bg-red-700";
      case "purple":
        return "bg-purple-600 text-white dark:bg-purple-700";
      case "blue":
      default:
        return "bg-brand-500 text-white dark:bg-brand-600";
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataBytes = evt.target?.result;
        if (!dataBytes) return;
        const workbook = XLSX.read(dataBytes, { type: "array" });
        
        const importedSheets: SheetData[] = [];
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: false });
          
          if (jsonData.length > 0) {
            const rawCols = jsonData[0];
            const parsedCols = rawCols.map((col: any, idx: number) => {
              const colStr = col !== null && col !== undefined ? col.toString().trim() : "";
              return colStr || `Kolom ${idx + 1}`;
            });

            const colTypes = parsedCols.map((col: string) => {
              const name = col.toLowerCase().trim();
              if (name.includes("hijau mud") || name.includes("hijau terang") || name.includes("hijau muda")) {
                return "hijau_muda";
              }
              if (name.includes("hijau") || name.includes("appetite") || name.includes("target")) {
                return "hijau_tua";
              }
              if (name.includes("kuning") || name.includes("yellow") || name.includes("jingga") || name.includes("oranye")) {
                return "kuning";
              }
              if (name.includes("merah mud") || name.includes("merah mu") || name.includes("pink")) {
                return "merah_muda";
              }
              if (name.includes("merah tu") || name.includes("merah") || name.includes("red")) {
                return "merah_tua";
              }
              if (name.includes("parameter") || name.includes("rasio") || name.includes("indikator")) {
                return "parameter";
              }
              return "realization";
            });

            const rawRows = jsonData.slice(1);
            const parsedRows = rawRows.map((row: any[]) => {
              const newRow = Array(parsedCols.length).fill("");
              for (let i = 0; i < parsedCols.length; i++) {
                if (row && row[i] !== undefined && row[i] !== null) {
                  newRow[i] = row[i].toString();
                }
              }

              let rowIsPercent = false;
              colTypes.forEach((type, idx) => {
                if (type !== "realization" && type !== "parameter") {
                  const val = newRow[idx];
                  if (val && val.includes("%")) {
                    rowIsPercent = true;
                  }
                }
              });

              if (rowIsPercent) {
                colTypes.forEach((type, idx) => {
                  if (type === "realization") {
                    const valStr = newRow[idx];
                    if (valStr && valStr.trim() !== "") {
                      const valNum = parseFloat(valStr.replace(",", "."));
                      if (!isNaN(valNum) && !valStr.includes("%")) {
                        if (valNum <= 1.0) {
                          const pct = parseFloat((valNum * 100).toFixed(4));
                          newRow[idx] = `${pct}%`;
                        } else {
                          newRow[idx] = `${valNum}%`;
                        }
                      }
                    }
                  }
                });
              }

              return newRow;
            });

            const rawMerges = worksheet["!merges"] || [];
            const parsedMerges = rawMerges
              .filter((m) => m.s.r > 0)
              .map((m) => ({
                s: { r: m.s.r - 1, c: m.s.c },
                e: { r: m.e.r - 1, c: m.e.c }
              }));

            importedSheets.push({
              name: sheetName,
              columns: parsedCols.length > 0 ? parsedCols : ["Kolom 1", "Kolom 2"],
              rows: parsedRows.length > 0 ? parsedRows : [Array(parsedCols.length).fill("")],
              merges: parsedMerges
            });
          }
        });

        if (importedSheets.length > 0) {
          setTempImportedSheets(importedSheets);
          setImportConfirmOpen(true);
        }
      } catch (err: any) {
        console.error("Gagal memproses file Excel:", err);
        alert("Gagal membaca berkas Excel. Pastikan format file benar (.xlsx atau .xls).");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleAppendImportedSheets = () => {
    if (!tempImportedSheets) return;
    setSheets((prevSheets) => {
      const nextSheets = [...prevSheets];
      tempImportedSheets.forEach((newSheet) => {
        let uniqueName = newSheet.name;
        let counter = 1;
        while (nextSheets.some((s) => s.name.toLowerCase() === uniqueName.toLowerCase())) {
          uniqueName = `${newSheet.name} (${counter})`;
          counter++;
        }
        newSheet.name = uniqueName;
        nextSheets.push(newSheet);
      });
      setActiveSheetIdx(prevSheets.length);
      return nextSheets;
    });
    setImportConfirmOpen(false);
    setTempImportedSheets(null);
  };

  const handleOverwriteActiveSheet = () => {
    if (!tempImportedSheets) return;
    setSheets((prevSheets) => {
      const nextSheets = [...prevSheets];
      const activeSheet = nextSheets[activeSheetIdx];
      
      const firstImported = tempImportedSheets[0];
      nextSheets[activeSheetIdx] = {
        ...activeSheet,
        name: firstImported.name,
        columns: firstImported.columns,
        rows: firstImported.rows,
        merges: firstImported.merges,
      };
      
      if (tempImportedSheets.length > 1) {
        for (let i = 1; i < tempImportedSheets.length; i++) {
          const newSheet = tempImportedSheets[i];
          let uniqueName = newSheet.name;
          let counter = 1;
          while (nextSheets.some((s) => s.name.toLowerCase() === uniqueName.toLowerCase())) {
            uniqueName = `${newSheet.name} (${counter})`;
            counter++;
          }
          newSheet.name = uniqueName;
          nextSheets.push(newSheet);
        }
      }
      
      return nextSheets;
    });
    setImportConfirmOpen(false);
    setTempImportedSheets(null);
  };

  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        setSubtitle(parsed.subtitle || "");
        setShowRowNumbers(parsed.showRowNumbers !== false);
        
        if (parsed.sheets && parsed.sheets.length > 0) {
          setSheets(parsed.sheets);
          setActiveSheetIdx(0);
        } else if (parsed.columns && parsed.rows) {
          setSheets([{
            name: "Sheet 1",
            columns: parsed.columns,
            rows: parsed.rows
          }]);
          setActiveSheetIdx(0);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [initialData]);

  // Auto-initialize standard structure for Makro Monitoring sheet
  useEffect(() => {
    if (sheets[activeSheetIdx] && sheets[activeSheetIdx].name.toLowerCase().trim() === "makro monitoring") {
      const sheet = sheets[activeSheetIdx];
      const hasStandardRows = sheet.rows.length >= 6 && 
        sheet.rows.some(r => r[0] && r[0].toLowerCase().includes("fed"));
      
      if (!hasStandardRows) {
        const nextSheets = [...sheets];
        nextSheets[activeSheetIdx] = {
          ...sheet,
          columns: ["Data Type", new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })],
          rows: [
            ["Suku Bunga The Fed", ""],
            ["Suku Bunga Acuan BI (BI Rate)", ""],
            ["Tingkat Bunga Penjaminan LPS", ""],
            ["Inflasi Indonesia", ""],
            ["Inflasi Sumut", ""],
            ["Cadangan Devisa", ""]
          ]
        };
        setSheets(nextSheets);
      }
    }
  }, [activeSheetIdx, sheets]);

  const currentSheet = sheets[activeSheetIdx] || sheets[0] || { name: "Sheet 1", columns: ["Kolom 1"], rows: [[""]] };
  const currentColumns = currentSheet.columns;
  const currentRows = currentSheet.rows;

  const dtIdx = currentColumns.findIndex(h => h.toLowerCase().trim() === "data type" || h.toLowerCase().trim() === "rate type");
  const splitterIdx = dtIdx !== -1 ? currentRows.findIndex((row, idx) => {
    const val = row[dtIdx]?.toLowerCase().trim();
    return idx > 0 && (val === "rate type" || val === "data type");
  }) : -1;
  const isMacro = currentRows.some(row => 
    row[0] && (
      row[0].toLowerCase().includes("the fed") || 
      row[0].toLowerCase().includes("suku bunga") || 
      row[0].toLowerCase().includes("inflasi")
    )
  ) || splitterIdx !== -1;

  const handleAddColumn = () => {
    const nextSheets = [...sheets];
    const current = nextSheets[activeSheetIdx];
    
    const changeIdx = current.columns.findIndex(col => col.toLowerCase().trim() === "change");
    const newColName = `Kolom ${current.columns.length + 1}`;
    
    if (changeIdx !== -1) {
      current.columns = [
        ...current.columns.slice(0, changeIdx),
        newColName,
        ...current.columns.slice(changeIdx)
      ];
      current.rows = current.rows.map(row => [
        ...row.slice(0, changeIdx),
        "",
        ...row.slice(changeIdx)
      ]);
    } else {
      current.columns = [...current.columns, newColName];
      current.rows = current.rows.map(row => [...row, ""]);
    }
    setSheets(nextSheets);
  };

  const handleAddPeriodColumn = (isoDate: string) => {
    if (!isoDate) return;
    const d = new Date(isoDate);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const formatted = `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    const innerHeaderVal = `${months[d.getMonth()]} ${d.getFullYear()}`;
    
    const nextSheets = [...sheets];
    const current = nextSheets[activeSheetIdx];
    
    // Check if column already exists
    if (current.columns.some(col => col.toLowerCase().trim() === formatted.toLowerCase().trim())) {
      alert("Periode tanggal tersebut sudah ada!");
      return;
    }
    
    // Find index of inner header row (where first column value is "rate type" or "data type")
    let innerHeaderRowIdx = -1;
    const dtIdx = current.columns.findIndex(h => h.toLowerCase().trim() === "data type" || h.toLowerCase().trim() === "rate type");
    if (dtIdx !== -1) {
      innerHeaderRowIdx = current.rows.findIndex(row => {
        const val = row[dtIdx]?.toLowerCase().trim();
        return val === "rate type" || val === "data type";
      });
    }
    
    const changeIdx = current.columns.findIndex(col => col.toLowerCase().trim() === "change");
    if (changeIdx !== -1) {
      current.columns = [
        ...current.columns.slice(0, changeIdx),
        formatted,
        ...current.columns.slice(changeIdx)
      ];
      current.rows = current.rows.map((row, rIdx) => {
        const cellVal = (rIdx === innerHeaderRowIdx) ? innerHeaderVal : "";
        return [
          ...row.slice(0, changeIdx),
          cellVal,
          ...row.slice(changeIdx)
        ];
      });
    } else {
      current.columns = [...current.columns, formatted];
      current.rows = current.rows.map((row, rIdx) => {
        const cellVal = (rIdx === innerHeaderRowIdx) ? innerHeaderVal : "";
        return [...row, cellVal];
      });
    }
    
    setSheets(nextSheets);
    setAddPeriodOpen(false);
  };

  const handleRemoveColumn = (colIdx: number) => {
    const nextSheets = [...sheets];
    const current = nextSheets[activeSheetIdx];
    if (current.columns.length <= 1) return;
    current.columns = current.columns.filter((_, idx) => idx !== colIdx);
    current.rows = current.rows.map(row => row.filter((_, idx) => idx !== colIdx));
    setSheets(nextSheets);
  };

  const handleColumnHeaderChange = (colIdx: number, val: string) => {
    const nextSheets = [...sheets];
    const current = nextSheets[activeSheetIdx];
    current.columns[colIdx] = val;
    setSheets(nextSheets);
  };

  const handleAddRow = () => {
    const nextSheets = [...sheets];
    const current = nextSheets[activeSheetIdx];
    current.rows = [...current.rows, Array(current.columns.length).fill("")];
    setSheets(nextSheets);
  };

  const handleRemoveRow = (rowIdx: number) => {
    const nextSheets = [...sheets];
    const current = nextSheets[activeSheetIdx];
    if (current.rows.length <= 1) return;
    current.rows = current.rows.filter((_, idx) => idx !== rowIdx);
    setSheets(nextSheets);
  };

  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const nextSheets = [...sheets];
    const current = nextSheets[activeSheetIdx];
    current.rows = current.rows.map((row, rIdx) => {
      if (rIdx !== rowIdx) return row;
      const nextRow = [...row];
      nextRow[colIdx] = val;
      return nextRow;
    });
    setSheets(nextSheets);
  };

  const handleAddRowTable1 = (splitterIdx: number) => {
    if (splitterIdx === -1) return;
    const nextSheets = [...sheets];
    const current = nextSheets[activeSheetIdx];
    current.rows = [
      ...current.rows.slice(0, splitterIdx),
      Array(current.columns.length).fill(""),
      ...current.rows.slice(splitterIdx)
    ];
    setSheets(nextSheets);
  };

  const handleAddRowTable2 = () => {
    const nextSheets = [...sheets];
    const current = nextSheets[activeSheetIdx];
    current.rows = [...current.rows, Array(current.columns.length).fill("")];
    setSheets(nextSheets);
  };

  const handleTable2HeaderChange = (splitterIdx: number, colIdx: number, val: string) => {
    if (splitterIdx === -1) return;
    const nextSheets = [...sheets];
    nextSheets[activeSheetIdx].rows[splitterIdx][colIdx] = val;
    setSheets(nextSheets);
  };

  const handleDeleteSheetClick = (sIdx: number) => {
    const targetSheet = sheets[sIdx];
    const hasData = targetSheet.rows.some((row) =>
      row.some((cell) => cell && cell.trim() !== "")
    );
    if (hasData) {
      setSheetIdxToDelete(sIdx);
      setDeleteConfirmOpen(true);
    } else {
      executeDeleteSheet(sIdx);
    }
  };

  const executeDeleteSheet = (sIdx: number) => {
    const sheetName = sheets[sIdx]?.name || "Sheet";
    const nextSheets = sheets.filter((_, idx) => idx !== sIdx);
    setSheets(nextSheets);
    setActiveSheetIdx(0);
    setDeleteConfirmOpen(false);
    setSheetIdxToDelete(null);
    setSuccessPopupMessage(`Sheet "${sheetName}" berhasil dihapus!`);
    setSuccessPopupOpen(true);
  };

  const handleSave = () => {
    if (!onSubmit) return;
    const payload = {
      subtitle,
      showRowNumbers,
      sheets
    };
    onSubmit(JSON.stringify(payload));
  };

  if (disabled) {
    return (
      <div className="space-y-3">
        {subtitle && (
          <div className="text-xs font-bold text-gray-750 dark:text-gray-300">
            Sub-judul: {subtitle}
          </div>
        )}
        
        {sheets.length > 1 && (
          <div className="flex flex-wrap gap-1 border-b border-gray-250 dark:border-gray-800 pb-1.5 mb-2">
            {sheets.map((sheet, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => setActiveSheetIdx(sIdx)}
                className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md cursor-pointer transition select-none ${
                  activeSheetIdx === sIdx
                    ? getTabBgClass(sheet.color)
                    : "bg-gray-100 hover:bg-gray-200 text-gray-650 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {sheet.name}
              </button>
            ))}
          </div>
        )}

        {isMacro && splitterIdx !== -1 ? (
          <div className="space-y-6">
            {/* Table 1: Suku Bunga The Fed */}
            <div className="bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-gray-150 dark:border-gray-800 p-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider font-outfit">
                Suku Bunga The Fed (Periode FOMC Meeting)
              </h4>
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-850">
                <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-855 text-left text-xs">
                  <thead className={`${getHeaderBgClass(currentSheet.color)} font-bold`}>
                    <tr>
                      {showRowNumbers && <th className="px-3 py-2 border-r border-white/20 w-12 text-center text-white font-bold">No</th>}
                      {currentColumns.map((col, idx) => (
                        <th key={idx} className="px-3 py-2 border-r border-white/20 last:border-0 text-white font-bold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-transparent text-gray-800 dark:text-gray-200">
                    {currentRows.slice(0, splitterIdx).map((row, rIdx) => (
                      <tr key={rIdx}>
                        {showRowNumbers && (
                          <td className="px-3 py-2 border-r border-gray-150 dark:border-gray-800 text-center font-semibold text-gray-400 dark:text-gray-500 bg-gray-50/30 dark:bg-transparent w-12">
                            {rIdx + 1}
                          </td>
                        )}
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 border-r border-gray-150 dark:border-gray-800 last:border-0">
                            {cell || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Parameter Makro Bulanan */}
            <div className="bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-gray-150 dark:border-gray-800 p-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider font-outfit">
                Parameter Makro Bulanan (BI Rate, LPS, Inflasi, Devisa)
              </h4>
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-850">
                <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-855 text-left text-xs">
                  <thead className={`${getHeaderBgClass(currentSheet.color)} font-bold`}>
                    <tr>
                      {showRowNumbers && <th className="px-3 py-2 border-r border-white/20 w-12 text-center text-white font-bold">No</th>}
                      {currentRows[splitterIdx].map((col, idx) => (
                        <th key={idx} className="px-3 py-2 border-r border-white/20 last:border-0 text-white font-bold">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-transparent text-gray-800 dark:text-gray-200">
                    {currentRows.slice(splitterIdx + 1).map((row, rIdx) => {
                      const realRIdx = splitterIdx + 1 + rIdx;
                      return (
                        <tr key={realRIdx}>
                          {showRowNumbers && (
                            <td className="px-3 py-2 border-r border-gray-150 dark:border-gray-800 text-center font-semibold text-gray-400 dark:text-gray-505 bg-gray-50/30 dark:bg-transparent w-12">
                              {realRIdx + 1}
                            </td>
                          )}
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-2 border-r border-gray-150 dark:border-gray-800 last:border-0">
                              {cell || "-"}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-855 text-left text-xs">
              <thead className={`${getHeaderBgClass(currentSheet.color)} font-bold`}>
                <tr>
                  {showRowNumbers && (
                    <th className="px-3 py-2 border-r border-white/20 w-12 text-center text-white font-bold">No</th>
                  )}
                  {currentColumns.map((col, idx) => (
                    <th key={idx} className="px-3 py-2 border-r border-white/20 last:border-0 text-white font-bold">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-transparent text-gray-800 dark:text-gray-200">
                {currentRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {showRowNumbers && (
                      <td className="px-3 py-2 border-r border-gray-150 dark:border-gray-800 text-center font-semibold text-gray-400 dark:text-gray-500 bg-gray-50/30 dark:bg-transparent w-12">
                        {rIdx + 1}
                      </td>
                    )}
                    {row.map((cell, cIdx) => {
                      const { rowSpan, colSpan, isHidden } = checkCellMerge(rIdx, cIdx, currentSheet.merges);
                      if (isHidden) return null;
                      const colorClass = getCellColorClass(rIdx, cIdx, currentColumns, row);
                      return (
                        <td
                          key={cIdx}
                          rowSpan={rowSpan}
                          colSpan={colSpan}
                          className={`px-3 py-2 border-r border-gray-150 dark:border-gray-800 last:border-0 ${colorClass}`}
                        >
                          {cell || "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-white/[0.01]">
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-750 dark:text-gray-300">Sub-judul Tabel (Opsional)</label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Contoh: Rasio Likuiditas / 5 Deposito Tertinggi"
          className="w-full text-xs rounded-lg border border-gray-300 bg-transparent px-3 py-2 placeholder:text-gray-450 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-gray-200 dark:border-gray-700 pb-2 items-center">
        {sheets.map((sheet, sIdx) => (
          <div key={sIdx} className="flex items-center group relative">
            {editingSheetIdx === sIdx ? (
              <input
                type="text"
                value={tempSheetName}
                onChange={(e) => setTempSheetName(e.target.value)}
                onBlur={() => handleSaveSheetName(sIdx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveSheetName(sIdx);
                  } else if (e.key === "Escape") {
                    setEditingSheetIdx(null);
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-brand-500 focus:outline-hidden bg-white dark:bg-gray-800 text-gray-800 dark:text-white w-28"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={() => setActiveSheetIdx(sIdx)}
                onDoubleClick={() => handleStartRenameSheet(sIdx, sheet.name)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition select-none ${
                  activeSheetIdx === sIdx
                    ? getTabBgClass(sheet.color)
                    : "bg-gray-100 hover:bg-gray-200 text-gray-650 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750"
                }`}
                title="Double click untuk mengubah nama sheet"
              >
                {sheet.name}
              </button>
            )}
            {sheets.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeleteSheetClick(sIdx)}
                className="ml-0.5 text-gray-400 hover:text-error-500 text-xs font-bold px-1 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Hapus Sheet"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const nextSheets = [...sheets, { name: `Sheet ${sheets.length + 1}`, columns: ["Kolom 1", "Kolom 2"], rows: [["", ""]] }];
            setSheets(nextSheets);
            setActiveSheetIdx(sheets.length);
          }}
          className="px-2.5 py-1.5 text-[10px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-md border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 cursor-pointer"
        >
          + Tambah Sheet
        </button>

        {/* Color picker for the active sheet */}
        <div className="flex items-center gap-1.5 ml-auto pl-4 border-l border-gray-200 dark:border-gray-700">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Warna Tab:</span>
          {(["blue", "green", "yellow", "red", "purple"] as const).map((color) => {
            const bgClass =
              color === "blue" ? "bg-brand-500" :
              color === "green" ? "bg-green-600" :
              color === "yellow" ? "bg-amber-500" :
              color === "red" ? "bg-red-600" : "bg-purple-600";
            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  const nextSheets = [...sheets];
                  nextSheets[activeSheetIdx].color = color;
                  setSheets(nextSheets);
                }}
                className={`w-3.5 h-3.5 rounded-full ${bgClass} cursor-pointer transition transform hover:scale-125 border ${
                  currentSheet.color === color || (color === "blue" && !currentSheet.color)
                    ? "border-gray-800 dark:border-white ring-2 ring-brand-500/20"
                    : "border-transparent"
                }`}
                title={`Ubah warna tab ke ${color}`}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-gray-755 dark:text-gray-300">Desain & Isi Tabel ({currentSheet.name})</label>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={showRowNumbers}
                onChange={(e) => setShowRowNumbers(e.target.checked)}
                className="rounded-sm border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              Kolom No. Otomatis
            </label>
            {(currentSheet.name.toLowerCase().trim() === "makro monitoring" || currentSheet.name.toLowerCase().trim() === "market risk") && (
              <button
                type="button"
                onClick={() => {
                  setNewPeriodDate(new Date().toISOString().split("T")[0]);
                  setAddPeriodOpen(true);
                }}
                className="px-2.5 py-1 text-[10px] font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-md cursor-pointer transition shadow-sm inline-flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                + Tambah Periode
              </button>
            )}
            <button
              type="button"
              onClick={handleAddColumn}
              className="px-2 py-1 text-[10px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-md border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 cursor-pointer"
            >
              + Kolom
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              className="px-2 py-1 text-[10px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-md border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 cursor-pointer"
            >
              + Baris
            </button>
            <label className="px-2 py-1 text-[10px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-md border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 cursor-pointer inline-flex items-center gap-1 select-none">
              <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Impor Excel
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
                className="hidden"
              />
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="px-2 py-1 text-[10px] font-bold text-white bg-green-600 hover:bg-green-700 rounded-md cursor-pointer inline-flex items-center gap-1 select-none shadow-sm transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Ekspor Excel
              </button>
              {exportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                  <div className="absolute right-0 mt-1 w-44 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg py-1.5 z-50 text-left">
                    <button
                      type="button"
                      onClick={() => {
                        handleExportActiveSheet();
                        setExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Unduh Sheet Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportAllSheets();
                        setExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5 border-t border-gray-100 dark:border-gray-800"
                    >
                      <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
                      </svg>
                      Unduh Semua Sheet
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

               {isMacro && splitterIdx !== -1 ? (
          <div className="space-y-6">
            {/* Table 1: Suku Bunga The Fed */}
            <div className="bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider font-outfit">
                  Suku Bunga The Fed (Periode FOMC Meeting)
                </h4>
                <button
                  type="button"
                  onClick={() => handleAddRowTable1(splitterIdx)}
                  className="px-2 py-0.5 text-[9px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 cursor-pointer"
                >
                  + Tambah Baris (The Fed)
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-250 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left text-xs">
                  <thead className={`${getHeaderBgClass(currentSheet.color)}`}>
                    <tr>
                      {showRowNumbers && <th className="px-2 py-1.5 border-r border-white/20 w-12 text-center text-white font-bold">No</th>}
                      {currentColumns.map((col, idx) => (
                        <th key={idx} className="px-2 py-1.5 border-r border-white/20 last:border-0 min-w-[120px]">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={col}
                              onChange={(e) => handleColumnHeaderChange(idx, e.target.value)}
                              className="w-full bg-transparent font-bold focus:outline-hidden border-b border-dashed border-white/40 text-white placeholder-white/70"
                            />
                            {currentColumns.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColumn(idx)}
                                className="text-white/60 hover:text-white font-extrabold px-1 cursor-pointer"
                                title="Hapus Kolom"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-transparent">
                    {currentRows.slice(0, splitterIdx).map((row, rIdx) => (
                      <tr key={rIdx}>
                        {showRowNumbers && (
                          <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700 text-center font-semibold text-gray-400 dark:text-gray-550 bg-gray-50/20 dark:bg-transparent w-12">
                            {rIdx + 1}
                          </td>
                        )}
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700 last:border-0">
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                              placeholder="Isi..."
                              className="w-full bg-transparent focus:outline-hidden text-gray-755 dark:text-gray-250"
                            />
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-center">
                          {currentRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(rIdx)}
                              className="text-gray-400 hover:text-error-500 font-extrabold cursor-pointer"
                              title="Hapus Baris"
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Parameter Makro Bulanan */}
            <div className="bg-gray-50/50 dark:bg-white/[0.01] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider font-outfit">
                  Parameter Makro Bulanan (BI Rate, LPS, Inflasi, Devisa)
                </h4>
                <button
                  type="button"
                  onClick={handleAddRowTable2}
                  className="px-2 py-0.5 text-[9px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded border border-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:border-brand-500/20 cursor-pointer"
                >
                  + Tambah Baris
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-250 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left text-xs">
                  <thead className={`${getHeaderBgClass(currentSheet.color)}`}>
                    <tr>
                      {showRowNumbers && <th className="px-2 py-1.5 border-r border-white/20 w-12 text-center text-white font-bold">No</th>}
                      {currentRows[splitterIdx].map((col, idx) => (
                        <th key={idx} className="px-2 py-1.5 border-r border-white/20 last:border-0 min-w-[120px]">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={col}
                              onChange={(e) => handleTable2HeaderChange(splitterIdx, idx, e.target.value)}
                              className="w-full bg-transparent font-bold focus:outline-hidden border-b border-dashed border-white/40 text-white placeholder-white/70"
                            />
                            {currentColumns.length > 1 && idx > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveColumn(idx)}
                                className="text-white/60 hover:text-white font-extrabold px-1 cursor-pointer"
                                title="Hapus Kolom"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-transparent">
                    {currentRows.slice(splitterIdx + 1).map((row, rIdx) => {
                      const realRIdx = splitterIdx + 1 + rIdx;
                      return (
                        <tr key={realRIdx}>
                          {showRowNumbers && (
                            <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700 text-center font-semibold text-gray-400 dark:text-gray-555 bg-gray-50/20 dark:bg-transparent w-12">
                              {realRIdx + 1}
                            </td>
                          )}
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700 last:border-0">
                              <input
                                type="text"
                                value={cell}
                                onChange={(e) => handleCellChange(realRIdx, cIdx, e.target.value)}
                                placeholder="Isi..."
                                className="w-full bg-transparent focus:outline-hidden text-gray-755 dark:text-gray-250"
                              />
                            </td>
                          ))}
                          <td className="px-2 py-1.5 text-center">
                            {currentRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(realRIdx)}
                                className="text-gray-400 hover:text-error-500 font-extrabold cursor-pointer"
                                title="Hapus Baris"
                              >
                                ×
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-250 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left text-xs">
              <thead className={`${getHeaderBgClass(currentSheet.color)}`}>
                <tr>
                  {showRowNumbers && (
                    <th className="px-2 py-1.5 border-r border-white/20 w-12 text-center text-white font-bold">
                      No
                    </th>
                  )}
                  {currentColumns.map((col, idx) => (
                    <th key={idx} className="px-2 py-1.5 border-r border-white/20 last:border-0 min-w-[120px]">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={col}
                          onChange={(e) => handleColumnHeaderChange(idx, e.target.value)}
                          className="w-full bg-transparent font-bold focus:outline-hidden border-b border-dashed border-white/40 text-white placeholder-white/70"
                        />
                        {currentColumns.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveColumn(idx)}
                            className="text-white/60 hover:text-white font-extrabold px-1 cursor-pointer"
                            title="Hapus Kolom"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-transparent">
                {currentRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {showRowNumbers && (
                      <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700 text-center font-semibold text-gray-400 dark:text-gray-505 bg-gray-50/20 dark:bg-transparent w-12">
                        {rIdx + 1}
                      </td>
                    )}
                    {row.map((cell, cIdx) => {
                      const { rowSpan, colSpan, isHidden } = checkCellMerge(rIdx, cIdx, currentSheet.merges);
                      if (isHidden) return null;
                      const colorClass = getCellColorClass(rIdx, cIdx, currentColumns, row);
                      return (
                        <td
                          key={cIdx}
                          rowSpan={rowSpan}
                          colSpan={colSpan}
                          className={`px-2 py-1.5 border-r border-gray-200 dark:border-gray-700 last:border-0 ${colorClass}`}
                        >
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                            placeholder="Isi..."
                            className="w-full bg-transparent focus:outline-hidden text-gray-755 dark:text-gray-250"
                          />
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center">
                      {currentRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(rIdx)}
                          className="text-gray-400 hover:text-error-500 font-extrabold cursor-pointer"
                          title="Hapus Baris"
                        >
                          ×
                      </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-theme-xs cursor-pointer"
        >
          Simpan & Kirim Tabel
        </button>
      </div>

      {/* Delete Sheet Confirmation Modal */}
      <Modal 
        isOpen={deleteConfirmOpen} 
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSheetIdxToDelete(null);
        }} 
        className="max-w-[400px] p-6 text-center"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-error-50 dark:bg-error-500/10 text-error-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Hapus Sheet?
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Sheet <strong>"{sheetIdxToDelete !== null ? sheets[sheetIdxToDelete]?.name : ""}"</strong> berisi data. Apakah Anda yakin ingin menghapusnya? Tindakan ini tidak dapat dibatalkan.
          </p>
          
          <div className="pt-2 flex gap-3 w-full">
            <button
              onClick={() => {
                setDeleteConfirmOpen(false);
                setSheetIdxToDelete(null);
              }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (sheetIdxToDelete !== null) {
                  executeDeleteSheet(sheetIdxToDelete);
                }
              }}
              className="flex-1 py-2.5 rounded-xl text-white font-semibold bg-error-500 hover:bg-error-600 transition"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* Success Popup Modal */}
      <Modal isOpen={successPopupOpen} onClose={() => setSuccessPopupOpen(false)} className="max-w-[400px] p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-success-50 dark:bg-success-500/10 text-success-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Berhasil
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {successPopupMessage}
          </p>
          
          <div className="pt-2 w-full">
            <button
              onClick={() => setSuccessPopupOpen(false)}
              className="w-full py-2.5 rounded-xl text-white font-semibold bg-brand-500 hover:bg-brand-600 transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Excel Import Option Modal */}
      <Modal 
        isOpen={importConfirmOpen} 
        onClose={() => {
          setImportConfirmOpen(false);
          setTempImportedSheets(null);
        }} 
        className="max-w-[420px] p-6 text-center"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Opsi Impor Excel
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Pilih bagaimana Anda ingin memasukkan data dari berkas Excel ini ke dalam workspace:
          </p>
          
          <div className="pt-2 flex flex-col gap-3.5 w-full">
            <button
              onClick={handleOverwriteActiveSheet}
              className="w-full py-3 rounded-xl border border-brand-500 bg-brand-50/10 hover:bg-brand-505 hover:text-white hover:border-brand-600 text-brand-600 font-semibold transition text-xs shadow-theme-xs cursor-pointer"
            >
              Gantikan Sheet Aktif ({sheets[activeSheetIdx]?.name})
            </button>
            <button
              onClick={handleAppendImportedSheets}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition text-xs shadow-theme-xs cursor-pointer"
            >
              Tambahkan sebagai Sheet Baru
            </button>
            <button
              onClick={() => {
                setImportConfirmOpen(false);
                setTempImportedSheets(null);
              }}
              className="w-full py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-xs transition cursor-pointer font-semibold"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      {/* Tambah Periode Modal for Makro Monitoring */}
      <Modal isOpen={addPeriodOpen} onClose={() => setAddPeriodOpen(false)} className="max-w-[420px] p-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 font-outfit">Tambah Periode Baru</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1.5">
              Tanggal Periode
            </label>
            <input
              type="date"
              value={newPeriodDate}
              onChange={(e) => setNewPeriodDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-800 dark:text-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddPeriodOpen(false)}
              className="flex-1 py-2 text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleAddPeriodColumn(newPeriodDate)}
              className="flex-1 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl cursor-pointer transition"
            >
              Tambah Kolom Periode
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
