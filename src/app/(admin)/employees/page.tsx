"use client";
import React, { useState, useEffect } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";

interface Unit {
  id: string;
  name: string;
  description: string;
}

export default function EmployeesPage() {
  // Auth states
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Settings states
  const [useDefaultPassword, setUseDefaultPassword] = useState(false);
  const [defaultPassword, setDefaultPassword] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [npp, setNpp] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [formLoading, setFormLoading] = useState(false);

  // Employees List states
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"register" | "list">("register");

  // Edit & Delete Employee states
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [newRole, setNewRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnit, setFilterUnit] = useState("");

  // Popup states
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (type: "success" | "error", message: string) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupOpen(true);
  };

  // Load token & user
  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
    }
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing auth_user:", err);
      }
    }
  }, []);

  // Fetch settings & units
  useEffect(() => {
    if (token) {
      // Fetch system settings
      const fetchSettings = async () => {
        try {
          const res = await fetch("http://localhost:8080/api/settings", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok && data.status === "success") {
            setUseDefaultPassword(data.data.use_default_password);
            setDefaultPassword(data.data.default_password || "");
          }
        } catch (err) {
          console.error("Failed to load settings:", err);
        }
      };

      fetchSettings();

      // Fetch units (needed for dropdown if super_admin)
      const fetchUnits = async () => {
        try {
          const res = await fetch("http://localhost:8080/api/units", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok && data.status === "success") {
            setUnits(data.data || []);
            // Set unitId in dropdown for Super Admin
            if (data.data && data.data.length > 0) {
              setUnitId(data.data[0].id);
            }
          }
        } catch (err) {
          console.error("Failed to load units:", err);
        }
      };

      fetchUnits();
    }
  }, [token]);

  // Fetch employees list
  const fetchEmployees = async () => {
    if (!token) return;
    setEmployeesLoading(true);
    try {
      let url = "http://localhost:8080/api/employees";
      const params = new URLSearchParams();
      if (filterUnit) {
        params.append("unit_id", filterUnit);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setEmployees(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setEmployeesLoading(false);
    }
  };

  // Fetch employees on tab change or filter change
  useEffect(() => {
    if (token && (activeTab === "list" || filterUnit)) {
      fetchEmployees();
    }
  }, [token, activeTab, filterUnit]);

  // Handle saving settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);

    if (useDefaultPassword && !defaultPassword) {
      showPopup("error", "Password default harus diisi jika opsi diaktifkan.");
      setSettingsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          use_default_password: useDefaultPassword,
          default_password: defaultPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menyimpan pengaturan.");
      }

      showPopup("success", "Pengaturan password default berhasil diperbarui!");
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Handle registering employee
  const handleRegisterEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    if (!fullName || !npp) {
      showPopup("error", "Nama Lengkap dan NPP wajib diisi.");
      setFormLoading(false);
      return;
    }

    if (!useDefaultPassword && !password) {
      showPopup("error", "Password manual harus diisi karena password default dinonaktifkan.");
      setFormLoading(false);
      return;
    }

    const payload: any = {
      full_name: fullName,
      username: username || null,
      email: email || null,
      npp: npp,
      role: role,
    };

    if (!useDefaultPassword) {
      payload.password = password;
    }

    if (currentUser?.role === "super_admin") {
      if (unitId) {
        payload.unit_id = unitId;
      }
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal mendaftarkan karyawan.");
      }

      showPopup("success", `Karyawan "${fullName}" berhasil didaftarkan!`);
      
      // Reset form
      setFullName("");
      setUsername("");
      setEmail("");
      setNpp("");
      setPassword("");
      setRole("employee");

      // Refresh list if active or registered
      fetchEmployees();

    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !token) return;
    setActionLoading(true);

    try {
      const res = await fetch(`http://localhost:8080/api/employees/${editingEmployee.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui role karyawan.");
      }

      showPopup("success", `Role karyawan "${editingEmployee.full_name}" berhasil diperbarui menjadi ${newRole === "market_liquidity_risk" ? "Market & Liquidity Risk" : "Karyawan"}!`);
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async (emp: any) => {
    if (!token) return;
    if (emp.id === currentUser?.id) {
      showPopup("error", "Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus karyawan "${emp.full_name}" secara permanen?`)) {
      return;
    }
    setActionLoading(true);

    try {
      const res = await fetch(`http://localhost:8080/api/employees/${emp.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus karyawan.");
      }

      showPopup("success", `Karyawan "${emp.full_name}" berhasil dihapus dari sistem!`);
      fetchEmployees();
    } catch (err: any) {
      showPopup("error", err.message || "Terjadi kesalahan.");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper date formatter
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Filtering employees client side for search query
  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = emp.full_name?.toLowerCase().includes(query);
    const emailMatch = emp.email?.toLowerCase().includes(query);
    const nppMatch = emp.npp?.toLowerCase().includes(query);
    return nameMatch || emailMatch || nppMatch;
  });

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
          Hanya Super Admin atau Admin Unit yang diizinkan mengelola karyawan.
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
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Kelola Karyawan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Daftarkan karyawan baru, atur password default, dan kelola saringan divisi.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("register")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "register"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Registrasi Karyawan
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "list"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Daftar Karyawan & Divisi
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "register" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-fade-in">
          {/* Left Side: Register Employee Form */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-3 dark:border-gray-800">
              Form Registrasi Karyawan Baru
            </h2>

            <form onSubmit={handleRegisterEmployee} className="space-y-4">
              {/* Row 1: Nama Lengkap & NPP (Wajib) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nama Lengkap <span className="text-error-500">*</span></Label>
                  <Input
                    placeholder="Nama Lengkap"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div>
                  <Label>NPP (Nomor Pokok Pegawai) <span className="text-error-500">*</span></Label>
                  <Input
                    placeholder="Contoh: 42324001"
                    value={npp}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNpp(val);
                      setUsername(val.slice(0, 4));
                    }}
                    maxLength={20}
                  />
                </div>
              </div>

              {/* Row 2: Username & Email (Opsional) */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Username (Auto-generated)</Label>
                  <Input
                    placeholder="Otomatis dari 4 karakter pertama NPP"
                    value={username}
                    disabled
                    className="bg-gray-100 dark:bg-white/5 cursor-not-allowed"
                    maxLength={30}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="name@company.com (Opsional)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <Label>Role Akun <span className="text-error-500">*</span></Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="employee">Karyawan Biasa</option>
                  <option value="market_liquidity_risk">Market & Liquidity Risk</option>
                </select>
              </div>

              {currentUser.role === "super_admin" ? (
                <div>
                  <Label>Unit Kerja</Label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                  >
                    <option value="">-- Pilih Unit Kerja (Opsional) --</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <Label>Unit Kerja</Label>
                  <div className="h-11 w-full flex items-center px-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm rounded-lg text-gray-500 select-none">
                    {currentUser.unit?.name || "Unit Terkait"}
                  </div>
                </div>
              )}

              {!useDefaultPassword ? (
                <div>
                  <Label>Password Akun Karyawan <span className="text-error-500">*</span></Label>
                  <Input
                    type="password"
                    placeholder="Masukkan password manual"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    maxLength={32}
                  />
                </div>
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-xl">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span><strong>Password Default Aktif:</strong> Akun baru otomatis akan menggunakan password default yang ditentukan di panel kanan.</span>
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Button type="submit" disabled={formLoading} className="w-full sm:w-auto px-6">
                  {formLoading ? "Mendaftarkan..." : "Daftarkan Karyawan"}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Side: Default Password Settings Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-3 dark:border-gray-800">
                Setelan Password Default
              </h2>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* Toggle Switch */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-semibold text-gray-800 dark:text-white/90">
                      Gunakan Password Default
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400">
                      Otomatis pasang password saat registrasi
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useDefaultPassword}
                      onChange={(e) => setUseDefaultPassword(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                  </label>
                </div>

                {/* Password Input */}
                {useDefaultPassword && (
                  <div>
                    <Label>Isi Password Default <span className="text-error-500">*</span></Label>
                    <Input
                      type="text"
                      placeholder="Masukkan password default"
                      value={defaultPassword}
                      onChange={(e) => setDefaultPassword(e.target.value)}
                      maxLength={32}
                    />
                    <p className="mt-1.5 text-xs text-gray-400 leading-normal">
                      Semua karyawan baru akan login pertama kali dengan password ini.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button type="submit" disabled={settingsLoading} size="sm" className="w-full">
                    {settingsLoading ? "Menyimpan..." : "Simpan Setelan"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Employees List View */
        <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm animate-fade-in space-y-6">
          {/* Header Controls (Search and Filters) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari nama, email, atau NPP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={50}
                className="h-11 w-full rounded-xl border border-gray-300 dark:border-gray-800 bg-transparent pl-10 pr-4 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-500 focus:outline-hidden dark:text-white"
              />
            </div>

            {/* Division Filter Dropdown (Super Admin only) */}
            {currentUser.role === "super_admin" && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">Filter Divisi:</span>
                <select
                  value={filterUnit}
                  onChange={(e) => setFilterUnit(e.target.value)}
                  className="h-11 rounded-xl border border-gray-300 bg-white dark:bg-gray-900 px-4 py-2 text-sm shadow-theme-xs focus:border-brand-500 focus:outline-hidden dark:border-gray-800 dark:text-white"
                >
                  <option value="">Semua Unit / Divisi</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Employees Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-800">
            {employeesLoading ? (
              /* Loading Spinner state */
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
                <p className="text-sm text-gray-500">Memuat data karyawan...</p>
              </div>
            ) : filteredEmployees.length === 0 ? (
              /* Empty state */
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-850 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-850 dark:text-white">Tidak Ada Karyawan</h3>
                <p className="text-sm text-gray-450 dark:text-gray-400 max-w-xs mx-auto">
                  {searchQuery 
                    ? `Tidak ada hasil pencarian yang cocok untuk "${searchQuery}"`
                    : "Belum ada karyawan yang terdaftar untuk divisi ini."}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-150 dark:divide-gray-800 text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/60 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4">Karyawan</th>
                    <th scope="col" className="px-6 py-4">NPP</th>
                    <th scope="col" className="px-6 py-4">Username</th>
                    <th scope="col" className="px-6 py-4">Role</th>
                    <th scope="col" className="px-6 py-4">Divisi / Unit</th>
                    <th scope="col" className="px-6 py-4">Terdaftar</th>
                    <th scope="col" className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-100 dark:divide-gray-800/80 text-sm">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-100 dark:border-gray-800 flex-shrink-0">
                            <img
                              src={emp.avatar_url || "/images/user/owner.png"}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{emp.full_name}</div>
                            <div className="text-xs text-gray-550 dark:text-gray-400">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {emp.npp ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-850 dark:text-gray-300 border border-gray-200 dark:border-gray-800">
                            {emp.npp}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-450 italic">Tidak diset</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-455 font-medium">
                        {emp.username || <span className="text-xs text-gray-455 italic">Tidak diset</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20">
                          {emp.role === "market_liquidity_risk" ? "Market & Liquidity Risk" : "Karyawan"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                          {emp.unit?.name || "Tidak Terikat Unit"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-550 dark:text-gray-400">
                        {formatDate(emp.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingEmployee(emp);
                              setNewRole(emp.role);
                            }}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-gray-150 text-gray-500 hover:text-purple-600 border border-gray-200 dark:bg-gray-900/50 dark:border-gray-800 dark:text-gray-400 dark:hover:text-purple-400 transition"
                            title="Edit Peran"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp)}
                            className="inline-flex items-center justify-center p-2 rounded-lg bg-error-50/10 hover:bg-error-50 border border-error-100 hover:border-error-200 text-error-550 transition"
                            title="Hapus Karyawan"
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
            )}
          </div>
        </div>
      )}

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

      {/* Edit Role Modal */}
      <Modal isOpen={!!editingEmployee} onClose={() => setEditingEmployee(null)} className="max-w-[450px] p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Edit Peran Karyawan
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          Ubah peran akses untuk karyawan <strong>{editingEmployee?.full_name}</strong> (NPP: {editingEmployee?.npp}).
        </p>

        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <Label>Peran / Role Baru <span className="text-error-500">*</span></Label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="employee">Karyawan Biasa</option>
              <option value="market_liquidity_risk">Market & Liquidity Risk</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setEditingEmployee(null)}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-750 dark:border-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-xl text-white bg-brand-500 hover:bg-brand-600 font-semibold transition disabled:opacity-50"
            >
              {actionLoading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
