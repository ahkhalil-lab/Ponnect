import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/services/providers/[id]/reviews - Get provider reviews
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id: providerId } = await params;
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.providerReview.findMany({
                where: { providerId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, name: true, avatar: true }
                    }
                }
            }),
            prisma.providerReview.count({ where: { providerId } })
        ]);

        return NextResponse.json({
            success: true,
            data: reviews.map(r => ({
                ...r,
                photos: r.photos ? JSON.parse(r.photos) : []
            })),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Reviews fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch reviews' },
            { status: 500 }
        );
    }
}

// POST /api/services/providers/[id]/reviews - Create review
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id: providerId } = await params;

        const provider = await prisma.serviceProvider.findUnique({
            where: { id: providerId }
        });

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            );
        }

        // Check if user already reviewed
        const existing = await prisma.providerReview.findUnique({
            where: {
                providerId_userId: {
                    providerId,
                    userId: user.id
                }
            }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'You have already reviewed this provider' },
                { status: 400 }
            );
        }

        // Can't review own listing
        if (provider.userId === user.id) {
            return NextResponse.json(
                { success: false, error: 'You cannot review your own listing' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { rating, content, photos } = body;

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json(
                { success: false, error: 'Rating must be between 1 and 5' },
                { status: 400 }
            );
        }

        if (!content || content.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: 'Review must be at least 10 characters' },
                { status: 400 }
            );
        }

        const review = await prisma.providerReview.create({
            data: {
                providerId,
                userId: user.id,
                rating,
                content: content.trim(),
                photos: photos ? JSON.stringify(photos) : null
            },
            include: {
                user: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        // Update provider average rating
        const stats = await prisma.providerReview.aggregate({
            where: { providerId },
            _avg: { rating: true },
            _count: true
        });

        await prisma.serviceProvider.update({
            where: { id: providerId },
            data: {
                averageRating: stats._avg.rating || 0,
                reviewCount: stats._count
            }
        });

        return NextResponse.json({
            success: true,
            data: review
        }, { status: 201 });
    } catch (error) {
        console.error('Review creation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create review' },
            { status: 500 }
        );
    }
}
