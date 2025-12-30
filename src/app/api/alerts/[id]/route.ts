import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params

        const alert = await prisma.regionalAlert.findUnique({
            where: { id },
        })

        if (!alert) {
            return NextResponse.json(
                { success: false, error: 'Alert not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: alert,
        })
    } catch (error) {
        console.error('Alert fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch alert' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { title, message, region, severity, type, activeUntil, isActive } = body

        const updated = await prisma.regionalAlert.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(message && { message }),
                ...(region && { region }),
                ...(severity && { severity }),
                ...(type && { type }),
                ...(activeUntil !== undefined && { activeUntil: activeUntil ? new Date(activeUntil) : null }),
                ...(isActive !== undefined && { isActive }),
            },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error('Alert update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update alert' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            )
        }

        await prisma.regionalAlert.delete({
            where: { id },
        })

        return NextResponse.json({
            success: true,
            message: 'Alert deleted',
        })
    } catch (error) {
        console.error('Alert delete error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete alert' },
            { status: 500 }
        )
    }
}
