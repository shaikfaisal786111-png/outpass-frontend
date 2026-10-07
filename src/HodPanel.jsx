import React, { useState, useEffect } from 'react';
import { api, setToken, getToken } from './api';

export default function HodPanel() {
  const [token, setLocalToken] = useState(getToken('HOD'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) fetchPendingRequests();
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/auth/login', { username, password, role: 'HOD' });
      const authToken = res.data.token;
      setToken('HOD', authToken);
      setLocalToken(authToken);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Invalid credentials.');
    }
  };

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/outpass/hod/pending');
      setRequests(res.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      await api.post(`/api/outpass/hod/${action}/${id}`);
      fetchPendingRequests();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} outpass.`);
    }
  };

  const handleLogout = () => {
    setToken('HOD', null);
    setLocalToken(null);
  };

  if (!token) {
    return (
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>HOD Sign In</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '10px' }}>
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px' }} />
          </div>
          <button type="submit" style={{ padding: '10px 15px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Sign In as HOD
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>HOD Approval Portal</h2>
        <button onClick={handleLogout} style={{ padding: '8px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Logout
        </button>
      </div>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No outpass requests pending HOD approval.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Student</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Reason</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Mentor Status</th>
              <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.student_name || req.student_id}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.reason}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', color: req.mentor_verified ? 'green' : 'orange' }}>
                  {req.mentor_verified ? '✓ Verified' : 'Pending'}
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <button onClick={() => handleAction(req.id, 'approve')} style={{ padding: '6px 12px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', marginRight: '8px' }}>
                    Approve
                  </button>
                  <button onClick={() => handleAction(req.id, 'reject')} style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px' }}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}