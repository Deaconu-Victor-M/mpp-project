'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AddIcon } from '@/components/icons';
import { Video, Category } from '@/lib/types';

interface VideoUploaderProps {
  onUploadSuccess: (videoData: Video) => void;
}

interface UploadProgressEvent {
  loaded: number;
  total: number;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }

        console.log('Fetched categories:', data);
        setCategories(data || []);
        
        // No default selection - user must explicitly choose
        // if (data && data.length > 0) {
        //   setSelectedCategoryId(data[0].id);
        // }
      } catch (error) {
        console.error('Error in fetchCategories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Convert processFile to a useCallback function
  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        throw new Error('Please select a video file');
      }
      
      // Get the current selected category ID at the time of upload
      const currentCategoryId = selectedCategoryId;
      console.log('Starting upload with category_id:', currentCategoryId);
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${timestamp}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
      
      // Setup upload with progress tracking
      const options = {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress: UploadProgressEvent) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setUploadProgress(percent);
        }
      };
      
      console.log('Starting upload:', {
        bucket: 'videos',
        path: filePath,
        fileType: file.type,
        fileSize: file.size,
        categoryId: currentCategoryId || 'none'
      });
      
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, file, options);

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful, file data:', data);
      setUploadProgress(100);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      console.log('Generated public URL:', urlData?.publicUrl);

      // Create database entry
      console.log('Creating video with category_id:', currentCategoryId);
      
      // Create the video data object
      const videoInsertData = {
        title: file.name.split('.')[0], // Default title from filename
        description: '', // Empty description by default
        filename: file.name,
        filepath: filePath,
        filesize: file.size,
        mime_type: file.type,
        thumbnail_url: null, // We could generate thumbnails later
        upload_status: 'completed'
      };
      
      // Only add category_id if it exists and is not an empty string
      if (currentCategoryId) {
        Object.assign(videoInsertData, { category_id: currentCategoryId });
      }
      
      console.log('Final video data being inserted:', videoInsertData);
      
      const { data: videoData, error: dbError } = await supabase
        .from('videos')
        .insert([videoInsertData])
        .select();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      // Add category information if we have a category ID
      let videoWithCategory = {
        ...videoData[0],
        url: urlData.publicUrl,
        updated_at: videoData[0].updated_at || new Date().toISOString()
      };
      
      // If we have a category ID but no category object, try to find it in our list
      if (videoWithCategory.category_id && !videoWithCategory.category && categories.length > 0) {
        const category = categories.find(c => c.id === videoWithCategory.category_id);
        if (category) {
          videoWithCategory = {
            ...videoWithCategory,
            category
          };
        }
      }
      
      console.log('Sending video with category to parent:', videoWithCategory);
      onUploadSuccess(videoWithCategory);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [selectedCategoryId, categories, onUploadSuccess]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [selectedCategoryId, processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="w-full mb-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : uploading 
              ? 'border-yellow-400 bg-yellow-50' 
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
        />
        
        {uploading ? (
          <div>
            <div className="mb-2 font-medium">Uploading video...</div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div 
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">{uploadProgress}% complete</div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">Video files only</p>
              
              {/* Category selector */}
              {categories.length > 0 && (
                <div className="mt-4 w-full max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategoryId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log('Category selected:', value);
                      // Only set the category ID if a non-empty value is selected
                      setSelectedCategoryId(value || null);
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <button
                onClick={handleButtonClick}
                className="mt-4 flex flex-row gap-[7.5px] px-[20px] h-[45px] rounded-xl w-fit justify-start items-center text-white bg-[#252525] font-medium text-[14px] cursor-pointer [box-shadow:_0px_-14px_24.4px_0px_rgba(0,0,0,0.77)_inset,_0px_0px_0px_1px_rgba(0,0,0,0.86)_inset,_0px_2px_0px_0px_rgba(255,255,255,0.17)_inset]"
              >
                <AddIcon className="mb-[2px] opacity-70 w-[12px] h-[15px]" />
                Add Video
              </button>
            </div>
          </>
        )}
        
        {uploadError && (
          <div className="mt-4 text-red-500">{uploadError}</div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader; 