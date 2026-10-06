// 게시글 에디터의 임베드(유튜브·트윗)는 JSON에 ID만 저장한다. 글자로 나타낼 때 쓰는 링크를 여기서만 만든다.
// 에디터 노드(getTextContent)와 서버의 검색용 글자 추출(extractPostText)이 같은 규칙을 써야 어긋나지 않는다.

export const youtubeWatchUrl = (videoId: string): string =>
  `https://www.youtube.com/watch?v=${videoId}`;

export const tweetUrl = (tweetId: string): string => `https://x.com/i/web/status/${tweetId}`;
