import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // First, check if bucket already exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      throw bucketsError;
    }

    const videoBucketExists = buckets.some(bucket => bucket.name === 'videos');

    // If bucket doesn't exist, create it
    if (!videoBucketExists) {
      const { data, error } = await supabase
        .storage
        .createBucket('videos', {
          public: true,  // Make videos publicly accessible
          fileSizeLimit: 1024 * 1024 * 100  // 100MB limit
        });

      if (error) {
        throw error;
      }

      return NextResponse.json({ 
        message: 'Videos bucket created successfully', 
        bucketName: 'videos' 
      });
    }

    return NextResponse.json({ 
      message: 'Videos bucket already exists', 
      bucketName: 'videos' 
    });
  } catch (error) {
    console.error('Error setting up videos bucket:', error);
    return NextResponse.json(
      { 
        error: 'Failed to set up videos bucket',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 