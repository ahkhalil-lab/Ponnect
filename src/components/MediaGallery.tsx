'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './MediaGallery.module.css';

interface MediaGalleryProps {
    images?: string[];
    video?: string;
    videoThumbnail?: string;
    onDoubleTap?: () => void;
    showLikeAnimation?: boolean;
}

export default function MediaGallery({
    images = [],
    video,
    videoThumbnail,
    onDoubleTap,
    showLikeAnimation = false,
}: MediaGalleryProps) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastTapRef = useRef<number>(0);
    const heartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle double tap to like
    const handleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            // Double tap detected
            handleDoubleTap();
        }
        lastTapRef.current = now;
    };

    const handleDoubleTap = () => {
        if (onDoubleTap) {
            onDoubleTap();
            setShowHeart(true);

            if (heartTimeoutRef.current) {
                clearTimeout(heartTimeoutRef.current);
            }

            heartTimeoutRef.current = setTimeout(() => {
                setShowHeart(false);
            }, 1000);
        }
    };

    useEffect(() => {
        if (showLikeAnimation) {
            setShowHeart(true);
            heartTimeoutRef.current = setTimeout(() => {
                setShowHeart(false);
            }, 1000);
        }

        return () => {
            if (heartTimeoutRef.current) {
                clearTimeout(heartTimeoutRef.current);
            }
        };
    }, [showLikeAnimation]);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const nextImage = () => {
        setLightboxIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const toggleVideoPlay = () => {
        if (videoRef.current) {
            if (isVideoPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsVideoPlaying(!isVideoPlaying);
        }
    };

    // Video post
    if (video) {
        return (
            <div className={styles.videoContainer} onClick={handleTap}>
                <video
                    ref={videoRef}
                    src={video}
                    poster={videoThumbnail}
                    className={styles.video}
                    controls={isVideoPlaying}
                    playsInline
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleVideoPlay();
                    }}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                    onEnded={() => setIsVideoPlaying(false)}
                />
                {!isVideoPlaying && (
                    <button className={styles.playButton} onClick={toggleVideoPlay}>
                        ▶
                    </button>
                )}
                {showHeart && (
                    <div className={styles.heartAnimation}>
                        ❤️
                    </div>
                )}
            </div>
        );
    }

    // No media
    if (!images || images.length === 0) {
        return null;
    }

    // Single image
    if (images.length === 1) {
        return (
            <>
                <div className={styles.singleImage} onClick={handleTap}>
                    <img
                        src={images[0]}
                        alt=""
                        onClick={(e) => {
                            e.stopPropagation();
                            openLightbox(0);
                        }}
                    />
                    {showHeart && (
                        <div className={styles.heartAnimation}>
                            ❤️
                        </div>
                    )}
                </div>
                {lightboxOpen && (
                    <Lightbox
                        images={images}
                        currentIndex={lightboxIndex}
                        onClose={closeLightbox}
                        onNext={nextImage}
                        onPrev={prevImage}
                    />
                )}
            </>
        );
    }

    // 2 images
    if (images.length === 2) {
        return (
            <>
                <div className={styles.twoImages} onClick={handleTap}>
                    {images.map((img, idx) => (
                        <img
                            key={idx}
                            src={img}
                            alt=""
                            onClick={(e) => {
                                e.stopPropagation();
                                openLightbox(idx);
                            }}
                        />
                    ))}
                    {showHeart && (
                        <div className={styles.heartAnimation}>
                            ❤️
                        </div>
                    )}
                </div>
                {lightboxOpen && (
                    <Lightbox
                        images={images}
                        currentIndex={lightboxIndex}
                        onClose={closeLightbox}
                        onNext={nextImage}
                        onPrev={prevImage}
                    />
                )}
            </>
        );
    }

    // 3+ images - grid layout
    return (
        <>
            <div className={styles.multiImages} onClick={handleTap}>
                {images.slice(0, 4).map((img, idx) => (
                    <div
                        key={idx}
                        className={`${styles.gridItem} ${idx === 0 ? styles.gridItemLarge : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            openLightbox(idx);
                        }}
                    >
                        <img src={img} alt="" />
                        {idx === 3 && images.length > 4 && (
                            <div className={styles.moreOverlay}>
                                +{images.length - 4}
                            </div>
                        )}
                    </div>
                ))}
                {showHeart && (
                    <div className={styles.heartAnimation}>
                        ❤️
                    </div>
                )}
            </div>
            {lightboxOpen && (
                <Lightbox
                    images={images}
                    currentIndex={lightboxIndex}
                    onClose={closeLightbox}
                    onNext={nextImage}
                    onPrev={prevImage}
                />
            )}
        </>
    );
}

// Lightbox component for full-screen viewing
interface LightboxProps {
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

function Lightbox({ images, currentIndex, onClose, onNext, onPrev }: LightboxProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
        };

        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [onClose, onNext, onPrev]);

    return (
        <div className={styles.lightbox} onClick={onClose}>
            <button className={styles.closeBtn} onClick={onClose}>×</button>

            {images.length > 1 && (
                <>
                    <button
                        className={`${styles.navBtn} ${styles.prevBtn}`}
                        onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    >
                        ‹
                    </button>
                    <button
                        className={`${styles.navBtn} ${styles.nextBtn}`}
                        onClick={(e) => { e.stopPropagation(); onNext(); }}
                    >
                        ›
                    </button>
                </>
            )}

            <img
                src={images[currentIndex]}
                alt=""
                className={styles.lightboxImage}
                onClick={(e) => e.stopPropagation()}
            />

            {images.length > 1 && (
                <div className={styles.indicators}>
                    {images.map((_, idx) => (
                        <span
                            key={idx}
                            className={`${styles.indicator} ${idx === currentIndex ? styles.indicatorActive : ''}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
