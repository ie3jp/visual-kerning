# Visual Kerning

[English](./README.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [简体中文](./README.zh-CN.md) | [한국어](./README.ko.md)

[![npm](https://img.shields.io/npm/v/visual-kerning?style=flat-square&color=888)](https://www.npmjs.com/package/visual-kerning)
[![Playground](https://img.shields.io/badge/playground-live-888?style=flat-square)](https://ie3jp.github.io/visual-kerning/)
[![GitHub Pages](https://img.shields.io/github/actions/workflow/status/ie3jp/visual-kerning/deploy-demo-pages.yml?style=flat-square&label=GitHub+Pages&color=888)](https://github.com/ie3jp/visual-kerning/actions/workflows/deploy-demo-pages.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-888?style=flat-square)](./LICENSE)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/cyocun)

**웹 타이포그래피를 더 직관적으로.**

브라우저에서 커닝을 조정하고, JSON으로 내보내고,
특정 프레임워크에 얽매이지 않고 프로덕션 DOM에 적용할 수 있습니다.

![Visual Kerning demo](.github/readme/ogp.gif)

## Playground

**여기서 시작하세요:** [Playground 열기](https://ie3jp.github.io/visual-kerning/)

- 로컬 데모: `npm run demo`
- 정적 빌드: `npm run demo:build`

> 편집 UI는 개발 및 스테이징 환경용입니다.
> 프로덕션에서는 `visualKerning({ editable: false, kerning })`을 사용하세요.

## Visual Kerning을 사용하는 이유

CSS `letter-spacing`은 하나의 값으로 충분할 때 유용합니다.
하지만 실제 UI에서 문자쌍별 조정이 필요하면 한계가 있습니다.

Visual Kerning은 다음과 같은 실용적인 워크플로우를 원하는 팀을 위해 만들어졌습니다:

1. 개발 또는 스테이징 단계에서 브라우저에서 시각적으로 간격을 조정합니다.
2. 결과를 JSON으로 내보냅니다.
3. 프로덕션에서 내보낸 데이터를 적용합니다.

주요 강점:

- **CSS로 불가능한 쌍별 제어**
  — `letter-spacing`은 균일합니다; 이 도구는 각 문자쌍을 독립적으로 조정합니다
- **Illustrator와 유사한 편집**
  — Alt + 화살표 키로 미세/대폭 조정, 브라우저에서 직접
- **편집부터 프로덕션까지 하나의 API**
  — 스테이징에서 편집, JSON 내보내기, 프로덕션에서 같은 라이브러리로 적용
- **인라인 마크업 보존**
  — `<em>`, `<strong>`, `<span>` 등 인라인 요소가 래핑 과정에서 유지됩니다
- **의존성 없음, 프레임워크 독립적**
  — 어떤 스택에서도 작동하며, 런타임 오버헤드 없음
- **이벤트 기반 통합**
  — `enable`, `disable`, `change` 이벤트로 앱과 연동

## 설치

```bash
npm install visual-kerning
```

## 의도된 워크플로우

```ts
import { visualKerning } from 'visual-kerning'
```

**1. 편집** — 개발 또는 스테이징에서 에디터를 마운트합니다.
시각적으로 커닝을 조정한 후, 팔레트에서 JSON을 내보냅니다.

```ts
const editor = visualKerning({ editable: true })
editor.mount()
```

`kerning` 옵션에 내보낸 JSON을 전달하여
이전 내보내기에서 편집을 이어갈 수도 있습니다.

**2. 적용** — 프로덕션에서 내보낸 JSON으로 마운트합니다.

```ts
const editor = visualKerning({ editable: false, kerning: kerningData })
await editor.mount()
```

`mount()`는 커닝 적용이 완료되면 resolve되는 `Promise`를 반환합니다.
`await`를 사용하여 텍스트가 올바르게 커닝될 때까지
렌더링을 지연시킬 수 있습니다 (예: `visibility: hidden` 제거).

편집 모드에서는 내보낸 JSON 파일을
에디터 패널에 드래그 앤 드롭하여 다시 가져올 수도 있습니다.

## 적합한 용도

Visual Kerning은 일반 웹사이트에서 시각적으로 중요한 텍스트를 대상으로 합니다.

- 헤드라인
- 히어로 카피
- 디스플레이 타이포그래피
- 혼합 폰트 제목
- 짧은 에디토리얼 라인
- `<br>`을 사용한 짧은 여러 줄 텍스트

일반 웹사이트, 랜딩 페이지,
마케팅 사이트, 포트폴리오, 에디토리얼 스타일 UI에 실용적입니다.

## 지원 콘텐츠

- 단일 요소 내 일반 텍스트
- `<br>`을 사용한 여러 줄 텍스트
- 대상 요소 내 인라인 서식
  — 예: `<span>`, `<em>`, `<strong>`, `<b>`, `<i>`

편집 시, Visual Kerning은 유용한 인라인 구조를 가능한 한 보존하면서
보이는 문자를 span으로 감쌉니다.

특정 요소를 편집에서 제외하려면
`data-visual-kerning-ignore`를 추가하세요:

```html
<div data-visual-kerning-ignore>이 텍스트는 편집할 수 없습니다.</div>
```

## Public API

### `visualKerning(options?)`

편집과 프로덕션 사용 모두를 위한 단일 공개 진입점입니다.

```ts
const editor = visualKerning({
  locale: 'en',          // 'ja' | 'en' (기본값: 'en')
  editable: true,        // 편집 UI 표시 (기본값: true)
  kerning: kerningData,  // 마운트 시 KerningExport 적용
  accessible: false,     // 스크린 리더 지원 (기본값: false)
})
editor.mount()
```

- `editable: true` (기본값) — 편집 UI + 키보드 단축키
- `editable: false` + `kerning` — 프로덕션 모드, 커닝 데이터만 적용
- `accessible: true` — 스크린 리더 지원 추가 ([접근성](#접근성) 참조)
- `mount()` / `unmount()` — DOM에 연결/해제. `mount()`는 커닝 적용 완료 시 resolve되는 `Promise<void>`를 반환

`KerningExport`는 `kerning` 옵션에서 사용되는 공개 데이터 타입입니다.

#### Events

라이프사이클 이벤트를 구독합니다. `on()`은 구독 해제 함수를 반환합니다.

```ts
editor.on('enable', () => { document.body.style.overflow = 'hidden' })
editor.on('disable', () => { document.body.style.overflow = '' })
editor.on('change', ({ selector, kerning, indent }) => { /* ... */ })
editor.on('select', ({ selector, gapIndex, gapIndexEnd }) => { /* ... */ })
editor.on('reset', () => { /* ... */ })
```

구독 해제:

```ts
const off = editor.on('change', handleChange)
off()
```

## 에디터 단축키

| 키 | 동작 |
|----|------|
| `Cmd/Ctrl + K` | 편집 모드 전환 |
| 클릭 | 텍스트 블록과 간격 선택 |
| 드래그 | 간격 범위 선택 |
| `Shift + 클릭` | 범위까지 선택 확장 |
| `Cmd/Ctrl + A` | 활성 텍스트 블록의 모든 간격 선택 |
| `Tab` / `Shift+Tab` | 다음/이전 간격 |
| `←` / `→` | 커서 이동 |
| `Shift + ←/→` | 선택 확장 |
| `↑` / `↓` | 같은 텍스트 블록 내에서 위/아래 이동 |
| `Alt + Shift + ←/→` | ±1 조정 |
| `Alt + ←/→` | ±10 조정 |
| `Alt + Cmd/Ctrl + ←/→` | ±100 조정 |
| `Alt + Cmd/Ctrl + Q` | 선택한 간격을 0으로 초기화 |
| `Esc` | 선택 해제 |
| `B` | 전후 비교 전환 |

여러 간격이 선택된 상태에서
`Alt + ←/→`는 선택된 모든 간격을 동시에 조정합니다 (트래킹).

<details>
<summary>Illustrator와 비슷한가요?</summary>

커닝 조정 키는 의도적으로 Illustrator에 가깝습니다:

- `Alt/Option + Shift + ←/→`: 미세 조정 (±1)
- `Alt/Option + ←/→`: 표준 조정 (±10)
- `Alt/Option + Cmd/Ctrl + ←/→`: 대폭 조정 (±100)

브라우징 및 편집 워크플로우 자체는 브라우저에 특화되어 있습니다:

- `Cmd/Ctrl + K`: 에디터 전환
- `Tab` / `Shift+Tab`: 간격 사이 이동
- `B`: 전후 비교
- `Esc`: 선택 해제
</details>

## `letter-spacing` 대신 `margin-left`을 사용하는 이유

Visual Kerning은 각 보이는 문자를 `<span>`으로 감싸고
각 span의 `margin-left`로 간격을 제어합니다.
이는 `letter-spacing`에 대한 의도적인 대안입니다:

- **단일 문자 span에서 `letter-spacing`은 불안정합니다.**
  이 속성은 요소 *내* 문자 사이에 공간을 추가합니다
  — 하지만 span당 문자가 하나뿐이면 "사이"가 존재하지 않습니다.
  브라우저 동작이 다양합니다.
- **`letter-spacing`은 줄 바꿈에서 누출됩니다.**
  문자 박스 자체의 너비가 넓어져
  줄 바꿈된 줄의 끝에 원치 않는 여백이 남습니다.
- **`margin-left`은 어떤 컨텍스트에서도 예측 가능합니다.**
  박스 모델 사양을 따릅니다: 간격은 인접한 span 사이에 위치하며
  줄 바꿈, 인라인 래퍼 (`<em>`, `<strong>`),
  또는 부모 요소 스타일과 무관합니다.
- **상속된 `letter-spacing`과 중복 적용되지 않습니다.**
  부모 요소에 `letter-spacing`이 있어도 `margin-left`은 간섭하지 않습니다.
  라이브러리가 상속 값을 읽어
  `calc()`를 통해 margin 계산에 포함합니다.

## 접근성

Visual Kerning은 각 문자를 `<span>`으로 감싸기 때문에,
스크린 리더가 텍스트를 한 글자씩 읽을 수 있습니다.

이를 방지하려면 프로덕션 모드에서 `accessible` 옵션을 활성화하세요:

```ts
const editor = visualKerning({
  editable: false,
  kerning: kerningData,
  accessible: true,
})
editor.mount()
```

활성화하면 각 대상 요소가 다음과 같이 재구성됩니다:

```html
<!-- 이전 (accessible 없음) -->
<h1>
  <span class="visual-kerning-char" style="margin-left:...">H</span>
  <span class="visual-kerning-char" style="margin-left:...">e</span>
  ...
</h1>

<!-- 이후 (accessible: true) -->
<h1>
  <span class="visual-kerning-sr-only">Hello</span>
  <span class="visual-kerning-presentation" aria-hidden="true">
    <span class="visual-kerning-char" style="margin-left:...">H</span>
    <span class="visual-kerning-char" style="margin-left:...">e</span>
    ...
  </span>
</h1>
```

스크린 리더는 시각적으로 숨겨진 원본 텍스트를 읽고,
커닝된 span은 `aria-hidden`으로 숨겨집니다.

> **참고:** DOM 구조가 변경됩니다.
> CSS나 JS가 커닝 대상의 자식 요소를 직접 참조하는 경우
> 셀렉터 조정이 필요할 수 있습니다.

## CSS 클래스

Visual Kerning이 DOM에 추가하는 클래스:

| 클래스 | 적용 대상 | 설명 |
|--------|-----------|------|
| `visual-kerning-char` | 각 문자 `<span>` | 커닝된 문자에 항상 존재 |
| `visual-kerning-sr-only` | 시각적으로 숨겨진 텍스트 | `accessible: true` 시에만 — 원본 읽을 수 있는 텍스트 포함 |
| `visual-kerning-presentation` | 커닝된 span의 래퍼 | `accessible: true` 시에만 — `aria-hidden="true"` |
| `visual-kerning-active` | 대상 요소 | 편집 중인 요소에 추가 |
| `visual-kerning-modified` | 대상 요소 | 커닝이 적용된 요소에 추가 |

```css
/* 예시: 커닝된 문자 스타일링 */
.visual-kerning-char {
  /* 각 문자 span */
}

/* 예시: accessible 활성 시 시각적 래퍼 */
.visual-kerning-presentation {
  /* 모든 커닝된 span을 감싸며, 스크린 리더에서 숨겨짐 */
}
```

## 제한 사항

- 범용 장문 조판 시스템이 아닙니다
- 페이지의 모든 텍스트 노드가 아닌
  시각적으로 중요한 텍스트에 초점을 맞춥니다
- 일반적인 웹사이트에 실용적이지만,
  모든 가능한 HTML 구조나 복잡한 인라인 마크업의
  완벽한 재현을 보장하지는 않습니다

## 개발

```bash
npm install
npm run build
npm test
npm run smoke
npm run demo
```

### 사용 가능한 스크립트

| 스크립트 | 설명 |
|----------|------|
| `npm run build` | 패키지를 `dist/`에 빌드 |
| `npm test` | Vitest 실행 |
| `npm run smoke` | 코어 smoke 테스트 + demo E2E |
| `npm run smoke:ci` | CI용 smoke 실행 |
| `npm run e2e` | Playwright E2E만 실행 |
| `npm run demo` | 로컬 데모 `http://127.0.0.1:4173` |
| `npm run demo:build` | 정적 데모를 `demo-dist/`에 빌드 |

첫 E2E 실행 전:

```bash
npx playwright install
```

## 지원

> [!TIP]
> 이 도구가 워크플로우에 도움이 된다면, 여러분의 지원은 큰 의미가 됩니다 — [buy me a coffee!](https://ko-fi.com/cyocun)

## 라이선스

[MIT](./LICENSE)
