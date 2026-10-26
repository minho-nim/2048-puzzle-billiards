# 2048 Puzzle Billiards

당구 물리로 공을 쏘고 같은 숫자의 공을 합치는 웹 퍼즐 게임입니다.

## 실행

Node.js가 설치되어 있어야 합니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 여세요.

## 빌드

```bash
npm run build
npm run preview
```

## GitHub Pages 배포

`main` 브랜치에 푸시하면 GitHub Actions가 빌드하고 Pages에 배포합니다. 저장소 설정의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 지정하세요.

배포가 완료되면 `https://<사용자명>.github.io/2048-puzzle-billiards/`에서 접속할 수 있습니다. 게임 데이터는 각 브라우저에 따로 저장되므로 계정 없이 플레이할 수 있습니다.

## 조작 방법

검은 숫자 공을 향해 드래그한 뒤 손을 떼면 공이 발사됩니다. 같은 숫자의 공이 부딪히면 하나로 합쳐집니다. 도움말에서 게임 규칙을 확인할 수 있습니다.

## 기술 스택

- React와 TypeScript
- Vite
- Canvas 2D
- Tailwind CSS
