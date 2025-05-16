"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export default function ActivityLogsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState({
    action: '',
    objectType: '',
  });
  
  // Initialize supabase client
  const supabase = createClient();
  
  // Check authentication
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = "/sign-in";
        return;
      }
      
      setUser(user);
    };
    
    checkUser();
  }, []);
  
  // Fetch logs
  useEffect(() => {
    if (!user) return;
    
    const fetchLogs = async () => {
      setLoading(true);
      try {
        // Build query params
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        });
        
        if (filter.action) {
          params.append('action', filter.action);
        }
        
        if (filter.objectType) {
          params.append('objectType', filter.objectType);
        }
        
        const response = await fetch(`/api/user-logs?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        
        const data = await response.json();
        setLogs(data.logs || []);
        setTotalPages(data.totalPages || 0);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
  }, [user, page, filter]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to first page when filter changes
  };
  
  // Handle pagination
  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };
  
  if (loading && !logs.length) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">User Activity Logs</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">User Activity Logs</h1>
      
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Action
          </label>
          <select
            name="action"
            value={filter.action}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="create_lead">Create Lead</option>
            <option value="update_lead">Update Lead</option>
            <option value="delete_lead">Delete Lead</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Object Type
          </label>
          <select
            name="objectType"
            value={filter.objectType}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="lead">Lead</option>
            <option value="video">Video</option>
          </select>
        </div>
      </div>
      
      {/* Logs table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Object Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.object_type || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    <div className="flex flex-col">
                      {log.object_id && (
                        <span className="text-xs text-gray-400">
                          ID: {log.object_id}
                        </span>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details>
                          <summary className="cursor-pointer text-blue-500 text-xs">
                            View Details
                          </summary>
                          <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No activity logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 mr-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="mx-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 ml-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
} 