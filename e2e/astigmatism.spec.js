import { test, expect } from '@playwright/test'

// Skip onboarding for all tests
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('visioncheck-onboarded', 'true')
  })
})

test.describe('Astigmatism Test', () => {
  test('displays home page with Astigmatism option', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Astigmatism Screening')).toBeVisible()
    await expect(page.getByText('Clock dial test for corneal curvature')).toBeVisible()
  })

  test('navigates to Astigmatism test', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Astigmatism Screening')
    await expect(page).toHaveURL('/astigmatism')
  })

  test('shows eye selection on initial load', async ({ page }) => {
    await page.goto('/astigmatism')
    await expect(page.getByText('Which eye would you like to test?')).toBeVisible()
    await expect(page.getByText('Left')).toBeVisible()
    await expect(page.getByText('Right')).toBeVisible()
  })

  test('shows instructions after selecting eye', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await expect(page.getByText('Instructions:')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
  })

  test('shows clock dial during testing', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await expect(page.getByText('Focus on the center dot')).toBeVisible()
    await expect(page.getByRole('button', { name: 'All lines appear equal' })).toBeVisible()
  })

  test('back button returns to home from eye selection', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=← Back')
    await expect(page).toHaveURL('/')
  })
})

test.describe('Astigmatism Test - Line Selection', () => {
  test('can select "All lines equal" and complete test', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    await expect(page.getByText('Eye Complete!')).toBeVisible()
    await expect(page.getByText('No astigmatism detected')).toBeVisible()
  })

  test('shows recommendation for normal result', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    await expect(page.getByText('Continue with regular annual eye exams')).toBeVisible()
  })
})

test.describe('Astigmatism Test - Complete Flow', () => {
  test('can test both eyes', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    // Click the button to test the other eye - this goes to eye selection
    await page.getByRole('button', { name: /Test Right/i }).click()
    // Now select the right eye from eye selection
    await page.click('text=Right')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    await expect(page.getByText('View All Results')).toBeVisible()
  })

  test('results appear on Health Snapshot page', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    // After testing one eye, navigate to results via "Back to Home" then to results page
    await page.click('text=Back to Home')
    await page.goto('/results')
    await expect(page).toHaveURL('/results')
    await expect(page.getByText('Astigmatism').first()).toBeVisible()
  })

  test('shows disclaimer on results', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    await expect(page.getByText(/Disclaimer:/)).toBeVisible()
  })
})

test.describe('Astigmatism Test - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('is usable on mobile viewport', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
    
    await page.click('text=Start Test')
    await expect(page.getByRole('button', { name: 'All lines appear equal' })).toBeVisible()
    
    const button = page.getByRole('button', { name: 'All lines appear equal' })
    const box = await button.boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
  })
})
