# Visual Kerning

[English](./README.md) | [日本語](./README.ja.md) | [Deutsch](./README.de.md) | [简体中文](./README.zh-CN.md) | [한국어](./README.ko.md)

[![npm](https://img.shields.io/npm/v/visual-kerning?style=flat-square&color=888)](https://www.npmjs.com/package/visual-kerning)
[![Playground](https://img.shields.io/badge/playground-live-888?style=flat-square)](https://ie3jp.github.io/visual-kerning/)
[![GitHub Pages](https://img.shields.io/github/actions/workflow/status/ie3jp/visual-kerning/deploy-demo-pages.yml?style=flat-square&label=GitHub+Pages&color=888)](https://github.com/ie3jp/visual-kerning/actions/workflows/deploy-demo-pages.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-888?style=flat-square)](./LICENSE)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-FF5E5B?style=flat-square&logo=ko-fi&logoColor=white)](https://ko-fi.com/cyocun)

**让 Web 排版更直观。**

在浏览器中调整字距，导出为 JSON，
以框架无关的方式应用到生产环境 DOM。

![Visual Kerning demo](.github/readme/ogp.gif)

## Playground

**从这里开始：** [打开 Playground](https://ie3jp.github.io/visual-kerning/)

- 本地演示：`npm run demo`
- 静态构建：`npm run demo:build`

> 编辑界面主要用于开发和预发布环境。
> 生产环境请使用 `visualKerning({ editable: false, kerning })`。

## 为什么选择 Visual Kerning

CSS `letter-spacing` 在一个值就够的时候很好用。
但当你需要在真实 UI 中进行逐对调整时，它就显得力不从心了。

Visual Kerning 面向需要以下实用工作流的团队：

1. 在开发或预发布阶段，在浏览器中可视化调整间距。
2. 将结果导出为 JSON。
3. 在生产环境中应用导出的数据。

主要优势：

- **CSS 无法实现的逐对控制**
  — `letter-spacing` 是均匀的；这里可以独立调整每个字符对
- **类似 Illustrator 的编辑体验**
  — Alt + 方向键进行精细/粗略调整，直接在浏览器中操作
- **从编辑到生产的统一 API**
  — 在预发布环境编辑、导出 JSON，在生产环境用同一个库应用
- **保留行内标记**
  — `<em>`、`<strong>`、`<span>` 等行内元素在包装过程中不会丢失
- **零依赖，框架无关**
  — 适用于任何技术栈，无运行时开销
- **事件驱动集成**
  — 通过 `enable`、`disable`、`change` 事件与你的应用协调

## 安装

```bash
npm install visual-kerning
```

## 预期工作流

```ts
import { visualKerning } from 'visual-kerning'
```

**1. 编辑** — 在开发或预发布环境挂载编辑器。
可视化调整字距，然后从面板导出 JSON。

```ts
const editor = visualKerning({ editable: true })
editor.mount()
```

你也可以通过 `kerning` 选项传入之前导出的 JSON，
从上次的导出继续编辑。

**2. 应用** — 在生产环境中挂载导出的 JSON。

```ts
const editor = visualKerning({ editable: false, kerning: kerningData })
await editor.mount()
```

`mount()` 返回一个 `Promise`，在字距应用完成后 resolve。
使用 `await` 延迟渲染（例如移除 `visibility: hidden`），
直到文本正确应用字距。

在编辑模式下，你也可以将导出的 JSON 文件
拖放到编辑器面板来重新导入。

## 适用场景

Visual Kerning 面向普通网站上视觉效果重要的文本。

- 标题
- 主视觉文案
- 展示性排版
- 混合字体标题
- 简短的编辑性文本
- 使用 `<br>` 的短多行文本

适用于普通网站、落地页、
营销网站、作品集和编辑风格的 UI。

## 支持的内容

- 单个元素中的纯文本
- 使用 `<br>` 的多行文本
- 目标元素内的行内格式
  — 例如 `<span>`、`<em>`、`<strong>`、`<b>`、`<i>`

编辑时，Visual Kerning 将可见字符包装在 span 中，
同时尽力保留有用的行内结构。

要将某个元素排除在编辑之外，
添加 `data-visual-kerning-ignore`：

```html
<div data-visual-kerning-ignore>此文本将不可编辑。</div>
```

## 公共 API

### `visualKerning(options?)`

编辑和生产使用的唯一公共入口。

```ts
const editor = visualKerning({
  locale: 'en',          // 'ja' | 'en'（默认：'en'）
  editable: true,        // 显示编辑 UI（默认：true）
  kerning: kerningData,  // 挂载时应用 KerningExport
  accessible: false,     // 屏幕阅读器支持（默认：false）
})
editor.mount()
```

- `editable: true`（默认）— 编辑 UI + 键盘快捷键
- `editable: false` + `kerning` — 生产模式，仅应用字距数据
- `accessible: true` — 添加屏幕阅读器支持（参见[无障碍](#无障碍)）
- `mount()` / `unmount()` — 连接/断开 DOM。`mount()` 返回一个 `Promise<void>`，在字距应用完成后 resolve

`KerningExport` 是 `kerning` 选项使用的公共数据类型。

#### Events

订阅生命周期事件。`on()` 返回取消订阅函数。

```ts
editor.on('enable', () => { document.body.style.overflow = 'hidden' })
editor.on('disable', () => { document.body.style.overflow = '' })
editor.on('change', ({ selector, kerning, indent }) => { /* ... */ })
editor.on('select', ({ selector, gapIndex, gapIndexEnd }) => { /* ... */ })
editor.on('reset', () => { /* ... */ })
```

取消订阅：

```ts
const off = editor.on('change', handleChange)
off()
```

## 编辑器快捷键

| 按键 | 操作 |
|------|------|
| `Cmd/Ctrl + K` | 切换编辑模式 |
| 点击 | 选择文本块和间距 |
| 拖动 | 选择一段间距范围 |
| `Shift + 点击` | 将选择扩展到范围 |
| `Cmd/Ctrl + A` | 选择活动文本块中的所有间距 |
| `Tab` / `Shift+Tab` | 下一个/上一个间距 |
| `←` / `→` | 移动光标 |
| `Shift + ←/→` | 扩展选择 |
| `↑` / `↓` | 在同一文本块内上下移动 |
| `Alt + Shift + ←/→` | 调整 ±1 |
| `Alt + ←/→` | 调整 ±10 |
| `Alt + Cmd/Ctrl + ←/→` | 调整 ±100 |
| `Alt + Cmd/Ctrl + Q` | 将选中间距重置为零 |
| `Esc` | 取消选择 |
| `B` | 切换前后对比 |

当选择了多个间距时，
`Alt + ←/→` 会同时调整所有选中的间距（tracking）。

<details>
<summary>像 Illustrator 吗？</summary>

字距调整按键有意接近 Illustrator：

- `Alt/Option + Shift + ←/→`：微调（±1）
- `Alt/Option + ←/→`：标准调整（±10）
- `Alt/Option + Cmd/Ctrl + ←/→`：大幅调整（±100）

而浏览和编辑工作流本身是浏览器特有的：

- `Cmd/Ctrl + K`：切换编辑器
- `Tab` / `Shift+Tab`：在间距之间移动
- `B`：前后对比
- `Esc`：取消选择
</details>

## 为什么用 `margin-left` 而不是 `letter-spacing`

Visual Kerning 将每个可见字符包装在 `<span>` 中，
通过每个 span 的 `margin-left` 控制间距。
这是对 `letter-spacing` 的有意替代：

- **单字符 span 上的 `letter-spacing` 不可靠。**
  该属性在元素内的字符之间添加空间
  — 但每个 span 只有一个字符时，不存在"之间"。
  浏览器行为各不相同。
- **`letter-spacing` 在换行处溢出。**
  它扩大了字符盒子本身的宽度，
  在换行行尾留下不需要的尾部空间。
- **`margin-left` 在各种上下文中都可预测。**
  它遵循盒模型规范：间距位于相邻 span 之间，
  无论换行、行内包装器（`<em>`、`<strong>`）
  还是父元素样式。
- **不会与继承的 `letter-spacing` 重复应用。**
  如果父元素有 `letter-spacing`，`margin-left` 不会干扰。
  库会读取继承值
  并通过 `calc()` 将其纳入 margin 计算。

## 无障碍

Visual Kerning 将每个字符包装在 `<span>` 中，
这可能导致屏幕阅读器逐字朗读文本。

为防止这种情况，在生产模式下启用 `accessible` 选项：

```ts
const editor = visualKerning({
  editable: false,
  kerning: kerningData,
  accessible: true,
})
editor.mount()
```

启用后，每个目标元素会被重新组织：

```html
<!-- 之前（无 accessible） -->
<h1>
  <span class="visual-kerning-char" style="margin-left:...">H</span>
  <span class="visual-kerning-char" style="margin-left:...">e</span>
  ...
</h1>

<!-- 之后（accessible: true） -->
<h1>
  <span class="visual-kerning-sr-only">Hello</span>
  <span class="visual-kerning-presentation" aria-hidden="true">
    <span class="visual-kerning-char" style="margin-left:...">H</span>
    <span class="visual-kerning-char" style="margin-left:...">e</span>
    ...
  </span>
</h1>
```

屏幕阅读器朗读视觉隐藏的原始文本，
而字距调整后的 span 通过 `aria-hidden` 隐藏。

> **注意：** 这会改变 DOM 结构。
> 如果你的 CSS 或 JS 直接引用了字距目标的子元素，
> 选择器可能需要调整。

## CSS 类

Visual Kerning 向 DOM 添加以下类，用于样式和选择：

| 类 | 应用于 | 说明 |
|----|--------|------|
| `visual-kerning-char` | 每个字符 `<span>` | 始终存在于字距调整后的字符上 |
| `visual-kerning-sr-only` | 视觉隐藏的文本 | 仅 `accessible: true` 时 — 包含原始可读文本 |
| `visual-kerning-presentation` | 包装字距 span 的外层 | 仅 `accessible: true` 时 — 有 `aria-hidden="true"` |
| `visual-kerning-active` | 目标元素 | 元素正在编辑时添加 |
| `visual-kerning-modified` | 目标元素 | 字距已应用时添加 |

```css
/* 示例：为字距调整后的字符设置样式 */
.visual-kerning-char {
  /* 每个字符 span */
}

/* 示例：accessible 启用时的视觉包装器 */
.visual-kerning-presentation {
  /* 包装所有字距 span，对屏幕阅读器隐藏 */
}
```

## 局限性

- 不是通用的长文排版系统
- 聚焦于视觉重要的文本，而非页面上的每个文本节点
- 对普通网站实用，但不保证完美重建
  每种可能的 HTML 结构或高度装饰的行内标记

## 开发

```bash
npm install
npm run build
npm test
npm run smoke
npm run demo
```

### 可用脚本

| 脚本 | 说明 |
|------|------|
| `npm run build` | 构建包到 `dist/` |
| `npm test` | 运行 Vitest |
| `npm run smoke` | 核心 smoke 测试 + demo E2E |
| `npm run smoke:ci` | CI 向 smoke 运行 |
| `npm run e2e` | 仅 Playwright E2E |
| `npm run demo` | 本地演示 `http://127.0.0.1:4173` |
| `npm run demo:build` | 静态演示构建到 `demo-dist/` |

首次 E2E 运行前：

```bash
npx playwright install
```

## 支持

> [!TIP]
> 如果这个工具对你的工作流有帮助，你的支持意义重大 — [buy me a coffee!](https://ko-fi.com/cyocun)

## 许可证

[MIT](./LICENSE)
