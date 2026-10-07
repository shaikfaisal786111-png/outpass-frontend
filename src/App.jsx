import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StudentPortal from './StudentPortal';
import HodPanel from './HodPanel';
import GuardVerification from './GuardVerification';
import MentorPortal from './MentorPortal';
import { api, getToken, setToken } from './api';
import './App.css';

// --- SECURITY WRAPPER COMPONENT ---
// This acts as a locked door. It only shows the 'children' (the dashboard) if the correct PIN is entered.
const RequireRole = ({ children, roleName }) => {
  const sessionRole = () => { try { return JSON.parse(atob(getToken(roleName)?.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/'))).role; } catch { return null; } };
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
      const response = await api.post('/api/auth/login', { email: sanitizedEmail, password: sanitizedPassword });
      if (response.data.user.role !== roleName) throw new Error(`This account is not a ${roleName} account.`);
      setToken(roleName, response.data.token);
      setIsAuthenticated(true);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Unable to sign in.'); }
  };

  if (isAuthenticated && sessionRole() === roleName) {
    return children;
  }

  return (
    <main className="auth-page"><section className="auth-card">
      <p className="eyebrow">Azura Smart Outpass</p><h1>{roleName} sign in</h1><p>Use the account configured in the secure backend environment.</p>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={handleLogin} className="form-stack">
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoCapitalize="none" autoCorrect="off" spellCheck="false" /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoCapitalize="none" autoCorrect="off" spellCheck="false" /></label>
          <button type="submit">Sign in securely</button>
        </form>
    </section></main>
  );
};

// --- MAIN APP ROUTING ---
const App = () => {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          
          {/* PUBLIC ROUTE: Student Portal (No PIN required) */}
          <Route path="/" element={
            <StudentPortal />
          } />
          
          {/* PROTECTED ROUTE: HOD Dashboard */}
          <Route path="/hod" element={
            <RequireRole roleName="HOD"><HodPanel /></RequireRole>
          } />

          {/* PROTECTED ROUTE: Guard Verification */}
          <Route path="/guard" element={
            <RequireRole roleName="GUARD"><GuardVerification /></RequireRole>
          } />
          <Route path="/mentor" element={
            <RequireRole roleName="MENTOR"><MentorPortal /></RequireRole>
          } />

        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
