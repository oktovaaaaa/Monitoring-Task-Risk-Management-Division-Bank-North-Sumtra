"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  // Form states
  const [npp, setNpp] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch captcha from backend
  const fetchCaptcha = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/auth/captcha");
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setCaptchaId(data.data.captcha_id);
        setCaptchaImage(data.data.captcha_image);
      } else {
        console.error("Failed to load captcha:", data.message);
      }
    } catch (err) {
      console.error("Error fetching captcha:", err);
    }
  };

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!npp || !password || !captchaAnswer) {
      setError("Please fill in all fields including the captcha.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          npp,
          password,
          captcha_id: captchaId,
          captcha_answer: captchaAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save credentials and token
      localStorage.setItem("auth_token", data.data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.data.user));
      
      // Save token in cookie for middleware
      document.cookie = `auth_token=${data.data.token}; path=/; max-age=86400; SameSite=Lax;`;

      // Redirect to home/dashboard
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please try again.");
      fetchCaptcha(); // Refresh captcha on failure
      setCaptchaAnswer("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full px-4 sm:px-6">
      <div className="w-full max-w-md sm:pt-4 mx-auto mb-2">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto py-2">
        <div>
          <div className="mb-4 sm:mb-5">
            <h1 className="mb-1 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your NPP and password to sign in!
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {error && (
                  <div className="p-3 text-sm rounded-lg bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400 border border-error-200 dark:border-error-500/20">
                    {error}
                  </div>
                )}
                
                <div>
                  <Label>
                    NPP <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    placeholder="Masukkan NPP Anda" 
                    type="text" 
                    value={npp}
                    onChange={(e) => setNpp(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
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

                {/* Captcha Section */}
                <div className="space-y-1.5">
                  <Label>
                    Captcha Code <span className="text-error-500">*</span>
                  </Label>
                  <div className="flex items-center gap-3">
                    {captchaImage ? (
                      <img
                        src={captchaImage}
                        alt="Captcha"
                        className="h-14 w-44 rounded-xl border border-gray-200 dark:border-gray-850 select-none pointer-events-none object-cover bg-white dark:bg-gray-950 shadow-sm"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-14 w-44 font-mono text-sm font-bold tracking-wider text-gray-400 bg-gray-100 border border-gray-200 rounded-xl select-none dark:bg-white/5 dark:border-gray-800 pointer-events-none">
                        Loading...
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={fetchCaptcha}
                      className="flex items-center justify-center h-14 px-4 text-xs font-semibold text-gray-500 hover:text-brand-500 hover:border-brand-300 dark:hover:border-brand-800 dark:hover:text-brand-400 transition-colors border border-gray-200 rounded-xl dark:border-gray-800 dark:bg-gray-900 bg-transparent cursor-pointer"
                    >
                      Refresh
                    </button>
                  </div>
                  <Input
                    placeholder="Masukkan kode captcha di atas"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    type="text"
                    className="font-mono text-center tracking-widest"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Link
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                
                <div className="pt-1">
                  <Button className="w-full" size="sm" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
