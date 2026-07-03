import type { Metadata } from "next";
import React from "react";
import DashboardOverview from "@/components/dashboard/DashboardOverview";

export const metadata: Metadata = {
  title: "Dashboard | DMR Sumut",
  description: "Welcome to the DMR Sumut Dashboard",
};

export default function HomeDashboard() {
  return <DashboardOverview />;
}

