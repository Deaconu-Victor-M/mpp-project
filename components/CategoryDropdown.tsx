import { useEffect, useRef, useState } from 'react';
import { Category } from '@/lib/types';
import { TrashIcon } from './icons';
import toast from 'react-hot-toast';

interface CategoryDropdownProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelect: (category: Category) => void;
  onClose: () => void;
  className?: string;
  onAddCategory?: (name: string, color: string) => Promise<void>;
  onDeleteCategory?: (categoryId: string) => Promise<void>;
}

export default function CategoryDropdown({
  categories,
  selectedCategory,
  onSelect,
  onClose,
  className = "",
  onAddCategory,
  onDeleteCategory,
}: CategoryDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#000000');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isHandlingAction, setIsHandlingAction] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isHandlingAction) return;
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isHandlingAction]);

  const handleAddCategory = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newCategoryName.trim() || !onAddCategory) return;
    
    setIsHandlingAction(true);
    setIsAdding(true);
    
    try {
      await onAddCategory(newCategoryName.trim(), newCategoryColor);
      setNewCategoryName('');
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsAdding(false);
      setIsHandlingAction(false);
    }
  };

  const handleDeleteCategory = async (e: React.MouseEvent, categoryId: string, categoryName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onDeleteCategory) return;
    
    setIsHandlingAction(true);
    setIsDeleting(categoryId);
    
    try {
      await onDeleteCategory(categoryId);
      toast.success(`Category "${categoryName}" deleted successfully`);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsDeleting(null);
      setIsHandlingAction(false);
    }
  };

  const handleShowAddForm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAddForm(!showAddForm);
  };

  const handleCategorySelect = (e: React.MouseEvent, category: Category) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsHandlingAction(true);
    onSelect(category);
    
    setTimeout(() => {
      setIsHandlingAction(false);
    }, 100);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'categoryName') {
      setNewCategoryName(value);
    } else if (name === 'categoryColor') {
      setNewCategoryColor(value);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCategoryColor(e.target.value);
  };

  const preventCloseOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const preventClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={dropdownRef}
      className={`category-dropdown absolute bg-white border border-[#EBEBEB] rounded-lg shadow-lg p-4 z-[100] min-w-[250px] max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#EBEBEB] scrollbar-track-transparent ${className} z-[999]`}
      onClick={preventClose}
      onMouseDown={preventClose}
      data-handling-action={isHandlingAction ? "true" : "false"}
    >
      <div className="flex flex-col gap-1">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between group h-[37px]"
            onClick={preventClose}
            onMouseDown={preventClose}
          >
            <button
              onClick={(e) => handleCategorySelect(e, category)}
              onMouseDown={preventClose}
              className={`flex items-center gap-2 flex-1 px-3 py-2 text-[14px] rounded-lg transition-colors duration-150 h-full ${
                selectedCategory?.id === category.id
                  ? 'bg-[#F7F7F7] text-[#4F4F4F]'
                  : 'text-[#4F4F4F] hover:bg-[#F7F7F7]'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.name}
            </button>
            {onDeleteCategory && (
              <button
                onClick={(e) => handleDeleteCategory(e, category.id, category.name)}
                onMouseDown={preventClose}
                disabled={isDeleting === category.id}
                className={`h-full aspect-square flex items-center justify-center p-2 text-[#4F4F4F]/50 hover:text-[#FF4747] group-hover:bg-[#F7F7F7] hover:bg-[#ecebeb] rounded-lg transition-all duration-150 disabled:opacity-50 cursor-pointer ${
                selectedCategory?.id === category.id
                  ? 'bg-[#F7F7F7] text-[#4F4F4F]'
                  : 'text-[#4F4F4F] hover:bg-[#F7F7F7]'
              }`}
                title="Delete category"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        
        {onAddCategory && (
          <div className="relative" onClick={preventClose} onMouseDown={preventClose}>
            {!showAddForm ? (
              <button
                onClick={handleShowAddForm}
                onMouseDown={preventClose}
                className="flex items-center gap-2 w-full px-3 py-2 text-[14px] text-[#4F4F4F] hover:bg-[#F7F7F7] rounded-lg transition-colors duration-150 cursor-pointer"
              >
                <div className="w-3 h-3 rounded-full bg-[#4F4F4F]" />
                Add Category
              </button>
            ) : (
              <div 
                className="p-3 bg-white rounded-lg border border-[#EBEBEB] mt-2"
                onClick={preventCloseOnly} 
                onMouseDown={preventCloseOnly}
              >
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    name="categoryName"
                    value={newCategoryName}
                    onChange={handleInputChange}
                    onClick={preventCloseOnly}
                    onMouseDown={preventCloseOnly}
                    placeholder="Category name"
                    className="w-full px-3 py-2 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      name="categoryColor"
                      value={newCategoryColor}
                      onChange={handleInputChange}
                      onClick={preventCloseOnly}
                      onMouseDown={preventCloseOnly}
                      className="flex-1 px-3 py-2 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[14px]"
                    />
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={handleColorChange}
                      onClick={preventCloseOnly}
                      onMouseDown={preventCloseOnly}
                      className="w-8 h-9 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddCategory}
                      onMouseDown={preventClose}
                      disabled={isAdding || !newCategoryName.trim()}
                      className="flex-1 px-3 py-2 bg-[#252525] text-white rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed text-[14px] cursor-pointer"
                    >
                      {isAdding ? 'Adding...' : 'Add Category'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddForm(false);
                      }}
                      onMouseDown={preventClose}
                      className="px-3 py-2 bg-[#EBEBEB] text-[#4F4F4F] rounded-lg hover:bg-[#e0e0e0] text-[14px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 