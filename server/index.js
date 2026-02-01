import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' })) // Allow large payloads for images

// Validate API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. API calls will fail.')
}

/**
 * POST /api/chat
 * Proxy for OpenAI chat completions
 */
app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    const { messages, systemPrompt, maxTokens = 500 } = req.body

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' })
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...messages
        ],
        max_completion_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return res.status(response.status).json({ 
        error: error.error?.message || `API error: ${response.status}` 
      })
    }

    const data = await response.json()
    res.json({
      content: data.choices[0]?.message?.content || 'No response generated'
    })
  } catch (error) {
    console.error('Chat API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/analyze
 * Proxy for OpenAI vision API (eye photo analysis)
 */
app.post('/api/analyze', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' })
    }

    const { imageBase64, prompt, maxTokens = 1000 } = req.body

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' })
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.includes('base64,') 
      ? imageBase64.split('base64,')[1] 
      : imageBase64

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:image/jpeg;base64,${base64Data}`,
                  detail: 'high'
                } 
              }
            ]
          }
        ],
        max_completion_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return res.status(response.status).json({ 
        error: error.error?.message || `API error: ${response.status}` 
      })
    }

    const data = await response.json()
    res.json({
      content: data.choices[0]?.message?.content || 'No analysis available'
    })
  } catch (error) {
    console.error('Analyze API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    apiKeyConfigured: !!process.env.OPENAI_API_KEY 
  })
})

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
  console.log(`OpenAI API key: ${process.env.OPENAI_API_KEY ? 'configured' : 'NOT configured'}`)
})
