import { visualKerning } from '../../src/kerningUI'
import { createKeyIndicator } from './key-indicator'
import { runRecording } from './scenario'

// 前回のカーニングデータをクリアして初期状態から開始
localStorage.clear()

const isMac = navigator.platform.includes('Mac')
const editor = visualKerning({ locale: 'en', editable: true })
editor.mount()

// 最初からエディタを有効化（Cmd+K をシミュレート）
const enableReady = new Promise<void>(resolve => {
  const dispose = editor.plugin.on('enable', () => { dispose(); resolve() })
})
window.dispatchEvent(new KeyboardEvent('keydown', {
  key: 'k', code: 'KeyK', bubbles: true,
  metaKey: isMac, ctrlKey: !isMac,
}))

const indicator = createKeyIndicator()

enableReady.then(() => runRecording(indicator)).then(() => {
  // Playwrightキャプチャ用フラグ
  ;(window as any).__recordingDone = true
  // 親ウィンドウ（studio）に完了を通知
  if (window.parent !== window) {
    window.parent.postMessage('recording-done', '*')
  }
})
