import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Use the connection pooler URL from your Supabase dashboard
const connectionString = process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://','postgres://postgres:postgres@') + ':5432/postgres';

// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

// Export schema types for use in components
export * from './schema'; 