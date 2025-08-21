"use client";

import Recipe from "./recipe";
import bread from "@/assets/bread.jpg";
import soup from "@/assets/goulash-soup.jpg";
import poke from "@/assets/poke.jpeg";
import sandwich from "@/assets/sandwich.jpeg";
import spicychickensoup from "@/assets/spicy-braised-chicken.jpeg";
import tteokbokki from "@/assets/tteok-bokki.jpeg";
import style from "./display-racipe.module.css";
import React, { useEffect, useState } from "react";

export default function Gridracipe({ MealsData }) {
  const [mealsdata, setMealsData] = useState([]);

  useEffect(() => {
    if (MealsData.data && MealsData) {
      setMealsData(MealsData.data);
    }
  }, [MealsData]);

  return (
    <div>
      {/* <div>{data.data[0].id}</div>
      <div>{data.message}</div>
      <div>{data.data[0].email}</div> */}
      <div className={style.displaygrid}>
        {mealsdata.map((data, index) => {
          return <Recipe key={index} data={data} id={index} />;
        })}
      </div>
    </div>
  );
}
