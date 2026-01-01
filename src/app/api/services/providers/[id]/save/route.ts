import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/services/providers/[id]/save - Toggle save provider
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

        // Check if already saved
        const existing = await prisma.savedProvider.findUnique({
            where: {
                providerId_userId: {
                    providerId,
                    userId: user.id
                }
            }
        });

        if (existing) {
            // Unsave
            await prisma.savedProvider.delete({
                where: { id: existing.id }
            });

            return NextResponse.json({
                success: true,
                data: { isSaved: false }
            });
        } else {
            // Save
            await prisma.savedProvider.create({
                data: {
                    providerId,
                    userId: user.id
                }
            });

            return NextResponse.json({
                success: true,
                data: { isSaved: true }
            });
        }
    } catch (error) {
        console.error('Save provider error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save provider' },
            { status: 500 }
        );
    }
}
