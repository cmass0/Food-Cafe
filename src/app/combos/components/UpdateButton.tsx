"use client";
import ComfirmModal from "@/lib/ui/comfirmmodal";
import { useRouter } from "next/navigation";

export default function ComboUpdateButton({ id }: { id: string }) {
  const router = useRouter();
  const editRouteHandler = () => {
    router.push(`/combos/edit?id=${id}`);
  };
  return (
    <ComfirmModal
      btnText="수정"
      comfirmText={<>레시피 조합 수정을 진행하시겠습니까?</>}
      content="레시피 조합 수정을 원하시면 확인 버튼을 눌러주세요."
      comfirmtype="수정"
      oncomfirm={() => {
        editRouteHandler();
      }}
      triggerClassName="bg-green-500 text-white hover:bg-green-600"
      comfirmClassName="bg-green-500 text-white hover:bg-green-600"
    />
  );
}
