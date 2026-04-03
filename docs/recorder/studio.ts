/**
 * Recording Studio — iframe内のコンテンツを録画して WebM で出力
 */

const GIF_WIDTH = 1200
const GIF_HEIGHT = 630

const frame = document.getElementById('frame') as HTMLIFrameElement
const stage = document.getElementById('stage') as HTMLElement
const btnRecord = document.getElementById('btn-record') as HTMLButtonElement
const btnReplay = document.getElementById('btn-replay') as HTMLButtonElement
const status = document.getElementById('status') as HTMLElement
const sizeLabel = document.getElementById('size-label') as HTMLElement

frame.width = String(GIF_WIDTH)
frame.height = String(GIF_HEIGHT)
sizeLabel.textContent = `${GIF_WIDTH}×${GIF_HEIGHT}`

function setStatus(text: string, recording = false) {
  status.textContent = ''
  if (recording) {
    const dot = document.createElement('span')
    dot.className = 'recording-dot'
    status.appendChild(dot)
  }
  status.appendChild(document.createTextNode(text))
}

// ---------------------------------------------------------------------------
// Replay: iframe をリロードしてシナリオを再実行
// ---------------------------------------------------------------------------

btnReplay.addEventListener('click', () => {
  frame.contentWindow?.location.reload()
})

// ---------------------------------------------------------------------------
// Record: getDisplayMedia でタブキャプチャ → iframe領域にクロップ → WebM出力
// ---------------------------------------------------------------------------

btnRecord.addEventListener('click', async () => {
  btnRecord.disabled = true

  try {
    // タブキャプチャ開始
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'browser' } as MediaTrackConstraints,
      // @ts-expect-error -- preferCurrentTab is Chrome-specific
      preferCurrentTab: true,
    })

    const [videoTrack] = stream.getVideoTracks()

    // CropTarget が使えればiframe領域にクロップ
    // @ts-expect-error -- CropTarget is Chrome 104+
    if (typeof CropTarget !== 'undefined') {
      try {
        // @ts-expect-error
        const cropTarget = await CropTarget.fromElement(stage)
        // @ts-expect-error
        await videoTrack.cropTo(cropTarget)
      } catch {
        // クロップ失敗時はフルタブで続行
      }
    }

    // iframe をリロードしてシナリオ再実行
    frame.contentWindow?.location.reload()

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
    })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    setStatus('Recording...', true)
    recorder.start()

    // シナリオ完了を待つ（content側からpostMessageで通知）
    await new Promise<void>((resolve) => {
      function onMsg(e: MessageEvent) {
        if (e.data === 'recording-done') {
          window.removeEventListener('message', onMsg)
          resolve()
        }
      }
      window.addEventListener('message', onMsg)
      // フォールバック: 30秒でタイムアウト
      setTimeout(resolve, 30000)
    })

    recorder.stop()
    stream.getTracks().forEach(t => t.stop())

    // WebM をダウンロード
    await new Promise<void>(resolve => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `visual-kerning-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
        resolve()
      }
    })

    setStatus('Done — WebM downloaded. Convert: ffmpeg -i input.webm -vf "fps=15,scale=800:-1" -loop 0 output.gif')
  } catch (err) {
    setStatus(`Error: ${err instanceof Error ? err.message : err}`)
  } finally {
    btnRecord.disabled = false
  }
})
