import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1 style={titleStyle}>Welcome, {user?.firstName}! 🐕</h1>
      
      <div style={gridStyle}>
        <div className="card">
          <h3>Your Profile</h3>
          <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
          <p><strong>Username:</strong> @{user?.username}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Location:</strong> {user?.location}</p>
          <p><strong>Role:</strong> {user?.role}</p>
        </div>

        <div className="card">
          <h3>Quick Actions</h3>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={() => navigate('/my-dogs')}
          >
            Manage My Dogs
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={() => navigate('/forum')}
          >
            Browse Forums
          </button>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={() => navigate('/questions')}
          >
            Ask a Question
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%' }}
            onClick={() => navigate('/events')}
          >
            Find Events
          </button>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>Getting Started</h2>
        <div className="card">
          <ol style={{ lineHeight: '2' }}>
            <li>Add your dog's profile to track their health</li>
            <li>Introduce yourself in the community forums</li>
            <li>Ask questions to our verified vets and trainers</li>
            <li>Find local dog events and meetups</li>
            <li>Set up vaccination and medication reminders</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

const titleStyle: React.CSSProperties = {
  marginBottom: '30px',
  color: '#2c3e50',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '20px',
};

export default Dashboard;
