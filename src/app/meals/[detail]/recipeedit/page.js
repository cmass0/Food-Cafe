"use client";

import ImagePreview from "@/component/imgpreview/imgpreview";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import style from "./page.module.css";
import uploadImage from "@/data/imagehandle";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/client";
import Modal from "@/component/modal/modal";
import { fetchUsernameByUid } from "@/data/fetchuser-client";
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
        console.error("레시피 정보를 불러오지 못했습니다.", error);
      }
    }

    fetchMeals();
  }, [params.detail]);

  const isselect = (isselected) => {
    if (!isselected) {
      alert("이미지를 선택해주세요!");
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
        console.error("이미지 업로드에 실패했습니다.", error);
        alert("이미지를 업로드하지 못했습니다. 다시 시도해주세요.");
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
      console.error("레시피 수정에 실패했습니다.", error);
      alert("레시피를 수정하지 못했습니다.");
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
        <h1>만든 음식, 좋아하는 음식을 공유해보세요</h1>
      </header>
      <main className={style.shareform}>
        <form className={style.form} onSubmit={editrecipeHD}>
          <div className={style.formcontentsbox}>
            <div className={style.row1}>
              <div>
                <label htmlFor="creator">이름</label>
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
              <label htmlFor="title">음식 이름</label>
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
              <label htmlFor="summary">음식 설명</label>
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
              <label htmlFor="recipe">레시피</label>
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
            수정하기
          </button>
          {isModal && (
            <Modal onclose={onclose}>
              <div className={style.requirelogin}>
                <button className={style.modalclosebtn} onClick={onclose}>
                  X
                </button>
                <div className={style.modaltext}>정말로 수정하시겠습니까?</div>
                <div className={style.deletebtnbox}>
                  <button
                    className={style.deleteselectbtn}
                    type="submit"
                  >
                    수정하기
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