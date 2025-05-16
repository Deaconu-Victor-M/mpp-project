'use client';

import React, { useState, useEffect } from 'react';
import VideoUploader from './VideoUploader';
import { Video, Category } from '@/lib/types';
import { TrashIcon } from './icons';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

interface VideoListProps {
  videos: Video[];
  onVideoUploaded: (video: Video) => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const VideoList: React.FC<VideoListProps> = ({ 
  videos, 
  onVideoUploaded, 
  isLoading = false,
  onRefresh
}) => {
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);
  const [editingCategoryVideoId, setEditingCategoryVideoId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [updatingCategoryVideoId, setUpdatingCategoryVideoId] = useState<string | null>(null);

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

        setCategories(data || []);
      } catch (error) {
        console.error('Error in fetchCategories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleDeleteVideo = async (videoId: string) => {
    if (confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      setDeletingVideoId(videoId);
      
      try {
        const response = await fetch(`/api/videos/${videoId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete video');
        }
        
        toast.success('Video deleted successfully');
        
        // Call refresh to update the video list
        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error('Error deleting video:', error);
        toast.error('Failed to delete video');
      } finally {
        setDeletingVideoId(null);
      }
    }
  };

  const handleCategoryClick = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategoryVideoId(videoId === editingCategoryVideoId ? null : videoId);
  };

  const handleChangeCategory = async (videoId: string, categoryId: string | null) => {
    setUpdatingCategoryVideoId(videoId);
    try {
      console.log(`Updating video ${videoId} with category ${categoryId || 'null'}`);
      
      // First check if the video exists
      const { data: video, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching video before update:', fetchError);
        throw new Error('Could not find video to update');
      }
      
      console.log('Current video data:', video);
      
      // Then update the video with the new category
      const { data: updatedVideo, error } = await supabase
        .from('videos')
        .update({ category_id: categoryId })
        .eq('id', videoId)
        .select(`
          *,
          category:categories(*)
        `);

      if (error) {
        console.error('Error response from update:', error);
        throw error;
      }
      
      console.log('Update successful, updated data:', updatedVideo);

      toast.success(categoryId ? 'Category updated successfully' : 'Category removed');
      setEditingCategoryVideoId(null);
      
      // Refresh the videos list
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update category');
    } finally {
      setUpdatingCategoryVideoId(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingCategoryVideoId) {
        const target = e.target as HTMLElement;
        if (!target.closest('.category-dropdown') && !target.closest('.category-label')) {
          setEditingCategoryVideoId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingCategoryVideoId]);

  return (
    <div className="w-full bg-[#F7F7F7] rounded-xl p-4">
      <div className="flex flex-row justify-between items-center px-3 gap-1 mb-4">
        <div>
          <h2 className="text-[18px] font-medium text-[#4F4F4F]">Videos</h2>
          <p className="text-[16px] opacity-50 text-[#4F4F4F]">
            Showing {videos.length} video{videos.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="px-3 py-1 text-sm bg-[#252525] text-white rounded-lg hover:bg-[#1a1a1a] disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>
      
      {/* Video uploader component */}
      <VideoUploader onUploadSuccess={onVideoUploaded} />
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-[#252525] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Video list */}
      {!isLoading && videos.length > 0 ? (
        <div className="space-y-4">
          {videos.map((video) => (
            <div 
              key={video.id} 
              className="bg-white rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-4"
            >
              {/* Video preview */}
              <div className="w-full md:w-1/3 h-48 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                {video.upload_status === 'completed' ? (
                  <video 
                    src={video.url} 
                    className="w-full h-full object-contain" 
                    controls
                  />
                ) : (
                  <div className="text-white">Processing...</div>
                )}
              </div>
              
              {/* Video details */}
              <div className="w-full md:w-2/3 relative">
                <h3 className="text-lg font-medium text-[#4F4F4F] mb-1">{video.title}</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-sm text-gray-500">{formatFileSize(video.filesize)}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{new Date(video.created_at).toLocaleDateString()}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{video.mime_type}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <div className="relative">
                    {video.category ? (
                      <span 
                        onClick={(e) => handleCategoryClick(video.id, e)}
                        className="text-sm px-2 py-0.5 rounded-md text-white cursor-pointer hover:opacity-90 category-label" 
                        style={{ backgroundColor: video.category.color }}
                      >
                        {video.category.name}
                      </span>
                    ) : (
                      <span 
                        onClick={(e) => handleCategoryClick(video.id, e)}
                        className="text-sm px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 cursor-pointer hover:bg-gray-300 category-label"
                      >
                        Select category
                      </span>
                    )}
                    
                    {/* Category dropdown */}
                    {editingCategoryVideoId === video.id && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg z-10 w-48 py-1 category-dropdown">
                        {categories.map((category) => (
                          <div 
                            key={category.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                            onClick={() => handleChangeCategory(video.id, category.id)}
                          >
                            <div 
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span className="text-sm">
                              {category.name}
                            </span>
                            {video.category?.id === category.id && (
                              <span className="ml-auto text-blue-500">✓</span>
                            )}
                          </div>
                        ))}
                        {video.category && (
                          <>
                            <div className="h-px bg-gray-200 my-1"></div>
                            <div 
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center text-[#FF4747]"
                              onClick={() => handleChangeCategory(video.id, null)}
                            >
                              <span className="text-sm">
                                Remove Category
                              </span>
                            </div>
                          </>
                        )}
                        {updatingCategoryVideoId === video.id && (
                          <div className="flex justify-center py-2">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {video.description && (
                  <p className="text-gray-600 mb-2">{video.description}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <a 
                    href={`/api/videos/download?path=${encodeURIComponent(video.filepath)}&filename=${encodeURIComponent(video.filename || 'video.mp4')}`}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Download
                  </a>
                </div>
                
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteVideo(video.id)}
                  disabled={deletingVideoId === video.id}
                  className="absolute top-0 right-0 p-2 text-[#4F4F4F]/50 hover:text-[#FF4747] rounded-full hover:bg-[#f7f7f7] transition-colors"
                  title="Delete video"
                >
                  {deletingVideoId === video.id ? (
                    <div className="w-4 h-4 border-2 border-[#FF4747] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !isLoading && (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-500">No videos uploaded yet.</p>
          <p className="text-gray-500 text-sm mt-1">Upload your first video using the form above.</p>
        </div>
      )}
    </div>
  );
};

export default VideoList;