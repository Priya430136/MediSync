import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options: { cacheControl?: string; upsert?: boolean } = {}
) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        ...options,
      });

    if (error) throw error;
    return data;
  } catch (error: any) {
    toast.error(`Upload failed: ${error.message}`);
    throw error;
  }
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  } catch (error: any) {
    toast.error(`Delete failed: ${error.message}`);
    throw error;
  }
};
