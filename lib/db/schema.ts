import { pgTable, uuid, varchar, text, timestamp, boolean, integer, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

// Videos table
export const videos = pgTable('videos', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  filename: text('filename').notNull(),
  filepath: text('filepath').notNull(),
  filesize: bigint('filesize', { mode: 'number' }).notNull(),
  mime_type: text('mime_type').notNull(),
  thumbnail_url: text('thumbnail_url'),
  upload_status: text('upload_status').default('processing'),
  category_id: uuid('category_id').references(() => categories.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Leads table
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category_id: uuid('category_id').references(() => categories.id),
  twitter_handle: varchar('twitter_handle', { length: 255 }).notNull(),
  profile_image_url: text('profile_image_url'),
  follower_count: integer('follower_count').default(0),
  last_post_date: timestamp('last_post_date', { withTimezone: true }),
  is_verified: boolean('is_verified').default(false),
  is_blue_verified: boolean('is_blue_verified').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

// Define relationships between tables
export const categoriesRelations = relations(categories, ({ many }) => ({
  videos: many(videos),
  leads: many(leads)
}));

export const videosRelations = relations(videos, ({ one }) => ({
  category: one(categories, {
    fields: [videos.category_id],
    references: [categories.id]
  })
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  category: one(categories, {
    fields: [leads.category_id],
    references: [categories.id]
  })
})); 