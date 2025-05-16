import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEFAULT_PROFILE_IMAGE } from '@/lib/utils';

// Add export configuration for Next.js App Router
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set max duration to 300 seconds for Pro tier

// IMPORTANT: Set to true to bypass Apify and use mock data
// Currently set to true due to Apify rate limiting

export async function POST(request: Request) {
  try {
    // Get cookies for server component
    const cookieStore = await cookies();
    
    // Initialize Supabase client with server component
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

    // Parse request body
    const body = await request.json();
    console.log("Received request body:", body);
    const { twitter_url, category_id } = body;

    if (!twitter_url) {
      return NextResponse.json(
        { error: "Twitter URL is required" },
        { status: 400 }
      );
    }

    // Extract username from URLs (works with twitter.com and x.com)
    let username = twitter_url.split('/').pop()?.replace('@', '') || '';
    
    // Remove any query parameters if present
    if (username.includes('?')) {
      username = username.split('?')[0];
    }
    
    if (!username) {
      return NextResponse.json(
        { error: "Invalid Twitter URL" },
        { status: 400 }
      );
    }

    console.log("Extracted username:", username);

    // Get the default category
    const { data: categories, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .limit(1);

    if (categoryError || !categories || categories.length === 0) {
      console.error("Error fetching categories:", categoryError);
      return NextResponse.json(
        { error: "No categories found" },
        { status: 500 }
      );
    }

    const defaultCategoryId = categories[0].id;

    // Use mock data when specified or for a specific user
    // Due to Apify rate limiting, we're always using mock data for now
    if (true) { // Always use mock data (previously: USE_MOCK_DATA || username.toLowerCase() === "deaconu_victor")
      console.log("Using mock data for user:", username);
      
      // Create a lead based on our mock data
      const mockLeadData = {
        name: `Mock User (${username})`,
        twitter_handle: username,
        profile_image_url: DEFAULT_PROFILE_IMAGE, // Use the default profile image
        follower_count: Math.floor(Math.random() * 1000000),
        last_post_date: new Date().toISOString(),
        category_id: category_id || defaultCategoryId,
        is_verified: false,
        is_blue_verified: false,
      };
      
      console.log("Inserting mock lead:", mockLeadData);
      
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert([mockLeadData])
        .select()
        .single();
        
      if (leadError) {
        console.error("Error creating lead:", leadError);
        return NextResponse.json(
          { error: leadError.message || "Failed to create lead" },
          { status: 500 }
        );
      }
      
      console.log("Successfully created lead:", lead);
      return NextResponse.json({ lead });
    }
    
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create lead" },
      { status: 500 }
    );
  }
} 