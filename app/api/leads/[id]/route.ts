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

    // First delete all personal profiles associated with the lead

    // Then delete the lead
    const { error: leadError } = await supabase
      .from("leads")
      .delete()
      .eq("id", id);

    if (leadError) {
      throw leadError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
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
    
    console.log(`PATCH request received for lead ID: ${id}`);
    
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

    let requestBody;
    try {
      requestBody = await request.json();
      console.log(`Request body:`, requestBody);
    } catch (e) {
      console.error('Error parsing request body:', e);
      return NextResponse.json(
        { error: 'Invalid request body', details: String(e) },
        { status: 400 }
      );
    }
    
    const { category_id } = requestBody;
    console.log(`Updating lead with category_id: ${category_id}`);
    
    // Verify the category exists first
    if (category_id) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id')
          .eq('id', category_id)
          .single();
          
        if (error) {
          console.error('Category check error:', error);
          return NextResponse.json(
            { error: 'Category not found', details: error.message },
            { status: 400 }
          );
        }
        
        console.log('Category found:', data);
      } catch (e) {
        console.error('Error checking category:', e);
        return NextResponse.json(
          { error: 'Error checking category', details: String(e) },
          { status: 500 }
        );
      }
    }

    try {
      const { data: lead, error } = await supabase
        .from("leads")
        .update({ category_id })
        .eq("id", id)
        .select(`
          *,
          category:categories!leads_category_id_fkey (*)
        `)
        .single();

      if (error) {
        console.error('Error updating lead:', error);
        return NextResponse.json(
          { error: 'Database update failed', details: error.message, code: error.code },
          { status: 400 }
        );
      }

      console.log('Lead updated successfully:', lead);
      return NextResponse.json({ lead });
    } catch (e) {
      console.error('Unexpected update error:', e);
      throw e;
    }
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { 
        error: "Failed to update lead", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 