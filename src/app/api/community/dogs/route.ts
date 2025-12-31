import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/community/dogs - Browse all dogs with filters
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Not authenticated' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit
        const breed = searchParams.get('breed')
        const location = searchParams.get('location')
        const gender = searchParams.get('gender')
        const search = searchParams.get('search')

        // Build where clause with filters
        const where: Record<string, unknown> = {}

        if (breed) {
            where.breed = { contains: breed }
        }

        if (location) {
            where.owner = { location: { contains: location } }
        }

        if (gender) {
            where.gender = gender
        }

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { breed: { contains: search } },
            ]
        }

        const [dogs, total] = await Promise.all([
            prisma.dog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            location: true,
                        },
                    },
                },
            }),
            prisma.dog.count({ where }),
        ])

        // Get unique breeds for filter dropdown
        const breeds = await prisma.dog.findMany({
            select: { breed: true },
            distinct: ['breed'],
            orderBy: { breed: 'asc' },
        })

        return NextResponse.json({
            success: true,
            data: dogs,
            filters: {
                breeds: breeds.map(b => b.breed),
            },
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Community dogs fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dogs' },
            { status: 500 }
        )
    }
}
