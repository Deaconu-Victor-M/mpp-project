import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    // Using Drizzle ORM to fetch categories
    const categoriesData = await db.select()
      .from(categories)
      .orderBy(asc(categories.name));

    return NextResponse.json({ categories: categoriesData });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, color } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      );
    }
    
    // Using Drizzle ORM to insert and return the new category
    const [category] = await db.insert(categories)
      .values({ 
        name, 
        color 
      })
      .returning();
    
    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
} 