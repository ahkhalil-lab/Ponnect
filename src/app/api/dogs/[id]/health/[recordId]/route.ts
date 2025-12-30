import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string; recordId: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: dogId, recordId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const record = await prisma.healthRecord.findUnique({
            where: { id: recordId },
            include: {
                dog: {
                    select: { id: true, name: true, ownerId: true },
                },
            },
        })

        if (!record || record.dog.id !== dogId || record.dog.ownerId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Record not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: record,
        })
    } catch (error) {
        console.error('Health record fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch health record' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id: dogId, recordId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const record = await prisma.healthRecord.findUnique({
            where: { id: recordId },
            include: {
                dog: {
                    select: { id: true, ownerId: true },
                },
            },
        })

        if (!record || record.dog.id !== dogId || record.dog.ownerId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Record not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const {
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

        const updated = await prisma.healthRecord.update({
            where: { id: recordId },
            data: {
                title: title?.trim() || record.title,
                description: description?.trim() ?? record.description,
                date: date ? new Date(date) : record.date,
                dueDate: dueDate ? new Date(dueDate) : record.dueDate,
                frequency: frequency ?? record.frequency,
                dosage: dosage?.trim() ?? record.dosage,
                vetClinic: vetClinic?.trim() ?? record.vetClinic,
                notes: notes?.trim() ?? record.notes,
                isCompleted: isCompleted !== undefined ? isCompleted : record.isCompleted,
            },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error('Health record update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update health record' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id: dogId, recordId } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const record = await prisma.healthRecord.findUnique({
            where: { id: recordId },
            include: {
                dog: {
                    select: { id: true, ownerId: true },
                },
            },
        })

        if (!record || record.dog.id !== dogId || record.dog.ownerId !== user.id) {
            return NextResponse.json(
                { success: false, error: 'Record not found' },
                { status: 404 }
            )
        }

        await prisma.healthRecord.delete({
            where: { id: recordId },
        })

        return NextResponse.json({
            success: true,
            message: 'Record deleted',
        })
    } catch (error) {
        console.error('Health record delete error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete health record' },
            { status: 500 }
        )
    }
}
