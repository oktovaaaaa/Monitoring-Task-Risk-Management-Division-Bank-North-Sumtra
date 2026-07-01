"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ProfileView() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    document.title = "Profil Saya | Task Monitoring";
    
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing auth_user:", err);
      }
      
      // Fetch latest profile from database to sync
      fetch("http://localhost:8080/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "success" && data.data) {
            localStorage.setItem("auth_user", JSON.stringify(data.data));
            setUser(data.data);
          }
        })
        .catch((err) => console.error("Failed to sync profile:", err));
    }
  }, []);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl dark:bg-gray-900 dark:border-gray-800 max-w-md mx-auto my-10 shadow-lg">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Akses Ditolak</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Silakan masuk (log in) terlebih dahulu untuk mengakses profil Anda.
        </p>
        <Link 
          href="/signin" 
          className="inline-block px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition"
        >
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profil Saya
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Lihat detail informasi akun Anda di bawah ini.
          </p>
        </div>
        <Link
          href="/profile/edit"
          className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-theme-xs transition"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Edit Profil
        </Link>
      </div>

      {/* Plain Profile Details Card */}
      <div className="bg-white border border-gray-200 rounded-2xl dark:bg-white/[0.03] dark:border-gray-800 p-6 sm:p-8 shadow-theme-xs space-y-6">
        {/* Avatar and Primary Info */}
        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-50 flex-shrink-0">
            <img
              src={user.avatar_url && user.avatar_url !== "null" && user.avatar_url !== "undefined" ? user.avatar_url : "/images/user/owner.png"}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-xl font-bold text-gray-950 dark:text-white">
              {user.full_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-850 dark:text-gray-300 border border-gray-200 dark:border-gray-800 capitalize mt-1">
              {user.role?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Detailed Grid Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                Nama Lengkap
              </span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.full_name}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-1">
                NPP (Nomor Pokok Pegawai)
              </span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.npp || <span className="text-gray-400 italic font-normal">Belum diatur</span>}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-1">
                Username
              </span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.username || <span className="text-gray-400 italic font-normal">Belum diatur</span>}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-1">
                Hak Akses / Role
              </span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                {user.role?.replace("_", " ")}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-1">
                Unit Kerja
              </span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user.unit?.name || "Tidak Terikat Unit (Super Admin)"}
              </p>
            </div>

            <div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-550 uppercase tracking-wider block mb-1">
                Terdaftar Sejak
              </span>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatDate(user.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
