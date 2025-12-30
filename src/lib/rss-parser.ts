/**
 * RSS Feed Parser Utility
 * Parses RSS/XML feeds from government biosecurity sources
 */

interface RSSItem {
    title: string
    description: string
    link: string
    pubDate: string
    guid: string
    category?: string
}

interface ParsedFeed {
    title: string
    description: string
    items: RSSItem[]
    lastBuildDate?: string
}

/**
 * Parse an RSS/XML feed string into structured data
 */
export function parseRSSFeed(xmlString: string): ParsedFeed | null {
    try {
        // Simple XML parsing using regex (works for basic RSS feeds)
        // In production, consider using a proper XML parser like xml2js

        const getTagContent = (xml: string, tag: string): string => {
            const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*?)<\\/${tag}>`, 'i')
            const match = xml.match(regex)
            return match ? (match[1] || match[2] || '').trim() : ''
        }

        const feedTitle = getTagContent(xmlString, 'title')
        const feedDescription = getTagContent(xmlString, 'description')
        const lastBuildDate = getTagContent(xmlString, 'lastBuildDate')

        // Extract items
        const items: RSSItem[] = []
        const itemRegex = /<item>([\s\S]*?)<\/item>/gi
        let itemMatch

        while ((itemMatch = itemRegex.exec(xmlString)) !== null) {
            const itemXml = itemMatch[1]
            const item: RSSItem = {
                title: getTagContent(itemXml, 'title'),
                description: getTagContent(itemXml, 'description'),
                link: getTagContent(itemXml, 'link'),
                pubDate: getTagContent(itemXml, 'pubDate'),
                guid: getTagContent(itemXml, 'guid') || getTagContent(itemXml, 'link'),
                category: getTagContent(itemXml, 'category') || undefined,
            }
            items.push(item)
        }

        return {
            title: feedTitle,
            description: feedDescription,
            items,
            lastBuildDate,
        }
    } catch (error) {
        console.error('Failed to parse RSS feed:', error)
        return null
    }
}

/**
 * Determine alert type from RSS item content
 */
export function categorizeAlert(item: RSSItem): {
    type: string
    severity: string
    region: string | null
} {
    const text = `${item.title} ${item.description}`.toLowerCase()

    // Determine type
    let type = 'OTHER'
    if (text.includes('tick') || text.includes('paralysis')) {
        type = 'TICK'
    } else if (text.includes('snake')) {
        type = 'SNAKE'
    } else if (text.includes('heat') || text.includes('heatwave') || text.includes('temperature')) {
        type = 'HEATWAVE'
    } else if (text.includes('disease') || text.includes('outbreak') || text.includes('parvo') || text.includes('virus')) {
        type = 'DISEASE'
    }

    // Determine severity based on keywords
    let severity = 'INFO'
    if (text.includes('emergency') || text.includes('critical') || text.includes('urgent') || text.includes('immediate')) {
        severity = 'EMERGENCY'
    } else if (text.includes('warning') || text.includes('severe') || text.includes('high risk')) {
        severity = 'WARNING'
    } else if (text.includes('watch') || text.includes('advisement') || text.includes('caution')) {
        severity = 'WATCH'
    }

    // Try to extract region
    let region: string | null = null
    const regionPatterns: Record<string, string[]> = {
        'QLD': ['queensland', 'qld', 'brisbane', 'gold coast', 'sunshine coast'],
        'NSW': ['new south wales', 'nsw', 'sydney', 'newcastle'],
        'VIC': ['victoria', 'vic', 'melbourne', 'geelong'],
        'SA': ['south australia', 'sa', 'adelaide'],
        'WA': ['western australia', 'wa', 'perth'],
        'TAS': ['tasmania', 'tas', 'hobart'],
        'NT': ['northern territory', 'nt', 'darwin'],
        'ACT': ['act', 'canberra', 'australian capital'],
    }

    for (const [code, patterns] of Object.entries(regionPatterns)) {
        if (patterns.some(p => text.includes(p))) {
            region = code
            break
        }
    }

    return { type, severity, region }
}

/**
 * Clean HTML from description text
 */
export function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
}
