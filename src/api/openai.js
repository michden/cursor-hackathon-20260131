const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const CHAT_SYSTEM_PROMPT = `You are a helpful assistant for VisionCheck AI, an eye health screening app.

IMPORTANT GUIDELINES:
- You are NOT a medical professional and cannot provide medical diagnoses
- This is for educational and informational purposes only
- Always recommend consulting an eye care professional for health concerns
- Stay focused on eye health, vision, and related topics
- Be reassuring but honest about the limitations of AI analysis
- If users describe symptoms that could be serious (sudden vision loss, eye pain, flashes of light, floaters), urge them to seek immediate professional care

You can help with:
- Explaining what test results mean (visual acuity, color vision, contrast sensitivity, Amsler grid)
- General eye health education
- Answering questions about common eye conditions
- Explaining when someone should see an eye doctor
- Tips for maintaining eye health

You should decline to:
- Diagnose specific conditions
- Recommend specific treatments or medications
- Provide advice outside of eye/vision health
- Make claims about the medical accuracy of app results

Keep responses concise and friendly. Use simple language that's easy to understand.`

// Format test results into a readable summary for the AI
function formatTestResultsSummary(testResults) {
  if (!testResults) return ''
  
  const parts = []
  
  // Visual Acuity
  if (testResults.visualAcuity?.left || testResults.visualAcuity?.right) {
    const va = testResults.visualAcuity
    const leftVA = va.left ? `Left: ${va.left.snellen}` : null
    const rightVA = va.right ? `Right: ${va.right.snellen}` : null
    const vaResults = [leftVA, rightVA].filter(Boolean).join(', ')
    if (vaResults) parts.push(`Visual Acuity: ${vaResults}`)
  }
  
  // Color Vision
  if (testResults.colorVision) {
    const cv = testResults.colorVision
    parts.push(`Color Vision: ${cv.correctCount}/${cv.totalPlates} plates correct (${cv.status})`)
  }
  
  // Contrast Sensitivity
  if (testResults.contrastSensitivity?.left || testResults.contrastSensitivity?.right) {
    const cs = testResults.contrastSensitivity
    const leftCS = cs.left ? `Left: ${cs.left.logCS?.toFixed(2)} logCS` : null
    const rightCS = cs.right ? `Right: ${cs.right.logCS?.toFixed(2)} logCS` : null
    const csResults = [leftCS, rightCS].filter(Boolean).join(', ')
    if (csResults) parts.push(`Contrast Sensitivity: ${csResults}`)
  }
  
  // Amsler Grid
  if (testResults.amslerGrid?.left || testResults.amslerGrid?.right) {
    const ag = testResults.amslerGrid
    const leftAG = ag.left ? `Left: ${ag.left.hasIssues ? 'issues detected' : 'no issues'}` : null
    const rightAG = ag.right ? `Right: ${ag.right.hasIssues ? 'issues detected' : 'no issues'}` : null
    const agResults = [leftAG, rightAG].filter(Boolean).join(', ')
    if (agResults) parts.push(`Amsler Grid: ${agResults}`)
  }
  
  if (parts.length === 0) return ''
  
  return `\n\nThe user has completed the following tests in VisionCheck AI:\n${parts.join('\n')}\n\nYou may reference these results when relevant to provide context-aware responses.`
}

/**
 * Send a chat message to the OpenAI API
 * @param {Array} messages - Conversation history [{role: 'user'|'assistant', content: string}]
 * @param {Object} testResults - User's test results from TestResultsContext
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<string>} - Assistant's response
 */
export async function sendChatMessage(messages, testResults, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key is required')
  }

  if (!messages || messages.length === 0) {
    throw new Error('At least one message is required')
  }

  // Build system prompt with optional test results context
  const systemPrompt = CHAT_SYSTEM_PROMPT + formatTestResultsSummary(testResults)

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.2',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_completion_tokens: 500,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
}

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
