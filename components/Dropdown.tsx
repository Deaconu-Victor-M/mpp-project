'use client';

import { useEffect, useState, useRef } from 'react';

interface DropdownOption {
  id: string;
  name: string;
}

interface DropdownProps {
  value: string | null;
  options: DropdownOption[];
  onChange: (id: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  isEditing?: boolean;
}

export default function Dropdown({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  isEditing = false
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Validate value on mount and when options change
  useEffect(() => {
    validateValue();
  }, [value, options]);

  // Validate that the current value exists in options
  const validateValue = () => {
    if (value === null) return true;
    
    const optionExists = options.some(opt => opt.id === value);
    if (!optionExists && options.length > 0) {
      setValidationError('Selected option is invalid');
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  // Get the display name for the current value
  const getSelectedOptionName = () => {
    if (!value) return '';
    const option = options.find(opt => opt.id === value);
    return option ? option.name : validationError ? 'Invalid Selection' : '';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // If not in editing mode, just show the text
  if (!isEditing) {
    return (
      <div className="text-sm">
        {getSelectedOptionName()}
      </div>
    );
  }

  // Handle option selection
  const handleOptionClick = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation(); // Prevent event bubbling
    e.preventDefault(); // Prevent default behavior
    
    // Validate the selection
    const option = options.find(opt => opt.id === optionId);
    if (!option) {
      setValidationError('Selected option is invalid');
      return;
    }
    
    // Clear any validation errors
    setValidationError(null);
    
    // Notify parent
    onChange(optionId);
    
    // Close dropdown
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`border rounded px-2 py-1 text-sm cursor-pointer ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        } ${validationError ? 'border-red-500' : 'border-gray-600'}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
      >
        {getSelectedOptionName() || placeholder}
      </div>

      {validationError && (
        <div className="absolute text-xs text-red-500 mt-1">
          {validationError}
        </div>
      )}

      {isOpen && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-2 py-1 text-sm text-gray-400">No options available</div>
          ) : (
            options.map((option) => (
              <div
                key={option.id}
                className={`px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 ${
                  value === option.id ? 'bg-blue-700' : ''
                }`}
                onClick={(e) => handleOptionClick(e, option.id)}
              >
                {option.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
} 