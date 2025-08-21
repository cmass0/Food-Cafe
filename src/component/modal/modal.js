"use client";

import { useState } from "react";
import style from "./modal.module.css";
export default function Modal({ onclose, children }) {
  const [isopen, setisopen] = useState(false);

  const ModalclickHD = (e) => {
    if (e.target.classList.contains(style.backdrop)) {
      onclose();
    }
  };

  return (
    <>
      <div className={style.backdrop} onClick={ModalclickHD}>
        <div className={style.modal}>{children}</div>
      </div>
    </>
  );
}
