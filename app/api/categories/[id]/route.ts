import { NextResponse } from "next/server";
import { db } from '@/lib/db';
import { categories, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    
    // First update all leads that have this category to set their category_id to null
    await db.update(leads)
      .set({ category_id: null })
      .where(eq(leads.category_id, id));
    
    // Then delete the category
    const deletedCategories = await db.delete(categories)
      .where(eq(categories.id, id))
      .returning();
    
    if (deletedCategories.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
} 