import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/services/providers/[id] - Get provider details
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        const { id } = await params;

        const provider = await prisma.serviceProvider.findFirst({
            where: {
                OR: [
                    { id },
                    { slug: id }
                ]
            },
            include: {
                category: true,
                user: {
                    select: { id: true, name: true, avatar: true }
                },
                reviews: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        user: {
                            select: { id: true, name: true, avatar: true }
                        }
                    }
                },
                savedBy: user ? {
                    where: { userId: user.id },
                    select: { id: true }
                } : false,
                _count: {
                    select: { reviews: true }
                }
            }
        });

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            );
        }

        // Increment view count
        await prisma.serviceProvider.update({
            where: { id: provider.id },
            data: { viewCount: { increment: 1 } }
        });

        return NextResponse.json({
            success: true,
            data: {
                ...provider,
                photos: provider.photos ? JSON.parse(provider.photos) : [],
                dogSizes: provider.dogSizes ? JSON.parse(provider.dogSizes) : [],
                services: provider.services ? JSON.parse(provider.services) : [],
                availability: provider.availability ? JSON.parse(provider.availability) : null,
                isSaved: user && provider.savedBy ? provider.savedBy.length > 0 : false,
                isOwner: user?.id === provider.userId,
                savedBy: undefined,
            }
        });
    } catch (error) {
        console.error('Provider fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch provider' },
            { status: 500 }
        );
    }
}

// PATCH /api/services/providers/[id] - Update provider
export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;

        const provider = await prisma.serviceProvider.findUnique({
            where: { id }
        });

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            );
        }

        if (provider.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
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
            availability,
            logo,
            coverPhoto,
            photos,
            serviceRadius,
            status, // Admin only
            isVerified, // Admin only
            isFeatured, // Admin only
        } = body;

        // Build update data
        const updateData: Record<string, unknown> = {};

        if (businessName !== undefined) updateData.businessName = businessName;
        if (description !== undefined) updateData.description = description;
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (suburb !== undefined) updateData.suburb = suburb;
        if (postcode !== undefined) updateData.postcode = postcode;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (website !== undefined) updateData.website = website;
        if (bookingUrl !== undefined) updateData.bookingUrl = bookingUrl;
        if (priceRange !== undefined) updateData.priceRange = priceRange;
        if (dogSizes !== undefined) updateData.dogSizes = JSON.stringify(dogSizes);
        if (services !== undefined) updateData.services = JSON.stringify(services);
        if (availability !== undefined) updateData.availability = JSON.stringify(availability);
        if (logo !== undefined) updateData.logo = logo;
        if (coverPhoto !== undefined) updateData.coverPhoto = coverPhoto;
        if (photos !== undefined) updateData.photos = JSON.stringify(photos);
        if (serviceRadius !== undefined) updateData.serviceRadius = serviceRadius;

        // Admin-only fields
        if (user.role === 'ADMIN') {
            if (status !== undefined) updateData.status = status;
            if (isVerified !== undefined) updateData.isVerified = isVerified;
            if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
        }

        const updated = await prisma.serviceProvider.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                user: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('Provider update error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update provider' },
            { status: 500 }
        );
    }
}

// DELETE /api/services/providers/[id] - Delete provider
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id } = await params;

        const provider = await prisma.serviceProvider.findUnique({
            where: { id }
        });

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            );
        }

        if (provider.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Not authorized' },
                { status: 403 }
            );
        }

        await prisma.serviceProvider.delete({
            where: { id }
        });

        return NextResponse.json({
            success: true,
            message: 'Provider deleted successfully'
        });
    } catch (error) {
        console.error('Provider delete error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete provider' },
            { status: 500 }
        );
    }
}
