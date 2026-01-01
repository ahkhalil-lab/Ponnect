'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Provider {
    id: string;
    businessName: string;
    slug: string;
    description: string;
    logo: string | null;
    coverPhoto: string | null;
    photos: string[];
    suburb: string;
    city: string;
    state: string;
    postcode: string;
    serviceRadius: number;
    phone: string | null;
    email: string;
    website: string | null;
    bookingUrl: string | null;
    priceRange: string | null;
    dogSizes: string[];
    services: string[];
    averageRating: number;
    reviewCount: number;
    isVerified: boolean;
    isFeatured: boolean;
    isSaved: boolean;
    isOwner: boolean;
    category: {
        id: string;
        name: string;
        slug: string;
        icon: string;
    };
    user: {
        id: string;
        name: string;
        avatar: string | null;
    };
    reviews: Review[];
}

interface Review {
    id: string;
    rating: number;
    content: string;
    photos: string[];
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar: string | null;
    };
}

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(true);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewContent, setReviewContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sendingDM, setSendingDM] = useState(false);

    useEffect(() => {
        fetch(`/api/services/providers/${resolvedParams.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProvider(data.data);
                } else {
                    router.push('/services');
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [resolvedParams.id, router]);

    const handleSave = async () => {
        if (!provider) return;
        try {
            const res = await fetch(`/api/services/providers/${provider.id}/save`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                setProvider(prev => prev ? { ...prev, isSaved: data.data.isSaved } : null);
            }
        } catch (error) {
            console.error('Failed to save:', error);
        }
    };

    const handleContact = async (type: string) => {
        if (!provider) return;
        try {
            await fetch(`/api/services/providers/${provider.id}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });

            if (type === 'call' && provider.phone) {
                window.open(`tel:${provider.phone}`);
            } else if (type === 'website' && provider.website) {
                window.open(provider.website, '_blank');
            } else if (type === 'booking' && provider.bookingUrl) {
                window.open(provider.bookingUrl, '_blank');
            } else if (type === 'email') {
                window.open(`mailto:${provider.email}`);
            }
        } catch (error) {
            console.error('Contact error:', error);
        }
    };

    const handleSendDM = async () => {
        if (!provider || sendingDM || provider.isOwner) return;

        setSendingDM(true);
        try {
            // Log the contact action
            await fetch(`/api/services/providers/${provider.id}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'message' })
            });

            // Create or get existing conversation with provider owner
            const res = await fetch('/api/messages/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: provider.user.id,
                    message: `Hi! I'm interested in your ${provider.category.name.toLowerCase()} services at ${provider.businessName}.`
                })
            });
            const data = await res.json();

            if (data.success) {
                // Navigate to messages with start param for proper conversation opening
                router.push(`/messages?start=${provider.user.id}`);
            } else {
                alert(data.error || 'Failed to start conversation');
            }
        } catch (error) {
            console.error('DM error:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setSendingDM(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            alert('Link copied!');
        } catch {
            prompt('Share this link:', url);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!provider || submitting) return;

        setSubmitting(true);
        try {
            const res = await fetch(`/api/services/providers/${provider.id}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rating: reviewRating,
                    content: reviewContent
                })
            });
            const data = await res.json();

            if (data.success) {
                setProvider(prev => prev ? {
                    ...prev,
                    reviews: [data.data, ...prev.reviews],
                    reviewCount: prev.reviewCount + 1,
                    averageRating: (prev.averageRating * prev.reviewCount + reviewRating) / (prev.reviewCount + 1)
                } : null);
                setShowReviewForm(false);
                setReviewContent('');
                setReviewRating(5);
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Review error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating: number, interactive = false) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span
                    key={i}
                    className={i <= rating ? styles.starFilled : styles.starEmpty}
                    onClick={interactive ? () => setReviewRating(i) : undefined}
                    style={interactive ? { cursor: 'pointer' } : undefined}
                >
                    ★
                </span>
            );
        }
        return stars;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!provider) {
        return null;
    }

    const allPhotos = [provider.coverPhoto, ...provider.photos].filter(Boolean) as string[];

    return (
        <div className={styles.page}>
            {/* Back Link */}
            <Link href="/services" className={styles.backLink}>
                ← Back to Services
            </Link>

            {/* Hero Section */}
            <div className={styles.hero}>
                {allPhotos.length > 0 ? (
                    <div className={styles.gallery}>
                        <div className={styles.mainPhoto}>
                            <Image
                                src={allPhotos[activePhotoIndex]}
                                alt={provider.businessName}
                                fill
                                className={styles.heroImage}
                            />
                        </div>
                        {allPhotos.length > 1 && (
                            <div className={styles.thumbnails}>
                                {allPhotos.map((photo, i) => (
                                    <button
                                        key={i}
                                        className={`${styles.thumbnail} ${i === activePhotoIndex ? styles.active : ''}`}
                                        onClick={() => setActivePhotoIndex(i)}
                                    >
                                        <Image src={photo} alt="" fill />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.heroPlaceholder}>
                        <span>{provider.category.icon}</span>
                    </div>
                )}

                <div className={styles.heroActions}>
                    <button onClick={handleSave} className={`${styles.actionBtn} ${provider.isSaved ? styles.saved : ''}`}>
                        {provider.isSaved ? '❤️ Saved' : '🤍 Save'}
                    </button>
                    <button onClick={handleShare} className={styles.actionBtn}>
                        📤 Share
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className={styles.content}>
                <div className={styles.mainColumn}>
                    {/* Business Info */}
                    <div className={styles.businessInfo}>
                        <div className={styles.titleRow}>
                            <div className={styles.logo}>
                                {provider.logo ? (
                                    <Image src={provider.logo} alt="" width={64} height={64} />
                                ) : (
                                    <span>{provider.category.icon}</span>
                                )}
                            </div>
                            <div>
                                <h1>{provider.businessName}</h1>
                                <div className={styles.badges}>
                                    {provider.isVerified && (
                                        <span className={styles.verifiedBadge}>✓ Verified</span>
                                    )}
                                    {provider.isFeatured && (
                                        <span className={styles.featuredBadge}>⭐ Featured</span>
                                    )}
                                    <span className={styles.categoryBadge}>
                                        {provider.category.icon} {provider.category.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.ratingRow}>
                            <div className={styles.stars}>{renderStars(Math.round(provider.averageRating))}</div>
                            <span className={styles.ratingText}>
                                {provider.averageRating.toFixed(1)} ({provider.reviewCount} reviews)
                            </span>
                            {provider.priceRange && (
                                <span className={styles.price}>{provider.priceRange}</span>
                            )}
                        </div>

                        <p className={styles.location}>
                            📍 {provider.suburb}, {provider.city} {provider.state} {provider.postcode}
                            <span className={styles.radius}>• Services within {provider.serviceRadius}km</span>
                        </p>

                        <p className={styles.description}>{provider.description}</p>

                        {provider.dogSizes.length > 0 && (
                            <div className={styles.dogSizes}>
                                <strong>Dog sizes:</strong>
                                {provider.dogSizes.map(size => (
                                    <span key={size} className={styles.sizeTag}>{size}</span>
                                ))}
                            </div>
                        )}

                        {provider.services.length > 0 && (
                            <div className={styles.servicesList}>
                                <strong>Services offered:</strong>
                                <ul>
                                    {provider.services.map((service, i) => (
                                        <li key={i}>{service}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Reviews Section */}
                    <div className={styles.reviewsSection}>
                        <div className={styles.reviewsHeader}>
                            <h2>Reviews ({provider.reviewCount})</h2>
                            {!provider.isOwner && (
                                <button
                                    className={styles.writeReviewBtn}
                                    onClick={() => setShowReviewForm(!showReviewForm)}
                                >
                                    ✍️ Write a Review
                                </button>
                            )}
                        </div>

                        {showReviewForm && (
                            <form onSubmit={handleSubmitReview} className={styles.reviewForm}>
                                <div className={styles.ratingInput}>
                                    <span>Your rating:</span>
                                    <div className={styles.stars}>{renderStars(reviewRating, true)}</div>
                                </div>
                                <textarea
                                    value={reviewContent}
                                    onChange={(e) => setReviewContent(e.target.value)}
                                    placeholder="Share your experience..."
                                    className={styles.reviewTextarea}
                                    rows={4}
                                    required
                                    minLength={10}
                                />
                                <button type="submit" disabled={submitting} className={styles.submitBtn}>
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        )}

                        {provider.reviews.length === 0 ? (
                            <p className={styles.noReviews}>No reviews yet. Be the first!</p>
                        ) : (
                            <div className={styles.reviewsList}>
                                {provider.reviews.map(review => (
                                    <div key={review.id} className={styles.reviewCard}>
                                        <div className={styles.reviewHeader}>
                                            <div className={styles.reviewAuthor}>
                                                {review.user.avatar ? (
                                                    <Image
                                                        src={review.user.avatar}
                                                        alt=""
                                                        width={40}
                                                        height={40}
                                                        className={styles.reviewAvatar}
                                                    />
                                                ) : (
                                                    <div className={styles.reviewAvatarPlaceholder}>
                                                        {review.user.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <strong>{review.user.name}</strong>
                                                    <span className={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                                                </div>
                                            </div>
                                            <div className={styles.stars}>{renderStars(review.rating)}</div>
                                        </div>
                                        <p className={styles.reviewContent}>{review.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.contactCard}>
                        <h3>Contact</h3>

                        {provider.phone && (
                            <button
                                onClick={() => handleContact('call')}
                                className={styles.contactBtn}
                            >
                                📞 Call Now
                            </button>
                        )}

                        <button
                            onClick={() => handleContact('email')}
                            className={styles.contactBtn}
                        >
                            ✉️ Send Email
                        </button>

                        {!provider.isOwner && (
                            <button
                                onClick={handleSendDM}
                                disabled={sendingDM}
                                className={`${styles.contactBtn} ${styles.dmBtn}`}
                            >
                                {sendingDM ? '💬 Starting chat...' : '💬 Send Message'}
                            </button>
                        )}

                        {provider.website && (
                            <button
                                onClick={() => handleContact('website')}
                                className={`${styles.contactBtn} ${styles.secondary}`}
                            >
                                🌐 Visit Website
                            </button>
                        )}

                        {provider.bookingUrl && (
                            <button
                                onClick={() => handleContact('booking')}
                                className={`${styles.contactBtn} ${styles.primary}`}
                            >
                                📅 Book Now
                            </button>
                        )}
                    </div>

                    <div className={styles.ownerCard}>
                        <h4>Listed by</h4>
                        <div className={styles.owner}>
                            {provider.user.avatar ? (
                                <Image
                                    src={provider.user.avatar}
                                    alt=""
                                    width={40}
                                    height={40}
                                    className={styles.ownerAvatar}
                                />
                            ) : (
                                <div className={styles.ownerAvatarPlaceholder}>
                                    {provider.user.name.charAt(0)}
                                </div>
                            )}
                            <span>{provider.user.name}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
