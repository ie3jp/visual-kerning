interface PanelControllerOptions {
  panelEl: HTMLDivElement
  panelBodyEl: HTMLDivElement
  collapseBtn: HTMLButtonElement
  getCollapseLabel(): string
  getExpandLabel(): string
}

export interface KerningUIPanelController {
  setCollapsed(next: boolean): void
  toggleCollapsed(): void
  positionDefault(): void
  onResize(): void
  startDrag(event: PointerEvent): void
  dispose(): void
}

export function createKerningUIPanelController(options: PanelControllerOptions): KerningUIPanelController {
  const { panelEl, panelBodyEl, collapseBtn, getCollapseLabel, getExpandLabel } = options

  let collapsed = false
  let panelPositioned = false
  let panelX = 0
  let panelY = 0
  let dragPointerId: number | null = null
  let dragOffsetX = 0
  let dragOffsetY = 0

  function clampPanelPosition(x: number, y: number) {
    const margin = 12
    const width = panelEl.offsetWidth || 280
    const height = panelEl.offsetHeight || 120
    return {
      x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - width - margin)),
      y: Math.min(Math.max(margin, y), Math.max(margin, window.innerHeight - height - margin)),
    }
  }

  function syncPanelPosition() {
    const next = clampPanelPosition(panelX, panelY)
    panelX = next.x
    panelY = next.y
    panelEl.style.left = `${panelX}px`
    panelEl.style.top = `${panelY}px`
  }

  function onPointerMove(event: PointerEvent) {
    if (dragPointerId !== event.pointerId) return
    panelX = event.clientX - dragOffsetX
    panelY = event.clientY - dragOffsetY
    syncPanelPosition()
  }

  function onPointerEnd(event: PointerEvent) {
    if (dragPointerId !== event.pointerId) return
    dragPointerId = null
    panelEl.classList.remove('is-dragging')
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerEnd)
    window.removeEventListener('pointercancel', onPointerEnd)
  }

  function setCollapsed(next: boolean) {
    collapsed = next
    panelEl.classList.toggle('is-collapsed', collapsed)
    panelBodyEl.hidden = collapsed
    const label = collapsed ? getExpandLabel() : getCollapseLabel()
    collapseBtn.textContent = collapsed ? '+' : '−'
    collapseBtn.setAttribute('aria-label', label)
    collapseBtn.title = label
    window.requestAnimationFrame(syncPanelPosition)
  }

  return {
    setCollapsed,
    toggleCollapsed() {
      setCollapsed(!collapsed)
    },
    positionDefault() {
      if (!panelPositioned) {
        const rect = panelEl.getBoundingClientRect()
        panelX = window.innerWidth - rect.width - 16
        panelY = window.innerHeight - rect.height - 16
        panelPositioned = true
      }
      syncPanelPosition()
    },
    onResize() {
      if (panelPositioned) syncPanelPosition()
    },
    startDrag(event: PointerEvent) {
      const target = event.target as HTMLElement
      if (target.closest('button')) return
      const rect = panelEl.getBoundingClientRect()
      dragPointerId = event.pointerId
      dragOffsetX = event.clientX - rect.left
      dragOffsetY = event.clientY - rect.top
      panelEl.classList.add('is-dragging')
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerEnd)
      window.addEventListener('pointercancel', onPointerEnd)
    },
    dispose() {
      dragPointerId = null
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerEnd)
      window.removeEventListener('pointercancel', onPointerEnd)
    },
  }
}
