'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface User {
    id: string
    name: string
    avatar: string | null
}

interface RSVP {
    id: string
    status: string
    dogsCount: number
    user: User
}

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
    requiresTicket: boolean
    ticketUrl: string | null
    imageUrl: string | null
    isCancelled: boolean
    creator: User
    rsvps: RSVP[]
    rsvpCounts: {
        going: number
        interested: number
        maybe: number
    }
    userRsvp: { status: string; dogsCount: number } | null
}

interface CurrentUser {
    id: string
}

interface Props {
    params: Promise<{ id: string }>
}

const CATEGORY_ICONS: Record<string, string> = {
    MEETUP: '🐕',
    TRAINING: '🎓',
    COMPETITION: '🏆',
    CHARITY: '❤️',
    SOCIAL: '🎉',
    OTHER: '📅',
}

export default function EventDetailPage({ params }: Props) {
    const { id } = use(params)
    const router = useRouter()
    const [event, setEvent] = useState<Event | null>(null)
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [rsvpLoading, setRsvpLoading] = useState(false)
    const [dogsCount, setDogsCount] = useState(1)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventRes, authRes] = await Promise.all([
                    fetch(`/api/events/${id}`),
                    fetch('/api/auth/me'),
                ])

                const eventData = await eventRes.json()
                const authData = await authRes.json()

                if (eventData.success) {
                    setEvent(eventData.data)
                    if (eventData.data.userRsvp) {
                        setDogsCount(eventData.data.userRsvp.dogsCount)
                    }
                } else {
                    router.push('/events')
                    return
                }

                if (authData.success) {
                    setCurrentUser({ id: authData.data.id })
                }
            } catch (error) {
                console.error('Failed to fetch event:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [id, router])

    const isCreator = currentUser && event?.creator.id === currentUser.id
    const isPastEvent = event && new Date(event.date) < new Date()
    const isFull = event?.capacity && event.rsvpCounts.going >= event.capacity

    const handleRSVP = async (status: string) => {
        if (!currentUser) {
            router.push('/login')
            return
        }

        setRsvpLoading(true)
        try {
            const res = await fetch(`/api/events/${id}/rsvp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, dogsCount }),
            })

            const data = await res.json()
            if (data.success && event) {
                setEvent({
                    ...event,
                    userRsvp: { status, dogsCount },
                    rsvpCounts: data.data.rsvpCounts,
                })
            }
        } catch (error) {
            console.error('RSVP error:', error)
        } finally {
            setRsvpLoading(false)
        }
    }

    const handleCancelRSVP = async () => {
        if (!currentUser) return

        setRsvpLoading(true)
        try {
            const res = await fetch(`/api/events/${id}/rsvp`, { method: 'DELETE' })
            const data = await res.json()
            if (data.success && event) {
                setEvent({
                    ...event,
                    userRsvp: null,
                    rsvpCounts: data.data.rsvpCounts,
                })
            }
        } catch (error) {
            console.error('Cancel RSVP error:', error)
        } finally {
            setRsvpLoading(false)
        }
    }

    const handleCancelEvent = async () => {
        if (!confirm('Are you sure you want to cancel this event?')) return

        try {
            await fetch(`/api/events/${id}`, { method: 'DELETE' })
            router.push('/events')
        } catch (error) {
            console.error('Cancel event error:', error)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading event...</p>
            </div>
        )
    }

    if (!event) {
        return (
            <div className={styles.notFound}>
                <h2>Event not found</h2>
                <Link href="/events" className="btn btn-primary">Back to Events</Link>
            </div>
        )
    }

    const goingUsers = event.rsvps.filter(r => r.status === 'GOING')

    return (
        <div className={styles.page}>
            <nav className={styles.breadcrumb}>
                <Link href="/events">Events</Link>
                <span className={styles.separator}>/</span>
                <span>{event.category}</span>
            </nav>

            {event.isCancelled && (
                <div className={styles.cancelledBanner}>
                    ⚠️ This event has been cancelled
                </div>
            )}

            <div className={styles.layout}>
                {/* Main Content */}
                <article className={`card ${styles.mainCard}`}>
                    <div className={styles.eventHeader}>
                        <span className={styles.categoryBadge}>
                            {CATEGORY_ICONS[event.category]} {event.category}
                        </span>
                        {event.isOffLeash && (
                            <span className={styles.offLeashBadge}>🦮 Off-leash</span>
                        )}
                        {isPastEvent && (
                            <span className={styles.pastBadge}>Past Event</span>
                        )}
                    </div>

                    <h1 className={styles.title}>{event.title}</h1>

                    <div className={styles.meta}>
                        <div className={styles.metaItem}>
                            <span className={styles.metaIcon}>📅</span>
                            <div>
                                <span className={styles.metaLabel}>Date</span>
                                <span className={styles.metaValue}>{formatDate(event.date)}</span>
                            </div>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaIcon}>🕐</span>
                            <div>
                                <span className={styles.metaLabel}>Time</span>
                                <span className={styles.metaValue}>
                                    {formatTime(event.date)}
                                    {event.endDate && ` - ${formatTime(event.endDate)}`}
                                </span>
                            </div>
                        </div>
                        <div className={styles.metaItem}>
                            <span className={styles.metaIcon}>📍</span>
                            <div>
                                <span className={styles.metaLabel}>Location</span>
                                <span className={styles.metaValue}>{event.location}</span>
                                {event.address && (
                                    <span className={styles.metaAddress}>{event.address}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles.description}>
                        {event.description.split('\n').map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                    </div>

                    {event.requiresTicket && event.ticketUrl && (
                        <a
                            href={event.ticketUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`btn btn-outline ${styles.ticketBtn}`}
                        >
                            🎟️ Get Tickets
                        </a>
                    )}

                    {/* Organizer */}
                    <div className={styles.organizer}>
                        <span className={styles.organizerLabel}>Organized by</span>
                        <div className={styles.organizerInfo}>
                            <div className={`avatar avatar-sm ${styles.avatar}`}>
                                {event.creator.avatar ? (
                                    <img src={event.creator.avatar} alt={event.creator.name} />
                                ) : (
                                    event.creator.name[0]?.toUpperCase()
                                )}
                            </div>
                            <span>{event.creator.name}</span>
                        </div>
                    </div>

                    {/* Creator Actions */}
                    {isCreator && !event.isCancelled && (
                        <div className={styles.creatorActions}>
                            <button
                                onClick={handleCancelEvent}
                                className="btn btn-ghost"
                                style={{ color: 'var(--color-error)' }}
                            >
                                Cancel Event
                            </button>
                        </div>
                    )}
                </article>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    {/* RSVP Card */}
                    <div className={`card ${styles.rsvpCard}`}>
                        <h3>Are you going?</h3>

                        <div className={styles.rsvpCounts}>
                            <div className={styles.rsvpCount}>
                                <span className={styles.rsvpNumber}>{event.rsvpCounts.going}</span>
                                <span>Going</span>
                            </div>
                            <div className={styles.rsvpCount}>
                                <span className={styles.rsvpNumber}>{event.rsvpCounts.interested}</span>
                                <span>Interested</span>
                            </div>
                        </div>

                        {event.capacity && (
                            <div className={styles.capacityInfo}>
                                {isFull ? (
                                    <span className={styles.full}>🔴 Event is full</span>
                                ) : (
                                    <span>{event.capacity - event.rsvpCounts.going} spots left</span>
                                )}
                            </div>
                        )}

                        {!event.isCancelled && !isPastEvent && (
                            <>
                                {currentUser ? (
                                    <>
                                        <div className={styles.dogsSelect}>
                                            <label>Dogs attending:</label>
                                            <select
                                                value={dogsCount}
                                                onChange={(e) => setDogsCount(parseInt(e.target.value))}
                                                className="input"
                                            >
                                                {[1, 2, 3, 4, 5].map(n => (
                                                    <option key={n} value={n}>{n} 🐕</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className={styles.rsvpButtons}>
                                            <button
                                                onClick={() => handleRSVP('GOING')}
                                                className={`btn ${event.userRsvp?.status === 'GOING' ? 'btn-primary' : 'btn-outline'}`}
                                                disabled={rsvpLoading || (isFull && event.userRsvp?.status !== 'GOING')}
                                            >
                                                ✓ Going
                                            </button>
                                            <button
                                                onClick={() => handleRSVP('INTERESTED')}
                                                className={`btn ${event.userRsvp?.status === 'INTERESTED' ? 'btn-primary' : 'btn-outline'}`}
                                                disabled={rsvpLoading}
                                            >
                                                ⭐ Interested
                                            </button>
                                        </div>

                                        {event.userRsvp && (
                                            <button
                                                onClick={handleCancelRSVP}
                                                className={`btn btn-ghost ${styles.cancelRsvp}`}
                                                disabled={rsvpLoading}
                                            >
                                                Cancel RSVP
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <Link href="/login" className="btn btn-primary">
                                        Login to RSVP
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* Attendees */}
                    {goingUsers.length > 0 && (
                        <div className={`card ${styles.attendeesCard}`}>
                            <h3>Attendees ({goingUsers.length})</h3>
                            <div className={styles.attendeesList}>
                                {goingUsers.slice(0, 10).map((rsvp) => (
                                    <div key={rsvp.id} className={styles.attendee}>
                                        <div className={`avatar avatar-sm ${styles.avatar}`}>
                                            {rsvp.user.avatar ? (
                                                <img src={rsvp.user.avatar} alt={rsvp.user.name} />
                                            ) : (
                                                rsvp.user.name[0]?.toUpperCase()
                                            )}
                                        </div>
                                        <span>{rsvp.user.name}</span>
                                        {rsvp.dogsCount > 1 && (
                                            <span className={styles.dogsCount}>+{rsvp.dogsCount} 🐕</span>
                                        )}
                                    </div>
                                ))}
                                {goingUsers.length > 10 && (
                                    <span className={styles.moreAttendees}>
                                        +{goingUsers.length - 10} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    )
}
