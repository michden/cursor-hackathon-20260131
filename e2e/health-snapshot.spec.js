import { test, expect } from '@playwright/test'

test.describe('Health Snapshot - No Results', () => {
  test('shows no results message when no tests completed', async ({ page }) => {
    await page.goto('/results')
    
    await expect(page.getByText('No Results Yet')).toBeVisible()
    await expect(page.getByText('Complete at least one test')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start Testing' })).toBeVisible()
  })

  test('start testing link navigates to home', async ({ page }) => {
    await page.goto('/results')
    
    await page.click('text=Start Testing')
    
    await expect(page).toHaveURL('/')
  })

  test('back button returns to home', async ({ page }) => {
    await page.goto('/results')
    
    await page.click('text=← Back')
    
    await expect(page).toHaveURL('/')
  })
})

test.describe('Health Snapshot - With Results', () => {
  test.beforeEach(async ({ page }) => {
    // Complete the visual acuity test first to have results
    await page.goto('/visual-acuity')
    await page.click('text=Start Test')
    
    // Click through until complete
    for (let i = 0; i < 35; i++) {
      const isComplete = await page.getByText('Test Complete!').isVisible().catch(() => false)
      if (isComplete) break
      await page.getByRole('button', { name: '↑' }).click()
      await page.waitForTimeout(350)
    }
    
    // Navigate to results
    await page.click('text=View All Results')
  })

  test('displays visual acuity results', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Visual Acuity' })).toBeVisible()
    await expect(page.getByText('Snellen equivalent')).toBeVisible()
  })

  test('shows overall status', async ({ page }) => {
    await expect(page.getByText('EyeCheck')).toBeVisible()
    await expect(page.getByText('Eye Health Snapshot')).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()
  })

  test('displays recommendation section', async ({ page }) => {
    await expect(page.getByText('Recommendation')).toBeVisible()
  })

  test('displays important disclaimer', async ({ page }) => {
    await expect(page.getByText(/This is a screening tool/)).toBeVisible()
    await expect(page.getByText(/NOT a medical diagnosis/)).toBeVisible()
  })

  test('has share button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Share Results/ })).toBeVisible()
  })

  test('has download button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Download Summary/ })).toBeVisible()
  })

  test('has clear results button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Clear All Results/ })).toBeVisible()
  })

  test('shows pending tests as not done', async ({ page }) => {
    // Color vision and eye photo should show as not done
    await expect(page.getByRole('heading', { name: 'Color Vision' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'AI Eye Analysis' })).toBeVisible()
    
    // At least one "Not Done" badge should be visible
    const notDoneBadges = page.getByText('Not Done')
    await expect(notDoneBadges.first()).toBeVisible()
  })
})

test.describe('Health Snapshot - Multiple Tests', () => {
  test('shows results from multiple tests', async ({ page }) => {
    // Complete visual acuity test
    await page.goto('/visual-acuity')
    await page.click('text=Start Test')
    
    for (let i = 0; i < 35; i++) {
      const isComplete = await page.getByText('Test Complete!').isVisible().catch(() => false)
      if (isComplete) break
      await page.getByRole('button', { name: '→' }).click()
      await page.waitForTimeout(350)
    }
    await page.click('text=Back to Home')
    
    // Complete color vision test
    await page.click('text=Color Vision Test')
    await page.click('text=Start Test')
    
    const answers = ['12', '8', '6', '29', '45', '5', '3', '74']
    for (const answer of answers) {
      for (const digit of answer) {
        await page.getByRole('button', { name: digit }).click()
      }
      await page.getByRole('button', { name: '→' }).click()
      await page.waitForTimeout(600)
    }
    
    await page.click('text=View All Results')
    
    // Both tests should show as complete
    const completeBadges = page.getByText('Complete')
    await expect(completeBadges.first()).toBeVisible()
  })
})

test.describe('Health Snapshot - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('is usable on mobile viewport', async ({ page }) => {
    await page.goto('/results')
    
    // Should show no results message on mobile
    await expect(page.getByText('No Results Yet')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start Testing' })).toBeVisible()
  })
})
