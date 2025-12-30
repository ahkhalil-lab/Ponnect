import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// Save or unsave an alert
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: alertId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Check if alert exists
        const alert = await prisma.regionalAlert.findUnique({
            where: { id: alertId },
        })

        if (!alert) {
            return NextResponse.json(
                { success: false, error: 'Alert not found' },
                { status: 404 }
            )
        }

        // Check if already saved
        const existingSave = await prisma.savedAlert.findUnique({
            where: {
                userId_alertId: {
                    userId: user.id,
                    alertId,
                },
            },
        })

        if (existingSave) {
            // Unsave
            await prisma.savedAlert.delete({
                where: { id: existingSave.id },
            })

            return NextResponse.json({
                success: true,
                saved: false,
                message: 'Alert unsaved',
            })
        }

        // Save
        await prisma.savedAlert.create({
            data: {
                userId: user.id,
                alertId,
            },
        })

        return NextResponse.json({
            success: true,
            saved: true,
            message: 'Alert saved',
        })
    } catch (error) {
        console.error('Save alert error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to save alert' },
            { status: 500 }
        )
    }
}

// Get save status
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: alertId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({
                success: true,
                saved: false,
            })
        }

        const existingSave = await prisma.savedAlert.findUnique({
            where: {
                userId_alertId: {
                    userId: user.id,
                    alertId,
                },
            },
        })

        return NextResponse.json({
            success: true,
            saved: !!existingSave,
        })
    } catch (error) {
        console.error('Check saved alert error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to check saved status' },
            { status: 500 }
        )
    }
}
