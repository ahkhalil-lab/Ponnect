/**
 * AI-Generated Answers for Expert Q&A
 * Uses Gemini API to generate preliminary answers for dog-related questions
 */

interface HealthRecord {
    type: string
    title: string
    description: string | null
    date: Date | string
    dosage: string | null
    vetClinic: string | null
    notes: string | null
}

interface DogInfo {
    name: string
    breed: string
    birthDate: Date | string | null
    gender: string
    weight: number | null
    bio: string | null
    healthRecords: HealthRecord[]
}

interface QuestionContext {
    id: string
    title: string
    content: string
    category: string
    dogs?: {
        dog: DogInfo
    }[]
}

interface AIAnswerResult {
    answer: string
    generatedAt: string
    model: string
}

// In-memory cache for generated answers (avoid duplicate API calls)
const answerCache: Map<string, AIAnswerResult> = new Map()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Rate limiting: track last API call time
let lastApiCallTime = 0
const MIN_DELAY_BETWEEN_CALLS = 2000 // 2 seconds between calls

/**
 * Wait for specified milliseconds
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate: Date | string | null): string {
    if (!birthDate) return 'Unknown'
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate)
    const now = new Date()
    const years = now.getFullYear() - birth.getFullYear()
    const months = now.getMonth() - birth.getMonth()

    if (years === 0) {
        return `${months < 1 ? '< 1' : months} month${months !== 1 ? 's' : ''}`
    } else if (years < 2) {
        return `${years} year${years !== 1 ? 's' : ''} ${months > 0 ? `and ${months} month${months !== 1 ? 's' : ''}` : ''}`
    }
    return `${years} years`
}

/**
 * Format health records for prompt
 */
function formatHealthRecords(records: HealthRecord[]): string {
    if (!records || records.length === 0) {
        return 'No health records on file'
    }

    // Group by type and get recent records (limit to 10 most recent)
    const recentRecords = records
        .sort((a, b) => {
            const dateA = a.date instanceof Date ? a.date : new Date(a.date)
            const dateB = b.date instanceof Date ? b.date : new Date(b.date)
            return dateB.getTime() - dateA.getTime()
        })
        .slice(0, 10)

    return recentRecords.map(r => {
        const recordDate = r.date instanceof Date ? r.date : new Date(r.date)
        const date = recordDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
        let entry = `- [${r.type}] ${r.title} (${date})`
        if (r.description) entry += `: ${r.description}`
        if (r.dosage) entry += ` - Dosage: ${r.dosage}`
        if (r.notes) entry += ` - Notes: ${r.notes}`
        return entry
    }).join('\n')
}

/**
 * Build a comprehensive prompt for generating Q&A answers
 */
function buildAnswerPrompt(question: QuestionContext): string {
    const categoryDescriptions: Record<string, string> = {
        HEALTH: 'health, veterinary care, medical conditions, symptoms, and treatments',
        TRAINING: 'dog training, behavior modification, obedience, and commands',
        NUTRITION: 'dog food, diet, feeding schedules, supplements, and nutrition',
        BEHAVIOR: 'dog behavior, psychology, social interactions, and temperament',
    }

    // Build detailed dog profiles
    let dogProfilesSection = ''
    console.log('[AI Q&A] Building prompt for question:', question.id)
    console.log('[AI Q&A] Dogs attached:', question.dogs?.length || 0)
    if (question.dogs && question.dogs.length > 0) {
        const dogProfiles = question.dogs.map(qd => {
            const dog = qd.dog
            console.log('[AI Q&A] Dog profile:', dog.name, 'Breed:', dog.breed, 'Health records:', dog.healthRecords?.length || 0)
            const age = calculateAge(dog.birthDate)
            const weight = dog.weight ? `${dog.weight} kg` : 'Not specified'
            const gender = dog.gender || 'Not specified'
            const healthRecords = formatHealthRecords(dog.healthRecords)

            return `### ${dog.name}
- **Breed**: ${dog.breed}
- **Age**: ${age}
- **Gender**: ${gender}
- **Weight**: ${weight}
${dog.bio ? `- **About**: ${dog.bio}` : ''}

**Health History**:
${healthRecords}`
        }).join('\n\n')

        dogProfilesSection = `\n## Dog Profile(s)\n${dogProfiles}\n`
    } else {
        dogProfilesSection = '\n## Dog Profile(s)\nNo specific dog selected for this question.\n'
    }

    return `You are an AI assistant for Ponnect, an Australian mobile app that helps dog owners keep their pets safe and healthy. You are providing a PRELIMINARY answer to a user's question that will later be reviewed and endorsed by verified experts (veterinarians, trainers, nutritionists).

## Important Context
- This is a preliminary AI-generated answer
- Your response will be CLEARLY MARKED as AI-generated
- A human expert will review and potentially endorse your answer
- Be helpful but also acknowledge limitations where appropriate
- If the question requires urgent veterinary attention, clearly recommend consulting a vet
- USE THE DOG'S HEALTH HISTORY below to provide personalized advice where relevant

## Application Context
- **App Name**: Ponnect
- **Target Audience**: Australian dog owners
- **Tone**: Caring, informative, supportive, and professional
- **Category Focus**: ${categoryDescriptions[question.category] || 'general dog care'}

## Question Details
- **Category**: ${question.category}
- **Title**: ${question.title}
- **Full Question**: ${question.content}
${dogProfilesSection}
## Your Task
Provide a helpful, well-structured preliminary answer to this question. Your answer should:

1. Be informative and actionable where possible
2. Be specific to Australian context (Australian vets, climate, regulations, products)
3. Acknowledge when something requires professional consultation
4. Be warm and supportive in tone
5. Be concise but comprehensive (aim for 150-300 words)
6. Use proper formatting with line breaks for readability
7. Reference the dog's specific profile and health history where relevant (e.g., age, breed, existing conditions)

## Response Format
Return ONLY the answer text. No JSON formatting, no markdown headers, just the plain text answer with natural paragraph breaks.
Do not include phrases like "As an AI" or "I am an AI assistant" - your AI nature will be displayed separately in the UI.
Start directly with helpful content addressing the question.`
}

