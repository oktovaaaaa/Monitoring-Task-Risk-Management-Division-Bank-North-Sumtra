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
  description: string;
  member_count?: number;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  npp: string;
  avatar_url: string;
  unit_id: string;
  unit?: {
    id: string;
    name: string;
  };
}

export default function UnitsPage() {
  // Auth states
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Form states (Create Unit Modal)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Data states
  const [units, setUnits] = useState<Unit[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // Modal Kelola Karyawan (Assignment) states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Feedback Popup states
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (type: "success" | "error", message: string) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupOpen(true);
  };

  // Load auth state
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

  // Fetch Units & Employees
  const fetchUnitsAndEmployees = async () => {
    if (!token) return;
    setUnitsLoading(true);
    try {
      // 1. Fetch Units
      const unitsRes = await fetch("http://localhost:8080/api/units", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const unitsData = await unitsRes.json();
      const fetchedUnits: Unit[] = unitsData.ok ? unitsData.data : (unitsData.data || []);

      // 2. Fetch Employees (to count members and prepare assignment list)
      const empRes = await fetch("http://localhost:8080/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const empData = await empRes.json();
      const fetchedEmployees: Employee[] = empData.status === "success" ? empData.data : (empData.data || []);

      // Calculate member count for each unit
      const unitsWithCounts = fetchedUnits.map((u) => {
        const count = fetchedEmployees.filter((e) => e.unit_id === u.id).length;
        return { ...u, member_count: count };
      });

      setUnits(unitsWithCounts);
      setEmployees(fetchedEmployees);
    } catch (err) {
      console.error("Failed to load units and employees:", err);
    } finally {
      setUnitsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUnitsAndEmployees();
    }
  }, [token]);

  // Handle Create Unit
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showPopup("error", "Nama Unit Kerja wajib diisi.");
      return;
    }
    setCreateLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/units", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal membuat unit.");
      }

      setIsCreateModalOpen(false);
      showPopup("success", `Unit Kerja "${name}" berhasil ditambahkan!`);
      setName("");
      setDescription("");
      // Refresh list
      fetchUnitsAndEmployees();
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Open Manage Members Modal
  const openManageModal = (unit: Unit) => {
    setSelectedUnit(unit);
    // Find all employees belonging to this unit currently
    const currentMemberIds = employees
      .filter((e) => e.unit_id === unit.id)
      .map((e) => e.id);
    setSelectedEmployeeIds(currentMemberIds);
    setAssignSearchQuery("");
    setIsAssignModalOpen(true);
  };

  // Handle Checkbox Toggle
  const handleToggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Save Assignments
  const handleSaveAssignments = async () => {
    if (!selectedUnit || !token) return;
    setAssignLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/units/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          user_ids: selectedEmployeeIds,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal menyimpan anggota.");
      }

      showPopup("success", `Anggota Unit Kerja "${selectedUnit.name}" berhasil diperbarui!`);
      setIsAssignModalOpen(false);
      // Refresh list
      fetchUnitsAndEmployees();
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setAssignLoading(false);
    }
  };

  // Sort employees alphabetically by Name (A-Z)
  const sortedEmployees = [...employees].sort((a, b) =>
    (a.full_name || "").localeCompare(b.full_name || "")
  );

  // Filter employees inside modal by search query
  const filteredEmployees = sortedEmployees.filter((emp) =>
    (emp.full_name || "").toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
    (emp.npp || "").toLowerCase().includes(assignSearchQuery.toLowerCase())
  );

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  // Guard: Not logged in or not admin
  if (!token || !currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "unit_admin")) {
    return (
      <div className="p-6 text-center bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800 max-w-md mx-auto my-10 shadow-md">
        <h2 className="text-error-500 font-semibold text-lg mb-2">Akses Ditolak</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Hanya Admin yang diizinkan mengelola Unit / Divisi.
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
      {/* Title Header with "+ Tambah Unit" button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Kelola Unit / Divisi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Kelola divisi kerja, deskripsinya, dan tugaskan karyawan ke unit kerja terkait.
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
            Tambah Unit Kerja
          </button>
        </div>
      </div>

      <div className="animate-fade-in">
        {/* Full-width: Existing Units Table */}
        <div className="w-full bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
            Daftar Unit Kerja & Divisi
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
            {unitsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
                <p className="text-sm text-gray-500">Memuat data unit kerja...</p>
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-850 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-850 dark:text-white">Belum Ada Unit</h3>
                <p className="text-sm text-gray-450 dark:text-gray-400 max-w-xs mx-auto">
                  Belum ada unit kerja yang terdaftar. Klik "+ Tambah Unit Kerja" untuk menambahkan.
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Nama Unit</th>
                    <th scope="col" className="px-6 py-4">Deskripsi</th>
                    <th scope="col" className="px-6 py-4">Jumlah Karyawan</th>
                    <th scope="col" className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                  {units.map((unit) => (
                    <tr key={unit.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 dark:text-white">
                        {unit.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {unit.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20">
                          {unit.member_count || 0} Karyawan
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => openManageModal(unit)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-theme-xs transition cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Kelola Karyawan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Tambah Unit Baru (Popup) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="max-w-[500px] p-6"
      >
        <div className="space-y-4">
          <div className="border-b pb-3 dark:border-gray-800 pr-10 sm:pr-14">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Tambah Unit / Divisi Baru
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
              Buat unit kerja baru untuk mengelompokkan karyawan.
            </p>
          </div>

          <form onSubmit={handleCreateUnit} className="space-y-4">
            <div>
              <Label>Nama Unit Kerja / Divisi <span className="text-error-500">*</span></Label>
              <Input
                placeholder="Contoh: IT Division, HR Department"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div>
              <Label>Deskripsi Unit Kerja</Label>
              <textarea
                placeholder="Jelaskan deskripsi/tugas pokok unit kerja ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                className="w-full min-h-[100px] rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/[0.03]"
              >
                Batal
              </button>
              <Button type="submit" disabled={createLoading} className="px-5">
                {createLoading ? "Menambahkan..." : "Buat Unit"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal: Kelola Karyawan (Assignment) */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        className="max-w-[550px] p-6"
      >
        <div className="space-y-4">
          <div className="border-b pb-3 dark:border-gray-800 pr-10 sm:pr-14">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Kelola Karyawan: {selectedUnit?.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-normal">
              Centang nama karyawan untuk ditugaskan ke divisi ini. Karyawan yang tidak dicentang akan dilepas dari divisi ini.
            </p>
          </div>

          {/* Search bar inside Modal */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari nama karyawan..."
              value={assignSearchQuery}
              onChange={(e) => setAssignSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-transparent pl-9 pr-4 text-xs shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden dark:text-white"
            />
          </div>

          {/* Employees List Checklist */}
          <div className="max-h-[300px] overflow-y-auto border border-gray-100 dark:border-gray-850 rounded-xl divide-y divide-gray-100 dark:divide-gray-850 custom-scrollbar pr-1.5">
            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                Karyawan tidak ditemukan.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const isInCurrentUnit = emp.unit_id === selectedUnit?.id;
                const isChecked = selectedEmployeeIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => handleToggleEmployee(emp.id)}
                    className="flex items-center justify-between p-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition duration-150 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // handled by parent onClick
                        className="w-4.5 h-4.5 text-brand-600 border-gray-300 rounded focus:ring-brand-500 dark:focus:ring-brand-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 pointer-events-none"
                      />
                      <div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {emp.full_name}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <span>{emp.email}</span>
                          {emp.npp && (
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] text-gray-500 font-semibold border border-gray-200 dark:border-gray-700">
                              {emp.npp}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Divisi Tag */}
                    {emp.unit_id && !isInCurrentUnit && (
                      <span className="text-[10px] px-2 py-0.5 font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-700">
                        {emp.unit?.name}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Action buttons inside Modal */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t dark:border-gray-800">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-white/[0.03]"
            >
              Batal
            </button>
            <Button
              size="sm"
              disabled={assignLoading}
              onClick={handleSaveAssignments}
              className="px-4"
            >
              {assignLoading ? "Menyimpan..." : "Simpan Anggota"}
            </Button>
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
