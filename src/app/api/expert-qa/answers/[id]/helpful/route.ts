import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: answerId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const answer = await prisma.expertAnswer.findUnique({
            where: { id: answerId },
        })

        if (!answer) {
            return NextResponse.json(
                { success: false, error: 'Answer not found' },
                { status: 404 }
            )
        }

        // We'll use a simple increment/decrement approach
        // In a more sophisticated system, we'd track individual votes
        const body = await request.json()
        const { helpful } = body

        const updated = await prisma.expertAnswer.update({
            where: { id: answerId },
            data: {
                helpfulCount: helpful
                    ? { increment: 1 }
                    : { decrement: 1 },
            },
        })

        // Ensure count doesn't go below 0
        if (updated.helpfulCount < 0) {
            await prisma.expertAnswer.update({
                where: { id: answerId },
                data: { helpfulCount: 0 },
            })
        }

        return NextResponse.json({
            success: true,
            data: {
                helpfulCount: Math.max(0, updated.helpfulCount),
            },
        })
    } catch (error) {
        console.error('Helpful vote error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update helpful count' },
            { status: 500 }
        )
    }
}