/**
 * Call Gemini API to generate an answer with retry logic
 */
async function callGeminiAPI(prompt: string, retryCount = 0): Promise<string | null> {
    const MAX_RETRIES = 3
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        console.log('[AI Q&A] No valid Gemini API key configured')
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
                        maxOutputTokens: 1000,
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
                const backoffDelay = Math.pow(3, retryCount) * 5000
                console.log(`[AI Q&A] Rate limited, retrying in ${backoffDelay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`)
                await delay(backoffDelay)
                return callGeminiAPI(prompt, retryCount + 1)
            }
            console.error('[AI Q&A] Max retries exceeded for rate limit')
            return null
        }

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[AI Q&A] Gemini API error:', response.status, errorText)

            // Check if error response contains retry info (quota exceeded)
            if (errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('quota')) {
                if (retryCount < MAX_RETRIES) {
                    const backoffDelay = Math.pow(3, retryCount) * 5000
                    console.log(`[AI Q&A] Quota exhausted, retrying in ${backoffDelay / 1000}s (attempt ${retryCount + 1}/${MAX_RETRIES})`)
                    await delay(backoffDelay)
                    return callGeminiAPI(prompt, retryCount + 1)
                }
            }
            return null
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
            console.error('[AI Q&A] No response text from Gemini')
            return null
        }

        return text.trim()
    } catch (error) {
        console.error('[AI Q&A] API call failed:', error)
        return null
    }
}

/**
 * Generate AI-powered answer for a question
 * Returns null if AI is unavailable
 */
export async function generateAIAnswer(question: QuestionContext): Promise<string | null> {
    // Check cache first
    const cacheKey = question.id
    const cached = answerCache.get(cacheKey)

    if (cached && Date.now() - new Date(cached.generatedAt).getTime() < CACHE_TTL) {
        console.log('[AI Q&A] Returning cached answer for question:', question.id)
        return cached.answer
    }

    // Try to generate with AI
    console.log('[AI Q&A] Generating AI answer for question:', question.id)
    const prompt = buildAnswerPrompt(question)
    const aiAnswer = await callGeminiAPI(prompt)

    if (aiAnswer && aiAnswer.length > 0) {
        // Cache the result
        answerCache.set(cacheKey, {
            answer: aiAnswer,
            generatedAt: new Date().toISOString(),
            model: 'gemini-2.0-flash',
        })
        console.log('[AI Q&A] Successfully generated AI answer for question:', question.id)
        return aiAnswer
    }

    console.log('[AI Q&A] Failed to generate AI answer for question:', question.id)
    return null
}

/**
 * Clear the answer cache (useful for testing)
 */
export function clearAnswerCache(): void {
    answerCache.clear()
}
