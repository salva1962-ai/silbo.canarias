import { expect, test } from '@playwright/test'

test('la home carga y muestra el layout principal', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/Silbö Canarias/i)
  await expect(page.locator('body')).toBeVisible()
})
