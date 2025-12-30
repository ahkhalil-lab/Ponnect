'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

interface Alert {
    id: string
    title: string
    message: string
    region: string
    severity: string
    type: string
    activeFrom: string
    activeUntil: string | null
    isActive: boolean
}

const REGIONS = ['QLD', 'NSW', 'VIC', 'SA', 'WA', 'TAS', 'NT', 'ACT']
const TYPES = ['TICK', 'SNAKE', 'HEATWAVE', 'DISEASE', 'OTHER']
const SEVERITIES = ['INFO', 'WARNING', 'CRITICAL']

export default function AdminAlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        region: 'QLD',
        severity: 'INFO',
        type: 'OTHER',
        activeUntil: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchAlerts()
    }, [])

    const fetchAlerts = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/alerts?active=false')
            const data = await res.json()

            if (data.success) {
                setAlerts(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch alerts:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const res = await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    activeUntil: formData.activeUntil || null,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                setAlerts(prev => [data.data, ...prev])
                setShowForm(false)
                setFormData({
                    title: '',
                    message: '',
                    region: 'QLD',
                    severity: 'INFO',
                    type: 'OTHER',
                    activeUntil: '',
                })
            }
        } catch (error) {
            console.error('Failed to create alert:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggleActive = async (alert: Alert) => {
        try {
            const res = await fetch(`/api/alerts/${alert.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !alert.isActive }),
            })

            if (res.ok) {
                setAlerts(prev => prev.map(a =>
                    a.id === alert.id ? { ...a, isActive: !a.isActive } : a
                ))
            }
        } catch (error) {
            console.error('Failed to toggle alert:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this alert?')) return

        try {
            const res = await fetch(`/api/alerts/${id}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                setAlerts(prev => prev.filter(a => a.id !== id))
            }
        } catch (error) {
            console.error('Failed to delete alert:', error)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const getSeverityClass = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return styles.critical
            case 'WARNING': return styles.warning
            default: return styles.info
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Regional Alerts</h1>
                    <p className={styles.subtitle}>Manage alerts for dog owners across Australia</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                >
                    {showForm ? 'Cancel' : '+ New Alert'}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className={`card ${styles.formCard}`}>
                    <h2>Create New Alert</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Region</label>
                                <select
                                    value={formData.region}
                                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                                    className="input"
                                    required
                                >
                                    {REGIONS.map(r => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                    className="input"
                                    required
                                >
                                    {TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Severity</label>
                                <select
                                    value={formData.severity}
                                    onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                                    className="input"
                                    required
                                >
                                    {SEVERITIES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Title</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="input"
                                placeholder="e.g., Paralysis Tick Warning - South East QLD"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Message</label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                className="input"
                                rows={3}
                                placeholder="Detailed alert message..."
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Active Until (optional)</label>
                            <input
                                type="date"
                                value={formData.activeUntil}
                                onChange={(e) => setFormData(prev => ({ ...prev, activeUntil: e.target.value }))}
                                className="input"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Create Alert'}
                        </button>
                    </form>
                </div>
            )}

            {/* Alerts List */}
            {isLoading ? (
                <div className={styles.loading}>
                    <div className="spinner"></div>
                </div>
            ) : alerts.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <p>No alerts created yet. Click &quot;New Alert&quot; to create one.</p>
                </div>
            ) : (
                <div className={styles.alertsList}>
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`card ${styles.alertCard} ${!alert.isActive ? styles.inactive : ''}`}
                        >
                            <div className={styles.alertHeader}>
                                <div className={styles.alertBadges}>
                                    <span className={`${styles.badge} ${getSeverityClass(alert.severity)}`}>
                                        {alert.severity}
                                    </span>
                                    <span className={styles.typeBadge}>{alert.type}</span>
                                    <span className={styles.regionBadge}>📍 {alert.region}</span>
                                </div>
                                <span className={`${styles.statusBadge} ${alert.isActive ? styles.active : ''}`}>
                                    {alert.isActive ? '● Active' : '○ Inactive'}
                                </span>
                            </div>
                            <h3>{alert.title}</h3>
                            <p>{alert.message}</p>
                            <div className={styles.alertFooter}>
                                <span className={styles.alertDate}>
                                    Created {formatDate(alert.activeFrom)}
                                    {alert.activeUntil && ` • Expires ${formatDate(alert.activeUntil)}`}
                                </span>
                                <div className={styles.alertActions}>
                                    <button
                                        onClick={() => handleToggleActive(alert)}
                                        className="btn btn-sm btn-ghost"
                                    >
                                        {alert.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(alert.id)}
                                        className="btn btn-sm btn-ghost"
                                        style={{ color: 'var(--color-error)' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
