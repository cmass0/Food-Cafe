"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
};

export default function SearchForm<TField extends string>({
  searchHandler,
  searchoptions,
  searchQuery,
  searchFieldQuery,
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
    <form onSubmit={(e) => searchHandler(e, searchText, searchField)} className="w-full sm:w-auto">
      <div className="flex w-full max-w-md overflow-hidden rounded-md border">
        <Select value={searchField} onValueChange={(value) => setSearchField(value as TField)}>
          <SelectTrigger className="w-32 rounded-none border-0 border-r px-3 py-2 text-sm">
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
          <input
            value={searchText}
            className="w-full border-0 text-sm outline-none"
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button type="submit" className="text-gray-500">
            <Search className="h-4 w-4 cursor-pointer" />
          </button>
        </div>
      </div>
    </form>
  );
}
