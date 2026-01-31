import { test, expect } from '@playwright/test'

test.describe('Amsler Grid Test', () => {
  test('displays home page with Amsler Grid option', async ({ page }) => {
    await page.goto('/')
    
    // Check Amsler Grid test option is visible
    await expect(page.getByText('Amsler Grid')).toBeVisible()
    await expect(page.getByText('Macular degeneration screening')).toBeVisible()
  })

  test('navigates to Amsler Grid test instructions', async ({ page }) => {
    await page.goto('/')
    
    // Click on Amsler Grid
    await page.click('text=Amsler Grid')
    
    // Should be on the instructions page
    await expect(page).toHaveURL('/amsler-grid')
    await expect(page.locator('h2', { hasText: 'Amsler Grid Test' })).toBeVisible()
    await expect(page.getByText('Instructions:')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
  })

  test('shows correct instructions', async ({ page }) => {
    await page.goto('/amsler-grid')
    
    // Check all instructions are visible
    await expect(page.getByText("Hold your phone at arm's length (~40cm)")).toBeVisible()
    await expect(page.getByText('If you wear reading glasses, put them on')).toBeVisible()
    await expect(page.getByText('Cover one eye and focus on the red dot in the center')).toBeVisible()
    await expect(page.getByText('Answer questions about what you see while looking at the dot')).toBeVisible()
    
    // Check warning is visible
    await expect(page.getByText(/Keep your focus on the center red dot/)).toBeVisible()
  })

  test('starts the Amsler Grid test', async ({ page }) => {
    await page.goto('/amsler-grid')
    
    // Click Start Test
    await page.click('text=Start Test')
    
    // Should see the grid and question
    await expect(page.getByText('Focus on the red dot in the center')).toBeVisible()
    await expect(page.getByRole('button', { name: 'No' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible()
    
    // Should show progress indicator
    await expect(page.getByText('1/4')).toBeVisible()
  })

  test('displays first question about missing areas', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    await expect(page.getByText('Do any areas of the grid appear to be missing or blank?')).toBeVisible()
  })

  test('back button returns to home', async ({ page }) => {
    await page.goto('/amsler-grid')
    
    await page.click('text=← Back')
    
    await expect(page).toHaveURL('/')
  })

  test('exit button during test returns to instructions', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    await page.click('text=← Exit')
    
    // Should return to instructions phase
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
  })
})

test.describe('Amsler Grid Test - Question Flow', () => {
  test('progresses through all questions when answering No', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    // Question 1
    await expect(page.getByText('1/4')).toBeVisible()
    await expect(page.getByText(/missing or blank/)).toBeVisible()
    await page.getByRole('button', { name: 'No' }).click()
    
    // Question 2
    await expect(page.getByText('2/4')).toBeVisible()
    await expect(page.getByText(/wavy or bent/)).toBeVisible()
    await page.getByRole('button', { name: 'No' }).click()
    
    // Question 3
    await expect(page.getByText('3/4')).toBeVisible()
    await expect(page.getByText(/blurry or unclear/)).toBeVisible()
    await page.getByRole('button', { name: 'No' }).click()
    
    // Question 4
    await expect(page.getByText('4/4')).toBeVisible()
    await expect(page.getByText(/distorted or different sizes/)).toBeVisible()
    await page.getByRole('button', { name: 'No' }).click()
    
    // Should show completion screen
    await expect(page.getByText('Test Complete!')).toBeVisible()
    await expect(page.getByText('Normal')).toBeVisible()
  })

  test('shows concerns when answering Yes to any question', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    // Answer Yes to first question, No to rest
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    
    // Should show concerns
    await expect(page.getByText('Test Complete!')).toBeVisible()
    await expect(page.getByText('Concerns Noted')).toBeVisible()
  })

  test('shows multiple issues when answering Yes to multiple questions', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    // Answer Yes to first two questions
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'Yes' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    await page.getByRole('button', { name: 'No' }).click()
    
    // Should show reported issues
    await expect(page.getByText('Reported Issues:')).toBeVisible()
  })
})

test.describe('Amsler Grid Test - Complete Screen', () => {
  test('shows normal result with no distortions', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    // Answer No to all
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'No' }).click()
    }
    
    await expect(page.getByText('Normal')).toBeVisible()
    await expect(page.getByText('No distortions detected')).toBeVisible()
    await expect(page.getByText('Continue with regular annual eye exams')).toBeVisible()
  })

  test('shows concerns result with distortions', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    // Answer Yes to all
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Yes' }).click()
    }
    
    await expect(page.getByText('Concerns Noted')).toBeVisible()
    await expect(page.getByText('Some visual distortions were reported')).toBeVisible()
    await expect(page.getByText('Schedule an appointment with an eye care professional')).toBeVisible()
  })

  test('shows "What does this mean?" section', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'No' }).click()
    }
    
    await expect(page.getByText('What does this mean?')).toBeVisible()
  })

  test('shows disclaimer', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'No' }).click()
    }
    
    await expect(page.getByText(/Disclaimer:/)).toBeVisible()
    await expect(page.getByText(/NOT a medical diagnosis/)).toBeVisible()
  })

  test('View All Results button navigates to results page', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'No' }).click()
    }
    
    await page.click('text=View All Results')
    
    await expect(page).toHaveURL('/results')
  })

  test('Back to Home button navigates to home', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'No' }).click()
    }
    
    await page.click('text=Back to Home')
    
    await expect(page).toHaveURL('/')
  })
})

test.describe('Amsler Grid Test - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('is usable on mobile viewport', async ({ page }) => {
    await page.goto('/amsler-grid')
    
    // Instructions should be visible
    await expect(page.locator('h2', { hasText: 'Amsler Grid Test' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
    
    // Start test
    await page.click('text=Start Test')
    
    // Grid and buttons should be visible
    await expect(page.getByRole('button', { name: 'No' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Yes' })).toBeVisible()
    
    // Buttons should be reasonably sized for touch
    const noButton = page.getByRole('button', { name: 'No' })
    const box = await noButton.boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('Amsler Grid Test - Results Integration', () => {
  test('results appear on Health Snapshot page after test', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    // Complete the test
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'No' }).click()
    }
    
    // Navigate to results
    await page.click('text=View All Results')
    
    // Should show Amsler Grid results
    await expect(page.getByText('Amsler Grid').first()).toBeVisible()
    await expect(page.getByText('Complete the Amsler grid test').first()).not.toBeVisible()
  })

  test('concerns are shown on Health Snapshot when issues detected', async ({ page }) => {
    await page.goto('/amsler-grid')
    await page.click('text=Start Test')
    
    // Answer Yes to first question
    await page.getByRole('button', { name: 'Yes' }).click()
    
    // Answer No to rest
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'No' }).click()
    }
    
    // Navigate to results
    await page.click('text=View All Results')
    
    // Should show review status (warning)
    await expect(page.getByText('Concerns Noted')).toBeVisible()
  })
})
