'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

const RECORD_TYPES = [
    { value: 'VACCINATION', label: 'Vaccination', icon: '💉', description: 'Vaccines and immunizations' },
    { value: 'MEDICATION', label: 'Medication', icon: '💊', description: 'Daily, weekly, or monthly meds' },
    { value: 'VET_VISIT', label: 'Vet Visit', icon: '🏥', description: 'Check-ups and appointments' },
    { value: 'WEIGHT', label: 'Weight', icon: '⚖️', description: 'Weight tracking' },
    { value: 'CONDITION', label: 'Condition', icon: '🩺', description: 'Health conditions' },
    { value: 'OTHER', label: 'Other', icon: '📋', description: 'Other records' },
]

const FREQUENCIES = [
    { value: '', label: 'One-time' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'YEARLY', label: 'Yearly' },
]

interface Props {
    params: Promise<{ id: string }>
}

export default function AddHealthRecordPage({ params }: Props) {
    const { id: dogId } = use(params)
    const router = useRouter()
    const [dogName, setDogName] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const [type, setType] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [dueDate, setDueDate] = useState('')
    const [frequency, setFrequency] = useState('')
    const [dosage, setDosage] = useState('')
    const [vetClinic, setVetClinic] = useState('')
    const [notes, setNotes] = useState('')
    const [isCompleted, setIsCompleted] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const [authRes, dogRes] = await Promise.all([
                    fetch('/api/auth/me'),
                    fetch(`/api/dogs/${dogId}`),
                ])

                const authData = await authRes.json()
                const dogData = await dogRes.json()

                if (!authData.success) {
                    router.push('/login')
                    return
                }

                if (!dogData.success) {
                    router.push('/dogs')
                    return
                }

                setDogName(dogData.data.name)
            } catch {
                router.push('/dogs')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [dogId, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!type) {
            setError('Please select a record type')
            return
        }

        if (!title.trim()) {
            setError('Title is required')
            return
        }

        if (!date) {
            setError('Date is required')
            return
        }

        setIsSubmitting(true)

        try {
            const res = await fetch(`/api/dogs/${dogId}/health`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    title: title.trim(),
                    description: description.trim() || null,
                    date,
                    dueDate: dueDate || null,
                    frequency: frequency || null,
                    dosage: dosage.trim() || null,
                    vetClinic: vetClinic.trim() || null,
                    notes: notes.trim() || null,
                    isCompleted,
                }),
            })

            const data = await res.json()

            if (data.success) {
                router.push(`/dogs/${dogId}`)
            } else {
                setError(data.error || 'Failed to create record')
            }
        } catch (err) {
            console.error('Submit error:', err)
            setError('Failed to create record. Please try again.')
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
                <Link href="/dogs">My Dogs</Link>
                <span className={styles.separator}>/</span>
                <Link href={`/dogs/${dogId}`}>{dogName}</Link>
                <span className={styles.separator}>/</span>
                <span>Add Health Record</span>
            </nav>

            <div className={`card ${styles.formCard}`}>
                <h1>Add Health Record</h1>
                <p className={styles.subtitle}>
                    Track {dogName}&apos;s health records and set reminders
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    {/* Record Type Selection */}
                    <div className={styles.typeSection}>
                        <label className="input-label">Record Type</label>
                        <div className={styles.typeGrid}>
                            {RECORD_TYPES.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setType(t.value)}
                                    className={`${styles.typeOption} ${type === t.value ? styles.selected : ''}`}
                                >
                                    <span className={styles.typeIcon}>{t.icon}</span>
                                    <span className={styles.typeLabel}>{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="title" className="input-label">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={type === 'VACCINATION' ? 'e.g., Rabies Vaccine' :
                                type === 'MEDICATION' ? 'e.g., Heartworm Prevention' :
                                    type === 'VET_VISIT' ? 'e.g., Annual checkup' : 'Enter title'}
                            className="input"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="description" className="input-label">Description (optional)</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Additional details..."
                            className={`input ${styles.textarea}`}
                            rows={3}
                        />
                    </div>

                    {/* Date Fields */}
                    <div className={styles.dateRow}>
                        <div className="input-group">
                            <label htmlFor="date" className="input-label">Date</label>
                            <input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="input"
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="dueDate" className="input-label">Next Due Date (optional)</label>
                            <input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="input"
                            />
                        </div>
                    </div>

                    {/* Medication-specific fields */}
                    {(type === 'MEDICATION' || type === 'VACCINATION') && (
                        <div className={styles.dateRow}>
                            <div className="input-group">
                                <label htmlFor="frequency" className="input-label">Frequency</label>
                                <select
                                    id="frequency"
                                    value={frequency}
                                    onChange={(e) => setFrequency(e.target.value)}
                                    className="input"
                                >
                                    {FREQUENCIES.map(f => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label htmlFor="dosage" className="input-label">Dosage (optional)</label>
                                <input
                                    id="dosage"
                                    type="text"
                                    value={dosage}
                                    onChange={(e) => setDosage(e.target.value)}
                                    placeholder="e.g., 10mg once daily"
                                    className="input"
                                />
                            </div>
                        </div>
                    )}

                    {/* Vet Visit specific */}
                    {type === 'VET_VISIT' && (
                        <div className="input-group">
                            <label htmlFor="vetClinic" className="input-label">Vet Clinic (optional)</label>
                            <input
                                id="vetClinic"
                                type="text"
                                value={vetClinic}
                                onChange={(e) => setVetClinic(e.target.value)}
                                placeholder="Name of the vet clinic"
                                className="input"
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="notes" className="input-label">Notes (optional)</label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional notes..."
                            className={`input ${styles.textarea}`}
                            rows={2}
                        />
                    </div>

                    <div className={styles.completedToggle}>
                        <label className={styles.toggle}>
                            <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={(e) => setIsCompleted(e.target.checked)}
                            />
                            <span className={styles.toggleSlider}></span>
                            <span>✓ Mark as completed</span>
                        </label>
                    </div>

                    <div className={styles.actions}>
                        <Link href={`/dogs/${dogId}`} className="btn btn-ghost">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save Record'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
