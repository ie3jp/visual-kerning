/**
 * シンプルな getter/setter ラッパ。
 * 状態を `box.value` で読み書きし、変更時にフックを呼び出せる。
 */
export interface ValueBox<T> {
  value: T
}

export function valueBox<T>(initial: T): ValueBox<T> {
  return { value: initial }
}

/** 値が書き換えられるたびに onChange を呼ぶ ValueBox。 */
export function watchedValueBox<T>(initial: T, onChange: () => void): ValueBox<T> {
  let current = initial
  return {
    get value() { return current },
    set value(next: T) { current = next; onChange() },
  }
}

/** getter ベースの read-only ValueBox。setter は無視される。 */
export function derivedValueBox<T>(getter: () => T): ValueBox<T> {
  return {
    get value() { return getter() },
    set value(_) { /* read-only */ },
  }
}
