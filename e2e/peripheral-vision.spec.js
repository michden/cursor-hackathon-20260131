import { test, expect } from '@playwright/test'

test.describe('Peripheral Vision Test', () => {
  test('displays home page with Peripheral Vision option', async ({ page }) => {
    await page.goto('/')
    
    // Check Peripheral Vision test option is visible
    await expect(page.getByText('Peripheral Vision Test')).toBeVisible()
    await expect(page.getByText('Glaucoma screening for side vision')).toBeVisible()
  })

  test('navigates to eye selection screen', async ({ page }) => {
    await page.goto('/')
    
    // Click on Peripheral Vision Test
    await page.click('text=Peripheral Vision Test')
    
    // Should be on the peripheral-vision page with eye selection
    await expect(page).toHaveURL('/peripheral-vision')
    await expect(page.getByText('Peripheral Vision Test').first()).toBeVisible()
    await expect(page.getByText('Left')).toBeVisible()
    await expect(page.getByText('Right')).toBeVisible()
  })

  test('shows instructions after selecting eye', async ({ page }) => {
    await page.goto('/peripheral-vision')
    
    // Select left eye
    await page.click('text=Left')
    
    // Should show instructions
    await expect(page.getByText(/Instructions:/)).toBeVisible()
    await expect(page.getByText(/Cover your/)).toBeVisible()
    await expect(page.getByText(/Focus on the red dot/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
  })

  test('starts the peripheral vision test', async ({ page }) => {
    await page.goto('/peripheral-vision')
    
    // Select left eye
    await page.click('text=Left')
    
    // Click Start Test
    await page.click('text=Start Test')
    
    // Should see the test area with instructions
    await expect(page.getByText(/Keep your focus on the red dot/)).toBeVisible()
    await expect(page.getByText(/Tap when you see a white dot/)).toBeVisible()
  })

  test('back button returns to home from eye selection', async ({ page }) => {
    await page.goto('/peripheral-vision')
    
    await page.click('text=← Back')
    
    await expect(page).toHaveURL('/')
  })

  test('exit button during test returns to eye selection', async ({ page }) => {
    await page.goto('/peripheral-vision')
    await page.click('text=Left')
    await page.click('text=Start Test')
    
    await page.click('text=← Exit')
    
    // Should return to eye selection phase
    await expect(page.getByText('Left')).toBeVisible()
    await expect(page.getByText('Right')).toBeVisible()
  })
})

test.describe('Peripheral Vision Test - Test Flow', () => {
  test('shows progress counter during test', async ({ page }) => {
    await page.goto('/peripheral-vision')
    await page.click('text=Left')
    await page.click('text=Start Test')
    
    // Should show counter
    await expect(page.getByText('0/12')).toBeVisible()
  })

  test('test area is clickable', async ({ page }) => {
    await page.goto('/peripheral-vision')
    await page.click('text=Left')
    await page.click('text=Start Test')
    
    // The test area should be present and clickable
    const testArea = page.locator('.bg-slate-900')
    await expect(testArea).toBeVisible()
  })
})

test.describe('Peripheral Vision Test - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('is usable on mobile viewport', async ({ page }) => {
    await page.goto('/peripheral-vision')
    
    // Select eye
    await page.click('text=Left')
    
    // Instructions should be visible
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
    
    // Start test
    await page.click('text=Start Test')
    
    // Test area should be visible
    await expect(page.getByText(/Keep your focus on the red dot/)).toBeVisible()
  })
})

test.describe('Peripheral Vision Test - Instructions', () => {
  test('displays all instruction steps', async ({ page }) => {
    await page.goto('/peripheral-vision')
    await page.click('text=Left')
    
    // Check all instruction steps are visible
    await expect(page.getByText(/Cover your/)).toBeVisible()
    await expect(page.getByText(/Focus on the red dot/)).toBeVisible()
    await expect(page.getByText(/White dots will appear/)).toBeVisible()
    await expect(page.getByText(/Tap anywhere on the screen/)).toBeVisible()
  })

  test('displays note about keeping focus', async ({ page }) => {
    await page.goto('/peripheral-vision')
    await page.click('text=Left')
    
    await expect(page.getByText(/Keep looking at the center dot/)).toBeVisible()
  })
})

test.describe('Peripheral Vision Test - Integration', () => {
  test('peripheral vision card appears on Health Snapshot page', async ({ page }) => {
    await page.goto('/results')
    
    // Should show Peripheral Vision card (even if not tested)
    await expect(page.getByText('Peripheral Vision')).toBeVisible()
  })
})

test.describe('Peripheral Vision Test - Both Eyes', () => {
  test('can select left eye after right eye instructions', async ({ page }) => {
    await page.goto('/peripheral-vision')
    
    // Select right eye first
    await page.click('text=Right')
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
    
    // Go back to eye selection
    await page.click('text=← Back')
    
    // Select left eye
    await page.click('text=Left')
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
  })
})

test.describe('Peripheral Vision Test - Accessibility', () => {
  test('test area has aria-label for screen readers', async ({ page }) => {
    await page.goto('/peripheral-vision')
    await page.click('text=Left')
    await page.click('text=Start Test')
    
    // The test area should have an aria-label
    const testArea = page.locator('[aria-label="Tap to respond"]')
    await expect(testArea).toBeVisible()
  })

  test('test area is keyboard accessible', async ({ page }) => {
    await page.goto('/peripheral-vision')
    await page.click('text=Left')
    await page.click('text=Start Test')
    
    // The test area should have tabindex
    const testArea = page.locator('.bg-slate-900[role="button"]')
    await expect(testArea).toHaveAttribute('tabindex', '0')
  })
})
