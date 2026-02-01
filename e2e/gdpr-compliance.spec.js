import { test, expect } from '@playwright/test'

test.describe('GDPR Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test.describe('Consent Banner', () => {
    test('should show consent banner on first visit', async ({ page }) => {
      await page.goto('/')
      
      // Wait for any onboarding to complete or skip it
      const onboardingSkip = page.locator('button:has-text("Skip")')
      if (await onboardingSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
        await onboardingSkip.click()
      }
      
      // Consent banner should be visible
      await expect(page.locator('[role="dialog"]')).toBeVisible()
      await expect(page.getByText(/Your Privacy Matters/i)).toBeVisible()
    })

    test('should hide consent banner after accepting', async ({ page }) => {
      await page.goto('/')
      
      // Handle onboarding if present
      const onboardingSkip = page.locator('button:has-text("Skip")')
      if (await onboardingSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
        await onboardingSkip.click()
      }
      
      // Accept consent
      await page.getByRole('button', { name: /Accept & Save Data/i }).click()
      
      // Banner should be hidden
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })

    test('should hide consent banner after declining', async ({ page }) => {
      await page.goto('/')
      
      // Handle onboarding if present
      const onboardingSkip = page.locator('button:has-text("Skip")')
      if (await onboardingSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
        await onboardingSkip.click()
      }
      
      // Decline consent
      await page.getByRole('button', { name: /Continue Without Saving/i }).click()
      
      // Banner should be hidden
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })

    test('should not show consent banner on subsequent visits after accepting', async ({ page }) => {
      await page.goto('/')
      
      // Handle onboarding if present
      const onboardingSkip = page.locator('button:has-text("Skip")')
      if (await onboardingSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
        await onboardingSkip.click()
      }
      
      // Accept consent
      await page.getByRole('button', { name: /Accept & Save Data/i }).click()
      
      // Reload page
      await page.reload()
      
      // Banner should not appear
      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    })
  })

  test.describe('Privacy Policy Page', () => {
    test('should be accessible from home page footer', async ({ page }) => {
      await page.goto('/')
      
      // Handle onboarding/consent if present
      const onboardingSkip = page.locator('button:has-text("Skip")')
      if (await onboardingSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
        await onboardingSkip.click()
      }
      
      const acceptButton = page.getByRole('button', { name: /Accept/i })
      if (await acceptButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await acceptButton.click()
      }
      
      // Click privacy link in footer
      await page.getByRole('link', { name: /Privacy/i }).first().click()
      
      // Should be on privacy page
      await expect(page).toHaveURL('/privacy')
      await expect(page.getByText(/Privacy Policy/i)).toBeVisible()
    })

    test('should display all required sections', async ({ page }) => {
      await page.goto('/privacy')
      
      await expect(page.getByText(/What Data We Collect/i)).toBeVisible()
      await expect(page.getByText(/How Data is Stored/i)).toBeVisible()
      await expect(page.getByText(/Third-Party Services/i)).toBeVisible()
      await expect(page.getByText(/Your Rights/i)).toBeVisible()
    })

    test('should have link to data settings', async ({ page }) => {
      await page.goto('/privacy')
      
      await page.getByRole('link', { name: /Manage Your Data/i }).click()
      
      await expect(page).toHaveURL('/settings/data')
    })
  })

  test.describe('Terms of Service Page', () => {
    test('should be accessible from home page footer', async ({ page }) => {
      await page.goto('/')
      
      // Handle onboarding/consent if present
      const onboardingSkip = page.locator('button:has-text("Skip")')
      if (await onboardingSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
        await onboardingSkip.click()
      }
      
      const acceptButton = page.getByRole('button', { name: /Accept/i })
      if (await acceptButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await acceptButton.click()
      }
      
      // Click terms link in footer
      await page.getByRole('link', { name: /Terms/i }).first().click()
      
      // Should be on terms page
      await expect(page).toHaveURL('/terms')
      await expect(page.getByText(/Terms of Service/i)).toBeVisible()
    })

    test('should display medical disclaimer', async ({ page }) => {
      await page.goto('/terms')
      
      await expect(page.getByText(/Medical Disclaimer/i)).toBeVisible()
      await expect(page.getByText(/NOT a medical device/i)).toBeVisible()
    })
  })

  test.describe('Data Settings Page', () => {
    test('should be accessible from home page footer', async ({ page }) => {
      await page.goto('/')
      
      // Handle onboarding/consent if present
      const onboardingSkip = page.locator('button:has-text("Skip")')
      if (await onboardingSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
        await onboardingSkip.click()
      }
      
      const acceptButton = page.getByRole('button', { name: /Accept/i })
      if (await acceptButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await acceptButton.click()
      }
      
      // Click data settings link in footer
      await page.getByRole('link', { name: /Data Settings/i }).first().click()
      
      // Should be on data settings page
      await expect(page).toHaveURL('/settings/data')
      await expect(page.getByText(/Data & Privacy Settings/i)).toBeVisible()
    })

    test('should show consent status', async ({ page }) => {
      // Accept consent first
      await page.goto('/')
      
      const onboardingSkip = page.locator('button:has-text("Skip")')
      if (await onboardingSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
        await onboardingSkip.click()
      }
      
      await page.getByRole('button', { name: /Accept & Save Data/i }).click()
      
      // Go to data settings
      await page.goto('/settings/data')
      
      // Should show consent granted
      await expect(page.getByText(/You have consented to data storage/i)).toBeVisible()
    })

    test('should have export data button', async ({ page }) => {
      await page.goto('/settings/data')
      
      await expect(page.getByRole('button', { name: /Export Data/i })).toBeVisible()
    })

    test('should have delete all data button', async ({ page }) => {
      await page.goto('/settings/data')
      
      await expect(page.getByRole('button', { name: /Delete All Data/i })).toBeVisible()
    })

    test('should allow revoking consent', async ({ page }) => {
      // Accept consent first
      await page.goto('/')
      
      const onboardingSkip = page.locator('button:has-text("Skip")')
      if (await onboardingSkip.isVisible({ timeout: 2000 }).catch(() => false)) {
        await onboardingSkip.click()
      }
      
      await page.getByRole('button', { name: /Accept & Save Data/i }).click()
      
      // Go to data settings
      await page.goto('/settings/data')
      
      // Handle confirm dialog
      page.on('dialog', dialog => dialog.accept())
      
      // Revoke consent
      await page.getByRole('button', { name: /Revoke Consent/i }).click()
      
      // Should show session-only mode
      await expect(page.getByText(/You are using session-only mode/i)).toBeVisible()
    })
  })

  test.describe('Data Export', () => {
    test('should export data as JSON file', async ({ page }) => {
      // Set up some test data
      await page.goto('/')
      await page.evaluate(() => {
        localStorage.setItem('visioncheck-results', JSON.stringify({ test: 'data' }))
        localStorage.setItem('visioncheck-consent', JSON.stringify({ hasConsented: true, consentGiven: true }))
      })
      
      await page.goto('/settings/data')
      
      // Wait for download
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /Export Data/i }).click()
      const download = await downloadPromise
      
      // Check filename
      expect(download.suggestedFilename()).toMatch(/visioncheck-data-.*\.json/)
    })
  })
})
