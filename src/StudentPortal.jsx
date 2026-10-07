import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from './api';

const initial = { name: '', rollNo: '', destination: '', reason: '' };
const sessionKey = 'active_outpass_session';

export default function StudentPortal() {
  const [form, setForm] = useState(initial);
  const [reference, setReference] = useState(null);
  const [pass, setPass] = useState(null);
  const [message, setMessage] = useState('');

  const clearActiveRequest = useCallback((notice = '') => {
    localStorage.removeItem(sessionKey);
    setReference(null);
    setPass(null);
    setForm(initial);
    setMessage(notice);
  }, []);

  const loadStatus = useCallback(async (savedReference, { quiet = false } = {}) => {
    if (!savedReference?.id || !savedReference?.rollNo) return;
    try {
      const response = await api.get(`/api/outpass/status/${savedReference.id}`, { params: { rollNo: savedReference.rollNo } });
      const currentPass = response.data.data;
      if (currentPass.status === 'EXITED') return clearActiveRequest('Outpass completed / scanned successfully. You can now raise a new request.');
      if (currentPass.status === 'REJECTED') return clearActiveRequest(`Request rejected${currentPass.rejectNote ? `: ${currentPass.rejectNote}` : ''}. You can raise a new request.`);
      setReference(savedReference);
      setPass(currentPass);
      if (!quiet) setMessage(currentPass.status === 'APPROVED' ? 'Your QR pass is ready to show at the gate.' : 'Your request is waiting for Mentor and HOD verification.');
    } catch (error) {
      if (!quiet) setMessage(error.response?.data?.message || 'Could not retrieve this request. You can start a new request below.');
    }
  }, [clearActiveRequest]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(sessionKey));
      if (saved?.id && saved?.rollNo) loadStatus(saved);
    } catch { localStorage.removeItem(sessionKey); }
  }, [loadStatus]);

  useEffect(() => {
    if (!reference?.id || !reference?.rollNo) return undefined;
    const timer = window.setInterval(() => loadStatus(reference, { quiet: true }), 8000);
    return () => window.clearInterval(timer);
  }, [reference, loadStatus]);

  const submit = async (event) => {
    event.preventDefault(); setMessage('');
    try {
      const response = await api.post('/api/outpass/request', form);
      const savedReference = { id: response.data.data.id, rollNo: form.rollNo.trim() };
      localStorage.setItem(sessionKey, JSON.stringify(savedReference));
      setReference(savedReference); setForm(initial);
      await loadStatus(savedReference);
    } catch (error) { setMessage(error.response?.data?.message || 'Could not submit the request.'); }
  };

  return <main className="page student-page"><header className="hero"><p className="eyebrow">Campus movement, simplified</p><h1>Request an outpass</h1><p>Share where you are going and why. Your approved digital pass is ready to scan at the gate.</p></header><section className="two-column"><form onSubmit={submit} className="card form-stack"><div className="section-title"><span className="icon-orb">↗</span><div><p className="eyebrow">Quick request</p><h2>Plan your exit</h2></div></div>{message && <div className="alert">{message}</div>}<label>Full name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label><label>Roll number<input required value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} /></label><label>Destination<input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></label><label>Reason<textarea required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label><button disabled={Boolean(reference)}>Submit request <span>→</span></button>{reference && <p className="muted">An active request is already being tracked. Clear it only if it is invalid or no longer needed.</p>}</form><aside className="card status-card"><div className="section-title"><span className="icon-orb">▣</span><div><p className="eyebrow">Pass centre</p><h2>Your digital pass</h2></div></div><p>Your active request is safely restored after refresh.</p>{reference ? <><code>{reference.id}</code><p><strong>Roll number:</strong> {reference.rollNo}</p><button className="secondary" onClick={() => loadStatus(reference)}>Check status</button><button className="link" onClick={() => clearActiveRequest('Active request cleared. You can now raise a new request.')}>Cancel / New request</button></> : <p className="muted">Your request reference appears here after submission.</p>}{pass?.status === 'PENDING' && <div className="alert">Awaiting Mentor verification, then HOD approval.</div>}{pass?.qrToken && <div className="qr"><QRCodeSVG value={pass.qrToken} size={200} /><strong>Approved · show this QR code to the guard</strong><span>{pass.destination}</span></div>}</aside></section></main>;
}
