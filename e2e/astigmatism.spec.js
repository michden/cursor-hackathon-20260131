import { test, expect } from '@playwright/test'

test.describe('Astigmatism Screening Test', () => {
  test('displays home page with Astigmatism option', async ({ page }) => {
    await page.goto('/')
    
    // Check Astigmatism test option is visible
    await expect(page.getByText('Astigmatism Screening')).toBeVisible()
    await expect(page.getByText('Clock dial test for corneal curvature')).toBeVisible()
  })

  test('navigates to eye selection screen', async ({ page }) => {
    await page.goto('/')
    
    // Click on Astigmatism Screening
    await page.click('text=Astigmatism Screening')
    
    // Should be on the astigmatism page with eye selection
    await expect(page).toHaveURL('/astigmatism')
    await expect(page.getByText('Astigmatism Screening')).toBeVisible()
    await expect(page.getByText('Left')).toBeVisible()
    await expect(page.getByText('Right')).toBeVisible()
  })

  test('shows instructions after selecting eye', async ({ page }) => {
    await page.goto('/astigmatism')
    
    // Select left eye
    await page.click('text=Left')
    
    // Should show instructions
    await expect(page.getByText(/Instructions:/)).toBeVisible()
    await expect(page.getByText(/Cover your/)).toBeVisible()
    await expect(page.getByText(/Focus on the red dot/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
  })

  test('starts the astigmatism test', async ({ page }) => {
    await page.goto('/astigmatism')
    
    // Select left eye
    await page.click('text=Left')
    
    // Click Start Test
    await page.click('text=Start Test')
    
    // Should see the clock dial and question
    await expect(page.getByText(/Do any lines appear darker/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'All lines appear equal' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirm Selection' })).toBeVisible()
  })

  test('back button returns to home from eye selection', async ({ page }) => {
    await page.goto('/astigmatism')
    
    await page.click('text=← Back')
    
    await expect(page).toHaveURL('/')
  })

  test('exit button during test returns to eye selection', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    
    await page.click('text=← Exit')
    
    // Should return to eye selection phase
    await expect(page.getByText('Left')).toBeVisible()
    await expect(page.getByText('Right')).toBeVisible()
  })
})

test.describe('Astigmatism Test - Test Flow', () => {
  test('completes test with all lines equal', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    
    // Click All lines appear equal
    await page.click('text=All lines appear equal')
    
    // Click Confirm Selection
    await page.click('text=Confirm Selection')
    
    // Should show completion screen with no astigmatism
    await expect(page.getByText('Test Complete!')).toBeVisible()
    await expect(page.getByText('No astigmatism detected')).toBeVisible()
  })

  test('confirm button is disabled until selection is made', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    
    // Confirm button should be disabled initially
    const confirmButton = page.getByRole('button', { name: 'Confirm Selection' })
    await expect(confirmButton).toBeDisabled()
    
    // After clicking all lines equal, it should be enabled
    await page.click('text=All lines appear equal')
    await expect(confirmButton).not.toBeDisabled()
  })
})

test.describe('Astigmatism Test - Complete Screen', () => {
  test('shows normal result with no astigmatism', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    await expect(page.getByText('No astigmatism detected')).toBeVisible()
    await expect(page.getByText('All lines appeared equally clear')).toBeVisible()
  })

  test('shows "What does this mean?" section', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    await expect(page.getByText('What does this mean?')).toBeVisible()
  })

  test('shows disclaimer', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    await expect(page.getByText(/Medical Disclaimer/)).toBeVisible()
  })

  test('shows option to test other eye', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    await expect(page.getByText(/Test Right/)).toBeVisible()
  })

  test('View All Results button navigates to results page', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    await page.click('text=View All Results')
    
    await expect(page).toHaveURL('/results')
  })

  test('Back to Home button navigates to home', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    await page.click('text=Back to Home')
    
    await expect(page).toHaveURL('/')
  })
})

test.describe('Astigmatism Test - Both Eyes', () => {
  test('can test both eyes', async ({ page }) => {
    await page.goto('/astigmatism')
    
    // Test left eye
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    // Click to test other eye
    await page.click('text=Test Right')
    
    // Should be in instructions phase for right eye
    await expect(page.getByText(/Instructions:/)).toBeVisible()
    
    // Complete right eye test
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    // Should show completion for right eye
    await expect(page.getByText('Test Complete!')).toBeVisible()
  })
})

test.describe('Astigmatism Test - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('is usable on mobile viewport', async ({ page }) => {
    await page.goto('/astigmatism')
    
    // Select eye
    await page.click('text=Left')
    
    // Instructions should be visible
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
    
    // Start test
    await page.click('text=Start Test')
    
    // Clock dial and buttons should be visible
    await expect(page.getByRole('button', { name: 'All lines appear equal' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirm Selection' })).toBeVisible()
  })
})

test.describe('Astigmatism Test - Results Integration', () => {
  test('results appear on Health Snapshot page after test', async ({ page }) => {
    await page.goto('/astigmatism')
    await page.click('text=Left')
    await page.click('text=Start Test')
    await page.click('text=All lines appear equal')
    await page.click('text=Confirm Selection')
    
    // Navigate to results
    await page.click('text=View All Results')
    
    // Should show Astigmatism results card
    await expect(page.getByText('Astigmatism').first()).toBeVisible()
  })
})
