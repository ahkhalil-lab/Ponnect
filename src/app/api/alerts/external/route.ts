import { NextResponse } from 'next/server'

// Australian capital cities with coordinates
const AUSTRALIAN_CITIES = [
    { name: 'Brisbane', region: 'QLD', lat: -27.4698, lon: 153.0251 },
    { name: 'Sydney', region: 'NSW', lat: -33.8688, lon: 151.2093 },
    { name: 'Melbourne', region: 'VIC', lat: -37.8136, lon: 144.9631 },
    { name: 'Adelaide', region: 'SA', lat: -34.9285, lon: 138.6007 },
    { name: 'Perth', region: 'WA', lat: -31.9505, lon: 115.8605 },
    { name: 'Hobart', region: 'TAS', lat: -42.8821, lon: 147.3272 },
    { name: 'Darwin', region: 'NT', lat: -12.4634, lon: 130.8456 },
    { name: 'Canberra', region: 'ACT', lat: -35.2809, lon: 149.1300 },
]

interface OpenMeteoResponse {
    daily: {
        time: string[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        uv_index_max: number[]
    }
}

interface ExternalAlert {
    id: string
    title: string
    message: string
    region: string
    severity: 'INFO' | 'WATCH' | 'WARNING' | 'EMERGENCY'
    type: string
    activeFrom: string
    activeUntil: string | null
    source: string
    confidence: string
    guidance: string[] | null
    externalId: string
}

function getSeverity(maxTemp: number): 'INFO' | 'WATCH' | 'WARNING' | 'EMERGENCY' {
    if (maxTemp >= 42) return 'EMERGENCY'
    if (maxTemp >= 38) return 'WARNING'
    if (maxTemp >= 35) return 'WATCH'
    return 'INFO'
}

function getHeatGuidance(maxTemp: number): string[] {
    const baseGuidance = [
        'Keep dogs indoors during peak heat (10am-4pm)',
        'Ensure fresh, cool water is always available',
        'Never leave dogs in parked cars',
        'Test pavement with your hand before walks'
    ]

    if (maxTemp >= 38) {
        return [
            'Avoid all outdoor exercise',
            'Use cooling mats or wet towels',
            ...baseGuidance,
            'Watch for signs: excessive panting, drooling, collapse'
        ]
    }

    return [
        'Walk only early morning or after sunset',
        ...baseGuidance
    ]
}

function generateHeatwaveAlert(
    city: typeof AUSTRALIAN_CITIES[0],
    maxTemp: number,
    date: string
): ExternalAlert | null {
    // Only generate alerts for temperatures >= 35°C
    if (maxTemp < 35) return null

    const severity = getSeverity(maxTemp)
    const formattedDate = new Date(date).toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
    })

    const title = maxTemp >= 42
        ? `🔥 EMERGENCY: Extreme Heat - ${city.name}`
        : maxTemp >= 38
            ? `🔥 Heat Warning - ${city.name}`
            : `🌡️ Heat Watch - ${city.name}`

    const message = `Expected maximum temperature of ${Math.round(maxTemp)}°C on ${formattedDate} in ${city.name}. ` +
        (maxTemp >= 42
            ? 'Dangerous conditions for pets. Keep all dogs indoors.'
            : maxTemp >= 38
                ? 'High risk conditions. Avoid outdoor exercise.'
                : 'Elevated temperatures. Take precautions during walks.')

    return {
        id: `heatwave-${city.region}-${date}`,
        title,
        message,
        region: city.region,
        severity,
        type: 'HEATWAVE',
        activeFrom: new Date(date).toISOString(),
        activeUntil: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        source: 'OPEN_METEO',
        confidence: 'HIGH',
        guidance: getHeatGuidance(maxTemp),
        externalId: `open-meteo-${city.region}-${date}`,
    }
}

function generateUVAlert(
    city: typeof AUSTRALIAN_CITIES[0],
    uvIndex: number,
    date: string
): ExternalAlert | null {
    // Only generate alerts for UV >= 11 (extreme)
    if (uvIndex < 11) return null

    const formattedDate = new Date(date).toLocaleDateString('en-AU', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
    })

    return {
        id: `uv-${city.region}-${date}`,
        title: `☀️ Extreme UV Alert - ${city.name}`,
        message: `UV Index of ${Math.round(uvIndex)} expected on ${formattedDate}. ` +
            `High risk of sunburn for light-colored dogs and those with thin coats.`,
        region: city.region,
        severity: 'WARNING' as const,
        type: 'OTHER',
        activeFrom: new Date(date).toISOString(),
        activeUntil: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        source: 'OPEN_METEO',
        confidence: 'HIGH',
        guidance: [
            'Limit outdoor time during 10am-3pm',
            'Apply pet-safe sunscreen to nose and ears',
            'Provide shaded areas in your yard',
            'Light-colored dogs are especially vulnerable'
        ],
        externalId: `open-meteo-uv-${city.region}-${date}`,
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const region = searchParams.get('region')

        const citiesToFetch = region && region !== 'all'
            ? AUSTRALIAN_CITIES.filter(c => c.region === region)
            : AUSTRALIAN_CITIES

        const alerts: ExternalAlert[] = []

        // Fetch weather data for each city
        for (const city of citiesToFetch) {
            try {
                const url = `https://api.open-meteo.com/v1/forecast?` +
                    `latitude=${city.lat}&longitude=${city.lon}` +
                    `&daily=temperature_2m_max,temperature_2m_min,uv_index_max` +
                    `&timezone=Australia%2FSydney` +
                    `&forecast_days=4`

                const response = await fetch(url, {
                    next: { revalidate: 3600 }, // Cache for 1 hour
                })

                if (!response.ok) {
                    console.error(`Failed to fetch weather for ${city.name}:`, response.status)
                    continue
                }

                const data: OpenMeteoResponse = await response.json()

                // Process each day's data
                for (let i = 0; i < data.daily.time.length; i++) {
                    const maxTemp = data.daily.temperature_2m_max[i]
                    const uvIndex = data.daily.uv_index_max[i]
                    const date = data.daily.time[i]

                    // Generate heatwave alert if applicable
                    const heatAlert = generateHeatwaveAlert(city, maxTemp, date)
                    if (heatAlert) {
                        alerts.push(heatAlert)
                    }

                    // Generate UV alert if applicable
                    const uvAlert = generateUVAlert(city, uvIndex, date)
                    if (uvAlert) {
                        alerts.push(uvAlert)
                    }
                }
            } catch (cityError) {
                console.error(`Error fetching weather for ${city.name}:`, cityError)
            }
        }

        // Sort by severity and date
        alerts.sort((a, b) => {
            const severityOrder = { EMERGENCY: 0, WARNING: 1, WATCH: 2, INFO: 3 }
            if (severityOrder[a.severity] !== severityOrder[b.severity]) {
                return severityOrder[a.severity] - severityOrder[b.severity]
            }
            return new Date(a.activeFrom).getTime() - new Date(b.activeFrom).getTime()
        })

        return NextResponse.json({
            success: true,
            data: alerts,
            source: 'Open-Meteo Weather API',
            lastUpdated: new Date().toISOString(),
        })
    } catch (error) {
        console.error('External alerts fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch external alerts' },
            { status: 500 }
        )
    }
}
