"use client";

import ConfirmModal from "@/components/ConfirmModal";
import { useRouter } from "next/navigation";

type UpdatateButtonProps = {
  id: string;
};

export default function PostUpdateButton({ id }: UpdatateButtonProps) {
  const router = useRouter();
  function handleClick() {
    router.push(`/posts/edit?id=${id}`);
  }
  return (
    <ConfirmModal
      btnText="수정"
      comfirmText={<>게시글 수정을 진행하시겠습니까?</>}
      content="게시글 수정을 원하시면 확인 버튼을 눌러주세요."
      comfirmtype="수정"
      oncomfirm={handleClick}
      triggerClassName="bg-green-500 text-white hover:bg-green-600"
      comfirmClassName="bg-green-500 text-white hover:bg-green-600"
    />
  );
}
