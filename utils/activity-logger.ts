import { createClient } from "@/utils/supabase/client";

/**
 * Log a user activity
 * @param action The action performed (e.g., "login", "create_lead", "delete_lead")
 * @param objectType Optional - The type of object being acted upon (e.g., "lead", "video")
 * @param objectId Optional - The ID of the object being acted upon
 * @param metadata Optional - Additional data about the action
 */
export async function logUserActivity(
  action: string,
  objectType?: string,
  objectId?: string,
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("Cannot log activity: No authenticated user");
      return false;
    }
    
    // Get IP address and user agent if possible
    let ipAddress = "";
    let userAgent = "";
    
    if (typeof window !== "undefined") {
      userAgent = window.navigator.userAgent;
      // Note: You'll need a separate API to get the IP address reliably
    }
    
    // Insert log entry
    const { error } = await supabase.from("user_activity_logs").insert({
      user_id: user.id,
      action,
      object_type: objectType,
      object_id: objectId,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent
    });
    
    if (error) {
      console.error("Error logging user activity:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to log user activity:", error);
    return false;
  }
}

/**
 * Fetch user activity logs
 * @param limit Number of records to return
 * @param page Page number for pagination
 * @param filter Optional filter criteria
 */
export async function getUserActivityLogs(
  limit = 20,
  page = 1,
  filter: { action?: string; objectType?: string; fromDate?: Date; toDate?: Date } = {}
) {
  try {
    const supabase = createClient();
    
    // Start building the query
    let query = supabase
      .from("user_activity_logs")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Apply filters
    if (filter.action) {
      query = query.eq("action", filter.action);
    }
    
    if (filter.objectType) {
      query = query.eq("object_type", filter.objectType);
    }
    
    if (filter.fromDate) {
      query = query.gte("created_at", filter.fromDate.toISOString());
    }
    
    if (filter.toDate) {
      query = query.lte("created_at", filter.toDate.toISOString());
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    
    // Execute the query with pagination
    const { data, error } = await query
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    // Get the total count with a separate query
    const { count, error: countError } = await supabase
      .from("user_activity_logs")
      .select("*", { count: "exact", head: true });
    
    if (countError) {
      throw countError;
    }
    
    return {
      logs: data,
      totalCount: count || 0,
      currentPage: page,
      totalPages: count ? Math.ceil(count / limit) : 0
    };
  } catch (error) {
    console.error("Error fetching user activity logs:", error);
    throw error;
  }
} 