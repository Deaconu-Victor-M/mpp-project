'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isServerOnline: boolean;
}

const NetworkStatusContext = createContext<NetworkStatus>({
  isOnline: true,
  isServerOnline: true,
});

export function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    isServerOnline: true,
  });

  useEffect(() => {
    setStatus(prev => ({ ...prev, isOnline: navigator.onLine }));

    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    const checkServerStatus = async () => {
      try {
        const response = await fetch('/api/health');
        setStatus(prev => ({ ...prev, isServerOnline: response.ok }));
      } catch {
        setStatus(prev => ({ ...prev, isServerOnline: false }));
      }
    };

    const interval = setInterval(checkServerStatus, 30000);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    checkServerStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return React.createElement(NetworkStatusContext.Provider, { value: status }, children);
}

export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
} 