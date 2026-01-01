import Link from 'next/link'
import styles from '../page.module.css'

export default function TermsPage() {
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

            {/* Terms Content */}
            <section style={{ padding: 'var(--space-24) 0', minHeight: '60vh' }}>
                <div className="container container-md">
                    <h1 style={{ marginBottom: 'var(--space-2)', textAlign: 'center' }}>Terms of Service</h1>
                    <p style={{ textAlign: 'center', marginBottom: 'var(--space-8)', color: 'var(--text-tertiary)' }}>
                        Last updated: January 2025
                    </p>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>1. Acceptance of Terms</h2>
                        <p style={{ marginBottom: 0 }}>
                            By accessing or using Ponnect, you agree to be bound by these Terms of Service.
                            If you do not agree to these terms, please do not use our services.
                        </p>
                    </div>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>2. User Accounts</h2>
                        <p>When creating an account, you agree to:</p>
                        <ul style={{ paddingLeft: 'var(--space-6)', color: 'var(--text-secondary)', marginBottom: 0 }}>
                            <li>Provide accurate and complete information</li>
                            <li>Maintain the security of your password</li>
                            <li>Be responsible for all activities under your account</li>
                            <li>Notify us immediately of any unauthorized access</li>
                        </ul>
                    </div>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>3. Community Guidelines</h2>
                        <p>Users must not:</p>
                        <ul style={{ paddingLeft: 'var(--space-6)', color: 'var(--text-secondary)', marginBottom: 0 }}>
                            <li>Post harmful, abusive, or offensive content</li>
                            <li>Harass, bully, or intimidate other users</li>
                            <li>Share false or misleading information about pet health</li>
                            <li>Spam or post promotional content without permission</li>
                            <li>Violate any applicable laws or regulations</li>
                        </ul>
                    </div>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>4. Expert Advice Disclaimer</h2>
                        <p style={{ marginBottom: 0 }}>
                            While we strive to connect you with verified experts, the information provided on Ponnect
                            is for informational purposes only and should not replace professional veterinary care.
                            Always consult with a qualified veterinarian for medical decisions regarding your pet.
                        </p>
                    </div>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>5. Content Ownership</h2>
                        <p style={{ marginBottom: 0 }}>
                            You retain ownership of content you post on Ponnect. By posting content, you grant us
                            a license to use, display, and distribute that content within our platform. You are
                            responsible for ensuring you have the right to share any content you post.
                        </p>
                    </div>

                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>6. Termination</h2>
                        <p style={{ marginBottom: 0 }}>
                            We reserve the right to suspend or terminate accounts that violate these terms.
                            You may delete your account at any time through your account settings.
                        </p>
                    </div>

                    <div className="card">
                        <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-3)' }}>7. Contact</h2>
                        <p style={{ marginBottom: 0 }}>
                            For questions about these Terms of Service, please contact us at{' '}
                            <a href="mailto:support@ponnect.com.au">support@ponnect.com.au</a>
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
