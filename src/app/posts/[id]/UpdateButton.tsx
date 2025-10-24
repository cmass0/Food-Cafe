"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type UpdatateButtonProps = {
  id: string;
};

export default function UpdateButton({ id }: UpdatateButtonProps) {
  const router = useRouter();
  function handleClick() {
    router.push(`/posts/edit?id=${id}`);
  }
  return (
    <Button className="mb-0" onClick={handleClick}>
      수정
    </Button>
  );
}
