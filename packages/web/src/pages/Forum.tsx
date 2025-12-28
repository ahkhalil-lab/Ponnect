import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Forum: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get('/api/forum/posts');
        setPosts(response.data.posts || []);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h1 style={titleStyle}>Community Forums 💬</h1>
      <p style={subtitleStyle}>Connect with fellow dog parents across Queensland</p>

      <div style={{ marginBottom: '30px' }}>
        <button className="btn btn-primary">Create New Post</button>
      </div>

      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>No posts yet. Be the first to start a conversation!</p>
        </div>
      ) : (
        <div style={postsStyle}>
          {posts.map((post) => (
            <div key={post.id} className="card" style={postCardStyle}>
              <h3>{post.title}</h3>
              <p style={postMetaStyle}>
                By {post.author?.firstName} {post.author?.lastName} • {post.category}
              </p>
              <p>{post.content.substring(0, 200)}...</p>
              <div style={postFooterStyle}>
                <span>👁️ {post.views} views</span>
                <span>💬 {post._count?.comments || 0} comments</span>
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

const postsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const postCardStyle: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'transform 0.2s',
};

const postMetaStyle: React.CSSProperties = {
  color: '#7f8c8d',
  fontSize: '14px',
  marginBottom: '10px',
};

const postFooterStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  marginTop: '15px',
  fontSize: '14px',
  color: '#7f8c8d',
};

export default Forum;
