'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './register.module.css'

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        location: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
        // Clear error for this field
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: '' }))
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required'
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters'
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) return

        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    location: formData.location || undefined,
                }),
            })

            const data = await res.json()

            if (!data.success) {
                setErrors({ form: data.error || 'Registration failed' })
                setIsLoading(false)
                return
            }

            // Auto-login after registration
            const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            })

            const loginData = await loginRes.json()

            if (loginData.success) {
                router.push('/dashboard?welcome=true')
            } else {
                router.push('/login')
            }
        } catch {
            setErrors({ form: 'An error occurred. Please try again.' })
            setIsLoading(false)
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.formCard}>
                    <div className={styles.header}>
                        <Link href="/" className={styles.logo}>
                            <span className="paw-icon"></span>
                            <span className={styles.logoText}>Ponnect</span>
                        </Link>
                        <h1>Join the Pack!</h1>
                        <p>Create your free account and connect with dog parents</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {errors.form && (
                            <div className={styles.errorAlert}>
                                {errors.form}
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="name" className="input-label">Your Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`input ${errors.name ? 'input-error' : ''}`}
                                placeholder="What should we call you?"
                                autoComplete="name"
                            />
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>

                        <div className="input-group">
                            <label htmlFor="email" className="input-label">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`input ${errors.email ? 'input-error' : ''}`}
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className={styles.row}>
                            <div className="input-group">
                                <label htmlFor="password" className="input-label">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`input ${errors.password ? 'input-error' : ''}`}
                                    placeholder="8+ characters"
                                    autoComplete="new-password"
                                />
                                {errors.password && <span className="error-message">{errors.password}</span>}
                            </div>

                            <div className="input-group">
                                <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                                    placeholder="Repeat password"
                                    autoComplete="new-password"
                                />
                                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="location" className="input-label">Location (Optional)</label>
                            <select
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="input"
                            >
                                <option value="">Select your area</option>
                                <optgroup label="Queensland">
                                    <option value="Brisbane, QLD">Brisbane</option>
                                    <option value="Gold Coast, QLD">Gold Coast</option>
                                    <option value="Sunshine Coast, QLD">Sunshine Coast</option>
                                    <option value="Ipswich, QLD">Ipswich</option>
                                    <option value="Toowoomba, QLD">Toowoomba</option>
                                    <option value="Cairns, QLD">Cairns</option>
                                    <option value="Townsville, QLD">Townsville</option>
                                </optgroup>
                                <optgroup label="Other States">
                                    <option value="Sydney, NSW">Sydney, NSW</option>
                                    <option value="Melbourne, VIC">Melbourne, VIC</option>
                                    <option value="Perth, WA">Perth, WA</option>
                                    <option value="Adelaide, SA">Adelaide, SA</option>
                                </optgroup>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-lg w-full ${styles.submitBtn}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Free Account'
                            )}
                        </button>

                        <p className={styles.terms}>
                            By signing up, you agree to our{' '}
                            <Link href="/terms">Terms of Service</Link> and{' '}
                            <Link href="/privacy">Privacy Policy</Link>
                        </p>
                    </form>

                    <div className={styles.divider}>
                        <span>or</span>
                    </div>

                    <p className={styles.loginLink}>
                        Already have an account?{' '}
                        <Link href="/login">Log in</Link>
                    </p>
                </div>

                <div className={styles.illustration}>
                    <div className={styles.illustrationContent}>
                        <div className={styles.features}>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>💬</span>
                                <div>
                                    <strong>Ask & Learn</strong>
                                    <p>Get advice from thousands of dog parents</p>
                                </div>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>🩺</span>
                                <div>
                                    <strong>Expert Advice</strong>
                                    <p>Trusted answers from verified vets</p>
                                </div>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>📅</span>
                                <div>
                                    <strong>Local Events</strong>
                                    <p>Find playdates and meetups nearby</p>
                                </div>
                            </div>
                            <div className={styles.feature}>
                                <span className={styles.featureIcon}>🏥</span>
                                <div>
                                    <strong>Health Tracking</strong>
                                    <p>Never miss a vaccination again</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
