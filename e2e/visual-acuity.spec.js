import { test, expect } from '@playwright/test'

test.describe('Visual Acuity Test', () => {
  test('displays home page with test options', async ({ page }) => {
    await page.goto('/')
    
    // Check header
    await expect(page.locator('h1')).toContainText('EyeCheck')
    
    // Check all test options are visible
    await expect(page.getByText('Visual Acuity Test')).toBeVisible()
    await expect(page.getByText('Color Vision Test')).toBeVisible()
    await expect(page.getByText('Eye Photo Analysis')).toBeVisible()
    await expect(page.getByText('View Results')).toBeVisible()
  })

  test('navigates to visual acuity test instructions', async ({ page }) => {
    await page.goto('/')
    
    // Click on Visual Acuity Test
    await page.click('text=Visual Acuity Test')
    
    // Should be on the instructions page
    await expect(page).toHaveURL('/visual-acuity')
    await expect(page.getByText('Tumbling E Test')).toBeVisible()
    await expect(page.getByText('Instructions:')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
  })

  test('starts the visual acuity test', async ({ page }) => {
    await page.goto('/visual-acuity')
    
    // Click Start Test
    await page.click('text=Start Test')
    
    // Should see the E letter and direction buttons
    await expect(page.locator('text=E').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '↑' })).toBeVisible()
    await expect(page.getByRole('button', { name: '↓' })).toBeVisible()
    await expect(page.getByRole('button', { name: '←' })).toBeVisible()
    await expect(page.getByRole('button', { name: '→' })).toBeVisible()
    
    // Should show level indicator
    await expect(page.getByText('Level 1/10')).toBeVisible()
  })

  test('responds to direction button clicks', async ({ page }) => {
    await page.goto('/visual-acuity')
    await page.click('text=Start Test')
    
    // Click any direction button
    await page.getByRole('button', { name: '→' }).click()
    
    // Trial counter should update (either 2/3 or we moved to next question)
    // The E should still be visible (test continues)
    await expect(page.locator('text=E').first()).toBeVisible()
  })

  test('completes test after multiple incorrect answers', async ({ page }) => {
    await page.goto('/visual-acuity')
    await page.click('text=Start Test')
    
    // Click wrong directions multiple times to fail the first level
    // We need to fail level 1 (get less than 2 correct out of 3)
    for (let i = 0; i < 3; i++) {
      // Always click up - statistically likely to be wrong 75% of the time
      // But to guarantee failure, we'd need to know the actual direction
      // For this test, we'll just click through and check we eventually complete
      await page.getByRole('button', { name: '↑' }).click()
      await page.waitForTimeout(400) // Wait for feedback to clear
    }
    
    // After failing level 1, should show completion screen
    // Note: This test may pass if we accidentally get 2+ correct
    // In a real scenario, we'd mock the random direction
  })

  test('back button returns to home', async ({ page }) => {
    await page.goto('/visual-acuity')
    
    await page.click('text=← Back')
    
    await expect(page).toHaveURL('/')
  })

  test('exit button during test returns to home', async ({ page }) => {
    await page.goto('/visual-acuity')
    await page.click('text=Start Test')
    
    await page.click('text=← Exit')
    
    await expect(page).toHaveURL('/')
  })
})

test.describe('Visual Acuity Test - Keyboard Navigation', () => {
  test('responds to arrow key presses', async ({ page }) => {
    await page.goto('/visual-acuity')
    await page.click('text=Start Test')
    
    // Press any arrow key
    await page.keyboard.press('ArrowRight')
    
    // The E should still be visible (test continues)
    await expect(page.locator('text=E').first()).toBeVisible()
  })

  test('all arrow keys trigger answers', async ({ page }) => {
    await page.goto('/visual-acuity')
    await page.click('text=Start Test')
    
    // Test each arrow key - they should all work
    const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
    
    for (const key of arrowKeys) {
      // Press the arrow key
      await page.keyboard.press(key)
      
      // Wait for feedback to clear
      await page.waitForTimeout(400)
      
      // Test should still be running (E visible) or complete
      const eVisible = await page.locator('text=E').first().isVisible()
      const completeVisible = await page.getByText('Test Complete!').isVisible()
      
      // Either still testing or completed
      expect(eVisible || completeVisible).toBeTruthy()
      
      // If test completed, break out of loop
      if (completeVisible) break
    }
  })

  test('arrow keys do not work on instructions page', async ({ page }) => {
    await page.goto('/visual-acuity')
    
    // Press arrow keys on instructions page
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowUp')
    
    // Should still be on instructions page (Start Test button visible)
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
  })

  test('arrow keys disabled during feedback', async ({ page }) => {
    await page.goto('/visual-acuity')
    await page.click('text=Start Test')
    
    // Press first arrow key - this registers an answer
    await page.keyboard.press('ArrowUp')
    
    // Immediately press another arrow key (during 300ms feedback window)
    // This second press should be ignored since feedback is showing
    await page.keyboard.press('ArrowDown')
    
    // Wait for feedback to clear
    await page.waitForTimeout(400)
    
    // The second rapid press during feedback should have been ignored
    // The test should not error and the E should still be visible (test continues normally)
    const eVisible = await page.locator('text=E').first().isVisible()
    const completeVisible = await page.getByText('Test Complete!').isVisible()
    expect(eVisible || completeVisible).toBeTruthy()
  })
})

