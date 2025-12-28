import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    username: '',
    location: 'Brisbane, QLD',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={containerStyle}>
        <div className="card" style={cardStyle}>
          <h2 style={titleStyle}>Join Ponnect</h2>
          <p style={subtitleStyle}>Start your dog parent community journey! 🐾</p>

          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>

            <div className="input-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Brisbane, QLD"
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={linkTextStyle}>
            Already have an account? <Link to="/login" style={linkStyle}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '500px',
};

const cardStyle: React.CSSProperties = {
  maxWidth: '450px',
  width: '100%',
};

const titleStyle: React.CSSProperties = {
  fontSize: '28px',
  marginBottom: '10px',
  textAlign: 'center',
  color: '#2c3e50',
};

const subtitleStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#7f8c8d',
  marginBottom: '30px',
};

const errorStyle: React.CSSProperties = {
  backgroundColor: '#fee',
  color: '#c33',
  padding: '10px',
  borderRadius: '6px',
  marginBottom: '20px',
  textAlign: 'center',
};

const linkTextStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '20px',
};

const linkStyle: React.CSSProperties = {
  color: '#ff6b35',
  fontWeight: 600,
};

export default Register;
