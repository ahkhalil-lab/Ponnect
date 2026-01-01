'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './page.module.css'

interface Guide {
    id: string
    title: string
    description: string
    icon: string
    category: string
    readTime: string
    href: string
}

const guides: Guide[] = [
    {
        id: '1',
        title: 'Puppy Training 101',
        description: 'Essential tips for training your new puppy, from basic commands to potty training.',
        icon: '🐕',
        category: 'Training',
        readTime: '8 min read',
        href: '/forums?category=training'
    },
    {
        id: '2',
        title: 'Tick Prevention in Queensland',
        description: 'Learn how to protect your dog from paralysis ticks, spotting symptoms, and prevention methods.',
        icon: '🪲',
        category: 'Health',
        readTime: '6 min read',
        href: '/alerts'
    },
    {
        id: '3',
        title: 'Dog Nutrition Basics',
        description: 'Understanding your dog\'s nutritional needs, choosing the right food, and feeding schedules.',
        icon: '🥗',
        category: 'Nutrition',
        readTime: '10 min read',
        href: '/expert-qa?category=nutrition'
    },
    {
        id: '4',
        title: 'Socializing Your Dog',
        description: 'Tips for helping your dog become comfortable around other dogs and people.',
        icon: '🐾',
        category: 'Behavior',
        readTime: '7 min read',
        href: '/events'
    },
    {
        id: '5',
        title: 'Summer Heat Safety',
        description: 'Keeping your dog cool and safe during hot Australian summers.',
        icon: '☀️',
        category: 'Health',
        readTime: '5 min read',
        href: '/alerts'
    },
    {
        id: '6',
        title: 'Finding a Good Vet',
        description: 'What to look for when choosing a veterinarian for your furry friend.',
        icon: '🏥',
        category: 'Health',
        readTime: '6 min read',
        href: '/services?category=veterinary'
    },
]

export default function GuidesPage() {
    const [filter, setFilter] = useState<string>('All')
    const categories = ['All', 'Training', 'Health', 'Nutrition', 'Behavior']

    const filteredGuides = filter === 'All'
        ? guides
        : guides.filter(g => g.category === filter)

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Pet Guides</h1>
                    <p className={styles.subtitle}>Helpful tips and guides for caring for your furry friend</p>
                </div>
            </div>

            <div className={styles.filters}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`${styles.filterChip} ${filter === cat ? styles.filterActive : ''}`}
                        onClick={() => setFilter(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className={styles.guidesGrid}>
                {filteredGuides.map(guide => (
                    <Link key={guide.id} href={guide.href} className={styles.guideCard}>
                        <div className={styles.guideIcon}>{guide.icon}</div>
                        <div className={styles.guideContent}>
                            <span className={styles.guideCategory}>{guide.category}</span>
                            <h3 className={styles.guideTitle}>{guide.title}</h3>
                            <p className={styles.guideDescription}>{guide.description}</p>
                            <span className={styles.guideReadTime}>{guide.readTime}</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div className={styles.ctaSection}>
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                    <h2 style={{ marginBottom: 'var(--space-4)' }}>Need Expert Advice?</h2>
                    <p style={{ marginBottom: 'var(--space-6)' }}>
                        Our verified experts can answer your specific questions about dog health, training, and more.
                    </p>
                    <Link href="/expert-qa" className="btn btn-primary">
                        Ask an Expert
                    </Link>
                </div>
            </div>
        </div>
    )
}
