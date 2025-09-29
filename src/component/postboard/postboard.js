"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  Button,
  Pagination,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { Eye, Plus, Search } from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";

import { auth } from "@/lib/firebase/client";
import Modal from "../modal/modal";
import style from "./postboard.module.css";

const PAGE_SIZE = 10;

const SEARCH_OPTIONS = [
  { value: "title", label: "제목" },
  { value: "writer", label: "작성자" },
  { value: "title_writer", label: "제목 + 작성자" },
];

function getTimestamp(value) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value);
  const time = parsed.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatDate(value) {
  if (!value) return "-";

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  return "-";
}

export default function BoardMain({ data = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user] = useAuthState(auth);

  const initialPage = useMemo(() => {
    const raw = Number(searchParams.get("page") ?? "1");
    if (Number.isNaN(raw) || raw < 1) return 1;
    return Math.floor(raw);
  }, [searchParams]);

  const [page, setPage] = useState(initialPage);
  const [searchField, setSearchField] = useState(SEARCH_OPTIONS[0].value);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedTerm, setAppliedTerm] = useState("");
  const [appliedField, setAppliedField] = useState(SEARCH_OPTIONS[0].value);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (initialPage !== page) {
      setPage(initialPage);
    }
  }, [initialPage, page]);

  const orderedPosts = useMemo(() => {
    return [...data]
      .filter(Boolean)
      .sort((a, b) => getTimestamp(b?.createdAt ?? b?.date) - getTimestamp(a?.createdAt ?? a?.date));
  }, [data]);

  const normalizedTerm = appliedTerm.trim().toLowerCase();

  const filteredPosts = useMemo(() => {
    if (!normalizedTerm) return orderedPosts;

    return orderedPosts.filter((post) => {
      const title = `${post?.title ?? ""}`.toLowerCase();
      const writer = `${post?.writer ?? post?.writerName ?? ""}`.toLowerCase();

      switch (appliedField) {
        case "writer":
          return writer.includes(normalizedTerm);
        case "title_writer":
          return title.includes(normalizedTerm) || writer.includes(normalizedTerm);
        case "title":
        default:
          return title.includes(normalizedTerm);
      }
    });
  }, [orderedPosts, normalizedTerm, appliedField]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const currentSlice = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPosts.slice(start, start + PAGE_SIZE);
  }, [filteredPosts, page]);

  const updatePageQuery = useCallback(
    (nextPage) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextPage <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(nextPage));
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handlePageChange = useCallback(
    (next) => {
      setPage(next);
      updatePageQuery(next);
    },
    [updatePageQuery]
  );

  const handleSearchSubmit = useCallback(
    (event) => {
      event.preventDefault();
      setAppliedTerm(searchQuery);
      setAppliedField(searchField);
      handlePageChange(1);
    },
    [searchQuery, searchField, handlePageChange]
  );

  const handleSearchReset = useCallback(() => {
    setSearchQuery("");
    setAppliedTerm("");
    setAppliedField(SEARCH_OPTIONS[0].value);
    handlePageChange(1);
  }, [handlePageChange]);

  const handleWriteClick = useCallback(() => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    router.push("/commu/writeform");
  }, [router, user]);

  const closeModal = useCallback(() => {
    setShowLoginModal(false);
  }, []);

  const incrementView = useCallback(async (id) => {
    if (!id) return;

    try {
      const response = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checkIncrement: true }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "increment failed");
      }
    } catch (error) {
      console.error("Failed to record view count", error);
    }
  }, []);

  const totalCount = filteredPosts.length;
  const rangeStart = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalCount);
  const shouldShowNotice = page === 1;

  return (
    <div className={style.container}>
      <header className={style.header}>
        <div className={style.headerTop}>
          <div className={style.titleGroup}>
            <h1 className={style.title}>커뮤니티</h1>
            <p className={style.subtitle}>
              레시피 팁과 일상을 공유하고 다양한 셰프들과 소통해 보세요.
            </p>
          </div>
          <Button
            color="primary"
            radius="sm"
            size="md"
            startContent={<Plus size={18} />}
            onPress={handleWriteClick}
          >
            새 글 작성
          </Button>
        </div>

        <form className={style.searchForm} onSubmit={handleSearchSubmit}>
          <label className={style.searchSelectWrapper}>
            <span className="sr-only">검색 대상 선택</span>
            <select
              value={searchField}
              onChange={(event) => setSearchField(event.target.value)}
              className={style.searchSelect}
            >
              {SEARCH_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className={style.searchInputWrapper}>
            <Search size={16} className={style.searchIcon} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={style.searchInput}
              placeholder="검색어를 입력해 주세요"
              aria-label="게시글 검색어"
            />
          </div>

          <Button color="primary" radius="sm" type="submit">
            검색
          </Button>
          {appliedTerm && (
            <Button
              variant="light"
              radius="sm"
              onPress={handleSearchReset}
              className={style.resetButton}
            >
              초기화
            </Button>
          )}
        </form>
      </header>

      {totalCount === 0 ? (
        <div className={style.emptyState}>
          <h3 className={style.emptyTitle}>검색 결과가 없습니다.</h3>
          <p className={style.emptyDescription}>
            다른 키워드로 다시 검색하거나 새로운 게시글을 작성해 보세요.
          </p>
        </div>
      ) : (
        <section className={style.tableWrapper}>
          <Table
            aria-label="커뮤니티 게시글 목록"
            removeWrapper
            shadow="none"
            className={style.table}
          >
            <TableHeader>
              <TableColumn key="number" align="center">
                번호
              </TableColumn>
              <TableColumn key="title">제목</TableColumn>
              <TableColumn key="writer">작성자</TableColumn>
              <TableColumn key="date">작성일</TableColumn>
              <TableColumn key="views" align="center">
                조회
              </TableColumn>
            </TableHeader>
            <TableBody emptyContent="게시글이 없습니다.">
              {shouldShowNotice && (
                <TableRow key="notice" className={`${style.row} ${style.noticeRow}`}>
                  <TableCell className={style.cellNumber}>공지</TableCell>
                  <TableCell className={style.cellTitle}>게시판 이용 규칙</TableCell>
                  <TableCell className={style.cellWriter}>admin</TableCell>
                  <TableCell className={style.cellDate}>{formatDate("2024-04-04")}</TableCell>
                  <TableCell className={style.cellViews}>-</TableCell>
                </TableRow>
              )}
              {currentSlice.map((post) => {
                const id = post?.id ?? post?._id ?? String(post?.number ?? "");
                return (
                  <TableRow key={id} className={style.row}>
                    <TableCell className={style.cellNumber}>{post?.number ?? "-"}</TableCell>
                    <TableCell className={style.cellTitle}>
                      <Link
                        href={`/commu/${id}`}
                        className={style.titleLink}
                        onClick={() => incrementView(id)}
                      >
                        {post?.title ?? "제목 없음"}
                      </Link>
                    </TableCell>
                    <TableCell className={style.cellWriter}>
                      {post?.writer ?? post?.writerName ?? "익명"}
                    </TableCell>
                    <TableCell className={style.cellDate}>{formatDate(post?.createdAt ?? post?.date)}</TableCell>
                    <TableCell className={style.cellViews}>
                      <Eye size={16} className={style.cellViewsIcon} />
                      {post?.check ?? post?.viewCount ?? 0}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>
      )}

      <footer className={style.footer}>
        <div className={style.resultsMeta}>
          <span className={style.countBadge}>
            {totalCount === 0
              ? "게시글이 없습니다."
              : `${rangeStart}-${rangeEnd} / 총 ${totalCount}건`}
          </span>
        </div>
        {totalCount > 0 && (
          <Pagination
            total={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            radius="sm"
            showControls
            className={style.pagination}
          />
        )}
      </footer>

      {showLoginModal && (
        <Modal onclose={closeModal}>
          <div className={style.modalCard}>
            <button type="button" className={style.modalClose} onClick={closeModal}>
              X
            </button>
            <h3 className={style.modalTitle}>로그인이 필요합니다</h3>
            <p className={style.modalDescription}>
              게시글을 작성하려면 로그인을 진행해 주세요.
            </p>
            <div className={style.modalActions}>
              <Button color="primary" radius="sm" onPress={closeModal}>
                확인
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
