import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface CategoryCount {
  name: string;
  value: number;
  color: string;
}

// Define a type for the database response based on what we need
interface DbCategoryCount {
  id: string | null;
  name: string;
  color: string;
  count: string | number; // Could be string or number depending on how Supabase returns it
}

/* //*PREVIOUS IMPLEMENTATION
// First, get all categories
const { data: categories } = await supabase.from('categories').select('id, name, color');

// Initialize a map for counting
const categoryMap = categories.reduce((acc, category) => {
  acc[category.id] = { name: category.name, value: 0, color: category.color };
  return acc;
}, {});

// Get ALL leads to count manually
const { data: leads } = await supabase.from('leads').select('category_id');

// Count the leads by category in JavaScript
leads.forEach((lead) => {
  const categoryId = lead.category_id || 'uncategorized';
  if (categoryMap[categoryId]) {
    categoryMap[categoryId].value += 1;
  }
});

// Convert to chart data
const chartData = Object.values(categoryMap).filter(category => category.value > 0);
*/

// Create a standard Supabase client (non-SSR version)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Try to use the optimized database function first
    const { data: categoryCounts, error: countError } = await supabase
      .rpc('get_category_counts');
    
    // Log the raw data to debug type issues
    console.log('Raw database result:', categoryCounts);
    
    // If the function doesn't exist yet, fall back to the original implementation
    if (countError) {
      console.error('Error fetching category counts:', countError);
      
      if (countError.message?.includes('function "get_category_counts" does not exist') || 
          countError.message?.includes('structure of query does not match function result type')) {
        console.log('Database function not available or type mismatch, using fallback implementation');
        return await getCategorizationLegacy();
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch category counts' },
        { status: 500 }
      );
    }
    
    // Validate and handle the data format
    if (!categoryCounts || !Array.isArray(categoryCounts) || categoryCounts.length === 0) {
      console.warn('Database function returned invalid format or empty result, using legacy implementation');
      return await getCategorizationLegacy();
    }
    
    try {
      // Transform the data into the expected format for the chart
      const chartData: CategoryCount[] = categoryCounts
        .filter((category: DbCategoryCount) => {
          // Safely convert to number and filter
          try {
            return Number(category.count) > 0;
          } catch (e) {
            console.warn('Error converting count to number:', e, category);
            return false;
          }
        })
        .map((category: DbCategoryCount) => {
          // Safely convert values with error handling
          try {
            let value: number;
            if (typeof category.count === 'string') {
              value = parseInt(category.count, 10);
              if (isNaN(value)) value = 0;
            } else {
              value = Number(category.count);
              if (isNaN(value)) value = 0;
            }
            
            return {
              name: category.name || 'Unknown',
              value: value,
              color: category.color || '#CCCCCC'
            };
          } catch (e) {
            console.warn('Error converting category data:', e, category);
            return {
              name: 'Error',
              value: 0,
              color: '#FF0000'
            };
          }
        });

      console.log('Category chart data (optimized):', chartData);

      // Return the formatted data
      return NextResponse.json({
        chartData
      });
    } catch (transformError) {
      console.error('Error transforming category data:', transformError);
      return await getCategorizationLegacy();
    }
  } catch (error) {
    console.error('Unexpected error in categories chart endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Legacy implementation as fallback
async function getCategorizationLegacy() {
  try {
    // First, get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, color');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Initialize the results object with all categories
    const categoryMap = categories.reduce((acc: Record<string, CategoryCount>, category: {id: string, name: string, color: string}) => {
      acc[category.id] = {
        name: category.name,
        value: 0, // Initialize count at 0
        color: category.color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
      };
      return acc;
    }, {});

    // Add an 'uncategorized' entry
    categoryMap['uncategorized'] = {
      name: 'Uncategorized',
      value: 0,
      color: '#CCCCCC'
    };

    // Get all leads to count manually by category
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('category_id');

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    // Count the leads by category manually
    if (leads && leads.length > 0) {
      leads.forEach((lead: {category_id: string | null}) => {
        const categoryId = lead.category_id || 'uncategorized';
        if (categoryMap[categoryId]) {
          categoryMap[categoryId].value += 1;
        } else if (!lead.category_id) {
          categoryMap['uncategorized'].value += 1;
        }
      });
    }

    // Convert to the expected format for the chart (array of objects)
    const chartData = Object.values(categoryMap).filter((category: CategoryCount) => category.value > 0);

    console.log('Category chart data (legacy):', chartData);

    // Return the formatted data
    return NextResponse.json({
      chartData
    });
  } catch (error) {
    console.error('Unexpected error in categories chart legacy endpoint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 