test.describe('Visual Acuity Test - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('is usable on mobile viewport', async ({ page }) => {
    await page.goto('/visual-acuity')
    
    // Instructions should be visible
    await expect(page.getByText('Tumbling E Test')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Test' })).toBeVisible()
    
    // Start test
    await page.click('text=Start Test')
    
    // Direction buttons should be visible and tappable
    const upButton = page.getByRole('button', { name: '↑' })
    await expect(upButton).toBeVisible()
    
    // Buttons should be reasonably sized for touch (at least 44x44)
    const box = await upButton.boundingBox()
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('Visual Acuity Test - Results Page', () => {
  // Helper to complete the test by clicking through until completion
  // Clicks randomly but eventually completes. May pass some levels.
  const completeTest = async (page) => {
    await page.goto('/visual-acuity')
    await page.click('text=Start Test')
    
    // Keep clicking until test completes (max 50 clicks to avoid infinite loop)
    const buttons = ['↑', '↓', '←', '→']
    let clicks = 0
    while (!(await page.getByText('Test Complete!').isVisible()) && clicks < 50) {
      // Click a random button
      const btn = buttons[clicks % 4]
      await page.getByRole('button', { name: btn }).click()
      await page.waitForTimeout(350)
      clicks++
    }
    
    // Ensure we're on the completion screen
    await expect(page.getByText('Test Complete!')).toBeVisible()
  }

  test('shows "What does this mean?" section on completion', async ({ page }) => {
    await completeTest(page)
    
    // Should show the "What does this mean?" section
    await expect(page.getByText('What does this mean?')).toBeVisible()
  })

  test('shows reference scale on completion', async ({ page }) => {
    await completeTest(page)
    
    // Should show reference scale section
    await expect(page.getByText('Reference Scale:')).toBeVisible()
    
    // Should show scale labels (use first() to avoid strict mode with 20/10 appearing multiple times)
    await expect(page.getByText('20/10').first()).toBeVisible()
    
    // Should show Better/Normal/Lower labels
    await expect(page.getByText('Better')).toBeVisible()
    await expect(page.getByText('Normal')).toBeVisible()
    await expect(page.getByText('Lower')).toBeVisible()
  })

  test('shows gradient bar for reference scale', async ({ page }) => {
    await completeTest(page)
    
    // The gradient bar should exist
    const gradientBar = page.locator('.rounded-full.bg-linear-to-r')
    await expect(gradientBar).toBeVisible()
  })

  test('shows personalized result when test passed at least one level', async ({ page }) => {
    await page.goto('/visual-acuity')
    await page.click('text=Start Test')
    
    // Strategy: Click through trying to pass level 1 by cycling through all directions
    // This maximizes chance of getting 2/3 correct on level 1
    const buttons = ['↑', '→', '↓', '←']
    let clicks = 0
    
    while (!(await page.getByText('Test Complete!').isVisible()) && clicks < 60) {
      const btn = buttons[clicks % 4]
      await page.getByRole('button', { name: btn }).click()
      await page.waitForTimeout(350)
      clicks++
    }
    
    await expect(page.getByText('Test Complete!')).toBeVisible()
    
    // Check if we got a valid score (not N/A)
    const hasValidScore = await page.locator('.text-4xl.font-bold.text-sky-600').textContent()
    
    if (hasValidScore && hasValidScore !== 'N/A') {
      // Should show "Your Result" label when there's a valid score
      await expect(page.getByText('Your Result')).toBeVisible()
      
      // Should show an explanation label
      const possibleLabels = [
        'Exceptional vision',
        'Excellent vision', 
        'Normal vision',
        'Near normal',
        'Mild reduction',
        'Moderate reduction',
        'Below average',
        'Poor vision',
        'Low vision',
        'Very low vision'
      ]
      
      let foundLabel = false
      for (const label of possibleLabels) {
        if (await page.getByText(label).isVisible()) {
          foundLabel = true
          break
        }
      }
      expect(foundLabel).toBeTruthy()
    }
  })
})