import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getProfileImageUrl } from '@/lib/utils';

export async function GET(request: Request) {
  try {
//  Extracts query parameters from the URL
//  page: Which page of results to fetch (defaults to 0)
//  limit: How many items per page (defaults to 20)
//  Calculates the range of items to fetch:
//  Page 0: items 0-19
//  Page 1: items 20-39
//  Page 2: items 40-59
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const startRange = page * limit;
    const endRange = startRange + limit - 1;

    console.log('API Request:', {
      requestedPage: page,
      limit,
      startRange,
      endRange,
      calculatedOffset: page * limit
    });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Gets the total number of leads in the database
    // Used to determine if there are more pages to load
    // head: true means it only gets the count, not the data
    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Count error:', countError);
      return NextResponse.json(
        { error: 'Failed to count leads', details: countError.message },
        { status: 500 }
      );
    }

    console.log('Fetching range:', {
      page,
      startRange,
      endRange,
      limit,
      totalCount: count
    });

    // Get leads with offset-based pagination
    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        *,
        category:categories!leads_category_id_fkey(*)
      `)
      .order('created_at', { ascending: false })
      .range(startRange, endRange);

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads', details: error.message },
        { status: 500 }
      );
    }

    // Log the actual results
    console.log('Query results:', {
      requestedPage: page,
      startRange,
      endRange,
      receivedCount: leads.length,
      firstId: leads[0]?.id,
      lastId: leads[leads.length - 1]?.id,
      firstCreatedAt: leads[0]?.created_at,
      lastCreatedAt: leads[leads.length - 1]?.created_at
    });

    const hasMore = count ? startRange + leads.length < count : false;

    return NextResponse.json({
      leads,
      pagination: {
        page,
        totalCount: count || 0,
        hasMore,
        currentRange: {
          start: startRange,
          end: endRange
        }
      }
    });
  } catch (error) {
    console.error('Error in leads API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch leads', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const body = await request.json();

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert([
        {
          name: body.name,
          twitter_handle: body.twitter_handle,
          profile_image_url: getProfileImageUrl(body.profile_image_url),
          follower_count: body.follower_count,
          last_post_date: body.last_post_date,
        },
      ])
      .select()
      .single();

    if (leadError) {
      throw leadError;
    }

    // If personal profiles are provided, insert them
    // if (body.personal_profiles && body.personal_profiles.length > 0) {
    //   const profilesToInsert = body.personal_profiles.map((profile: any) => ({
    //     lead_id: lead.id,
    //     name: profile.name,
    //     twitter_handle: profile.twitter_handle,
    //     follower_count: profile.follower_count,
    //   }));

    //   const { error: profilesError } = await supabase
    //     .from("lead_personal_profiles")
    //     .insert(profilesToInsert);

    //   if (profilesError) {
    //     throw profilesError;
    //   }
    // }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: 500 }
    );
  }
} 