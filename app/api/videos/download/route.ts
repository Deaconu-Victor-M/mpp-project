import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get path and filename from URL parameters
    const searchParams = request.nextUrl.searchParams;
    const filePath = searchParams.get('path');
    const fileName = searchParams.get('filename') || 'video.mp4';
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }
    
    // Get file data from Supabase Storage
    const { data, error } = await supabase.storage
      .from('videos')
      .download(filePath);
      
    if (error || !data) {
      console.error('Error downloading file from storage:', error);
      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      );
    }
    
    // Read the file as array buffer
    const arrayBuffer = await data.arrayBuffer();
    
    // Create response with the file data
    const response = new NextResponse(arrayBuffer);
    
    // Set appropriate headers
    response.headers.set('Content-Type', data.type);
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    response.headers.set('Content-Length', data.size.toString());
    
    return response;
  } catch (error) {
    console.error('Error in download API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 