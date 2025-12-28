import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyDogs: React.FC = () => {
  const navigate = useNavigate();
  const [dogs, setDogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDogs = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await axios.get('/api/dogs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDogs(response.data || []);
      } catch (error) {
        console.error('Failed to fetch dogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDogs();
  }, [navigate]);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1 style={titleStyle}>My Dogs 🐕</h1>
      <p style={subtitleStyle}>Manage your furry family members and their health</p>

      <div style={{ marginBottom: '30px' }}>
        <button className="btn btn-primary">Add New Dog</button>
      </div>

      {dogs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h3>No dogs yet!</h3>
          <p>Add your first furry friend to start tracking their health and care.</p>
        </div>
      ) : (
        <div style={dogsGridStyle}>
          {dogs.map((dog) => (
            <div key={dog.id} className="card" style={dogCardStyle}>
              <div style={dogImageStyle}>
                {dog.image ? (
                  <img src={dog.image} alt={dog.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '64px' }}>🐕</div>
                )}
              </div>
              <h3>{dog.name}</h3>
              <p style={dogMetaStyle}>{dog.breed}</p>
              {dog.birthDate && (
                <p style={dogMetaStyle}>
                  Born: {new Date(dog.birthDate).toLocaleDateString()}
                </p>
              )}
              {dog.weight && <p style={dogMetaStyle}>Weight: {dog.weight} kg</p>}
              
              <div style={{ marginTop: '15px' }}>
                <h4>Health Summary</h4>
                <p>Vaccinations: {dog.vaccinations?.length || 0}</p>
                <p>Medications: {dog.medications?.length || 0}</p>
                <p>Pending Reminders: {dog.reminders?.length || 0}</p>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', marginTop: '15px' }}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const titleStyle: React.CSSProperties = {
  marginBottom: '10px',
  color: '#2c3e50',
};

const subtitleStyle: React.CSSProperties = {
  marginBottom: '30px',
  color: '#7f8c8d',
};

const dogsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '20px',
};

const dogCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const dogImageStyle: React.CSSProperties = {
  width: '100%',
  height: '200px',
  backgroundColor: '#f0f0f0',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '15px',
};

const dogMetaStyle: React.CSSProperties = {
  color: '#7f8c8d',
  fontSize: '14px',
  margin: '5px 0',
};

export default MyDogs;
