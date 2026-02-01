const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

/**
 * Vercel Serverless Function for OpenAI vision API (eye photo analysis)
 * POST /api/analyze
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
}

// Increase body size limit for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}
