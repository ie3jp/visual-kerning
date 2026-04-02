/**
 * ファイルドロップゾーンのセットアップ。
 * オーバーレイ表示 + drag/drop イベントを管理し、クリーンアップ関数を返す。
 */
export function setupDropZone(
  target: HTMLElement,
  label: string,
  accept: (file: File) => boolean,
  onDrop: (file: File) => void,
): () => void {
  const overlay = document.createElement('div')
  overlay.textContent = label
  Object.assign(overlay.style, {
    display: 'none',
    position: 'absolute',
    inset: '0',
    background: 'rgba(26, 26, 26, 0.85)',
    color: '#fff',
    font: '600 13px/1 system-ui, sans-serif',
    letterSpacing: '0.06em',
    borderRadius: 'inherit',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: '1',
  })
  target.style.position = 'relative'
  target.appendChild(overlay)

  let dragCount = 0

  const onDragEnter = (e: Event) => {
    e.preventDefault()
    dragCount++
    overlay.style.display = 'flex'
  }
  const onDragLeave = () => {
    dragCount--
    if (dragCount <= 0) {
      dragCount = 0
      overlay.style.display = 'none'
    }
  }
  const onDragOver = (e: Event) => {
    e.preventDefault()
    ;(e as DragEvent).dataTransfer!.dropEffect = 'copy'
  }
  const onDropHandler = (e: Event) => {
    e.preventDefault()
    dragCount = 0
    overlay.style.display = 'none'
    const file = (e as DragEvent).dataTransfer?.files[0]
    if (!file || !accept(file)) return
    onDrop(file)
  }

  target.addEventListener('dragenter', onDragEnter)
  target.addEventListener('dragleave', onDragLeave)
  target.addEventListener('dragover', onDragOver)
  target.addEventListener('drop', onDropHandler)

  return () => {
    target.removeEventListener('dragenter', onDragEnter)
    target.removeEventListener('dragleave', onDragLeave)
    target.removeEventListener('dragover', onDragOver)
    target.removeEventListener('drop', onDropHandler)
    overlay.remove()
  }
}
