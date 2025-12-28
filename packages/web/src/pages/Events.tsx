import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('/api/events?upcoming=true');
        setEvents(response.data.events || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1 style={titleStyle}>Local Dog Events 📅</h1>
      <p style={subtitleStyle}>Discover meetups and activities in Queensland</p>

      <div style={{ marginBottom: '30px' }}>
        <button className="btn btn-primary">Create Event</button>
      </div>

      {events.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>No upcoming events. Check back soon or create your own!</p>
        </div>
      ) : (
        <div style={eventsGridStyle}>
          {events.map((event) => (
            <div key={event.id} className="card" style={eventCardStyle}>
              <h3>{event.title}</h3>
              <p style={eventMetaStyle}>
                📍 {event.location}
              </p>
              <p style={eventMetaStyle}>
                🗓️ {formatDate(event.startTime)}
              </p>
              <p>{event.description.substring(0, 150)}...</p>
              <div style={eventFooterStyle}>
                <span>👥 {event._count?.attendees || 0} attending</span>
                {event.maxAttendees && (
                  <span>Max: {event.maxAttendees}</span>
                )}
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

const eventsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: '20px',
};

const eventCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const eventMetaStyle: React.CSSProperties = {
  color: '#7f8c8d',
  fontSize: '14px',
  marginBottom: '5px',
};

const eventFooterStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  marginTop: '15px',
  fontSize: '14px',
  color: '#7f8c8d',
};

export default Events;
