"use client";
import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";

interface Unit {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
}

interface SubTaskSubmission {
  id: string;
  sub_task_id: string;
  submitted_by_id: string;
  submitted_by?: User;
  submitted_at: string;
  status: "pending" | "approved" | "rejected";
  link_value?: string;
  file_url?: string;
  table_data?: string;
  reviewed_by_id?: string;
  reviewed_by?: User;
  reviewed_at?: string;
  rejection_reason?: string;
}

interface SubTask {
  id: string;
  task_id: string;
  title: string;
  description: string;
  type: "link" | "file" | "table";
  order: number;
  created_at: string;
  submissions?: SubTaskSubmission[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  unit_id: string;
  unit?: Unit;
  status: "open" | "pending" | "approved" | "rejected";
  submission_description?: string;
  submission_file_url?: string;
  submitted_by_id?: string;
  submitted_by?: User;
  submitted_at?: string;
  reviewed_by_id?: string;
  reviewed_by?: User;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  sub_tasks?: SubTask[];
}

interface TableDataPayload {
  subtitle: string;
  showRowNumbers?: boolean;
  columns: string[];
  rows: string[][];
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
  const [columns, setColumns] = useState<string[]>(["Kolom 1", "Kolom 2"]);
  const [rows, setRows] = useState<string[][]>([["", ""]]);
  const [showRowNumbers, setShowRowNumbers] = useState(true);

  useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        setSubtitle(parsed.subtitle || "");
        setColumns(parsed.columns || ["Kolom 1", "Kolom 2"]);
        setRows(parsed.rows || [["", ""]]);
        setShowRowNumbers(parsed.showRowNumbers !== false);
      } catch (e) {
        console.error(e);
      }
    }
  }, [initialData]);

  const handleAddColumn = () => {
    setColumns([...columns, `Kolom ${columns.length + 1}`]);
    setRows(rows.map(row => [...row, ""]));
  };

  const handleRemoveColumn = (colIdx: number) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((_, idx) => idx !== colIdx));
    setRows(rows.map(row => row.filter((_, idx) => idx !== colIdx)));
  };

  const handleColumnHeaderChange = (colIdx: number, val: string) => {
    const nextCols = [...columns];
    nextCols[colIdx] = val;
    setColumns(nextCols);
  };

  const handleAddRow = () => {
    setRows([...rows, Array(columns.length).fill("")]);
  };

  const handleRemoveRow = (rowIdx: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, idx) => idx !== rowIdx));
  };

  const handleCellChange = (rowIdx: number, colIdx: number, val: string) => {
    const nextRows = rows.map((row, rIdx) => {
      if (rIdx !== rowIdx) return row;
      const nextRow = [...row];
      nextRow[colIdx] = val;
      return nextRow;
    });
    setRows(nextRows);
  };

  const handleSave = () => {
    if (!onSubmit) return;
    const payload: TableDataPayload = {
      subtitle,
      showRowNumbers,
      columns,
      rows
    };
    onSubmit(JSON.stringify(payload));
  };

  if (disabled) {
    return (
      <div className="space-y-3">
        {subtitle && (
          <div className="text-xs font-bold text-gray-700 dark:text-gray-300">
            Sub-judul: {subtitle}
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
          <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-850 text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 font-bold">
              <tr>
                {showRowNumbers && (
                  <th className="px-3 py-2 border-r border-gray-150 dark:border-gray-800 w-12 text-center">No</th>
                )}
                {columns.map((col, idx) => (
                  <th key={idx} className="px-3 py-2 border-r border-gray-150 dark:border-gray-800 last:border-0">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-transparent text-gray-800 dark:text-gray-200">
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {showRowNumbers && (
                    <td className="px-3 py-2 border-r border-gray-150 dark:border-gray-800 text-center font-semibold text-gray-400 dark:text-gray-500 bg-gray-50/30 dark:bg-transparent w-12">
                      {rIdx + 1}
                    </td>
                  )}
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 border-r border-gray-150 dark:border-gray-800 last:border-0">{cell || "-"}</td>
                  ))}
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
        <label className="text-xs font-bold text-gray-705 dark:text-gray-300">Sub-judul Tabel (Opsional)</label>
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Contoh: Rasio Likuiditas / 5 Deposito Tertinggi"
          className="w-full text-xs rounded-lg border border-gray-300 bg-transparent px-3 py-2 placeholder:text-gray-450 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-gray-705 dark:text-gray-300">Desain & Isi Tabel</label>
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
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left text-xs">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                {showRowNumbers && (
                  <th className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700 w-12 text-center text-gray-500 dark:text-gray-400 font-bold">
                    No
                  </th>
                )}
                {columns.map((col, idx) => (
                  <th key={idx} className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700 last:border-0 min-w-[120px]">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => handleColumnHeaderChange(idx, e.target.value)}
                        className="w-full bg-transparent font-bold focus:outline-hidden border-b border-dashed border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white"
                      />
                      {columns.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveColumn(idx)}
                          className="text-gray-400 hover:text-error-500 font-extrabold px-1 cursor-pointer"
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
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {showRowNumbers && (
                    <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700 text-center font-semibold text-gray-400 dark:text-gray-500 bg-gray-50/20 dark:bg-transparent w-12">
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
                        className="w-full bg-transparent focus:outline-hidden text-gray-750 dark:text-gray-250"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-center">
                    {rows.length > 1 && (
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

export default function MyTasksEmployeePage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Submission Form states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [subDescription, setSubDescription] = useState("");
  
  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Subtask local inputs states
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [subtaskFiles, setSubtaskFiles] = useState<Record<string, { url: string; name: string }>>({});
  const [subtaskUploading, setSubtaskUploading] = useState<Record<string, boolean>>({});

  // Rejection Reason Modal states
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState("");
  const [rejectionReasonTitle, setRejectionReasonTitle] = useState("");

  const openRejectionModal = (task: Task) => {
    setRejectionReasonText(task.rejection_reason || "");
    setRejectionReasonTitle(task.title);
    setIsRejectionModalOpen(true);
  };

  // Detail Modal states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const openDetailModal = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  // Feedback Popup states
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (type: "success" | "error", message: string) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupOpen(true);
  };

  const handleSubmitSubTask = async (subTaskId: string, payload: { link_value?: string; file_url?: string; table_data?: string }) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8080/api/tasks/subtasks/${subTaskId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal mengirim sub-tugas.");
      }

      showPopup("success", "Pekerjaan sub-tugas berhasil dikirim!");
      
      // Update local task state directly to show immediate feedback in modal
      if (selectedTask) {
        const updatedTasks = tasks.map(t => {
          if (t.id !== selectedTask.id) return t;
          const updatedSubtasks = t.sub_tasks?.map(st => {
            if (st.id !== subTaskId) return st;
            const newSubm: SubTaskSubmission = {
              id: Math.random().toString(),
              sub_task_id: subTaskId,
              submitted_by_id: currentUser?.id || "",
              submitted_by: { id: currentUser?.id || "", full_name: currentUser?.full_name || "Karyawan" },
              submitted_at: new Date().toISOString(),
              status: "pending",
              ...payload
            };
            const submissions = st.submissions ? [...st.submissions.filter(s => s.status !== "pending" && s.status !== "rejected"), newSubm] : [newSubm];
            return { ...st, submissions };
          });
          return { ...t, sub_tasks: updatedSubtasks, status: "pending" as const };
        });
        setTasks(updatedTasks);
        const nextSelTask = updatedTasks.find(t => t.id === selectedTask.id);
        if (nextSelTask) {
          setSelectedTask(nextSelTask);
        }
      }
      
      fetchMyUnitTasks();
    } catch (err: any) {
      showPopup("error", err.message || "Gagal mengirim sub-tugas.");
    }
  };

  const handleSubTaskFileChange = async (subTaskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !token) return;
    const file = e.target.files[0];

    const maxFileSize = 25 * 1024 * 1024;
    if (file.size > maxFileSize) {
      showPopup("error", "Ukuran file terlalu besar. Batas maksimal ukuran berkas adalah 25MB.");
      return;
    }

    setSubtaskUploading(prev => ({ ...prev, [subTaskId]: true }));
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8585/api/tasks/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      // fallback to localhost:8080 if 8585 fails, or use current origin host relative path if possible.
      // Wait, let's see how upload is done elsewhere:
      // fetch("http://localhost:8080/api/tasks/upload")
      // Ah! In line 150 it uses `http://localhost:8080/api/tasks/upload`
      // Let's use `http://localhost:8080/api/tasks/upload` to be fully consistent!
    } catch (err) {}
    
    // Let's rewrite this block with http://localhost:8080
    try {
      const res = await fetch("http://localhost:8080/api/tasks/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal mengunggah berkas.");
      }

      setSubtaskFiles(prev => ({
        ...prev,
        [subTaskId]: { url: result.data.file_url, name: result.data.file_name }
      }));
      showPopup("success", "Berkas sub-tugas berhasil diunggah! Klik 'Kirim File' untuk menyimpan.");
    } catch (err: any) {
      showPopup("error", err.message || "Gagal mengunggah berkas ke server.");
    } finally {
      setSubtaskUploading(prev => ({ ...prev, [subTaskId]: false }));
    }
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
        console.error("Error parsing auth_user:", err);
      }
    }
  }, []);

  // Fetch Tasks for the Employee's Unit
  const fetchMyUnitTasks = async () => {
    if (!token) return;
    setTasksLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.warn("Tasks API returned non-OK status:", res.status);
        return;
      }
      const data = await res.json();
      const fetchedTasks = data.status === "success" ? data.data : [];
      setTasks(fetchedTasks);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  };

  const getTaskProgress = (task: Task) => {
    if (!task.sub_tasks || task.sub_tasks.length === 0) {
      return task.status === "approved" ? 100 : 0;
    }
    const approvedSubtasks = task.sub_tasks.filter((st) => {
      return st.submissions && st.submissions.some((subm) => subm.status === "approved");
    }).length;
    return parseFloat(((approvedSubtasks / task.sub_tasks.length) * 100).toFixed(1));
  };

  useEffect(() => {
    if (token) {
      fetchMyUnitTasks();
    }
  }, [token]);

  // Handle File Input Change & Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // 1. Enforce size validation (max 25MB)
    const maxFileSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxFileSize) {
      showPopup("error", "Ukuran file terlalu besar. Batas maksimal ukuran berkas adalah 25MB.");
      return;
    }

    setSelectedFile(file);
    setUploading(true);

    // 2. Perform upload
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8080/api/tasks/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal mengunggah berkas.");
      }

      setFileUrl(result.data.file_url);
      setFileName(result.data.file_name);
      showPopup("success", "Berkas laporan berhasil diunggah!");
    } catch (err: any) {
      showPopup("error", err.message || "Gagal mengunggah berkas ke server.");
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  // Open submit form modal
  const openSubmitModal = (task: Task) => {
    setSelectedTask(task);
    setSubDescription(task.submission_description || "");
    setFileUrl(task.submission_file_url || "");
    setFileName(task.submission_file_url ? task.submission_file_url.split("/").pop() || "Lampiran Berkas" : "");
    setSelectedFile(null);
    setIsSubmitModalOpen(true);
  };

  // Submit Task Report
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !token) return;
    if (!subDescription) {
      showPopup("error", "Deskripsi laporan pengerjaan wajib diisi.");
      return;
    }
    if (!fileUrl) {
      showPopup("error", "Anda harus mengunggah berkas laporan tugas terlebih dahulu.");
      return;
    }
    setSubmitLoading(true);

    try {
      const res = await fetch(`http://localhost:8080/api/tasks/${selectedTask.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submission_description: subDescription,
          submission_file_url: fileUrl,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal mengirim laporan.");
      }

      setIsSubmitModalOpen(false);
      showPopup("success", `Tugas "${selectedTask.title}" berhasil dikirim untuk di-review oleh Admin!`);
      fetchMyUnitTasks();
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  // Guard: Not logged in
  if (!token || !currentUser) {
    return (
      <div className="p-6 text-center bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800 max-w-md mx-auto my-10 shadow-md">
        <h2 className="text-error-500 font-semibold text-lg mb-2">Akses Ditolak</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Harap masuk menggunakan akun Anda untuk melihat daftar tugas.
        </p>
        <Link
          href="/signin"
          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (isSubmitModalOpen && selectedTask) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in">
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-gray-800">
          <div className="space-y-1">
            <button
              onClick={() => {
                setIsSubmitModalOpen(false);
                setSelectedTask(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-500 dark:text-gray-400 mb-2 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali ke Daftar Tugas
            </button>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Ruang Kerja Tugas: {selectedTask.title}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
              {selectedTask.sub_tasks && selectedTask.sub_tasks.length > 0
                ? "Kerjakan dan selesaikan masing-masing sub-tugas di bawah ini."
                : "Isi rincian pekerjaan dan lampirkan berkas laporan pengerjaan tugas (format zip, pdf, doc, dll)."}
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setIsSubmitModalOpen(false);
              setSelectedTask(null);
            }}
            className="px-4 py-2 text-xs font-bold text-gray-650 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg shadow-theme-xs transition cursor-pointer"
          >
            Tutup & Kembali
          </button>
        </div>

        {/* Task Details Info box */}
        <div className="p-5 bg-brand-50/50 dark:bg-brand-500/5 border border-brand-100 dark:border-brand-500/10 rounded-2xl space-y-1.5 shadow-theme-xs">
          <h3 className="text-xs font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider">Instruksi Tugas Utama:</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-medium">
            {selectedTask.description || "Tidak ada instruksi detail tambahan."}
          </p>
        </div>

        <div className="w-full bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm">
          {selectedTask.sub_tasks && selectedTask.sub_tasks.length > 0 ? (
            <div className="space-y-6">
              {selectedTask.sub_tasks.map((st) => {
                const activeSub = st.submissions?.find(
                  (s) => s.status === "pending" || s.status === "approved" || s.status === "rejected"
                );

                const isCompleted = activeSub?.status === "approved";
                const isPending = activeSub?.status === "pending";
                const isRejected = activeSub?.status === "rejected";

                return (
                  <div key={st.id} className="p-5 border border-gray-150 dark:border-gray-850 rounded-2xl bg-white dark:bg-white/[0.01] shadow-theme-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b pb-2.5 dark:border-gray-800">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          {st.title}
                          <span className="text-[10px] font-semibold text-gray-450 dark:text-gray-400 capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
                            Tipe: {st.type === "table" ? "Tabel Dinamis" : st.type}
                          </span>
                        </h4>
                        {st.description && (
                          <p className="text-xs text-gray-550 dark:text-gray-400 mt-0.5 leading-normal">
                            {st.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0">
                        {!activeSub && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            Belum Dikerjakan
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-warning-550/10 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-100 dark:border-warning-500/20">
                            Menunggu Review
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success-550/10 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-100 dark:border-success-500/20">
                            Selesai Disetujui
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-error-550/10 text-error-700 dark:bg-error-500/10 dark:text-error-400 border border-error-100 dark:border-error-500/20">
                            Ditolak (Butuh Revisi)
                          </span>
                        )}
                      </div>
                    </div>

                    {isRejected && activeSub?.rejection_reason && (
                      <div className="p-3 rounded-xl bg-error-50/50 dark:bg-error-500/5 border border-error-100 dark:border-error-500/10 text-xs text-error-750 dark:text-error-400 leading-relaxed font-semibold">
                        Catatan Revisi Admin: "{activeSub.rejection_reason}"
                      </div>
                    )}

                    {/* SUBTASK CONTENT INPUTS */}
                    {(!activeSub || isRejected) && (
                      <div className="space-y-3">
                        {st.type === "link" && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Masukkan tautan pekerjaan (cth: link GDrive)..."
                              value={linkInputs[st.id] || ""}
                              onChange={(e) => setLinkInputs({ ...linkInputs, [st.id]: e.target.value })}
                              className="flex-1 text-xs rounded-lg border border-gray-355 bg-transparent px-3 py-2 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
                            />
                            <button
                              type="button"
                              onClick={() => handleSubmitSubTask(st.id, { link_value: linkInputs[st.id] })}
                              disabled={!linkInputs[st.id]}
                              className="px-3.5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-theme-xs cursor-pointer disabled:opacity-50 transition"
                            >
                              Kirim Tautan
                            </button>
                          </div>
                        )}

                        {st.type === "file" && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-1">
                                <input
                                  type="file"
                                  disabled={subtaskUploading[st.id]}
                                  onChange={(e) => handleSubTaskFileChange(st.id, e)}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-center text-xs bg-gray-50/50 dark:bg-white/[0.01] hover:border-brand-500 text-gray-500">
                                  {subtaskUploading[st.id] ? "Mengunggah berkas..." : subtaskFiles[st.id] ? subtaskFiles[st.id].name : "Pilih file / seret ke sini"}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSubmitSubTask(st.id, { file_url: subtaskFiles[st.id]?.url })}
                                disabled={!subtaskFiles[st.id]?.url}
                                className="px-3.5 py-2 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-theme-xs cursor-pointer disabled:opacity-50 transition"
                              >
                                Kirim File
                              </button>
                            </div>
                          </div>
                        )}

                        {st.type === "table" && (
                          <TableEditor
                            initialData={activeSub?.table_data}
                            onSubmit={(dataStr) => handleSubmitSubTask(st.id, { table_data: dataStr })}
                          />
                        )}
                      </div>
                    )}

                    {/* READ-ONLY VIEW FOR SUBMITTED OR COMPLETED */}
                    {(isPending || isCompleted) && activeSub && (
                      <div className="bg-gray-50/50 dark:bg-white/[0.01] p-3.5 border border-gray-100 dark:border-gray-800 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-400">
                          <span>Dikirim Oleh: {activeSub.submitted_by?.full_name || "Karyawan"}</span>
                          <span>{new Date(activeSub.submitted_at).toLocaleString("id-ID")}</span>
                        </div>

                        {st.type === "link" && activeSub.link_value && (
                          <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <a
                              href={activeSub.link_value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold underline truncate max-w-[500px]"
                            >
                              {activeSub.link_value}
                            </a>
                          </div>
                        )}

                        {st.type === "file" && activeSub.file_url && (
                          <div className="flex items-center gap-2">
                            <a
                              href={activeSub.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-100 bg-brand-50/20 text-xs font-bold text-brand-600 hover:text-brand-700 dark:bg-brand-500/5 dark:text-brand-400 dark:border-brand-500/20 transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Unduh Lampiran File
                            </a>
                          </div>
                        )}

                        {st.type === "table" && activeSub.table_data && (
                          <TableEditor disabled={true} initialData={activeSub.table_data} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-end pt-3 border-t dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitModalOpen(false);
                    setSelectedTask(null);
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition cursor-pointer"
                >
                  Selesai & Kembali
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitTask} className="space-y-4">
              <div>
                <Label>Deskripsi Pekerjaan <span className="text-error-500">*</span></Label>
                <textarea
                  placeholder="Tulis ringkasan hasil pekerjaan / revisi Anda..."
                  value={subDescription}
                  onChange={(e) => setSubDescription(e.target.value)}
                  maxLength={300}
                  className="w-full min-h-[100px] rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 leading-relaxed"
                />
              </div>

              <div>
                <Label>Unggah Berkas Laporan Kerja (Max 25MB) <span className="text-error-500">*</span></Label>
                
                <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-brand-500 dark:hover:border-brand-600 transition cursor-pointer relative bg-gray-50/50 dark:bg-white/[0.01]">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {uploading ? (
                    <div className="space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-brand-500 border-t-transparent mx-auto"></div>
                      <p className="text-xs text-gray-550">Sedang mengunggah berkas... </p>
                    </div>
                  ) : selectedFile || fileUrl ? (
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[300px]">
                        {fileName || "Berkas Laporan"}
                      </div>
                      <div className="text-[10px] text-brand-600 font-semibold">
                        Ubah Berkas (Klik / Seret berkas baru)
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-850 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-xs font-semibold text-gray-650 dark:text-gray-300">
                        Klik untuk memilih berkas atau seret ke sini
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Semua format didukung (maksimal ukuran 25MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitModalOpen(false);
                    setSelectedTask(null);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                >
                  Batal
                </button>
                <Button type="submit" disabled={submitLoading || uploading} className="px-5">
                  {submitLoading ? "Mengirim..." : "Kirim Laporan"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Tugas Unit Saya
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Daftar tugas kelompok untuk unit Anda (<strong className="font-bold text-gray-800 dark:text-white">{currentUser.unit?.name || "Belum ditentukan"}</strong>). Tugas yang diselesaikan oleh salah satu rekan satu unit akan terselesaikan secara kolektif.
        </p>
      </div>

      <div className="animate-fade-in">
        {/* Full-width: Tasks Table */}
        <div className="w-full bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
            Daftar Pengerjaan Tugas Unit
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
            {tasksLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
                <p className="text-sm text-gray-500">Memuat data tugas unit...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-850 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-850 dark:text-white">Tidak Ada Tugas</h3>
                <p className="text-sm text-gray-450 dark:text-gray-400 max-w-xs mx-auto">
                  Bagus! Unit Anda saat ini tidak memiliki tugas aktif dari Admin.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Tugas & Deskripsi</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Riwayat Pengiriman terakhir</th>
                    <th scope="col" className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{task.title}</div>
                        <div className="text-xs text-gray-450 dark:text-gray-400 mt-1 max-w-sm whitespace-pre-wrap leading-relaxed">{task.description || "-"}</div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progres Pengerjaan:</span>
                          <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-md">{getTaskProgress(task)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.status === "open" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            Terbuka (Open)
                          </span>
                        )}
                        {task.status === "pending" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-100 dark:border-warning-500/20">
                            Menunggu Review
                          </span>
                        )}
                        {task.status === "approved" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-100 dark:border-success-500/20">
                            Selesai (Approved)
                          </span>
                        )}
                        {task.status === "rejected" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400 border border-error-100 dark:border-error-500/20">
                            Ditolak (Rejected)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {task.submitted_by ? (
                          <div>
                            <div className="font-semibold text-gray-850 dark:text-white">{task.submitted_by.full_name}</div>
                            <div className="text-[10px] text-gray-400">{task.submitted_at ? new Date(task.submitted_at).toLocaleString() : ""}</div>
                            {task.status === "rejected" && task.rejection_reason && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-xs text-error-500 font-bold truncate max-w-[140px] leading-normal">
                                  Alasan: "{task.rejection_reason}"
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openRejectionModal(task)}
                                  className="text-[9px] px-1.5 py-0.5 font-bold text-error-750 bg-error-50 hover:bg-error-100 rounded-md border border-error-200/40 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/20 transition cursor-pointer flex-shrink-0"
                                >
                                  Lihat Alasan
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Belum dikerjakan</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {task.status === "approved" ? (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <span className="text-xs font-bold text-success-600 bg-success-50 dark:bg-success-500/10 px-3 py-1.5 rounded-lg border border-success-100 dark:border-success-500/10">
                              Terkunci & Selesai
                            </span>
                            <button
                              type="button"
                              onClick={() => openDetailModal(task)}
                              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/[0.03] shadow-theme-xs transition cursor-pointer"
                            >
                              Detail Laporan
                            </button>
                          </div>
                        ) : task.status === "pending" ? (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <button
                              onClick={() => openSubmitModal(task)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-warning-500 hover:bg-warning-600 rounded-lg shadow-theme-xs transition cursor-pointer"
                            >
                              Edit Laporan
                            </button>
                            <button
                              type="button"
                              onClick={() => openDetailModal(task)}
                              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/[0.03] shadow-theme-xs transition cursor-pointer"
                            >
                              Detail Laporan
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <button
                              onClick={() => openSubmitModal(task)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-theme-xs transition cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {task.status === "rejected" ? "Kerjakan Ulang" : "Kerjakan Tugas"}
                            </button>
                            {task.submitted_by_id && (
                              <button
                                type="button"
                                onClick={() => openDetailModal(task)}
                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/[0.03] shadow-theme-xs transition cursor-pointer"
                              >
                                Detail Laporan
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Alasan Penolakan Tugas */}
      <Modal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        className="max-w-[450px] p-6"
      >
        <div className="space-y-4">
          <div className="border-b pb-3 dark:border-gray-800 pr-10 sm:pr-14">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Alasan Penolakan Tugas
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
              Tugas: <strong className="font-bold text-gray-800 dark:text-white">{rejectionReasonTitle}</strong>
            </p>
          </div>
          
          <div className="p-4 bg-error-50/50 dark:bg-error-500/5 border border-error-100 dark:border-error-500/10 rounded-2xl">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {rejectionReasonText || "Tidak ada alasan penolakan yang dicantumkan."}
            </p>
          </div>

          <div className="flex items-center justify-end pt-3 border-t dark:border-gray-800">
            <button
              onClick={() => setIsRejectionModalOpen(false)}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Detail Laporan Tugas Unit */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        className="max-w-[550px] p-6"
      >
        <div className="space-y-4">
          <div className="border-b pb-3 dark:border-gray-800 pr-10 sm:pr-14">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Detail Laporan Kerja
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
              Informasi lengkap pengerjaan tugas oleh rekan unit
            </p>
          </div>

          <div className="space-y-4">
            {/* Task Info */}
            <div className="space-y-1">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Judul Tugas</span>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">{selectedTask?.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                {selectedTask?.description || "Tidak ada deskripsi tugas."}
              </p>
            </div>

            {selectedTask?.sub_tasks && selectedTask.sub_tasks.length > 0 ? (
              <div className="space-y-4 pt-2">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Laporan Pekerjaan per Sub-Tugas</span>
                {selectedTask.sub_tasks.map((st) => {
                  const activeSub = st.submissions?.find(
                    (s) => s.status === "pending" || s.status === "approved" || s.status === "rejected"
                  );
                  return (
                    <div key={st.id} className="p-4 border border-gray-150 dark:border-gray-850 rounded-xl bg-gray-50/50 dark:bg-white/[0.01] space-y-3">
                      <div className="flex justify-between items-start border-b pb-1.5 dark:border-gray-800">
                        <div>
                          <h5 className="text-xs font-bold text-gray-900 dark:text-white">{st.title}</h5>
                          {st.description && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{st.description}</p>}
                        </div>
                        <div>
                          {activeSub ? (
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              activeSub.status === "approved"
                                ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-100"
                                : activeSub.status === "pending"
                                ? "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-100"
                                : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400 border border-error-100"
                            }`}>
                              {activeSub.status === "approved" ? "Disetujui" : activeSub.status === "pending" ? "Menunggu Review" : "Ditolak"}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                              Belum Dikerjakan
                            </span>
                          )}
                        </div>
                      </div>

                      {activeSub ? (
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[10px] text-gray-450 dark:text-gray-400 font-semibold">
                            <span>Oleh: {activeSub.submitted_by?.full_name || "Karyawan"}</span>
                            <span>{new Date(activeSub.submitted_at).toLocaleString("id-ID")}</span>
                          </div>

                          {st.type === "link" && activeSub.link_value && (
                            <a
                              href={activeSub.link_value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-brand-650 font-semibold underline truncate"
                            >
                              {activeSub.link_value}
                            </a>
                          )}

                          {st.type === "file" && activeSub.file_url && (
                            <a
                              href={activeSub.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-50/30 text-[10px] font-bold text-brand-650 hover:bg-brand-50 dark:bg-brand-500/5 dark:text-brand-400 transition"
                            >
                              Unduh Berkas
                            </a>
                          )}

                          {st.type === "table" && activeSub.table_data && (
                            <TableEditor disabled={true} initialData={activeSub.table_data} />
                          )}

                          {activeSub.status === "rejected" && activeSub.rejection_reason && (
                            <div className="mt-1 p-2 rounded-lg bg-error-50/50 dark:bg-error-500/5 text-[10px] text-error-750 dark:text-error-450 font-semibold leading-normal">
                              Catatan Revisi: "{activeSub.rejection_reason}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-gray-400 italic">Belum ada pengerjaan yang dikirim.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <hr className="border-gray-100 dark:border-gray-850" />

                {/* Submission metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dikirim Oleh</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-white/90">
                      {selectedTask?.submitted_by?.full_name || "Karyawan"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Waktu Kirim</span>
                    <span className="text-xs font-semibold text-gray-800 dark:text-white/90">
                      {selectedTask?.submitted_at ? new Date(selectedTask.submitted_at).toLocaleString("id-ID") : "-"}
                    </span>
                  </div>
                </div>

                {/* Submission description */}
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deskripsi Hasil Kerja</span>
                  <div className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-850 rounded-xl leading-relaxed">
                    <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedTask?.submission_description || "Tidak ada deskripsi pengerjaan."}
                    </p>
                  </div>
                </div>

                {/* File attachment */}
                {selectedTask?.submission_file_url && (
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Lampiran File</span>
                    <a
                      href={selectedTask.submission_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-200 dark:border-brand-800/40 bg-brand-50/30 dark:bg-brand-500/5 text-xs font-semibold text-brand-650 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Unduh Berkas Laporan ({selectedTask.submission_file_url.split("/").pop() || "Lampiran"})
                    </a>
                  </div>
                )}

                {/* Rejection / Review Info */}
                {(selectedTask?.status === "approved" || selectedTask?.status === "rejected") && (
                  <>
                    <hr className="border-gray-100 dark:border-gray-850" />
                    <div className="p-3 bg-gray-50/50 dark:bg-white/[0.01] border border-gray-100 dark:border-gray-850 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status Review</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedTask.status === "approved"
                            ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-100"
                            : "bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400 border border-error-100"
                        }`}>
                          {selectedTask.status === "approved" ? "Disetujui" : "Ditolak"}
                        </span>
                      </div>

                      {selectedTask.rejection_reason && (
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold text-error-500 uppercase tracking-wider">Catatan Penolakan Admin</span>
                          <p className="text-xs text-error-750 dark:text-error-400 leading-normal font-semibold">
                            "{selectedTask.rejection_reason}"
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-end pt-3 border-t dark:border-gray-800">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

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
                  ? "bg-brand-500 hover:bg-brand-600" 
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
