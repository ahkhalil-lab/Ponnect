import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// POST /api/services/providers/[id]/contact - Log contact action
export async function POST(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        const { id: providerId } = await params;

        const body = await request.json();
        const { type } = body; // 'call', 'message', 'website', 'booking'

        const provider = await prisma.serviceProvider.findUnique({
            where: { id: providerId }
        });

        if (!provider) {
            return NextResponse.json(
                { success: false, error: 'Provider not found' },
                { status: 404 }
            );
        }

        // Increment contact count
        await prisma.serviceProvider.update({
            where: { id: providerId },
            data: { contactCount: { increment: 1 } }
        });

        // Return contact info based on type
        let contactInfo: Record<string, string | null> = {};
        switch (type) {
            case 'call':
                contactInfo = { phone: provider.phone };
                break;
            case 'website':
                contactInfo = { website: provider.website };
                break;
            case 'booking':
                contactInfo = { bookingUrl: provider.bookingUrl };
                break;
            default:
                contactInfo = { email: provider.email };
        }

        return NextResponse.json({
            success: true,
            data: contactInfo
        });
    } catch (error) {
        console.error('Contact provider error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get contact info' },
            { status: 500 }
        );
    }
}
