"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardBody, CardFooter, CardHeader, Button, Chip } from "@heroui/react";
import { Eye, Heart } from "lucide-react";
import style from "./recipe.module.css";

export default function Recipe({ data }) {
  const likeLabel = data.likeCount ?? data.like ?? 0;
  const viewLabel = data.viewCount ?? data.check ?? 0;
  const writerName = data.writerName ?? data.name ?? "";
  const imageSrc = data.image ?? (Array.isArray(data.images) ? data.images[0] : null);

  return (
    <Card shadow="lg" radius="lg" className={style.card} isPressable>
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
      <CardBody className={style.body}>
        <span className={style.writer}>{writerName || "익명 셰프"}</span>
        <h3 className={style.title}>{data.title}</h3>
        <p className={style.summary}>{data.summary || "설명이 준비되지 않았습니다."}</p>
      </CardBody>
      <CardFooter className={style.footer}>
        <div className={style.metrics}>
          <Chip
            className={style.metricChip}
            startContent={<Heart size={14} />}
            variant="flat"
            radius="full"
            size="sm"
          >
            {likeLabel}
          </Chip>
          <Chip
            className={style.metricChip}
            startContent={<Eye size={14} />}
            variant="flat"
            radius="full"
            size="sm"
          >
            {viewLabel}
          </Chip>
        </div>
        <Button
          as={Link}
          href={`/recipes/${data.id}`}
          size="sm"
          color="primary"
          radius="full"
          variant="flat"
        >
          자세히 보기
        </Button>
      </CardFooter>
    </Card>
  );
}

