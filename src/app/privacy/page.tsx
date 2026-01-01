import Link from 'next/link'
import styles from '../page.module.css'

export default function PrivacyPage() {
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

            {/* Privacy Content */}
            <section style={{ padding: 'var(--space-24) 0', minHeight: '60vh' }}>
                <div className="container container-md">
                    <h1 style={{ marginBottom: 'var(--space-2)', textAlign: 'center' }}>Privacy Policy</h1>
                    <p style={{ textAlign: 'center', marginBottom: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                        Last updated: January 2025
                    </p>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>1. Information We Collect</h2>
                        <p>We collect information you provide directly to us, including:</p>
                        <ul style={{ paddingLeft: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                            <li>Account information (name, email, password)</li>
                            <li>Profile information (bio, location, avatar)</li>
                            <li>Pet information (dog profiles, photos, health records)</li>
                            <li>Content you create (posts, comments, messages)</li>
                        </ul>
                    </div>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>2. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul style={{ paddingLeft: 'var(--space-6)', color: 'var(--text-secondary)' }}>
                            <li>Provide, maintain, and improve our services</li>
                            <li>Connect you with other dog parents in your area</li>
                            <li>Send you relevant alerts and notifications</li>
                            <li>Personalize your experience on Ponnect</li>
                        </ul>
                    </div>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>3. Information Sharing</h2>
                        <p style={{ marginBottom: 0 }}>
                            We do not sell your personal information. We may share information with service providers
                            who assist in our operations, or when required by law. Your public profile and posts
                            are visible to other Ponnect users.
                        </p>
                    </div>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>4. Data Security</h2>
                        <p style={{ marginBottom: 0 }}>
                            We implement industry-standard security measures to protect your data. Your password
                            is encrypted and we use secure connections (HTTPS) for all data transmission.
                        </p>
                    </div>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>5. Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul style={{ paddingLeft: 'var(--space-6)', color: 'var(--text-secondary)', marginBottom: 0 }}>
                            <li>Access and update your personal information</li>
                            <li>Delete your account and associated data</li>
                            <li>Opt out of marketing communications</li>
                            <li>Request a copy of your data</li>
                        </ul>
                    </div>

                    <div className="card">
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>6. Contact Us</h2>
                        <p style={{ marginBottom: 0 }}>
                            If you have questions about this Privacy Policy, please contact us at{' '}
                            <a href="mailto:privacy@ponnect.com.au">privacy@ponnect.com.au</a>
                        </p>
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
