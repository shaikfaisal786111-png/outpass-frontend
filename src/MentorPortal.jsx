import React, { useState, useEffect } from 'react';
import { api } from './api';

export default function MentorPortal() {
  const [token, setToken] = useState(localStorage.getItem('mentor_token') || localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (token) {
      fetchPendingOutpasses();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role: 'MENTOR'
      });

      const data = response.data;

      if (data.user?.role !== 'MENTOR') {
        throw new Error('Access denied. Mentor privileges required.');
      }

      localStorage.setItem('mentor_token', data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mentor_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setOutpasses([]);
  };

  const fetchPendingOutpasses = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/mentor/outpasses', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      const items = Array.isArray(data) ? data : (data.outpasses || data.data || []);
      setOutpasses(items);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch outpasses.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id) => {
    setActionLoading(id);
    setError('');
    try {
      await api.put(`/api/mentor/outpasses/${id}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOutpasses((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server verification failed.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!token) {
    return (
      <main className="page flex-center">
        <section className="card auth-card">
          <div className="card-header">
            <p className="eyebrow">Faculty Access</p>
            <h1>Mentor Portal Login</h1>
            <p>Sign in to review and verify student outpass requests.</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Mentor Email</label>
              <input
                id="email"
                type="email"
                placeholder="mentor@cmrec.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In as Mentor'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Parent Confirmation</p>
          <h1>Mentor Verification Queue</h1>
          <p>Verify that a parent has been contacted before forwarding the outpass to the HOD.</p>
        </div>
        <button className="secondary-btn" onClick={handleLogout}>
          Sign Out
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="card table-wrap">
        <div className="table-heading">
          <div>
            <p className="eyebrow">Pending Queue</p>
            <h2>Unverified Outpasses</h2>
          </div>
          <button className="secondary-btn" onClick={fetchPendingOutpasses} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh Queue'}
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Destination</th>
              <th>Reason</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {outpasses.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.student?.name || item.studentName || 'Student'}</strong>
                  <br />
                  <small className="muted">{item.student?.rollNo || item.rollNo}</small>
                </td>
                <td>{item.destination}</td>
                <td>{item.reason}</td>
                <td>
                  <button
                    className="primary-btn"
                    disabled={actionLoading === item.id}
                    onClick={() => handleVerify(item.id)}
                  >
                    {actionLoading === item.id ? 'Verifying…' : 'Verify (Parents Called)'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && outpasses.length === 0 && (
          <p className="empty-msg">No outpass requests are awaiting mentor verification.</p>
        )}
      </section>
    </main>
  );
}