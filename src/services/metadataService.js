// Metadata extraction service - replaces AI-powered extraction
// Uses HTML parsing, Open Graph tags, and rule-based auto-tagging

// Stop words to filter out from tag generation
const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have',
    'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how',
    'your', 'you', 'can', 'all', 'more', 'about', 'into', 'than',
    'them', 'some', 'would', 'make', 'like', 'time', 'just', 'know',
    'take', 'people', 'year', 'way', 'day', 'get', 'use', 'work'
])

// Common tech/domain keywords that should be prioritized as tags
const PRIORITY_KEYWORDS = new Set([
    'react', 'vue', 'angular', 'svelte', 'javascript', 'typescript', 'python',
    'java', 'golang', 'rust', 'php', 'ruby', 'swift', 'kotlin',
    'frontend', 'backend', 'fullstack', 'web', 'mobile', 'desktop',
    'api', 'database', 'cloud', 'devops', 'security', 'testing',
    'framework', 'library', 'tool', 'tutorial', 'guide', 'documentation',
    'ui', 'ux', 'design', 'development', 'programming', 'coding',
    'software', 'app', 'application', 'service', 'platform',
    'open-source', 'opensource', 'github', 'npm', 'package'
])

// Domain-based tag mapping with enhanced coverage
const DOMAIN_TAG_MAP = {
    'github.com': ['github', 'code', 'repository'],
    'gitlab.com': ['gitlab', 'code', 'repository'],
    'bitbucket.org': ['bitbucket', 'code', 'repository'],
    'stackoverflow.com': ['stackoverflow', 'programming', 'qa'],
    'youtube.com': ['youtube', 'video'],
    'youtu.be': ['youtube', 'video'],
    'vimeo.com': ['vimeo', 'video'],
    'medium.com': ['medium', 'blog', 'article'],
    'dev.to': ['dev', 'blog', 'article'],
    'hashnode.com': ['hashnode', 'blog', 'article'],
    'reddit.com': ['reddit', 'discussion'],
    'twitter.com': ['twitter', 'social'],
    'x.com': ['twitter', 'social'],
    'linkedin.com': ['linkedin', 'professional'],
    'facebook.com': ['facebook', 'social'],
    'instagram.com': ['instagram', 'social'],
    'wikipedia.org': ['wikipedia', 'reference'],
    'npmjs.com': ['npm', 'package', 'javascript'],
    'pypi.org': ['python', 'package'],
    'react.dev': ['react', 'javascript', 'frontend'],
    'reactjs.org': ['react', 'javascript', 'frontend'],
    'vuejs.org': ['vue', 'javascript', 'frontend'],
    'angular.io': ['angular', 'javascript', 'frontend'],
    'svelte.dev': ['svelte', 'javascript', 'frontend'],
    'nodejs.org': ['nodejs', 'javascript', 'backend'],
    'python.org': ['python', 'programming'],
    'docs.': ['documentation'],
    'api.': ['api', 'documentation'],
    'developer.': ['documentation', 'development']
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
    try {
        const urlObj = new URL(url)
        return urlObj.hostname.replace('www.', '')
    } catch (error) {
        console.error('Invalid URL:', error)
        return ''
    }
}

/**
 * Extract path-based keywords from URL
 */
function extractPathKeywords(url) {
    try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname
            .split('/')
            .filter(part => part.length > 2)
            .map(part => part.toLowerCase())
            .filter(part => !STOP_WORDS.has(part))

        return pathParts.slice(0, 2) // Take first 2 meaningful path segments
    } catch {
        return []
    }
}

/**
 * Extract domain-based tags
 */
export function extractDomainTags(url) {
    const domain = extractDomain(url)
    const tags = []

    // Check exact domain matches
    if (DOMAIN_TAG_MAP[domain]) {
        tags.push(...DOMAIN_TAG_MAP[domain])
    }

    // Check partial matches (e.g., docs.*, developer.*)
    for (const [pattern, domainTags] of Object.entries(DOMAIN_TAG_MAP)) {
        if (pattern.endsWith('.') && domain.startsWith(pattern.replace('.', ''))) {
            tags.push(...domainTags)
        }
    }

    return [...new Set(tags)] // Remove duplicates
}

/**
 * Extract keywords from text and convert to tags
 */
