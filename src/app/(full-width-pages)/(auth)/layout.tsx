import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-[#F2EBD9] dark:bg-[#F2EBD9] lg:flex items-center justify-center hidden">
            <div className="flex flex-col items-center justify-center w-full p-12">
              <Link href="/" className="block transition-transform hover:scale-105 duration-300">
                <img
                  src="/images/baksumuticon.png"
                  alt="Logo Bank Sumut"
                  className="w-[300px] h-[100px] md:w-[450px] md:h-[150px] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                />
              </Link>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
