import { AddIcon } from "@/components/icons";
import { useEffect, useRef, useState } from "react";
import { Category } from "@/lib/types";
import CategoryDropdown from "./CategoryDropdown";
import { toast } from "react-hot-toast";

interface LeadInput {
  twitterUrl: string;
  category: Category | null;
}

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leads: LeadInput[]) => void;
  twitterUrl: string;
  setTwitterUrl: (url: string) => void;
  isAddingLead: boolean;
  className?: string;
  categories: Category[];
  selectedCategory: Category | null;
  onCategorySelect: (category: Category) => void;
  onAddCategory?: (name: string, color: string) => Promise<void>;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
}

export default function AddLeadModal({
  isOpen,
  onClose,
  onSubmit,
  twitterUrl,
  setTwitterUrl,
  isAddingLead,
  className,
  categories,
  selectedCategory,
  onCategorySelect,
  onAddCategory,
  onDeleteCategory,
}: AddLeadModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<number | null>(null);
  const [leadInputs, setLeadInputs] = useState<LeadInput[]>([{ twitterUrl: "", category: null }]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isCategoryButton = target.closest('.category-button');
      const isDropdown = target.closest('.category-dropdown');
      
      if (!isCategoryButton && !isDropdown && showCategoryDropdown !== null) {
        setShowCategoryDropdown(null);
      }
    };

    if (showCategoryDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  // Function to calculate dropdown position
  const calculateDropdownPosition = (buttonElement: HTMLElement) => {
    const rect = buttonElement.getBoundingClientRect();
    const modalRect = modalRef.current?.getBoundingClientRect();
    if (!modalRect) return;

    setDropdownPosition({
      top: rect.bottom - modalRect.top + 4,
      left: rect.left - modalRect.left
    });
  };

  // Handle textarea input
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urls = e.target.value.split('\n').filter(url => url.trim());
    setLeadInputs(urls.map(url => ({ twitterUrl: url.trim(), category: null })));
  };

  // Handle category selection for a specific lead
  const handleCategorySelectForLead = (index: number, category: Category) => {
    setLeadInputs(prev => prev.map((lead, i) => 
      i === index ? { ...lead, category } : lead
    ));
    setShowCategoryDropdown(null);
  };

  // Handle category button click
  const handleCategoryButtonClick = (index: number, event: React.MouseEvent<HTMLDivElement>) => {
    const button = event.currentTarget;
    if (showCategoryDropdown === index) {
      setShowCategoryDropdown(null);
    } else {
      calculateDropdownPosition(button);
      setShowCategoryDropdown(index);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    const validLeads = leadInputs.filter(lead => lead.twitterUrl.trim());
    if (validLeads.length === 0) {
      toast.error("Please enter at least one Twitter URL");
      return;
    }
    onSubmit(validLeads);
  };

  if (!isOpen) return null;

  return (
    <div className={`absolute ${className} bg-white border border-[#EBEBEB] rounded-lg shadow-lg p-4 mt-4 w-[500px] z-10`} ref={modalRef}>
      <div className="flex flex-col gap-4 w-full">
        <div>
          <label className="block text-sm font-medium text-[#4F4F4F] mb-2">
            Twitter URLs (one per line)
          </label>
          <textarea
            value={leadInputs.map(lead => lead.twitterUrl).join('\n')}
            onChange={handleTextareaChange}
            placeholder="https://twitter.com/username1&#10;https://twitter.com/username2"
            className="w-full px-3 py-2 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto">
          {leadInputs.map((lead, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={lead.twitterUrl}
                  onChange={(e) => {
                    setLeadInputs(prev => prev.map((l, i) => 
                      i === index ? { ...l, twitterUrl: e.target.value } : l
                    ));
                  }}
                  placeholder="https://twitter.com/username"
                  className="w-full px-3 py-2 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="relative">
                <div
                  onClick={(e) => handleCategoryButtonClick(index, e)}
                  className="category-button w-[150px] px-3 py-2 border border-[#EBEBEB] rounded-lg cursor-pointer hover:bg-[#F7F7F7] flex items-center gap-2"
                >
                  {lead.category ? (
                    <>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: lead.category.color }}
                      />
                      <span className="text-[14px]">{lead.category.name}</span>
                    </>
                  ) : (
                    <span className="text-[14px] text-[#4F4F4F]/50">Select Category</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Dropdown at root level */}
        {showCategoryDropdown !== null && (
          <div 
            className="category-dropdown absolute p-4 z-[100] min-w-[200px]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`
            }}
          >
            <CategoryDropdown
              categories={categories}
              selectedCategory={leadInputs[showCategoryDropdown].category}
              onSelect={(category) => handleCategorySelectForLead(showCategoryDropdown, category)}
              onClose={() => setShowCategoryDropdown(null)}
              className=""
              onAddCategory={onAddCategory}
              onDeleteCategory={onDeleteCategory}
            />
          </div>
        )}

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
            onClick={handleSubmit}
            disabled={isAddingLead}
            className="px-4 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#1a1a1a] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingLead ? "Adding..." : "Add Leads"}
          </button>
        </div>
      </div>
    </div>
  );
} 