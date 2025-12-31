import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAIAnswer } from '@/lib/ai-qa'

interface RouteParams {
    params: Promise<{ id: string }>
}

// System user ID for AI-generated answers
// This should be a dedicated "Ponnect AI" user in the database
const AI_SYSTEM_USER_ID = 'ponnect-ai-system'

/**
 * POST /api/expert-qa/questions/[id]/ai-answer
 * Trigger AI answer generation for a question
 */
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: questionId } = await params

        // Check if question exists with comprehensive dog and health data
        const question = await prisma.expertQuestion.findUnique({
            where: { id: questionId },
            include: {
                dogs: {
                    include: {
                        dog: {
                            select: {
                                id: true,
                                name: true,
                                breed: true,
                                birthDate: true,
                                gender: true,
                                weight: true,
                                bio: true,
                                healthRecords: {
                                    orderBy: { date: 'desc' },
                                    take: 15, // Limit to recent records for context
                                    select: {
                                        type: true,
                                        title: true,
                                        description: true,
                                        date: true,
                                        dosage: true,
                                        vetClinic: true,
                                        notes: true,
                                    },
                                },
                            },
                        },
                    },
                },
                answers: {
                    where: { isAiGenerated: true },
                },
            },
        })

        if (!question) {
            return NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            )
        }

        // Check if question is closed
        if (question.status === 'CLOSED') {
            return NextResponse.json(
                { success: false, error: 'Cannot add AI answer to closed question' },
                { status: 403 }
            )
        }

        // Check if AI answer already exists
        if (question.answers.length > 0) {
            return NextResponse.json({
                success: true,
                message: 'AI answer already exists',
                data: question.answers[0],
            })
        }

        // Use a transaction to prevent race conditions
        const result = await prisma.$transaction(async (tx) => {
            // Double-check within transaction that no AI answer exists
            const existingAIAnswer = await tx.expertAnswer.findFirst({
                where: {
                    questionId,
                    isAiGenerated: true,
                },
                include: {
                    expert: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            role: true,
                            expertType: true,
                            isVerified: true,
                        },
                    },
                },
            })

            if (existingAIAnswer) {
                return { exists: true, answer: existingAIAnswer }
            }

            // Ensure AI system user exists
            let aiUser = await tx.user.findUnique({
                where: { id: AI_SYSTEM_USER_ID },
            })

            if (!aiUser) {
                // Create the AI system user
                aiUser = await tx.user.create({
                    data: {
                        id: AI_SYSTEM_USER_ID,
                        email: 'ai@ponnect.app',
                        passwordHash: 'AI_SYSTEM_USER_NO_LOGIN',
                        name: 'Ponnect AI Assistant',
                        bio: 'AI-powered assistant providing preliminary answers to help dog owners. All AI answers are reviewed by verified experts.',
                        role: 'EXPERT',
                        expertType: 'AI_ASSISTANT',
                        isVerified: true,
                        isEmailVerified: true,
                    },
                })
            }

            // Generate AI answer (outside transaction for API call)
            return { exists: false, needsGeneration: true, aiUser }
        })

        // If AI answer already exists, return it
        if (result.exists && result.answer) {
            return NextResponse.json({
                success: true,
                message: 'AI answer already exists',
                data: result.answer,
            })
        }

        // Generate AI answer content
        const aiAnswerContent = await generateAIAnswer({
            id: question.id,
            title: question.title,
            content: question.content,
            category: question.category,
            dogs: question.dogs,
        })

        if (!aiAnswerContent) {
            return NextResponse.json(
                { success: false, error: 'Failed to generate AI answer. Please try again later.' },
                { status: 503 }
            )
        }

        // Create the AI-generated answer with another check to prevent duplicates
        const answer = await prisma.$transaction(async (tx) => {
            // Final check before creating
            const existingAIAnswer = await tx.expertAnswer.findFirst({
                where: {
                    questionId,
                    isAiGenerated: true,
                },
            })

            if (existingAIAnswer) {
                return null // Another request already created it
            }

            return tx.expertAnswer.create({
                data: {
                    content: aiAnswerContent,
                    questionId,
                    expertId: AI_SYSTEM_USER_ID,
                    isAiGenerated: true,
                },
                include: {
                    expert: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            role: true,
                            expertType: true,
                            isVerified: true,
                        },
                    },
                },
            })
        })

        // If answer is null, it means another request created it first
        if (!answer) {
            const existingAnswer = await prisma.expertAnswer.findFirst({
                where: {
                    questionId,
                    isAiGenerated: true,
                },
                include: {
                    expert: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            role: true,
                            expertType: true,
                            isVerified: true,
                        },
                    },
                },
            })
            return NextResponse.json({
                success: true,
                message: 'AI answer already exists',
                data: existingAnswer,
            })
        }

        // Note: We don't update question status to ANSWERED since AI answer is preliminary
        // The status remains PENDING until a human expert answers

        return NextResponse.json({
            success: true,
            data: answer,
        }, { status: 201 })
    } catch (error) {
        console.error('AI answer generation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate AI answer' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/expert-qa/questions/[id]/ai-answer
 * Get the AI-generated answer for a question (if exists)
 */
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: questionId } = await params

        const aiAnswer = await prisma.expertAnswer.findFirst({
            where: {
                questionId,
                isAiGenerated: true,
            },
            include: {
                expert: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                        expertType: true,
                        isVerified: true,
                    },
                },
            },
        })

        if (!aiAnswer) {
            return NextResponse.json(
                { success: false, error: 'No AI answer found for this question' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: aiAnswer,
        })
    } catch (error) {
        console.error('AI answer fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch AI answer' },
            { status: 500 }
        )
    }
}
