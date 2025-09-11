"use client";

import ImagePreview from "@/component/imgpreview/imgpreview";
import { useRouter } from "next/navigation";
import { useState } from "react";
import style from "./page.module.css";
import uploadImage from "@/data/imagehandle";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Auth } from "@/lib/firebase/client";
import Modal from "@/component/modal/modal";
import { fetchUsernameByUid } from "@/data/fetchuser-client";

//useFormStatus 사용
//componet로 이동

export default function EditMeal({ params }) {
  const [detailinfo, setDetailInfo] = useState([]);
  const [userName, setUserName] = useState("");
  const [isModal, setIsModal] = useState(false);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [recipe, setRecipe] = useState("");
  const [imgselect, setImageSelect] = useState(false);
  const router = useRouter();
  const [user] = useAuthState(Auth);

  useEffect(() => {
    if (user) {
      console.log(user.uid);
      const loginIdentifier = user.providerData[0]?.providerId;
      async function ReadUserData() {
        if (loginIdentifier === "password") {
          const username = await fetchUsernameByUid(user.uid);
          console.log(username);

          if (username) {
            setUserName(username);
          }
        } else {
          setUserName(user.displayName || "user");
        }
      }
      ReadUserData();
    }
  }, [user]);

  useEffect(() => {
    const fetchMeals = async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/recipe/${params.detail}`,
        {
          cache: "no-store",
        }
      );

      const responseobj = await response.json();
      const detailinfo = responseobj.data;
      setEmail(detailinfo.email);
      setTitle(detailinfo.title);
      setSummary(detailinfo.summary);
      setRecipe(detailinfo.recipe);
      setDetailInfo(detailinfo);
    };

    fetchMeals();
  }, [params.detail]);

  const isselect = (isselected) => {
    setImageSelect(isselected);
    if (isselected === false) {
      alert("이미지를 선택해주세요!");
    }
  };

  async function editrecipeHD(data) {
    data.preventDefault();
    const MealData = new FormData(data.target);
    const imagefile = MealData.get("image");
    console.log(data);
    const imageurl = await uploadImage(imagefile);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/recipe/${params.detail}`,
        {
          method: "PUT",
          body: JSON.stringify({
            name: userName,
            title: title,
            email: email,
            summary: summary,
            recipe: recipe,
            image: imageurl || null,
            like: detailinfo.like,
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

  function onclose() {
    setIsModal(false);
  }

  function editqus(e) {
    setIsModal(true);
  }

  function editbtnHD() {
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
                  onChange={(e) => setCreator(e.target.value)}
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
              <label htmlFor="title">음식이름</label>
              <input
                type="text"
                name="title"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              ></input>
            </div>

            <div className={style.row3}>
              <label htmlFor="summary">음식설명</label>
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
                type="text"
                name="recipe"
                id="recipe"
                rows="15"
                value={recipe}
                onChange={(e) => setRecipe(e.target.value)}
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
                    onClick={editbtnHD}
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
