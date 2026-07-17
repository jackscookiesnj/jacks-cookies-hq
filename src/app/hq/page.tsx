import { CookiesApp } from "@/components/cookies-app";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function HqPage() {
  return <CookiesApp configured={isSupabaseConfigured} />;
}
