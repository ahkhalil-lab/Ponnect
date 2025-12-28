'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './login.module.css'

export default function LoginPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
        setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!data.success) {
                setError(data.error || 'Login failed')
                setIsLoading(false)
                return
            }

            // Redirect to dashboard on success
            router.push('/dashboard')
        } catch {
            setError('An error occurred. Please try again.')
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
                        <h1>Welcome Back!</h1>
                        <p>Log in to connect with your dog community</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <div className={styles.errorAlert}>
                                {error}
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="email" className="input-label">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password" className="input-label">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input"
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <div className={styles.forgotPassword}>
                            <Link href="/forgot-password">Forgot password?</Link>
                        </div>

                        <button
                            type="submit"
                            className={`btn btn-primary btn-lg w-full ${styles.submitBtn}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Logging in...
                                </>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>

                    <div className={styles.divider}>
                        <span>or</span>
                    </div>

                    <p className={styles.signupLink}>
                        Don&apos;t have an account?{' '}
                        <Link href="/register">Create one free</Link>
                    </p>
                </div>

                <div className={styles.illustration}>
                    <div className={styles.illustrationContent}>
                        <div className={styles.dogEmoji}>🐕</div>
                        <h2>Join 2,500+ Dog Parents</h2>
                        <p>Connect with fellow dog lovers in Brisbane and across Queensland</p>
                        <div className={styles.testimonial}>
                            <p>&ldquo;Found my pup&apos;s best friend at a Ponnect meetup. Now we walk together every week!&rdquo;</p>
                            <span>— Sarah, Golden Retriever mum</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
