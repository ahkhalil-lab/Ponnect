import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const status = searchParams.get('status')
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {
            isPublic: true,
        }

        if (category && category !== 'all') {
            where.category = category
        }

        if (status && status !== 'all') {
            where.status = status
        }

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { content: { contains: search } },
            ]
        }

        const [questions, total] = await Promise.all([
            prisma.expertQuestion.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                    dogs: {
                        include: {
                            dog: {
                                select: {
                                    id: true,
                                    name: true,
                                    breed: true,
                                    photo: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: { answers: true },
                    },
                },
            }),
            prisma.expertQuestion.count({ where }),
        ])

        return NextResponse.json({
            success: true,
            data: questions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Expert questions fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch questions' },
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
        const { title, content, category, isPublic, images, dogIds } = body

        if (!title || title.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Title is required' },
                { status: 400 }
            )
        }

        if (!content || content.trim().length === 0) {
            return NextResponse.json(
                { success: false, error: 'Content is required' },
                { status: 400 }
            )
        }

        const validCategories = ['HEALTH', 'TRAINING', 'NUTRITION', 'BEHAVIOR']
        if (!category || !validCategories.includes(category)) {
            return NextResponse.json(
                { success: false, error: 'Valid category is required' },
                { status: 400 }
            )
        }

        // Validate dogIds if provided - ensure they belong to the user
        let validDogIds: string[] = []
        if (dogIds && Array.isArray(dogIds) && dogIds.length > 0) {
            const userDogs = await prisma.dog.findMany({
                where: {
                    id: { in: dogIds },
                    ownerId: user.id,
                },
                select: { id: true },
            })
            validDogIds = userDogs.map(d => d.id)
        }

        const question = await prisma.expertQuestion.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                category,
                isPublic: isPublic !== false,
                images: images ? JSON.stringify(images) : null,
                authorId: user.id,
                dogs: validDogIds.length > 0 ? {
                    create: validDogIds.map(dogId => ({ dogId })),
                } : undefined,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                    },
                },
                dogs: {
                    include: {
                        dog: {
                            select: {
                                id: true,
                                name: true,
                                breed: true,
                                photo: true,
                            },
                        },
                    },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: question,
        }, { status: 201 })
    } catch (error) {
        console.error('Expert question creation error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create question' },
            { status: 500 }
        )
    }
}
