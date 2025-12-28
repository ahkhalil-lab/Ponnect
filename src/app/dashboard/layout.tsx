'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import styles from './layout.module.css'

interface User {
    id: string
    name: string
    email: string
    avatar?: string | null
    role: string
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('/api/auth/me')
                const data = await res.json()

                if (data.success) {
                    setUser(data.data)
                } else {
                    router.push('/login')
                }
            } catch {
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        fetchUser()
    }, [router])

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/')
    }

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { href: '/forums', label: 'Forums', icon: '💬' },
        { href: '/events', label: 'Events', icon: '📅' },
        { href: '/expert-qa', label: 'Expert Q&A', icon: '🩺' },
        { href: '/dogs', label: 'My Dogs', icon: '🐕' },
        { href: '/notifications', label: 'Notifications', icon: '🔔' },
    ]

    if (isLoading) {
        return (
            <div className={styles.loadingWrapper}>
                <div className="spinner spinner-lg"></div>
                <p>Loading your dashboard...</p>
            </div>
        )
    }

    return (
        <div className={styles.layout}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <button
                    className={styles.menuButton}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <Link href="/" className={styles.logo}>
                    <span className="paw-icon"></span>
                    <span className={styles.logoText}>Ponnect</span>
                </Link>
                <div className={styles.mobileUser}>
                    <div className={`avatar avatar-sm ${styles.userAvatar}`}>
                        {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            user?.name?.[0]?.toUpperCase() || 'U'
                        )}
                    </div>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.logo}>
                        <span className="paw-icon"></span>
                        <span className={styles.logoText}>Ponnect</span>
                    </Link>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <Link href="/profile" className={styles.userCard}>
                        <div className={`avatar avatar-md ${styles.userAvatar}`}>
                            {user?.avatar ? (
                                <img src={user.avatar} alt={user.name} />
                            ) : (
                                user?.name?.[0]?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.name}</span>
                            <span className={styles.userEmail}>{user?.email}</span>
                        </div>
                    </Link>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className={styles.main}>
                {children}
            </main>
        </div>
    )
}
