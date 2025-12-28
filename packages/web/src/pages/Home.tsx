import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="container">
      <section style={heroStyle}>
        <h1 style={heroTitleStyle}>Welcome to Ponnect 🐕</h1>
        <p style={heroSubtitleStyle}>
          Queensland's Premier Dog Parent Community
        </p>
        <p style={heroDescStyle}>
          Connect with fellow dog owners, get expert advice from verified vets and trainers,
          discover local events, and keep your pup's health on track - all in one friendly platform.
        </p>
        <div style={heroButtonsStyle}>
          <Link to="/register" className="btn btn-primary" style={{ fontSize: '18px', padding: '12px 30px' }}>
            Get Started
          </Link>
          <Link to="/forum" className="btn btn-secondary" style={{ fontSize: '18px', padding: '12px 30px' }}>
            Explore Community
          </Link>
        </div>
      </section>

      <section style={featuresStyle}>
        <h2 style={sectionTitleStyle}>Everything Your Dog Parent Journey Needs</h2>
        <div style={featuresGridStyle}>
          <div className="card" style={featureCardStyle}>
            <div style={featureIconStyle}>💬</div>
            <h3>Community Forums</h3>
            <p>Share experiences, ask questions, and connect with dog lovers across Brisbane and Queensland.</p>
          </div>
          <div className="card" style={featureCardStyle}>
            <div style={featureIconStyle}>🩺</div>
            <h3>Expert Q&A</h3>
            <p>Get trusted answers from verified veterinarians and professional dog trainers.</p>
          </div>
          <div className="card" style={featureCardStyle}>
            <div style={featureIconStyle}>📅</div>
            <h3>Local Events</h3>
            <p>Discover dog-friendly meetups, training sessions, and events in your area.</p>
          </div>
          <div className="card" style={featureCardStyle}>
            <div style={featureIconStyle}>💊</div>
            <h3>Health Tracking</h3>
            <p>Keep track of vaccinations, medications, and get timely reminders for your pup's care.</p>
          </div>
        </div>
      </section>

      <section style={ctaStyle}>
        <h2>Join the Ponnect Community Today</h2>
        <p>Start connecting with dog parents who get it.</p>
        <Link to="/register" className="btn btn-primary" style={{ fontSize: '18px', padding: '12px 30px' }}>
          Create Free Account
        </Link>
      </section>
    </div>
  );
};

const heroStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 0',
};

const heroTitleStyle: React.CSSProperties = {
  fontSize: '48px',
  color: '#ff6b35',
  marginBottom: '10px',
};

const heroSubtitleStyle: React.CSSProperties = {
  fontSize: '24px',
  color: '#2c3e50',
  marginBottom: '20px',
  fontWeight: 600,
};

const heroDescStyle: React.CSSProperties = {
  fontSize: '18px',
  color: '#7f8c8d',
  maxWidth: '700px',
  margin: '0 auto 30px',
  lineHeight: '1.6',
};

const heroButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  justifyContent: 'center',
};

const featuresStyle: React.CSSProperties = {
  padding: '60px 0',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '32px',
  textAlign: 'center',
  marginBottom: '40px',
  color: '#2c3e50',
};

const featuresGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '30px',
};

const featureCardStyle: React.CSSProperties = {
  textAlign: 'center',
};

const featureIconStyle: React.CSSProperties = {
  fontSize: '48px',
  marginBottom: '15px',
};

const ctaStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px 0',
  backgroundColor: 'white',
  borderRadius: '12px',
  marginTop: '40px',
};

export default Home;
