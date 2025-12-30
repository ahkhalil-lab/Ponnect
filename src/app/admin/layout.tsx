'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import styles from './layout.module.css'

interface User {
    id: string
    name: string
    role: string
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const res = await fetch('/api/auth/me')
                const data = await res.json()

                if (data.success && data.data.role === 'ADMIN') {
                    setUser(data.data)
                } else {
                    router.push('/dashboard')
                }
            } catch {
                router.push('/login')
            } finally {
                setIsLoading(false)
            }
        }

        checkAdmin()
    }, [router])

    const navItems = [
        { href: '/admin', label: 'Overview', icon: '📊' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
        { href: '/admin/moderation', label: 'Moderation', icon: '🛡️' },
        { href: '/admin/experts', label: 'Experts', icon: '⭐' },
        { href: '/admin/alerts', label: 'Alerts', icon: '🚨' },
    ]

    const mainNavItems = [
        { href: '/dashboard', label: 'Main Dashboard', icon: '🏠' },
        { href: '/forums', label: 'Forums', icon: '💬' },
        { href: '/events', label: 'Events', icon: '📅' },
    ]

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Checking admin access...</p>
            </div>
        )
    }

    if (!user) return null

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/admin" className={styles.logo}>
                        <span>🛡️</span>
                        <span>Admin Panel</span>
                    </Link>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <div className={styles.navDivider}>
                        <span>Quick Navigation</span>
                    </div>

                    {mainNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={styles.navItem}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.adminUser}>
                        <span className={styles.adminAvatar}>👤</span>
                        <span className={styles.adminName}>{user.name}</span>
                    </div>
                </div>
            </aside>

            <main className={styles.main}>
                {children}
            </main>
        </div>
    )
}
