import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: dogId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Verify dog ownership
        const dog = await prisma.dog.findUnique({
            where: { id: dogId },
        })

        if (!dog || dog.ownerId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Dog not found' },
                { status: 404 }
            )
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const upcoming = searchParams.get('upcoming') === 'true'

        const where: Record<string, unknown> = { dogId }

        if (type && type !== 'all') {
            where.type = type
        }

        if (upcoming) {
            where.dueDate = { gte: new Date() }
            where.isCompleted = false
        }

        const records = await prisma.healthRecord.findMany({
            where,
            orderBy: { date: 'desc' },
        })

        return NextResponse.json({
            success: true,
            data: records,
        })
    } catch (error) {
        console.error('Health records fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch health records' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request, { params }: RouteParams) {
    try {
        const { id: dogId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Verify dog ownership
        const dog = await prisma.dog.findUnique({
            where: { id: dogId },
        })

        if (!dog || dog.ownerId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Dog not found or not owned by you' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const {
            type,
            title,
            description,
            date,
            dueDate,
            frequency,
            dosage,
            vetClinic,
            notes,
            isCompleted,
        } = body

        if (!type) {
            return NextResponse.json(
                { success: false, error: 'Record type is required' },
                { status: 400 }
            )
        }

        const validTypes = ['VACCINATION', 'MEDICATION', 'VET_VISIT', 'CONDITION', 'WEIGHT', 'OTHER']
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid record type' },
                { status: 400 }
            )
        }

        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Title is required' },
                { status: 400 }
            )
        }

        if (!date) {
            return NextResponse.json(
                { success: false, error: 'Date is required' },
                { status: 400 }
            )
        }

        const record = await prisma.healthRecord.create({
            data: {
                dogId,
                type,
                title: title.trim(),
                description: description?.trim() || null,
                date: new Date(date),
                dueDate: dueDate ? new Date(dueDate) : null,
                frequency: frequency || null,
                dosage: dosage?.trim() || null,
                vetClinic: vetClinic?.trim() || null,
                notes: notes?.trim() || null,
                isCompleted: isCompleted || false,
            },
        })

        return NextResponse.json({
            success: true,
            data: record,
        }, { status: 201 })
    } catch (error) {
        console.error('Health record creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create health record' },
            { status: 500 }
        )
    }
}
