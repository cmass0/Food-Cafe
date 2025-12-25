"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import style from "./recipe.module.css";
import { Recipe } from "@/features/recipe/types";

export default function RecipeCard({ data }: { data: Recipe }) {
  const likeLabel = data.likeCount ?? data.likeCount ?? 0;
  const viewLabel = data.viewCount ?? data.viewCount ?? 0;
  const writerName = data.writerName ?? data.writerName ?? "";
  const imageSrc = data.image ?? data.image ?? "";

  return (
    <Card className={style.card}>
      <CardHeader className={style.header}>
        {imageSrc ? (
          <div className={style.imageWrapper}>
            <Image
              src={imageSrc}
              alt={data.title || "recipe"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={style.image}
            />
          </div>
        ) : (
          <div className={style.imageFallback}>이미지가 존재하지 않습니다.</div>
        )}
      </CardHeader>
      <CardContent className={style.body}>
        <span className={style.writer}>{writerName || "익명 셰프"}</span>
        <h3 className={style.title}>{data.title}</h3>
        <p className={style.summary}>{data.summary || "설명이 준비되지 않았습니다."}</p>
      </CardContent>
      <CardFooter className={style.footer}>
        <div className={style.metrics}>
          <Badge variant="secondary" className={style.metricChip}>
            <Heart size={14} />
            {likeLabel}
          </Badge>
          <Badge variant="secondary" className={style.metricChip}>
            <Eye size={14} />
            {viewLabel}
          </Badge>
        </div>
        <Button asChild size="sm">
          <Link href={`/recipes/${data.id}`}>자세히 보기</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
