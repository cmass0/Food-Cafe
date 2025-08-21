"use client";

import { useRef, useState } from "react";
import style from "./imgpreview.module.css";
import Image from "next/image";

export default function ImagePreview({ label, name, isselect }) {
  const [pickedImage, setpickedImage] = useState();
  const imgref = useRef();

  function previewHD() {
    imgref.current.click();
  }

  function getImageHD(e) {
    const file = e.target.files[0];

    if (!file) {
      isselect(false);
      return;
    }

    isselect(true);

    const getfile = new FileReader();

    getfile.onload = () => {
      setpickedImage(getfile.result);
    };

    getfile.readAsDataURL(file);
    // setpickedImage(URL.createObjectURL(file));
  }

  return (
    <>
      {/* <label htmlFor={name}>label</label> */}
      <div className={style.previewbox}>
        <div>
          <div className={style.preview}>
            {!pickedImage && <p>선택된 이미지가 없습니다.</p>}
            {pickedImage && (
              <Image
                className={style.pickedimage}
                src={pickedImage}
                alt="이미지 미리보기"
                fill
              ></Image>
            )}
          </div>
          <input
            className={style.input}
            type="file"
            id={name}
            name={name}
            ref={imgref}
            onChange={getImageHD}
            accept="image/png, image/jpeg"
            required
          />
        </div>
        <div className={style.btncontrol}>
          <button
            type="button"
            onClick={previewHD}
            className={style.getimagebtn}
          >
            이미지 가져오기
          </button>
        </div>
      </div>
    </>
  );
}
