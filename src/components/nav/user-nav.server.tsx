import Navbar from "@/component/nav-bar";
import ClientUserNav from "./user-nav.client";
import { getServerSupabase } from "@/lib/supabase/server";

export default async function NavBarServer() {
  const supabase = getServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return <Navbar rightSlot={<ClientUserNav session={session} />} />;
}
