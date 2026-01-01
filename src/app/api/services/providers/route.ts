import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/services/providers - Search and list providers
export async function GET(request: Request) {
    try {
        const user = await getCurrentUser();
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const city = searchParams.get('city') || 'Brisbane';
        const priceRange = searchParams.get('priceRange');
        const dogSize = searchParams.get('dogSize');
        const featured = searchParams.get('featured') === 'true';
        const sortBy = searchParams.get('sortBy') || 'relevance';

        // Build where clause
        const where: Record<string, unknown> = {
            status: 'active',
        };

        if (category) {
            where.category = { slug: category };
        }

        if (city) {
            where.city = { contains: city };
        }

        if (priceRange) {
            where.priceRange = priceRange;
        }

        if (featured) {
            where.isFeatured = true;
        }

        if (search) {
            where.OR = [
                { businessName: { contains: search } },
                { description: { contains: search } },
                { suburb: { contains: search } },
            ];
        }

        if (dogSize) {
            where.dogSizes = { contains: dogSize };
        }

        // Build orderBy
        let orderBy: Record<string, string>[] = [];
        switch (sortBy) {
            case 'rating':
                orderBy = [{ isFeatured: 'desc' }, { averageRating: 'desc' }];
                break;
            case 'newest':
                orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
                break;
            case 'reviews':
                orderBy = [{ isFeatured: 'desc' }, { reviewCount: 'desc' }];
                break;
            default: // relevance
                orderBy = [{ isFeatured: 'desc' }, { averageRating: 'desc' }, { reviewCount: 'desc' }];
        }

        const [providers, total] = await Promise.all([
            prisma.serviceProvider.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    category: {
                        select: { id: true, name: true, slug: true, icon: true }
                    },
                    user: {
                        select: { id: true, name: true, avatar: true }
                    },
                    savedBy: user ? {
                        where: { userId: user.id },
                        select: { id: true }
                    } : false,
                    _count: {
                        select: { reviews: true }
                    }
                }
            }),
            prisma.serviceProvider.count({ where })
        ]);

        // Transform response
        const transformedProviders = providers.map(provider => ({
            ...provider,
            photos: provider.photos ? JSON.parse(provider.photos) : [],
            dogSizes: provider.dogSizes ? JSON.parse(provider.dogSizes) : [],
            services: provider.services ? JSON.parse(provider.services) : [],
            isSaved: user && provider.savedBy ? provider.savedBy.length > 0 : false,
            savedBy: undefined,
        }));

        return NextResponse.json({
            success: true,
            data: transformedProviders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Providers fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch providers' },
            { status: 500 }
        );
    }
}

// POST /api/services/providers - Create new provider listing
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user already has a listing
        const existing = await prisma.serviceProvider.findUnique({
            where: { userId: user.id }
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'You already have a service listing' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const {
            businessName,
            description,
            categoryId,
            suburb,
            postcode,
            phone,
            email,
            website,
            bookingUrl,
            priceRange,
            dogSizes,
            services,
            logo,
            coverPhoto,
            photos,
            serviceRadius
        } = body;

        // Validate required fields
        if (!businessName || !description || !categoryId || !suburb || !postcode || !email) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Generate slug
        const slug = businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

        const provider = await prisma.serviceProvider.create({
            data: {
                userId: user.id,
                businessName,
                slug,
                description,
                categoryId,
                suburb,
                postcode,
                email: email || user.email,
                phone,
                website,
                bookingUrl,
                priceRange,
                dogSizes: dogSizes ? JSON.stringify(dogSizes) : null,
                services: services ? JSON.stringify(services) : null,
                logo,
                coverPhoto,
                photos: photos ? JSON.stringify(photos) : null,
                serviceRadius: serviceRadius || 10,
                status: 'active', // Auto-approve for now
            },
            include: {
                category: true,
                user: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: provider,
            message: 'Your listing is now live!'
        }, { status: 201 });
    } catch (error) {
        console.error('Provider creation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create listing' },
            { status: 500 }
        );
    }
}
