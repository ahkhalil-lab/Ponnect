'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
    providerCount: number;
}

interface Provider {
    id: string;
    businessName: string;
    slug: string;
    description: string;
    logo: string | null;
    coverPhoto: string | null;
    suburb: string;
    city: string;
    priceRange: string | null;
    averageRating: number;
    reviewCount: number;
    isVerified: boolean;
    isFeatured: boolean;
    isSaved: boolean;
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
}

export default function ServicesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [priceFilter, setPriceFilter] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState('relevance');

    // Fetch categories
    useEffect(() => {
        fetch('/api/services/categories')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setCategories(data.data);
                }
            })
            .catch(console.error);
    }, []);

    // Fetch providers
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedCategory) params.set('category', selectedCategory);
        if (searchQuery) params.set('search', searchQuery);
        if (priceFilter) params.set('priceRange', priceFilter);
        params.set('sortBy', sortBy);

        setLoading(true);
        fetch(`/api/services/providers?${params}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProviders(data.data);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [selectedCategory, searchQuery, priceFilter, sortBy]);

    const handleSave = async (providerId: string) => {
        try {
            const res = await fetch(`/api/services/providers/${providerId}/save`, {
                method: 'POST'
            });
            const data = await res.json();
            if (data.success) {
                setProviders(prev => prev.map(p =>
                    p.id === providerId ? { ...p, isSaved: data.data.isSaved } : p
                ));
            }
        } catch (error) {
            console.error('Failed to save provider:', error);
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={i <= rating ? styles.starFilled : styles.starEmpty}>
                    ★
                </span>
            );
        }
        return stars;
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Find Services</h1>
                    <p>Discover trusted local providers for your furry friend</p>
                </div>
                <Link href="/services/create" className={styles.listButton}>
                    + List Your Service
                </Link>
            </div>

            {/* Search Bar */}
            <div className={styles.searchSection}>
                <div className={styles.searchBar}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search providers, services, or suburbs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* Category Chips */}
            <div className={styles.categories}>
                <button
                    className={`${styles.categoryChip} ${!selectedCategory ? styles.categoryActive : ''}`}
                    onClick={() => setSelectedCategory(null)}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`${styles.categoryChip} ${selectedCategory === cat.slug ? styles.categoryActive : ''}`}
                        onClick={() => setSelectedCategory(cat.slug)}
                    >
                        <span>{cat.icon}</span> {cat.name}
                        {cat.providerCount > 0 && (
                            <span className={styles.categoryCount}>{cat.providerCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Filters Row */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>Price:</label>
                    <select
                        value={priceFilter || ''}
                        onChange={(e) => setPriceFilter(e.target.value || null)}
                        className={styles.filterSelect}
                    >
                        <option value="">Any</option>
                        <option value="$">$ Budget</option>
                        <option value="$$">$$ Mid-range</option>
                        <option value="$$$">$$$ Premium</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>Sort:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="relevance">Relevance</option>
                        <option value="rating">Highest Rated</option>
                        <option value="reviews">Most Reviews</option>
                        <option value="newest">Newest</option>
                    </select>
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Finding providers...</p>
                </div>
            ) : providers.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🐕</div>
                    <h3>No providers found</h3>
                    <p>
                        {selectedCategory
                            ? 'Try selecting a different category or clearing filters'
                            : 'Be the first to list your service!'}
                    </p>
                    <Link href="/services/create" className={styles.ctaButton}>
                        List Your Service
                    </Link>
                </div>
            ) : (
                <div className={styles.providersGrid}>
                    {providers.map(provider => (
                        <div key={provider.id} className={`${styles.providerCard} ${provider.isFeatured ? styles.featured : ''}`}>
                            {provider.isFeatured && (
                                <div className={styles.featuredBadge}>⭐ Featured</div>
                            )}
                            <Link href={`/services/${provider.slug}`} className={styles.cardLink}>
                                <div className={styles.cardCover}>
                                    {provider.coverPhoto ? (
                                        <Image
                                            src={provider.coverPhoto}
                                            alt={provider.businessName}
                                            fill
                                            className={styles.coverImage}
                                        />
                                    ) : (
                                        <div className={styles.coverPlaceholder}>
                                            <span>{provider.category.icon}</span>
                                        </div>
                                    )}
                                    {provider.isVerified && (
                                        <div className={styles.verifiedBadge}>✓ Verified</div>
                                    )}
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.cardLogo}>
                                            {provider.logo ? (
                                                <Image
                                                    src={provider.logo}
                                                    alt=""
                                                    width={48}
                                                    height={48}
                                                    className={styles.logoImage}
                                                />
                                            ) : (
                                                <span>{provider.category.icon}</span>
                                            )}
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <h3>{provider.businessName}</h3>
                                            <p className={styles.cardLocation}>
                                                📍 {provider.suburb}, {provider.city}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={styles.cardDescription}>
                                        {provider.description.slice(0, 100)}
                                        {provider.description.length > 100 ? '...' : ''}
                                    </p>
                                    <div className={styles.cardMeta}>
                                        <div className={styles.cardRating}>
                                            {renderStars(Math.round(provider.averageRating))}
                                            <span className={styles.ratingText}>
                                                {provider.averageRating.toFixed(1)} ({provider.reviewCount})
                                            </span>
                                        </div>
                                        {provider.priceRange && (
                                            <span className={styles.priceRange}>{provider.priceRange}</span>
                                        )}
                                    </div>
                                    <div className={styles.cardCategory}>
                                        <span>{provider.category.icon}</span> {provider.category.name}
                                    </div>
                                </div>
                            </Link>
                            <button
                                className={`${styles.saveButton} ${provider.isSaved ? styles.saved : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSave(provider.id);
                                }}
                                title={provider.isSaved ? 'Unsave' : 'Save'}
                            >
                                {provider.isSaved ? '❤️' : '🤍'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
