export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FlowMark/1.0; +https://flowmark.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch ${url} (HTTP ${response.status})`,
      })
    }

    const text = await response.text()

    if (!text || text.length < 50) {
      return res.status(502).json({ error: 'Received empty response from the website' })
    }

    return res.status(200).json({ html: text })
  } catch (error) {
    console.error('Metadata proxy error:', error.message)

    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out' })
    }

    return res.status(502).json({
      error: `Unable to reach the website. ${error.message || 'The site may be blocking requests.'}`,
    })
  }
}
