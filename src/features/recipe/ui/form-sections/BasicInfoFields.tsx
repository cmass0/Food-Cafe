import { type Dispatch, type SetStateAction } from "react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type UseFormReturn } from "react-hook-form";
import { type FormValues } from "../../types";

type BasicInfoFieldsProps = {
  form: UseFormReturn<FormValues>;
  tagsInput: string;
  setTagsInput: Dispatch<SetStateAction<string>>;
  normalizeTags: (text: string) => string[];
};

export function BasicInfoFields({ form, tagsInput, setTagsInput, normalizeTags }: BasicInfoFieldsProps) {
  return (
    <div className="space-y-4 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">기본 정보</h3>
        <span className="text-xs text-muted-foreground">제목 · 카테고리 · 태그 · 난이도/시간/인분</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>레시피 제목</FormLabel>
              <FormControl>
                <Input placeholder="예) 10분 완성 새우 파스타" {...field} />
              </FormControl>
              <FormDescription>검색이 잘 되도록 핵심 키워드를 넣어 주세요.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>난이도 (선택)</FormLabel>
              <FormControl>
                <Select value={field.value ?? ""} onValueChange={(val) => field.onChange(val || null)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="난이도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="쉬움">쉬움</SelectItem>
                      <SelectItem value="보통">보통</SelectItem>
                      <SelectItem value="어려움">어려움</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>소요 시간 (분, 선택)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="예) 30"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="servings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>인분 (선택)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  placeholder="예) 2"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리 (선택)</FormLabel>
              <FormControl>
                <Select value={field.value ?? ""} onValueChange={(val) => field.onChange(val)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="한식">한식</SelectItem>
                      <SelectItem value="중식">중식</SelectItem>
                      <SelectItem value="일식">일식</SelectItem>
                      <SelectItem value="양식">양식</SelectItem>
                      <SelectItem value="분식">분식</SelectItem>
                      <SelectItem value="디저트">디저트</SelectItem>
                      <SelectItem value="기타">기타</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>태그 (콤마 구분)</FormLabel>
              <FormControl>
                <Input
                  placeholder="예) 10분, 칼칼한, 술안주"
                  value={tagsInput}
                  onChange={(event) => {
                    const next = event.target.value;
                    setTagsInput(next);
                    field.onChange(normalizeTags(next));
                  }}
                />
              </FormControl>
              <FormDescription>최대 20개까지 입력할 수 있어요.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
