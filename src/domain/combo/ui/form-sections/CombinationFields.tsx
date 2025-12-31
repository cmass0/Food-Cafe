"use client";
import { Button } from "@/components/ui/button";
import { FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TabsList } from "@/components/ui/tabs";
import { getRecipe } from "@/domain/recipe/api";
import { Tabs, TabsTrigger } from "@radix-ui/react-tabs";
import Image from "next/image";
import React from "react";
import { UseFieldArrayReturn, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { ComboFormSchema } from "../../schema";
import { ComboRow } from "../../types";

type CombinationFieldsProps = {
  itemsArray: UseFieldArrayReturn<z.infer<typeof ComboFormSchema>, "items">;
  form: UseFormReturn<z.infer<typeof ComboFormSchema>>;
};

export default function CombinationFields({ itemsArray, form }: CombinationFieldsProps) {
  const [tabValue, setTabValue] = React.useState<"product" | "recipe">("product");
  const [imgPreview, setImagePreview] = React.useState<Record<string, string>>({});
  const [ComboRef, setComboRef] = React.useState<Record<string, ComboRow>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview((prev) => ({ ...prev, [id]: url }));
    }
  };

  const fetchRecipeByid = async (recipeid: string) => {
    console.log("fetching recipe for id:", recipeid);
    const req = await getRecipe(recipeid);
    setComboRef((prev) => ({ ...prev, [recipeid]: req }));
  };

  return (
    <div className="space-y-3 rounded-lg border border-muted-foreground/20 bg-muted/40 p-4">
      <FormField
        control={form.control}
        name="items"
        render={({ field }) => (
          <FormItem>
            <Tabs defaultValue={tabValue}>
              <TabsList className="gap-5">
                <TabsTrigger
                  value="product"
                  onClick={() => {
                    setTabValue("product");
                  }}
                >
                  Product
                </TabsTrigger>
                |
                <TabsTrigger
                  value="recipe"
                  onClick={() => {
                    setTabValue("recipe");
                  }}
                >
                  Recipe
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={itemsArray.fields.length >= 15}
              onClick={() =>
                itemsArray.append(
                  tabValue === "product"
                    ? { type: "product", productName: "", summary: "", image: "" }
                    : { type: "recipe", recipeid: "", summary: "" }
                )
              }
            >
              단계 추가
            </Button>
            {itemsArray.fields.map((item, index) => (
              <div key={item.id} className="mb-2 rounded border p-2">
                <div className="flex justify-between">
                  {item.type === "product" ? (
                    <FormField
                      control={form.control}
                      name={`items.${index}.productName`}
                      render={({ field }) => (
                        <FormItem>
                          <Input placeholder="제품명" {...field} />

                          <Input type="file" onChange={(e) => handleFileChange(e, item.id)}></Input>
                          {imgPreview[item.id] && (
                            <Image
                              src={imgPreview[item.id] || ""}
                              alt="previewimg"
                              width={100}
                              height={100}
                            ></Image>
                          )}
                          <Input placeholder="요약" {...form.register(`items.${index}.summary`)} />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name={`items.${index}.recipeid`}
                      render={({ field }) => (
                        <FormItem>
                          <Input placeholder="레시피 ID" {...field} />
                          <Button type="button" onClick={() => fetchRecipeByid(field.value)}>
                            레시피 가져오기
                          </Button>
                          {ComboRef[field.value] && (
                            <div className="mt-2">
                              <Image
                                src={ComboRef[field.value]?.image || ""}
                                alt={ComboRef[field.value]?.title || "recipe image"}
                                width={100}
                                height={100}
                              />
                              <div>레시피명: {ComboRef[field.value]?.title}</div>
                              <div>설명: {ComboRef[field.value]?.summary}</div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  )}
                  <Button
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
