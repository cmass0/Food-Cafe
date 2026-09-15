import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RECIPE_CATEGORIES } from "@/domain/recipe/category";
import { Info } from "lucide-react";
import { type Dispatch, type SetStateAction, useState } from "react";
import { type UseFormReturn } from "react-hook-form";
import { type FormValues } from "@/domain/recipe/types";
import { difficultyLabels, getDifficultyMeta } from "@/domain/recipe/difficulty";
import { MAX_RECIPE_TAGS, MAX_RECIPE_TOOLS } from "@/domain/recipe/schema";

type BasicInfoFieldsProps = {
  form: UseFormReturn<FormValues>;
  tagsInput: string;
  setTagsInput: Dispatch<SetStateAction<string>>;
  normalizeTags: (text: string) => string[];
  toolsInput: string;
  setToolsInput: Dispatch<SetStateAction<string>>;
  normalizeTools: (text: string) => string[];
};

export function BasicInfoFields({
  form,
  tagsInput,
  setTagsInput,
  normalizeTags,
  toolsInput,
  setToolsInput,
  normalizeTools,
}: BasicInfoFieldsProps) {
  const currentMinutes = form.watch("time_minutes");
  const initialUnit: "minutes" | "hours" =
    typeof currentMinutes === "number" && currentMinutes >= 60 ? "hours" : "minutes";
  const [timeUnit, setTimeUnit] = useState<"minutes" | "hours">(initialUnit);
  const currentDifficulty = getDifficultyMeta(form.watch("difficulty"));

  const getDisplayValue = () => {
    if (typeof currentMinutes !== "number") return "";
    if (timeUnit === "minutes") return currentMinutes;
    return Math.max(0, Math.round(currentMinutes / 60));
  };

  const displayMinutes = getDisplayValue();

  return (
    <div className="space-y-4 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">기본 정보</h3>
        <span className="text-xs text-muted-foreground">
          제목 · 카테고리 · 태그 · 난이도/시간/인분
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>레시피 제목</FormLabel>
              <FormControl>
                <Input placeholder="예) 10분 완성 새우 크림 파스타" {...field} />
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
              <div className="flex items-center gap-2">
                <FormLabel className="mb-0">난이도 (선택)</FormLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-black transition hover:text-foreground"
                        aria-label="난이도 안내"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs leading-relaxed bg-[#d8d8d8] ">
                      <div className="font-semibold text-foreground">설명</div>
                      <p className=" text-black ">
                        {currentDifficulty?.description ?? "난이도를 선택하면 설명이 보여요."}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select
                value={field.value ?? ""}
                onValueChange={(val) => field.onChange(val || null)}
              >
                <FormControl>
                  <SelectTrigger ref={field.ref} onBlur={field.onBlur} className="w-[180px]">
                    <SelectValue placeholder="난이도 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {difficultyLabels.map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>소요 시간 (분 기준, 선택)</FormLabel>
              <Tabs
                value={timeUnit}
                onValueChange={(val) => setTimeUnit(val as "minutes" | "hours")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="minutes">분 단위</TabsTrigger>
                  <TabsTrigger value="hours">시간 단위</TabsTrigger>
                </TabsList>
                <TabsContent value="minutes">
                  <FormControl>
                    <Input
                      ref={field.ref}
                      onBlur={field.onBlur}
                      name={field.name}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="예) 30"
                      value={timeUnit === "minutes" ? displayMinutes : ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                      }
                    />
                  </FormControl>
                </TabsContent>
                <TabsContent value="hours">
                  <FormControl>
                    <Input
                      ref={field.ref}
                      onBlur={field.onBlur}
                      name={field.name}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="예) 1"
                      value={timeUnit === "hours" ? displayMinutes : ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? 0 : Number(e.target.value) * 60)
                      }
                    />
                  </FormControl>
                </TabsContent>
              </Tabs>
              {typeof field.value === "number" && field.value > 0 ? (
                <p className="text-xs text-muted-foreground">
                  현재 설정: {field.value}분 (≈ {Math.round((field.value / 60) * 10) / 10}시간)
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="servings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>인분 (필수)</FormLabel>
              <FormControl>
                <Input
                  ref={field.ref}
                  onBlur={field.onBlur}
                  name={field.name}
                  type="number"
                  min="1"
                  max="50"
                  step="1"
                  placeholder="예) 2"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? 0 : Number(e.target.value))
                  }
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
              <Select value={field.value ?? ""} onValueChange={(val) => field.onChange(val)}>
                <FormControl>
                  <SelectTrigger ref={field.ref} onBlur={field.onBlur} className="w-[180px]">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {RECIPE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>태그 (콤마(,)로 구분 해주세요)</FormLabel>
              <FormControl>
                <Input
                  placeholder="예) 10분, 칼칼한, 술안주"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  name={field.name}
                  value={tagsInput}
                  onChange={(event) => {
                    const next = event.target.value;
                    setTagsInput(next);
                    field.onChange(normalizeTags(next));
                  }}
                />
              </FormControl>
              <FormDescription>최대 {MAX_RECIPE_TAGS}개까지 입력할 수 있어요.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tools"
          render={({ field }) => (
            <FormItem>
              <FormLabel>조리도구 (콤마(,)로 구분 해주세요)</FormLabel>
              <FormControl>
                <Input
                  placeholder="팬, 냄비, 에어프라이어"
                  ref={field.ref}
                  onBlur={field.onBlur}
                  name={field.name}
                  value={toolsInput}
                  onChange={(event) => {
                    const next = event.target.value;
                    setToolsInput(next);
                    field.onChange(normalizeTools(next));
                  }}
                />
              </FormControl>
              <FormDescription>
                최대 {MAX_RECIPE_TOOLS}개까지 입력할 수 있으며, 필요하지 않으면 비워두세요.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
