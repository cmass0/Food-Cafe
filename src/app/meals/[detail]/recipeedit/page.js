"use client";

import ImagePreview from "@/component/imgpreview/imgpreview";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import style from "./page.module.css";
import uploadImage from "@/lib/uploadImage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import Modal from "@/component/modal/modal";
import { fetchUsernameByUid } from "@/features/user/client";
import { getRecipe, updateRecipe } from "@/features/recipe/api";

export default function EditMeal({ params }) {
  const [detailinfo, setDetailInfo] = useState(null);
  const [userName, setUserName] = useState("");
  const [isModal, setIsModal] = useState(false);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [recipe, setRecipe] = useState("");
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

  useEffect(() => {
    async function fetchMeals() {
      try {
        const data = await getRecipe(params.detail);
        if (!data) {
          setDetailInfo(null);
          return;
        }
        setDetailInfo(data);
        setEmail(data.writerEmail ?? "");
        setTitle(data.title ?? "");
        setSummary(data.summary ?? "");
        setRecipe(data.recipe ?? "");
      } catch (error) {
        console.error("?�시???�보�?불러?��? 못했?�니??", error);
      }
    }

    fetchMeals();
  }, [params.detail]);

  const isselect = (isselected) => {
    if (!isselected) {
      alert("?��?지�??�택?�주?�요!");
    }
  };

  async function editrecipeHD(event) {
    event.preventDefault();
    if (!detailinfo) return;
    const formData = new FormData(event.target);
    const imagefile = formData.get("image");
    let imageurl = detailinfo.image ?? null;

    if (imagefile && imagefile.size) {
      try {
        imageurl = await uploadImage(imagefile);
      } catch (error) {
        console.error("?��?지 ?�로?�에 ?�패?�습?�다.", error);
        alert("?��?지�??�로?�하지 못했?�니?? ?�시 ?�도?�주?�요.");
        return;
      }
    }

    try {
      await updateRecipe(params.detail, {
        title,
        summary: summary || undefined,
        recipe,
        image: imageurl,
        writerName: userName,
        writerUid: user?.uid,
        writerEmail: email || undefined,
      });
      router.push(`/meals/${params.detail}`);
    } catch (error) {
      console.error("?�시???�정???�패?�습?�다.", error);
      alert("?�시?��? ?�정?��? 못했?�니??");
    }
  }

  function onclose() {
    setIsModal(false);
  }

  function editqus() {
    setIsModal(true);
  }

  return (
    <div className={style.pagecontainer}>
      <header className={style.header}>
        <h1>만든 ?�식, 좋아?�는 ?�식??공유?�보?�요</h1>
      </header>
      <main className={style.shareform}>
        <form className={style.form} onSubmit={editrecipeHD}>
          <div className={style.formcontentsbox}>
            <div className={style.row1}>
              <div>
                <label htmlFor="creator">?�름</label>
                <input
                  type="text"
                  name="creator"
                  id="creator"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                ></input>
              </div>
              <div>
                <label htmlFor="email">E-Mail</label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                ></input>
              </div>
            </div>

            <div className={style.row2}>
              <label htmlFor="title">?�식 ?�름</label>
              <input
                type="text"
                name="title"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              ></input>
            </div>

            <div className={style.row3}>
              <label htmlFor="summary">?�식 ?�명</label>
              <input
                type="text"
                name="summary"
                id="summary"
                maxLength="51"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              ></input>
            </div>

            <div className={style.row4}>
              <label htmlFor="recipe">?�시??</label>
              <textarea
                name="recipe"
                id="recipe"
                rows="15"
                value={recipe}
                onChange={(e) => setRecipe(e.target.value)}
                required
              ></textarea>
            </div>
          </div>
          <ImagePreview name="image" isselect={isselect} />
          <button type="button" className={style.formbtn} onClick={editqus}>
            ?�정?�기
          </button>
          {isModal && (
            <Modal onclose={onclose}>
              <div className={style.requirelogin}>
                <button className={style.modalclosebtn} onClick={onclose}>
                  X
                </button>
                <div className={style.modaltext}>?�말�??�정?�시겠습?�까?</div>
                <div className={style.deletebtnbox}>
                  <button
                    className={style.deleteselectbtn}
                    type="submit"
                  >
                    ?�정?�기
                  </button>
                </div>
              </div>
            </Modal>
          )}
        </form>
      </main>
    </div>
  );
}