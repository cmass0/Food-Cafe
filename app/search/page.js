"use client";

import style from "./page.module.css";

import SearchList from "@/component/search/search";
import SearchDisplay from "@/component/search/searchdisplay";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import LoadingPage from "../loading";

async function fetchpost() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/post`, {
    cache: "no-store",
  });
  return response.json();
}

async function readrecipe() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/recipe`,
    {
      cache: "no-store",
    }
  );
  return response.json();
}

export default function SearchPage() {
  const [postdata, setPostData] = useState([]);
  const [recipedata, setrecipedata] = useState([]);
  const [loading, setloading] = useState(true);

  const searchparams = useSearchParams();
  const query = searchparams.get("query") || "";

  useEffect(() => {
    async function fetchrecipedata() {
      try {
        const recipedata = await readrecipe();
        setrecipedata(recipedata.data);
        setloading(false);
        console.log(recipedata.data);
      } catch (err) {
        console.error("err: ", err);
        setloading(false);
      }
    }

    fetchrecipedata();
  }, []);

  useEffect(() => {
    async function fetchpostdata() {
      try {
        const data = await fetchpost();
        setPostData(data.data);
        console.log(data.data);
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

  return (
    <section>
      <div className={style.mealsarea}>
        <p className={style.searchmeal}>
          <span>|</span> 레시피
        </p>
        <SearchList
          data={recipedata}
          query={query}
          keyFn={(constents) => constents.id}
        >
          {(constents) => <SearchDisplay contents={constents} />}
        </SearchList>
      </div>
      {/* <hr className={style.hrbar} /> */}
      <div className={style.postarea}>
        <p className={style.searchmeal}>
          <span>|</span> 커뮤니티
        </p>
        <SearchList
          data={postdata}
          query={query}
          keyFn={(constents) => constents.number}
        >
          {(constents) => <SearchDisplay contents={constents} />}
        </SearchList>
      </div>
    </section>
  );
}
