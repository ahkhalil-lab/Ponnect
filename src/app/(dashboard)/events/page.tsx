'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './page.module.css'

interface Event {
    id: string
    title: string
    description: string
    category: string
    date: string
    endDate: string | null
    location: string
    address: string | null
    capacity: number | null
    isOffLeash: boolean
    imageUrl: string | null
    creator: {
        id: string
        name: string
        avatar: string | null
    }
    _count: {
        rsvps: number
    }
}

const CATEGORIES = [
    { value: 'all', label: 'All Events', icon: '📅' },
    { value: 'MEETUP', label: 'Meetups', icon: '🐕' },
    { value: 'TRAINING', label: 'Training', icon: '🎓' },
    { value: 'COMPETITION', label: 'Competitions', icon: '🏆' },
    { value: 'CHARITY', label: 'Charity', icon: '❤️' },
    { value: 'SOCIAL', label: 'Social', icon: '🎉' },
]

export default function EventsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [events, setEvents] = useState<Event[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [category, setCategory] = useState(searchParams.get('category') || 'all')
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const params = new URLSearchParams()
                if (category !== 'all') params.set('category', category)

                const [eventsRes, authRes] = await Promise.all([
                    fetch(`/api/events?${params}`),
                    fetch('/api/auth/me'),
                ])

                const eventsData = await eventsRes.json()
                const authData = await authRes.json()

                if (eventsData.success) {
                    setEvents(eventsData.data)
                }
                setIsAuthenticated(authData.success)
            } catch (error) {
                console.error('Failed to fetch events:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [category])

    const handleCategoryChange = (newCategory: string) => {
        setCategory(newCategory)
        const params = new URLSearchParams()
        if (newCategory !== 'all') params.set('category', newCategory)
        router.push(`/events?${params}`)
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('en-AU', { month: 'short' }),
            time: date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' }),
            full: date.toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }),
        }
    }

    const getCategoryIcon = (cat: string) => {
        const found = CATEGORIES.find(c => c.value === cat)
        return found?.icon || '📅'
    }

    // Group events by month for calendar view
    const eventsByMonth = events.reduce((acc, event) => {
        const date = new Date(event.date)
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`
        if (!acc[monthKey]) {
            acc[monthKey] = {
                label: date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }),
                events: [],
            }
        }
        acc[monthKey].events.push(event)
        return acc
    }, {} as Record<string, { label: string; events: Event[] }>)

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading events...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Events & Meetups</h1>
                    <p className={styles.subtitle}>
                        Find dog-friendly events near you
                    </p>
                </div>
                {isAuthenticated ? (
                    <Link href="/events/create" className="btn btn-primary">
                        + Create Event
                    </Link>
                ) : (
                    <Link href="/login" className="btn btn-outline">
                        Login to Create
                    </Link>
                )}
            </div>

            {/* Category Tabs */}
            <div className={styles.categoryTabs}>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => handleCategoryChange(cat.value)}
                        className={`${styles.categoryTab} ${category === cat.value ? styles.active : ''}`}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* View Toggle */}
            <div className={styles.controls}>
                <div className={styles.viewToggle}>
                    <button
                        className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setViewMode('list')}
                    >
                        📋 List
                    </button>
                    <button
                        className={`btn btn-sm ${viewMode === 'calendar' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setViewMode('calendar')}
                    >
                        📅 Calendar
                    </button>
                </div>
                <span className={styles.count}>
                    {events.length} event{events.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Events List */}
            {events.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <div className={styles.emptyIcon}>🐾</div>
                    <h2>No Events Yet</h2>
                    <p>Be the first to organize a dog-friendly event!</p>
                    {isAuthenticated && (
                        <Link href="/events/create" className="btn btn-primary">
                            Create Event
                        </Link>
                    )}
                </div>
            ) : viewMode === 'list' ? (
                <div className={styles.eventsList}>
                    {events.map((event) => {
                        const dateInfo = formatDate(event.date)
                        return (
                            <Link
                                key={event.id}
                                href={`/events/${event.id}`}
                                className={`card card-interactive ${styles.eventCard}`}
                            >
                                <div className={styles.eventDate}>
                                    <span className={styles.dateDay}>{dateInfo.day}</span>
                                    <span className={styles.dateMonth}>{dateInfo.month}</span>
                                </div>
                                <div className={styles.eventContent}>
                                    <div className={styles.eventHeader}>
                                        <span className={styles.categoryBadge}>
                                            {getCategoryIcon(event.category)} {event.category}
                                        </span>
                                        {event.isOffLeash && (
                                            <span className={styles.offLeashBadge}>🦮 Off-leash</span>
                                        )}
                                    </div>
                                    <h3 className={styles.eventTitle}>{event.title}</h3>
                                    <p className={styles.eventLocation}>📍 {event.location}</p>
                                    <p className={styles.eventTime}>🕐 {dateInfo.time}</p>
                                    <div className={styles.eventFooter}>
                                        <span className={styles.rsvpCount}>
                                            {event._count.rsvps} attending
                                        </span>
                                        {event.capacity && (
                                            <span className={styles.capacity}>
                                                {event.capacity} spots
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            ) : (
                <div className={styles.calendarView}>
                    {Object.entries(eventsByMonth).map(([key, { label, events: monthEvents }]) => (
                        <div key={key} className={styles.monthGroup}>
                            <h3 className={styles.monthLabel}>{label}</h3>
                            <div className={styles.monthEvents}>
                                {monthEvents.map((event) => {
                                    const dateInfo = formatDate(event.date)
                                    return (
                                        <Link
                                            key={event.id}
                                            href={`/events/${event.id}`}
                                            className={`card card-interactive ${styles.calendarEvent}`}
                                        >
                                            <span className={styles.calendarDate}>{dateInfo.day}</span>
                                            <div>
                                                <h4>{event.title}</h4>
                                                <p>{event.location}</p>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
