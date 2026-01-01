/**
 * Media Processing Library
 * Client-side image and video compression for social feed uploads
 */

export interface MediaProcessingResult {
    blob: Blob;
    width: number;
    height: number;
    originalSize: number;
    compressedSize: number;
    type: 'image' | 'video';
    duration?: number; // For videos
}

export interface ProcessingOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'image/jpeg' | 'image/webp';
}

const DEFAULT_OPTIONS: ProcessingOptions = {
    maxWidth: 1080,
    maxHeight: 1350,
    quality: 0.85,
    format: 'image/webp',
};

/**
 * Compress and resize an image file
 * Target: Instagram-like dimensions (1080px max width)
 */
export async function compressImage(
    file: File,
    options: ProcessingOptions = {}
): Promise<MediaProcessingResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const originalSize = file.size;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
        }

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img;
            const aspectRatio = width / height;

            if (width > (opts.maxWidth || 1080)) {
                width = opts.maxWidth || 1080;
                height = width / aspectRatio;
            }

            if (height > (opts.maxHeight || 1350)) {
                height = opts.maxHeight || 1350;
                width = height * aspectRatio;
            }

            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;

            // Enable high-quality image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw the image
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to blob with compression
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to create blob'));
                        return;
                    }

                    resolve({
                        blob,
                        width,
                        height,
                        originalSize,
                        compressedSize: blob.size,
                        type: 'image',
                    });
                },
                opts.format,
                opts.quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Create a thumbnail from an image
 */
export async function createThumbnail(
    file: File,
    size: number = 320
): Promise<Blob> {
    const result = await compressImage(file, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.7,
        format: 'image/webp',
    });
    return result.blob;
}

/**
 * Validate video file
 * Returns duration and basic metadata
 */
export async function validateVideo(file: File): Promise<{
    valid: boolean;
    duration: number;
    width: number;
    height: number;
    error?: string;
}> {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);

            // Check duration (max 60 seconds)
            if (video.duration > 60) {
                resolve({
                    valid: false,
                    duration: video.duration,
                    width: video.videoWidth,
                    height: video.videoHeight,
                    error: 'Video must be 60 seconds or less',
                });
                return;
            }

            resolve({
                valid: true,
                duration: video.duration,
                width: video.videoWidth,
                height: video.videoHeight,
            });
        };

        video.onerror = () => {
            resolve({
                valid: false,
                duration: 0,
                width: 0,
                height: 0,
                error: 'Failed to load video',
            });
        };

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Generate video thumbnail (first frame)
 */
export async function generateVideoThumbnail(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
        }

        video.onloadedmetadata = () => {
            // Seek to 1 second or 10% of duration for thumbnail
            video.currentTime = Math.min(1, video.duration * 0.1);
        };

        video.onseeked = () => {
            // Calculate thumbnail dimensions (max 320px)
            let width = video.videoWidth;
            let height = video.videoHeight;
            const maxSize = 320;

            if (width > height && width > maxSize) {
                height = (height / width) * maxSize;
                width = maxSize;
            } else if (height > maxSize) {
                width = (width / height) * maxSize;
                height = maxSize;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(video, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(video.src);
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create thumbnail'));
                    }
                },
                'image/webp',
                0.8
            );
        };

        video.onerror = () => {
            reject(new Error('Failed to load video'));
        };

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format video duration for display
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if file is a supported image
 */
export function isImageFile(file: File): boolean {
    return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
}

/**
 * Check if file is a supported video
 * Mobile browsers often report different MIME types, so we also check file extension
 */
export function isVideoFile(file: File): boolean {
    // Supported MIME types (including mobile-specific ones)
    const supportedMimeTypes = [
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

    if (supportedMimeTypes.includes(file.type)) {
        return true;
    }

    // Fallback: check file extension (mobile browsers may not set correct MIME type)
    const videoExtensions = ['.mp4', '.webm', '.mov', '.m4v', '.mpeg', '.mpg', '.3gp', '.3g2', '.mkv', '.ogg', '.avi'];
    const fileName = file.name.toLowerCase();
    return videoExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Get max file size for type
 */
export function getMaxFileSize(type: 'image' | 'video'): number {
    return type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
}

/**
 * Process multiple images for upload
 */
export async function processImagesForUpload(
    files: File[],
    onProgress?: (current: number, total: number) => void
): Promise<MediaProcessingResult[]> {
    const results: MediaProcessingResult[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (isImageFile(file)) {
            const result = await compressImage(file);
            results.push(result);
            onProgress?.(i + 1, files.length);
        }
    }

    return results;
}
