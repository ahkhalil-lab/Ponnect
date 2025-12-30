import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getCurrentUser } from '@/lib/auth';
import { existsSync } from 'fs';

// Configure max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string; // 'avatar' or 'dog'
        const entityId = formData.get('entityId') as string | null; // dog id if type is 'dog'

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!type || !['avatar', 'dog'].includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid upload type' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF.' },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `${type}_${user.id}_${entityId || 'profile'}_${timestamp}.${extension}`;

        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Write file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Return the public URL
        const url = `/uploads/${filename}`;

        return NextResponse.json({
            success: true,
            data: {
                url,
                filename,
                size: file.size,
                type: file.type
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
