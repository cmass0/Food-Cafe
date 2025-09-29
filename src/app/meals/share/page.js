"use client";

import ImagePreview from "@/component/imgpreview/imgpreview";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import style from "./page.module.css";
import uploadImage from "@/data/imagehandle";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import { fetchUsernameByUid } from "@/data/fetchuser-client";
import { createRecipe } from "@/features/recipe/api";

export default function ShareMeal() {
  const [userName, setUserName] = useState("");
  const [imgselect, setImageSelect] = useState(false);
  const router = useRouter();
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) return;
    const loginIdentifier = user.providerData[0]?.providerId;
    async function ReadUserData() {
      if (loginIdentifier === "password") {
        const username = await fetchUsernameByUid(user.uid);
        if (username) {
          setUserName(username);
          return;
        }
      }
      setUserName(user.displayName || "user");
    }
    ReadUserData();
  }, [user]);

  const isselect = (isselected) => {
    setImageSelect(isselected);
    if (isselected === false) {
      alert("이미지를 선택해주세요!");
    }
  };

  async function addrecipeHD(event) {
    event.preventDefault();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    const MealData = new FormData(event.target);
    const imagefile = MealData.get("image");
    if (!imagefile) {
      alert("이미지를 선택해주세요!");
      return;
    }

    let imageurl = null;
    try {
      imageurl = await uploadImage(imagefile);
    } catch (err) {
      console.error("이미지 업로드에 실패했습니다.", err);
      alert("이미지를 업로드하지 못했습니다. 다시 시도해주세요.");
      return;
    }

    try {
      await createRecipe({
        title: String(MealData.get("title") ?? ""),
        summary: MealData.get("summary") ? String(MealData.get("summary")) : undefined,
        recipe: String(MealData.get("recipe") ?? ""),
        image: imageurl || null,
        writerName: userName || String(MealData.get("creator") ?? ""),
        writerUid: user.uid,
        writerEmail: MealData.get("email") ? String(MealData.get("email")) : undefined,
      });
      router.push("/meals");
    } catch (err) {
      console.error("레시피 등록에 실패했습니다.", err);
      alert("레시피 등록에 실패했습니다. 다시 시도해주세요.");
    }
  }

  function sharebtnHD() {
    if (!imgselect) {
      alert("이미지를 선택해주세요!");
    }
  }

  return (
    <div className={style.pagecontainer}>
      <header className={style.header}>
        <h1>만든 음식, 좋아하는 음식을 공유해보세요</h1>
      </header>
      <main className={style.shareform}>
        <form className={style.form} onSubmit={addrecipeHD}>
          <div className={style.formcontentsbox}>
            <div className={style.row1}>
              <div>
                <label htmlFor="creator">이름</label>
                <input
                  type="text"
                  name="creator"
                  id="creator"
                  value={userName}
                  readOnly
                ></input>
              </div>
              <div>
                <label htmlFor="email">E-Mail</label>
                <input type="email" name="email" id="email"></input>
              </div>
            </div>

            <div className={style.row2}>
              <label htmlFor="title">음식 이름</label>
              <input type="text" name="title" id="title" required></input>
            </div>

            <div className={style.row3}>
              <label htmlFor="summary">음식 설명</label>
              <input
                type="text"
                name="summary"
                id="summary"
                maxLength="51"
              ></input>
            </div>

            <div className={style.row4}>
              <label htmlFor="recipe">레시피</label>

              <textarea
                name="recipe"
                id="recipe"
                rows="15"
                required
              ></textarea>
            </div>
          </div>
          <ImagePreview name="image" isselect={isselect} />
          <button className={style.formbtn} onClick={sharebtnHD}>
            공유하기
          </button>
        </form>
      </main>
    </div>
  );
}