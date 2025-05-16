// Type definitions for database entities

export interface ChatLocation {
  id: string;
  name: string;
}

export interface SaleStatus {
  id: string;
  name: string;
}

export interface LeadSource {
  id: string;
  name: string;
}

export interface Designer {
  id: string;
  name: string;
}

export interface SalesRecord {
  id: string;
  client: string;
  chat_location_id: string | null;
  sale_status_id: string | null;
  lead_source_id: string | null;
  designer_id: string | null;
  product: string | null;
  est_deal_value: number | null;
  est_payout: number | null;
  est_earnings: number | null;
  created_at: string;
  updated_at: string;
}

// Type with joined data (for display)
export interface SalesRecordWithJoins extends SalesRecord {
  chat_location?: ChatLocation;
  sale_status?: SaleStatus;
  lead_source?: LeadSource;
  designer?: Designer;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  category_id: string;
  name: string;
  twitter_handle: string;
  profile_image_url: string;
  follower_count: number;
  last_post_date: string;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface PersonalProfile {
  id: string;
  lead_id: string;
  name: string;
  twitter_handle: string;
  follower_count: number;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  company_id: string;
  name: string;
  total_leads: number;
  start_date: string;
  end_date: string;
  results_date: string;
  initial_message: string;
  bump1_message?: string;
  bump2_message?: string;
  bump3_message?: string;
  created_at: string;
  updated_at: string;
  company?: Company;
  categories?: Category[];
  leads?: CampaignLead[];
  campaign_leads?: CampaignLead[];
}

export interface CampaignLead {
  campaign_id: string;
  lead_id: string;
  status: 'funneled' | 'engaged' | 'contacted' | 'to_be_contacted';
  created_at: string;
  updated_at: string;
  lead: Lead;
}

// Type with joined data for display
export interface CompanyWithCampaigns extends Company {
  campaigns?: Campaign[];
  total_campaigns?: number;
  total_leads_contacted?: number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  filename: string;
  filepath: string;
  filesize: number;
  mime_type: string;
  thumbnail_url: string | null;
  upload_status: string;
  category_id?: string;
  category?: Category;
  url?: string; // Client-side only, not in database
  created_at: string;
  updated_at: string;
} 