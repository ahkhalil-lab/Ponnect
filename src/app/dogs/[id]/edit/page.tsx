'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import styles from './page.module.css'

const BREEDS = [
    'Australian Shepherd',
    'Beagle',
    'Border Collie',
    'Boxer',
    'Bulldog',
    'Cavalier King Charles Spaniel',
    'Chihuahua',
    'Cocker Spaniel',
    'Dachshund',
    'Dalmatian',
    'French Bulldog',
    'German Shepherd',
    'Golden Retriever',
    'Great Dane',
    'Husky',
    'Jack Russell Terrier',
    'Kelpie',
    'Labrador Retriever',
    'Maltese',
    'Miniature Schnauzer',
    'Pomeranian',
    'Poodle',
    'Pug',
    'Rottweiler',
    'Shih Tzu',
    'Staffy (Staffordshire Bull Terrier)',
    'Yorkshire Terrier',
    'Mixed Breed',
    'Other',
]

interface Dog {
    id: string
    name: string
    breed: string
    birthDate: string | null
    gender: string
    weight: number | null
    bio: string | null
}

export default function EditDogPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [formData, setFormData] = useState({
        name: '',
        breed: '',
        customBreed: '',
        gender: '',
        birthDate: '',
        weight: '',
        bio: '',
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [dogName, setDogName] = useState('')

    useEffect(() => {
        const fetchDog = async () => {
            try {
                const res = await fetch(`/api/dogs/${id}`)
                const data = await res.json()

                if (data.success) {
                    const dog: Dog = data.data
                    const isCustomBreed = !BREEDS.includes(dog.breed)
                    setDogName(dog.name)
                    setFormData({
                        name: dog.name,
                        breed: isCustomBreed ? 'Other' : dog.breed,
                        customBreed: isCustomBreed ? dog.breed : '',
                        gender: dog.gender,
                        birthDate: dog.birthDate ? dog.birthDate.split('T')[0] : '',
                        weight: dog.weight?.toString() || '',
                        bio: dog.bio || '',
                    })
                } else if (res.status === 401) {
                    router.push('/login')
                } else {
                    router.push('/dogs')
                }
            } catch {
                router.push('/dogs')
            } finally {
                setIsLoading(false)
            }
        }

        fetchDog()
    }, [id, router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError('')

        const breed = formData.breed === 'Other' ? formData.customBreed : formData.breed

        if (!breed) {
            setError('Please select or enter a breed')
            setIsSaving(false)
            return
        }

        try {
            const res = await fetch(`/api/dogs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    breed,
                    gender: formData.gender,
                    birthDate: formData.birthDate || null,
                    weight: formData.weight || null,
                    bio: formData.bio || null,
                }),
            })

            const data = await res.json()

            if (data.success) {
                router.push(`/dogs/${id}`)
            } else {
                setError(data.error || 'Failed to update dog')
            }
        } catch {
            setError('An error occurred. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className={styles.loading}>
                <div className="spinner spinner-lg"></div>
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href={`/dogs/${id}`} className={styles.backLink}>
                    ← Back to {dogName}
                </Link>
                <h1>Edit {dogName}</h1>
            </div>

            <div className={`card ${styles.formCard}`}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.errorAlert}>
                            {error}
                        </div>
                    )}

                    <div className={styles.formGrid}>
                        <div className="input-group">
                            <label htmlFor="name" className="input-label">
                                Dog&apos;s Name <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input"
                                required
                                maxLength={50}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="gender" className="input-label">
                                Gender <span className={styles.required}>*</span>
                            </label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="input"
                                required
                            >
                                <option value="">Select gender</option>
                                <option value="MALE">Male ♂️</option>
                                <option value="FEMALE">Female ♀️</option>
                                <option value="UNKNOWN">Rather not say</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="breed" className="input-label">
                            Breed <span className={styles.required}>*</span>
                        </label>
                        <select
                            id="breed"
                            name="breed"
                            value={formData.breed}
                            onChange={handleChange}
                            className="input"
                            required
                        >
                            <option value="">Select a breed</option>
                            {BREEDS.map(breed => (
                                <option key={breed} value={breed}>{breed}</option>
                            ))}
                        </select>
                    </div>

                    {formData.breed === 'Other' && (
                        <div className="input-group">
                            <label htmlFor="customBreed" className="input-label">
                                Enter Breed <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="customBreed"
                                name="customBreed"
                                value={formData.customBreed}
                                onChange={handleChange}
                                className="input"
                                required
                            />
                        </div>
                    )}

                    <div className={styles.formGrid}>
                        <div className="input-group">
                            <label htmlFor="birthDate" className="input-label">
                                Birth Date
                            </label>
                            <input
                                type="date"
                                id="birthDate"
                                name="birthDate"
                                value={formData.birthDate}
                                onChange={handleChange}
                                className="input"
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="weight" className="input-label">
                                Weight (kg)
                            </label>
                            <input
                                type="number"
                                id="weight"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                                className="input"
                                min="0"
                                max="200"
                                step="0.1"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="bio" className="input-label">
                            About Your Dog
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className="input"
                            rows={4}
                            maxLength={500}
                        />
                        <span className={styles.hint}>{formData.bio.length}/500 characters</span>
                    </div>

                    <div className={styles.actions}>
                        <Link href={`/dogs/${id}`} className="btn btn-secondary">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
