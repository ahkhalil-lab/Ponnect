'use client';

import { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './ImageUpload.module.css';

interface ImageUploadProps {
    currentImage?: string | null;
    onUpload: (url: string) => void;
    type: 'avatar' | 'dog';
    entityId?: string;
    label?: string;
    size?: 'small' | 'medium' | 'large';
    aspectRatio?: number; // e.g., 1 for square, 16/9 for landscape
}

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export default function ImageUpload({
    currentImage,
    onUpload,
    type,
    entityId,
    label = 'Upload Photo',
    size = 'medium',
    aspectRatio = 1, // Default to square
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [error, setError] = useState<string | null>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const originalFileRef = useRef<File | null>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, aspectRatio));
    }, [aspectRatio]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a JPEG, PNG, WebP, or GIF image');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setError(null);
        originalFileRef.current = file;

        // Read file and show crop modal
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target?.result as string;
            setImageToCrop(imageData);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);

        // Reset file input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
        if (!imgRef.current || !completedCrop) return null;

        const image = imgRef.current;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        // Output size (max 800px for performance)
        const maxSize = 800;
        const outputWidth = Math.min(completedCrop.width * scaleX, maxSize);
        const outputHeight = Math.min(completedCrop.height * scaleY, maxSize);
        const scale = Math.min(maxSize / (completedCrop.width * scaleX), maxSize / (completedCrop.height * scaleY), 1);

        canvas.width = completedCrop.width * scaleX * scale;
        canvas.height = completedCrop.height * scaleY * scale;

        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => resolve(blob),
                'image/jpeg',
                0.9
            );
        });
    }, [completedCrop]);

    const handleCropComplete = async () => {
        if (!completedCrop || !originalFileRef.current) return;

        setIsUploading(true);
        setShowCropModal(false);

        try {
            const croppedBlob = await getCroppedImg();
            if (!croppedBlob) {
                setError('Failed to crop image');
                setIsUploading(false);
                return;
            }

            // Show preview immediately
            const previewUrl = URL.createObjectURL(croppedBlob);
            setPreview(previewUrl);

            // Create file from blob
            const croppedFile = new File(
                [croppedBlob],
                originalFileRef.current.name,
                { type: 'image/jpeg' }
            );

            // Upload file
            const formData = new FormData();
            formData.append('file', croppedFile);
            formData.append('type', type);
            if (entityId) {
                formData.append('entityId', entityId);
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                onUpload(data.data.url);
            } else {
                setError(data.error || 'Upload failed');
                setPreview(currentImage || null);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload image');
            setPreview(currentImage || null);
        } finally {
            setIsUploading(false);
            setImageToCrop(null);
        }
    };

    const handleCancelCrop = () => {
        setShowCropModal(false);
        setImageToCrop(null);
        setCrop(undefined);
        setCompletedCrop(undefined);
    };

    const sizeClass = styles[size];

    return (
        <div className={styles.container}>
            {label && <label className={styles.label}>{label}</label>}

            <div
                className={`${styles.uploadArea} ${sizeClass} ${isUploading ? styles.uploading : ''}`}
                onClick={handleClick}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Preview"
                        className={styles.preview}
                    />
                ) : (
                    <div className={styles.placeholder}>
                        <span className={styles.icon}>📷</span>
                        <span className={styles.text}>
                            {isUploading ? 'Uploading...' : 'Click to upload'}
                        </span>
                    </div>
                )}

                {isUploading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner}></div>
                    </div>
                )}

                <div className={styles.hoverOverlay}>
                    <span>📷 Change Photo</span>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className={styles.hiddenInput}
            />

            {error && <p className={styles.error}>{error}</p>}

            <p className={styles.hint}>JPEG, PNG, WebP or GIF. Max 5MB.</p>

            {/* Crop Modal */}
            {showCropModal && imageToCrop && (
                <div className={styles.modalOverlay} onClick={handleCancelCrop}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Crop Your Photo</h3>
                            <p>Drag to adjust the crop area</p>
                        </div>

                        <div className={styles.cropContainer}>
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={aspectRatio}
                                circularCrop={type === 'avatar'}
                            >
                                <img
                                    ref={imgRef}
                                    src={imageToCrop}
                                    alt="Crop preview"
                                    onLoad={onImageLoad}
                                    className={styles.cropImage}
                                />
                            </ReactCrop>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                type="button"
                                className={`btn btn-secondary ${styles.modalBtn}`}
                                onClick={handleCancelCrop}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className={`btn btn-primary ${styles.modalBtn}`}
                                onClick={handleCropComplete}
                                disabled={!completedCrop}
                            >
                                ✂️ Crop & Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
