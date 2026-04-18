const KERNING_CLASS_PREFIX = 'visual-kerning-'

/**
 * 要素を一意に識別する CSS セレクタを生成する。
 * id があればそこで打ち切り、なければクラス名 + `:nth-child` で祖先を辿る。
 * 途中で一意になった時点で短い形を返す。
 */
export function generateSelector(el: Element): string {
  const parts: string[] = []
  let current: Element | null = el

  while (current && current !== document.documentElement) {
    if (current === document.body) {
      parts.unshift('body')
      break
    }
    if (current.id) {
      parts.unshift(`#${CSS.escape(current.id)}`)
      break
    }

    let part = current.tagName.toLowerCase()
    const classes = Array.from(current.classList).filter(c => !c.startsWith(KERNING_CLASS_PREFIX))
    if (classes.length) {
      part += classes.map(c => `.${CSS.escape(c)}`).join('')
    }

    if (current.parentElement) {
      const sameTag = Array.from(current.parentElement.children).filter(s => s.tagName === current!.tagName)
      if (sameTag.length > 1) {
        const idx = Array.from(current.parentElement.children).indexOf(current) + 1
        part += `:nth-child(${idx})`
      }
    }

    parts.unshift(part)
    current = current.parentElement
  }

  const full = parts.join(' > ')
  for (let i = parts.length - 1; i >= 0; i--) {
    const short = parts.slice(i).join(' > ')
    try {
      if (document.querySelectorAll(short).length === 1) return short
    } catch {
      // ignore invalid selector candidates
    }
  }
  return full
}
