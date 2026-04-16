import type { DemoMessages } from './types'

export const ko: DemoMessages = {
  editorLocale: 'en',
  skipLabel: '투어 건너뛰기',
  replayLabel: '투어 다시 보기',
  defaultGoogleFont: 'Noto Sans KR',
  preferredLocalFonts: ['Apple SD Gothic Neo', 'system-ui'],

  loadingBtn: '불러오는 중...',
  loadedBtn: '로드됨',
  loadBtn: '불러오기',
  unavailableBtn: '사용 불가',

  localUnavailable: '로컬 폰트 목록은 Chrome/Edge에서 사용할 수 있습니다.',
  googleLoadingStatus: 'Google Fonts를 불러오는 중...',
  googleLoadedStatus: (count) => `Google Fonts 로드 완료 (${count}개)`,
  googleFailedStatus: 'Google 폰트 목록을 불러오지 못했습니다.',
  localLoadingStatus: '로컬 폰트를 불러오는 중...',
  localLoadedStatus: (count) => `로컬 폰트 로드 완료 (${count}개)`,
  localBlockedStatus: '로컬 폰트 접근이 차단되었습니다.',

  fontStatusMsg: (source, family) => `${source === 'google' ? 'Google Fonts' : '로컬 폰트'}: ${family}`,
  localFontsLoadingMsg: '로컬 폰트를 불러오는 중...',
  loadLocalFirst: '먼저 로컬 폰트를 불러와 주세요 ("불러오기" 클릭).',
  localAccessNote: '로컬 폰트 접근은 Chrome/Edge에서 사용할 수 있습니다.',
  noLocalFonts: '사용 가능한 로컬 폰트가 없습니다.',
  typeTextFirst: '먼저 텍스트를 입력해 주세요.',
  luckyFontMsg: (font) => `Lucky 폰트: ${font}`,
  messyApplied: 'Messy!',
  htmlDropOverlay: 'HTML을 드롭하여 다시 편집',
  htmlImportSuccess: 'HTML에서 가져왔습니다.',
  htmlImportFailed: '이 HTML에서 커닝 데이터를 읽을 수 없습니다.',

  tutorialContent: ({ isMac, altKey }) => ({
    welcome: [
      { strong: 'visual kerning' }, '에 오신 것을 환영합니다!',
      '\n',
      '브라우저에서 자간을 세밀하게 조정하는 방법을 살펴봅시다.',
    ],
    openEditor: [
      { key: 'cmd', label: isMac ? '\u2318' : 'Ctrl' }, ' + ', { key: 'k', label: 'K' }, ' 를 눌러 에디터 팔레트를 엽니다.',
    ],
    clickToEdit: '텍스트 블록을 클릭하여 편집을 시작...',
    moveAdjust: [
      '이동 ', { key: 'nav-left', label: '\u2190' }, ' ', { key: 'nav-right', label: '\u2192' },
      '   조정 ', { key: 'adj-mod', label: altKey }, ' + ', { key: 'adj-left', label: '\u2190' }, ' ', { key: 'adj-right', label: '\u2192' },
    ],
    compareTitle: '전후 비교',
    compareDesc: '토글하여 원래 자간과 비교할 수 있습니다.',
    guidesTitle: '가이드',
    guidesDesc: '문자 사이의 간격 마커를 표시합니다.',
    exportTitle: '내보내기',
    exportDesc1: '커닝 데이터를 JSON으로 복사합니다.',
    exportDesc2: 'visual kerning 라이브러리로 적용하면 완료!',
    resetTitle: '초기화',
    resetDesc: '모든 변경 사항을 취소하고 원래 자간으로 되돌립니다.',
    yourTurn: [
      '이제 당신 차례입니다!',
      '\n',
      '폰트를 선택하고 텍스트를 입력해',
      '\n',
      '커닝을 직접 시도해 보세요.',
    ],
  }),
}
