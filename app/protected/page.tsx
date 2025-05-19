"use client";

import { InfoIcon } from "lucide-react";

import { useState, useEffect, useRef } from "react";
import {
  Lead,
  Category,
  Video,
} from "@/lib/types";
import toast, { Toaster } from "react-hot-toast";
import {
  WorldIcon,
  StatusIcon,
  TimerIcon,
  ClientIcon,
  DataIcon,
  AddIcon,
  FilterIcon,
  MoreIcon,
  EditIcon,
  TrashIcon,
  DashboardIcon,
} from "@/components/icons";
import AddLeadModal from "@/components/AddLeadModal";
import CategoryDropdown from "@/components/CategoryDropdown";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { createClient } from "@/utils/supabase/client";
import TestDataGenerator from "@/components/TestDataGenerator";
import CategoryPieChart from "@/components/CategoryPieChart";
import VideoList from "@/components/VideoList";
import VideoSetup from "@/components/VideoSetup";
import ProfileImage from '@/components/ProfileImage';
import { User } from "@supabase/supabase-js";

import { jwtDecode } from 'jwt-decode'
import { MFAEnrollment } from '../components/MFAEnrollment';

// Add custom interface for JWT payload
interface CustomJwtPayload {
  user_role?: 'admin' | 'user';
  [key: string]: any;
}

