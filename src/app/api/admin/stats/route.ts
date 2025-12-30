import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            )
        }

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        // Get counts
        const [
            totalUsers,
            newUsersThisMonth,
            totalPosts,
            newPostsThisWeek,
            totalEvents,
            upcomingEvents,
            totalQuestions,
            pendingQuestions,
            totalExperts,
            pendingExpertApplications,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.forumPost.count(),
            prisma.forumPost.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
            prisma.event.count({ where: { isCancelled: false } }),
            prisma.event.count({ where: { date: { gte: now }, isCancelled: false } }),
            prisma.expertQuestion.count(),
            prisma.expertQuestion.count({ where: { status: 'PENDING' } }),
            prisma.user.count({ where: { role: 'EXPERT', isVerified: true } }),
            prisma.user.count({ where: { role: 'EXPERT', isVerified: false } }),
        ])

        // Recent activity
        const recentUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, email: true, createdAt: true },
        })

        const recentPosts = await prisma.forumPost.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                author: { select: { id: true, name: true } },
                category: { select: { name: true } },
            },
        })

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    users: { total: totalUsers, new: newUsersThisMonth },
                    posts: { total: totalPosts, new: newPostsThisWeek },
                    events: { total: totalEvents, upcoming: upcomingEvents },
                    questions: { total: totalQuestions, pending: pendingQuestions },
                    experts: { total: totalExperts, pending: pendingExpertApplications },
                },
                recentActivity: {
                    users: recentUsers,
                    posts: recentPosts,
                },
            },
        })
    } catch (error) {
        console.error('Admin stats error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch admin stats' },
            { status: 500 }
        )
    }
}
