"use client";

import BoardMain from "@/component/postboard/postboard";

import { useEffect, useState } from "react";
import LoadingPage from "../loading";

async function fetchpost() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/post`, {
    cache: "no-store",
  });
  return response.json();
}

export default function CommuPage() {
  const [postdata, setPostData] = useState([]);
  const [maxnum, setMaxNum] = useState(0);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    async function fetchpostdata() {
      try {
        const data = await fetchpost();
        const sortData = data.data.sort((a, b) => a.number - b.number);

        setMaxNum(sortData[sortData.length - 1].number);
        setPostData(sortData);
        setloading(false);
      } catch (err) {
        console.error("err: ", err);
        setloading(false);
      }
    }

    fetchpostdata();
  }, []);

  if (loading) {
    return <LoadingPage></LoadingPage>;
  }

  return <BoardMain data={postdata} maxnum={maxnum}></BoardMain>;
}
