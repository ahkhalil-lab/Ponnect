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

        const dogs = await prisma.dog.findMany({
            where: { ownerId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { healthRecords: true },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: dogs,
        })
    } catch (error) {
        console.error('Dogs fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dogs' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
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

        if (!gender || !['MALE', 'FEMALE', 'UNKNOWN'].includes(gender)) {
            return NextResponse.json(
                { success: false, error: 'Valid gender is required (MALE, FEMALE, or UNKNOWN)' },
                { status: 400 }
            )
        }

        // Create the dog
        const dog = await prisma.dog.create({
            data: {
                name: name.trim(),
                breed: breed.trim(),
                birthDate: birthDate ? new Date(birthDate) : null,
                gender,
                weight: weight ? parseFloat(weight) : null,
                bio: bio?.trim() || null,
                photo: photo || null,
                ownerId: user.id,
            },
        })

        return NextResponse.json({
            success: true,
            data: dog,
        }, { status: 201 })
    } catch (error) {
        console.error('Dog creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create dog' },
            { status: 500 }
        )
    }
}