// Add type definition for UserRole
interface UserRole {
  id?: number;
  user_id: string;
  role: 'admin' | 'user';
  created_at?: string;
}

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  companyName,
  className = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  companyName: string;
  className?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#F7F7F7]/40 flex items-center justify-center z-50">
      <div
        className={`bg-white border border-[#EBEBEB] rounded-xl p-6 w-full max-w-md shadow-2xl ${className}`}
      >
        <h3 className="text-xl font-semibold text-[#4F4F4F] mb-4">
          Confirm Deletion
        </h3>
        <p className="mb-6 text-[#4F4F4F]">
          Are you sure you want to delete{" "}
          <span className="font-medium">{companyName}</span>? This action cannot
          be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-[#4F4F4F] hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#FF4747] text-white rounded-lg hover:bg-[#E43535] cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Add EditLeadModal component
const EditLeadModal = ({
  isOpen,
  onClose,
  onSubmit,
  twitterUrl,
  setTwitterUrl,
  isEditingLead,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  twitterUrl: string;
  setTwitterUrl: (url: string) => void;
  isEditingLead: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute left-0 right-0 bg-white border border-[#EBEBEB] rounded-lg shadow-lg p-4 mt-2">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-[#4F4F4F] mb-2">
            Twitter URL
          </label>
          <input
            type="text"
            value={twitterUrl}
            onChange={(e) => setTwitterUrl(e.target.value)}
            placeholder="https://twitter.com/username"
            className="w-full px-3 py-2 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-[#4F4F4F] hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isEditingLead}
            className="px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#1a1a1a] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditingLead ? "Updating..." : "Update Lead"}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add FilterDropdown component
const FilterDropdown = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onCategorySelect,
  minFollowers,
  maxFollowers,
  onFollowersChange,
  onApplyFilters,
  onClearFilters,
  className = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: Category | null;
  onCategorySelect: (category: Category | null) => void;
  minFollowers: number;
  maxFollowers: number;
  onFollowersChange: (min: number, max: number) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  className?: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className={`absolute left-0 top-full mt-2 bg-white border border-[#EBEBEB] rounded-lg shadow-lg p-4 z-10 w-80 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Category filter */}
        <div>
          <label className="block text-sm font-medium text-[#4F4F4F] mb-2">
            Filter by Category
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => onCategorySelect(selectedCategory?.id === category.id ? null : category)}
                className={`px-2 py-1 rounded-md text-sm cursor-pointer flex items-center gap-2 ${selectedCategory?.id === category.id
                    ? 'ring-2 ring-offset-1'
                    : 'hover:bg-gray-100'
                  }`}
                style={{
                  backgroundColor: selectedCategory?.id === category.id ? `${category.color}20` : 'transparent',
                  borderLeft: `3px solid ${category.color}`
                }}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                <span>{category.name}</span>
              </div>
            ))}
          </div>
          {selectedCategory && (
            <button
              onClick={() => onCategorySelect(null)}
              className="text-xs text-blue-500 hover:underline"
            >
              Clear category
            </button>
          )}
        </div>

        {/* Followers range filter */}
        <div>
          <label className="block text-sm font-medium text-[#4F4F4F] mb-2">
            Followers Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={minFollowers || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                onFollowersChange(value, maxFollowers);
              }}
              placeholder="Min"
              className="w-full px-3 py-2 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
            />
            <span className="text-gray-500">to</span>
            <input
              type="number"
              value={maxFollowers || ''}
              onChange={(e) => {
                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                onFollowersChange(minFollowers, value);
              }}
              placeholder="Max"
              className="w-full px-3 py-2 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="0"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between">
          <button
            onClick={onClearFilters}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear All
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onApplyFilters}
              className="px-3 py-1 text-sm bg-[#252525] text-white rounded-lg hover:bg-[#1a1a1a]"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProtectedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [showMFAEnrollment, setShowMFAEnrollment] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  
  // Create supabase browser client using the correct function
  const supabase = createClient();
  
  // Add useEffect for auth check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = "/sign-in";
        return;
      }
      
      // Get the session to access the token
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const jwt = jwtDecode<CustomJwtPayload>(session.access_token);
        console.log("JWT decoded:", jwt);
        // Store the complete JWT
        setDecodedJwt(jwt);
        // Set user role from JWT claims
        if (jwt.user_role) {
          setUserRole({
            user_id: user.id,
            role: jwt.user_role
          });
        }

        // Check MFA status
        const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        
        // If 2FA is required but not verified, redirect to verification page
        if (mfaData?.currentLevel === 'aal1' && mfaData?.nextLevel === 'aal2') {
          window.location.href = "/verify-2fa";
          return;
        }

        // If 2FA is not required or already verified, show enrollment if needed
        if (mfaData?.currentLevel === 'aal1' && mfaData?.nextLevel === 'aal1') {
          setShowMFAEnrollment(true);
        } else if (mfaData?.currentLevel === 'aal2') {
          setMfaEnrolled(true);
        }
      }
    };
    
    checkUser();
    
    // Set up auth state change listener
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const jwt = jwtDecode<CustomJwtPayload>(session.access_token);
        if (jwt.user_role) {
          setUserRole({
            user_id: session.user.id,
            role: jwt.user_role
          });
        }
      }
    });
    
    // Cleanup listener on unmount
    return () => {
      data?.subscription?.unsubscribe?.();
    };
  }, []);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const { isOnline } = useNetworkStatus();
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [openMenuLeadId, setOpenMenuLeadId] = useState<string | null>(null);
  const [decodedJwt, setDecodedJwt] = useState<CustomJwtPayload | null>(null);

  // New state for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Add filter states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [filterCategory, setFilterCategory] = useState<Category | null>(null);
  const [minFollowers, setMinFollowers] = useState(0);
  const [maxFollowers, setMaxFollowers] = useState(0);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);

  const [leadToDelete, setLeadToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const isLoadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Format current date for display
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Add new state for the add lead modal
  const [showAddLeadModal, setShowAddLeadModal] = useState<
    "nav" | "table" | null
  >(null);
  const [twitterUrl, setTwitterUrl] = useState("");
  const [isAddingLead] = useState(false);

  // Add new state for edit lead modal
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isEditingLead, setIsEditingLead] = useState(false);

  // Add new state for categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryLeadId, setSelectedCategoryLeadId] = useState<
    string | null
  >(null);

  // Add new state for the add lead modal category
  const [addLeadModalCategory, setAddLeadModalCategory] =
    useState<Category | null>(null);

  // Near the top with other state declarations, add this ref
  const leadsRef = useRef<Lead[]>([]);
  // Add a new ref to track lead IDs displayed in this tab
  const displayedLeadIdsRef = useRef<Set<string>>(new Set());

  // New state for categories pie chart data
  const [categoryChartData, setCategoryChartData] = useState<Array<{
    name: string;
    value: number;
    color: string;
  }>>([]);
  const [categoryChartLoading, setCategoryChartLoading] = useState(true);

  // Add new state for videos
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // Add a ref to track newly added lead IDs
  const newlyAddedLeadIdsRef = useRef<Set<string>>(new Set());

  // Add new handler for category creation
  const handleAddCategory = async (name: string, color: string) => {
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, color }),
      });

      if (!response.ok) {
        throw new Error("Failed to create category");
      }

      const { category } = await response.json();

      // Update categories list
      setCategories([...categories, category]);
      toast.success("Category added successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to add category");
    }
  };

  // Add new handler for category deletion
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete category");
      }

      // Update categories list
      setCategories(categories.filter((cat) => cat.id !== categoryId));

      // Update leads that had this category
      setLeads(
        leads.map((lead) =>
          lead.category?.id === categoryId
            ? { ...lead, category: undefined }
            : lead
        )
      );
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  };

  // Add useEffect for handling clicks outside category dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isCategoryButton = target.closest(".category-button");
      const isDropdown = target.closest(".category-dropdown");

      // Check if dropdown is in the middle of an action
      const dropdownElement = document.querySelector('.category-dropdown');
      const isHandlingAction = dropdownElement?.getAttribute('data-handling-action') === 'true';

      // Don't close if we're handling an action
      if (isHandlingAction) {
        return;
      }

      if (!isCategoryButton && !isDropdown && selectedCategoryLeadId !== null) {
        setSelectedCategoryLeadId(null);
      }
    };

    if (selectedCategoryLeadId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedCategoryLeadId]);

  // Fetch main company data
  useEffect(() => {
    const fetchData = async () => {
      if (!isOnline) {
        console.log("Offline - skipping main data fetch");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {

        // Fetch leads directly
        const leadsResponse = await fetch("/api/leads");
        if (!leadsResponse.ok) {
          throw new Error("Failed to fetch leads");
        }
        const leadsData = await leadsResponse.json();
        console.log("Fetched leads data:", leadsData);

        // Store leads in state
        setLeads(leadsData.leads);

        // Fetch categories
        const categoriesResponse = await fetch("/api/categories");
        if (!categoriesResponse.ok) {
          throw new Error("Failed to fetch categories");
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories);


        // Refresh chart data after initial data load
        refreshChartData();
      } catch (error) {
        console.error("Error fetching data:", error);
        // Initialize with empty leads on error
        setLeads([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOnline]);





  // Calculate days left

  // Refresh chart data
  const refreshChartData = async () => {
    if (!isOnline) {
      console.log("Offline - skipping chart data refresh");
      return;
    }

    try {

      // Refresh category chart data
      setCategoryChartLoading(true);
      try {
        console.log("Fetching category chart data...");
        const categoriesResponse = await fetch("/api/chart/categories");
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          console.log("Received category chart data:", categoriesData);
          setCategoryChartData(categoriesData.chartData || []);
        } else {
          console.error(
            "Failed to fetch category data:",
            await categoriesResponse.text()
          );
          throw new Error("Failed to fetch category data");
        }
      } catch (error) {
        console.error("Error fetching category chart data:", error);
        // Fallback to local calculation if API fails
        console.log("Falling back to local category calculation");
        calculateLocalCategoryData();
      }
      setCategoryChartLoading(false);
    } catch (error) {
      console.error("Error refreshing chart data:", error);
    }
  };

  // Fallback method to calculate category data locally
  const calculateLocalCategoryData = () => {
    try {
      console.log(
        "Starting local category data calculation with leads:",
        leads.length
      );

      // Group leads by category
      const categoryCount: Record<
        string,
        { count: number; name: string; color: string }
      > = {};

      // Count leads by category
      leads.forEach((lead) => {
        if (lead.category) {
          const categoryId = lead.category.id;
          if (!categoryCount[categoryId]) {
            categoryCount[categoryId] = {
              count: 0,
              name: lead.category.name,
              color:
                lead.category.color ||
                "#" +
                ((Math.random() * 0xffffff) << 0)
                  .toString(16)
                  .padStart(6, "0"),
            };
          }
          categoryCount[categoryId].count += 1;
        } else {
          // Handle uncategorized leads
          if (!categoryCount["uncategorized"]) {
            categoryCount["uncategorized"] = {
              count: 0,
              name: "Uncategorized",
              color: "#CCCCCC",
            };
          }
          categoryCount["uncategorized"].count += 1;
        }
      });

      // Convert to array format for the chart
      const chartData = Object.keys(categoryCount).map((key) => ({
        name: categoryCount[key].name,
        value: categoryCount[key].count,
        color: categoryCount[key].color,
      }));

      console.log("Calculated local category data:", chartData);
      setCategoryChartData(chartData);
    } catch (error) {
      console.error("Error preparing local category chart data:", error);
      setCategoryChartData([]);
    }
  };


  // Handle lead menu click
  const handleLeadMoreClick = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation();
    setOpenMenuLeadId(openMenuLeadId === leadId ? null : leadId);
  };

  // Add useEffect for handling clicks outside the menu and delete modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Handle menu clicks
      const menuButton = target.closest("#more-button");
      const menuContent = target.closest(".menu-content");
      if (!menuButton && !menuContent) {
        setOpenMenuLeadId(null);
      }

      // Handle delete modal clicks
      const deleteModal = target.closest(".delete-modal");
      if (!deleteModal && showDeleteModal) {
        setShowDeleteModal(false);
        setLeadToDelete(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDeleteModal]); // Add showDeleteModal to dependencies

  // Handle lead edit click
  const handleLeadEditClick = (
    e: React.MouseEvent,
    leadId: string,
    currentTwitterUrl: string
  ) => {
    e.stopPropagation();
    setEditingLeadId(leadId);
    setTwitterUrl(currentTwitterUrl);
    setShowEditLeadModal(true);
    setOpenMenuLeadId(null);
  };

  // Handle lead delete click
  const handleLeadDeleteClick = (
    e: React.MouseEvent,
    leadId: string,
    leadName: string
  ) => {
    e.stopPropagation();
    setLeadToDelete({ id: leadId, name: leadName });
    setShowDeleteModal(true);
    setOpenMenuLeadId(null); // Close the menu when opening delete modal
  };

  // Handle lead delete confirmation
  const handleLeadDeleteConfirm = async () => {
    if (!leadToDelete) return;

    try {
      const response = await fetch(`/api/leads/${leadToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete lead");
      }

      // Refresh leads list
      const leadsResponse = await fetch("/api/leads");
      if (!leadsResponse.ok) {
        throw new Error("Failed to fetch leads");
      }
      const leadsData = await leadsResponse.json();
      setLeads(leadsData.leads);

      // Refresh chart data after deleting a lead
      refreshChartData();

      setShowDeleteModal(false);
      setLeadToDelete(null);
      toast.success("Lead deleted successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete lead");
    }
  };

  // Toggle lead expansion
  const toggleLead = (leadId: string) => {
    setExpandedLead(expandedLead === leadId ? null : leadId);
  };

  // Add leads state
  const [leads, setLeads] = useState<Lead[]>([]);

  // Update handleAddLead function
  const handleAddLead = async (
    leads: { twitterUrl: string; category: Category | null }[]
  ) => {
    if (leads.length === 0) {
      toast.error("Please enter at least one Twitter URL");
      return;
    }

    // Create temporary leads with loading state
    const tempLeads: Lead[] = leads.map((lead) => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      category_id: lead.category?.id || "",
      name: "Loading...",
      twitter_handle: lead.twitterUrl.split("/").pop() || "",
      profile_image_url: "/logo-temp.png",
      follower_count: 0,
      last_post_date: new Date().toISOString(),
      category: lead.category || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Add the temporary leads to the list
    setLeads((prevLeads) => [...tempLeads, ...prevLeads]);

    // Reset form and close modal immediately
    setTwitterUrl("");
    setAddLeadModalCategory(null);
    setShowAddLeadModal(null);

    // Check if we're offline
    if (!isOnline) {
      console.log("Offline mode: Storing leads in localStorage");

      // Store leads in localStorage for processing when back online
      const offlineLeads = JSON.parse(
        localStorage.getItem("offlineLeads") || "[]"
      );

      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        // Add each lead to offline storage
        offlineLeads.push({
          twitter_url: lead.twitterUrl,
          category_id: lead.category?.id,
          timestamp: Date.now(),
          tempId: tempLeads[i].id, // Store temp ID for later reference
        });

        // Temp leads already have "Loading..." so no need to update them
        toast.success(
          `Lead saved offline: ${lead.twitterUrl.split("/").pop()}`
        );
      }

      // Save updated offline leads
      localStorage.setItem("offlineLeads", JSON.stringify(offlineLeads));
      return;
    }

    // Online mode: Process each lead
    let anyLeadSuccessful = false;
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      try {
        console.log("Sending request with data:", {
          twitter_url: lead.twitterUrl,
          category_id: lead.category?.id,
        });

        const response = await fetch("/api/leads/create-with-twitter", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            twitter_url: lead.twitterUrl,
            category_id: lead.category?.id,
          }),
        });

        let data;
        const contentType = response.headers.get("content-type");
        console.log("Response content type:", contentType);
        console.log("Response status:", response.status);

        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
          console.log("Received JSON response:", data);
        } else {
          const text = await response.text();
          console.error("Non-JSON response:", text);
          throw new Error(`Server error: ${text}`);
        }

        if (!response.ok) {
          console.error("Response not OK:", data);
          throw new Error(data.error || "Failed to create lead");
        }

        // Ensure the lead has the correct category
        const updatedLead = {
          ...data.lead,
          category: lead.category || undefined,
        };
        console.log("Updated lead with category:", updatedLead);

        // Add this lead ID to our newly added leads set to prevent duplication from realtime events
        newlyAddedLeadIdsRef.current.add(updatedLead.id);

        // Set a timeout to remove the ID from the set after a few seconds
        setTimeout(() => {
          newlyAddedLeadIdsRef.current.delete(updatedLead.id);
        }, 5000); // 5 seconds should be enough for the realtime event to arrive

        // Update the temporary lead with the real data
        setLeads((prevLeads) =>
          prevLeads.map((l) => (l.id === tempLeads[i].id ? updatedLead : l))
        );

        // Show success toast for each lead
        toast.success(`Added ${data.lead.name}`);
        anyLeadSuccessful = true;
      } catch (error) {
        console.error("Error creating lead:", error);
        // Remove the temporary lead on error
        setLeads((prevLeads) =>
          prevLeads.filter((l) => l.id !== tempLeads[i].id)
        );
        toast.error(
          error instanceof Error ? error.message : "Failed to add lead"
        );
      }
    }

    // If any lead was successfully added, refresh the chart data
    if (anyLeadSuccessful) {
      refreshChartData();
    }
  };

  // Handle lead update
  const handleLeadUpdate = async () => {
    if (!isOnline) {
      toast.error("Cannot update lead while offline");
      return;
    }

    if (!editingLeadId || !twitterUrl) {
      toast.error("Please enter a Twitter URL");
      return;
    }

    // Find the current lead to compare URLs
    const currentLead = leads.find((lead) => lead.id === editingLeadId);
    if (!currentLead) {
      toast.error("Lead not found");
      return;
    }

    // If the URL hasn't changed, just close the modal
    if (twitterUrl === `https://twitter.com/${currentLead.twitter_handle}`) {
      setShowEditLeadModal(false);
      setEditingLeadId(null);
      setTwitterUrl("");
      return;
    }

    setIsEditingLead(true);
    try {
      const response = await fetch(`/api/leads/${editingLeadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ twitter_url: twitterUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update lead");
      }

      // Refresh leads list
      const leadsResponse = await fetch("/api/leads");
      if (!leadsResponse.ok) {
        throw new Error("Failed to fetch leads");
      }
      const leadsData = await leadsResponse.json();
      setLeads(leadsData.leads);

      // Refresh chart data after successfully updating a lead
      refreshChartData();

      // Reset form and close modal
      setTwitterUrl("");
      setShowEditLeadModal(false);
      setEditingLeadId(null);
      toast.success("Lead updated successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update lead"
      );
    } finally {
      setIsEditingLead(false);
    }
  };

  // Update handleAddProfile function
  // const handleAddProfile = async (urls: string[]) => {
  //   if (!selectedLeadId) {
  //     toast.error("No lead selected");
  //     return;
  //   }

  //   setIsAddingProfile(true);
  //   try {
  //     // Process each URL
  //     for (const url of urls) {
  //       const response = await fetch(
  //         `/api/leads/${selectedLeadId}/personal-profiles`,
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ twitter_url: url }),
  //         }
  //       );

  //       const data = await response.json();

  //       if (!response.ok) {
  //         throw new Error(data.error || "Failed to add profile");
  //       }

  //       // Show success toast for each profile
  //       toast.success(`Added profile for ${data.data.personalProfile.name}`);
  //     }

  //     // Refresh leads list after all profiles are added
  //     const leadsResponse = await fetch("/api/leads");
  //     if (!leadsResponse.ok) {
  //       throw new Error("Failed to fetch leads");
  //     }
  //     const leadsData = await leadsResponse.json();
  //     setLeads(leadsData.leads);

  //     // Reset form and close modal
  //     setTwitterUrl("");
  //     setShowAddProfileModal(null);
  //     setSelectedLeadId(null);
  //   } catch (error) {
  //     console.error("Error:", error);
  //     toast.error(
  //       error instanceof Error ? error.message : "Failed to add profile"
  //     );
  //   } finally {
  //     setIsAddingProfile(false);
  //   }
  // };

  // Update handleCategorySelect to refresh the chart when a lead's category changes
  const handleCategorySelect = async (leadId: string, category: Category) => {
    if (!isOnline) {
      toast.error("Cannot update category while offline");
      return;
    }

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category_id: category.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      // Update the lead in the state
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead.id === leadId
            ? { ...lead, category, category_id: category.id }
            : lead
        )
      );

      // Refresh chart data after category update
      refreshChartData();

      toast.success(`Category updated to ${category.name}`);

      // We don't close the dropdown here anymore
      // The user can continue selecting other categories or close it explicitly
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("Failed to update category");
    }
  };

  // Update fetchData to check network status
  const fetchData = async (page: number) => {
    if (!isOnline) {
      console.log("Offline - skipping data fetch for page:", page);
      return { leads: [], pagination: { hasMore: false, totalCount: 0 } };
    }

    try {
      const url = new URL("/api/leads", window.location.origin);
      url.searchParams.append("page", page.toString());

      console.log("Requesting page:", page);
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch leads: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error in fetchData:", error);
      throw error;
    }
  };

  // Update initial data fetch to check network status
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isOnline) {
        console.log("Offline - skipping initial data load");
        setIsLoading(false);
        // Initialize with empty leads when offline
        setLeads([]);
        setHasMore(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await fetchData(0);
        if (data) {
          setLeads(data.leads || []);
          setCurrentPage(0);
          setHasMore(data.pagination?.hasMore || false);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // Initialize with empty leads on error
        setLeads([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [isOnline]);

  // Load more leads
  const loadMoreLeads = async () => {
    if (!isOnline) {
      console.log("Offline - skipping load more leads");
      return;
    }

    if (!hasMore || isLoadingRef.current) {
      console.log(
        "Skipping load, hasMore:",
        hasMore,
        "isLoading:",
        isLoadingRef.current
      );
      return;
    }

    isLoadingRef.current = true;

    try {
      const nextPage = currentPage + 1;
      console.log("Loading next page:", {
        currentPage,
        nextPage,
        currentLeadsCount: leads.length,
      });

      const data = await fetchData(nextPage);

      if (!data.leads.length) {
        console.log("No more leads received");
        setHasMore(false);
        return;
      }

      // Check if we're getting new leads by comparing created_at timestamps
      const lastCurrentLead = leads[leads.length - 1];
      const firstNewLead = data.leads[0];

      console.log("Comparing leads:", {
        lastCurrentLeadTime: lastCurrentLead?.created_at,
        firstNewLeadTime: firstNewLead?.created_at,
        isDifferentData:
          lastCurrentLead?.created_at !== firstNewLead?.created_at,
        currentPage,
        nextPage,
      });

      if (
        lastCurrentLead &&
        firstNewLead &&
        lastCurrentLead.created_at === firstNewLead.created_at
      ) {
        console.log("Received duplicate data, stopping pagination");
        setHasMore(false);
        return;
      }

      // Update state in a single batch to avoid race conditions
      setLeads((prevLeads) => [...prevLeads, ...data.leads]);
      setCurrentPage(nextPage);
      setHasMore(data.pagination.hasMore);

      console.log("Updated state:", {
        newPage: nextPage,
        newLeadsCount: data.leads.length,
        totalLeadsAfterUpdate: leads.length + data.leads.length,
      });
    } catch (error) {
      console.error("Error loading more leads:", error);
      toast.error("Failed to load more leads");
    } finally {
      isLoadingRef.current = false;
    }
  };

  //* Setup intersection observer
  useEffect(() => {
    const target = document.querySelector("#observer-load");
    if (!target) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          hasMore &&
          !isLoadingRef.current &&
          isOnline
        ) {
          console.log("Observer triggered, current page:", currentPage);
          loadMoreLeads();
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0,
      }
    );

    observer.observe(target);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, currentPage, isOnline]);

  // Updated useEffect to process offline leads when coming back online
  useEffect(() => {
    const processOfflineLeads = async () => {
      if (!isOnline) return;

      // Check if we have offline leads
      const offlineLeads = JSON.parse(
        localStorage.getItem("offlineLeads") || "[]"
      );
      if (offlineLeads.length === 0) return;

      console.log(`Found ${offlineLeads.length} offline leads to process`);
      toast.success(`Processing ${offlineLeads.length} offline leads...`);

      // Process each offline lead one by one
      const newOfflineLeads = [...offlineLeads];

      for (let i = 0; i < offlineLeads.length; i++) {
        const offlineLead = offlineLeads[i];

        try {
          console.log("Processing offline lead:", offlineLead);

          // Find the temporary lead if it exists
          const tempLead = leads.find((l) => l.id === offlineLead.tempId);

          // Send API request - exactly the same as in handleAddLead
          const response = await fetch("/api/leads/create-with-twitter", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              twitter_url: offlineLead.twitter_url,
              category_id: offlineLead.category_id,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to sync offline lead");
          }

          const data = await response.json();

          // If we found the temporary lead, update it
          if (tempLead) {
            setLeads((prevLeads) =>
              prevLeads.map((l) =>
                l.id === offlineLead.tempId
                  ? { ...data.lead, category: tempLead.category }
                  : l
              )
            );
          } else {
            // If temp lead is gone, add as new lead
            setLeads((prevLeads) => [data.lead, ...prevLeads]);
          }

          // Remove from offline storage
          newOfflineLeads.splice(newOfflineLeads.indexOf(offlineLead), 1);
          localStorage.setItem("offlineLeads", JSON.stringify(newOfflineLeads));

          toast.success(`Synced: ${data.lead.name}`);
        } catch (error) {
          console.error("Error syncing offline lead:", error);
          toast.error(
            `Failed to sync an offline lead: ${error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Update localStorage with any remaining leads (if some failed)
      localStorage.setItem("offlineLeads", JSON.stringify(newOfflineLeads));

      if (newOfflineLeads.length === 0) {
        toast.success("All offline leads synced successfully!");
      } else {
        toast.error(`${newOfflineLeads.length} leads still need to be synced.`);
      }
    };

    // Process offline leads when we come back online
    let networkChangeTimer: NodeJS.Timeout | null = null;

    if (isOnline) {
      // Use a small delay to ensure network is stable
      networkChangeTimer = setTimeout(() => {
        processOfflineLeads();
      }, 1000);
    }

    return () => {
      if (networkChangeTimer) clearTimeout(networkChangeTimer);
    };
  }, [isOnline, leads]); // Re-run when online status changes

  // Setup realtime subscription for leads
  useEffect(() => {
    if (!isOnline) return;

    // Keep the ref updated with the latest leads
    leadsRef.current = leads;

    // Update displayed leads tracker with current lead IDs
    displayedLeadIdsRef.current = new Set(leads.map(lead => lead.id));

    // Check if we have categories before setting up realtime
    if (!categories || categories.length === 0) {
      console.log("Waiting for categories to be loaded before setting up realtime...");
      return;
    }

    console.log("Setting up realtime subscription for leads");

    // Verify realtime is enabled
    const checkRealtimeEnabled = async () => {
      try {
        // Try to get the realtime settings
        const { error } = await supabase.from('leads').select('id').limit(1);

        if (error) {
          console.error("Error checking realtime access:", error);
          return false;
        }

        console.log("Database connection successful, setting up realtime...");
        return true;
      } catch (err) {
        console.error("Failed to check realtime status:", err);
        return false;
      }
    };

    // Only proceed with subscription if check passes
    checkRealtimeEnabled().then(enabled => {
      if (!enabled) {
        console.warn("Skipping realtime setup due to connection issues");
        return;
      }

      // Create a unique channel name for this browser session
      const channelName = `leads-changes-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      console.log(`Creating unique channel: ${channelName}`);

      // Subscribe to changes in the leads table
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "leads" },
          (payload: any) => {
            console.log("Realtime event received:", payload);

            const eventType = payload.eventType;

            if (eventType === "INSERT") {
              const newLead = payload.new;
              console.log("New lead added:", newLead);

              // First, check if this lead was just added manually in this tab
              const wasManuallyAdded = newlyAddedLeadIdsRef.current.has(newLead.id);
              if (wasManuallyAdded) {
                console.log(
                  "Lead was just manually added in this tab, ignoring realtime event:",
                  newLead.id,
                  newLead.twitter_handle
                );
                return;
              }

              // Then check if it's already displayed in this tab
              const isDisplayedInThisTab = displayedLeadIdsRef.current.has(newLead.id);

              if (!isDisplayedInThisTab) {
                // Add category information if available
                const leadWithCategory = {
                  ...newLead,
                  category: newLead.category_id
                    ? categories.find((cat) => cat.id === newLead.category_id)
                    : undefined,
                } as Lead;

                // Add to the beginning of the leads list
                setLeads((prevLeads) => {
                  // Add the ID to our displayed leads tracker
                  displayedLeadIdsRef.current.add(newLead.id);
                  return [leadWithCategory, ...prevLeads];
                });

                // Show notification
                toast.success(`New lead added: ${newLead.name}`);

                // Refresh chart data if needed
                if (typeof refreshChartData === "function") {
                  refreshChartData();
                }
              } else {
                console.log(
                  "Lead already displayed in this tab, skipping duplicate:",
                  newLead.id,
                  newLead.twitter_handle
                );
              }
            } else if (eventType === "UPDATE") {
              const updatedLead = payload.new;
              console.log("Lead updated:", updatedLead);

              // Update the lead in the list
              setLeads((prevLeads) =>
                prevLeads.map((lead) =>
                  lead.id === updatedLead.id
                    ? ({
                      ...updatedLead,
                      category: categories.find(
                        (cat) => cat.id === updatedLead.category_id
                      ),
                    } as Lead)
                    : lead
                )
              );
            } else if (eventType === "DELETE") {
              const deletedLead = payload.old;
              console.log("Lead deleted:", deletedLead);

              // Remove the lead from the list and from our tracker
              setLeads((prevLeads) => {
                displayedLeadIdsRef.current.delete(deletedLead.id);
                return prevLeads.filter((lead) => lead.id !== deletedLead.id);
              });
            }
          }
        )
        .subscribe((status: string, err?: Error) => {
          console.log("Subscription status:", status);

          // Add error logging
          if (err) {
            console.error("Realtime subscription error:", err);
          } else if (status === 'SUBSCRIBED') {
            console.log("✅ Realtime subscription active - lead changes will be detected");
          } else if (status === 'CHANNEL_ERROR') {
            console.error("Channel error - realtime updates may not work");
          } else if (status === 'TIMED_OUT') {
            console.error("Subscription timed out - realtime updates may not work");
          }
        });

      // Clean up subscription when component unmounts
      return () => {
        console.log("Cleaning up realtime subscription");
        channel.unsubscribe();
      };
    });
  }, [isOnline, categories]);

  // Fetch videos
  useEffect(() => {
    fetchVideos();
  }, [isOnline]);

  // Function to fetch videos (moved out of useEffect for reuse)
  const fetchVideos = async () => {
    if (!isOnline) {
      console.log('Offline - skipping videos fetch');
      setIsLoadingVideos(false);
      return;
    }

    setIsLoadingVideos(true);
    try {
      console.log('Fetching videos...');
      const response = await fetch('/api/videos');
      if (!response.ok) {
        console.error('Failed to fetch videos, status:', response.status);
        if (response.status === 404) {
          // Specific handling for bucket not found
          console.warn('Video bucket not found yet');
        }
        throw new Error(`Failed to fetch videos: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched videos data:', data);

      // Ensure we're getting the updated data with categories
      if (data.videos) {
        console.log('Setting videos state with:', data.videos.length, 'videos');
        console.log('First video example:', data.videos[0]);
      }

      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      // Don't set empty videos array here to preserve any existing data
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Handle newly uploaded video
  const handleVideoUploaded = (video: Video) => {
    setVideos(prevVideos => [video, ...prevVideos]);
    // Also refresh the full list to ensure we have everything
    fetchVideos();
  };

  // Handle followers range change
  const handleFollowersChange = (min: number, max: number) => {
    setMinFollowers(min);
    setMaxFollowers(max);
  };

  // Apply filters to leads
  const applyFilters = () => {
    // Check if there are any active filters
    const hasActiveFilters = filterCategory !== null || minFollowers > 0 || maxFollowers > 0;

    if (!hasActiveFilters) {
      clearFilters();
      return;
    }

    setIsFiltering(true);

    let results = [...leads];

    // Filter by category
    if (filterCategory) {
      results = results.filter(lead => lead.category?.id === filterCategory.id);
    }

    // Filter by followers range
    if (minFollowers > 0) {
      results = results.filter(lead =>
        lead.follower_count !== null &&
        lead.follower_count !== undefined &&
        lead.follower_count >= minFollowers
      );
    }

    if (maxFollowers > 0) {
      results = results.filter(lead =>
        lead.follower_count !== null &&
        lead.follower_count !== undefined &&
        lead.follower_count <= maxFollowers
      );
    }

    setFilteredLeads(results);
    setShowFilterDropdown(false);

    // Show toast with filter results
    toast.success(`Showing ${results.length} filtered leads`);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterCategory(null);
    setMinFollowers(0);
    setMaxFollowers(0);
    setIsFiltering(false);
    setFilteredLeads([]);
    setShowFilterDropdown(false);

    toast.success('Filters cleared');
  };

  // Handle filter button click
  const handleFilterButtonClick = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  // Get the leads to display (filtered or all)
  const getDisplayedLeads = () => {
    return isFiltering ? filteredLeads : leads;
  };

  // Add useEffect for handling clicks outside filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const filterButton = target.closest("#filter-button");
      const filterDropdown = target.closest(".filter-dropdown");

      if (!filterButton && !filterDropdown && showFilterDropdown) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      {showMFAEnrollment && (
        <MFAEnrollment
          onEnrolled={() => {
            setShowMFAEnrollment(false);
            setMfaEnrolled(true);
            toast.success('Two-factor authentication enabled successfully!');
          }}
          onCancelled={() => {
            setShowMFAEnrollment(false);
            toast('You can enable 2FA later from your settings', {
              icon: 'ℹ️',
            });
          }}
        />
      )}

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#252525",
            color: "#fff",
            borderRadius: "8px",
            padding: "12px 24px",
          },
          success: {
            iconTheme: {
              primary: "#4CAF50",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#FF4747",
              secondary: "#fff",
            },
          },
        }}
      />

      {/* Initialize video setup */}
      <VideoSetup />
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>

      {/* User Details Section */}
      <div className="flex flex-col gap-4">
        <h2 className="font-bold text-2xl">Your Account</h2>
        
        {/* User Info */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-[#4F4F4F]">User Details</h3>
            <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>

        {/* JWT Info */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-[#4F4F4F]">JWT Token Contents</h3>
            <pre className="text-xs font-mono p-3 rounded border max-h-64 overflow-auto">
              {JSON.stringify(decodedJwt, null, 2)}
            </pre>
          </div>
        </div>

        {/* Role Info */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-[#4F4F4F]">Your Role</h3>
            <div className="text-xl p-4 bg-accent rounded-md flex items-center gap-2">
              <DashboardIcon className="w-5 h-5" />
              <span className="font-semibold">
                {userRole?.role === 'admin' ? 'Administrator' : userRole?.role || 'Loading...'}
              </span>
              {userRole?.role === 'admin' && 
                <span className="bg-blue-500 text-white px-2 py-1 text-xs uppercase rounded-full ml-2">
                  Full Access
                </span>
              }
            </div>
          </div>
        </div>

        {/* 2FA Status */}
        <div className="bg-white border border-[#EBEBEB] rounded-xl p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-[#4F4F4F]">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${mfaEnrolled ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-[#4F4F4F]">
                  {mfaEnrolled ? 'Enabled' : 'Not Enabled'}
                </span>
              </div>
              {!mfaEnrolled && (
                <button
                  onClick={() => setShowMFAEnrollment(true)}
                  className="px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#1a1a1a] cursor-pointer"
                >
                  Enable 2FA
                </button>
              )}
            </div>
            {!mfaEnrolled && (
              <p className="text-sm text-[#4F4F4F]/60 mt-2">
                Add an extra layer of security to your account by enabling two-factor authentication.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="relative w-full">
        <div className="w-full p-3 flex flex-col items-start gap-10">
          <nav>
            <div className="flex flex-row justify-between items-center rounded-lg bg-[#F7F7F7] py-[5px] pl-2 pr-3 w-fit gap-2">
              <DashboardIcon className="w-3 h-3 text-[#4F4F4F]" />
              <span className="text-[14px] font-regular text-[#4F4F4F]">
                {userRole?.role}
              </span>
            </div>
          </nav>
          <header className="mb-8 w-full">
            <div className="flex flex-row justify-between items-center mb-1">
              <h1 className="text-[26px] font-semibold text-[#4F4F4F] tracking-[-3%]">
                Master List{" "}
                {!isOnline && (
                  <span className="text-[#FF4747] text-lg">• Offline Mode</span>
                )}
              </h1>
              {isOnline && <TestDataGenerator />}
            </div>
            <p className="text-[#4F4F4F]/50 text-xl">{formattedDate}</p>
            <div className="border-t border-gray-200 mt-4"></div>
          </header>
        </div>

        <div className="flex flex-row w-full">
          {/* Stats/Charts Grid */}
          <div
            id="stats-container"
            className="relative w-full px-3 tracking-[-3%] mb-5 flex flex-row gap-[20px]"
          >
            {/* Category Distribution Chart */}
            <div
              id="stats-category-distribution-container"
              className="flex flex-col gap-[15px] p-4 rounded-xl border border-[#EBEBEB] w-full"
            >
              <div className="flex flex-col items-start gap-3 px-3 py-1">
                <div className="flex justify-between items-center w-full">
                  <h2 className="text-[18px] font-medium text-[#4F4F4F] tracking-[-3%] opacity-40">
                    Leads by Category
                  </h2>
                  <button
                    onClick={() => {
                      setCategoryChartLoading(true);
                      refreshChartData();
                    }}
                    className="text-[12px] text-[#4F4F4F]/40 hover:underline flex items-center"
                    disabled={categoryChartLoading}
                  >
                    {categoryChartLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                {categoryChartLoading ? (
                  <div className="flex items-center justify-center w-full py-8">
                    <div className="w-8 h-8 border-4 border-[#5FAF94] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    <CategoryPieChart data={categoryChartData} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Videos section */}
          <div className="relative w-full px-3 tracking-[-3%] mb-5">
            <VideoList 
              videos={videos} 
              onVideoUploaded={handleVideoUploaded}
              isLoading={isLoadingVideos}
              onRefresh={fetchVideos}
            />
          </div>
        </div>

        {/* Leads table */}
        <div
          id="leads-table-container"
          className="relative w-full p-[10px] bg-[#F7F7F7] rounded-xl mt-8"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-[15px] w-full">
              <div
                id="title-container"
                className="flex flex-row justify-between items-center px-3 gap-1"
              >
                <div>
                  <h2 className="text-[18px] font-medium text-[#4F4F4F]">Leads</h2>
                  <p className="text-[16px] opacity-50 text-[#4F4F4F]">
                    Showing {getDisplayedLeads().length} {isFiltering ? 'filtered' : ''} leads
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsLoading(true);
                    fetch("/api/leads")
                      .then(response => response.json())
                      .then(data => {
                        setLeads(data.leads);
                        setIsLoading(false);
                        // Re-apply filters if active
                        if (isFiltering) {
                          applyFilters();
                        }
                        toast.success("Leads refreshed");
                      })
                      .catch(error => {
                        console.error("Error refreshing leads:", error);
                        setIsLoading(false);
                        toast.error("Failed to refresh leads");
                      });
                  }}
                  className="px-3 py-1 text-sm bg-[#252525] text-white rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Refreshing..." : "Refresh Data"}
                </button>
              </div>
              <div
                id="filter-container"
                className="flex flex-row items-center gap-3 relative"
              >
                <button 
                  id="filter-button"
                  onClick={handleFilterButtonClick}
                  className={`flex flex-row gap-[7.5px] px-[20px] h-[45px] rounded-xl w-fit justify-start items-center text-white bg-[#252525] font-medium text-[14px] cursor-pointer [box-shadow:_0px_-14px_24.4px_0px_rgba(0,0,0,0.77)_inset,_0px_0px_0px_1px_rgba(0,0,0,0.86)_inset,_0px_2px_0px_0px_rgba(255,255,255,0.17)_inset] ${isFiltering ? 'ring-2 ring-blue-500' : ''} relative`}
                >
                  <FilterIcon className="mb-[2px] opacity-70 w-[12px] h-[15px]" />
                  <span>Filter</span>
                  {isFiltering && (
                    <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {getDisplayedLeads().length > 0 ? getDisplayedLeads().length : 0}
                    </span>
                  )}
                </button>
                
                <FilterDropdown
                  isOpen={showFilterDropdown}
                  onClose={() => setShowFilterDropdown(false)}
                  categories={categories}
                  selectedCategory={filterCategory}
                  onCategorySelect={setFilterCategory}
                  minFollowers={minFollowers}
                  maxFollowers={maxFollowers}
                  onFollowersChange={handleFollowersChange}
                  onApplyFilters={applyFilters}
                  onClearFilters={clearFilters}
                  className="filter-dropdown"
                />
                
                <div className="flex flex-row justify-end items-center gap-[10px] px-4 h-[45px] rounded-xl w-full bg-white">
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddLeadModal("nav");
                      }}
                      className="flex flex-row p-1 hover:bg-[#d7d7d7] rounded-md justify-center items-center text-[#4F4F4F] font-medium text-[14px] cursor-pointer hover:opacity-80 w-full group"
                    >
                      <AddIcon className="mb-[2px] opacity-60 w-[15px] h-[15px] group-hover:opacity-100 cursor-pointer transition-opacity duration-150" />
                    </button>
                    <AddLeadModal
                      isOpen={showAddLeadModal === "nav"}
                      onClose={() => {
                        setShowAddLeadModal(null);
                        setAddLeadModalCategory(null);
                      }}
                      onSubmit={handleAddLead}
                      twitterUrl={twitterUrl}
                      setTwitterUrl={setTwitterUrl}
                      isAddingLead={isAddingLead}
                      className="-right-[16px] top-full"
                      categories={categories}
                      selectedCategory={addLeadModalCategory}
                      onCategorySelect={setAddLeadModalCategory}
                      onAddCategory={handleAddCategory}
                      onDeleteCategory={handleDeleteCategory}
                    />
                  </div>
                </div>
              </div>
              <div id="leads-table" className="flex flex-col w-full">
                {/* Main table header */}
                <div className="overflow-hidden">
                  <div className="flex items-center px-3 py-2 text-[14px] opacity-50">
                    <div className="flex items-center gap-[9px] w-[150px]">
                      <DataIcon className="w-[15px] h-[15px]" />
                      <span>Category</span>
                    </div>
                    <div className="flex items-center gap-[9px] w-[300px]">
                      <ClientIcon className="w-[15px] h-[15px]" />
                      <span>Lead</span>
                    </div>
                    <div className="flex items-center gap-[9px] w-[200px]">
                      <WorldIcon className="w-[15px] h-[15px]" />
                      <span>Twitter</span>
                    </div>
                    <div className="flex items-center gap-[9px] w-[200px]">
                      <StatusIcon className="w-[15px] h-[15px]" />
                      <span>Followers</span>
                    </div>
                    <div className="flex items-center gap-[9px] w-[200px]">
                      <TimerIcon className="w-[15px] h-[15px]" />
                      <span>Last Post</span>
                    </div>
                  </div>
                </div>

                {/* Lead rows */}
                <div className="leads-table-body">
                  {getDisplayedLeads().map((lead, index) => (
                    <div key={`${lead.id}-${index}`} className="">
                      {/* Main lead row */}
                      <div
                        className={`flex items-center px-3 py-2 cursor-pointer bg-white border border-[#F7F7F7] hover:bg-[#FCFCFC] ${
                          index === 0
                            ? "rounded-t-xl"
                            : index === leads.length - 1
                            ? "rounded-b-xl"
                            : ""
                        }
                        ${expandedLead === lead.id ? "rounded-b-xl" : ""}`}
                        onClick={() => toggleLead(lead.id)}
                      >
                        {/* Category column */}
                        <div
                          className="flex items-center gap-[9px] w-[150px] relative"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategoryLeadId(
                              selectedCategoryLeadId === lead.id ? null : lead.id
                            );
                          }}
                        >
                          {lead.category ? (
                            <div
                              className="px-2 py-1 rounded-lg text-[12px] font-medium cursor-pointer category-button"
                              style={{
                                backgroundColor: `${lead.category.color}`,
                                color: "white",
                              }}
                            >
                              {lead.category.name}
                            </div>
                          ) : (
                            <div className="px-2 py-1 rounded-lg text-[12px] font-medium cursor-pointer category-button text-[#4F4F4F] hover:bg-[#F7F7F7]">
                              Select Category
                            </div>
                          )}
                          {selectedCategoryLeadId === lead.id && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                              }}
                            >
                              <CategoryDropdown
                                categories={categories}
                                selectedCategory={lead.category || null}
                                onSelect={(category) =>
                                  handleCategorySelect(lead.id, category)
                                }
                                onClose={() => setSelectedCategoryLeadId(null)}
                                className="left-0 top-full mt-1"
                                onAddCategory={handleAddCategory}
                                onDeleteCategory={handleDeleteCategory}
                              />
                            </div>
                          )}
                        </div>
                        {/* Lead column */}
                        <div className="flex items-center gap-[9px] w-[300px]">
                          <ProfileImage
                            src={lead.profile_image_url}
                            alt={lead.name}
                            width={21}
                            height={21}
                            className="rounded-[4px]"
                          />
                          <span className="text-[14px]">
                            {lead.name} 
                          </span>
                        </div>

                        {/* Twitter column */}
                        <div className="flex items-center gap-[9px] w-[200px]">
                          <a
                            href={`https://twitter.com/${lead.twitter_handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[14px] text-blue-500 hover:underline"
                          >
                            @{lead.twitter_handle}
                          </a>
                        </div>

                        {/* Followers column */}
                        <div className="flex items-center gap-[9px] w-[200px]">
                          <span className="text-[14px]">
                            {lead.follower_count?.toLocaleString() || 0}
                          </span>
                        </div>

                        {/* Last Post column */}
                        <div className="flex items-center gap-[9px] w-[200px]">
                          <span className="text-[14px]">
                            {lead.last_post_date
                              ? new Date(lead.last_post_date).toLocaleDateString()
                              : "Never"}
                          </span>
                        </div>

                        {/* More button */}
                        <div
                          id="add-personal-profile-button"
                          className="relative ml-auto mr-3"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              
                            }}
                            className="flex flex-row p-1 hover:bg-[#e1e1e1] rounded-md justify-center items-center text-[#4F4F4F] font-medium text-[14px] cursor-pointer hover:opacity-80 w-full group"
                          >
                            <AddIcon className="mb-[2px] opacity-60 w-[15px] h-[15px] group-hover:opacity-100 cursor-pointer transition-opacity duration-150" />
                          </button>
                          {/* <AddPersonalProfileModal
                            isOpen={showAddProfileModal === lead.id}
                            onClose={() => {
                              setShowAddProfileModal(null);
                              setSelectedLeadId(null);
                              setTwitterUrl("");
                            }}
                            onSubmit={handleAddProfile}
                            twitterUrl={twitterUrl}
                            setTwitterUrl={setTwitterUrl}
                            isAddingProfile={isAddingProfile}
                            className="right-0 top-full"
                          /> */}
                        </div>
                        <div className="relative ">
                          <button
                            id="more-button"
                            className="flex items-center gap-[9px] opacity-40 hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                            onClick={(e) => handleLeadMoreClick(e, lead.id)}
                          >
                            <MoreIcon className="w-[15px] h-[15px]" />
                          </button>

                          {/* More menu popup */}
                          {openMenuLeadId === lead.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-[#EBEBEB] rounded-lg shadow-lg min-w-[120px] z-10 menu-content">
                              <button
                                className="flex items-center gap-2 w-full px-3 py-2 text-[14px] text-[#4F4F4F] hover:bg-[#F7F7F7] transition-colors duration-150 cursor-pointer"
                                onClick={(e) =>
                                  handleLeadEditClick(
                                    e,
                                    lead.id,
                                    `https://twitter.com/${lead.twitter_handle}`
                                  )
                                }
                              >
                                <EditIcon className="w-[15px] h-[15px]" />
                                Edit
                              </button>
                              <button
                                className="flex items-center gap-2 w-full px-3 py-2 text-[14px] text-[#FF4747] hover:bg-[#F7F7F7] transition-colors duration-150 cursor-pointer"
                                onClick={(e) =>
                                  handleLeadDeleteClick(e, lead.id, lead.name)
                                }
                              >
                                <TrashIcon className="w-[15px] h-[15px]" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddLeadModal("table");
                      }}
                      className="flex flex-row gap-[7.5px] px-[14px] pt-[14px] pb-[7px] justify-start items-center text-[#4F4F4F] font-medium text-[14px] cursor-pointer hover:opacity-80 w-full"
                    >
                      <AddIcon className="mb-[3px] opacity-70 w-[8px] h-[8px]" />
                      New Lead
                    </button>
                    <AddLeadModal
                      isOpen={showAddLeadModal === "table"}
                      onClose={() => {
                        setShowAddLeadModal(null);
                        setAddLeadModalCategory(null);
                      }}
                      onSubmit={handleAddLead}
                      twitterUrl={twitterUrl}
                      setTwitterUrl={setTwitterUrl}
                      isAddingLead={isAddingLead}
                      className="-left-[10px] top-full"
                      categories={categories}
                      selectedCategory={addLeadModalCategory}
                      onCategorySelect={setAddLeadModalCategory}
                      onAddCategory={handleAddCategory}
                      onDeleteCategory={handleDeleteCategory}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div id="observer-load" className=""></div>
        </div>

        {/* Pagination Controls */}
        {/* ... existing code ... */}

        {/* Update the Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setLeadToDelete(null);
          }}
          onConfirm={handleLeadDeleteConfirm}
          companyName={leadToDelete?.name || ""}
          className="delete-modal"
        />

        {/* Add EditLeadModal */}
        <EditLeadModal
          isOpen={showEditLeadModal}
          onClose={() => {
            setShowEditLeadModal(false);
            setEditingLeadId(null);
            setTwitterUrl("");
          }}
          onSubmit={handleLeadUpdate}
          twitterUrl={twitterUrl}
          setTwitterUrl={setTwitterUrl}
          isEditingLead={isEditingLead}
        />
      </div>
    </div>
  );
}
