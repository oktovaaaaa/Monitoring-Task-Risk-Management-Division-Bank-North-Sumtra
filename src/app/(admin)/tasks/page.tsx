"use client";
import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
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
  email: string;
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
  columns: string[];
  rows: string[][];
}

function TableEditor({
  initialData,
  disabled
}: {
  initialData?: string;
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

  return (
    <div className="space-y-3">
      {subtitle && (
        <div className="text-xs font-bold text-gray-750 dark:text-gray-300">
          Sub-judul: {subtitle}
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-150 dark:border-gray-800">
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

export default function TasksAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedFilterUnit, setSelectedFilterUnit] = useState<string>("all");

  // Form states (Create Task Modal)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetUnitId, setTargetUnitId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Edit Task state
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Dynamic SubTask Creation Form states
  interface FormSubTask {
    id?: string;
    title: string;
    description: string;
    type: "link" | "file" | "table";
  }
  const [formSubTasks, setFormSubTasks] = useState<FormSubTask[]>([]);

  // Review states (Review Modal)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectReasonOpen, setRejectReasonOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // Subtask review states
  const [subtaskRejectionReasons, setSubtaskRejectionReasons] = useState<Record<string, string>>({});
  const [rejectReasonOpenSubTaskId, setRejectReasonOpenSubTaskId] = useState<string | null>(null);
  const [subtaskReviewLoading, setSubtaskReviewLoading] = useState<Record<string, boolean>>({});

  // Feedback Popup states
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (type: "success" | "error", message: string) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupOpen(true);
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

  const fetchTasksAndUnits = async () => {
    if (!token) return;
    setTasksLoading(true);
    
    // 1. Fetch Tasks
    try {
      const tasksRes = await fetch("http://localhost:8080/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (tasksData.status === "success") {
          setTasks(tasksData.data || []);
        }
      } else {
        console.warn("Tasks API returned non-OK status:", tasksRes.status);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }

    // 2. Fetch Units (for creation options)
    try {
      const unitsRes = await fetch("http://localhost:8080/api/units", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (unitsRes.ok) {
        const unitsData = await unitsRes.json();
        if (unitsData.status === "success") {
          setUnits(unitsData.data || []);
        }
      } else {
        console.warn("Units API returned non-OK status:", unitsRes.status);
      }
    } catch (err) {
      console.error("Failed to load units:", err);
    }

    setTasksLoading(false);
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
      fetchTasksAndUnits();
    }
  }, [token]);

  // Handle Create or Update Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetUnitId) {
      showPopup("error", "Judul Tugas dan Unit Kerja wajib diisi.");
      return;
    }
    setCreateLoading(true);

    const isEdit = !!editingTask;
    const url = isEdit ? `http://localhost:8080/api/tasks/${editingTask.id}` : "http://localhost:8080/api/tasks";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          unit_id: targetUnitId,
          sub_tasks: formSubTasks,
        }),
      });

      let result: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `HTTP error ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(result.message || `Gagal ${isEdit ? "memperbarui" : "membuat"} tugas.`);
      }

      setIsCreateModalOpen(false);
      showPopup("success", isEdit ? `Tugas "${title}" berhasil diperbarui!` : `Tugas "${title}" berhasil didelegasikan!`);
      setTitle("");
      setDescription("");
      setTargetUnitId("");
      setFormSubTasks([]);
      setEditingTask(null);
      fetchTasksAndUnits();
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Edit Task Modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description);
    setTargetUnitId(task.unit_id);
    
    // Map sub_tasks to FormSubTask mapping
    const mappedSubTasks = (task.sub_tasks || []).map((st) => ({
      id: st.id,
      title: st.title,
      description: st.description,
      type: st.type,
    }));
    
    setFormSubTasks(mappedSubTasks);
    setIsCreateModalOpen(true);
  };

  // Open Review modal
  const openReviewModal = (task: Task) => {
    setSelectedTask(task);
    setRejectionReason("");
    setRejectReasonOpen(false);
    setIsReviewModalOpen(true);
  };

  // Handle Review Action (Approve / Reject)
  const handleReviewAction = async (action: "approve" | "reject") => {
    if (!selectedTask || !token) return;
    if (action === "reject" && !rejectionReason.trim()) {
      showPopup("error", "Alasan penolakan wajib diisi.");
      return;
    }
    setReviewLoading(true);

    try {
      const res = await fetch(`http://localhost:8080/api/tasks/${selectedTask.id}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          rejection_reason: action === "reject" ? rejectionReason : "",
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal memproses review.");
      }

      setIsReviewModalOpen(false);
      const statusWord = action === "approve" ? "disetujui" : "ditolak";
      showPopup("success", `Tugas "${selectedTask.title}" berhasil ${statusWord}!`);
      fetchTasksAndUnits();
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleReviewSubTask = async (stId: string, submissionId: string, action: "approve" | "reject") => {
    if (!token) return;
    const rejReason = subtaskRejectionReasons[stId] || "";
    if (action === "reject" && !rejReason.trim()) {
      showPopup("error", "Alasan penolakan sub-tugas wajib diisi.");
      return;
    }

    setSubtaskReviewLoading(prev => ({ ...prev, [stId]: true }));
    try {
      const res = await fetch(`http://localhost:8080/api/tasks/subtasks/${stId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          submission_id: submissionId,
          action,
          rejection_reason: action === "reject" ? rejReason : "",
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal memproses review sub-tugas.");
      }

      showPopup("success", `Review sub-tugas berhasil disimpan!`);
      setRejectReasonOpenSubTaskId(null);
      
      // Update selectedTask locally to show immediate feedback in modal
      if (selectedTask) {
        const updatedSubTasks = selectedTask.sub_tasks?.map(st => {
          if (st.id !== stId) return st;
          const updatedSubmissions = st.submissions?.map(subm => {
            if (subm.id !== submissionId) return subm;
            return {
              ...subm,
              status: action === "approve" ? ("approved" as const) : ("rejected" as const),
              rejection_reason: action === "reject" ? rejReason : "",
              reviewed_by: { id: currentUser?.id || "", full_name: currentUser?.full_name || "Admin", email: currentUser?.email || "" },
              reviewed_at: new Date().toISOString()
            };
          });
          return { ...st, submissions: updatedSubmissions };
        });
        
        let allApproved = true;
        let anyPending = false;
        let anyRejected = false;
        updatedSubTasks?.forEach(st => {
          const activeSub = st.submissions?.find(s => s.status === "pending" || s.status === "approved" || s.status === "rejected");
          if (activeSub?.status === "approved") {
            // approved
          } else {
            allApproved = false;
          }
          if (activeSub?.status === "pending") {
            anyPending = true;
          }
          if (activeSub?.status === "rejected") {
            anyRejected = true;
          }
        });
        
        const newParentStatus = allApproved ? "approved" : (anyPending ? "pending" : (anyRejected ? "rejected" : "open"));
        const updatedSelectedTask = { ...selectedTask, sub_tasks: updatedSubTasks, status: newParentStatus as any };
        setSelectedTask(updatedSelectedTask);
        setTasks(tasks.map(t => t.id === selectedTask.id ? updatedSelectedTask : t));
      }
      
      fetchTasksAndUnits();
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setSubtaskReviewLoading(prev => ({ ...prev, [stId]: false }));
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  // Guard: Not admin
  if (!token || !currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "unit_admin")) {
    return (
      <div className="p-6 text-center bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800 max-w-md mx-auto my-10 shadow-md">
        <h2 className="text-error-500 font-semibold text-lg mb-2">Akses Ditolak</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Hanya Admin yang diizinkan mengelola tugas unit kerja.
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

  if (isCreateModalOpen) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto pb-12 animate-fade-in">
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-gray-800">
          <div className="space-y-1">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingTask(null);
                setTitle("");
                setDescription("");
                setTargetUnitId("");
                setFormSubTasks([]);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-500 dark:text-gray-400 mb-2 transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali ke Daftar Tugas
            </button>
            <h1 className="text-2xl font-extrabold text-gray-905 dark:text-white tracking-tight">
              {editingTask ? "Edit Tugas / Proyek" : "Buat Tugas Baru"}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">
              {editingTask 
                ? "Perbarui rincian tugas dan kelola sub-tugas yang didelegasikan." 
                : "Buat instruksi tugas kelompok untuk didelegasikan ke unit kerja tertentu."}
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setIsCreateModalOpen(false);
              setEditingTask(null);
              setTitle("");
              setDescription("");
              setTargetUnitId("");
              setFormSubTasks([]);
            }}
            className="px-4 py-2 text-xs font-bold text-gray-650 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg shadow-theme-xs transition cursor-pointer"
          >
            Tutup & Kembali
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm">
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <Label>Judul Tugas / Nama Proyek <span className="text-error-500">*</span></Label>
              <Input
                placeholder="Contoh: Laporan Keuangan Semester 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
              />
            </div>

            <div>
              <Label>Unit Penerima Tugas <span className="text-error-500">*</span></Label>
              <select
                value={targetUnitId}
                onChange={(e) => setTargetUnitId(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">-- Pilih Unit Penerima --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Instruksi Detail Tugas Utama</Label>
              <textarea
                placeholder="Tulis instruksi pengerjaan berkas, format dokumen, dsb..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                className="w-full min-h-[110px] rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 leading-relaxed"
              />
            </div>

            {/* SUB-TASKS SECTION */}
            <div className="space-y-3.5 pt-2 border-t dark:border-gray-800">
              <div className="flex justify-between items-center">
                <Label className="font-bold text-gray-900 dark:text-white">Daftar Sub-Tugas (Opsional)</Label>
                <button
                  type="button"
                  onClick={() => setFormSubTasks([...formSubTasks, { title: "", description: "", type: "link" }])}
                  className="px-2.5 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-theme-xs cursor-pointer transition"
                >
                  + Tambah Sub-Tugas
                </button>
              </div>

              {formSubTasks.map((st, idx) => (
                <div key={idx} className="p-4 border border-gray-150 dark:border-gray-855 rounded-xl bg-gray-50/50 dark:bg-white/[0.01] space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">Sub-Tugas #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setFormSubTasks(formSubTasks.filter((_, i) => i !== idx))}
                      className="text-xs font-bold text-error-500 hover:text-error-600 cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <Label className="text-[11px]">Nama / Judul Sub-Tugas *</Label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Lampirkan Link GDrive"
                        value={st.title}
                        onChange={(e) => {
                          const next = [...formSubTasks];
                          next[idx].title = e.target.value;
                          setFormSubTasks(next);
                        }}
                        className="w-full text-xs rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Tipe Pekerjaan *</Label>
                      <select
                        value={st.type}
                        onChange={(e) => {
                          const next = [...formSubTasks];
                          next[idx].type = e.target.value as any;
                          setFormSubTasks(next);
                        }}
                        className="w-full text-xs h-[34px] rounded-lg border border-gray-300 bg-transparent px-2.5 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      >
                        <option value="link">Teks Tautan (Link)</option>
                        <option value="file">Unggah Berkas (File)</option>
                        <option value="table">Tabel Dinamis</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px]">Instruksi Singkat Sub-Tugas</Label>
                    <input
                      type="text"
                      placeholder="Contoh: Pastikan link diset publik"
                      value={st.description}
                      onChange={(e) => {
                        const next = [...formSubTasks];
                        next[idx].description = e.target.value;
                        setFormSubTasks(next);
                      }}
                      className="w-full text-xs rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:text-white/90"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-800">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingTask(null);
                  setTitle("");
                  setDescription("");
                  setTargetUnitId("");
                  setFormSubTasks([]);
                }}
                className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/[0.03]"
              >
                Batal
              </button>
              <Button type="submit" disabled={createLoading} className="px-5">
                {createLoading ? "Mengirim..." : editingTask ? "Simpan Perubahan" : "Delegasikan"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Kelola Tugas Unit
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Berikan tugas kelompok per unit kerja dan tinjau laporan berkas yang dikirim karyawan.
          </p>
        </div>
        <div className="flex justify-end w-full sm:w-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-theme-xs transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Buat Tugas Baru
          </button>
        </div>
      </div>

      <div className="animate-fade-in">
        {/* Full-width: Tasks Table */}
        <div className="w-full bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Daftar Tugas Kelompok Unit
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Filter Divisi:</span>
              <select
                value={selectedFilterUnit}
                onChange={(e) => setSelectedFilterUnit(e.target.value)}
                className="h-9 rounded-lg border border-gray-200 bg-white dark:bg-gray-900 px-3 text-xs font-semibold text-gray-700 dark:text-gray-300 dark:border-gray-850 shadow-theme-xs focus:border-brand-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Divisi / Unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
            {tasksLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
                <p className="text-sm text-gray-500">Memuat data tugas...</p>
              </div>
            ) : (selectedFilterUnit === "all" ? tasks : tasks.filter((t) => t.unit_id === selectedFilterUnit)).length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-850 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-850 dark:text-white">Tidak Ada Tugas</h3>
                <p className="text-sm text-gray-450 dark:text-gray-400 max-w-xs mx-auto">
                  {selectedFilterUnit === "all"
                    ? "Belum ada tugas yang didelegasikan ke unit kerja mana pun."
                    : "Tidak ada tugas yang didelegasikan ke divisi ini."}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Tugas</th>
                    <th scope="col" className="px-6 py-4">Penerima (Unit)</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Pengirim Laporan</th>
                    <th scope="col" className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                  {(selectedFilterUnit === "all" ? tasks : tasks.filter((t) => t.unit_id === selectedFilterUnit)).map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{task.title}</div>
                        <div className="text-xs text-gray-450 dark:text-gray-400 mt-1 max-w-xs truncate">{task.description || "-"}</div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Progres:</span>
                          <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-md">{getTaskProgress(task)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-700 dark:text-gray-300">
                        {task.unit?.name || "Semua Unit"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {task.status === "open" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                            Terbuka (Open)
                          </span>
                        )}
                        {task.status === "pending" && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400 border border-warning-100 dark:border-warning-500/20">
                            Perlu Review
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
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {task.submitted_by ? (
                          <div>
                            <div className="font-semibold text-gray-850 dark:text-white">{task.submitted_by.full_name}</div>
                            <div className="text-[10px] text-gray-400">{task.submitted_at ? new Date(task.submitted_at).toLocaleString() : ""}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {task.status === "pending" && (
                            <button
                              onClick={() => openReviewModal(task)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-warning-500 hover:bg-warning-600 rounded-lg shadow-theme-xs transition cursor-pointer"
                            >
                              Tinjau Laporan
                            </button>
                          )}
                          {task.status === "approved" && (
                            <button
                              onClick={() => openReviewModal(task)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg shadow-theme-xs transition cursor-pointer"
                            >
                              Lihat Detail
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(task)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-theme-xs transition cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>



      {/* Modal: Tinjau Laporan (Review) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        className={selectedTask?.sub_tasks && selectedTask.sub_tasks.length > 0 ? "max-w-[750px] w-full p-6 max-h-[85vh] overflow-y-auto" : "max-w-[550px] p-6"}
      >
        <div className="space-y-4">
          <div className="border-b pb-3 dark:border-gray-800 pr-10 sm:pr-14">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tinjauan Tugas: {selectedTask?.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
              {selectedTask?.sub_tasks && selectedTask.sub_tasks.length > 0
                ? "Tinjau hasil kerja untuk masing-masing sub-tugas yang telah dikirim."
                : "Periksa deskripsi laporan pengerjaan dan berkas yang dikirim sebelum menyetujui."}
            </p>
          </div>

          {selectedTask?.sub_tasks && selectedTask.sub_tasks.length > 0 ? (
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
                          <span className="text-[10px] font-semibold text-gray-450 dark:text-gray-405 capitalize px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-md">
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

                    {/* READ-ONLY VIEW OF EMPLOYEE WORK SUBMITTED */}
                    {activeSub ? (
                      <div className="bg-gray-50/50 dark:bg-white/[0.01] p-3.5 border border-gray-100 dark:border-gray-850 rounded-xl space-y-3">
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

                        {isRejected && activeSub.rejection_reason && (
                          <div className="p-2.5 rounded-lg bg-error-50/50 dark:bg-error-500/5 border border-error-100 dark:border-error-500/10 text-[10px] text-error-750 dark:text-error-400 font-semibold leading-normal">
                            Catatan Revisi: "{activeSub.rejection_reason}"
                          </div>
                        )}

                        {/* SUBTASK ACTIONS PANEL */}
                        {isPending && (
                          <div className="pt-2 border-t dark:border-gray-800">
                            {rejectReasonOpenSubTaskId === st.id ? (
                              <div className="space-y-2">
                                <Label className="text-[10px]">Alasan Penolakan Sub-Tugas *</Label>
                                <textarea
                                  placeholder="Jelaskan bagian mana yang perlu diperbaiki oleh karyawan..."
                                  value={subtaskRejectionReasons[st.id] || ""}
                                  onChange={(e) => setSubtaskRejectionReasons({
                                    ...subtaskRejectionReasons,
                                    [st.id]: e.target.value
                                  })}
                                  maxLength={150}
                                  className="w-full min-h-[70px] text-xs rounded-lg border border-gray-300 bg-transparent px-3 py-2 placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    onClick={() => setRejectReasonOpenSubTaskId(null)}
                                    className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    onClick={() => handleReviewSubTask(st.id, activeSub.id, "reject")}
                                    disabled={subtaskReviewLoading[st.id]}
                                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-error-500 hover:bg-error-600 rounded-lg transition cursor-pointer"
                                  >
                                    {subtaskReviewLoading[st.id] ? "Mengirim..." : "Kirim Revisi"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2.5">
                                <button
                                  onClick={() => setRejectReasonOpenSubTaskId(st.id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-error-600 bg-error-50 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 rounded-lg transition cursor-pointer"
                                >
                                  Tolak (Butuh Revisi)
                                </button>
                                <button
                                  onClick={() => handleReviewSubTask(st.id, activeSub.id, "approve")}
                                  disabled={subtaskReviewLoading[st.id]}
                                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-success-500 hover:bg-success-600 rounded-lg shadow-theme-xs transition cursor-pointer"
                                >
                                  {subtaskReviewLoading[st.id] ? "Memproses..." : "Setujui Sub-Tugas"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-450 dark:text-gray-400 italic pl-1">Belum dikerjakan oleh karyawan.</p>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-end pt-3 border-t dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl transition cursor-pointer"
                >
                  Tutup Tinjauan
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3.5 text-sm bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-850 p-4.5 rounded-2xl">
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Instruksi Tugas</div>
                  <div className="text-sm font-medium text-gray-850 dark:text-white mt-1">
                    {selectedTask?.description || "Tidak ada instruksi khusus."}
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800/80 pt-3">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Dikirim Oleh</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {selectedTask?.submitted_by?.full_name} ({selectedTask?.submitted_by?.email})
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800/80 pt-3">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Deskripsi Laporan Kerja</div>
                  <div className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap leading-relaxed">
                    {selectedTask?.submission_description || "Karyawan tidak menyertakan deskripsi laporan."}
                  </div>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800/80 pt-3">
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Lampiran Berkas</div>
                  <div className="mt-1.5">
                    {selectedTask?.submission_file_url ? (
                      <a
                        href={selectedTask.submission_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:hover:bg-brand-500/20 px-3.5 py-2 rounded-xl border border-brand-100 dark:border-brand-500/10 transition"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Unduh Berkas Laporan Kerja
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">Tidak ada lampiran berkas.</span>
                    )}
                  </div>
                </div>

                {selectedTask?.status === "approved" && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Hasil Review</div>
                    <div className="text-xs font-bold text-success-600 bg-success-50 dark:bg-success-500/10 px-3 py-1.5 rounded-lg border border-success-100 dark:border-success-500/10 mt-1.5 inline-block">
                      Tugas telah Disetujui & Selesai
                    </div>
                  </div>
                )}

                {selectedTask?.status === "rejected" && selectedTask.rejection_reason && (
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Alasan Penolakan</div>
                    <div className="text-sm font-semibold text-error-600 mt-1">
                      {selectedTask.rejection_reason}
                    </div>
                  </div>
                )}
              </div>

              {selectedTask?.status === "pending" && (
                <div className="space-y-3.5 pt-1">
                  {rejectReasonOpen ? (
                    <div className="space-y-2.5">
                      <Label>Alasan Penolakan <span className="text-error-500">*</span></Label>
                      <textarea
                        placeholder="Jelaskan alasan penolakan berkas/revisi tugas ini..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        maxLength={150}
                        className="w-full min-h-[80px] rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setRejectReasonOpen(false)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
                        >
                          Kembali
                        </button>
                        <button
                          onClick={() => handleReviewAction("reject")}
                          disabled={reviewLoading}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-error-500 hover:bg-error-600 rounded-lg transition"
                        >
                          {reviewLoading ? "Menyimpan..." : "Kirim Penolakan"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-800">
                      <button
                        onClick={() => setRejectReasonOpen(true)}
                        className="px-4 py-2.5 text-xs font-semibold text-error-600 bg-error-50 hover:bg-error-100 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/20 rounded-lg transition"
                      >
                        Tolak (Reject)
                      </button>
                      <Button
                        size="sm"
                        disabled={reviewLoading}
                        onClick={() => handleReviewAction("approve")}
                        className="px-4"
                      >
                        {reviewLoading ? "Memproses..." : "Setujui (Approve)"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {selectedTask?.status !== "pending" && (
                <div className="flex items-center justify-end pt-3 border-t dark:border-gray-800">
                  <button
                    onClick={() => setIsReviewModalOpen(false)}
                    className="px-5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </>
          )}
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
