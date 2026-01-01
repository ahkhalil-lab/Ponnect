import Link from 'next/link'
import styles from '../page.module.css'

export default function AboutPage() {
    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.header}>
                <div className="container">
                    <nav className={styles.nav}>
                        <Link href="/" className={styles.logo}>
                            <span className="paw-icon"></span>
                            <span className={styles.logoText}>Ponnect</span>
                        </Link>
                        <div className={styles.authButtons}>
                            <Link href="/login" className="btn btn-ghost">Log In</Link>
                            <Link href="/register" className="btn btn-primary">Join Free</Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* About Content */}
            <section style={{ padding: 'var(--space-24) 0', minHeight: '60vh' }}>
                <div className="container container-md">
                    <h1 style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>About Ponnect</h1>

                    <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
                        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>Our Mission</h2>
                        <p>
                            Ponnect was born from a simple idea: every dog parent deserves a supportive community.
                            We&apos;re building Australia&apos;s friendliest dog parent community, connecting pet lovers
                            across Brisbane and Queensland.
                        </p>
                        <p style={{ marginBottom: 0 }}>
                            Whether you&apos;re looking for expert advice, local events, or just want to share
                            adorable photos of your furry friend, Ponnect is the place for you.
                        </p>
                    </div>

                    <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
                        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>What We Offer</h2>
                        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 'var(--text-2xl)' }}>💬</span>
                                <div>
                                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Community Forums</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                        Connect with thousands of fellow dog parents, share experiences, and get real advice.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 'var(--text-2xl)' }}>🩺</span>
                                <div>
                                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Expert Q&A</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                        Get trusted answers from verified vets, trainers, and nutritionists.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 'var(--text-2xl)' }}>📅</span>
                                <div>
                                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Local Events</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                        Discover dog-friendly events near you — from playdates to training workshops.
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: 'var(--text-2xl)' }}>🚨</span>
                                <div>
                                    <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>Regional Alerts</h3>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                        Stay informed about tick season warnings, disease outbreaks, and pet safety alerts.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>Join Our Pack</h2>
                        <p>
                            Ponnect is free to join and always will be. We believe every dog parent should have
                            access to a supportive community and expert advice.
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                            <Link href="/register" className="btn btn-primary">Create Free Account</Link>
                            <Link href="/forums" className="btn btn-outline">Browse Community</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className="container">
                    <div className={styles.footerBottom}>
                        <p>© 2025 Ponnect. Made with ❤️ in Brisbane, Australia</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
