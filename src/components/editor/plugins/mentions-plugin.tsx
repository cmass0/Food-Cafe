"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  MenuOption,
  type MenuTextMatch,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { type TextNode } from "lexical";
import { LoaderCircle } from "lucide-react";
import dynamic from "next/dynamic";
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { $createMentionNode } from "@/components/editor/nodes/mention-node";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { fetchMentionCandidates } from "@/domain/follow/api";
import type { MentionCandidate } from "@/domain/follow/types";

class MentionTypeaheadOption extends MenuOption {
  candidate: MentionCandidate;

  constructor(candidate: MentionCandidate) {
    super(candidate.id);
    this.candidate = candidate;
  }
}

const LexicalTypeaheadMenuPlugin = dynamic(
  () =>
    import("@lexical/react/LexicalTypeaheadMenuPlugin").then(
      (module) => module.LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
    ),
  { ssr: false }
);

const PUNCTUATION = "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
const TRIGGERS = ["@"].join("");
const VALID_CHARS = "[^" + TRIGGERS + PUNCTUATION + "\\s]";
const VALID_JOINS = "(?:" + "\\.[ |$]|" + " |" + "[" + PUNCTUATION + "]|" + ")";
const LENGTH_LIMIT = 75;
const ALIAS_LENGTH_LIMIT = 50;
const MENTION_PAGE_SIZE = 10;
const LOOKUP_DELAY_MS = 250;

const AtSignMentionsRegex = new RegExp(
  "(^|\\s|\\()([" + TRIGGERS + "]((?:" + VALID_CHARS + VALID_JOINS + "){0," + LENGTH_LIMIT + "}))$"
);

const AtSignMentionsRegexAliasRegex = new RegExp(
  "(^|\\s|\\()([" + TRIGGERS + "]((?:" + VALID_CHARS + "){0," + ALIAS_LENGTH_LIMIT + "}))$"
);

type MentionLookupStatus = "idle" | "loading" | "success" | "error";

function appendUniqueCandidates(
  previous: MentionCandidate[],
  next: MentionCandidate[]
): MentionCandidate[] {
  const knownIds = new Set(previous.map((candidate) => candidate.id));
  return [...previous, ...next.filter((candidate) => !knownIds.has(candidate.id))];
}

