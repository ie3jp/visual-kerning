import { CHAR_CLASS, getSingleCharSpans, type KerningArea } from './applyKerning'

/** インラインラッパーとして扱うタグ。char span の祖先辿りで通過させる。 */
export const INLINE_TAGS = new Set([
  'A', 'SPAN', 'EM', 'STRONG', 'B', 'I', 'SMALL',
  'MARK', 'ABBR', 'CODE', 'TIME', 'SUB', 'SUP',
])

/** 対象外としてマークされた要素のセレクタ。legacy 属性も含む。 */
export const IGNORE_SELECTOR = '[data-visual-kerning-ignore], [data-typespacing-ignore]'

/**
 * フォーカス先が入力系要素（input/textarea/select/contenteditable）かを判定。
 * キーボードショートカットがユーザー側ページの入力を妨害しないためのガード。
 */
export function isInEditableField(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return (target as HTMLElement).isContentEditable === true
}

/** 直下の子がテキストもしくはインライン要素のみで構成されているか。 */
export function isInlineContent(el: Element): boolean {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = (node as Element).tagName
      if (tag === 'BR') continue
      if (INLINE_TAGS.has(tag) && isInlineContent(node as Element)) continue
      return false
    }
  }
  return true
}

/** 短すぎないテキストを持ち、ブロック子孫を含まない葉要素か。 */
export function isTextLeaf(el: Element): boolean {
  const text = el.textContent || ''
  if (text.trim().length < 2) return false
  return isInlineContent(el)
}

/** このエディタが自分で 1 文字 span ラップした要素か。 */
export function isOurWrapped(el: Element): boolean {
  const wrapped = getSingleCharSpans(el)
  if (!wrapped) return false
  return wrapped.every(span => span.classList.contains(CHAR_CLASS))
}

export function getCharSpans(el: Element): HTMLElement[] {
  return Array.from(el.querySelectorAll(`.${CHAR_CLASS}`)) as HTMLElement[]
}

export function getFontInfo(el: Element): KerningArea['font'] {
  const cs = getComputedStyle(el)
  return {
    family: cs.fontFamily,
    weight: cs.fontWeight,
    size: cs.fontSize,
  }
}

/**
 * ラップ済み要素内の <br> 位置 (span インデックス) を収集する。
 * インポート時に改行位置を再現するため使う。
 */
export function collectBreakPositions(el: Element): number[] {
  const brPositions: number[] = []
  let spanIndex = 0

  function walk(node: Node) {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType !== Node.ELEMENT_NODE) continue

      const childEl = child as HTMLElement
      if (childEl.tagName === 'BR') {
        brPositions.push(spanIndex)
        continue
      }

      if (childEl.tagName === 'SPAN' && childEl.classList.contains(CHAR_CLASS)) {
        spanIndex++
      }

      walk(childEl)
    }
  }

  walk(el)
  return brPositions
}

/**
 * クリック対象からカーニング対象のテキストコンテナを辿る。
 * char span 内 → インラインラッパーを越えて親コンテナ
 * テキスト葉 → それ自身
 * 祖先方向 → 最初に見つかる text leaf / ラップ済み要素
 */
export function findTextElement(target: Element): HTMLElement | null {
  const isIgnored = (el: Element) => !!el.closest(IGNORE_SELECTOR)

  const charSpan = target.closest(`.${CHAR_CLASS}`)
  if (charSpan) {
    let container = charSpan.parentElement
    while (container && INLINE_TAGS.has(container.tagName)) {
      container = container.parentElement
    }
    if (container) return container as HTMLElement
  }

  if (isTextLeaf(target) && !isIgnored(target)) {
    return target as HTMLElement
  }

  let current: Element | null = target
  while (current && current !== document.body) {
    if (!isIgnored(current) && (isTextLeaf(current) || isOurWrapped(current))) {
      return current as HTMLElement
    }
    current = current.parentElement
  }
  return null
}
