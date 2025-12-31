'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import styles from './page.module.css'

interface Dog {
    id: string
    name: string
    photo: string | null
    breed: string
    gender: string
    birthDate: string | null
}

interface RecentPost {
    id: string
    content: string
    images: string[]
    createdAt: string
    taggedDogs: {
        dog: {
            id: string
            name: string
            photo: string | null
        }
    }[]
    _count: {
        likes: number
        comments: number
    }
}

interface MemberProfile {
    id: string
    name: string
    avatar: string | null
    bio: string | null
    location: string | null
    role: string
    expertType: string | null
    credentials: string | null
    isVerified: boolean
    createdAt: string
    dogs: Dog[]
    isFollowing: boolean
    isCurrentUser: boolean
    followerCount: number
    followingCount: number
    recentPosts: RecentPost[]
    _count: {
        dogs: number
        posts: number
        socialPosts: number
    }
}

export default function CommunityMemberProfilePage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [member, setMember] = useState<MemberProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const res = await fetch(`/api/community/members/${id}`)
                const data = await res.json()

                if (data.success) {
                    setMember(data.data)
                    setIsFollowing(data.data.isFollowing)
                } else if (res.status === 401) {
                    router.push('/login')
                } else {
                    router.push('/community')
                }
            } catch {
                router.push('/community')
            } finally {
                setIsLoading(false)
            }
        }

        fetchMember()
    }, [id, router])

    const handleFollow = async () => {
        try {
            const res = await fetch(`/api/users/${id}/follow`, { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setIsFollowing(data.data.isFollowing)
            }
        } catch (error) {
            console.error('Failed to toggle follow:', error)
        }
    }

    const handleMessage = () => {
        router.push(`/messages?start=${id}`)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return formatDate(dateString)
    }

    const calculateAge = (birthDate: string | null) => {
        if (!birthDate) return null
        const birth = new Date(birthDate)
        const today = new Date()
        const years = today.getFullYear() - birth.getFullYear()
        const months = today.getMonth() - birth.getMonth()
        if (years === 0) return `${months < 0 ? 0 : months}mo`
        return `${years}y`
    }

    const getRoleBadge = (role: string, expertType: string | null) => {
        switch (role) {
            case 'ADMIN': return { label: 'Admin', class: styles.badgeAdmin }
            case 'EXPERT': return { label: expertType || 'Expert', class: styles.badgeExpert }
            default: return null
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading profile...</p>
            </div>
        )
    }

    if (!member) return null

    const roleBadge = getRoleBadge(member.role, member.expertType)

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/community" className={styles.backLink}>
                    ← Back to Community
                </Link>
            </div>

            <div className={styles.content}>
                <div className={styles.mainColumn}>
                    {/* Profile Header */}
                    <div className={`card ${styles.profileCard}`}>
                        <div className={styles.profileHeader}>
                            <div className={styles.avatar}>
                                {member.avatar ? (
                                    <img src={member.avatar} alt="" />
                                ) : (
                                    member.name[0]?.toUpperCase()
                                )}
                            </div>
                            <div className={styles.profileInfo}>
                                <h1>
                                    {member.name}
                                    {member.isVerified && <span className={styles.verified}>✓</span>}
                                    {roleBadge && (
                                        <span className={`${styles.badge} ${roleBadge.class}`}>
                                            {roleBadge.label}
                                        </span>
                                    )}
                                </h1>
                                {member.location && (
                                    <p className={styles.location}>📍 {member.location}</p>
                                )}
                                <div className={styles.stats}>
                                    <span><strong>{member.followerCount}</strong> followers</span>
                                    <span><strong>{member.followingCount}</strong> following</span>
                                    <span><strong>{member._count.dogs}</strong> dogs</span>
                                </div>
                            </div>

                            {!member.isCurrentUser && (
                                <div className={styles.profileActions}>
                                    <button
                                        className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'}`}
                                        onClick={handleFollow}
                                    >
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                    <button
                                        className="btn btn-outline"
                                        onClick={handleMessage}
                                    >
                                        💬 Message
                                    </button>
                                </div>
                            )}

                            {member.isCurrentUser && (
                                <Link href="/profile" className="btn btn-secondary">
                                    Edit Profile
                                </Link>
                            )}
                        </div>

                        {member.bio && (
                            <div className={styles.bio}>
                                <p>{member.bio}</p>
                            </div>
                        )}

                        {member.credentials && member.role === 'EXPERT' && (
                            <div className={styles.credentials}>
                                <h4>Credentials</h4>
                                <p>{member.credentials}</p>
                            </div>
                        )}

                        <p className={styles.memberSince}>
                            Member since {formatDate(member.createdAt)}
                        </p>
                    </div>

                    {/* Recent Posts */}
                    <div className={`card ${styles.postsCard}`}>
                        <h3>Recent Posts</h3>
                        {member.recentPosts.length === 0 ? (
                            <div className={styles.emptyPosts}>
                                <span>📝</span>
                                <p>No posts yet</p>
                            </div>
                        ) : (
                            <div className={styles.postsList}>
                                {member.recentPosts.map(post => (
                                    <div key={post.id} className={styles.postItem}>
                                        <p className={styles.postContent}>{post.content}</p>
                                        {post.taggedDogs.length > 0 && (
                                            <div className={styles.taggedDogs}>
                                                {post.taggedDogs.map(td => (
                                                    <Link
                                                        key={td.dog.id}
                                                        href={`/community/dogs/${td.dog.id}`}
                                                        className={styles.dogTag}
                                                    >
                                                        🐕 {td.dog.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                        <div className={styles.postMeta}>
                                            <span>❤️ {post._count.likes}</span>
                                            <span>💬 {post._count.comments}</span>
                                            <span>{formatRelativeTime(post.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar - Dogs */}
                <div className={styles.sidebar}>
                    <div className={`card ${styles.dogsCard}`}>
                        <h3>{member.isCurrentUser ? 'My Dogs' : `${member.name.split(' ')[0]}'s Dogs`}</h3>
                        {member.dogs.length === 0 ? (
                            <div className={styles.emptyDogs}>
                                <span>🐕</span>
                                <p>No dogs yet</p>
                            </div>
                        ) : (
                            <div className={styles.dogsList}>
                                {member.dogs.map(dog => (
                                    <Link
                                        key={dog.id}
                                        href={`/community/dogs/${dog.id}`}
                                        className={styles.dogItem}
                                    >
                                        <div className={styles.dogPhoto}>
                                            {dog.photo ? (
                                                <img src={dog.photo} alt="" />
                                            ) : (
                                                '🐕'
                                            )}
                                        </div>
                                        <div className={styles.dogInfo}>
                                            <h4>
                                                {dog.name}
                                                <span className={styles.dogGender}>
                                                    {dog.gender === 'MALE' ? '♂️' : dog.gender === 'FEMALE' ? '♀️' : ''}
                                                </span>
                                            </h4>
                                            <p>{dog.breed}</p>
                                            {calculateAge(dog.birthDate) && (
                                                <span className={styles.dogAge}>
                                                    {calculateAge(dog.birthDate)} old
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
