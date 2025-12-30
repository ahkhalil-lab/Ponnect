import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''
        const type = searchParams.get('type') || 'all'
        const limit = parseInt(searchParams.get('limit') || '10')

        if (!query.trim()) {
            return NextResponse.json({
                success: true,
                data: {
                    forums: [],
                    events: [],
                    questions: [],
                    counts: { forums: 0, events: 0, questions: 0, total: 0 },
                },
            })
        }

        const searchTerm = query.trim()
        const results: {
            forums: unknown[]
            events: unknown[]
            questions: unknown[]
        } = {
            forums: [],
            events: [],
            questions: [],
        }

        // Search forums
        if (type === 'all' || type === 'forums') {
            results.forums = await prisma.forumPost.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm } },
                        { content: { contains: searchTerm } },
                    ],
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: { id: true, name: true, avatar: true },
                    },
                    category: {
                        select: { id: true, name: true, slug: true, icon: true },
                    },
                    _count: {
                        select: { comments: true },
                    },
                },
            })
        }

        // Search events
        if (type === 'all' || type === 'events') {
            results.events = await prisma.event.findMany({
                where: {
                    isCancelled: false,
                    OR: [
                        { title: { contains: searchTerm } },
                        { description: { contains: searchTerm } },
                        { location: { contains: searchTerm } },
                    ],
                },
                take: limit,
                orderBy: { date: 'asc' },
                include: {
                    creator: {
                        select: { id: true, name: true, avatar: true },
                    },
                    _count: {
                        select: { rsvps: true },
                    },
                },
            })
        }

        // Search Q&A questions
        if (type === 'all' || type === 'qa') {
            results.questions = await prisma.expertQuestion.findMany({
                where: {
                    isPublic: true,
                    OR: [
                        { title: { contains: searchTerm } },
                        { content: { contains: searchTerm } },
                    ],
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: { id: true, name: true, avatar: true },
                    },
                    _count: {
                        select: { answers: true },
                    },
                },
            })
        }

        const counts = {
            forums: results.forums.length,
            events: results.events.length,
            questions: results.questions.length,
            total: results.forums.length + results.events.length + results.questions.length,
        }

        return NextResponse.json({
            success: true,
            data: {
                ...results,
                counts,
            },
        })
    } catch (error) {
        console.error('Search error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to search' },
            { status: 500 }
        )
    }
}
