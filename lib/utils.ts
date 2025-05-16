import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_PROFILE_IMAGE = 'https://abs.twimg.com/sticky/default_profile_images/default_profile.png';


export const getProfileImageUrl = (url: string | null | undefined): string => {
  if (!url || url.trim() === '') {
    return DEFAULT_PROFILE_IMAGE;
  }
  return url;
}; 