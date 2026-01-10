"use client";

import ComfirmModal from "@/lib/ui/comfirmmodal";
import { TriangleAlert } from "lucide-react";
import { deletePostAction } from "../actions";

type Props = {
  id: string;
};

export default function PostDeleteButton({ id }: Props) {
  const handleDelete = async () => {
    deletePostAction(id);
  };

  return (
    <ComfirmModal
      btnText="삭제"
      comfirmText={
        <div className="flex items-center gap-2">
          <TriangleAlert className="text-[#f55151]" />
          게시글을 삭제하시겠습니까?
        </div>
      }
      content="게시글을 삭제하면 복구할 수 없습니다. 삭제를 원하시면 확인 버튼을 눌러주세요."
      comfirmtype="삭제"
      oncomfirm={handleDelete}
      triggerClassName="bg-red-400 text-white hover:bg-red-500"
      comfirmClassName="bg-red-400 text-white hover:bg-red-500"
    />
  );
}
