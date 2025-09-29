"use client";

import { useEffect, useState } from "react";

import breadImg from "@/assets/bread.jpg";
import soupImg from "@/assets/goulash-soup.jpg";
import poke from "@/assets/poke.jpeg";
import style from "./main-slide.module.css";
import Image from "next/image";

const imgarr = [
  { image: breadImg, alt: "bread img" },
  { image: soupImg, alt: "soup img" },
  { image: poke, alt: "salmon poke img" },
];

export default function SlideShow() {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  useEffect(() => {
    const indext = setInterval(() => {
      setCurrentImgIndex((pre) => (pre < imgarr.length - 1 ? pre + 1 : 0));
    }, 3000);

    return () => clearInterval(indext);
  }, []);

  return (
    <div className={style.slidebox}>
      {imgarr.map((img, curindex) => {
        return (
          <Image
            key={curindex}
            src={img.image}
            className={curindex === currentImgIndex ? style.active : ""}
            alt={img.alt}
            fill
          />
        );
      })}
    </div>
  );
}
