import { test, expect } from '@playwright/test'

test.describe('Color Vision Test', () => {
  test('navigates to color vision test instructions', async ({ page }) => {
    await page.goto('/')
    
    // Click on Color Vision Test
    await page.click('text=Color Vision Test')
    
    // Should be on the instructions page
    await expect(page).toHaveURL('/color-vision')
    await expect(page.getByText('Ishihara Color Test')).toBeVisible()
    await expect(page.getByText('Instructions:')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
  })

  test('starts the color vision test and shows first plate', async ({ page }) => {
    await page.goto('/color-vision')
    
    // Click Start Test
    await page.click('text=Start Test')
    
    // Should see the plate and number pad
    await expect(page.getByText('What number do you see?')).toBeVisible()
    await expect(page.getByText('Plate 1/8')).toBeVisible()
    
    // Number pad should be visible
    await expect(page.getByRole('button', { name: '1' })).toBeVisible()
    await expect(page.getByRole('button', { name: '0' })).toBeVisible()
    await expect(page.getByRole('button', { name: '→' })).toBeVisible()
  })

  test('allows entering numbers and submitting', async ({ page }) => {
    await page.goto('/color-vision')
    await page.click('text=Start Test')
    
    // Enter a number (first plate is 12)
    await page.getByRole('button', { name: '1' }).click()
    await page.getByRole('button', { name: '2' }).click()
    
    // Should see 12 in the input display
    await expect(page.locator('text=12').first()).toBeVisible()
    
    // Submit
    await page.getByRole('button', { name: '→' }).click()
    
    // Should move to next plate
    await page.waitForTimeout(600) // Wait for feedback animation
    await expect(page.getByText('Plate 2/8')).toBeVisible()
  })

  test('clear button removes input', async ({ page }) => {
    await page.goto('/color-vision')
    await page.click('text=Start Test')
    
    // Enter a number
    await page.getByRole('button', { name: '5' }).click()
    await expect(page.locator('.text-2xl.font-bold').filter({ hasText: '5' })).toBeVisible()
    
    // Clear it
    await page.getByRole('button', { name: '⌫' }).click()
    
    // Should show placeholder
    await expect(page.locator('.text-2xl.font-bold').filter({ hasText: '?' })).toBeVisible()
  })

  test('completes test and shows results', async ({ page }) => {
    await page.goto('/color-vision')
    await page.click('text=Start Test')
    
    // Answer all 8 plates (correct answers: 12, 8, 6, 29, 45, 5, 3, 74)
    const answers = ['12', '8', '6', '29', '45', '5', '3', '74']
    
    for (const answer of answers) {
      // Enter the answer
      for (const digit of answer) {
        await page.getByRole('button', { name: digit }).click()
      }
      
      // Submit
      await page.getByRole('button', { name: '→' }).click()
      await page.waitForTimeout(600) // Wait for feedback and transition
    }
    
    // Should show completion screen
    await expect(page.getByText('Test Complete!')).toBeVisible()
    await expect(page.getByText('Your score:')).toBeVisible()
    await expect(page.getByRole('button', { name: 'View All Results' })).toBeVisible()
  })

  test('back button returns to home', async ({ page }) => {
    await page.goto('/color-vision')
    
    await page.click('text=← Back')
    
    await expect(page).toHaveURL('/')
  })

  test('exit button during test returns to home', async ({ page }) => {
    await page.goto('/color-vision')
    await page.click('text=Start Test')
    
    await page.click('text=← Exit')
    
    await expect(page).toHaveURL('/')
  })
})

test.describe('Color Vision Test - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('is usable on mobile viewport', async ({ page }) => {
    await page.goto('/color-vision')
    
    // Instructions should be visible
    await expect(page.getByText('Ishihara Color Test')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
    
    // Start test
    await page.click('text=Start Test')
    
    // Number pad buttons should be visible and tappable
    const button5 = page.getByRole('button', { name: '5' })
    await expect(button5).toBeVisible()
    
    // Buttons should be reasonably sized for touch
    const box = await button5.boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
  })
})
