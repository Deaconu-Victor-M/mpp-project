import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getUserActivityLogs, logUserActivity } from "@/utils/activity-logger";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const action = searchParams.get("action") || undefined;
    const objectType = searchParams.get("objectType") || undefined;
    const fromDateStr = searchParams.get("fromDate");
    const toDateStr = searchParams.get("toDate");
    
    // Parse dates if provided
    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined;
    const toDate = toDateStr ? new Date(toDateStr) : undefined;
    
    // Get logs
    const logs = await getUserActivityLogs(limit, page, {
      action: action as string | undefined,
      objectType: objectType as string | undefined,
      fromDate,
      toDate
    });
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching user logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch user logs" },
      { status: 500 }
    );
  }
}

// Endpoint to manually create a log entry
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { action, objectType, objectId, metadata } = body;
    
    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }
    
    // Log the activity
    const success = await logUserActivity(
      action,
      objectType,
      objectId,
      metadata
    );
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to create log entry" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating log entry:", error);
    return NextResponse.json(
      { error: "Failed to create log entry" },
      { status: 500 }
    );
  }
} 