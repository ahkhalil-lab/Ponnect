import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div>
      <header style={headerStyle}>
        <div className="container" style={navContainerStyle}>
          <Link to="/" style={logoStyle}>
            <h1>🐕 Ponnect</h1>
          </Link>
          <nav style={navStyle}>
            <Link to="/forum" style={navLinkStyle}>Forum</Link>
            <Link to="/questions" style={navLinkStyle}>Expert Q&A</Link>
            <Link to="/events" style={navLinkStyle}>Events</Link>
            {isAuthenticated ? (
              <>
                <Link to="/my-dogs" style={navLinkStyle}>My Dogs</Link>
                <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary" style={{ marginLeft: '10px' }}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-secondary" style={{ marginLeft: '10px' }}>
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main style={mainStyle}>
        <Outlet />
      </main>
      <footer style={footerStyle}>
        <div className="container">
          <p>&copy; 2024 Ponnect - Australian Dog Parent Community. Proudly serving Queensland dog owners.</p>
        </div>
      </footer>
    </div>
  );
};

const headerStyle: React.CSSProperties = {
  backgroundColor: 'white',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  padding: '15px 0',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
};

const navContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const logoStyle: React.CSSProperties = {
  color: '#ff6b35',
  fontSize: '24px',
  fontWeight: 'bold',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
};

const navLinkStyle: React.CSSProperties = {
  color: '#2c3e50',
  fontWeight: 500,
  transition: 'color 0.3s',
};

const mainStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 150px)',
  padding: '40px 0',
};

const footerStyle: React.CSSProperties = {
  backgroundColor: '#2c3e50',
  color: 'white',
  padding: '20px 0',
  textAlign: 'center',
  marginTop: '40px',
};

export default Layout;
