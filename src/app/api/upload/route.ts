import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getCurrentUser } from '@/lib/auth';
import { existsSync } from 'fs';

// Configure max file sizes
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// Mobile browsers often use different MIME types for video
const ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-m4v',
    'video/mpeg',
    'video/3gpp',
    'video/3gpp2',
    'video/x-matroska',
    'video/ogg',
    'video/avi',
    'video/x-msvideo',
];

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
        const type = formData.get('type') as string; // 'avatar', 'dog', or 'post'
        const entityId = formData.get('entityId') as string | null; // dog id if type is 'dog'

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!type || !['avatar', 'dog', 'post'].includes(type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid upload type' },
                { status: 400 }
            );
        }

        // Determine if it's a video or image
        let isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
        let isImage = ALLOWED_IMAGE_TYPES.includes(file.type);

        // Fallback: check file extension (mobile browsers may not set correct MIME type)
        if (!isVideo && !isImage) {
            const fileName = file.name.toLowerCase();
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            const videoExtensions = ['.mp4', '.webm', '.mov', '.m4v', '.mpeg', '.mpg', '.3gp', '.3g2', '.mkv', '.avi'];

            isImage = imageExtensions.some(ext => fileName.endsWith(ext));
            isVideo = videoExtensions.some(ext => fileName.endsWith(ext));
        }

        // Validate file type
        if (!isVideo && !isImage) {
            return NextResponse.json(
                { success: false, error: `Invalid file type "${file.type}". Please upload an image or video file.` },
                { status: 400 }
            );
        }

        // Validate file size
        const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: `File too large. Maximum size is ${isVideo ? '50MB' : '10MB'}.` },
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
