import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const region = searchParams.get('region')
        const type = searchParams.get('type')
        const activeOnly = searchParams.get('active') !== 'false'

        const now = new Date()
        const where: Record<string, unknown> = {}

        if (activeOnly) {
            where.isActive = true
            where.OR = [
                { activeUntil: null },
                { activeUntil: { gte: now } },
            ]
        }

        if (region && region !== 'all') {
            where.region = region
        }

        if (type && type !== 'all') {
            where.type = type
        }

        const alerts = await prisma.regionalAlert.findMany({
            where,
            orderBy: [
                { severity: 'desc' },
                { createdAt: 'desc' },
            ],
        })

        return NextResponse.json({
            success: true,
            data: alerts,
        })
    } catch (error) {
        console.error('Alerts fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch alerts' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { title, message, region, severity, type, activeUntil } = body

        if (!title || !message || !region || !severity || !type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const validRegions = ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT']
        if (!validRegions.includes(region)) {
            return NextResponse.json(
                { success: false, error: 'Invalid region' },
                { status: 400 }
            )
        }

        const validSeverities = ['INFO', 'WARNING', 'CRITICAL']
        if (!validSeverities.includes(severity)) {
            return NextResponse.json(
                { success: false, error: 'Invalid severity' },
                { status: 400 }
            )
        }

        const validTypes = ['TICK', 'SNAKE', 'HEATWAVE', 'DISEASE', 'OTHER']
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid type' },
                { status: 400 }
            )
        }

        const alert = await prisma.regionalAlert.create({
            data: {
                title,
                message,
                region,
                severity,
                type,
                activeUntil: activeUntil ? new Date(activeUntil) : null,
            },
        })

        return NextResponse.json({
            success: true,
            data: alert,
        }, { status: 201 })
    } catch (error) {
        console.error('Alert creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create alert' },
            { status: 500 }
        )
    }
}
