'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface Dog {
    id: string
    name: string
    breed: string
    birthDate: string | null
    gender: string
    weight: number | null
    photo: string | null
    createdAt: string
    _count: {
        healthRecords: number
    }
}

export default function DogsPage() {
    const router = useRouter()
    const [dogs, setDogs] = useState<Dog[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchDogs = async () => {
            try {
                const res = await fetch('/api/dogs')
                const data = await res.json()

                if (data.success) {
                    setDogs(data.data)
                } else if (res.status === 401) {
                    router.push('/login')
                }
            } catch {
                console.error('Failed to fetch dogs')
            } finally {
                setIsLoading(false)
            }
        }

        fetchDogs()
    }, [router])

    const calculateAge = (birthDate: string | null) => {
        if (!birthDate) return 'Age unknown'

        const birth = new Date(birthDate)
        const today = new Date()
        let years = today.getFullYear() - birth.getFullYear()
        let months = today.getMonth() - birth.getMonth()

        if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
            years--
            months += 12
        }

        if (years === 0) {
            return `${months} month${months !== 1 ? 's' : ''} old`
        }
        if (months === 0) {
            return `${years} year${years !== 1 ? 's' : ''} old`
        }
        return `${years}y ${months}m old`
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
                <p>Loading your dogs...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1>My Dogs</h1>
                    <p className={styles.subtitle}>
                        {dogs.length === 0
                            ? 'Add your furry companions to get started'
                            : `You have ${dogs.length} dog${dogs.length !== 1 ? 's' : ''} registered`
                        }
                    </p>
                </div>
                <Link href="/dogs/new" className="btn btn-primary">
                    + Add a Dog
                </Link>
            </div>

            {dogs.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <div className={styles.emptyIcon}>🐕</div>
                    <h2>No Dogs Yet</h2>
                    <p>Add your first dog to start tracking their health, finding playmates, and more!</p>
                    <Link href="/dogs/new" className="btn btn-primary btn-lg">
                        Add Your First Dog
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {dogs.map((dog) => (
                        <Link
                            key={dog.id}
                            href={`/dogs/${dog.id}`}
                            className={`card card-interactive ${styles.dogCard}`}
                        >
                            <div className={styles.dogPhoto}>
                                {dog.photo ? (
                                    <img src={dog.photo} alt={dog.name} />
                                ) : (
                                    <span className={styles.photoPlaceholder}>🐕</span>
                                )}
                            </div>
                            <div className={styles.dogInfo}>
                                <h3>
                                    {dog.name} {getGenderEmoji(dog.gender)}
                                </h3>
                                <p className={styles.breed}>{dog.breed}</p>
                                <p className={styles.age}>{calculateAge(dog.birthDate)}</p>
                                {dog.weight && (
                                    <span className={styles.weight}>{dog.weight} kg</span>
                                )}
                            </div>
                            <div className={styles.dogMeta}>
                                <span className={styles.healthRecords}>
                                    🏥 {dog._count.healthRecords} health records
                                </span>
                            </div>
                        </Link>
                    ))}

                    {/* Add Dog Card */}
                    <Link href="/dogs/new" className={`card card-interactive ${styles.addCard}`}>
                        <div className={styles.addIcon}>+</div>
                        <span>Add Another Dog</span>
                    </Link>
                </div>
            )}
        </div>
    )
}
