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
    // 실패율 30%가 1분 넘게 이어지면 멈춘다(처음 1분은 판단하지 않는다).
    http_req_failed: [{ threshold: "rate<0.3", abortOnFail: true, delayAbortEval: "1m" }],
    "http_req_duration{kind:page}": ["p(95)<2000"],
  },
};
