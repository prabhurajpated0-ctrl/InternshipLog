import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span>🎓</span>
          <span>InternshipLog</span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/applications"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Applications
          </NavLink>
          <Link to="/applications/new" className="nav-btn-new">
            <span>+</span>
            <span>New Application</span>
          </Link>
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            📊 Dashboard
          </NavLink>
          <NavLink
            to="/applications"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={closeMenu}
          >
            📋 All Applications
          </NavLink>
          <Link
            to="/applications/new"
            className="nav-btn-new"
            onClick={closeMenu}
            style={{ textAlign: 'center', justifyContent: 'center' }}
          >
            + New Application
          </Link>
        </div>
      )}
    </nav>
  );
}