function extractKeywordsFromText(text, maxTags = 5) {
    if (!text) return []

    // Convert to lowercase and split into words
    const words = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, ' ') // Remove special chars except hyphens
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(word => word.length > 2) // Min 3 characters
        .filter(word => !STOP_WORDS.has(word)) // Remove stop words
        .filter(word => !/^\d+$/.test(word)) // Remove pure numbers

    // Separate priority keywords from regular keywords
    const priorityWords = []
    const regularWords = []

    words.forEach(word => {
        if (PRIORITY_KEYWORDS.has(word)) {
            priorityWords.push(word)
        } else {
            regularWords.push(word)
        }
    })

    // Count word frequency for regular words
    const wordCount = {}
    regularWords.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
    })

    // Sort regular words by frequency
    const sortedRegularWords = Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => word)

    // Combine: priority words first, then frequent regular words
    const allKeywords = [...new Set([...priorityWords, ...sortedRegularWords])]

    return allKeywords.slice(0, maxTags)
}

/**
 * Generate tags from title, description, and URL
 */
export function generateTagsFromText(title, description, url) {
    const tags = []
    const seenTags = new Set()

    // 1. Add domain-based tags first (highest priority)
    const domainTags = extractDomainTags(url)
    domainTags.forEach(tag => {
        if (!seenTags.has(tag)) {
            tags.push(tag)
            seenTags.add(tag)
        }
    })

    // 2. Extract keywords from title (high priority)
    const titleKeywords = extractKeywordsFromText(title, 5)
    titleKeywords.forEach(tag => {
        if (!seenTags.has(tag) && tags.length < 8) {
            tags.push(tag)
            seenTags.add(tag)
        }
    })

    // 3. Extract keywords from description (medium priority)
    const descKeywords = extractKeywordsFromText(description, 5)
    descKeywords.forEach(tag => {
        if (!seenTags.has(tag) && tags.length < 8) {
            tags.push(tag)
            seenTags.add(tag)
        }
    })

    // 4. Add path-based keywords from URL (low priority)
    const pathKeywords = extractPathKeywords(url)
    pathKeywords.forEach(tag => {
        if (!seenTags.has(tag) && tags.length < 8) {
            tags.push(tag)
            seenTags.add(tag)
        }
    })

    // Return top 5-7 tags
    return tags.slice(0, 7)
}

/**
 * Parse HTML and extract metadata
 */
function parseHTMLMetadata(html, url) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')

    // Extract title (priority: og:title > title tag > domain)
    let title =
        doc.querySelector('meta[property="og:title"]')?.content ||
        doc.querySelector('meta[name="og:title"]')?.content ||
        doc.querySelector('title')?.textContent ||
        extractDomain(url)

    title = title.trim()

    // Extract description (priority: og:description > meta description > empty)
    let description =
        doc.querySelector('meta[property="og:description"]')?.content ||
        doc.querySelector('meta[name="og:description"]')?.content ||
        doc.querySelector('meta[name="description"]')?.content ||
        ''

    description = description.trim()

    // Extract keywords from meta keywords tag (if present)
    const metaKeywords = doc.querySelector('meta[name="keywords"]')?.content || ''

    // Extract favicon
    let favicon =
        doc.querySelector('link[rel="icon"]')?.href ||
        doc.querySelector('link[rel="shortcut icon"]')?.href ||
        doc.querySelector('link[rel="apple-touch-icon"]')?.href ||
        `${new URL(url).origin}/favicon.ico`

    // Make favicon absolute if relative
    if (favicon && !favicon.startsWith('http')) {
        favicon = new URL(favicon, url).href
    }

    // Extract Open Graph image
    const ogImage =
        doc.querySelector('meta[property="og:image"]')?.content ||
        doc.querySelector('meta[name="og:image"]')?.content ||
        ''

    return {
        title,
        description,
        favicon,
        ogImage,
        metaKeywords
    }
}

/**
 * Fetch YouTube specific metadata via OEmbed
 */
async function fetchYouTubeMetadata(url) {
    // Try YouTube OEmbed directly
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
        const response = await fetch(oembedUrl)
        if (response.ok) {
            const data = await response.json()
            return {
                title: data.title || '',
                description: data.author_name ? `Video by ${data.author_name}` : '',
                favicon: 'https://www.youtube.com/s/desktop/80165780/img/favicon_32x32.png',
                ogImage: data.thumbnail_url || '',
                metaKeywords: 'youtube, video'
            }
        }
    } catch {
        console.warn('Direct YouTube OEmbed failed, will try via proxy if needed')
    }
    return null
}

/**
 * Fetch URL content via internal API proxy (for production/Vercel)
 */
async function fetchURLContentViaAPI(url) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)

    const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `Server error (HTTP ${response.status})`)
    }

    const data = await response.json()

    if (data.error) {
        throw new Error(data.error)
    }

    return data.html
}

/**
 * Fetch URL content with direct fetch + CORS proxy fallbacks (for dev)
 */
