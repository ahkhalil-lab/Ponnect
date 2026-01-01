'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import styles from './page.module.css'

interface DashboardStats {
    dogCount: number
    forumPosts: number
    upcomingEvents: number
    healthReminders: number
}

interface RegionalAlert {
    id: string
    title: string
    message: string
    severity: string
    type: string
    region: string
}

export default function DashboardPage() {
    const searchParams = useSearchParams()
    const isWelcome = searchParams.get('welcome') === 'true'
    const [showWelcome, setShowWelcome] = useState(isWelcome)
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState<DashboardStats>({
        dogCount: 0,
        forumPosts: 0,
        upcomingEvents: 0,
        healthReminders: 0,
    })
    const [alerts, setAlerts] = useState<RegionalAlert[]>([])

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/dashboard/stats')
                const data = await response.json()

                if (data.success) {
                    setStats(data.data.stats)
                    setAlerts(data.data.alerts)
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    useEffect(() => {
        if (showWelcome) {
            const timer = setTimeout(() => setShowWelcome(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [showWelcome])

    return (
        <div className={styles.dashboard}>
            {showWelcome && (
                <div className={styles.welcomeBanner}>
                    <div>
                        <h2>🎉 Welcome to Ponnect!</h2>
                        <p>Your account is ready. Start by adding your first dog!</p>
                    </div>
                    <button onClick={() => setShowWelcome(false)} className={styles.closeBanner}>×</button>
                </div>
            )}

            <div className={styles.header}>
                <h1>Dashboard</h1>
                <Link href="/dogs/new" className="btn btn-primary">
                    + Add a Dog
                </Link>
            </div>

            {/* Regional Alerts */}
            {alerts.length > 0 && (
                <div className={styles.alertsSection}>
                    {alerts.map((alert) => (
                        <div key={alert.id} className={`${styles.alert} ${styles[`alert${alert.severity}`]}`}>
                            <span className={styles.alertIcon}>
                                {alert.type === 'TICK' ? '🪲' : alert.type === 'FLOOD' ? '🌊' : alert.type === 'FIRE' ? '🔥' : '⚠️'}
                            </span>
                            <div className={styles.alertContent}>
                                <strong>{alert.title}</strong>
                                <p>{alert.message}</p>
                                {alert.region && <span className={styles.alertRegion}>{alert.region}</span>}
                            </div>
                            <Link href="/alerts" className={styles.alertLink}>Learn more →</Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={`card ${styles.statCard}`}>
                    <div className={styles.statIcon}>🐕</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>
                            {isLoading ? '–' : stats.dogCount}
                        </span>
                        <span className={styles.statLabel}>My Dogs</span>
                    </div>
                    <Link href="/dogs" className={styles.statLink}>Manage →</Link>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <div className={styles.statIcon}>💬</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>
                            {isLoading ? '–' : stats.forumPosts}
                        </span>
                        <span className={styles.statLabel}>Forum Posts</span>
                    </div>
                    <Link href="/forums" className={styles.statLink}>View →</Link>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <div className={styles.statIcon}>📅</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>
                            {isLoading ? '–' : stats.upcomingEvents}
                        </span>
                        <span className={styles.statLabel}>Upcoming Events</span>
                    </div>
                    <Link href="/events" className={styles.statLink}>Browse →</Link>
                </div>
                <div className={`card ${styles.statCard}`}>
                    <div className={styles.statIcon}>🏥</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statNumber}>
                            {isLoading ? '–' : stats.healthReminders}
                        </span>
                        <span className={styles.statLabel}>Health Reminders</span>
                    </div>
                    <Link href="/dogs" className={styles.statLink}>Check →</Link>
                </div>
            </div>

            {/* Quick Actions */}
            <section className={styles.section}>
                <h2>Quick Actions</h2>
                <div className={styles.actionsGrid}>
                    <Link href="/dogs/new" className={`card card-interactive ${styles.actionCard}`}>
                        <span className={styles.actionIcon}>🐕</span>
                        <div>
                            <strong>Add Your Dog</strong>
                            <p>Create a profile for your furry friend</p>
                        </div>
                    </Link>
                    <Link href="/forums" className={`card card-interactive ${styles.actionCard}`}>
                        <span className={styles.actionIcon}>💬</span>
                        <div>
                            <strong>Browse Forums</strong>
                            <p>Join discussions with other dog parents</p>
                        </div>
                    </Link>
                    <Link href="/events" className={`card card-interactive ${styles.actionCard}`}>
                        <span className={styles.actionIcon}>📅</span>
                        <div>
                            <strong>Find Events</strong>
                            <p>Discover local meetups and activities</p>
                        </div>
                    </Link>
                    <Link href="/expert-qa" className={`card card-interactive ${styles.actionCard}`}>
                        <span className={styles.actionIcon}>🩺</span>
                        <div>
                            <strong>Ask an Expert</strong>
                            <p>Get advice from verified professionals</p>
                        </div>
                    </Link>
                </div>
            </section>

            {/* Getting Started */}
            {!isLoading && stats.dogCount === 0 && (
                <section className={styles.section}>
                    <div className={`card ${styles.gettingStarted}`}>
                        <div className={styles.gettingStartedContent}>
                            <h2>Getting Started</h2>
                            <p>Complete these steps to get the most out of Ponnect:</p>
                            <ol className={styles.checklist}>
                                <li className={styles.incomplete}>
                                    <span>Add your first dog profile</span>
                                    <Link href="/dogs/new" className="btn btn-sm btn-primary">Add Dog</Link>
                                </li>
                                <li className={styles.incomplete}>
                                    <span>Complete your profile</span>
                                    <Link href="/profile/edit" className="btn btn-sm btn-secondary">Edit Profile</Link>
                                </li>
                                <li className={styles.incomplete}>
                                    <span>Introduce yourself in the forums</span>
                                    <Link href="/forums" className="btn btn-sm btn-secondary">Go to Forums</Link>
                                </li>
                                <li className={styles.incomplete}>
                                    <span>RSVP to a local event</span>
                                    <Link href="/events" className="btn btn-sm btn-secondary">Browse Events</Link>
                                </li>
                            </ol>
                        </div>
                        <div className={styles.gettingStartedImage}>
                            <span className={styles.bigEmoji}>🐾</span>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
