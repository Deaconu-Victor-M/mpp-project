import { z } from 'zod';

// Base company schema for POST requests
export const companySchema = z.object({
  name: z.string()
    .min(1, "Company name is required")
    .max(100, "Company name must be less than 100 characters"),
  website_url: z.string()
    .min(1, "Website URL is required")
    .url("Must be a valid URL")
    .refine(
      (url) => {
        try {
          const urlObj = new URL(url);
          return urlObj.hostname === 'x.com' || urlObj.hostname === 'twitter.com';
        } catch {
          return false;
        }
      },
      "Website URL must be from x.com or twitter.com"
    ),
  logo_url: z.string()
    .optional()
    .nullable(),
});

// Partial schema for PATCH requests (all fields optional)
export const companyUpdateSchema = companySchema.partial();

// Type inference
export type CompanyInput = z.infer<typeof companySchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>; 