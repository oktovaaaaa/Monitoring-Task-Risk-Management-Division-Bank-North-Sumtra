"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Unit {
  id: string;
  name: string;
  description: string;
}

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // Auth States
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Load current user and token on client mount
  useEffect(() => {
    setIsClient(true);
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);

        // If super_admin, default role to unit_admin
        if (parsedUser && parsedUser.role === "super_admin") {
          setRole("unit_admin");
        }
      } catch (err) {
        console.error("Error parsing stored auth_user:", err);
      }
    }
  }, []);

  // Fetch units if user is super_admin
  useEffect(() => {
    if (token && currentUser && currentUser.role === "super_admin") {
      const fetchUnits = async () => {
        try {
          const res = await fetch("http://localhost:8080/api/units", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          if (res.ok && data.status === "success") {
            setUnits(data.data || []);
            if (data.data && data.data.length > 0) {
              setUnitId(data.data[0].id);
            }
          } else {
            console.error("Failed to fetch units:", data.message);
          }
        } catch (err) {
          console.error("Error fetching units:", err);
        }
      };
      fetchUnits();
    }
  }, [token, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("You must be logged in as an admin to register users.");
      setLoading(false);
      return;
    }

    const payload: any = {
      email,
      password,
      full_name: `${firstName} ${lastName}`,
      role,
    };

    if (currentUser.role === "super_admin" && role === "unit_admin") {
      if (!unitId) {
        setError("Please select a unit for the Unit Admin.");
        setLoading(false);
        return;
      }
      payload.unit_id = unitId;
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
        throw new Error(data.message || "Failed to register user");
      }

      setSuccess(`User with role "${role}" has been registered successfully!`);
      // Reset inputs
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If not mounted on client yet, show loading spinner
  if (!isClient) {
    return (
      <div className="flex items-center justify-center flex-1">
        <p className="text-gray-500">Loading form...</p>
      </div>
    );
  }

  // Guard: User is not logged in
  if (!token || !currentUser) {
    return (
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-10 px-4">
        <div className="p-6 text-center bg-white border border-gray-200 rounded-2xl shadow-theme-xs dark:bg-gray-900 dark:border-gray-800">
          <h2 className="mb-3 font-semibold text-gray-800 text-title-sm dark:text-white/90">
            Authorization Required
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            You must be logged in as an administrator (Super Admin or Unit Admin) to register new employee accounts.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
          >
            Sign In to Admin Account
          </Link>
        </div>
      </div>
    );
  }

  // Guard: Logged in user is not an admin
  if (currentUser.role !== "super_admin" && currentUser.role !== "unit_admin") {
    return (
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-10 px-4">
        <div className="p-6 text-center bg-white border border-gray-200 rounded-2xl shadow-theme-xs dark:bg-gray-900 dark:border-gray-800">
          <h2 className="mb-3 text-error-500 font-semibold text-title-sm">
            Access Denied
          </h2>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Your account role ({currentUser.role}) does not have permission to register new users. Only administrators are allowed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 transition border border-gray-200 rounded-lg dark:border-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <span className="inline-block px-2.5 py-1 text-xs font-semibold text-brand-600 bg-brand-50 rounded-full dark:bg-brand-500/10 dark:text-brand-400 mb-2">
              Logged in as: {currentUser.role === "super_admin" ? "Super Admin" : "Unit Admin"}
            </span>
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Register New Account
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentUser.role === "super_admin"
                ? "Create new Unit Admin or Super Admin accounts."
                : `Register a new employee for your unit: ${currentUser.unit?.name || "assigned unit"}.`}
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                {error && (
                  <div className="p-3.5 text-sm rounded-lg bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400 border border-error-200 dark:border-error-500/20">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3.5 text-sm rounded-lg bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400 border border-success-200 dark:border-success-500/20">
                    {success}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <Label>
                      First Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Label>
                      Last Name<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Min. 6 characters"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>

                {/* Role and Unit select configurations based on logged in user role */}
                {currentUser.role === "super_admin" ? (
                  <>
                    <div>
                      <Label>Role<span className="text-error-500">*</span></Label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      >
                        <option value="unit_admin">Unit Admin (Kepala Unit)</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>

                    {role === "unit_admin" && (
                      <div>
                        <Label>Assign Unit<span className="text-error-500">*</span></Label>
                        <select
                          value={unitId}
                          onChange={(e) => setUnitId(e.target.value)}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                        >
                          {units.length === 0 ? (
                            <option value="">No units available - create one first</option>
                          ) : (
                            units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <Label>Role</Label>
                    <div className="h-11 w-full flex items-center px-4 py-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-sm rounded-lg text-gray-500 dark:text-gray-400 select-none">
                      Employee (automatically assigned to: {currentUser.unit?.name || "your unit"})
                    </div>
                  </div>
                )}

                <div>
                  <button
                    disabled={loading}
                    type="submit"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
                  >
                    {loading ? "Registering account..." : "Register User"}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account? {""}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
