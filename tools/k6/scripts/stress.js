// 둘러보기 흐름(browse.js)을 그대로 쓰되, 사용자를 계단식으로 1,000명까지 늘려 어디서 무너지는지 찾는다.
//   실행: node tools/k6/run.mjs tools/k6/scripts/stress.js
// 서버·DB·k6가 모두 한 PC에서 돌므로, 실패가 계속 쌓이면 스스로 멈춘다.
import browse, { setup } from "./browse.js";

export { setup };
export default browse;

export const options = {
  stages: [
    { duration: "30s", target: 100 },
    { duration: "1m", target: 100 },
    { duration: "30s", target: 300 },
    { duration: "1m", target: 300 },
    { duration: "30s", target: 600 },
    { duration: "1m", target: 600 },
    { duration: "30s", target: 1000 },
    { duration: "1m", target: 1000 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    // 시작 1분 뒤부터, 처음부터 쌓인 실패율이 30%를 넘으면 그 즉시 멈춘다.
    // k6의 rate는 실행 전체 누적 값이고 delayAbortEval은 판단 시작만 늦춘다. 그래서 "최근 1분" 기준이 아니며,
    // 초반에 잠깐 몰린 실패도 누적에 남는다. 서버가 완전히 무너졌을 때 PC를 지키려는 안전장치로만 쓴다.
    http_req_failed: [{ threshold: "rate<0.3", abortOnFail: true, delayAbortEval: "1m" }],
    "http_req_duration{kind:page}": ["p(95)<2000"],
  },
};
