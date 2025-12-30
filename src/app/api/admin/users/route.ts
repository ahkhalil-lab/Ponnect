import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            )
        }

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''
        const role = searchParams.get('role')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: Record<string, unknown> = {}

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
            ]
        }

        if (role && role !== 'all') {
            where.role = role
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isVerified: true,
                    location: true,
                    avatar: true,
                    createdAt: true,
                    _count: {
                        select: {
                            posts: true,
                            dogs: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ])

        return NextResponse.json({
            success: true,
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Admin users list error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

export async function PATCH(request: Request) {
    try {
        const admin = await getCurrentUser()

        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { userId, role, isVerified } = body

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID required' },
                { status: 400 }
            )
        }

        const updateData: Record<string, unknown> = {}

        if (role) {
            const validRoles = ['USER', 'EXPERT', 'MODERATOR', 'ADMIN']
            if (!validRoles.includes(role)) {
                return NextResponse.json(
                    { success: false, error: 'Invalid role' },
                    { status: 400 }
                )
            }
            updateData.role = role
        }

        if (isVerified !== undefined) {
            updateData.isVerified = isVerified
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isVerified: true,
            },
        })

        return NextResponse.json({
            success: true,
            data: updated,
        })
    } catch (error) {
        console.error('Admin user update error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update user' },
            { status: 500 }
        )
    }
}
