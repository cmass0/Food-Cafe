"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

import ImagePreview from "@/component/imgpreview/imgpreview";
import { auth } from "@/lib/firebase/client";
import uploadImage from "@/lib/uploadImage";
import { fetchUsernameByUid } from "@/features/user/client";
import { createRecipe } from "@/features/recipe/api";

import style from "./page.module.css";

export default function ShareMeal() {
  const [userName, setUserName] = useState("user");
  const [imageSelected, setImageSelected] = useState(false);
  const [user] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const loginIdentifier = user.providerData[0]?.providerId;

    async function resolveDisplayName() {
      if (loginIdentifier === "password") {
        const username = await fetchUsernameByUid(user.uid);
        setUserName(username ?? user.displayName ?? "user");
      } else {
        setUserName(user.displayName ?? "user");
      }
    }

    resolveDisplayName();
  }, [user]);

  const handleSelect = (selected) => {
    setImageSelected(selected);
    if (!selected) {
      alert("이미지를 선택해주세요!");
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get("image");
    if (!imageFile) {
      alert("이미지를 선택해주세요!");
      return;
    }

    let imageUrl = null;
    try {
      imageUrl = await uploadImage(imageFile);
    } catch (error) {
      console.error("이미지 업로드에 실패했습니다.", error);
      alert("이미지를 업로드하지 못했습니다. 다시 시도해주세요.");
      return;
    }

    try {
      await createRecipe({
        title: String(formData.get("title") ?? ""),
        summary: formData.get("summary") ? String(formData.get("summary")) : undefined,
        recipe: String(formData.get("recipe") ?? ""),
        image: imageUrl,
        writerName: userName,
        writerUid: user.uid,
        writerEmail: formData.get("email") ? String(formData.get("email")) : undefined,
      });
      router.push("/meals");
    } catch (error) {
      console.error("레시피 등록에 실패했습니다.", error);
      alert("레시피를 등록하지 못했습니다. 다시 시도해주세요.");
    }
  }

  return (
    <div className={style.pagecontainer}>
      <header className={style.header}>
        <h1>만든 음식, 좋아하는 음식을 공유해보세요</h1>
      </header>
      <main className={style.shareform}>
        <form className={style.form} onSubmit={handleSubmit}>
          <div className={style.formcontentsbox}>
            <div className={style.row1}>
              <div>
                <label htmlFor="creator">이름</label>
                <input type="text" name="creator" id="creator" value={userName} readOnly />
              </div>
              <div>
                <label htmlFor="email">E-Mail</label>
                <input type="email" name="email" id="email" />
              </div>
            </div>

            <div className={style.row2}>
              <label htmlFor="title">음식 이름</label>
              <input type="text" name="title" id="title" required />
            </div>

            <div className={style.row3}>
              <label htmlFor="summary">음식 설명</label>
              <input type="text" name="summary" id="summary" maxLength={51} />
            </div>

            <div className={style.row4}>
              <label htmlFor="recipe">레시피</label>
              <textarea name="recipe" id="recipe" rows={15} required />
            </div>
          </div>
          <ImagePreview name="image" isselect={handleSelect} />
          <button type="submit" className={style.formbtn}>
            공유하기
          </button>
        </form>
      </main>
    </div>
  );
}
