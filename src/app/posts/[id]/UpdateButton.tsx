"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type UpdatateButtonProps = {
  id: string;
};

export default function UpdateButton({ id }: UpdatateButtonProps) {
  const router = useRouter();
  function handleClick() {
    router.push(`/posts/new?id=${id}`);
  }
  return <Button onClick={handleClick}>수정</Button>;
}
