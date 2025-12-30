'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ImageUpload'
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

export default function NewDogPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        breed: '',
        customBreed: '',
        gender: '',
        birthDate: '',
        weight: '',
        bio: '',
        photo: '',
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        const breed = formData.breed === 'Other' ? formData.customBreed : formData.breed

        if (!breed) {
            setError('Please select or enter a breed')
            setIsLoading(false)
            return
        }

        try {
            const res = await fetch('/api/dogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    breed,
                    gender: formData.gender,
                    birthDate: formData.birthDate || null,
                    weight: formData.weight || null,
                    bio: formData.bio || null,
                    photo: formData.photo || null,
                }),
            })

            const data = await res.json()

            if (data.success) {
                router.push(`/dogs/${data.data.id}`)
            } else {
                setError(data.error || 'Failed to add dog')
            }
        } catch {
            setError('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <Link href="/dogs" className={styles.backLink}>
                    ← Back to My Dogs
                </Link>
                <h1>Add a New Dog</h1>
                <p className={styles.subtitle}>Tell us about your furry friend</p>
            </div>

            <div className={`card ${styles.formCard}`}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && (
                        <div className={styles.errorAlert}>
                            {error}
                        </div>
                    )}

                    <div className={styles.photoSection}>
                        <ImageUpload
                            currentImage={formData.photo}
                            onUpload={(url) => setFormData(prev => ({ ...prev, photo: url }))}
                            type="dog"
                            label="Dog Photo"
                            size="large"
                        />
                    </div>

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
                                placeholder="e.g., Max, Bella"
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
                                placeholder="Enter your dog's breed"
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
                            <span className={styles.hint}>Approximate date is fine</span>
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
                                placeholder="e.g., 25"
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
                            placeholder="Tell us about your dog's personality, favourite activities..."
                            rows={4}
                            maxLength={500}
                        />
                        <span className={styles.hint}>{formData.bio.length}/500 characters</span>
                    </div>

                    <div className={styles.actions}>
                        <Link href="/dogs" className="btn btn-secondary">
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Adding...
                                </>
                            ) : (
                                '🐕 Add Dog'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
