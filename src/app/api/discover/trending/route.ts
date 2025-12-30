import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const now = new Date()
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Get trending forum posts (most upvoted in last week)
        const trendingPosts = await prisma.forumPost.findMany({
            where: {
                createdAt: { gte: oneWeekAgo },
            },
            orderBy: { upvotes: 'desc' },
            take: 5,
            include: {
                author: {
                    select: { id: true, name: true, avatar: true },
                },
                category: {
                    select: { id: true, name: true, slug: true, icon: true },
                },
                _count: {
                    select: { comments: true },
                },
            },
        })

        // Get upcoming events
        const upcomingEvents = await prisma.event.findMany({
            where: {
                date: { gte: now },
                isCancelled: false,
                isApproved: true,
            },
            orderBy: { date: 'asc' },
            take: 5,
            include: {
                creator: {
                    select: { id: true, name: true, avatar: true },
                },
                _count: {
                    select: { rsvps: true },
                },
            },
        })

        // Get recent Q&A questions with expert answers
        const recentQuestions = await prisma.expertQuestion.findMany({
            where: {
                isPublic: true,
                status: 'ANSWERED',
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                author: {
                    select: { id: true, name: true, avatar: true },
                },
                _count: {
                    select: { answers: true },
                },
            },
        })

        // Get featured experts (verified with most answers)
        const featuredExperts = await prisma.user.findMany({
            where: {
                role: { in: ['EXPERT', 'ADMIN'] },
                isVerified: true,
            },
            orderBy: {
                expertAnswers: {
                    _count: 'desc',
                },
            },
            take: 5,
            select: {
                id: true,
                name: true,
                avatar: true,
                expertTitle: true,
                _count: {
                    select: { expertAnswers: true },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: {
                trendingPosts,
                upcomingEvents,
                recentQuestions,
                featuredExperts,
            },
        })
    } catch (error) {
        console.error('Trending fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch trending content' },
            { status: 500 }
        )
    }
}
