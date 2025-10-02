import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function NavServer() {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANONKEY;

  if (!url) {
    throw new Error("SUPABASE_URL is not defined");
  }
  if (!anon) {
    throw new Error("SUPABASE_ANONKEY is not defined");
  }

  const cookie = cookies();
  const supabase = createServerClient(url, anon, {
    cookies: { get: (name) => cookie.get(name)?.value },
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return <></>;
}
