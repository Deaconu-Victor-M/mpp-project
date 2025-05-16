'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const VideoSetup = () => {
  const [setupStatus, setSetupStatus] = useState<'pending' | 'complete' | 'error'>('pending');
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);

  useEffect(() => {
    // Add a small delay to ensure Supabase is fully loaded
    const timer = setTimeout(() => {
      checkStorage();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const checkStorage = async () => {
    try {
      console.log('Checking video storage setup...');
      
      // Force bucket list refresh by adding timestamp
      const timestamp = new Date().getTime();
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error checking for buckets:', bucketsError);
        setSetupStatus('error');
        return;
      }
      
      console.log('Available buckets:', buckets);
      const videoBucketExists = buckets?.some(bucket => bucket.name === 'videos') || false;
      setBucketExists(videoBucketExists);
      
      if (!videoBucketExists) {
        console.warn(
          'Videos bucket not found! Please create a bucket named "videos" in your Supabase dashboard.'
        );
        setSetupStatus('error');
      } else {
        console.log('Videos bucket exists and is ready to use');
        setSetupStatus('complete');
      }
    } catch (error) {
      console.error('Unexpected error during storage setup:', error);
      setSetupStatus('error');
    }
  };

  // Allow manual refresh if needed
  const handleRefresh = () => {
    setSetupStatus('pending');
    setBucketExists(null);
    checkStorage();
  };

  // Show a warning if bucket doesn't exist and we've finished checking
  if (bucketExists === false) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold">Storage Setup Required</p>
            <p>Please create a bucket named "videos" in your Supabase dashboard</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, render nothing
  return null;
};

export default VideoSetup; 