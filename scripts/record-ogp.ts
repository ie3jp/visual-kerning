/**
 * OGP用 GIF を生成するスクリプト
 *
 * recorder の content.html シナリオを Playwright で録画し、
 * ffmpeg で 2パス GIF に変換する。
 *
 * Usage: npx playwright test --config scripts/playwright.ogp.config.ts
 */
import { test } from '@playwright/test'
import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from 'fs'
import { join } from 'path'

const OGP_WIDTH = 1200
const OGP_HEIGHT = 630
const FPS = '15'

const OUTPUT_DIR = join(process.cwd(), '.github', 'readme')
const VIDEO_PATH = join(OUTPUT_DIR, 'ogp-raw.webm')
const GIF_PATH = join(OUTPUT_DIR, 'ogp.gif')

test('record OGP gif', async ({ browser }) => {
  test.setTimeout(120_000)

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true })

  const context = await browser.newContext({
    viewport: { width: OGP_WIDTH, height: OGP_HEIGHT },
    recordVideo: { dir: OUTPUT_DIR, size: { width: OGP_WIDTH, height: OGP_HEIGHT } },
  })

  const page = await context.newPage()

  await page.goto('/content.html')

  // シナリオ完了を待つ（content側で window.__recordingDone = true が設定される）
  await page.waitForFunction(() => (window as any).__recordingDone === true, null, {
    timeout: 90_000,
  })

  // 少し余韻
  await page.waitForTimeout(1500)

  await context.close()

  // 録画ファイルを探す（Playwrightはランダム名で保存する）
  const files = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.webm') && f !== 'ogp-raw.webm')
  if (files.length > 0) {
    renameSync(join(OUTPUT_DIR, files[files.length - 1]), VIDEO_PATH)
  }

  // ffmpeg で GIF に変換（2パス: パレット生成 → GIF生成）
  const palettePath = join(OUTPUT_DIR, 'ogp-palette.png')

  // 1フレーム目をスキップ
  const skipSec = '0.333'

  execFileSync('ffmpeg', [
    '-y', '-ss', skipSec, '-i', VIDEO_PATH,
    '-vf', `fps=${FPS},scale=${OGP_WIDTH}:-1:flags=lanczos,palettegen=stats_mode=diff`,
    palettePath,
  ], { stdio: 'inherit' })

  execFileSync('ffmpeg', [
    '-y', '-ss', skipSec, '-i', VIDEO_PATH, '-i', palettePath,
    '-lavfi', `fps=${FPS},scale=${OGP_WIDTH}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
    '-loop', '0',
    GIF_PATH,
  ], { stdio: 'inherit' })

  // 中間ファイル削除
  try { unlinkSync(VIDEO_PATH) } catch {}
  try { unlinkSync(palettePath) } catch {}

  console.log(`\n✅ OGP GIF saved to ${GIF_PATH}`)
})
