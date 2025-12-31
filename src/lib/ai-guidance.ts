/**
 * AI-Generated Guidance for Regional Alerts
 * Uses Gemini API to generate contextual, actionable advice for dog owners
 */

interface AlertContext {
    title: string
    message: string
    type: string
    severity: string
    region: string
    source: string
}

interface GuidanceResult {
    guidance: string[]
    generatedAt: string
    model: string
}

// In-memory cache for generated guidance (avoid duplicate API calls)
const guidanceCache: Map<string, GuidanceResult> = new Map()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Fallback guidance if AI is unavailable
const FALLBACK_GUIDANCE: Record<string, string[]> = {
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
    HEATWAVE: [
        'Keep dogs indoors during peak heat (10am-4pm)',
        'Ensure fresh, cool water is always available',
        'Never leave dogs in parked cars',
        'Watch for signs of heat stroke',
    ],
    UV: [
        'Limit outdoor time during peak UV hours (10am-2pm)',
        'Consider pet-safe sunscreen for exposed skin areas',
        'Provide shade and cool resting spots',
        'Watch for signs of sunburn on nose and ears',
    ],
    OTHER: [
        'Monitor your local area for updates',
        'Follow advice from local authorities',
        'Keep emergency vet contact handy',
    ],
}

/**
 * Build a comprehensive prompt for the AI with full context
 */
function buildGuidancePrompt(alert: AlertContext): string {
    return `You are an expert veterinary advisor for Ponnect, an Australian mobile app that helps dog owners keep their pets safe and healthy.

## Application Context
- **App Name**: Ponnect
- **Purpose**: Connect Australian dog owners with resources, vets, community support, and real-time safety alerts
- **Target Audience**: Dog owners across Australia, ranging from first-time owners to experienced breeders
- **Tone**: Caring, professional, actionable, and reassuring (not alarmist)

## Alert Details
- **Title**: ${alert.title}
- **Description**: ${alert.message}
- **Type**: ${alert.type} (e.g., TICK, SNAKE, DISEASE, HEATWAVE, UV, OTHER)
- **Severity**: ${alert.severity} (INFO, WATCH, WARNING, or EMERGENCY)
- **Region**: ${alert.region}
- **Source**: ${alert.source}

## Your Task
Generate 4-5 specific, actionable safety recommendations for dog owners based on this alert. Each recommendation should:
1. Be clear and concise (1 sentence each)
2. Be actionable (tell them exactly what to do)
3. Be specific to the alert details (not generic)
4. Consider Australian context (local resources, climate, wildlife)
5. Include urgency appropriate to the severity level

For EMERGENCY severity: Include immediate actions and when to seek emergency vet care.
For WARNING severity: Include preventive measures and signs to watch for.
For WATCH severity: Include awareness tips and precautionary steps.
For INFO severity: Include general awareness and routine precautions.

## Response Format
Return ONLY a JSON array of strings, each string being one recommendation. No additional text, no markdown formatting, just the JSON array.

Example format:
["First recommendation here", "Second recommendation here", "Third recommendation here", "Fourth recommendation here"]`
}

/**
 * Generate a cache key from alert context
 */
function getCacheKey(alert: AlertContext): string {
    return `${alert.type}-${alert.severity}-${alert.title.slice(0, 50)}`
}

// Rate limiting: track last API call time to avoid hitting quota
let lastApiCallTime = 0
const MIN_DELAY_BETWEEN_CALLS = 2000 // 2 seconds between calls for free tier

/**
 * Wait for specified milliseconds
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Call Gemini API to generate guidance with retry logic and rate limiting
 */
