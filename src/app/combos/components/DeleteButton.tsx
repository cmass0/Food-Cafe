"use client"

import ConfirmModal from "@/components/ConfirmModal";
import { TriangleAlert } from "lucide-react";
import { deleteComboAction } from "../actions";

export default function ComboDeleteButton({ id }: { id: string }) {
  const handleDelete = () => {
    deleteComboAction(id);
  };

  return (
    <ConfirmModal
      btnText="삭제"
      comfirmText={
        <div className="flex items-center gap-2">
          <TriangleAlert className="text-[#f55151]" />
          레시피를 삭제하시겠습니까?
        </div>
      }
      content="레시피 조합을 삭제하면 복구할 수 없습니다. 삭제를 원하시면 확인 버튼을 눌러주세요."
      comfirmtype="삭제"
      oncomfirm={handleDelete}
      triggerClassName="bg-red-400 text-white hover:bg-red-500"
      comfirmClassName="bg-red-400 text-white hover:bg-red-500"
    />
  );
}
