"use client";

import ImagePreview from "@/component/imgpreview/imgpreview";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import style from "./page.module.css";
import uploadImage from "@/lib/uploadImage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import { fetchUsernameByUid } from "@/features/user/client";
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
      alert("?��?지�??�택?�주?�요!");
    }
  };

  async function addrecipeHD(event) {
    event.preventDefault();
    if (!user) {
      alert("로그?�이 ?�요?�니??");
      return;
    }
    const MealData = new FormData(event.target);
    const imagefile = MealData.get("image");
    if (!imagefile) {
      alert("?��?지�??�택?�주?�요!");
      return;
    }

    let imageurl = null;
    try {
      imageurl = await uploadImage(imagefile);
    } catch (err) {
      console.error("?��?지 ?�로?�에 ?�패?�습?�다.", err);
      alert("?��?지�??�로?�하지 못했?�니?? ?�시 ?�도?�주?�요.");
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
      console.error("?�시???�록???�패?�습?�다.", err);
      alert("?�시???�록???�패?�습?�다. ?�시 ?�도?�주?�요.");
    }
  }

  function sharebtnHD() {
    if (!imgselect) {
      alert("?��?지�??�택?�주?�요!");
    }
  }

  return (
    <div className={style.pagecontainer}>
      <header className={style.header}>
        <h1>만든 ?�식, 좋아?�는 ?�식??공유?�보?�요</h1>
      </header>
      <main className={style.shareform}>
        <form className={style.form} onSubmit={addrecipeHD}>
          <div className={style.formcontentsbox}>
            <div className={style.row1}>
              <div>
                <label htmlFor="creator">?�름</label>
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
              <label htmlFor="title">?�식 ?�름</label>
              <input type="text" name="title" id="title" required></input>
            </div>

            <div className={style.row3}>
              <label htmlFor="summary">?�식 ?�명</label>
              <input
                type="text"
                name="summary"
                id="summary"
                maxLength="51"
              ></input>
            </div>

            <div className={style.row4}>
              <label htmlFor="recipe">?�시??/label/</label>

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
            공유?�기
          </button>
        </form>
      </main>
    </div>
  );
}