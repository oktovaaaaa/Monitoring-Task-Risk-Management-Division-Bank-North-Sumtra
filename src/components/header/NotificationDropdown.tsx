"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  sender_name: string;
  sender_avatar: string;
  created_at: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  // Load auth state
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");
    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing stored user in notifications:", err);
      }
    }
  }, []);

  // Fetch Notifications from Backend
  const fetchNotifications = async (tok: string) => {
    try {
      const res = await fetch("http://localhost:8080/api/notifications", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) {
        console.warn("Notifications API returned non-OK status:", res.status);
        return;
      }
      const data = await res.json();
      if (data.status === "success") {
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  // Sync notifications periodically (every 10 seconds)
  useEffect(() => {
    if (!token) return;
    fetchNotifications(token);
    const interval = setInterval(() => {
      fetchNotifications(token);
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  // Handle dropdown toggle & clear unread notifications
  const handleClick = () => {
    toggleDropdown();
    if (!isOpen && token) {
      // Mark all read in backend immediately when opening
      fetch("http://localhost:8080/api/notifications/read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(() => fetchNotifications(token))
        .catch((err) => console.error("Failed to mark notifications read:", err));
    }
  };

  // Format relative time (e.g. "5 mnt lalu")
  function formatRelativeTime(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {hasUnread && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifikasi
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center text-gray-500">
              <svg className="w-10 h-10 text-gray-300 dark:text-gray-650 mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-xs font-semibold text-gray-650 dark:text-gray-400">Tidak ada notifikasi baru</p>
              <p className="text-[10px] text-gray-400 max-w-[200px] mt-0.5 mx-auto">Semua notifikasi penting tugas kelompok Anda akan muncul di sini.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <li key={notif.id}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 transition-colors ${
                    !notif.is_read ? "bg-brand-50/20 dark:bg-brand-500/5" : ""
                  }`}
                >
                  <span className="relative block w-full h-10 rounded-full z-1 max-w-10">
                    <img
                      src={notif.sender_avatar || "/images/user/owner.png"}
                      alt="Avatar"
                      className="w-10 h-10 overflow-hidden rounded-full object-cover border border-gray-200 dark:border-gray-800"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/user/owner.png";
                      }}
                    />
                    {!notif.is_read && (
                      <span className="absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white bg-orange-400 dark:border-gray-900 animate-pulse"></span>
                    )}
                  </span>

                  <span className="block text-left">
                    <span className="mb-1 block text-theme-sm text-gray-500 dark:text-gray-400 leading-normal">
                      <span className="font-semibold text-gray-800 dark:text-white/90 mr-1.5">
                        {notif.sender_name || "Sistem"}
                      </span>
                      {notif.message}
                    </span>

                    <span className="flex items-center gap-1.5 text-gray-400 text-theme-xs dark:text-gray-500">
                      <span className="font-medium text-brand-600 dark:text-brand-400">{notif.title}</span>
                      <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                      <span>{formatRelativeTime(notif.created_at)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>

        <Link
          href={currentUser?.role === "employee" ? "/my-tasks" : "/tasks"}
          onClick={closeDropdown}
          className="block px-4 py-2 mt-3 text-xs font-semibold text-center text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-350 dark:hover:bg-gray-750 transition"
        >
          Lihat Semua Tugas
        </Link>
      </Dropdown>
    </div>
  );
}
