'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

interface ExternalAlert {
    id: string
    title: string
    message: string
    region: string
    severity: string
    type: string
    activeFrom: string
    activeUntil: string | null
    source: string
    confidence: string
    guidance: string[] | null
}

interface UserDog {
    id: string
    name: string
    breed: string
    photo: string | null
    size: string
    coatType: string | null
}

const REGIONS = [
    { value: 'all', label: 'All Regions' },
    { value: 'QLD', label: 'Queensland' },
    { value: 'NSW', label: 'New South Wales' },
    { value: 'VIC', label: 'Victoria' },
    { value: 'SA', label: 'South Australia' },
    { value: 'WA', label: 'Western Australia' },
    { value: 'TAS', label: 'Tasmania' },
    { value: 'NT', label: 'Northern Territory' },
    { value: 'ACT', label: 'Australian Capital Territory' },
]

const TYPES = [
    { value: 'all', label: 'All Types', icon: '📢' },
    { value: 'TICK', label: 'Tick Warnings', icon: '🕷️' },
    { value: 'SNAKE', label: 'Snake Alerts', icon: '🐍' },
    { value: 'HEATWAVE', label: 'Heatwave', icon: '🌡️' },
    { value: 'DISEASE', label: 'Disease Outbreak', icon: '🦠' },
    { value: 'OTHER', label: 'Other', icon: '⚠️' },
]

