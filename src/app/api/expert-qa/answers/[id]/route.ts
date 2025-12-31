import { NextResponse } from 'next/server'
import { getCurrentUser, canModerate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const answer = await prisma.expertAnswer.findUnique({
            where: { id },
        })

        if (!answer) {
            return NextResponse.json(
                { success: false, error: 'Answer not found' },
                { status: 404 }
            )
        }

        // Only the expert who wrote it can edit
        if (answer.expertId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { content } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Content is required' },
                { status: 400 }
            )
        }

        const updated = await prisma.expertAnswer.update({
            where: { id },
            data: { content: content.trim() },
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
            data: updated,
        })
    } catch (error) {
        console.error('Answer update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update answer' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const answer = await prisma.expertAnswer.findUnique({
            where: { id },
        })

        if (!answer) {
            return NextResponse.json(
                { success: false, error: 'Answer not found' },
                { status: 404 }
            )
        }

        // Author or moderator can delete
        if (answer.expertId !== user.id && !canModerate(user)) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            )
        }

        await prisma.expertAnswer.delete({
            where: { id },
        })

        return NextResponse.json({
            success: true,
            message: 'Answer deleted',
        })
    } catch (error) {
        console.error('Answer delete error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete answer' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const answer = await prisma.expertAnswer.findUnique({
            where: { id },
            include: {
                question: {
                    select: { authorId: true },
                },
            },
        })

        if (!answer) {
            return NextResponse.json(
                { success: false, error: 'Answer not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { isAccepted, validateAiAnswer } = body

        // Handle AI answer validation by verified experts
        if (validateAiAnswer === true) {
            // Check if this is an AI-generated answer
            if (!answer.isAiGenerated) {
                return NextResponse.json(
                    { success: false, error: 'This is not an AI-generated answer' },
                    { status: 400 }
                )
            }

            // Check if already validated
            if (answer.aiValidatedBy) {
                return NextResponse.json(
                    { success: false, error: 'This AI answer has already been validated' },
                    { status: 400 }
                )
            }

            // Only verified experts or admins can validate AI answers
            const isVerifiedExpert = (user.role === 'EXPERT' && user.isVerified) || user.role === 'ADMIN'
            if (!isVerifiedExpert) {
                return NextResponse.json(
                    { success: false, error: 'Only verified experts can validate AI answers' },
                    { status: 403 }
                )
            }

            const validated = await prisma.expertAnswer.update({
                where: { id },
                data: {
                    aiValidatedBy: user.id,
                    aiValidatedAt: new Date(),
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
                data: validated,
                validatedBy: {
                    id: user.id,
                    name: user.name,
                },
            })
        }

        // Handle accepting an answer (existing logic)
        // Only the question author can accept an answer
        if (answer.question.authorId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Only the question author can accept an answer' },
                { status: 403 }
            )
        }

        // If accepting this answer, unaccept all other answers for the question
        if (isAccepted) {
            await prisma.expertAnswer.updateMany({
                where: {
                    questionId: answer.questionId,
                    id: { not: id },
                },
                data: { isAccepted: false },
            })
        }

        const updated = await prisma.expertAnswer.update({
            where: { id },
            data: { isAccepted: isAccepted ?? answer.isAccepted },
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
            data: updated,
        })
    } catch (error) {
        console.error('Answer update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update answer' },
            { status: 500 }
        )
    }
}
