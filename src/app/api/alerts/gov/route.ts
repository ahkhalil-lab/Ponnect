import { NextResponse } from 'next/server'
import { parseRSSFeed, categorizeAlert, stripHtml } from '@/lib/rss-parser'
import { generateAlertGuidance } from '@/lib/ai-guidance'

/**
 * Government and Official Biosecurity Alert Sources
 * 
 * Source reliability:
 * - DAFF (Federal): High-quality national exotic disease bulletins
 * - NSW DPI: State-level biosecurity alerts (via FetchRSS/RSSMix as published by NSW DPI)
 * - QLD DPI: Placeholder - need to discover XHR endpoint from dynamic alerts page
 */
const GOV_FEEDS = [
    // Federal - DAFF Emergency and Exotic Animal Diseases Bulletin
    {
        name: 'DAFF EAD Bulletin',
        url: 'https://www.agriculture.gov.au/pests-diseases-weeds/animal/ead-bulletin/media_releases_rss',
        region: null, // National - applies to all regions
        source: 'GOV_DAFF',
        priority: 1, // Higher priority for federal alerts
    },
    // NSW - DPI Biosecurity (via FetchRSS - official subscription link from NSW DPI)
    {
        name: 'NSW DPI Biosecurity',
        url: 'https://fetchrss.com/rss/59e963928a93f839688b4567446134612.xml',
        region: 'NSW',
        source: 'GOV_NSW',
        priority: 2,
    },
    // NSW - DPI All Topics (fallback - via RSSMix)
    {
        name: 'NSW DPI All Topics',
        url: 'https://www.rssmix.com/u/8260525/rss.xml',
        region: 'NSW',
        source: 'GOV_NSW',
        priority: 3,
    },
    // QLD - Placeholder for dynamic API endpoint
    // To find: Open https://www.dpi.qld.gov.au/news-media/alerts in DevTools
    // Network tab -> Filter Fetch/XHR -> Look for JSON endpoint
    // {
    //     name: 'QLD DPI Alerts',
    //     url: 'https://www.dpi.qld.gov.au/api/alerts/...',  // Discover this URL
    //     region: 'QLD',
    //     source: 'GOV_QLD',
    //     priority: 2,
    //     isJson: true,  // Flag if it returns JSON instead of RSS
    // },
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

// AI guidance is generated dynamically via generateAlertGuidance()
// See src/lib/ai-guidance.ts for implementation

// Cache for API responses (in-memory, resets on server restart)
const cache: Map<string, { data: GovAlert[]; timestamp: number }> = new Map()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const region = searchParams.get('region')
        const forceRefresh = searchParams.get('refresh') === 'true'

        // Check cache
        const cacheKey = `gov-alerts-${region || 'all'}`
        const cached = cache.get(cacheKey)
        if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json({
                success: true,
                data: cached.data,
                source: 'Government Biosecurity Feeds',
                lastUpdated: new Date(cached.timestamp).toISOString(),
                cached: true,
            })
        }

        const alerts: GovAlert[] = []

        // Fetch all feeds in parallel
        const feedPromises = GOV_FEEDS.map(async (feed) => {
            try {
                const response = await fetch(feed.url, {
                    headers: {
                        'User-Agent': 'Ponnect/1.0 (Australian Pet Safety Alerts)',
                        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                    },
                    // Use Next.js caching for individual requests
                    next: { revalidate: 1800 }, // 30 min cache
                })

                if (!response.ok) {
                    console.warn(`[Gov Alerts] Failed to fetch ${feed.name}: ${response.status}`)
                    return []
                }

                const contentType = response.headers.get('content-type') || ''
                const text = await response.text()

                // Handle RSS/XML feeds
                if (contentType.includes('xml') || contentType.includes('rss') || text.trim().startsWith('<?xml') || text.trim().startsWith('<rss')) {
                    const parsed = parseRSSFeed(text)
                    if (!parsed) {
                        console.warn(`[Gov Alerts] Failed to parse ${feed.name}`)
                        return []
                    }

                    // Parse items first without guidance
                    const parsedAlerts = parsed.items.map((item) => {
                        const categorized = categorizeAlert(item)
                        const alertRegion = categorized.region || feed.region || 'ALL'
                        const message = stripHtml(item.description).slice(0, 500) +
                            (item.description.length > 500 ? '...' : '')

                        return {
                            id: `gov-${feed.source}-${item.guid}`,
                            title: item.title,
                            message,
                            region: alertRegion,
                            severity: categorized.severity,
                            type: categorized.type,
                            activeFrom: item.pubDate
                                ? new Date(item.pubDate).toISOString()
                                : new Date().toISOString(),
                            activeUntil: null,
                            source: feed.source,
                            confidence: 'VERIFIED',
                            guidance: null as string[] | null, // Will be populated by AI
                            externalId: item.guid,
                            link: item.link,
                        }
                    })

                    // Generate AI guidance for each alert sequentially to avoid rate limits
                    const alertsWithGuidance: GovAlert[] = []
                    for (const alert of parsedAlerts) {
                        const guidance = await generateAlertGuidance({
                            title: alert.title,
                            message: alert.message,
                            type: alert.type,
                            severity: alert.severity,
                            region: alert.region,
                            source: alert.source,
                        })
                        alertsWithGuidance.push({ ...alert, guidance })
                    }

                    return alertsWithGuidance
                }

                // Handle JSON endpoints (for QLD when discovered)
                if (contentType.includes('json')) {
                    // Future: parse JSON response and map to GovAlert format
                    console.log(`[Gov Alerts] JSON endpoint detected for ${feed.name}`)
                    return []
                }

                return []
            } catch (feedError) {
                console.error(`[Gov Alerts] Error fetching ${feed.name}:`, feedError)
                return []
            }
        })

        const results = await Promise.all(feedPromises)
        results.forEach(feedAlerts => alerts.push(...feedAlerts))

        // Filter by region if specified
        let filteredAlerts = alerts
        if (region && region !== 'all') {
            filteredAlerts = alerts.filter(a =>
                a.region === region || a.region === 'ALL'
            )
        }

        // Deduplicate by externalId
        const seen = new Set<string>()
        const uniqueAlerts = filteredAlerts.filter(alert => {
            if (seen.has(alert.externalId)) return false
            seen.add(alert.externalId)
            return true
        })

        // Sort by severity then date
        const severityOrder: Record<string, number> = { EMERGENCY: 0, WARNING: 1, WATCH: 2, INFO: 3 }
        uniqueAlerts.sort((a, b) => {
            const severityDiff = (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
            if (severityDiff !== 0) return severityDiff
            return new Date(b.activeFrom).getTime() - new Date(a.activeFrom).getTime()
        })

        // Update cache
        cache.set(cacheKey, { data: uniqueAlerts, timestamp: Date.now() })

        return NextResponse.json({
            success: true,
            data: uniqueAlerts,
            source: 'Government Biosecurity Feeds',
            sources: GOV_FEEDS.map(f => f.name),
            lastUpdated: new Date().toISOString(),
            cached: false,
        })
    } catch (error) {
        console.error('[Gov Alerts] Fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch government alerts' },
            { status: 500 }
        )
    }
}
