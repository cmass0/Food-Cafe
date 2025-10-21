"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

import ImagePreview from "@/component/imgpreview/imgpreview";
import { auth } from "@/lib/firebase/client";
import { uploadRecipeImage } from "@/lib/storage";
import { fetchUsernameByUid } from "@/features/user/client";
import { createRecipe, updateRecipe } from "@/features/recipe/api";

import style from "./page.module.css";
import { getBrowserSupabase } from "@/lib/supabase";

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
      alert("�̹����� �������ּ���!");
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) {
      alert("�α����� �ʿ��մϴ�.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const imageFile = formData.get("image");
    if (!imageFile) {
      alert("�̹����� �������ּ���!");
      return;
    }
    const supabase = getBrowserSupabase();
    try {
      const created = await createRecipe({
        title: String(formData.get("title") ?? ""),
        summary: formData.get("summary") ? String(formData.get("summary")) : undefined,
        recipe: String(formData.get("recipe") ?? ""),
        image: null,
        writerName: userName,
        writerUid: user.uid,
        writerEmail: formData.get("email") ? String(formData.get("email")) : undefined,
      });
      const { publicUrl, signedUrl } = await uploadRecipeImage(
        supabase,
        created.id,
        imageFile,
        { contentType: imageFile.type, upsert: false }
      );
      const finalUrl = publicUrl ?? signedUrl ?? null;
      await updateRecipe(created.id, { image: finalUrl });
      router.push("/meals");
    } catch (error) {
      console.error("������ ��Ͽ� �����߽��ϴ�.", error);
      alert("�����Ǹ� ������� ���߽��ϴ�. �ٽ� �õ����ּ���.");
    }
  }

  return (
    <div className={style.pagecontainer}>
      <header className={style.header}>
        <h1>���� ����, �����ϴ� ������ �����غ�����</h1>
      </header>
      <main className={style.shareform}>
        <form className={style.form} onSubmit={handleSubmit}>
          <div className={style.formcontentsbox}>
            <div className={style.row1}>
              <div>
                <label htmlFor="creator">�̸�</label>
                <input type="text" name="creator" id="creator" value={userName} readOnly />
              </div>
              <div>
                <label htmlFor="email">E-Mail</label>
                <input type="email" name="email" id="email" />
              </div>
            </div>

            <div className={style.row2}>
              <label htmlFor="title">���� �̸�</label>
              <input type="text" name="title" id="title" required />
            </div>

            <div className={style.row3}>
              <label htmlFor="summary">���� ����</label>
              <input type="text" name="summary" id="summary" maxLength={51} />
            </div>

            <div className={style.row4}>
              <label htmlFor="recipe">������</label>
              <textarea name="recipe" id="recipe" rows={15} required />
            </div>
          </div>
          <ImagePreview name="image" isselect={handleSelect} />
          <button type="submit" className={style.formbtn}>
            �����ϱ�
          </button>
        </form>
      </main>
    </div>
  );
}
