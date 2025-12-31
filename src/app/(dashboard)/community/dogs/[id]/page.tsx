'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import styles from './page.module.css'

interface DogOwner {
    id: string
    name: string
    avatar: string | null
    bio: string | null
    location: string | null
    role: string
    isVerified: boolean
    createdAt: string
    isFollowing: boolean
    followerCount: number
    _count: {
        dogs: number
        posts: number
    }
}

interface DogProfile {
    id: string
    name: string
    breed: string
    birthDate: string | null
    gender: string
    weight: number | null
    bio: string | null
    photo: string | null
    createdAt: string
    age: { years: number; months: number } | null
    owner: DogOwner
    isOwnDog: boolean
    _count: {
        healthRecords: number
    }
}

export default function CommunityDogProfilePage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [dog, setDog] = useState<DogProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)

    useEffect(() => {
        const fetchDog = async () => {
            try {
                const res = await fetch(`/api/community/dogs/${id}`)
                const data = await res.json()

                if (data.success) {
                    setDog(data.data)
                    setIsFollowing(data.data.owner.isFollowing)
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

        fetchDog()
    }, [id, router])

    const handleFollow = async () => {
        if (!dog) return

        try {
            const res = await fetch(`/api/users/${dog.owner.id}/follow`, { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setIsFollowing(data.data.isFollowing)
            }
        } catch (error) {
            console.error('Failed to toggle follow:', error)
        }
    }

    const handleMessage = () => {
        if (!dog) return
        router.push(`/messages?start=${dog.owner.id}`)
    }

    const formatAge = (age: { years: number; months: number } | null) => {
        if (!age) return 'Age unknown'

        if (age.years === 0) {
            return `${age.months} month${age.months !== 1 ? 's' : ''} old`
        }
        if (age.months === 0) {
            return `${age.years} year${age.years !== 1 ? 's' : ''} old`
        }
        return `${age.years} year${age.years !== 1 ? 's' : ''}, ${age.months} month${age.months !== 1 ? 's' : ''} old`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading dog profile...</p>
            </div>
        )
    }

    if (!dog) return null

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/community" className={styles.backLink}>
                    ← Back to Community
                </Link>
            </div>

            <div className={styles.content}>
                <div className={`card ${styles.profileCard}`}>
                    <div className={styles.photoSection}>
                        {dog.photo ? (
                            <img src={dog.photo} alt={dog.name} className={styles.photo} />
                        ) : (
                            <div className={styles.photoPlaceholder}>🐕</div>
                        )}
                    </div>

                    <div className={styles.infoSection}>
                        <div className={styles.nameRow}>
                            <h1>
                                {dog.name}
                                <span className={styles.gender}>
                                    {dog.gender === 'MALE' ? '♂️' : dog.gender === 'FEMALE' ? '♀️' : ''}
                                </span>
                            </h1>
                            {dog.isOwnDog && (
                                <Link href={`/dogs/${dog.id}`} className="btn btn-secondary btn-sm">
                                    Manage
                                </Link>
                            )}
                        </div>

                        <p className={styles.breed}>{dog.breed}</p>
                        <p className={styles.age}>{formatAge(dog.age)}</p>

                        <div className={styles.details}>
                            {dog.weight && (
                                <div className={styles.detail}>
                                    <span className={styles.detailIcon}>⚖️</span>
                                    <span>{dog.weight} kg</span>
                                </div>
                            )}
                            {dog.birthDate && (
                                <div className={styles.detail}>
                                    <span className={styles.detailIcon}>🎂</span>
                                    <span>Born {formatDate(dog.birthDate)}</span>
                                </div>
                            )}
                        </div>

                        {dog.bio && (
                            <div className={styles.bio}>
                                <h3>About {dog.name}</h3>
                                <p>{dog.bio}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.sidebar}>
                    <div className={`card ${styles.ownerCard}`}>
                        <h3>Dog Parent</h3>
                        <div className={styles.ownerInfo}>
                            <div className={styles.ownerAvatar}>
                                {dog.owner.avatar ? (
                                    <img src={dog.owner.avatar} alt="" />
                                ) : (
                                    dog.owner.name[0]?.toUpperCase()
                                )}
                            </div>
                            <div className={styles.ownerDetails}>
                                <h4>
                                    {dog.owner.name}
                                    {dog.owner.isVerified && <span className={styles.verified}>✓</span>}
                                </h4>
                                {dog.owner.location && (
                                    <p className={styles.ownerLocation}>📍 {dog.owner.location}</p>
                                )}
                            </div>
                        </div>

                        {dog.owner.bio && (
                            <p className={styles.ownerBio}>{dog.owner.bio}</p>
                        )}

                        <div className={styles.ownerStats}>
                            <span>{dog.owner._count.dogs} dog{dog.owner._count.dogs !== 1 ? 's' : ''}</span>
                            <span>{dog.owner.followerCount} follower{dog.owner.followerCount !== 1 ? 's' : ''}</span>
                        </div>

                        {!dog.isOwnDog && (
                            <div className={styles.ownerActions}>
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

                        <Link href={`/community/members/${dog.owner.id}`} className={styles.viewProfileLink}>
                            View Full Profile →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
