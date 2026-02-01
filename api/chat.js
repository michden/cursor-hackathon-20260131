const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * Vercel Serverless Function for OpenAI chat completions
 * POST /api/chat
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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
}
