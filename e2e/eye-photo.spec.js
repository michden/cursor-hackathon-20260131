import { test, expect } from '@playwright/test'

test.describe('Eye Photo Analysis', () => {
  test('navigates to eye photo analysis instructions', async ({ page }) => {
    await page.goto('/')
    
    // Click on Eye Photo Analysis
    await page.click('text=Eye Photo Analysis')
    
    // Should be on the instructions page
    await expect(page).toHaveURL('/eye-photo')
    await expect(page.getByText('AI Eye Analysis')).toBeVisible()
    await expect(page.getByText('For best results:')).toBeVisible()
  })

  test('displays API key input field', async ({ page }) => {
    await page.goto('/eye-photo')
    
    // Should see API key input
    await expect(page.getByText('OpenAI API Key')).toBeVisible()
    await expect(page.getByPlaceholder('sk-...')).toBeVisible()
    
    // Privacy notice
    await expect(page.getByText(/Your API key is only used locally/)).toBeVisible()
  })

  test('take photo button is disabled without API key', async ({ page }) => {
    await page.goto('/eye-photo')
    
    // Button should be disabled
    const takePhotoButton = page.getByRole('button', { name: /Take Photo/ })
    await expect(takePhotoButton).toBeDisabled()
  })

  test('take photo button is enabled with API key', async ({ page }) => {
    await page.goto('/eye-photo')
    
    // Enter API key
    await page.getByPlaceholder('sk-...').fill('sk-test-key-12345')
    
    // Button should be enabled
    const takePhotoButton = page.getByRole('button', { name: /Take Photo/ })
    await expect(takePhotoButton).toBeEnabled()
  })

  test('shows/hides API key with toggle', async ({ page }) => {
    await page.goto('/eye-photo')
    
    const input = page.getByPlaceholder('sk-...')
    const showButton = page.getByRole('button', { name: 'Show' })
    
    // Initially password type
    await expect(input).toHaveAttribute('type', 'password')
    
    // Click show
    await showButton.click()
    await expect(input).toHaveAttribute('type', 'text')
    
    // Click hide
    await page.getByRole('button', { name: 'Hide' }).click()
    await expect(input).toHaveAttribute('type', 'password')
  })

  test('displays important disclaimer', async ({ page }) => {
    await page.goto('/eye-photo')
    
    await expect(page.getByText(/This AI analysis is for educational purposes only/)).toBeVisible()
    await expect(page.getByText(/NOT a medical diagnosis/)).toBeVisible()
  })

  test('upload photo option is available', async ({ page }) => {
    await page.goto('/eye-photo')
    
    // Upload button should be visible
    await expect(page.getByText('Upload Photo')).toBeVisible()
  })

  test('back button returns to home', async ({ page }) => {
    await page.goto('/eye-photo')
    
    await page.click('text=← Back')
    
    await expect(page).toHaveURL('/')
  })

  test('instructions list is complete', async ({ page }) => {
    await page.goto('/eye-photo')
    
    // All 4 instructions should be visible
    await expect(page.getByText('Find good lighting')).toBeVisible()
    await expect(page.getByText('Hold phone steady')).toBeVisible()
    await expect(page.getByText('Open your eye wide')).toBeVisible()
    await expect(page.getByText('Center your eye')).toBeVisible()
  })
})

test.describe('Eye Photo Analysis - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('is usable on mobile viewport', async ({ page }) => {
    await page.goto('/eye-photo')
    
    // Instructions should be visible
    await expect(page.getByText('AI Eye Analysis')).toBeVisible()
    
    // API key input should be visible
    await expect(page.getByPlaceholder('sk-...')).toBeVisible()
    
    // Buttons should be visible
    await expect(page.getByText('Take Photo')).toBeVisible()
    await expect(page.getByText('Upload Photo')).toBeVisible()
  })
})
