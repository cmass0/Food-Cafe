"use client";
import { Button } from "@/components/ui/button";
import { FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRecipe } from "@/domain/recipe/api";

import { Recipe } from "@/domain/recipe/types";
import Image from "next/image";
import React, { ChangeEvent } from "react";
import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { ComboFormValues } from "../../types";

type CombinationFieldsProps = {
  itemsArray: UseFieldArrayReturn<ComboFormValues, "items">;
  form: UseFormReturn<ComboFormValues>;
};

export default function CombinationFields({ itemsArray, form }: CombinationFieldsProps) {
  const [tabValue, setTabValue] = React.useState<"product" | "recipe">("product");
  const [imgPreview, setImagePreview] = React.useState<Record<string, string>>({});
  const [recipeRef, setRecipeRef] = React.useState<Record<string, Recipe>>({});

  const fetchRecipeByid = async (input: string, index: number) => {
    const id = parseComboId(input);
    if (!id) return null;
    form.setValue(`items.${index}.recipeid`, id, {
      shouldDirty: true,
      shouldValidate: true,
    });
    const req = await getRecipe(id);
    form.setValue(`items.${index}.image`, req.image ?? null, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue(`items.${index}.summary`, req.summary ?? undefined, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setRecipeRef((prev) => ({ ...prev, [id]: req }));
  };

  const parseComboId = (input: string) => {
    const parts = input.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    if (!id) return null;
    return id;
  };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, itemId: string, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview((prev) => ({ ...prev, [itemId]: url }));
      form.setValue(`items.${index}.image`, file, { shouldDirty: true, shouldValidate: true });
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4 ">
      <FormField
        control={form.control}
        name="items"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center space-x-4">
              <Tabs defaultValue={tabValue}>
                <TabsList className="gap-5">
                  <TabsTrigger
                    className="cursor-pointer rounded-md"
                    value="product"
                    onClick={() => {
                      setTabValue("product");
                    }}
                  >
                    Product
                  </TabsTrigger>

                  <TabsTrigger
                    className="cursor-pointer rounded-md"
                    value="recipe"
                    onClick={() => {
                      setTabValue("recipe");
                    }}
                  >
                    Recipe
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div> 유형을 선택해주세요</div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={itemsArray.fields.length >= 10}
              onClick={() =>
                itemsArray.append(
                  tabValue === "product"
                    ? { type: "product", productName: "", summary: "", image: null }
                    : { type: "recipe", recipeid: "", summary: "" }
                )
              }
            >
              단계 추가
            </Button>
            {itemsArray.fields.map((item, index) => (
              <div key={item.id} className="mb-2 rounded border  p-2">
                <div>
                  {/* 외부 제품 및 브랜드  */}
                  {item.type === "product" ? (
                    <FormField
                      control={form.control}
                      name={`items.${index}.productName`}
                      render={({ field }) => {
                        // 필드 값 가져오기
                        const productName = form.getValues(`items.${index}.productName`);
                        const summary = form.getValues(`items.${index}.summary`);
                        return (
                          <FormItem className="flex flex-col md:flex-row justify-between w-full pt-4 pb-4 ">
                            <div className="space-y-5">
                              <Input
                                type="file"
                                onChange={(e) => handleFileChange(e, item.id, index)}
                              ></Input>
                              <Input placeholder="제품명" {...field} />
                              <Input
                                placeholder="요약"
                                {...form.register(`items.${index}.summary`)}
                              />
                            </div>
                            {/* 미리보기 field */}
                            <div className="space-y-5 rounded-md border border-muted-foreground/30 bg-background p-4 shadow-lg  w-[300px] h-[270px] ">
                              <div className="relative h-[150px] w-[200px] border-[2px] ">
                                {imgPreview[item.id] ? (
                                  <Image
                                    className="rounded-md "
                                    src={imgPreview[item.id] || ""}
                                    alt="previewimg"
                                    fill
                                  ></Image>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                    이미지가 존재하지 않습니다
                                  </div>
                                )}
                              </div>

                              <div className="text-sm text-muted-foreground font-sans-serif w-[260px] h-[20px] overflow-hidden truncate">
                                {productName
                                  ? `${productName}`
                                  : "제품명을 입력하면 미리보기가 나옵니다."}
                              </div>
                              <div className="text-sm text-muted-foreground font-sans-serif font-sans  w-[260px] h-[20px] overflow-hidden truncate">
                                {summary ? `${summary}` : "요약을 입력하면 미리보기가 나옵니다."}
                              </div>
                            </div>
                          </FormItem>
                        );
                      }}
                    />
                  ) : (
                    // 사이트 레시피 참조
                    <FormField
                      control={form.control}
                      name={`items.${index}.recipeid`}
                      render={({ field }) => (
                        <FormItem className="flex flex-col md:flex-row justify-between w-full py-5">
                          <div className="space-y-5">
                            <Input placeholder="레시피 ID" {...field} />
                            <Button
                              type="button"
                              onClick={() => fetchRecipeByid(field.value, index)}
                            >
                              레시피 가져오기
                            </Button>
                          </div>
                          <div className="space-y-5 rounded-md border border-muted-foreground/30 bg-background p-4 shadow-lg w-[300px] h-[250px]">
                            {recipeRef[field.value] ? (
                              <div className="mt-2 space-y-5 ">
                                <Image
                                  className="rounded-lg"
                                  src={recipeRef[field.value]?.image || ""}
                                  alt={recipeRef[field.value]?.title || "recipe image"}
                                  width={170}
                                  height={200}
                                />
                                <div className="text-sm text-muted-foreground font-sans-serif font-sans w-[260px] h-[20px] overflow-hidden truncate">
                                  레시피명: {recipeRef[field.value]?.title}
                                </div>
                                <div className="text-sm text-muted-foreground font-sans-serif font-sans w-[260px] h-[20px] overflow-hidden truncate">
                                  설명: {recipeRef[field.value]?.summary}
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                                레시피 정보를 불러와주세요
                              </div>
                            )}
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                  <Button
                    className="rounded-3xl bg-gray-200 hover:bg-[#ff3434] hover:text-stone-100 text-gray-500 border-1"
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      itemsArray.remove(index);
                      setImagePreview((prev) => {
                        const newPreview = { ...prev };
                        delete newPreview[item.id];
                        return newPreview;
                      });
                    }}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            ))}
          </FormItem>
        )}
      />
    </div>
  );
}
