'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

const CATEGORIES = [
    { value: 'MEETUP', label: 'Meetup', icon: '🐕', description: 'Casual dog park gatherings' },
    { value: 'TRAINING', label: 'Training', icon: '🎓', description: 'Training classes and workshops' },
    { value: 'COMPETITION', label: 'Competition', icon: '🏆', description: 'Dog shows and contests' },
    { value: 'CHARITY', label: 'Charity', icon: '❤️', description: 'Fundraisers and charity walks' },
    { value: 'SOCIAL', label: 'Social', icon: '🎉', description: 'Parties and social gatherings' },
    { value: 'OTHER', label: 'Other', icon: '📅', description: 'Other dog-friendly events' },
]

export default function CreateEventPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('')
    const [date, setDate] = useState('')
    const [time, setTime] = useState('')
    const [endDate, setEndDate] = useState('')
    const [endTime, setEndTime] = useState('')
    const [location, setLocation] = useState('')
    const [address, setAddress] = useState('')
    const [capacity, setCapacity] = useState('')
    const [isOffLeash, setIsOffLeash] = useState(false)
    const [requiresTicket, setRequiresTicket] = useState(false)
    const [ticketUrl, setTicketUrl] = useState('')

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me')
                const data = await res.json()
                if (!data.success) {
                    router.push('/login?redirect=/events/create')
                    return
                }
            } catch {
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!title.trim()) {
            setError('Title is required')
            return
        }

        if (!description.trim()) {
            setError('Description is required')
            return
        }

        if (!category) {
            setError('Please select a category')
            return
        }

        if (!date || !time) {
            setError('Date and time are required')
            return
        }

        if (!location.trim()) {
            setError('Location is required')
            return
        }

        setIsSubmitting(true)

        try {
            const eventDate = new Date(`${date}T${time}`)
            const eventEndDate = endDate && endTime ? new Date(`${endDate}T${endTime}`) : null

            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    category,
                    date: eventDate.toISOString(),
                    endDate: eventEndDate?.toISOString(),
                    location: location.trim(),
                    address: address.trim() || null,
                    capacity: capacity ? parseInt(capacity) : null,
                    isOffLeash,
                    requiresTicket,
                    ticketUrl: ticketUrl.trim() || null,
                }),
            })

            const data = await res.json()

            if (data.success) {
                router.push(`/events/${data.data.id}`)
            } else {
                setError(data.error || 'Failed to create event')
            }
        } catch (err) {
            console.error('Submit error:', err)
            setError('Failed to create event. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <nav className={styles.breadcrumb}>
                <Link href="/events">Events</Link>
                <span className={styles.separator}>/</span>
                <span>Create Event</span>
            </nav>

            <div className={`card ${styles.formCard}`}>
                <h1>Create an Event</h1>
                <p className={styles.subtitle}>
                    Organize a dog-friendly event for the community
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    {/* Category Selection */}
                    <div className={styles.categorySection}>
                        <label className="input-label">Event Type</label>
                        <div className={styles.categoryGrid}>
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`${styles.categoryOption} ${category === cat.value ? styles.selected : ''}`}
                                >
                                    <span className={styles.categoryIcon}>{cat.icon}</span>
                                    <span className={styles.categoryLabel}>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="title" className="input-label">Event Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Give your event a catchy title"
                            className="input"
                            maxLength={100}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="description" className="input-label">Description</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this event about? Include any important details for attendees..."
                            className={`input ${styles.textarea}`}
                            rows={5}
                        />
                    </div>

                    {/* Date/Time */}
                    <div className={styles.dateRow}>
                        <div className="input-group">
                            <label htmlFor="date" className="input-label">Start Date</label>
                            <input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="input"
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="time" className="input-label">Start Time</label>
                            <input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="input"
                            />
                        </div>
                    </div>

                    <div className={styles.dateRow}>
                        <div className="input-group">
                            <label htmlFor="endDate" className="input-label">End Date (optional)</label>
                            <input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input"
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="endTime" className="input-label">End Time</label>
                            <input
                                id="endTime"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="input"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="input-group">
                        <label htmlFor="location" className="input-label">Location Name</label>
                        <input
                            id="location"
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g., Brisbane Dog Park"
                            className="input"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="address" className="input-label">Address (optional)</label>
                        <input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Full address for directions"
                            className="input"
                        />
                    </div>

                    {/* Options */}
                    <div className={styles.optionsRow}>
                        <div className="input-group">
                            <label htmlFor="capacity" className="input-label">Capacity (optional)</label>
                            <input
                                id="capacity"
                                type="number"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                placeholder="Max attendees"
                                className="input"
                                min="1"
                            />
                        </div>

                        <div className={styles.toggleGroup}>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={isOffLeash}
                                    onChange={(e) => setIsOffLeash(e.target.checked)}
                                />
                                <span className={styles.toggleSlider}></span>
                                <span>🦮 Off-leash friendly</span>
                            </label>
                        </div>
                    </div>

                    {/* Ticketing */}
                    <div className={styles.ticketSection}>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={requiresTicket}
                                onChange={(e) => setRequiresTicket(e.target.checked)}
                            />
                            <span className={styles.toggleSlider}></span>
                            <span>🎟️ Requires ticket/registration</span>
                        </label>
                        {requiresTicket && (
                            <input
                                type="url"
                                value={ticketUrl}
                                onChange={(e) => setTicketUrl(e.target.value)}
                                placeholder="Ticket/registration URL"
                                className="input"
                            />
                        )}
                    </div>

                    <div className={styles.actions}>
                        <Link href="/events" className="btn btn-ghost">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
