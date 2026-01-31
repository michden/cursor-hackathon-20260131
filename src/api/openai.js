const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const EYE_ANALYSIS_PROMPT = `You are an AI assistant helping with a preliminary eye health screening app. Analyze this eye photo for visible health indicators.

IMPORTANT DISCLAIMERS TO INCLUDE IN YOUR RESPONSE:
- This is NOT a medical diagnosis
- This is for educational/screening purposes only
- Always recommend consulting an eye care professional

Please analyze the image and provide:

1. **Image Quality Assessment**: Is the image clear enough for analysis? Is the eye properly visible?

2. **Observations** (only if image is adequate):
   - Redness or irritation: Look for bloodshot appearance or inflammation
   - Sclera (white of eye): Note any discoloration (yellowing, spots)
   - Pupil appearance: Size, shape, symmetry
   - Iris: Any visible abnormalities
   - Eyelid: Swelling, drooping, or other concerns
   - Overall appearance

3. **Summary**: Provide a brief, reassuring summary of observations

4. **Recommendations**: Based on observations, suggest:
   - "Looks healthy - continue regular eye care"
   - "Consider scheduling an eye exam for professional evaluation" 
   - "Recommend seeing an eye care professional soon"

Format your response in a clear, easy-to-read way. Be reassuring but honest. If you cannot properly analyze the image (too blurry, not an eye, etc.), say so clearly.`

export async function analyzeEyePhoto(imageBase64, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required')
  }

  // Remove data URL prefix if present
  const base64Data = imageBase64.includes('base64,') 
    ? imageBase64.split('base64,')[1] 
    : imageBase64

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: 'text', 
              text: EYE_ANALYSIS_PROMPT 
            },
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
      max_completion_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'No analysis available'
}
