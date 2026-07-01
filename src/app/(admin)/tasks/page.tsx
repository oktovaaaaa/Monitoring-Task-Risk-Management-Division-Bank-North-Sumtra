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
}

export default function TasksAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Form states (Create Task Modal)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetUnitId, setTargetUnitId] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Review states (Review Modal)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [rejectReasonOpen, setRejectReasonOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

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

  useEffect(() => {
    if (token) {
      fetchTasksAndUnits();
    }
  }, [token]);

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetUnitId) {
      showPopup("error", "Judul Tugas dan Unit Kerja wajib diisi.");
      return;
    }
    setCreateLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          unit_id: targetUnitId,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal membuat tugas.");
      }

      setIsCreateModalOpen(false);
      showPopup("success", `Tugas "${title}" berhasil didelegasikan!`);
      setTitle("");
      setDescription("");
      setTargetUnitId("");
      fetchTasksAndUnits();
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setCreateLoading(false);
    }
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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
            Daftar Tugas Kelompok Unit
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
            {tasksLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
                <p className="text-sm text-gray-500">Memuat data tugas...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-850 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-850 dark:text-white">Belum Ada Tugas</h3>
                <p className="text-sm text-gray-450 dark:text-gray-400 max-w-xs mx-auto">
                  Belum ada tugas yang didelegasikan ke unit kerja mana pun. Klik "Buat Tugas Baru" untuk memulai.
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
                  {tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors duration-150">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{task.title}</div>
                        <div className="text-xs text-gray-450 dark:text-gray-400 mt-1 max-w-xs truncate">{task.description || "-"}</div>
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
                        {task.status === "pending" ? (
                          <button
                            onClick={() => openReviewModal(task)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-warning-500 hover:bg-warning-600 rounded-lg shadow-theme-xs transition cursor-pointer"
                          >
                            Tinjau Laporan
                          </button>
                        ) : task.status === "approved" ? (
                          <button
                            onClick={() => openReviewModal(task)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg shadow-theme-xs transition cursor-pointer"
                          >
                            Lihat Detail
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">Menunggu Pengerjaan</span>
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

      {/* Modal: Tambah Tugas Baru */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="max-w-[500px] p-6"
      >
        <div className="space-y-4">
          <div className="border-b pb-3 dark:border-gray-800 pr-10 sm:pr-14">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Buat Tugas Baru
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
              Buat instruksi tugas kelompok untuk didelegasikan ke unit kerja tertentu.
            </p>
          </div>

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
              <Label>Instruksi Detail Tugas</Label>
              <textarea
                placeholder="Tulis instruksi pengerjaan berkas, format dokumen, dsb..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                className="w-full min-h-[110px] rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/[0.03]"
              >
                Batal
              </button>
              <Button type="submit" disabled={createLoading} className="px-5">
                {createLoading ? "Mengirim..." : "Delegasikan"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Tinjau Laporan (Review) */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        className="max-w-[550px] p-6"
      >
        <div className="space-y-4">
          <div className="border-b pb-3 dark:border-gray-800 pr-10 sm:pr-14">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tinjauan Tugas: {selectedTask?.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
              Periksa deskripsi laporan pengerjaan dan berkas yang dikirim sebelum menyetujui.
            </p>
          </div>

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