export default function AlertsPage() {
    const router = useRouter()
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [externalAlerts, setExternalAlerts] = useState<ExternalAlert[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [regionFilter, setRegionFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)
    const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set())
    const [userDogs, setUserDogs] = useState<UserDog[]>([])
    const [userLocation, setUserLocation] = useState<string | null>(null)
    const [savedAlerts, setSavedAlerts] = useState<Set<string>>(new Set())

    useEffect(() => {
        const checkAuth = async () => {
            const res = await fetch('/api/auth/me')
            const data = await res.json()
            if (!data.success) {
                router.push('/login')
                return
            }

            // Get user's location from their profile
            if (data.data?.location) {
                const locationParts = data.data.location.split(',')
                const state = locationParts[locationParts.length - 1]?.trim()
                if (state && REGIONS.some(r => r.value === state)) {
                    setUserLocation(state)
                    setRegionFilter(state)
                }
            }
        }

        const fetchUserDogs = async () => {
            try {
                const res = await fetch('/api/dogs')
                const data = await res.json()
                if (data.success) {
                    setUserDogs(data.data)
                }
            } catch (err) {
                console.error('Failed to fetch dogs:', err)
            }
        }

        checkAuth()
        fetchUserDogs()
    }, [router])

    useEffect(() => {
        fetchAlerts()
        fetchExternalAlerts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [regionFilter, typeFilter])

    const fetchAlerts = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (regionFilter !== 'all') params.set('region', regionFilter)
            if (typeFilter !== 'all') params.set('type', typeFilter)

            const res = await fetch(`/api/alerts?${params}`)
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

    const fetchExternalAlerts = async () => {
        try {
            const params = new URLSearchParams()
            if (regionFilter !== 'all') params.set('region', regionFilter)

            const res = await fetch(`/api/alerts/external?${params}`)
            const data = await res.json()

            if (data.success) {
                // Filter by type if needed
                let filteredAlerts = data.data
                if (typeFilter !== 'all') {
                    filteredAlerts = data.data.filter((a: ExternalAlert) => a.type === typeFilter)
                }
                setExternalAlerts(filteredAlerts)
                setLastUpdated(data.lastUpdated)
            }
        } catch (error) {
            console.error('Failed to fetch external alerts:', error)
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        await fetchExternalAlerts()
        setIsRefreshing(false)
    }

    const getTypeIcon = (type: string) => {
        const found = TYPES.find(t => t.value === type)
        return found?.icon || '📢'
    }

    const getSeverityClass = (severity: string) => {
        switch (severity) {
            case 'EMERGENCY': return styles.severityEmergency
            case 'WARNING': return styles.severityWarning
            case 'WATCH': return styles.severityWatch
            case 'INFO': return styles.severityInfo
            default: return styles.severityInfo
        }
    }

    const getSeverityLabel = (severity: string) => {
        switch (severity) {
            case 'EMERGENCY': return '🔴 Emergency'
            case 'WARNING': return '🟠 Warning'
            case 'WATCH': return '🟡 Watch'
            case 'INFO': return '🟢 Info'
            default: return severity
        }
    }

    const toggleGuidance = (alertId: string) => {
        setExpandedAlerts(prev => {
            const next = new Set(prev)
            if (next.has(alertId)) {
                next.delete(alertId)
            } else {
                next.add(alertId)
            }
            return next
        })
    }

    const getDurationText = (activeFrom: string, activeUntil: string | null) => {
        const start = new Date(activeFrom)
        const now = new Date()
        const daysActive = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

        if (!activeUntil) {
            return daysActive > 0 ? `Active for ${daysActive} day${daysActive > 1 ? 's' : ''}` : 'Just started'
        }

        const end = new Date(activeUntil)
        if (end < now) return 'Expired'

        const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const handleSaveAlert = async (alertId: string) => {
        try {
            const res = await fetch(`/api/alerts/${alertId}/save`, {
                method: 'POST',
            })
            const data = await res.json()
            if (data.success) {
                setSavedAlerts(prev => {
                    const next = new Set(prev)
                    if (data.saved) {
                        next.add(alertId)
                    } else {
                        next.delete(alertId)
                    }
                    return next
                })
            }
        } catch (error) {
            console.error('Failed to save alert:', error)
        }
    }

    const handleShareAlert = async (alert: Alert | ExternalAlert) => {
        const shareData = {
            title: alert.title,
            text: `${alert.title}\n\n${alert.message}\n\nRegion: ${alert.region}`,
            url: window.location.href,
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err) {
                // User cancelled or error
                console.log('Share cancelled:', err)
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(`${shareData.title}\n\n${shareData.text}`)
                // Could add a toast notification here
            } catch (err) {
                console.error('Failed to copy:', err)
            }
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>🇦🇺 Regional Alerts</h1>
                    <p className={styles.subtitle}>
                        Stay informed about important alerts for dog owners in your area
                    </p>
                </div>
            </div>

            {/* Personalization Banner */}
            {userDogs.length > 0 && (
                <div className={styles.personalizationBanner}>
                    <span className={styles.personalizationIcon}>🔔</span>
                    <div className={styles.personalizationText}>
                        <strong>Alerts customised for your dogs</strong>
                        <p>
                            {userDogs.map(d => d.name).join(', ')}
                            {userLocation && ` in ${REGIONS.find(r => r.value === userLocation)?.label || userLocation}`}
                        </p>
                    </div>
                    <div className={styles.dogAvatars}>
                        {userDogs.slice(0, 3).map((dog) => (
                            dog.photo ? (
                                <img key={dog.id} src={dog.photo} alt={dog.name} className={styles.dogAvatar} />
                            ) : (
                                <span key={dog.id} className={styles.dogAvatar}>🐕</span>
                            )
                        ))}
                        {userDogs.length > 3 && (
                            <span className={styles.dogAvatar}>+{userDogs.length - 3}</span>
                        )}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className={styles.filters}>
                <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="input"
                >
                    {REGIONS.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>

                <div className={styles.typeFilters}>
                    {TYPES.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => setTypeFilter(type.value)}
                            className={`${styles.typeBtn} ${typeFilter === type.value ? styles.active : ''}`}
                        >
                            <span>{type.icon}</span>
                            <span className={styles.typeBtnLabel}>{type.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Alerts List */}
            {isLoading ? (
                <div className={styles.loading}>
                    <div className="spinner spinner-lg"></div>
                    <p>Loading alerts...</p>
                </div>
            ) : alerts.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <div className={styles.emptyIcon}>✓</div>
                    <h2>No Active Alerts</h2>
                    <p>There are no alerts for your selected filters.</p>
                </div>
            ) : (
                <div className={styles.alertsList}>
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`card ${styles.alertCard} ${getSeverityClass(alert.severity)}`}
                        >
                            <div className={styles.alertHeader}>
                                <span className={styles.alertType}>
                                    {getTypeIcon(alert.type)} {alert.type}
                                </span>
                                <span className={`${styles.alertBadge} ${getSeverityClass(alert.severity)}`}>
                                    {alert.severity}
                                </span>
                            </div>
                            <h3>{alert.title}</h3>
                            <p className={styles.alertMessage}>{alert.message}</p>
                            <div className={styles.alertMeta}>
                                <span className={styles.alertRegion}>📍 {alert.region}</span>
                                <span className={styles.alertDate}>
                                    Active from {formatDate(alert.activeFrom)}
                                    {alert.activeUntil && ` until ${formatDate(alert.activeUntil)}`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* External Weather Alerts */}
            <section className={styles.externalSection}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        🌡️ Live Weather Alerts
                        <span className={styles.liveIndicator}>Live</span>
                    </h2>
                    <button
                        onClick={handleRefresh}
                        className={`btn btn-ghost btn-sm ${styles.refreshBtn} ${isRefreshing ? styles.spinning : ''}`}
                        disabled={isRefreshing}
                    >
                        <span>{isRefreshing ? '⟳' : '↻'}</span>
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {externalAlerts.length === 0 ? (
                    <div className={`card ${styles.emptyState}`} style={{ padding: 'var(--space-6)' }}>
                        <p>No weather alerts for your selected region.</p>
                    </div>
                ) : (
                    <div className={styles.alertsList}>
                        {externalAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`card ${styles.alertCard} ${getSeverityClass(alert.severity)}`}
                            >
                                <div className={styles.alertHeader}>
                                    <span className={styles.alertType}>
                                        {getTypeIcon(alert.type)} {alert.type}
                                    </span>
                                    <span className={`${styles.confidenceBadge} ${alert.confidence?.toLowerCase()}`}>
                                        {alert.confidence === 'VERIFIED' ? '✓ Verified' : alert.confidence}
                                    </span>
                                    <span className={`${styles.alertBadge} ${getSeverityClass(alert.severity)}`}>
                                        {getSeverityLabel(alert.severity)}
                                    </span>
                                </div>
                                <h3>{alert.title}</h3>
                                <p className={styles.alertMessage}>{alert.message}</p>
                                <div className={styles.alertMeta}>
                                    <span className={styles.alertRegion}>📍 {alert.region}</span>
                                    <span className={styles.durationBadge}>
                                        ⏱ {getDurationText(alert.activeFrom, alert.activeUntil)}
                                    </span>
                                    <span className={styles.sourceBadge}>📡 {alert.source}</span>
                                </div>

                                {/* Expandable Guidance Section */}
                                {alert.guidance && alert.guidance.length > 0 && (
                                    <div className={styles.guidanceSection}>
                                        <button
                                            type="button"
                                            onClick={() => toggleGuidance(alert.id)}
                                            className={`${styles.guidanceToggle} ${expandedAlerts.has(alert.id) ? styles.open : ''}`}
                                        >
                                            <span>💡</span>
                                            <span>What should I do?</span>
                                            <span>▼</span>
                                        </button>
                                        {expandedAlerts.has(alert.id) && (
                                            <div className={styles.guidanceContent}>
                                                <ul className={styles.guidanceList}>
                                                    {alert.guidance.map((item, idx) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Save & Share Actions */}
                                <div className={styles.alertActions}>
                                    <button
                                        type="button"
                                        className={`${styles.alertActionBtn} ${savedAlerts.has(alert.id) ? styles.saved : ''}`}
                                        onClick={() => handleSaveAlert(alert.id)}
                                    >
                                        <span>{savedAlerts.has(alert.id) ? '★' : '☆'}</span>
                                        {savedAlerts.has(alert.id) ? 'Saved' : 'Save'}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.alertActionBtn}
                                        onClick={() => handleShareAlert(alert)}
                                    >
                                        <span>📤</span>
                                        Share
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className={styles.attribution}>
                    <span>☁️</span>
                    Weather data from <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>
                    {lastUpdated && ` • Updated ${new Date(lastUpdated).toLocaleTimeString('en-AU')}`}
                </div>
            </section>

            {/* Info Section */}
            <div className={`card ${styles.infoSection}`}>
                <h3>🐕 Keeping Your Dog Safe</h3>
                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>🕷️</span>
                        <div>
                            <strong>Paralysis Ticks</strong>
                            <p>Check your dog daily, especially after walks in bushland. Use tick prevention year-round in QLD and NSW coastal areas.</p>
                        </div>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>🐍</span>
                        <div>
                            <strong>Snake Safety</strong>
                            <p>Keep dogs on leash in snake-prone areas. If bitten, keep calm and get to a vet immediately.</p>
                        </div>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoIcon}>🌡️</span>
                        <div>
                            <strong>Heat Safety</strong>
                            <p>Never leave dogs in cars. Walk during cooler hours. Watch for signs of heat stroke.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
