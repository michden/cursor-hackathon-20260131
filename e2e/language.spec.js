import { test, expect } from '@playwright/test'

test.describe('Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('visioncheck-language')
      localStorage.setItem('visioncheck-onboarded', 'true')
    })
    await page.reload()
  })

  test('should display language selector on home page', async ({ page }) => {
    await page.goto('/')
    
    // Should see the language selector button with flag
    const langButton = page.locator('button').filter({ hasText: /🇺🇸|🇩🇪/ }).first()
    await expect(langButton).toBeVisible()
  })

  test('should show dropdown with language options when clicked', async ({ page }) => {
    await page.goto('/')
    
    // Click the language selector
    const langButton = page.locator('button').filter({ hasText: /🇺🇸|🇩🇪/ }).first()
    await langButton.click()
    
    // Should show English and Deutsch options
    await expect(page.getByText('English')).toBeVisible()
    await expect(page.getByText('Deutsch')).toBeVisible()
  })

  test('should switch to German when Deutsch is selected', async ({ page }) => {
    await page.goto('/')
    
    // Click the language selector
    const langButton = page.locator('button').filter({ hasText: /🇺🇸|🇩🇪/ }).first()
    await langButton.click()
    
    // Click Deutsch
    await page.getByText('Deutsch').click()
    
    // UI should now be in German
    await expect(page.getByText('Mobile Augengesundheits-Vorsorge')).toBeVisible()
  })

  test('should show German test names after switching language', async ({ page }) => {
    await page.goto('/')
    
    // Switch to German
    const langButton = page.locator('button').filter({ hasText: /🇺🇸|🇩🇪/ }).first()
    await langButton.click()
    await page.getByText('Deutsch').click()
    
    // Check that test names are in German
    await expect(page.getByText('Sehschärfetest')).toBeVisible()
    await expect(page.getByText('Farbsehtest')).toBeVisible()
    await expect(page.getByText('Kontrastempfindlichkeit')).toBeVisible()
    await expect(page.getByText('Amsler-Gitter')).toBeVisible()
  })

  test('should persist language selection after page reload', async ({ page }) => {
    await page.goto('/')
    
    // Switch to German
    const langButton = page.locator('button').filter({ hasText: /🇺🇸|🇩🇪/ }).first()
    await langButton.click()
    await page.getByText('Deutsch').click()
    
    // Wait for language to change
    await expect(page.getByText('Mobile Augengesundheits-Vorsorge')).toBeVisible()
    
    // Reload the page
    await page.reload()
    
    // Should still be in German
    await expect(page.getByText('Mobile Augengesundheits-Vorsorge')).toBeVisible()
  })

  test('should switch back to English', async ({ page }) => {
    await page.goto('/')
    
    // Switch to German first
    let langButton = page.locator('button').filter({ hasText: /🇺🇸|🇩🇪/ }).first()
    await langButton.click()
    await page.getByText('Deutsch').click()
    
    // Wait for German UI
    await expect(page.getByText('Mobile Augengesundheits-Vorsorge')).toBeVisible()
    
    // Switch back to English
    langButton = page.locator('button').filter({ hasText: /🇺🇸|🇩🇪/ }).first()
    await langButton.click()
    await page.getByText('English').click()
    
    // Should be back in English
    await expect(page.getByText('Mobile Eye Health Pre-Screening')).toBeVisible()
  })

  test('should show German disclaimer text', async ({ page }) => {
    await page.goto('/')
    
    // Switch to German
    const langButton = page.locator('button').filter({ hasText: /🇺🇸|🇩🇪/ }).first()
    await langButton.click()
    await page.getByText('Deutsch').click()
    
    // Check for German disclaimer
    await expect(page.getByText('Medizinischer Hinweis')).toBeVisible()
  })

  test('should display German flag after switching to German', async ({ page }) => {
    await page.goto('/')
    
    // Switch to German
    const langButton = page.locator('button').filter({ hasText: /🇺🇸|🇩🇪/ }).first()
    await langButton.click()
    await page.getByText('Deutsch').click()
    
    // The language button should now show German flag
    await expect(page.locator('button').filter({ hasText: '🇩🇪' }).first()).toBeVisible()
  })
})

test.describe('Language in Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Clear onboarding to show it
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('visioncheck-onboarded')
      localStorage.removeItem('visioncheck-language')
    })
  })

  test('should show onboarding in German when language is set to German', async ({ page }) => {
    // Set German language before going to page
    await page.evaluate(() => {
      localStorage.setItem('visioncheck-language', 'de')
    })
    
    await page.goto('/')
    
    // Should show German welcome text
    await expect(page.getByText('Willkommen bei VisionCheck AI')).toBeVisible()
  })
})
