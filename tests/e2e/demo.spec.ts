import { test, expect } from '@playwright/test'

test('editor supports compare, collapsing, dragging, and modified highlight', async ({ page }) => {
  await page.goto('/')

  // ツアーのイントロ待ちをスキップしてエディタを即座に有効化
  await page.waitForFunction(() => (window as any).__kerningDemo)
  await page.evaluate(() => {
    ;(window as any).__kerningDemo.enabled.value = true
  })

  await expect
    .poll(async () => page.locator('.visual-kerning-overlay').evaluate((el) => getComputedStyle(el).display), { timeout: 10000 })
    .toBe('block')

  await expect(page.locator('.js-panel')).toContainText('visual kerning')

  const hero = page.locator('.hero')
  await hero.scrollIntoViewIfNeeded()
  await hero.click()

  await page.evaluate(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }))
  })

  await expect(hero).toHaveClass(/visual-kerning-modified/)
  await expect
    .poll(async () => hero.evaluate((el) => getComputedStyle(el).outlineStyle))
    .not.toBe('none')

  // カーニングデータで非ゼロのmarginを持つspanを使う（indent=0のためfirstは0）
  const kernedSpan = page.locator('.hero .visual-kerning-char').nth(2)
  const before = await kernedSpan.evaluate((el) => ({
    marginRight: getComputedStyle(el).marginRight,
    marginLeft: getComputedStyle(el).marginLeft,
  }))
  expect(before.marginRight !== '0px' || before.marginLeft !== '0px').toBeTruthy()

  await page.locator('.js-compare').click()
  const compared = await kernedSpan.evaluate((el) => ({
    marginRight: getComputedStyle(el).marginRight,
    marginLeft: getComputedStyle(el).marginLeft,
  }))
  expect(compared.marginRight).toBe('0px')
  expect(compared.marginLeft).toBe('0px')

  await page.locator('.js-compare').click()
  const restored = await kernedSpan.evaluate((el) => ({
    marginRight: getComputedStyle(el).marginRight,
    marginLeft: getComputedStyle(el).marginLeft,
  }))
  expect(restored).toEqual(before)

  const panel = page.locator('.js-panel')
  const panelBody = page.locator('.js-panel-body')

  await page.locator('.js-collapse').click()
  await expect(panelBody).toBeHidden()
  await page.locator('.js-collapse').click()
  await expect(panelBody).toBeVisible()

  // setCollapsed が rAF 経由でパネル位置を同期するので、描画完了を待ってから基準を取る
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))
  }))

  const panelBefore = await panel.boundingBox()
  if (!panelBefore) throw new Error('Panel not found')

  const handle = page.locator('.js-drag-handle')
  const handleBox = await handle.boundingBox()
  if (!handleBox) throw new Error('Drag handle not found')
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(handleBox.x + handleBox.width / 2 - 80, handleBox.y + handleBox.height / 2 - 60, { steps: 8 })
  await page.mouse.up()

  // ドラッグ移動量が反映されるまで待つ（並列ワーカー下でのレース回避）
  await expect
    .poll(async () => {
      const box = await panel.boundingBox()
      if (!box) return 0
      return Math.max(Math.abs(box.x - panelBefore.x), Math.abs(box.y - panelBefore.y))
    }, { timeout: 2000 })
    .toBeGreaterThan(20)

  const panelAfter = await panel.boundingBox()
  if (!panelAfter) throw new Error('Panel not found after drag')
  expect(Math.abs(panelAfter.x - panelBefore.x) > 20 || Math.abs(panelAfter.y - panelBefore.y) > 20).toBeTruthy()

  const aside = page.locator('.aside p')
  await aside.click()
  await expect(page.locator('.aside p br')).toHaveCount(5)
})
