import Link from 'next/link'
import styles from './page.module.css'

export default function Home() {
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
            <div className={styles.navLinks}>
              <Link href="/forums" className={styles.navLink}>Forums</Link>
              <Link href="/events" className={styles.navLink}>Events</Link>
              <Link href="/expert-qa" className={styles.navLink}>Expert Q&A</Link>
            </div>
            <div className={styles.authButtons}>
              <Link href="/login" className="btn btn-ghost">Log In</Link>
              <Link href="/register" className="btn btn-primary">Join Free</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBlob1}></div>
        <div className={styles.heroBlob2}></div>
        <div className="container">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Your Dog's <span className={styles.highlight}>Best Mates</span><br />
              Are Just a Tap Away
            </h1>
            <p className={styles.heroSubtitle}>
              Join Brisbane's friendliest dog parent community. Get expert advice,
              find local meetups, and manage your pet's health — all in one place.
            </p>
            <div className={styles.heroCta}>
              <Link href="/register" className="btn btn-primary btn-lg">
                Get Started — It's Free
              </Link>
              <Link href="/forums" className="btn btn-outline btn-lg">
                Browse Community
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>2,500+</span>
                <span className={styles.statLabel}>Dog Parents</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>150+</span>
                <span className={styles.statLabel}>Events Monthly</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>50+</span>
                <span className={styles.statLabel}>Verified Experts</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2>Everything Your Dog Needs</h2>
            <p>From community support to expert care, we've got you covered</p>
          </div>
          <div className={styles.featureGrid}>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>💬</div>
              <h3>Community Forums</h3>
              <p>Ask questions, share experiences, and learn from thousands of fellow dog parents. Get real advice from people who understand.</p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>🩺</div>
              <h3>Expert Q&A</h3>
              <p>Get trusted answers from verified vets, trainers, and nutritionists. No more second-guessing your pet's health.</p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>📅</div>
              <h3>Local Events</h3>
              <p>Discover dog-friendly events near you. From playdates at the park to training workshops — socialise your pup!</p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>🏥</div>
              <h3>Health Tracking</h3>
              <p>Never miss a vaccination or medication. Track your pet's health records and get timely reminders.</p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>⚠️</div>
              <h3>Local Alerts</h3>
              <p>Stay informed about tick season warnings, disease outbreaks, and pet safety alerts specific to Queensland.</p>
            </div>
            <div className={`card ${styles.featureCard}`}>
              <div className={styles.featureIcon}>🐕</div>
              <h3>Dog Profiles</h3>
              <p>Create profiles for all your dogs. Show off their personality and connect with owners of similar breeds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Alert Banner */}
      <section className={styles.alertBanner}>
        <div className="container">
          <div className={styles.alertContent}>
            <span className={styles.alertIcon}>🔔</span>
            <div>
              <strong>Tick Season Alert - Queensland</strong>
              <p>Paralysis tick risk is HIGH in Southeast Queensland. Ensure your dog's tick prevention is up to date. <Link href="/alerts">Learn more</Link></p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2>Ready to Join the Pack?</h2>
            <p>Connect with dog lovers across Brisbane and Queensland. It's free to join!</p>
            <Link href="/register" className="btn btn-primary btn-lg">
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <Link href="/" className={styles.logo}>
                <span className="paw-icon"></span>
                <span className={styles.logoText}>Ponnect</span>
              </Link>
              <p>Australia's friendliest dog parent community. Connecting pet lovers since 2025.</p>
            </div>
            <div className={styles.footerLinks}>
              <h4>Community</h4>
              <Link href="/forums">Forums</Link>
              <Link href="/events">Events</Link>
              <Link href="/expert-qa">Expert Q&A</Link>
            </div>
            <div className={styles.footerLinks}>
              <h4>Resources</h4>
              <Link href="/alerts">Safety Alerts</Link>
              <Link href="/guides">Pet Guides</Link>
              <Link href="/directory">Local Services</Link>
            </div>
            <div className={styles.footerLinks}>
              <h4>Company</h4>
              <Link href="/about">About Us</Link>
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>© 2025 Ponnect. Made with ❤️ in Brisbane, Australia</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
