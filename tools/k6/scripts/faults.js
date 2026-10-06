// 장애 테스트용 계단. 둘러보기 흐름(browse.js)을 그대로 쓰고, 사용자 수를 100 → 300 → 600 → 1,000명으로 올린다.
// 계단마다 2분씩 머물러, 그 안에서 장애 30초와 회복 관찰 1분이 들어가게 한다(장애는 tools/k6/inject-fault.mjs가 넣는다).
//   기준 실행: node tools/k6/run.mjs tools/k6/scripts/faults.js
//   장애 실행: node tools/k6/inject-fault.mjs <종류>  을 먼저 켜 두고 위와 같이 실행
// 장애로 실패가 쌓여도 끝까지 기록해야 하므로 중간에 멈추지 않는다.
import browse, { setup } from "./browse.js";

export { setup };
export default browse;

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "2m", target: 100 },
    { duration: "30s", target: 300 },
    { duration: "2m", target: 300 },
    { duration: "30s", target: 600 },
    { duration: "2m", target: 600 },
    { duration: "30s", target: 1000 },
    { duration: "2m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    // 판정용이 아니라 요약에 실패율·p95를 남기려는 기준이다(넘어도 멈추지 않는다).
    http_req_failed: ["rate<0.01"],
    "http_req_duration{kind:page}": ["p(95)<2000"],
  },
};
