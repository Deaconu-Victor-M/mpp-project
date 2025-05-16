import { createClient } from "@/utils/supabase/client";
import { logUserActivity } from "@/utils/activity-logger";

/**
 * Add a new lead with activity logging
 */
export async function addLead(twitterUrl: string, categoryId?: string) {
  try {
    const supabase = createClient();
    
    // Create the lead
    const response = await fetch("/api/leads/create-with-twitter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        twitter_url: twitterUrl,
        category_id: categoryId,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create lead");
    }
    
    const data = await response.json();
    
    // Log the activity
    await logUserActivity(
      "create_lead",
      "lead",
      data.lead.id,
      {
        twitter_handle: data.lead.twitter_handle,
        category_id: categoryId
      }
    );
    
    return data.lead;
  } catch (error) {
    console.error("Error creating lead:", error);
    throw error;
  }
}

/**
 * Update a lead with activity logging
 */
export async function updateLead(leadId: string, updates: any) {
  try {
    const supabase = createClient();
    
    // Update the lead
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update lead");
    }
    
    const data = await response.json();
    
    // Log the activity
    await logUserActivity(
      "update_lead",
      "lead",
      leadId,
      {
        updates
      }
    );
    
    return data.lead;
  } catch (error) {
    console.error("Error updating lead:", error);
    throw error;
  }
}

/**
 * Delete a lead with activity logging
 */
export async function deleteLead(leadId: string, leadName: string) {
  try {
    const supabase = createClient();
    
    // Delete the lead
    const response = await fetch(`/api/leads/${leadId}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete lead");
    }
    
    // Log the activity
    await logUserActivity(
      "delete_lead",
      "lead",
      leadId,
      {
        lead_name: leadName
      }
    );
    
    return true;
  } catch (error) {
    console.error("Error deleting lead:", error);
    throw error;
  }
} 