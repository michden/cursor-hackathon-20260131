import { test, expect } from '@playwright/test'

test.describe('AI Chat - FAB Visibility', () => {
  test('shows chat FAB on home page', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByRole('button', { name: /open ai chat/i })).toBeVisible()
  })

  test('shows chat FAB on results page', async ({ page }) => {
    await page.goto('/results')
    
    await expect(page.getByRole('button', { name: /open ai chat/i })).toBeVisible()
  })

  test('hides chat FAB on visual acuity test page', async ({ page }) => {
    await page.goto('/visual-acuity')
    
    await expect(page.getByRole('button', { name: /open ai chat/i })).not.toBeVisible()
  })

  test('hides chat FAB on color vision test page', async ({ page }) => {
    await page.goto('/color-vision')
    
    await expect(page.getByRole('button', { name: /open ai chat/i })).not.toBeVisible()
  })

  test('hides chat FAB on contrast sensitivity test page', async ({ page }) => {
    await page.goto('/contrast-sensitivity')
    
    await expect(page.getByRole('button', { name: /open ai chat/i })).not.toBeVisible()
  })

  test('hides chat FAB on amsler grid test page', async ({ page }) => {
    await page.goto('/amsler-grid')
    
    await expect(page.getByRole('button', { name: /open ai chat/i })).not.toBeVisible()
  })

  test('hides chat FAB on eye photo page', async ({ page }) => {
    await page.goto('/eye-photo')
    
    await expect(page.getByRole('button', { name: /open ai chat/i })).not.toBeVisible()
  })
})

test.describe('AI Chat - Drawer Interaction', () => {
  test('opens chat drawer when FAB is clicked', async ({ page }) => {
    await page.goto('/')
    
    await page.click('[aria-label="Open AI chat assistant"]')
    
    await expect(page.getByRole('dialog', { name: /chat with visioncheck ai/i })).toBeVisible()
    await expect(page.getByText('AI Assistant')).toBeVisible()
  })

  test('shows welcome message in empty chat', async ({ page }) => {
    await page.goto('/')
    
    await page.click('[aria-label="Open AI chat assistant"]')
    
    await expect(page.getByText('VisionCheck AI Assistant')).toBeVisible()
    await expect(page.getByText(/Ask me about your test results/)).toBeVisible()
  })

  test('closes chat drawer when close button is clicked', async ({ page }) => {
    await page.goto('/')
    
    await page.click('[aria-label="Open AI chat assistant"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    
    await page.click('[aria-label="Close chat"]')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('closes chat drawer when Escape key is pressed', async ({ page }) => {
    await page.goto('/')
    
    await page.click('[aria-label="Open AI chat assistant"]')
    await expect(page.getByRole('dialog')).toBeVisible()
    
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('hides FAB when chat drawer is open', async ({ page }) => {
    await page.goto('/')
    
    const fab = page.getByRole('button', { name: /open ai chat/i })
    await expect(fab).toBeVisible()
    
    await fab.click()
    
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(fab).not.toBeVisible()
  })
})

test.describe('AI Chat - API Key', () => {
  test('shows API key input when chat is opened', async ({ page }) => {
    await page.goto('/')
    
    await page.click('[aria-label="Open AI chat assistant"]')
    
    await expect(page.getByPlaceholder('sk-...')).toBeVisible()
    await expect(page.getByText(/Your key is only used locally/)).toBeVisible()
  })

  test('disables send button when no API key is set', async ({ page }) => {
    await page.goto('/')
    
    await page.click('[aria-label="Open AI chat assistant"]')
    
    const sendButton = page.getByRole('button', { name: /send message/i })
    await expect(sendButton).toBeDisabled()
  })

  test('hides API key input after saving key', async ({ page }) => {
    await page.goto('/')
    
    await page.click('[aria-label="Open AI chat assistant"]')
    
    await page.fill('[placeholder="sk-..."]', 'sk-test-key-12345')
    await page.click('button:has-text("Save")')
    
    await expect(page.getByPlaceholder('sk-...')).not.toBeVisible()
  })

  test('enables input after saving API key', async ({ page }) => {
    await page.goto('/')
    
    await page.click('[aria-label="Open AI chat assistant"]')
    
    await page.fill('[placeholder="sk-..."]', 'sk-test-key')
    await page.click('button:has-text("Save")')
    
    const messageInput = page.getByPlaceholder('Ask about your eye health...')
    await expect(messageInput).toBeEnabled()
  })
})

test.describe('AI Chat - Messaging UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.click('[aria-label="Open AI chat assistant"]')
    await page.fill('[placeholder="sk-..."]', 'sk-test')
    await page.click('button:has-text("Save")')
  })

  test('shows message input after API key is set', async ({ page }) => {
    await expect(page.getByPlaceholder('Ask about your eye health...')).toBeVisible()
  })

  test('clears input after sending message', async ({ page }) => {
    const input = page.getByPlaceholder('Ask about your eye health...')
    await input.fill('What is 20/20 vision?')
    await page.click('[aria-label="Send message"]')
    
    // Input should be cleared after sending
    await expect(input).toHaveValue('')
  })

  test('shows user message in chat', async ({ page }) => {
    await page.fill('[placeholder="Ask about your eye health..."]', 'What is visual acuity?')
    await page.click('[aria-label="Send message"]')
    
    // User message should appear in chat
    await expect(page.getByText('What is visual acuity?')).toBeVisible()
  })

  test('shows loading indicator while waiting for response', async ({ page }) => {
    await page.fill('[placeholder="Ask about your eye health..."]', 'Hello')
    await page.click('[aria-label="Send message"]')
    
    // Should show loading dots (the animation is 3 bouncing dots)
    // This will quickly resolve to an error since we don't have a real API key
    await expect(page.locator('.animate-bounce').first()).toBeVisible()
  })

  test('shows disclaimer at bottom of chat', async ({ page }) => {
    await expect(page.getByText(/AI responses are for educational purposes only/)).toBeVisible()
  })

  test('clear button removes messages', async ({ page }) => {
    await page.fill('[placeholder="Ask about your eye health..."]', 'Test message')
    await page.click('[aria-label="Send message"]')
    
    await expect(page.getByText('Test message')).toBeVisible()
    
    await page.click('[aria-label="Clear chat"]')
    
    // Should show welcome message again
    await expect(page.getByText('VisionCheck AI Assistant')).toBeVisible()
  })
})

test.describe('AI Chat - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('shows FAB on mobile home page', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByRole('button', { name: /open ai chat/i })).toBeVisible()
  })

  test('chat drawer is full screen on mobile', async ({ page }) => {
    await page.goto('/')
    
    await page.click('[aria-label="Open AI chat assistant"]')
    
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    
    // On mobile, the dialog should take up the full viewport
    const box = await dialog.boundingBox()
    expect(box.width).toBe(375)
    expect(box.height).toBe(667)
  })

  test('shows backdrop on mobile', async ({ page }) => {
    await page.goto('/')
    
    await page.click('[aria-label="Open AI chat assistant"]')
    
    // The backdrop div should exist (it's only shown on mobile via sm:hidden)
    await expect(page.locator('.bg-black\\/40')).toBeVisible()
  })
})
