import { NextResponse } from 'next/server'
import { getCurrentUser, isExpert, isVerifiedExpert } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: questionId } = await params

        const answers = await prisma.expertAnswer.findMany({
            where: { questionId },
            orderBy: [
                { isAccepted: 'desc' },
                { helpfulCount: 'desc' },
                { createdAt: 'asc' },
            ],
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
            data: answers,
        })
    } catch (error) {
        console.error('Answers fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch answers' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: questionId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Only verified experts can answer
        if (!isVerifiedExpert(user) && user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Only verified experts can answer questions' },
                { status: 403 }
            )
        }

        // Check question exists and is not closed
        const question = await prisma.expertQuestion.findUnique({
            where: { id: questionId },
        })

        if (!question) {
            return NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            )
        }

        if (question.status === 'CLOSED') {
            return NextResponse.json(
                { success: false, error: 'This question is closed' },
                { status: 403 }
            )
        }

        // Check if expert already answered
        const existing = await prisma.expertAnswer.findFirst({
            where: {
                questionId,
                expertId: user.id,
            },
        })

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'You have already answered this question' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const { content } = body

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Answer content is required' },
                { status: 400 }
            )
        }

        const answer = await prisma.expertAnswer.create({
            data: {
                content: content.trim(),
                questionId,
                expertId: user.id,
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

        // Update question status to ANSWERED if it was PENDING
        if (question.status === 'PENDING') {
            await prisma.expertQuestion.update({
                where: { id: questionId },
                data: { status: 'ANSWERED' },
            })
        }

        return NextResponse.json({
            success: true,
            data: answer,
        }, { status: 201 })
    } catch (error) {
        console.error('Answer creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create answer' },
            { status: 500 }
        )
    }
}
