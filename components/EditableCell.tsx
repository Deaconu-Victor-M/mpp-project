'use client';

import { useState, useEffect, useRef } from 'react';

interface EditableCellProps {
  value: string | number | null;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  isEditing: boolean;
}

export default function EditableCell({
  value,
  onChange,
  type = 'text',
  isEditing
}: EditableCellProps) {
  const [inputValue, setInputValue] = useState(value?.toString() || '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value?.toString() || '');
    setValidationError(null);
  }, [value]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text for easy replacement
      inputRef.current.select();  
    }
  }, [isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Validate as user types
    validateInput(newValue);
  };

  // Validate input based on type
  const validateInput = (input: string): boolean => {
    // Clear previous error
    setValidationError(null);
    
    if (type === 'text') {
      // Text validation: max 100 characters
      if (input.length > 100) {
        setValidationError(`Text too long (${input.length}/100)`);
        return false;
      }
    } else if (type === 'number') {
      // Number validation: must be a valid number if not empty
      if (input !== '' && isNaN(parseFloat(input))) {
        setValidationError('Please enter a valid number');
        return false;
      }
      
      // Number validation: must not be negative
      if (input !== '' && parseFloat(input) < 0) {
        setValidationError('Number cannot be negative');
        return false;
      }
    }
    
    return true;
  };

  const handleBlur = () => {
    // Validate before saving
    if (validateInput(inputValue)) {
      console.log('Saving on blur:', inputValue);
      onChange(inputValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Validate before saving
      if (validateInput(inputValue)) {
        console.log('Saving on Enter:', inputValue);
        onChange(inputValue);
      } else {
        // Don't close the editor if validation fails
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      // Reset to original value and don't save
      setInputValue(value?.toString() || '');
      setValidationError(null);
      inputRef.current?.blur();
    }
  };

  // Format currency values
  const displayValue = () => {
    if (type === 'number' && value !== null && value !== undefined) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(Number(value));
    }
    return value || '';
  };

  // Non-editing mode - show text with a subtle indication it's editable
  if (!isEditing) {
    return (
      <div className="text-sm cursor-text px-2 py-1 rounded">
        {displayValue()}
      </div>
    );
  }

  // Editing mode - show input field
  return (
    <div className="relative">
      <input
        ref={inputRef}
        type={type}
        className={`w-full rounded px-2 py-1 text-sm text-white focus:outline-none ${
          validationError ? 'border border-red-500' : ''
        }`}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        step={type === 'number' ? '0.01' : undefined}
        onClick={(e) => e.stopPropagation()}
      />
      {validationError && (
        <div className="absolute text-xs text-red-500 mt-1">
          {validationError}
        </div>
      )}
    </div>
  );
} 