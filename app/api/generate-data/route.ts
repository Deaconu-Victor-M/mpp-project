import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Configuration
const TOTAL_LEADS = 10;
const BATCH_SIZE = 100;
const DEFAULT_PROFILE_IMAGE = 'https://abs.twimg.com/sticky/default_profile_images/default_profile.png';

async function generateLeads() {
  // 1. First, get all existing category IDs
  const { data: categories, error: categoryError } = await supabase
    .from('categories')
    .select('id');
  
  if (categoryError || !categories || categories.length === 0) {
    throw new Error('Error fetching categories or no categories found');
  }
  
  const categoryIds = categories.map(cat => cat.id);
  
  // 2. Generate leads in batches
  let totalInserted = 0;
  
  for (let i = 0; i < TOTAL_LEADS; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL_LEADS - i);
    const leads = [];
    
    for (let j = 0; j < batchSize; j++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const name = `${firstName} ${lastName}`;
      
      const username = (faker.internet.userName({ firstName, lastName }).toLowerCase() + 
        faker.number.int({ min: 1, max: 9999 })).substring(0, 15);
      
      leads.push({
        name,
        twitter_handle: username,
        profile_image_url: DEFAULT_PROFILE_IMAGE,
        follower_count: faker.number.int({ min: 100, max: 1000000 }),
        last_post_date: faker.date.recent({ days: 30 }).toISOString(),
        category_id: faker.helpers.arrayElement(categoryIds),
        is_verified: faker.datatype.boolean({ probability: 0.1 }),
        is_blue_verified: faker.datatype.boolean({ probability: 0.2 }),
        created_at: faker.date.between({ 
          from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          to: new Date() 
        }).toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    const { error: leadsError } = await supabase.from('leads').insert(leads);
    
    if (leadsError) {
      throw new Error(`Error inserting batch: ${leadsError.message}`);
    }
    
    totalInserted += batchSize;
  }
  
  return totalInserted;
}

export async function POST() {
  try {
    const totalInserted = await generateLeads();
    return NextResponse.json({ 
      success: true, 
      message: `Successfully generated ${totalInserted} leads` 
    });
  } catch (error) {
    console.error('Error generating data:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 