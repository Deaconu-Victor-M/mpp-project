import { NextResponse } from "next/server";

// Define the UserRole interface to match the database structure
interface UserRole {
  id?: number;
  user_id: string;
  role: 'admin' | 'user';
  role_str?: string;
  created_at?: string;
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  // Extract and store ID early so it's available in all scopes
  let userId = '';
  try {
    const params = await props.params;
    userId = params.id;
    
    console.log("API: Fetching user role for ID:", userId);
    
    try {
      // Use service role to bypass RLS policies
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=*&limit=1`,
        {
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error("API: Direct fetch error:", response.status, response.statusText);
        return NextResponse.json(
          { role: { user_id: userId, role: "user" } },
          { status: 200 }
        );
      }

      // Parse response data
      const data = await response.json();
      console.log("API: Raw database response:", data);
      
      let userRole: UserRole | null = null;
      
      // Check if we got any results
      if (data && data.length > 0) {
        const roleData = data[0];
        userRole = {
          id: roleData.id,
          user_id: roleData.user_id,
          role: roleData.role_str || roleData.role,
          created_at: roleData.created_at
        };
        console.log("API: Found user role:", userRole);
      }

      // Return default role if nothing was found
      if (!userRole) {
        console.log("API: No user role found, using default 'user' role");
        return NextResponse.json(
          { role: { user_id: userId, role: "user" } },
          { status: 200 }
        );
      }

      return NextResponse.json({ role: userRole });
    } catch (dbError) {
      // Catch any unexpected database errors
      console.error("API: Unexpected database error:", dbError);
      
      // Return a default role instead of failing
      return NextResponse.json(
        { role: { user_id: userId, role: "user" } },
        { status: 200 }
      );
    }
  } catch (error) {
    // Catch any unexpected errors in the API
    console.error("API: Error in user_roles API:", error);
    
    // Make sure we always return a response, even in error cases
    return NextResponse.json(
      { 
        error: "Failed to fetch user role",
        details: error instanceof Error ? error.message : String(error),
        role: { user_id: userId, role: "user" } 
      },
      { status: 200 } // Return 200 with error details and default role
    );
  }
}

