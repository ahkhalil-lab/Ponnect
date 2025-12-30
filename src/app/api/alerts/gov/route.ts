import { NextResponse } from 'next/server'
import { parseRSSFeed, categorizeAlert, stripHtml } from '@/lib/rss-parser'

// Government biosecurity RSS feed sources
// Note: These are example URLs - actual feeds may require different endpoints
const GOV_FEEDS = [
    {
        name: 'QLD Biosecurity',
        url: 'https://www.business.qld.gov.au/rss/biosecurity-alerts.rss',
        region: 'QLD',
        source: 'GOV_QLD',
    },
    // Add more feeds as they become available
]

interface GovAlert {
    id: string
    title: string
    message: string
    region: string
    severity: string
    type: string
    activeFrom: string
    activeUntil: string | null
    source: string
    confidence: string
    guidance: string[] | null
    externalId: string
    link: string
}

// Default guidance based on alert type
const DEFAULT_GUIDANCE: Record<string, string[]> = {
    TICK: [
        'Check your dog thoroughly after outdoor activities',
        'Focus on ears, between toes, around eyes and neck',
        'Use veterinary-approved tick prevention products',
        'If you find a tick, remove carefully and seek vet advice',
    ],
    SNAKE: [
        'Keep dogs on leash in snake-prone areas',
        'Avoid tall grass and rocky areas during warm hours',
        'If bitten, keep dog calm and get to vet immediately',
        'Do not attempt to catch or kill the snake',
    ],
    DISEASE: [
        'Ensure vaccinations are up to date',
        'Avoid contact with unknown animals',
        'Consult your vet if symptoms appear',
        'Follow quarantine guidelines if advised',
    ],
    OTHER: [
        'Monitor your local area for updates',
        'Follow advice from local authorities',
        'Keep emergency vet contact handy',
    ],
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const region = searchParams.get('region')

        const alerts: GovAlert[] = []

        // Filter feeds by region if specified
        const feedsToFetch = region && region !== 'all'
            ? GOV_FEEDS.filter(f => f.region === region)
            : GOV_FEEDS

        // Fetch all feeds
        for (const feed of feedsToFetch) {
            try {
                const response = await fetch(feed.url, {
                    next: { revalidate: 3600 }, // Cache for 1 hour
                    headers: {
                        'User-Agent': 'Ponnect/1.0 (Pet Safety Alerts)',
                    },
                })

                if (!response.ok) {
                    console.warn(`Failed to fetch ${feed.name}: ${response.status}`)
                    continue
                }

                const xmlText = await response.text()
                const parsed = parseRSSFeed(xmlText)

                if (!parsed) continue

                // Convert RSS items to alerts
                for (const item of parsed.items) {
                    const categorized = categorizeAlert(item)

                    const alert: GovAlert = {
                        id: `gov-${feed.source}-${item.guid}`,
                        title: item.title,
                        message: stripHtml(item.description).slice(0, 300) +
                            (item.description.length > 300 ? '...' : ''),
                        region: categorized.region || feed.region,
                        severity: categorized.severity,
                        type: categorized.type,
                        activeFrom: item.pubDate
                            ? new Date(item.pubDate).toISOString()
                            : new Date().toISOString(),
                        activeUntil: null, // Gov alerts typically don't specify end dates
                        source: feed.source,
                        confidence: 'VERIFIED', // Government sources are verified
                        guidance: DEFAULT_GUIDANCE[categorized.type] || DEFAULT_GUIDANCE.OTHER,
                        externalId: item.guid,
                        link: item.link,
                    }

                    alerts.push(alert)
                }
            } catch (feedError) {
                console.error(`Error fetching ${feed.name}:`, feedError)
            }
        }

        // Sort by date (newest first)
        alerts.sort((a, b) =>
            new Date(b.activeFrom).getTime() - new Date(a.activeFrom).getTime()
        )

        return NextResponse.json({
            success: true,
            data: alerts,
            source: 'Government Biosecurity Feeds',
            lastUpdated: new Date().toISOString(),
        })
    } catch (error) {
        console.error('Government alerts fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch government alerts' },
            { status: 500 }
        )
    }
}
