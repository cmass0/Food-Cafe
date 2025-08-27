"use client";

import ImagePreview from "@/component/imgpreview/imgpreview";
import { useRouter } from "next/navigation";
import { useState } from "react";
import style from "./page.module.css";
import uploadImage from "@/data/imagehandle";
import { useAuthState } from "react-firebase-hooks/auth";
import { Auth } from "@/lib/firebase/client";
import { useEffect } from "react";
import { fetchUser } from "@/data/user";

//useFormStatus 사용
//componet로 이동

export default function ShareMeal() {
  const [userName, setUserName] = useState("");
  const [imgselect, setImageSelect] = useState(false);
  const router = useRouter();
  const [user] = useAuthState(Auth);

  useEffect(() => {
    if (user) {
      console.log(user.uid);
      const loginIdentifier = user.providerData[0]?.providerId;
      async function ReadUserData() {
        if (loginIdentifier === "password") {
          const profile = await fetchUser(user.uid);
          console.log(profile);

          if (profile) {
            setUserName(profile.username);
          }
        } else {
          setUserName(user.displayName || "user");
        }
      }
      ReadUserData();
    }
  }, [user]);

  const isselect = (isselected) => {
    setImageSelect(isselected);
    if (isselected === false) {
      alert("이미지를 선택해주세요!");
    }
  };

  async function addrecipeHD(data) {
    data.preventDefault();
    const MealData = new FormData(data.target);
    const imagefile = MealData.get("image");
    const imageurl = await uploadImage(imagefile);
    console.log(imagefile);

    if (!imagefile) {
      alert("이미지를 선택해주세요!");
      return;
    }

    console.log(imageurl);
    console.log(MealData.get("creator"));
    console.log(MealData.get("title"));
    console.log(MealData.get("email"));
    console.log(MealData.get("summary"));
    console.log(MealData.get("recipe"));
    console.log(MealData.get("image"));

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/recipe`,
        {
          method: "post",
          body: JSON.stringify({
            name: MealData.get("creator"),
            title: MealData.get("title"),
            email: MealData.get("email"),
            summary: MealData.get("summary"),
            recipe: MealData.get("recipe"),
            image: imageurl || null,
            // id: MealData.get("id") || null,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`레시피 추가 완료 : ${data}`);
      router.push("/meals");
    } catch (err) {
      console.error("err: ", err);
    }
  }

  function sharebtnHD() {
    if (!imgselect) {
      alert("이미지를 선택해주세요!");
      return;
    }
  }

  return (
    <div className={style.pagecontainer}>
      <header className={style.header}>
        <h1>만든 음식, 좋아하는 음식이 있으면 공유하세요!</h1>
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
                ></input>
              </div>
              <div>
                <label htmlFor="email">E-Mail</label>
                <input type="email" name="email" id="email"></input>
              </div>
            </div>

            <div className={style.row2}>
              <label htmlFor="title">음식이름</label>
              <input type="text" name="title" id="title"></input>
            </div>

            <div className={style.row3}>
              <label htmlFor="summary">음식설명</label>
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
                type="text"
                name="recipe"
                id="recipe"
                rows="15"
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
