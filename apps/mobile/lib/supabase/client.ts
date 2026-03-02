/**
 * Supabase client for mobile. Uses anon key; auth session from SecureStore or auth flow.
 */
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl =
  (typeof extra.supabaseUrl === "string" ? extra.supabaseUrl : "") ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";
const supabaseAnonKey =
  (typeof extra.supabaseAnonKey === "string" ? extra.supabaseAnonKey : "") ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are required",
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}
