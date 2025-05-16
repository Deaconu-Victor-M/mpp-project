"use client";

import { UserIcon, DashboardIcon, PortalIcon, SettingsIcon, Database } from "./icons";
import Link from "next/link";
import { useState } from "react";
import { toast } from "react-hot-toast";

export default function Sidebar() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateData = async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      toast.loading("Generating test data...", { id: "generate-data" });
      
      const response = await fetch('/api/generate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message, { id: "generate-data" });
      } else {
        toast.error(data.message || "Failed to generate data", { id: "generate-data" });
      }
    } catch (error) {
      toast.error("Failed to generate data", { id: "generate-data" });
      console.error("Error generating data:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const pages = [
    {
      name: "Master List",
      icon: <DashboardIcon className="w-5 h-5 text-[#4F4F4F]"/>,
      href: "/",
    },
    {
      name: "Client Dashboard",
      icon: <UserIcon className="w-5 h-5 text-[#4F4F4F]"/>,
      href: "/client-management",
    },
    {
      name: "Client Portal",
      icon: <PortalIcon className="w-5 h-5 text-[#4F4F4F]"/>,
      href: "/client-portal",
    },
    {
      name: "Settings",
      icon: <SettingsIcon className="w-5 h-5 text-[#4F4F4F]"/>,
      href: "/settings",
    }
  ];
  return (
    <div className="flex flex-col items-center gap-5 py-2 px-3 h-full">
      {pages.map((page) => (
        <Link href={page.href} key={page.name} className={`flex flex-row items-center justify-center p-3 rounded-xl bg-[#EBEBEB] border border-[#4F4F4F]/10 ${page.name === "Settings" ? "mt-auto mb-2" : ""}`}>
          {page.icon}
        </Link>
      ))}
      <button 
        onClick={handleGenerateData}
        disabled={isGenerating}
        className="flex flex-row items-center justify-center p-3 rounded-xl bg-[#EBEBEB] border border-[#4F4F4F]/10 hover:bg-[#E0E0E0] disabled:opacity-50 disabled:cursor-not-allowed"
        title="Generate Test Data"
      >
        <Database className="w-5 h-5 text-[#4F4F4F]" />
      </button>
    </div>
  );
}