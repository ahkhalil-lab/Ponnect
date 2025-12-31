'use client';

import { useState, useRef, useCallback } from 'react';
import styles from './MediaUpload.module.css';
import {
    compressImage,
    validateVideo,
    generateVideoThumbnail,
    isImageFile,
    isVideoFile,
    formatFileSize,
    formatDuration,
    getMaxFileSize,
} from '@/lib/media-processor';

interface MediaItem {
    id: string;
    file: File;
    preview: string;
    type: 'image' | 'video';
    compressed?: Blob;
    thumbnail?: Blob;
    duration?: number;
    uploading?: boolean;
    uploaded?: boolean;
    url?: string;
    error?: string;
}

interface MediaUploadProps {
    onMediaChange: (urls: string[], videoUrl?: string, videoThumbnail?: string) => void;
    maxImages?: number;
    disabled?: boolean;
}

export default function MediaUpload({
    onMediaChange,
    maxImages = 4,
    disabled = false,
}: MediaUploadProps) {
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateId = () => Math.random().toString(36).substring(2, 9);

    const handleFilesSelected = useCallback(async (files: FileList) => {
        if (disabled || isProcessing) return;

        setError(null);
        const newFiles = Array.from(files);

        // Check if adding video when images exist or vice versa
        const hasVideo = mediaItems.some(m => m.type === 'video');
        const hasImages = mediaItems.some(m => m.type === 'image');
        const newHasVideo = newFiles.some(f => isVideoFile(f));
        const newHasImages = newFiles.some(f => isImageFile(f));

        if ((hasVideo && newHasImages) || (hasImages && newHasVideo) || (hasVideo && newHasVideo)) {
            setError('You can upload either images OR one video, not both');
            return;
        }

        if (newHasVideo && newFiles.filter(f => isVideoFile(f)).length > 1) {
            setError('You can only upload one video per post');
            return;
        }

        // Check total image count
        const currentImageCount = mediaItems.filter(m => m.type === 'image').length;
        const newImageCount = newFiles.filter(f => isImageFile(f)).length;
        if (currentImageCount + newImageCount > maxImages) {
            setError(`Maximum ${maxImages} images allowed`);
            return;
        }

        setIsProcessing(true);

        const processedItems: MediaItem[] = [];

        for (const file of newFiles) {
            const id = generateId();

            // Check file size
            const fileType = isVideoFile(file) ? 'video' : 'image';
            if (file.size > getMaxFileSize(fileType)) {
                setError(`File "${file.name}" is too large (max ${fileType === 'video' ? '50MB' : '10MB'})`);
                continue;
            }

            if (isImageFile(file)) {
                try {
                    const result = await compressImage(file);
                    const preview = URL.createObjectURL(result.blob);

                    // Upload immediately
                    const formData = new FormData();
                    const uploadFile = new File([result.blob], `image_${id}.webp`, { type: 'image/webp' });
                    formData.append('file', uploadFile);
                    formData.append('type', 'post');

                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    const data = await res.json();

                    if (data.success) {
                        processedItems.push({
                            id,
                            file,
                            preview,
                            type: 'image',
                            compressed: result.blob,
                            uploaded: true,
                            url: data.data.url,
                        });
                    } else {
                        setError(`Failed to upload "${file.name}": ${data.error}`);
                    }
                } catch (err) {
                    console.error('Failed to process image:', err);
                    setError(`Failed to process "${file.name}"`);
                }
            } else if (isVideoFile(file)) {
                try {
                    const validation = await validateVideo(file);
                    if (!validation.valid) {
                        setError(validation.error || 'Invalid video');
                        continue;
                    }
                    const thumbnail = await generateVideoThumbnail(file);
                    const preview = URL.createObjectURL(file);

                    // Upload video immediately
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('type', 'post');

                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                    const data = await res.json();

                    if (data.success) {
                        // Upload thumbnail
                        let thumbnailUrl: string | undefined;
                        const thumbFormData = new FormData();
                        const thumbFile = new File([thumbnail], `thumb_${id}.webp`, { type: 'image/webp' });
                        thumbFormData.append('file', thumbFile);
                        thumbFormData.append('type', 'post');

                        const thumbRes = await fetch('/api/upload', { method: 'POST', body: thumbFormData });
                        const thumbData = await thumbRes.json();
                        if (thumbData.success) {
                            thumbnailUrl = thumbData.data.url;
                        }

                        processedItems.push({
                            id,
                            file,
                            preview,
                            type: 'video',
                            thumbnail,
                            duration: validation.duration,
                            uploaded: true,
                            url: data.data.url,
                        });

                        // Immediately notify parent of video upload
                        onMediaChange([], data.data.url, thumbnailUrl);
                    } else {
                        setError(`Failed to upload "${file.name}": ${data.error}`);
                    }
                } catch (err) {
                    console.error('Failed to process video:', err);
                    setError(`Failed to process "${file.name}"`);
                }
            }
        }

        // Update state and notify parent
        const allItems = [...mediaItems, ...processedItems];
        setMediaItems(allItems);

        // Collect all image URLs and notify parent
        const imageUrls = allItems.filter(m => m.type === 'image' && m.url).map(m => m.url!);
        const videoItem = allItems.find(m => m.type === 'video' && m.url);
        onMediaChange(imageUrls, videoItem?.url);

        setIsProcessing(false);
    }, [disabled, isProcessing, mediaItems, maxImages, onMediaChange]);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesSelected(e.target.files);
            e.target.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelected(e.dataTransfer.files);
        }
    };

    const removeItem = (id: string) => {
        const updatedItems = mediaItems.filter(m => m.id !== id);
        const removedItem = mediaItems.find(m => m.id === id);

        if (removedItem) {
            URL.revokeObjectURL(removedItem.preview);
        }

        setMediaItems(updatedItems);

        // Notify parent of remaining items
        const imageUrls = updatedItems.filter(m => m.type === 'image' && m.url).map(m => m.url!);
        const videoItem = updatedItems.find(m => m.type === 'video' && m.url);
        onMediaChange(imageUrls, videoItem?.url);
    };

    // Upload all media and call onMediaChange with URLs
    const uploadAll = async (): Promise<{ success: boolean; imageUrls: string[]; videoUrl?: string; videoThumbnail?: string }> => {
        const imageUrls: string[] = [];
        let videoUrl: string | undefined;
        let videoThumbnailUrl: string | undefined;

        setMediaItems(prev => prev.map(m => ({ ...m, uploading: true })));

        for (const item of mediaItems) {
            try {
                const formData = new FormData();

                if (item.type === 'image' && item.compressed) {
                    const file = new File([item.compressed], `image_${item.id}.webp`, { type: 'image/webp' });
                    formData.append('file', file);
                    formData.append('type', 'post');
                } else if (item.type === 'video') {
                    formData.append('file', item.file);
                    formData.append('type', 'post');
                }

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                const data = await res.json();

                if (data.success) {
                    if (item.type === 'image') {
                        imageUrls.push(data.data.url);
                    } else {
                        videoUrl = data.data.url;

                        // Upload video thumbnail
                        if (item.thumbnail) {
                            const thumbnailFormData = new FormData();
                            const thumbnailFile = new File([item.thumbnail], `thumb_${item.id}.webp`, { type: 'image/webp' });
                            thumbnailFormData.append('file', thumbnailFile);
                            thumbnailFormData.append('type', 'post');

                            const thumbRes = await fetch('/api/upload', {
                                method: 'POST',
                                body: thumbnailFormData,
                            });
                            const thumbData = await thumbRes.json();
                            if (thumbData.success) {
                                videoThumbnailUrl = thumbData.data.url;
                            }
                        }
                    }

                    setMediaItems(prev => prev.map(m =>
                        m.id === item.id ? { ...m, uploaded: true, uploading: false, url: data.data.url } : m
                    ));
                } else {
                    setMediaItems(prev => prev.map(m =>
                        m.id === item.id ? { ...m, uploading: false, error: data.error } : m
                    ));
                    return { success: false, imageUrls: [] };
                }
            } catch (err) {
                console.error('Upload error:', err);
                setMediaItems(prev => prev.map(m =>
                    m.id === item.id ? { ...m, uploading: false, error: 'Upload failed' } : m
                ));
                return { success: false, imageUrls: [] };
            }
        }

        onMediaChange(imageUrls, videoUrl, videoThumbnailUrl);
        return { success: true, imageUrls, videoUrl, videoThumbnail: videoThumbnailUrl };
    };

    const clearAll = () => {
        mediaItems.forEach(item => URL.revokeObjectURL(item.preview));
        setMediaItems([]);
        setError(null);
        onMediaChange([]);
    };

    const hasVideo = mediaItems.some(m => m.type === 'video');
    const canAddMore = !hasVideo && mediaItems.length < maxImages;

    return (
        <div className={styles.container}>
            {mediaItems.length === 0 ? (
                <div
                    className={`${styles.dropzone} ${disabled ? styles.disabled : ''}`}
                    onClick={() => !disabled && fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <div className={styles.dropzoneContent}>
                        <span className={styles.icon}>📷</span>
                        <span className={styles.text}>
                            {isProcessing ? 'Processing...' : 'Add photos or video'}
                        </span>
                        <span className={styles.hint}>
                            Drop files here or click to browse
                        </span>
                    </div>
                </div>
            ) : (
                <div className={styles.preview}>
                    <div className={styles.previewGrid}>
                        {mediaItems.map(item => (
                            <div key={item.id} className={styles.previewItem}>
                                {item.type === 'image' ? (
                                    <img src={item.preview} alt="" className={styles.previewImage} />
                                ) : (
                                    <div className={styles.videoPreview}>
                                        <video src={item.preview} className={styles.previewVideo} />
                                        <div className={styles.videoBadge}>
                                            🎬 {item.duration ? formatDuration(item.duration) : ''}
                                        </div>
                                    </div>
                                )}
                                {item.uploading && (
                                    <div className={styles.uploadingOverlay}>
                                        <div className={styles.spinner}></div>
                                    </div>
                                )}
                                {item.uploaded && (
                                    <div className={styles.uploadedBadge}>✓</div>
                                )}
                                {item.error && (
                                    <div className={styles.errorBadge} title={item.error}>⚠️</div>
                                )}
                                <button
                                    type="button"
                                    className={styles.removeBtn}
                                    onClick={() => removeItem(item.id)}
                                    disabled={item.uploading}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {canAddMore && (
                            <button
                                type="button"
                                className={styles.addMoreBtn}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                            >
                                <span>+</span>
                                <span className={styles.addMoreText}>Add</span>
                            </button>
                        )}
                    </div>
                    {mediaItems.length > 0 && (
                        <button type="button" className={styles.clearBtn} onClick={clearAll}>
                            Clear all
                        </button>
                    )}
                </div>
            )}

            {error && <p className={styles.error}>{error}</p>}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                multiple
                onChange={handleFileInputChange}
                className={styles.hiddenInput}
                disabled={disabled}
            />
        </div>
    );
}

// Export the upload function for use in parent component
export type { MediaItem };
export { MediaUpload };
