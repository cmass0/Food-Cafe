"use client";

import leftbtn from "@/assets/left.png";
import rightbtn from "@/assets/right.png";
import style from "./footer-slider.module.css";
import FooterRecipe from "./footer-recipe";
import { useState, useEffect } from "react";
import Image from "next/image";
import ranking1 from "@/assets/1st.png";
import ranking2 from "@/assets/2nd.png";
import ranking3 from "@/assets/3rd.png";
import { listRecipes } from "@/features/recipe/api";

export default function FooterSlide() {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [toprecipe, setTopRecipe] = useState([]);

  useEffect(() => {
    async function readTopRecipe() {
      try {
        const data = await listRecipes({ limit: 50 });
        const sorted = [...(data?.items ?? [])]
          .map((item) => ({
            ...item,
            likeCount: item.likeCount ?? item.like ?? 0,
          }))
          .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
        setTopRecipe(sorted.slice(0, 3));
      } catch (err) {
        console.error("인기 레시피를 불러오지 못했습니다.", err);
      }
    }
    readTopRecipe();
  }, []);

  function leftaction() {
    setCurrentImgIndex((prev) => (prev <= 0 ? prev + 2 : prev - 1));
  }

  function rightaction() {
    setCurrentImgIndex((prev) => (prev >= 2 ? prev - 2 : prev + 1));
  }

  return (
    <section>
      <div>
        <h1 className={style.toptext}>TOP3 레시피는?</h1>
        <div className={style.FooterSlide}>
          <div className={style.ranking}>
            {currentImgIndex === 0 && <Image src={ranking1} fill alt="1st" />}
            {currentImgIndex === 1 && <Image src={ranking2} fill alt="2nd" />}
            {currentImgIndex === 2 && <Image src={ranking3} fill alt="3rd" />}
          </div>
          {toprecipe.map((data, index) => {
            const isActive = index === currentImgIndex;
            return (
              <FooterRecipe
                data={data}
                key={data.id}
                index={index}
                curindex={currentImgIndex}
                className={`${style.FooterRecipe} ${
                  isActive ? "active" : "inactive"
                }`}
              ></FooterRecipe>
            );
          })}

          <button onClick={leftaction} className={style.leftbtn}>
            <Image src={leftbtn} fill alt="left" />
          </button>
          <button onClick={rightaction} className={style.rightbtn}>
            <Image src={rightbtn} fill alt="right" />
          </button>
        </div>
      </div>
    </section>
  );
}