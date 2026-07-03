"use client";
import React, { useState, useEffect, useRef } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import Link from "next/link";

export default function ProfileEdit() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth states
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Profile Form states
  const [fullName, setFullName] = useState("");
  const [npp, setNpp] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password Form states
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Loading & feedback states
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load user data
  useEffect(() => {
    setIsClient(true);
    document.title = "Edit Profil | Task Monitoring";
    
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setFullName(parsedUser.full_name || "");
        setNpp(parsedUser.npp || "");
        const url = parsedUser.avatar_url;
        setAvatarUrl(url && url !== "null" && url !== "undefined" ? url : "");
      } catch (err) {
        console.error("Error parsing auth_user:", err);
      }
    }
  }, []);

  // Handle avatar file selection & immediate upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate image format
    const validExtensions = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validExtensions.includes(file.type)) {
      setError("Format file tidak didukung. Harap pilih gambar dengan ekstensi JPG, PNG, GIF, atau WEBP.");
      return;
    }

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8080/api/auth/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal mengunggah foto.");
      }

      setAvatarUrl(result.data);
      setSuccess("Foto profil berhasil diunggah!");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarContainerClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!fullName || !npp) {
      setError("Nama Lengkap dan NPP wajib diisi.");
      setLoading(false);
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak cocok.");
      setLoading(false);
      return;
    }

    const payload: any = {
      full_name: fullName,
      npp: npp || null,
      avatar_url: avatarUrl && avatarUrl !== "null" && avatarUrl !== "undefined" ? avatarUrl : null,
    };

    if (newPassword) {
      payload.old_password = oldPassword;
      payload.new_password = newPassword;
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui profil.");
      }

      setSuccess("Profil Anda berhasil diperbarui!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Update local storage user data
      const updatedUser = {
        ...user,
        full_name: fullName,
        npp: npp || null,
        avatar_url: avatarUrl && avatarUrl !== "null" && avatarUrl !== "undefined" ? avatarUrl : null,
      };
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));
      
      // Redirect back to profile page
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1200);

    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="p-6 text-center bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800 max-w-md mx-auto my-10 shadow-md">
        <h2 className="text-error-500 font-semibold text-lg mb-2">Akses Ditolak</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Silakan log in terlebih dahulu untuk mengedit profil Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Edit Profil
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Perbarui data diri, foto profil, atau ganti kata sandi akun Anda.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Left Side: Avatar & General Fields */}
        <div className="md:col-span-8 space-y-6">
          <div className="bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
              Informasi Umum
            </h2>

            {error && (
              <div className="p-3 text-sm rounded-lg bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400 border border-error-200 animate-shake">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 text-sm rounded-lg bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200">
                {success}
              </div>
            )}

            {/* Avatar upload container */}
            <div className="flex flex-col items-center justify-center gap-4 pb-6 border-b border-gray-100 dark:border-gray-800 w-full">
              {/* Avatar Wrapper with pencil overlay */}
              <div className="relative w-28 h-28 flex-shrink-0">
                {/* Circular Avatar Container */}
                <div 
                  onClick={handleAvatarContainerClick}
                  className="w-full h-full rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-800 cursor-pointer group shadow-inner bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative"
                >
                  {avatarUrl && avatarUrl !== "null" && avatarUrl !== "undefined" ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar Preview"
                      className="w-full h-full object-cover rounded-full transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600 text-3xl font-bold">
                      {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}

                  {/* Uploading loading spinner */}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                    </div>
                  )}
                </div>

                {/* Circular Pencil Button Overlay at Bottom-Right */}
                <button
                  type="button"
                  onClick={handleAvatarContainerClick}
                  className="absolute bottom-0 right-0 bg-brand-500 hover:bg-brand-600 text-white rounded-full p-2.5 shadow-lg border-2 border-white dark:border-gray-900 transition-all duration-200 hover:scale-110 flex items-center justify-center cursor-pointer w-9.5 h-9.5 z-10"
                  title="Ubah Foto Profil"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* General Details Fields */}
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
                  placeholder="Masukkan NPP Anda"
                  value={npp}
                  onChange={(e) => setNpp(e.target.value)}
                  maxLength={20}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Username</Label>
                <div className="h-11 w-full flex items-center px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm rounded-lg text-gray-400 select-none">
                  {user.username || "Tidak diset"}
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <div className="h-11 w-full flex items-center px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm rounded-lg text-gray-400 select-none">
                  {user.email}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Role Akun</Label>
                <div className="h-11 w-full flex items-center px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm rounded-lg text-gray-400 select-none capitalize">
                  {user.role?.replace("_", " ")}
                </div>
              </div>

              <div>
                <Label>Unit Kerja</Label>
                <div className="h-11 w-full flex items-center px-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm rounded-lg text-gray-400 select-none">
                  {user.unit?.name || "Tidak Terikat Unit (Super Admin)"}
                </div>
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button type="submit" disabled={loading || uploading} className="w-full sm:w-auto px-6">
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
              <Link
                href="/profile"
                className="w-full sm:w-auto text-center inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
              >
                Batal
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Change Password Card */}
        <div className="md:col-span-4 bg-white border border-gray-200 rounded-3xl dark:bg-white/[0.03] dark:border-gray-800 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-800">
            Ubah Password
          </h2>

          <div className="space-y-4">
            <div>
              <Label>Password Lama</Label>
              <Input
                type="password"
                placeholder="Masukkan password lama"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                maxLength={32}
              />
            </div>

            <div>
              <Label>Password Baru</Label>
              <Input
                type="password"
                placeholder="Min. 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                maxLength={32}
              />
            </div>

            <div>
              <Label>Konfirmasi Password Baru</Label>
              <Input
                type="password"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                maxLength={32}
              />
            </div>
            
            <p className="text-[11px] text-gray-400 leading-normal">
              Kosongkan kolom sandi di atas jika Anda tidak ingin mengganti password Anda saat ini.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
