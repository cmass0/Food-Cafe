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


export default function FooterSlide() {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [toprecipe, setTopRecipe] = useState([]);

  useEffect(() => {
    async function readtoprecipe() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/recipe`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error("toprecipe read fail");
        }

        const data = await response.json();
        const sortedarr = data.data.sort((a, b) => b.like - a.like);
        const toprecipe = sortedarr.slice(0, 3);

        setTopRecipe(toprecipe);
      } catch (err) {
        console.error(err);
      }
    }
    readtoprecipe();
  }, []);

  function leftaction() {
    setCurrentImgIndex((prev) => (currentImgIndex <= 0 ? prev + 2 : prev - 1));
    console.log(currentImgIndex);
  }

  function rightaction() {
    setCurrentImgIndex((prev) => (currentImgIndex >= 2 ? prev - 2 : prev + 1));
    console.log(currentImgIndex);
  }

  return (
    <section>
      <div>
        <h1 className={style.toptext}>TOP3 레시피는?</h1>
        <div className={style.FooterSlide}>
          <div className={style.ranking}>
            {currentImgIndex === 0 && <Image src={ranking1} fill></Image>}
            {currentImgIndex === 1 && <Image src={ranking2} fill></Image>}
            {currentImgIndex === 2 && <Image src={ranking3} fill></Image>}
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
            <Image src={leftbtn} fill></Image>
          </button>
          <button onClick={rightaction} className={style.rightbtn}>
            <Image src={rightbtn} fill></Image>
          </button>
        </div>
      </div>
    </section>
  );
}
