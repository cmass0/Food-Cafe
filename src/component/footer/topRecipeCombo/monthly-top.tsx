import { mapTopCombo } from "@/domain/combo/combo_like/service";
import { TopCombo } from "@/domain/combo/combo_like/types";
import { getBrowserSupabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import TopCarousel from "../top-recipes-carousel";

export default function MonthlyTopCombo() {
  const [topCombos, setTopCombos] = useState<TopCombo[]>([]);

  useEffect(() => {
    async function fetchTopCombos() {
      try {
        const supabase = getBrowserSupabase();
        const { data, error } = await supabase.rpc("get_top_combos_by_recent_likes", {
          term: "month",
          limit_size: 10,
        });
        if (error) {
          throw new Error(`레시피 조합 조회 실패: ${error.message}`);
        }

        const combos = (data ?? []).map((row) => mapTopCombo(row));
        setTopCombos(combos);
      } catch (error) {
        console.error("월간 인기 레시피 조합 조회 실패:", error);
      }
    }

    fetchTopCombos();
  }, []);

  return <TopCarousel label="월간 인기 레시피 조합" contents={topCombos} />;
}