async function fetchURLContentDirect(url) {
    const TIMEOUT = 4000

    const fetchWithTimeout = (url, options, timeout) => {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), timeout)
            )
        ])
    }

    const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ]

    try {
        const response = await fetchWithTimeout(url, {
            method: 'GET',
            mode: 'cors',
            headers: { 'Accept': 'text/html,application/xhtml+xml' }
        }, 1500)

        if (response.ok) {
            return await response.text()
        }
    } catch {
        console.log('Direct fetch failed, trying proxies...')
    }

    const proxyPromises = proxies.map(async (proxyUrl) => {
        const response = await fetchWithTimeout(proxyUrl, {
            method: 'GET',
            headers: { 'Accept': 'text/html,application/xhtml+xml,application/json' }
        }, TIMEOUT)

        if (response.ok) {
            const text = await response.text()
            if (text && text.length > 100) {
                return text
            }
        }
        throw new Error('Invalid response')
    })

    const promiseAny = (promises) => {
        if (Promise.any) return Promise.any(promises)
        return new Promise((resolve, reject) => {
            let rejectedCount = 0
            const errors = []
            if (promises.length === 0) { reject(new Error('No promises')); return }
            promises.forEach((p, index) => {
                Promise.resolve(p).then(resolve).catch((err) => {
                    errors[index] = err
                    rejectedCount++
                    if (rejectedCount === promises.length) {
                        const ErrConstructor = globalThis.AggregateError || Error
                        const aggErr = new ErrConstructor(errors, 'All proxies rejected')
                        reject(aggErr)
                    }
                })
            })
        })
    }

    return await promiseAny(proxyPromises)
}

/**
 * Fetch URL content - uses API proxy in production, direct fetch in dev
 */
async function fetchURLContent(url) {
    if (import.meta.env.PROD) {
        try {
            return await fetchURLContentViaAPI(url)
        } catch (error) {
            console.error('API proxy failed:', error)
            throw error
        }
    } else {
        try {
            return await fetchURLContentDirect(url)
        } catch (error) {
            console.error('All fetch methods failed:', error)
            throw new Error('Unable to reach the website. This might be due to CORS restrictions or the site blocking proxies. Please enter details manually.')
        }
    }
}

/**
 * Main function: Extract metadata from URL
 */
export async function extractMetadata(url) {
    try {
        // Validate URL
        new URL(url) // Throws if invalid

        // 1. Special handling for YouTube
        const domain = extractDomain(url)
        let metadata = null

        if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
            metadata = await fetchYouTubeMetadata(url)
        }

        // 2. If not YouTube or YouTube OEmbed failed, try generic fetch
        if (!metadata) {
            const html = await fetchURLContent(url)
            metadata = parseHTMLMetadata(html, url)
        }

        // Upload image to ImgBB if available
        let processedImage = metadata.ogImage
        if (processedImage) {
            try {
                processedImage = await uploadToImgBB(processedImage)
            } catch (err) {
                console.warn('ImgBB upload failed, falling back to original URL:', err)
            }
        }

        // Generate suggested tags
        const suggestedTags = generateTagsFromText(
            metadata.title,
            metadata.description + ' ' + metadata.metaKeywords,
            url
        )

        return {
            title: metadata.title,
            description: metadata.description,
            favicon: metadata.favicon,
            screenshot: processedImage, // Use ImgBB image if matched
            suggestedTags
        }
    } catch (error) {
        console.error('Error extracting metadata:', error)

        // Fallback: Return basic info from URL with enhanced tag extraction
        const domain = extractDomain(url)
        const domainTags = extractDomainTags(url)
        const pathTags = extractPathKeywords(url)

        // Combine domain and path tags
        const fallbackTags = [...new Set([...domainTags, ...pathTags])]

        return {
            title: domain || 'Untitled Bookmark',
            description: '',
            favicon: `${new URL(url).origin}/favicon.ico`,
            screenshot: '',
            suggestedTags: fallbackTags.length > 0 ? fallbackTags : ['bookmark'],
            error: error.message
        }
    }
}

/**
 * Extract metadata from browser bookmark import
 * (folder names become tags)
 */
export function extractTagsFromFolderPath(folderPath) {
    if (!folderPath) return []

    return folderPath
        .split('/')
        .map(folder => folder.trim().toLowerCase())
        .filter(folder => folder.length > 0 && folder !== 'bookmarks')
        .slice(0, 3) // Max 3 folder-based tags
}

/**
 * Upload image URL to ImgBB
 */
async function uploadToImgBB(imageUrl) {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY
    if (!apiKey) return imageUrl

    try {
        const formData = new FormData()
        formData.append('image', imageUrl)

        // 5 second timeout for upload
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) throw new Error('ImgBB Upload Failed')

        const data = await response.json()
        return data.data.url
    } catch (error) {
        console.warn('ImgBB upload error:', error)
        return imageUrl // Fallback to original
    }
}
