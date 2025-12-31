'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Dog {
    id: string
    name: string
    breed: string
    gender: string
    birthDate: string | null
    photo: string | null
    owner: {
        id: string
        name: string
        avatar: string | null
        location: string | null
    }
}

interface Member {
    id: string
    name: string
    avatar: string | null
    bio: string | null
    location: string | null
    role: string
    isVerified: boolean
    createdAt: string
    isFollowing: boolean
    isCurrentUser: boolean
    dogs: {
        id: string
        name: string
        photo: string | null
        breed: string
    }[]
    _count: {
        dogs: number
        socialPosts: number
    }
}

export default function CommunityPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'dogs' | 'members'>('dogs')
    const [dogs, setDogs] = useState<Dog[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [breedFilter, setBreedFilter] = useState('')
    const [locationFilter, setLocationFilter] = useState('')
    const [breeds, setBreeds] = useState<string[]>([])
    const [locations, setLocations] = useState<string[]>([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)

    const fetchDogs = useCallback(async (pageNum: number, append: boolean = false) => {
        try {
            if (pageNum === 1) setIsLoading(true)
            else setLoadingMore(true)

            const params = new URLSearchParams({ page: pageNum.toString() })
            if (searchQuery) params.append('search', searchQuery)
            if (breedFilter) params.append('breed', breedFilter)
            if (locationFilter) params.append('location', locationFilter)

            const res = await fetch(`/api/community/dogs?${params}`)
            const data = await res.json()

            if (data.success) {
                if (append) {
                    setDogs(prev => [...prev, ...data.data])
                } else {
                    setDogs(data.data)
                    setBreeds(data.filters?.breeds || [])
                }
                setHasMore(pageNum < data.pagination.pages)
            }
        } catch (error) {
            console.error('Failed to fetch dogs:', error)
        } finally {
            setIsLoading(false)
            setLoadingMore(false)
        }
    }, [searchQuery, breedFilter, locationFilter])

    const fetchMembers = useCallback(async (pageNum: number, append: boolean = false) => {
        try {
            if (pageNum === 1) setIsLoading(true)
            else setLoadingMore(true)

            const params = new URLSearchParams({ page: pageNum.toString(), hasDogsOnly: 'true' })
            if (searchQuery) params.append('search', searchQuery)
            if (locationFilter) params.append('location', locationFilter)

            const res = await fetch(`/api/community/members?${params}`)
            const data = await res.json()

            if (data.success) {
                if (append) {
                    setMembers(prev => [...prev, ...data.data])
                } else {
                    setMembers(data.data)
                    setLocations(data.filters?.locations || [])
                }
                setHasMore(pageNum < data.pagination.pages)
            }
        } catch (error) {
            console.error('Failed to fetch members:', error)
        } finally {
            setIsLoading(false)
            setLoadingMore(false)
        }
    }, [searchQuery, locationFilter])

    useEffect(() => {
        setPage(1)
        if (activeTab === 'dogs') {
            fetchDogs(1)
        } else {
            fetchMembers(1)
        }
    }, [activeTab, fetchDogs, fetchMembers])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1)
        if (activeTab === 'dogs') {
            fetchDogs(1)
        } else {
            fetchMembers(1)
        }
    }

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1
            setPage(nextPage)
            if (activeTab === 'dogs') {
                fetchDogs(nextPage, true)
            } else {
                fetchMembers(nextPage, true)
            }
        }
    }

    const handleFollow = async (memberId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            const res = await fetch(`/api/users/${memberId}/follow`, { method: 'POST' })
            const data = await res.json()

            if (data.success) {
                setMembers(prev => prev.map(m =>
                    m.id === memberId ? { ...m, isFollowing: data.data.isFollowing } : m
                ))
            }
        } catch (error) {
            console.error('Failed to toggle follow:', error)
        }
    }

    const handleMessage = (memberId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        router.push(`/messages?start=${memberId}`)
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

    const getGenderEmoji = (gender: string) => {
        switch (gender) {
            case 'MALE': return '♂️'
            case 'FEMALE': return '♀️'
            default: return ''
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading community...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>Community</h1>
                    <p className={styles.subtitle}>Discover dogs and connect with fellow dog parents</p>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'dogs' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('dogs')}
                >
                    🐕 Dogs
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'members' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('members')}
                >
                    👥 Dog Parents
                </button>
            </div>

            <form onSubmit={handleSearch} className={styles.toolbar}>
                <input
                    type="text"
                    placeholder={activeTab === 'dogs' ? 'Search dogs by name or breed...' : 'Search members...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`input ${styles.searchInput}`}
                />
                {activeTab === 'dogs' && breeds.length > 0 && (
                    <select
                        value={breedFilter}
                        onChange={(e) => { setBreedFilter(e.target.value); setPage(1) }}
                        className={`input ${styles.filterSelect}`}
                    >
                        <option value="">All Breeds</option>
                        {breeds.map(breed => (
                            <option key={breed} value={breed}>{breed}</option>
                        ))}
                    </select>
                )}
                {locations.length > 0 && (
                    <select
                        value={locationFilter}
                        onChange={(e) => { setLocationFilter(e.target.value); setPage(1) }}
                        className={`input ${styles.filterSelect}`}
                    >
                        <option value="">All Locations</option>
                        {locations.map(loc => (
                            <option key={loc} value={loc || ''}>{loc}</option>
                        ))}
                    </select>
                )}
                <button type="submit" className="btn btn-secondary">Search</button>
            </form>

            {activeTab === 'dogs' ? (
                dogs.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🐕</div>
                        <h3>No dogs found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.grid}>
                            {dogs.map(dog => (
                                <Link key={dog.id} href={`/community/dogs/${dog.id}`} className={styles.dogCard}>
                                    <div className={styles.dogPhoto}>
                                        {dog.photo ? (
                                            <img src={dog.photo} alt={dog.name} />
                                        ) : (
                                            '🐕'
                                        )}
                                        <span className={styles.dogGender}>{getGenderEmoji(dog.gender)}</span>
                                    </div>
                                    <div className={styles.dogInfo}>
                                        <h3 className={styles.dogName}>{dog.name}</h3>
                                        <p className={styles.dogBreed}>{dog.breed}</p>
                                        <div className={styles.dogMeta}>
                                            {calculateAge(dog.birthDate) && <span>{calculateAge(dog.birthDate)} old</span>}
                                            {dog.owner.location && <span>📍 {dog.owner.location}</span>}
                                        </div>
                                        <div className={styles.dogOwner}>
                                            <div className={styles.dogOwnerAvatar}>
                                                {dog.owner.avatar ? (
                                                    <img src={dog.owner.avatar} alt="" />
                                                ) : (
                                                    dog.owner.name[0]?.toUpperCase()
                                                )}
                                            </div>
                                            <span className={styles.dogOwnerName}>{dog.owner.name}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {hasMore && (
                            <div className={styles.loadMore}>
                                <button className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
                                    {loadingMore ? 'Loading...' : 'Load More Dogs'}
                                </button>
                            </div>
                        )}
                    </>
                )
            ) : (
                members.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👥</div>
                        <h3>No members found</h3>
                        <p>Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.grid}>
                            {members.map(member => (
                                <Link key={member.id} href={`/community/members/${member.id}`} className={styles.memberCard}>
                                    <div className={styles.memberHeader}>
                                        <div className={styles.memberAvatar}>
                                            {member.avatar ? (
                                                <img src={member.avatar} alt="" />
                                            ) : (
                                                member.name[0]?.toUpperCase()
                                            )}
                                        </div>
                                        <div className={styles.memberInfo}>
                                            <h3 className={styles.memberName}>
                                                {member.name}
                                                {member.isVerified && <span className={styles.verified}>✓</span>}
                                            </h3>
                                            {member.location && (
                                                <p className={styles.memberLocation}>📍 {member.location}</p>
                                            )}
                                        </div>
                                    </div>
                                    {member.bio && (
                                        <p className={styles.memberBio}>{member.bio}</p>
                                    )}
                                    {member.dogs.length > 0 && (
                                        <div className={styles.memberDogs}>
                                            {member.dogs.map(dog => (
                                                <span key={dog.id} className={styles.memberDogTag}>
                                                    🐕 {dog.name}
                                                </span>
                                            ))}
                                            {member._count.dogs > 3 && (
                                                <span className={styles.memberDogTag}>
                                                    +{member._count.dogs - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div className={styles.memberStats}>
                                        <span>{member._count.dogs} dog{member._count.dogs !== 1 ? 's' : ''}</span>
                                        <span>{member._count.socialPosts} post{member._count.socialPosts !== 1 ? 's' : ''}</span>
                                    </div>
                                    {!member.isCurrentUser && (
                                        <div className={styles.memberActions}>
                                            <button
                                                className={`btn btn-sm ${member.isFollowing ? 'btn-outline' : 'btn-primary'}`}
                                                onClick={(e) => handleFollow(member.id, e)}
                                            >
                                                {member.isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline"
                                                onClick={(e) => handleMessage(member.id, e)}
                                            >
                                                💬 Message
                                            </button>
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                        {hasMore && (
                            <div className={styles.loadMore}>
                                <button className="btn btn-outline" onClick={loadMore} disabled={loadingMore}>
                                    {loadingMore ? 'Loading...' : 'Load More Members'}
                                </button>
                            </div>
                        )}
                    </>
                )
            )}
        </div>
    )
}
