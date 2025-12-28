import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const categories = await prisma.forumCategory.findMany({
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: { posts: true },
                },
            },
        })

        return NextResponse.json({
            success: true,
            data: categories,
        })
    } catch (error) {
        console.error('Forum categories fetch error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}
