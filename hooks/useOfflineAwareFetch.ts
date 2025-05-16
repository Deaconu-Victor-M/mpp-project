'use client';

// This hook provides offline-aware fetch functionality
// It wraps fetch calls to handle offline scenarios gracefully

import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineAwareFetch() {
  // Get online/offline status from NetworkStatusContext
  const { isOnline } = useNetworkStatus();

  // Main function that wraps fetch calls with offline handling
  // Generic type T represents the expected response data type
  const fetchWithOfflineCheck = async <T>(
    // Takes a function that performs the actual fetch
    fetchFn: () => Promise<T>,
    // Optional handlers for offline and error cases
    options?: {
      onOffline?: () => void; // Called when offline
      onError?: (error: Error) => void; // Called on fetch error
    }
  ): Promise<T | null> => {
    // If offline, call the offline handler and return null
    if (!isOnline) {
      options?.onOffline?.();
      return null;
    }

    // If online, attempt the fetch
    try {
      return await fetchFn();
    } catch (error) {
      // On error, call error handler and return null
      options?.onError?.(error as Error);
      return null;
    }
  };

  // Return the wrapper function and online status
  return {
    fetchWithOfflineCheck,
    isOnline,
  };
} 