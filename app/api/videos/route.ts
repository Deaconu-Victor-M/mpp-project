import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a standard Supabase client (non-SSR version)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // First, ensure the bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    // If there's an error, log it
    if (bucketError) {
      console.error('Error checking buckets:', bucketError);
    } else {
        // check if "videos" is in the buckets array
      const videoBucketExists = buckets?.some(bucket => bucket.name === 'videos') || false;
      
      if (!videoBucketExists) {
        console.warn('Videos bucket not found. Please create it manually in the Supabase dashboard.');
        return NextResponse.json({ 
          error: 'Videos bucket not found. Please create it in the Supabase dashboard.',
          videos: []
        }, { status: 404 });
      } else {
        console.log('Videos bucket exists, fetching data');
      }
    }

    // Fetch videos from the database
    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        *,
        category:categories(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Add public URLs to each video
    const videosWithUrls = await Promise.all(
      videos.map(async (video) => {
        const { data: urlData } = supabase.storage
          .from('videos')
          .getPublicUrl(video.filepath);

        return {
          ...video,
          url: urlData.publicUrl
        };
      })
    );

    return NextResponse.json({ videos: videosWithUrls });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
} 