'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import StatusTag from './StatusTag';
import Dropdown from './Dropdown';
import EditableCell from './EditableCell';
import { SalesRecordWithJoins } from '@/lib/types';
import toast from 'react-hot-toast';

interface SalesTableProps {
  records: SalesRecordWithJoins[];
  lookups: {
    chat_locations: { id: string; name: string }[];
    sale_statuses: { id: string; name: string }[];
    lead_sources: { id: string; name: string }[];
    designers: { id: string; name: string }[];
  };
  onAddRecord: () => void;
  onUpdateRecord: (record: SalesRecordWithJoins) => void;
  onDeleteRecords?: (deletedIds: string[]) => void;
}

interface EditingCell {
  recordId: string;
  field: string;
}

export default function SalesTable({
  records,
  lookups,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecords
}: SalesTableProps) {
  // Just track which cell is being edited
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  // Track selected rows by ID
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  // Ref for the table container to attach keyboard events
  const tableRef = useRef<HTMLDivElement>(null);
  // Ref for the delete button container (for portal rendering)
  const [deleteButtonContainer, setDeleteButtonContainer] = useState<HTMLElement | null>(null);

  // Find the delete button container on mount
  useEffect(() => {
    const container = document.getElementById('delete-button-container');
    if (container) {
      setDeleteButtonContainer(container);
    }
  }, []);

  // Set up keyboard listener for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected rows when backspace/delete is pressed
      if ((e.key === 'Backspace' || e.key === 'Delete') && selectedRows.length > 0) {
        e.preventDefault();
        deleteSelectedRows();
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedRows]);

  // Toggle row selection
  const toggleRowSelection = (recordId: string) => {
    setSelectedRows(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  // Delete all selected rows
  const deleteSelectedRows = async () => {
    // Confirm deletion
    if (selectedRows.length > 0) {
      const message = selectedRows.length === 1 
        ? 'Are you sure you want to delete this record?' 
        : `Are you sure you want to delete these ${selectedRows.length} records?`;
      
      if (window.confirm(message)) {
        try {
          // Delete all selected rows in parallel
          await Promise.all(selectedRows.map(async (recordId) => {
            const response = await fetch(`/api/sales/${recordId}`, {
              method: 'DELETE'
            });
            
            if (!response.ok) {
              throw new Error(`Failed to delete record ${recordId}`);
            }
          }));
          
          // Show success toast notification
          const successMessage = selectedRows.length === 1
            ? 'Record deleted successfully'
            : `${selectedRows.length} records deleted successfully`;
          toast.success(successMessage);
          
          // Store the deleted IDs to pass to callback
          const deletedIds = [...selectedRows];
          
          // Clear selection after successful deletion
          setSelectedRows([]);
          
          // Call the onDeleteRecords callback if provided instead of reloading
          if (onDeleteRecords) {
            onDeleteRecords(deletedIds);
          }
        } catch (error) {
          console.error('Error deleting records:', error);
          toast.error('Failed to delete one or more records');
        }
      }
    }
  };

  // Render the delete button
  const renderDeleteButton = () => {
    if (!selectedRows.length) return null;
    
    return (
      <button
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm shadow-sm"
        onClick={deleteSelectedRows}
      >
        Delete {selectedRows.length} {selectedRows.length === 1 ? 'row' : 'rows'}
      </button>
    );
  };

  // Start editing a specific cell
  const handleCellClick = (recordId: string, field: string) => {
    setEditingCell({ recordId, field });
  };

  // Check if a specific cell is being edited
  const isCellEditing = (recordId: string, field: string) => {
    return editingCell?.recordId === recordId && editingCell?.field === field;
  };

  // Handle text cell changes (client, product)
  const handleTextCellChange = (recordId: string, field: keyof SalesRecordWithJoins, value: string) => {
    // Find the record to update
    const recordToUpdate = records.find(r => r.id === recordId);
    if (!recordToUpdate) return;
    
    // Validate: text must be under 100 characters
    if (value.length > 100) {
      alert(`Text must be under 100 characters (currently ${value.length})`);
      return;
    }
    
    // Create a deep copy with the updated field
    const updatedRecord = { 
      ...recordToUpdate,
      [field]: value 
    };
    
    // Call the parent update function
    onUpdateRecord(updatedRecord);
    
    // Exit edit mode
    setEditingCell(null);
  };
  
  // Handle number cell changes (deal value, payout, earnings)
  const handleNumberCellChange = (recordId: string, field: keyof SalesRecordWithJoins, value: string) => {
    // Find the record to update
    const recordToUpdate = records.find(r => r.id === recordId);
    if (!recordToUpdate) return;
    
    // Validate: must be a valid number or empty
    if (value !== '' && isNaN(parseFloat(value))) {
      alert('Please enter a valid number');
      return;
    }
    
    // Validate: number must not be negative 
    if (value !== '' && parseFloat(value) < 0) {
      alert('Value cannot be negative');
      return;
    }
    
    // Parse the new value to a float or null
    const parsedValue = value === '' ? null : parseFloat(value);
    
    // Create a deep copy with the updated field
    const updatedRecord = { 
      ...recordToUpdate,
      [field]: parsedValue 
    };
    
    // If updating deal value or payout, automatically calculate earnings
    if (field === 'est_deal_value' || field === 'est_payout') {
      const dealValue = field === 'est_deal_value' ? parsedValue : recordToUpdate.est_deal_value;
      const payout = field === 'est_payout' ? parsedValue : recordToUpdate.est_payout;
      
      // Calculate earnings if both values are available
      if (dealValue !== null && payout !== null) {
        updatedRecord.est_earnings = dealValue - payout;
      } else {
        updatedRecord.est_earnings = null;
      }
    }
    
    // Call the parent update function
    onUpdateRecord(updatedRecord);
    
    // Exit edit mode
    setEditingCell(null);
  };
  
  // Handle dropdown changes
  const handleDropdownChange = (recordId: string, field: keyof SalesRecordWithJoins, value: string | null) => {
    // Find the record to update
    const recordToUpdate = records.find(r => r.id === recordId);
    if (!recordToUpdate) return;
    
    // Validate: value must exist in options
    if (value !== null) {
      // Get the appropriate options array based on the field
      let options: { id: string; name: string }[] = [];
      if (field === 'chat_location_id') options = lookups.chat_locations;
      else if (field === 'sale_status_id') options = lookups.sale_statuses;
      else if (field === 'lead_source_id') options = lookups.lead_sources;
      else if (field === 'designer_id') options = lookups.designers;
      
      // Check if the value exists in the options
      const optionExists = options.some(option => option.id === value);
      if (!optionExists) {
        alert('Selected option is not valid');
        return;
      }
    }
    
    // Create a deep copy with the updated field
    const updatedRecord = { 
      ...recordToUpdate,
      [field]: value 
    };
    
    // Call the parent update function
    onUpdateRecord(updatedRecord);
    
    // Exit edit mode
    setEditingCell(null);
  };

  // Format currency values
  const formatCurrency = (value: number | null) => {
    if (value === null) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="overflow-visible" ref={tableRef}>
      {/* Render delete button in the portal */}
      {deleteButtonContainer && createPortal(
        renderDeleteButton(),
        deleteButtonContainer
      )}
      
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-medium">
            <th className="px-3 text-gray-500">Select</th>
            <th className="px-3 text-gray-500">Client</th>
            <th className="px-3 text-gray-500">Chat Location</th>
            <th className="px-3 text-gray-500">Sale Status</th>
            <th className="px-3 text-gray-500">Lead Source</th>
            <th className="px-3 text-gray-500">Designer</th>
            <th className="px-3 text-gray-500">Product</th>
            <th className="px-3 text-gray-500">Est. Deal Value</th>
            <th className="px-3 text-gray-500">Est. Pay-out</th>
            <th className="px-3 text-gray-500">Est. Earnings</th>
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr 
              key={record.id} 
              className={`border border-gray-200 hover:bg-gray-50 ${
                selectedRows.includes(record.id) ? 'bg-blue-50' : ''
              }`}
            >
              <td className="py-[3px] px-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedRows.includes(record.id)}
                  onChange={() => toggleRowSelection(record.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td 
                className="py-[3px] px-3" 
                onClick={() => handleCellClick(record.id, 'client')}
              >
                <EditableCell
                  value={record.client}
                  onChange={(value) => handleTextCellChange(record.id, 'client', value)}
                  isEditing={isCellEditing(record.id, 'client')}
                />
              </td>
              <td 
                className="py-[3px] px-3"
                onClick={() => handleCellClick(record.id, 'chat_location_id')}
              >
                <Dropdown
                  value={record.chat_location_id}
                  options={lookups.chat_locations}
                  onChange={(id) => handleDropdownChange(record.id, 'chat_location_id', id)}
                  isEditing={isCellEditing(record.id, 'chat_location_id')}
                />
              </td>
              <td 
                className="py-[3px] px-3"
                onClick={() => handleCellClick(record.id, 'sale_status_id')}
              >
                {isCellEditing(record.id, 'sale_status_id') ? (
                  <Dropdown
                    value={record.sale_status_id}
                    options={lookups.sale_statuses}
                    onChange={(id) => handleDropdownChange(record.id, 'sale_status_id', id)}
                    isEditing={true}
                  />
                ) : (
                  <div>
                    {record.sale_status && (
                      <StatusTag status={record.sale_status.name} />
                    )}
                  </div>
                )}
              </td>
              <td 
                className="py-[3px] px-3"
                onClick={() => handleCellClick(record.id, 'lead_source_id')}
              >
                <Dropdown
                  value={record.lead_source_id}
                  options={lookups.lead_sources}
                  onChange={(id) => handleDropdownChange(record.id, 'lead_source_id', id)}
                  isEditing={isCellEditing(record.id, 'lead_source_id')}
                />
              </td>
              <td 
                className="py-[3px] px-3"
                onClick={() => handleCellClick(record.id, 'designer_id')}
              >
                <Dropdown
                  value={record.designer_id}
                  options={lookups.designers}
                  onChange={(id) => handleDropdownChange(record.id, 'designer_id', id)}
                  isEditing={isCellEditing(record.id, 'designer_id')}
                />
              </td>
              <td 
                className="py-[3px] px-3"
                onClick={() => handleCellClick(record.id, 'product')}
              >
                <EditableCell
                  value={record.product}
                  onChange={(value) => handleTextCellChange(record.id, 'product', value)}
                  isEditing={isCellEditing(record.id, 'product')}
                />
              </td>
              <td 
                className="py-[3px] px-3"
                onClick={() => handleCellClick(record.id, 'est_deal_value')}
              >
                <EditableCell
                  value={record.est_deal_value}
                  onChange={(value) => handleNumberCellChange(record.id, 'est_deal_value', value)}
                  type="number"
                  isEditing={isCellEditing(record.id, 'est_deal_value')}
                />
              </td>
              <td 
                className="py-[3px] px-3"
                onClick={() => handleCellClick(record.id, 'est_payout')}
              >
                <EditableCell
                  value={record.est_payout}
                  onChange={(value) => handleNumberCellChange(record.id, 'est_payout', value)}
                  type="number"
                  isEditing={isCellEditing(record.id, 'est_payout')}
                />
              </td>
              <td className="py-[3px] px-3">
                <div className="text-sm px-2 py-1 rounded bg-gray-100">
                  {formatCurrency(record.est_earnings)}
                </div>
              </td>
            </tr>
          ))}
          {/* Add new record row */}
          <tr 
            className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
            onClick={onAddRecord}
          >
            <td className="py-[3px] px-3">
              {/* No checkbox for the "Add New" row */}
            </td>
            <td colSpan={9} className="py-[3px] px-3 text-sm text-gray-500">
              + New Client
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 