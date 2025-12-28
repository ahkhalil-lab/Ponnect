import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()
        const { id } = await params

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const dog = await prisma.dog.findFirst({
            where: {
                id,
                ownerId: user.id,
            },
            include: {
                healthRecords: {
                    orderBy: { date: 'desc' },
                    take: 5,
                },
                _count: {
                    select: { healthRecords: true },
                },
            },
        })

        if (!dog) {
            return NextResponse.json(
                { success: false, error: 'Dog not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: dog,
        })
    } catch (error) {
        console.error('Dog fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dog' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()
        const { id } = await params

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Verify ownership
        const existingDog = await prisma.dog.findFirst({
            where: { id, ownerId: user.id },
        })

        if (!existingDog) {
            return NextResponse.json(
                { success: false, error: 'Dog not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { name, breed, birthDate, gender, weight, bio, photo } = body

        // Validate required fields
        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Name is required' },
                { status: 400 }
            )
        }

        if (!breed || breed.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Breed is required' },
                { status: 400 }
            )
        }

        const updatedDog = await prisma.dog.update({
            where: { id },
            data: {
                name: name.trim(),
                breed: breed.trim(),
                birthDate: birthDate ? new Date(birthDate) : null,
                gender: gender || existingDog.gender,
                weight: weight ? parseFloat(weight) : null,
                bio: bio?.trim() || null,
                photo: photo || null,
            },
        })

        return NextResponse.json({
            success: true,
            data: updatedDog,
        })
    } catch (error) {
        console.error('Dog update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update dog' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser()
        const { id } = await params

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        // Verify ownership
        const dog = await prisma.dog.findFirst({
            where: { id, ownerId: user.id },
        })

        if (!dog) {
            return NextResponse.json(
                { success: false, error: 'Dog not found' },
                { status: 404 }
            )
        }

        await prisma.dog.delete({
            where: { id },
        })

        return NextResponse.json({
            success: true,
            message: 'Dog deleted successfully',
        })
    } catch (error) {
        console.error('Dog deletion error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to delete dog' },
            { status: 500 }
        )
    }
}
