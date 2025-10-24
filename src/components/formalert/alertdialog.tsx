import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";
type AlertDialogComponentProps = {
  des: string;
  title: string;
  action: ReactNode;
  onaction?: () => void;
  formid: string;
  showText: string;
};
export function AlertDialogComponent({
  showText,
  des,
  title,
  action,
  formid,
}: AlertDialogComponentProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className=" cursor-pointer">
          {showText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{des}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className=" cursor-pointer">취소</AlertDialogCancel>

          <button className=" cursor-pointer" type="submit" form={formid}>
            {action}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
