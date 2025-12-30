'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

interface NotificationSettings {
    forumReplies: boolean
    upvotes: boolean
    eventReminders: boolean
    healthReminders: boolean
    expertAnswers: boolean
    systemNotifications: boolean
    emailForumReplies: boolean
    emailEventReminders: boolean
    emailHealthReminders: boolean
}

export default function NotificationSettingsPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const [settings, setSettings] = useState<NotificationSettings>({
        forumReplies: true,
        upvotes: true,
        eventReminders: true,
        healthReminders: true,
        expertAnswers: true,
        systemNotifications: true,
        emailForumReplies: false,
        emailEventReminders: true,
        emailHealthReminders: true,
    })

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me')
                const data = await res.json()

                if (!data.success) {
                    router.push('/login')
                    return
                }

                // In a real app, you'd fetch user preferences here
                // For now, we'll use defaults
            } catch {
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        checkAuth()
    }, [router])

    const handleToggle = (key: keyof NotificationSettings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
        setSaved(false)
    }

    const handleSave = async () => {
        setIsSaving(true)
        // In a real app, you'd save to API here
        await new Promise(resolve => setTimeout(resolve, 500))
        setIsSaving(false)
        setSaved(true)
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading settings...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <nav className={styles.breadcrumb}>
                <Link href="/notifications">Notifications</Link>
                <span className={styles.separator}>/</span>
                <span>Settings</span>
            </nav>

            <div className={`card ${styles.settingsCard}`}>
                <h1>Notification Settings</h1>
                <p className={styles.subtitle}>
                    Manage how and when you receive notifications
                </p>

                <div className={styles.section}>
                    <h2>In-App Notifications</h2>
                    <p className={styles.sectionDesc}>
                        Choose which notifications appear in your notification center
                    </p>

                    <div className={styles.toggleList}>
                        <label className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleIcon}>💬</span>
                                <div>
                                    <strong>Forum Replies</strong>
                                    <p>When someone replies to your posts or comments</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('forumReplies')}
                                className={`${styles.toggle} ${settings.forumReplies ? styles.on : ''}`}
                            >
                                <span className={styles.toggleSlider}></span>
                            </button>
                        </label>

                        <label className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleIcon}>👍</span>
                                <div>
                                    <strong>Upvotes</strong>
                                    <p>When someone upvotes your posts or comments</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('upvotes')}
                                className={`${styles.toggle} ${settings.upvotes ? styles.on : ''}`}
                            >
                                <span className={styles.toggleSlider}></span>
                            </button>
                        </label>

                        <label className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleIcon}>📅</span>
                                <div>
                                    <strong>Event Reminders</strong>
                                    <p>Reminders for upcoming events you&apos;ve RSVP&apos;d to</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('eventReminders')}
                                className={`${styles.toggle} ${settings.eventReminders ? styles.on : ''}`}
                            >
                                <span className={styles.toggleSlider}></span>
                            </button>
                        </label>

                        <label className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleIcon}>🏥</span>
                                <div>
                                    <strong>Health Reminders</strong>
                                    <p>Vaccination, medication, and vet visit reminders</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('healthReminders')}
                                className={`${styles.toggle} ${settings.healthReminders ? styles.on : ''}`}
                            >
                                <span className={styles.toggleSlider}></span>
                            </button>
                        </label>

                        <label className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleIcon}>🩺</span>
                                <div>
                                    <strong>Expert Answers</strong>
                                    <p>When an expert answers your question</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('expertAnswers')}
                                className={`${styles.toggle} ${settings.expertAnswers ? styles.on : ''}`}
                            >
                                <span className={styles.toggleSlider}></span>
                            </button>
                        </label>

                        <label className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleIcon}>⚙️</span>
                                <div>
                                    <strong>System Notifications</strong>
                                    <p>Important updates and announcements</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('systemNotifications')}
                                className={`${styles.toggle} ${settings.systemNotifications ? styles.on : ''}`}
                            >
                                <span className={styles.toggleSlider}></span>
                            </button>
                        </label>
                    </div>
                </div>

                <div className={styles.section}>
                    <h2>Email Notifications</h2>
                    <p className={styles.sectionDesc}>
                        Choose which notifications to receive via email
                    </p>

                    <div className={styles.toggleList}>
                        <label className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleIcon}>💬</span>
                                <div>
                                    <strong>Forum Replies</strong>
                                    <p>Email when someone replies to your posts</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('emailForumReplies')}
                                className={`${styles.toggle} ${settings.emailForumReplies ? styles.on : ''}`}
                            >
                                <span className={styles.toggleSlider}></span>
                            </button>
                        </label>

                        <label className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleIcon}>📅</span>
                                <div>
                                    <strong>Event Reminders</strong>
                                    <p>Email reminders for upcoming events</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('emailEventReminders')}
                                className={`${styles.toggle} ${settings.emailEventReminders ? styles.on : ''}`}
                            >
                                <span className={styles.toggleSlider}></span>
                            </button>
                        </label>

                        <label className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleIcon}>🏥</span>
                                <div>
                                    <strong>Health Reminders</strong>
                                    <p>Email reminders for pet health tasks</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle('emailHealthReminders')}
                                className={`${styles.toggle} ${settings.emailHealthReminders ? styles.on : ''}`}
                            >
                                <span className={styles.toggleSlider}></span>
                            </button>
                        </label>
                    </div>
                </div>

                <div className={styles.actions}>
                    {saved && (
                        <span className={styles.savedMessage}>✓ Settings saved</span>
                    )}
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    )
}
