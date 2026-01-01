import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        // Initialize stats with defaults
        let dogCount = 0
        let forumPosts = 0
        let upcomingEvents = 0
        let healthReminders = 0
        let alerts: Array<{
            id: string
            title: string
            message: string
            severity: string
            type: string
            region: string
        }> = []

        try {
            // Get user's dog count
            dogCount = await prisma.dog.count({
                where: { ownerId: user.id }
            })
        } catch (e) {
            console.error('Error fetching dog count:', e)
        }

        try {
            // Get user's forum posts count
            forumPosts = await prisma.forumPost.count({
                where: { authorId: user.id, isDeleted: false }
            })
        } catch (e) {
            console.error('Error fetching forum posts:', e)
        }

        try {
            // Get upcoming events count
            const now = new Date()
            upcomingEvents = await prisma.event.count({
                where: {
                    date: { gte: now },
                    isCancelled: false
                }
            })
        } catch (e) {
            console.error('Error fetching events:', e)
        }

        try {
            // Get health reminders
            const now = new Date()
            const nextWeek = new Date()
            nextWeek.setDate(nextWeek.getDate() + 7)

            healthReminders = await prisma.healthRecord.count({
                where: {
                    dog: { ownerId: user.id },
                    date: { gte: now, lte: nextWeek },
                    isCompleted: false
                }
            })
        } catch (e) {
            console.error('Error fetching health reminders:', e)
        }

        try {
            // Get active regional alerts
            const now = new Date()
            const alertResults = await prisma.regionalAlert.findMany({
                where: {
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gte: now } }
                    ]
                },
                orderBy: [
                    { severity: 'desc' },
                    { issuedAt: 'desc' }
                ],
                take: 3
            })

            alerts = alertResults.map(alert => ({
                id: alert.id,
                title: alert.title,
                message: alert.message,
                severity: alert.severity,
                type: alert.type,
                region: alert.region
            }))
        } catch (e) {
            console.error('Error fetching alerts:', e)
        }

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    dogCount,
                    forumPosts,
                    upcomingEvents,
                    healthReminders
                },
                alerts
            }
        })
    } catch (error) {
        console.error('Dashboard stats error:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
