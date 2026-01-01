import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/services/admin/approve-all - Approve all pending providers (admin only)
export async function POST() {
    try {
        const user = await getCurrentUser();

        // For now, allow any authenticated user to do this (for development)
        // In production, you would check: if (!user || user.role !== 'ADMIN')
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const result = await prisma.serviceProvider.updateMany({
            where: { status: 'pending' },
            data: { status: 'active' }
        });

        return NextResponse.json({
            success: true,
            message: `Approved ${result.count} pending providers`,
            count: result.count
        });
    } catch (error) {
        console.error('Approve all error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to approve providers' },
            { status: 500 }
        );
    }
}