function useMentionLookupService(mentionString: string | null) {
  const [items, setItems] = useState<MentionCandidate[]>([]);
  const [status, setStatus] = useState<MentionLookupStatus>("idle");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const activeQueryRef = useRef("");
  const requestControllerRef = useRef<AbortController | null>(null);
  const requestTokenRef = useRef(0);
  const loadingRef = useRef(false);

  const loadPage = useCallback(async (query: string, nextPage: number, replace: boolean) => {
    if (!query || loadingRef.current) return;

    const controller = new AbortController();
    const requestToken = ++requestTokenRef.current;
    requestControllerRef.current = controller;
    loadingRef.current = true;
    setStatus("loading");

    try {
      const response = await fetchMentionCandidates(
        query,
        nextPage,
        MENTION_PAGE_SIZE,
        controller.signal
      );
      if (
        controller.signal.aborted ||
        requestTokenRef.current !== requestToken ||
        activeQueryRef.current !== query
      ) {
        return;
      }

      setItems((previous) =>
        replace ? response.items : appendUniqueCandidates(previous, response.items)
      );
      setPage(nextPage);
      setHasMore(response.hasMore);
      setStatus("success");
    } catch (error) {
      if (controller.signal.aborted || requestTokenRef.current !== requestToken) return;
      console.error("멘션 후보 조회 실패", error);
      if (replace) setItems([]);
      setStatus("error");
    } finally {
      if (requestTokenRef.current === requestToken) {
        requestControllerRef.current = null;
        loadingRef.current = false;
      }
    }
  }, []);

  useEffect(() => {
    const query = mentionString?.trim() ?? "";
    activeQueryRef.current = query;
    requestTokenRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    loadingRef.current = false;
    setItems([]);
    setPage(1);
    setHasMore(false);

    if (!query) {
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const timer = window.setTimeout(() => {
      void loadPage(query, 1, true);
    }, LOOKUP_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      requestTokenRef.current += 1;
      requestControllerRef.current?.abort();
      requestControllerRef.current = null;
      loadingRef.current = false;
    };
  }, [loadPage, mentionString]);

  const loadMore = useCallback(() => {
    const query = activeQueryRef.current;
    if (!query || !hasMore || loadingRef.current) return;
    void loadPage(query, page + 1, false);
  }, [hasMore, loadPage, page]);

  const retry = useCallback(() => {
    const query = activeQueryRef.current;
    if (!query || loadingRef.current) return;
    const replace = items.length === 0;
    void loadPage(query, replace ? 1 : page + 1, replace);
  }, [items.length, loadPage, page]);

  return { hasMore, items, loadMore, retry, status };
}

function checkForAtSignMentions(text: string, minMatchLength: number): MenuTextMatch | null {
  let match = AtSignMentionsRegex.exec(text);
  if (match === null) match = AtSignMentionsRegexAliasRegex.exec(text);
  if (match === null) return null;

  const maybeLeadingWhitespace = match[1] ?? "";
  const replaceableString = match[2];
  const matchingString = match[3];
  if (!replaceableString || matchingString === undefined) return null;
  if (matchingString.length < minMatchLength) return null;

  return {
    leadOffset: match.index + maybeLeadingWhitespace.length,
    matchingString,
    replaceableString,
  };
}

function getPossibleQueryMatch(text: string): MenuTextMatch | null {
  return checkForAtSignMentions(text, 1);
}

function profileInitial(displayName: string): string {
  return displayName.trim().slice(0, 1).toUpperCase() || "U";
}

function LookupMessage({ status, onRetry }: { status: MentionLookupStatus; onRetry: () => void }) {
  const message =
    status === "error"
      ? "후보를 불러오지 못했습니다."
      : status === "success"
        ? "일치하는 팔로잉이 없습니다."
        : "팔로잉을 검색하는 중입니다.";

  return (
    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
      <p role={status === "error" ? "alert" : "status"}>{message}</p>
      {status === "error" ? (
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          다시 시도
        </Button>
      ) : null}
    </div>
  );
}

export function MentionsPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = useState<string | null>(null);
  const { hasMore, items, loadMore, retry, status } = useMentionLookupService(queryString);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", { minLength: 0 });

  const options = useMemo(
    () => items.map((candidate) => new MentionTypeaheadOption(candidate)),
    [items]
  );

  useEffect(() => {
    const root = scrollContainerRef.current;
    const sentinel = loadMoreSentinelRef.current;
    if (!root || !sentinel || !hasMore || status === "loading" || status === "error") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { root, rootMargin: "0px 0px 80px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, status]);

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void
    ) => {
      editor.update(() => {
        const { id, display_name: displayName } = selectedOption.candidate;
        const mentionNode = $createMentionNode(displayName, id);
        if (nodeToReplace) nodeToReplace.replace(mentionNode);
        mentionNode.select();
        closeMenu();
      });
    },
    [editor]
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
      if (checkForSlashTriggerMatch(text, editor) !== null) return null;
      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor]
  );

  return (
    <LexicalTypeaheadMenuPlugin
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForMentionMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex }
      ) => {
        if (!anchorElementRef.current || queryString === null) return null;

        return createPortal(
          <div className="fixed z-10 w-64 rounded-md shadow-md">
            <Command shouldFilter={false}>
              <CommandList ref={scrollContainerRef} aria-busy={status === "loading"}>
                {options.length === 0 ? (
                  <LookupMessage status={status} onRetry={retry} />
                ) : (
                  <>
                    <CommandGroup heading="내 팔로잉">
                      {options.map((option, index) => {
                        const candidate = option.candidate;
                        return (
                          <CommandItem
                            key={candidate.id}
                            value={candidate.id}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onSelect={() => selectOptionAndCleanUp(option)}
                            className={selectedIndex === index ? "bg-accent" : "!bg-transparent"}
                          >
                            <Avatar className="size-7 border border-zinc-200">
                              {candidate.photo_url ? (
                                <AvatarImage
                                  src={candidate.photo_url}
                                  alt={`${candidate.display_name} 프로필 이미지`}
                                />
                              ) : null}
                              <AvatarFallback className="text-xs">
                                {profileInitial(candidate.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="min-w-0 truncate">{candidate.display_name}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                    <div
                      ref={loadMoreSentinelRef}
                      className="flex min-h-10 items-center justify-center px-2 py-2"
                      aria-live="polite"
                    >
                      {status === "loading" ? (
                        <span
                          className="flex items-center text-xs text-muted-foreground"
                          role="status"
                        >
                          <LoaderCircle className="mr-2 size-3.5 animate-spin" aria-hidden="true" />
                          더 불러오는 중입니다.
                        </span>
                      ) : status === "error" ? (
                        <Button type="button" variant="ghost" size="sm" onClick={retry}>
                          불러오기 재시도
                        </Button>
                      ) : hasMore ? (
                        <span className="sr-only">다음 멘션 후보를 불러옵니다.</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          모든 검색 결과를 불러왔습니다.
                        </span>
                      )}
                    </div>
                  </>
                )}
              </CommandList>
            </Command>
          </div>,
          anchorElementRef.current
        );
      }}
    />
  );
}
