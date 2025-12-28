import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await axios.get('/api/questions');
        setQuestions(response.data.questions || []);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1 style={titleStyle}>Expert Q&A 🩺</h1>
      <p style={subtitleStyle}>Get trusted answers from verified veterinarians and trainers</p>

      <div style={{ marginBottom: '30px' }}>
        <button className="btn btn-primary">Ask a Question</button>
      </div>

      {questions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>No questions yet. Be the first to ask!</p>
        </div>
      ) : (
        <div style={questionsStyle}>
          {questions.map((question) => (
            <div key={question.id} className="card" style={questionCardStyle}>
              <div style={statusBadgeStyle(question.status)}>
                {question.status}
              </div>
              <h3>{question.title}</h3>
              <p style={questionMetaStyle}>
                By {question.author?.firstName} {question.author?.lastName} • {question.category}
              </p>
              <p>{question.content.substring(0, 200)}...</p>
              <div style={questionFooterStyle}>
                <span>👁️ {question.views} views</span>
                <span>💬 {question._count?.answers || 0} answers</span>
              </div>
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

const questionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const questionCardStyle: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'transform 0.2s',
  position: 'relative',
};

const statusBadgeStyle = (status: string): React.CSSProperties => ({
  position: 'absolute',
  top: '15px',
  right: '15px',
  padding: '5px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 600,
  backgroundColor: status === 'ANSWERED' ? '#27ae60' : status === 'OPEN' ? '#f7931e' : '#7f8c8d',
  color: 'white',
});

const questionMetaStyle: React.CSSProperties = {
  color: '#7f8c8d',
  fontSize: '14px',
  marginBottom: '10px',
};

const questionFooterStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  marginTop: '15px',
  fontSize: '14px',
  color: '#7f8c8d',
};

export default Questions;
