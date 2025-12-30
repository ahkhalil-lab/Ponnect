import { NextResponse } from 'next/server'
import { getCurrentUser, canModerate } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        const question = await prisma.expertQuestion.findUnique({
            where: { id },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                dogs: {
                    include: {
                        dog: {
                            select: {
                                id: true,
                                name: true,
                                breed: true,
                                photo: true,
                            },
                        },
                    },
                },
                answers: {
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
                },
                _count: {
                    select: { answers: true },
                },
            },
        })

        if (!question) {
            return NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            )
        }

        // Check access for private questions
        if (!question.isPublic && (!user || user.id !== question.authorId)) {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        return NextResponse.json({
            success: true,
            data: question,
        })
    } catch (error) {
        console.error('Expert question fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch question' },
            { status: 500 }
        )
    }
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

        const question = await prisma.expertQuestion.findUnique({
            where: { id },
        })

        if (!question) {
            return NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            )
        }

        if (question.authorId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { title, content, category, isPublic } = body

        const updated = await prisma.expertQuestion.update({
            where: { id },
            data: {
                title: title?.trim() || question.title,
                content: content?.trim() || question.content,
                category: category || question.category,
                isPublic: isPublic !== undefined ? isPublic : question.isPublic,
            },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error('Expert question update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update question' },
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

        const question = await prisma.expertQuestion.findUnique({
            where: { id },
        })

        if (!question) {
            return NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            )
        }

        if (question.authorId !== user.id && !canModerate(user)) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            )
        }

        await prisma.expertQuestion.delete({
            where: { id },
        })

        return NextResponse.json({
            success: true,
            message: 'Question deleted',
        })
    } catch (error) {
        console.error('Expert question delete error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete question' },
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

        const question = await prisma.expertQuestion.findUnique({
            where: { id },
        })

        if (!question) {
            return NextResponse.json(
                { success: false, error: 'Question not found' },
                { status: 404 }
            )
        }

        // Only author can close their question
        if (question.authorId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { status } = body

        if (status && !['PENDING', 'ANSWERED', 'CLOSED'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status' },
                { status: 400 }
            )
        }

        const updated = await prisma.expertQuestion.update({
            where: { id },
            data: { status },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error('Expert question status update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update question status' },
            { status: 500 }
        )
    }
}