async function callGeminiAPI(prompt: string, retryCount = 0): Promise<string[] | null> {
    const MAX_RETRIES = 3
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.log('[AI Guidance] No valid Gemini API key configured')
        return null
    }

    // Rate limiting: ensure minimum delay between API calls
    const now = Date.now()
    const timeSinceLastCall = now - lastApiCallTime
    if (timeSinceLastCall < MIN_DELAY_BETWEEN_CALLS) {
        await delay(MIN_DELAY_BETWEEN_CALLS - timeSinceLastCall)
    }
    lastApiCallTime = Date.now()

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 500,
                    },
                    safetySettings: [
                        {
                            category: 'HARM_CATEGORY_HARASSMENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                        },
                        {
                            category: 'HARM_CATEGORY_HATE_SPEECH',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                        },
                        {
                            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                        },
                        {
                            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                        },
                    ],
                }),
            }
        )

        // Handle rate limiting (429) and server errors (5xx) with retry
        if (response.status === 429 || response.status >= 500) {
            if (retryCount < MAX_RETRIES) {
                // Exponential backoff: 5s, 15s, 45s
                const backoffDelay = Math.pow(3, retryCount) * 5000
                console.log(`[AI Guidance] Rate limited, retrying in ${backoffDelay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`)
                await delay(backoffDelay)
                return callGeminiAPI(prompt, retryCount + 1)
            }
            console.error('[AI Guidance] Max retries exceeded for rate limit')
            return null
        }

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[AI Guidance] Gemini API error:', response.status, errorText)

            // Check if error response contains retry info (quota exceeded)
            if (errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
                if (retryCount < MAX_RETRIES) {
                    const backoffDelay = Math.pow(3, retryCount) * 5000
                    console.log(`[AI Guidance] Quota exhausted, retrying in ${backoffDelay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`)
                    await delay(backoffDelay)
                    return callGeminiAPI(prompt, retryCount + 1)
                }
            }
            return null
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
            console.error('[AI Guidance] No response text from Gemini')
            return null
        }

        // Parse the JSON array from the response
        // Clean up potential markdown formatting
        const cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim()

        const guidance = JSON.parse(cleanedText)

        if (Array.isArray(guidance) && guidance.every(item => typeof item === 'string')) {
            return guidance
        }

        console.error('[AI Guidance] Invalid response format:', guidance)
        return null
    } catch (error) {
        console.error('[AI Guidance] API call failed:', error)
        return null
    }
}

/**
 * Generate AI-powered guidance for an alert
 * Falls back to static guidance if AI is unavailable
 */
export async function generateAlertGuidance(alert: AlertContext): Promise<string[]> {
    // Check cache first
    const cacheKey = getCacheKey(alert)
    const cached = guidanceCache.get(cacheKey)

    if (cached && Date.now() - new Date(cached.generatedAt).getTime() < CACHE_TTL) {
        return cached.guidance
    }

    // Try to generate with AI
    const prompt = buildGuidancePrompt(alert)
    const aiGuidance = await callGeminiAPI(prompt)

    if (aiGuidance && aiGuidance.length > 0) {
        // Cache the result
        guidanceCache.set(cacheKey, {
            guidance: aiGuidance,
            generatedAt: new Date().toISOString(),
            model: 'gemini-pro-latest',
        })
        return aiGuidance
    }

    // Fallback to static guidance
    return FALLBACK_GUIDANCE[alert.type] || FALLBACK_GUIDANCE.OTHER
}

/**
 * Generate guidance for multiple alerts in parallel
 * Uses batching to avoid rate limits
 */
export async function generateBatchGuidance(
    alerts: AlertContext[]
): Promise<Map<string, string[]>> {
    const results = new Map<string, string[]>()

    // Process in batches of 5 to avoid rate limits
    const batchSize = 5
    for (let i = 0; i < alerts.length; i += batchSize) {
        const batch = alerts.slice(i, i + batchSize)
        const promises = batch.map(async alert => {
            const guidance = await generateAlertGuidance(alert)
            return { id: getCacheKey(alert), guidance }
        })

        const batchResults = await Promise.all(promises)
        batchResults.forEach(({ id, guidance }) => {
            results.set(id, guidance)
        })

        // Small delay between batches to respect rate limits
        if (i + batchSize < alerts.length) {
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    return results
}

/**
 * Clear the guidance cache (useful for testing)
 */
export function clearGuidanceCache(): void {
    guidanceCache.clear()
}
