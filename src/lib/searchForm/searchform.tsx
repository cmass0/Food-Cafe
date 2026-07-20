"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

type Props<TField extends string> = {
  // 검색된 텍스트와 필드를 폼 제출 시 전달하는 핸들러
  searchHandler: (
    e: React.FormEvent<HTMLFormElement>,
    searchText: string,
    searchField: TField
  ) => void;
  searchoptions: { value: TField; label: string }[]; // 검색 필드 옵션
  searchQuery?: string; // 검색 텍스트
  searchFieldQuery?: TField; // 선택한 검색 필드
  placeholder?: string;
  className?: string;
  containerClassName?: string;
  selectTriggerClassName?: string;
  inputClassName?: string;
  submitClassName?: string;
};

export default function SearchForm<TField extends string>({
  searchHandler,
  searchoptions,
  searchQuery,
  searchFieldQuery,
  placeholder,
  className,
  containerClassName,
  selectTriggerClassName,
  inputClassName,
  submitClassName,
}: Props<TField>) {
  const initialField = searchFieldQuery ?? searchoptions[0]?.value ?? ("title" as TField);
  const [searchField, setSearchField] = useState<TField>(initialField);
  const [searchText, setSearchText] = useState(searchQuery ?? "");

  // searchQuery prop이 변경될 때 searchText 상태 업데이트
  useEffect(() => {
    setSearchText(searchQuery ?? "");
  }, [searchQuery]);

  useEffect(() => {
    if (searchFieldQuery) {
      setSearchField(searchFieldQuery);
    }
  }, [searchFieldQuery]);

  return (
    <form
      onSubmit={(e) => searchHandler(e, searchText, searchField)}
      className={cn("w-full sm:w-auto", className)}
    >
      <div
        className={cn(
          "flex h-12 w-full max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm",
          containerClassName
        )}
      >
        <Select value={searchField} onValueChange={(value) => setSearchField(value as TField)}>
          <SelectTrigger
            className={cn(
              "h-12 w-32 rounded-none border-0 border-r border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-800",
              selectTriggerClassName
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-32 text-sm">
            {searchoptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-1 items-center gap-2 px-3">
          <Input
            value={searchText}
            placeholder={placeholder}
            className={cn(
              "h-full w-full border-0 bg-transparent px-0 text-sm shadow-none outline-none placeholder:text-zinc-400 focus-visible:ring-0",
              inputClassName
            )}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className={cn("h-full w-9 shrink-0 rounded-none text-gray-500", submitClassName)}
            aria-label="검색"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}
