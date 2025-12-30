'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

interface User {
    id: string
    name: string
    email: string
    role: string
    isVerified: boolean
    location: string | null
    avatar: string | null
    createdAt: string
    _count: { posts: number; dogs: number }
}

const ROLES = ['USER', 'EXPERT', 'MODERATOR', 'ADMIN']

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })

    useEffect(() => {
        fetchUsers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleFilter])

    const fetchUsers = async (page = 1) => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams({ page: String(page) })
            if (search) params.set('search', search)
            if (roleFilter !== 'all') params.set('role', roleFilter)

            const res = await fetch(`/api/admin/users?${params}`)
            const data = await res.json()

            if (data.success) {
                setUsers(data.data)
                setPagination(data.pagination)
            }
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchUsers(1)
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole }),
            })

            if (res.ok) {
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, role: newRole } : u
                ))
            }
        } catch (error) {
            console.error('Failed to update role:', error)
        }
    }

    const handleVerifyToggle = async (userId: string, isVerified: boolean) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, isVerified: !isVerified }),
            })

            if (res.ok) {
                setUsers(prev => prev.map(u =>
                    u.id === userId ? { ...u, isVerified: !isVerified } : u
                ))
            }
        } catch (error) {
            console.error('Failed to toggle verification:', error)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'ADMIN': return styles.badgeAdmin
            case 'MODERATOR': return styles.badgeModerator
            case 'EXPERT': return styles.badgeExpert
            default: return styles.badgeUser
        }
    }

    return (
        <div className={styles.page}>
            <h1>User Management</h1>
            <p className={styles.subtitle}>Manage platform users and their roles</p>

            {/* Search and Filters */}
            <div className={styles.toolbar}>
                <form onSubmit={handleSearch} className={styles.searchForm}>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="input"
                    />
                    <button type="submit" className="btn btn-primary">
                        Search
                    </button>
                </form>

                <div className={styles.filters}>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="input"
                    >
                        <option value="all">All Roles</option>
                        {ROLES.map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Users Table */}
            {isLoading ? (
                <div className={styles.loading}>
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className={`card ${styles.tableCard}`}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Stats</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className={styles.userCell}>
                                            <div className={styles.avatar}>
                                                {user.avatar ? (
                                                    <img src={user.avatar} alt={user.name} />
                                                ) : (
                                                    user.name[0]?.toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <strong>{user.name}</strong>
                                                <span>{user.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${getRoleBadgeClass(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        {user.isVerified ? (
                                            <span className={styles.verified}>✓ Verified</span>
                                        ) : (
                                            <span className={styles.unverified}>Unverified</span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.stats}>
                                            {user._count.posts} posts · {user._count.dogs} dogs
                                        </span>
                                    </td>
                                    <td>{formatDate(user.createdAt)}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className={styles.roleSelect}
                                            >
                                                {ROLES.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                            {user.role === 'EXPERT' && (
                                                <button
                                                    onClick={() => handleVerifyToggle(user.id, user.isVerified)}
                                                    className={`btn btn-sm ${user.isVerified ? 'btn-ghost' : 'btn-primary'}`}
                                                >
                                                    {user.isVerified ? 'Unverify' : 'Verify'}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className={styles.pagination}>
                        <span>Showing {users.length} of {pagination.total} users</span>
                        <div className={styles.paginationButtons}>
                            <button
                                onClick={() => fetchUsers(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="btn btn-sm btn-ghost"
                            >
                                ← Previous
                            </button>
                            <span>Page {pagination.page} of {pagination.pages}</span>
                            <button
                                onClick={() => fetchUsers(pagination.page + 1)}
                                disabled={pagination.page >= pagination.pages}
                                className="btn btn-sm btn-ghost"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
