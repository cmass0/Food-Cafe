// 비로그인 사용자가 사이트를 둘러보는 흐름. 실험용 앱(로컬 DB 연결)을 거쳐 페이지와, 브라우저가 따로 부르는 API까지 보낸다.
//   실행: node tools/k6/run.mjs tools/k6/scripts/browse.js
//   사용자 수·시간 바꾸기: ... browse.js -s 30s:20 -s 3m:20 -s 20s:0
import http from "k6/http";
import { check, group, sleep } from "k6";

const APP = __ENV.APP_URL;
const SUPABASE = `${__ENV.SUPABASE_URL}/rest/v1`;
const SUPABASE_HEADERS = {
  apikey: __ENV.SUPABASE_ANON_KEY,
  Authorization: `Bearer ${__ENV.SUPABASE_ANON_KEY}`,
};
const SEARCH_TERMS = [
  "김치",
  "닭가슴살",
  "리조또",
  "두부",
  "파스타",
  "다이어트",
  "에어프라이어",
  "자취생",
];
const RECIPE_PAGE_COUNT = 800; // 레시피 1만 개 ÷ 12개
const POST_CATEGORIES = ["free", "recipe_tip", "question", "review"];
const isOk = (response) => response.status >= 200 && response.status < 300;

export const options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "3m", target: 10 },
    { duration: "15s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{kind:page}": ["p(95)<2000"],
    "http_req_duration{kind:api}": ["p(95)<1000"],
  },
};

// 상세 페이지에 쓸 id. 인기 글일수록 더 자주 열리도록 좋아요 순으로 받아 두고 앞쪽을 많이 고른다.
// 프로필은 인기 레시피 작성자 순이다.
export function setup() {
  const fetchRows = (table, column) =>
    http
      .get(`${SUPABASE}/${table}?select=${column}&order=like_count.desc&limit=1000`, {
        headers: SUPABASE_HEADERS,
      })
      .json()
      .map((row) => row[column]);
  return {
    recipeIds: fetchRows("recipes", "id"),
    comboIds: fetchRows("combos", "id"),
    postIds: fetchRows("posts", "id"),
    writerIds: [...new Set(fetchRows("recipes", "writer_uid").filter(Boolean))],
  };
}

const pickPopular = (ids) => ids[Math.floor(ids.length * Math.pow(Math.random(), 2))];
const pick = (items) => items[Math.floor(Math.random() * items.length)];
// 사람이 화면을 읽는 시간. 1~3초.
const think = () => sleep(1 + Math.random() * 2);

function page(path, name) {
  const response = http.get(`${APP}${path}`, { tags: { name, kind: "page" } });
  check(response, { [`${name} 응답`]: isOk });
  return response;
}

function api(method, path, name) {
  const response = http.request(method, `${APP}${path}`, null, { tags: { name, kind: "api" } });
  check(response, { [`${name} 응답`]: isOk });
  return response;
}

export default function browse({ recipeIds, comboIds, postIds, writerIds }) {
  group("홈", () => {
    page("/", "홈");
    think();
  });

  group("레시피 둘러보기", () => {
    page("/recipes", "레시피 목록 1쪽");
    think();
    // 대부분은 앞쪽 몇 쪽만 넘기고, 가끔 깊은 쪽까지 간다.
    const pageNumber =
      Math.random() < 0.8
        ? 2 + Math.floor(Math.random() * 4)
        : 6 + Math.floor(Math.random() * RECIPE_PAGE_COUNT);
    page(
      `/recipes?page=${pageNumber}`,
      pageNumber <= 5 ? "레시피 목록 2~5쪽" : "레시피 목록 깊은 쪽"
    );
    think();

    const recipeId = pickPopular(recipeIds);
    page(`/recipes/${recipeId}`, "레시피 상세");
    api("POST", `/api/recipes/${recipeId}/view`, "레시피 조회수");
    think();
  });

  group("검색·랭킹", () => {
    page(`/search?query=${encodeURIComponent(pick(SEARCH_TERMS))}`, "통합 검색");
    think();
    page(`/ranking?period=${pick(["day", "week", "month"])}`, "랭킹");
    think();
  });

  group("조합 둘러보기", () => {
    page("/combos", "조합 목록");
    api("GET", "/api/combos?limit=12&page=1&sort=recent", "조합 목록 API");
    think();

    const comboId = pickPopular(comboIds);
    page(`/combos/${comboId}`, "조합 상세");
    api("POST", `/api/combos/${comboId}/view`, "조합 조회수");
    think();
  });

  group("커뮤니티", () => {
    page("/posts", "커뮤니티 목록");
    think();
    // 절반은 카테고리 탭을 누르고, 일부는 다음 쪽으로 넘긴다.
    if (Math.random() < 0.5) {
      page(`/posts?category=${pick(POST_CATEGORIES)}`, "커뮤니티 카테고리");
      think();
    }
    if (Math.random() < 0.3) {
      page(`/posts?page=${2 + Math.floor(Math.random() * 4)}`, "커뮤니티 목록 2~5쪽");
      think();
    }

    const postId = pickPopular(postIds);
    page(`/posts/${postId}`, "게시글 상세");
    api("POST", `/api/posts/${postId}/view`, "게시글 조회수");
    think();
  });

  group("프로필", () => {
    const writerId = pickPopular(writerIds);
    page(`/profile/${writerId}`, "프로필 레시피");
    think();
    if (Math.random() < 0.5) {
      page(`/profile/${writerId}?section=combo`, "프로필 조합");
      think();
    }
  });
}
