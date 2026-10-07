import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StudentPortal from './StudentPortal';
import HodPanel from './HodPanel';
import GuardVerification from './GuardVerification';
import MentorPortal from './MentorPortal';
import { api, getToken, setToken } from './api';
import './App.css';

// --- SECURITY WRAPPER COMPONENT ---
const RequireRole = ({ children, roleName }) => {
  const sessionRole = () => {
    try {
      const token = getToken(roleName);
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.role || null;
    } catch {
      return null;
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionRole() === roleName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();
    setError('');
    try {
      const response = await api.post('/api/auth/login', {
        email: sanitizedEmail,
        password: sanitizedPassword
      });
      
      const userRole = response.data?.user?.role;
      if (userRole !== roleName) {
        throw new Error(`This account does not have ${roleName} access.`);
      }

      setToken(roleName, response.data.token);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to sign in.');
    }
  };

  if (isAuthenticated && sessionRole() === roleName) {
    return children;
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Azura Smart Outpass</p>
        <h1>{roleName} Sign In</h1>
        <p>Use the account configured in the secure backend environment.</p>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleLogin} className="form-stack">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </label>
          <button type="submit">Sign in securely</button>
        </form>
      </section>
    </main>
  );
};

// --- MAIN APP ROUTING ---
const App = () => {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          {/* PUBLIC ROUTE: Student Portal */}
          <Route path="/" element={<StudentPortal />} />

          {/* PROTECTED ROUTE: HOD Dashboard */}
          <Route
            path="/hod"
            element={
              <RequireRole roleName="HOD">
                <HodPanel />
              </RequireRole>
            }
          />

          {/* PROTECTED ROUTE: Guard Verification */}
          <Route
            path="/guard"
            element={
              <RequireRole roleName="GUARD">
                <GuardVerification />
              </RequireRole>
            }
          />

          {/* PROTECTED ROUTE: Mentor Verification */}
          <Route
            path="/mentor"
            element={
              <RequireRole roleName="MENTOR">
                <MentorPortal />
              </RequireRole>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
