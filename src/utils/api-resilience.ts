import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

export const handleApiError = (error: any, fallbackMessage: string = "An unexpected error occurred") => {
  console.error("API Error:", error);

  if (error instanceof Error) {
    toast.error(error.message);
    return;
  }

  // Handle Supabase specific errors
  const pgError = error as PostgrestError;
  if (pgError.code) {
    switch (pgError.code) {
      case "23505":
        toast.error("This record already exists.");
        break;
      case "42501":
        toast.error("You don't have permission to perform this action.");
        break;
      case "PGRST116":
        toast.error("Record not found.");
        break;
      default:
        toast.error(`${fallbackMessage} (Code: ${pgError.code})`);
    }
    return;
  }

  toast.error(fallbackMessage);
};

// Simple rate limiter for client-side actions (e.g., SOS button spam prevention)
const rateLimits = new Map<string, number>();

export const checkRateLimit = (key: string, limitMs: number = 5000): boolean => {
  const now = Date.now();
  const lastCall = rateLimits.get(key) || 0;

  if (now - lastCall < limitMs) {
    const waitSec = Math.ceil((limitMs - (now - lastCall)) / 1000);
    toast.warning(`Please wait ${waitSec}s before trying again.`);
    return false;
  }

  rateLimits.set(key, now);
  return true;
};
