"use client";

import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 right-4 bg-[#FF4747] text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2">
      <span className="inline-block w-3 h-3 bg-white rounded-full animate-pulse"></span>
      <span>You're working offline. Changes will sync when you reconnect.</span>
    </div>
  );
}
