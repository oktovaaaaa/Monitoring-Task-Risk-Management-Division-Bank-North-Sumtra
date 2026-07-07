"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import * as XLSX from "xlsx";

interface Unit {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  role: string;
}

interface ImamSubmission {
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

export default function ImamDashboardPage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<ImamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Workspace Mode (instead of modals)
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState<"create" | "edit" | "view">("create");
  const [selectedSubmission, setSelectedSubmission] = useState<ImamSubmission | null>(null);

  // Form Fields
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

  // Fetch Imam Submissions
  const fetchSubmissions = useCallback(async (tok: string) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/imam/submissions", {
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
  const openCreateWorkspace = () => {
    setWorkspaceMode("create");
    setSelectedSubmission(null);
    setFormTitle("");
    setFormDescription("");
    setFormFileURL("");
    setFormFileName("");
    // Reset sheets with standard empty sheet
    const defaultTableData = JSON.stringify({
      sheets: [
        { name: "Sheet 1", columns: ["Kolom 1", "Kolom 2"], rows: [["", ""]] }
      ]
    });
    setFormTableData(defaultTableData);
    setIsWorkspaceOpen(true);
  };

  // Open Workspace for Editing
  const openEditWorkspace = (sub: ImamSubmission, e: React.MouseEvent) => {
    e.stopPropagation();
    setWorkspaceMode("edit");
    setSelectedSubmission(sub);
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

  // Open Workspace for Viewing Detail
  const openViewWorkspace = (sub: ImamSubmission) => {
    setWorkspaceMode("view");
    setSelectedSubmission(sub);
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
        ? `http://localhost:8080/api/imam/submissions/${selectedSubmission.id}`
        : "http://localhost:8080/api/imam/submissions";
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
      const res = await fetch(`http://localhost:8080/api/imam/submissions/${id}`, {
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
  const filteredSubmissions = submissions.filter((sub) => {
    const q = searchQuery.toLowerCase();
    return sub.title.toLowerCase().includes(q) || sub.description.toLowerCase().includes(q);
  });

  // Stats calculation
  const totalReports = submissions.length;
  const totalFiles = submissions.filter((s) => s.file_url !== "").length;
  const totalSpreadsheets = submissions.filter((s) => {
    try {
      const parsed = JSON.parse(s.table_data);
      return parsed.sheets && parsed.sheets.some((sh: any) => sh.rows && sh.rows.length > 0 && sh.rows[0].some((c: any) => c !== ""));
    } catch {
      return false;
    }
  }).length;

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  // Guard: Role Imam check
  if (!token || !currentUser || currentUser.role !== "imam") {
    return (
      <div className="p-6 text-center bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800 max-w-md mx-auto my-10 shadow-md">
        <h2 className="text-error-500 font-semibold text-lg mb-2">Akses Ditolak</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Halaman ini hanya dapat diakses oleh karyawan dengan peran khusus Imam.
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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-purple-650 dark:text-gray-400 mb-2 transition cursor-pointer"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label>Judul Laporan <span className="text-error-500">*</span></Label>
                <input
                  type="text"
                  placeholder="Contoh: Laporan Keuangan Kuartal 2"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={100}
                  className="w-full h-11 text-sm rounded-xl border border-gray-300 dark:border-gray-800 bg-transparent px-4 placeholder:text-gray-450 focus:border-purple-500 focus:outline-hidden dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Unggah File Lampiran (Opsional)</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="imam-file-upload"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="imam-file-upload"
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
              <div className="w-10 h-10 bg-success-100 rounded-xl dark:bg-success-500/20 text-success-650 flex items-center justify-center">
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
              className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-bold text-white bg-success-650 hover:bg-success-700 rounded-xl transition cursor-pointer"
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
            Dasbor Imam
          </h1>
          <p className="text-sm text-purple-100 max-w-xl font-normal leading-relaxed">
            Selamat datang di ruang penyimpanan pribadi Anda. Di sini Anda bisa menginput data spreadsheet, mengunggah laporan, dan memantau progres pengerjaan pribadi Anda. Data di dasbor ini sepenuhnya privat dan hanya Anda yang bisa melihatnya.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Metric 1 */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Input Data</span>
            <h4 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{loading ? "..." : totalReports}</h4>
            <p className="text-[10px] text-gray-400 mt-1">Laporan tersimpan di database</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 bg-purple-50 rounded-2xl dark:bg-purple-500/10 text-purple-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Spreadsheet Aktif</span>
            <h4 className="text-3xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">{loading ? "..." : totalSpreadsheets}</h4>
            <p className="text-[10px] text-gray-400 mt-1">Spreadsheet excel buatan pribadi</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-2xl dark:bg-blue-500/10 text-blue-505">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Dokumen / File Terlampir</span>
            <h4 className="text-3xl font-extrabold text-success-600 dark:text-success-400 mt-1">{loading ? "..." : totalFiles}</h4>
            <p className="text-[10px] text-gray-400 mt-1">Laporan file PDF/Excel diunggah</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 bg-success-50 rounded-2xl dark:bg-success-500/10 text-success-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 dark:border-gray-800">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Daftar Input Data</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Kelola berkas excel dan laporan pribadi yang Anda input</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => openViewWorkspace(sub)}
                className="group relative flex flex-col justify-between border border-gray-150 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-900/60 rounded-3xl bg-white dark:bg-transparent p-5 shadow-theme-xs hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-extrabold text-gray-900 dark:text-white group-hover:text-purple-650 dark:group-hover:text-purple-400 transition-colors line-clamp-1">
                      {sub.title}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={(e) => openEditWorkspace(sub, e)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition"
                        title="Edit Data"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteSubmission(sub.id, sub.title, e)}
                        className="p-1.5 text-gray-400 hover:text-error-550 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition"
                        title="Hapus Data"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-455 line-clamp-2 mt-2 leading-relaxed">
                    {sub.description || "Tidak ada keterangan."}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    {sub.file_url ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-100/50">
                        File: {sub.file_name || "Attachment"}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Tanpa File</span>
                    )}
                  </div>
                  <span className="text-gray-400">
                    {new Date(sub.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            ))}
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
  clean = clean.replace(/s\/d|sampai|to/g, "-");
  
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
          setSheets(importedSheets);
          setActiveSheetIdx(0);
        }
      } catch (err: any) {
        console.error("Gagal memproses file Excel:", err);
        alert("Gagal membaca berkas Excel. Pastikan format file benar (.xlsx atau .xls).");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
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

  const currentSheet = sheets[activeSheetIdx] || sheets[0] || { name: "Sheet 1", columns: ["Kolom 1"], rows: [[""]] };
  const currentColumns = currentSheet.columns;
  const currentRows = currentSheet.rows;

  const handleAddColumn = () => {
    const nextSheets = [...sheets];
    const current = nextSheets[activeSheetIdx];
    current.columns = [...current.columns, `Kolom ${current.columns.length + 1}`];
    current.rows = current.rows.map(row => [...row, ""]);
    setSheets(nextSheets);
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
                onClick={() => {
                  const nextSheets = sheets.filter((_, idx) => idx !== sIdx);
                  setSheets(nextSheets);
                  setActiveSheetIdx(0);
                }}
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
          </div>
        </div>

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
                          className="w-full bg-transparent focus:outline-hidden text-gray-750 dark:text-gray-250"
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
    </div>
  );
}
