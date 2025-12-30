import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
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

        const notification = await prisma.notification.findUnique({
            where: { id },
        })

        if (!notification || notification.userId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Notification not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { isRead } = body

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: isRead !== undefined ? isRead : !notification.isRead },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error('Notification update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update notification' },
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

        const notification = await prisma.notification.findUnique({
            where: { id },
        })

        if (!notification || notification.userId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Notification not found' },
                { status: 404 }
            )
        }

        await prisma.notification.delete({
            where: { id },
        })

        return NextResponse.json({
            success: true,
            message: 'Notification deleted',
        })
    } catch (error) {
        console.error('Notification delete error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete notification' },
            { status: 500 }
        )
    }
}
