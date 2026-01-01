import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/services/categories - Get all service categories
export async function GET() {
    try {
        const categories = await prisma.serviceCategory.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
                _count: {
                    select: { providers: true }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: categories.map(cat => ({
                ...cat,
                providerCount: cat._count.providers,
                _count: undefined
            }))
        });
    } catch (error) {
        console.error('Categories fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch categories' },
            { status: 500 }
        );
    }
}

// POST /api/services/categories - Create category (admin only)
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { name, slug, icon, description, sortOrder } = body;

        if (!name || !slug || !icon) {
            return NextResponse.json(
                { success: false, error: 'Name, slug, and icon are required' },
                { status: 400 }
            );
        }

        const category = await prisma.serviceCategory.create({
            data: {
                name,
                slug,
                icon,
                description,
                sortOrder: sortOrder || 0
            }
        });

        return NextResponse.json({
            success: true,
            data: category
        }, { status: 201 });
    } catch (error) {
        console.error('Category creation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create category' },
            { status: 500 }
        );
    }
}
