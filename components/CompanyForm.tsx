import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface CompanyFormProps {
  isEdit: boolean;
  initialData?: {
    id?: string;
    name: string;
    website_url: string;
    logo_url: string;
  };
  onClose: () => void;
  onSubmit: (companyData: any) => Promise<void>;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ 
  isEdit, 
  initialData = { name: '', website_url: '', logo_url: '' },
  onClose, 
  onSubmit 
}) => {
  const [company, setCompany] = useState(initialData);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const imageUrl = URL.createObjectURL(file);
      setCompany(prev => ({ ...prev, logo_url: imageUrl }));
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setCompany(prev => ({ ...prev, logo_url: imageUrl }));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Add validation here
      if (!company.name || !company.website_url) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      await onSubmit(company);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(isEdit ? 'Failed to update company' : 'Failed to add company');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div ref={formRef} className="absolute top-full mt-4 ml-[-10px] max-w-[600px] left-0 w-full bg-white border border-[#EBEBEB] rounded-xl p-4 mb-4 z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#4F4F4F] hover:opacity-70 cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="flex gap-4">
          {/* Image upload area */}
          <div 
            className={`w-[151px] h-[151px] flex flex-col items-center justify-center bg-[#F7F7F7] border-2 border-dashed border-[#EBEBEB] rounded-lg cursor-pointer ${dragActive ? 'border-gray-400' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                alt="Company logo"
                width={151}
                height={151}
                className="rounded-lg object-cover"
              />
            ) : (
              <>
                <Image
                  src="/placeholder.png"
                  alt="Placeholder"
                  width={64}
                  height={64}
                />
                <span className="mt-2 text-[14px] font-medium text-gray-500">add logo</span>
              </>
            )}
          </div>

          {/* Form fields */}
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#4F4F4F]">Name</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany(prev => ({ ...prev, name: e.target.value }))}
                className="px-4 py-2 border border-[#EBEBEB] bg-[#F7F7F7] rounded-lg text-[14px]"
                placeholder="Enter company name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-[#4F4F4F]">X/Twitter Link</label>
              <input
                type="text"
                value={company.website_url}
                onChange={(e) => setCompany(prev => ({ ...prev, website_url: e.target.value }))}
                className="px-4 py-2 border border-[#EBEBEB] bg-[#F7F7F7] rounded-lg text-[14px]"
                placeholder="https://x.com/john_doe"
              />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#252525] text-white rounded-lg text-[14px] font-medium w-full hover:bg-[#1a1a1a] [box-shadow:_0px_-14px_24.4px_0px_rgba(0,0,0,0.77)_inset,_0px_0px_0px_1px_rgba(0,0,0,0.86)_inset,_0px_2px_0px_0px_rgba(255,255,255,0.17)_inset]"
          >
            {isSubmitting 
              ? 'Processing...' 
              : isEdit 
                ? 'Save Changes' 
                : 'Add Company'}
          </button>
        </div>
      </div>
  );
};

export default CompanyForm; 