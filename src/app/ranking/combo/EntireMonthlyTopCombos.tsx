"use client";

import { useEffect, useState } from "react";

import RankingGrid from "../RankingGrid";
import { mapTopCombo } from "@/domain/combo/combo_like/service";
import { TopCombo } from "@/domain/combo/combo_like/types";
import { getBrowserSupabase } from "@/lib/supabase";

export default function EntireMonthlyTopCombos() {
  const [topCombos, setTopCombos] = useState<TopCombo[]>([]);

  useEffect(() => {
    async function fetchTopCombos() {
      try {
        const supabase = getBrowserSupabase();
        const { data, error } = await supabase.rpc("get_top_combos_by_recent_likes", {
          term: "month",
          limit_size: 50,
        });
        if (error) {
          throw new Error(`월간 top50 콤보 랭킹 조회 실패: ${error.message}`);
        }
        const combos = (data ?? []).map((row) => mapTopCombo(row));
        setTopCombos(combos);
      } catch (error) {
        console.error("월간 top50 콤보 랭킹 조회 실패", error);
      }
    }

    fetchTopCombos();
  }, []);

  return <RankingGrid items={topCombos} hrefPrefix="combos" />;
}
