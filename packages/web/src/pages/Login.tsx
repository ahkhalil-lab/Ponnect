import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div style={containerStyle}>
        <div className="card" style={cardStyle}>
          <h2 style={titleStyle}>Login to Ponnect</h2>
          <p style={subtitleStyle}>Welcome back to the pack! 🐕</p>

          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
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
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={linkTextStyle}>
            Don't have an account? <Link to="/register" style={linkStyle}>Register here</Link>
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

export default Login;
