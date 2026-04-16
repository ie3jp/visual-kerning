import type { DemoMessages } from './types'

export const zh: DemoMessages = {
  editorLocale: 'en',
  skipLabel: '跳过导览',
  replayLabel: '重新播放导览',
  defaultGoogleFont: 'Noto Sans SC',
  preferredLocalFonts: ['PingFang SC', 'system-ui'],

  loadingBtn: '加载中...',
  loadedBtn: '已加载',
  loadBtn: '加载',
  unavailableBtn: '不可用',

  localUnavailable: '本地字体列表在 Chrome/Edge 中可用。',
  googleLoadingStatus: '正在加载 Google Fonts...',
  googleLoadedStatus: (count) => `Google Fonts 已加载（${count}个）`,
  googleFailedStatus: 'Google 字体列表加载失败。',
  localLoadingStatus: '正在加载本地字体...',
  localLoadedStatus: (count) => `本地字体已加载（${count}个）`,
  localBlockedStatus: '本地字体访问被阻止。',

  fontStatusMsg: (source, family) => `${source === 'google' ? 'Google Fonts' : '本地字体'}: ${family}`,
  localFontsLoadingMsg: '正在加载本地字体...',
  loadLocalFirst: '请先加载本地字体（点击"加载"）。',
  localAccessNote: '本地字体访问在 Chrome/Edge 中可用。',
  noLocalFonts: '没有可用的本地字体。',
  typeTextFirst: '请先输入文本。',
  luckyFontMsg: (font) => `Lucky 字体: ${font}`,
  messyApplied: 'Messy！',
  htmlDropOverlay: '拖放 HTML 以重新编辑',
  htmlImportSuccess: '已从 HTML 导入。',
  htmlImportFailed: '无法从此 HTML 解析字距数据。',

  tutorialContent: ({ isMac, altKey }) => ({
    welcome: [
      '欢迎使用 ', { strong: 'visual kerning' }, '！',
      '\n',
      '一起来看看如何在浏览器中微调字距。',
    ],
    openEditor: [
      '按 ', { key: 'cmd', label: isMac ? '\u2318' : 'Ctrl' }, ' + ', { key: 'k', label: 'K' }, ' 打开编辑器面板。',
    ],
    clickToEdit: '点击文本块开始编辑...',
    moveAdjust: [
      '移动 ', { key: 'nav-left', label: '\u2190' }, ' ', { key: 'nav-right', label: '\u2192' },
      '   调整 ', { key: 'adj-mod', label: altKey }, ' + ', { key: 'adj-left', label: '\u2190' }, ' ', { key: 'adj-right', label: '\u2192' },
    ],
    compareTitle: '前后对比',
    compareDesc: '切换以与原始字距对比。',
    guidesTitle: '辅助线',
    guidesDesc: '在字符之间显示间距标记。',
    exportTitle: '导出',
    exportDesc1: '将字距数据复制为 JSON。',
    exportDesc2: '用 visual kerning 库应用后即可完成！',
    resetTitle: '重置',
    resetDesc: '放弃所有更改并恢复原始字距。',
    yourTurn: [
      '轮到你了！',
      '\n',
      '选择一个字体，输入一些文本，',
      '\n',
      '亲自试试字距调整吧。',
    ],
  }),
}
