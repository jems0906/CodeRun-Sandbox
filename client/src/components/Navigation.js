import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code2, BarChart3 } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="nav">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="nav-brand">
            <Code2 size={24} style={{ marginRight: '0.5rem', display: 'inline' }} />
            CodeRun Sandbox
          </Link>
          <ul className="nav-links">
            <li>
              <Link 
                to="/problems" 
                className={`nav-link ${isActive('/problems') ? 'active' : ''}`}
              >
                Problems
              </Link>
            </li>
            <li>
              <Link 
                to="/stats" 
                className={`nav-link ${isActive('/stats') ? 'active' : ''}`}
              >
                <BarChart3 size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
                Statistics
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;