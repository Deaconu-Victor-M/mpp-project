import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // First get the video to find its filepath
    const { data: video, error: fetchError } = await supabase
      .from("videos")
      .select("filepath")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching video:", fetchError);
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Delete the file from storage
    if (video.filepath) {
      const { error: storageError } = await supabase
        .storage
        .from('videos')
        .remove([video.filepath]);

      if (storageError) {
        console.error("Error deleting video file:", storageError);
        // Continue anyway to delete the database record
      }
    }

    // Then delete the video record
    const { error: deleteError } = await supabase
      .from("videos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting video:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete video" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete video API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    console.log('PATCH request for video ID:', id);
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    // Extract update data from request body
    const updateData = await request.json();
    console.log('Update video request:', { id, updateData });
    
    // Validate the data
    if (!updateData || typeof updateData !== 'object') {
      console.error('Invalid update data format:', updateData);
      return NextResponse.json(
        { error: "Invalid update data" },
        { status: 400 }
      );
    }
    
    // Only allow updating certain fields
    const allowedFields = ['category_id', 'title', 'description'];
    const sanitizedData = Object.entries(updateData)
      .filter(([key]) => allowedFields.includes(key))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    
    console.log('Sanitized update data:', sanitizedData);
    
    if (Object.keys(sanitizedData).length === 0) {
      console.error('No valid fields to update');
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // First check if the video exists
    console.log('Checking if video exists...');
    const { data: existingVideo, error: fetchError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching video before update:", fetchError);
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    console.log('Existing video found:', existingVideo);
    console.log('Attempting to update with:', sanitizedData);

    // Update the video
    const { data: video, error } = await supabase
      .from("videos")
      .update(sanitizedData)
      .eq("id", id)
      .select(`
        *,
        category:categories(*)
      `)
      .single();

    if (error) {
      console.error("Error updating video:", error);
      return NextResponse.json(
        { error: `Failed to update video: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Update successful, returning video:', video);
    return NextResponse.json({ video });
  } catch (error) {
    console.error("Error in PATCH video:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 