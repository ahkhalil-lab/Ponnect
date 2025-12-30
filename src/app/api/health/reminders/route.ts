import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Get all upcoming reminders for user's dogs
        const dogs = await prisma.dog.findMany({
            where: { ownerId: user.id },
            select: { id: true, name: true, photo: true },
        })

        const dogIds = dogs.map(d => d.id)

        const reminders = await prisma.healthRecord.findMany({
            where: {
                dogId: { in: dogIds },
                dueDate: { gte: new Date() },
                isCompleted: false,
            },
            orderBy: { dueDate: 'asc' },
            include: {
                dog: {
                    select: {
                        id: true,
                        name: true,
                        photo: true,
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: reminders,
        })
    } catch (error) {
        console.error('Reminders fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reminders' },
            { status: 500 }
        )
    }
}
