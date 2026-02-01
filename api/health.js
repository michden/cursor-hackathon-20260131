/**
 * Vercel Serverless Function for API health check
 * GET /api/health
 */
export default async function handler(req, res) {
  res.json({ 
    status: 'ok', 
    apiKeyConfigured: !!process.env.OPENAI_API_KEY 
  })
}
