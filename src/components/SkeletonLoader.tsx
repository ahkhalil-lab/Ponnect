'use client'

import styles from './SkeletonLoader.module.css'

interface SkeletonProps {
    className?: string
}

export function SkeletonText({ className = '' }: SkeletonProps) {
    return <div className={`${styles.skeleton} ${styles.skeletonText} ${className}`} />
}

export function SkeletonTitle({ className = '' }: SkeletonProps) {
    return <div className={`${styles.skeleton} ${styles.skeletonTitle} ${className}`} />
}

export function SkeletonAvatar({ className = '', size = 'md' }: SkeletonProps & { size?: 'sm' | 'md' | 'lg' }) {
    return <div className={`${styles.skeleton} ${styles.skeletonAvatar} ${styles[`avatar${size.charAt(0).toUpperCase() + size.slice(1)}`]} ${className}`} />
}

export function SkeletonButton({ className = '' }: SkeletonProps) {
    return <div className={`${styles.skeleton} ${styles.skeletonButton} ${className}`} />
}

export function SkeletonImage({ className = '' }: SkeletonProps) {
    return <div className={`${styles.skeleton} ${styles.skeletonImage} ${className}`} />
}

interface SkeletonCardProps {
    hasImage?: boolean
    hasAvatar?: boolean
    lines?: number
    className?: string
}

export function SkeletonCard({ hasImage = false, hasAvatar = false, lines = 3, className = '' }: SkeletonCardProps) {
    return (
        <div className={`${styles.skeletonCard} ${className}`}>
            {hasImage && <SkeletonImage />}
            <div className={styles.skeletonCardContent}>
                {hasAvatar && (
                    <div className={styles.skeletonCardHeader}>
                        <SkeletonAvatar size="sm" />
                        <div className={styles.skeletonCardMeta}>
                            <SkeletonText className={styles.skeletonTextShort} />
                            <SkeletonText className={styles.skeletonTextXs} />
                        </div>
                    </div>
                )}
                <SkeletonTitle />
                {Array.from({ length: lines }).map((_, i) => (
                    <SkeletonText key={i} className={i === lines - 1 ? styles.skeletonTextShort : ''} />
                ))}
            </div>
        </div>
    )
}

interface SkeletonListProps {
    count?: number
    hasAvatar?: boolean
    className?: string
}

export function SkeletonList({ count = 5, hasAvatar = true, className = '' }: SkeletonListProps) {
    return (
        <div className={`${styles.skeletonList} ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={styles.skeletonListItem}>
                    {hasAvatar && <SkeletonAvatar size="md" />}
                    <div className={styles.skeletonListContent}>
                        <SkeletonText className={styles.skeletonTextShort} />
                        <SkeletonText className={styles.skeletonTextXs} />
                    </div>
                </div>
            ))}
        </div>
    )
}

// Pre-built skeleton layouts for common pages
export function ForumsSkeleton() {
    return (
        <div className={styles.skeletonPage}>
            <div className={styles.skeletonHeader}>
                <SkeletonTitle />
                <SkeletonButton />
            </div>
            <div className={styles.skeletonGrid}>
                {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} hasAvatar lines={2} />
                ))}
            </div>
        </div>
    )
}

export function EventsSkeleton() {
    return (
        <div className={styles.skeletonPage}>
            <div className={styles.skeletonHeader}>
                <SkeletonTitle />
                <SkeletonButton />
            </div>
            <div className={styles.skeletonGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} hasImage lines={2} />
                ))}
            </div>
        </div>
    )
}

export function ExpertQASkeleton() {
    return (
        <div className={styles.skeletonPage}>
            <div className={styles.skeletonHeader}>
                <SkeletonTitle />
                <div className={styles.skeletonTabs}>
                    <SkeletonButton />
                    <SkeletonButton />
                    <SkeletonButton />
                </div>
            </div>
            <SkeletonList count={5} hasAvatar />
        </div>
    )
}
