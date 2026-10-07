import React, { useRef, useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { api } from './api';
export default function GuardVerification() {
  const [scanning, setScanning] = useState(true); const [token, setToken] = useState(''); const [result, setResult] = useState(null);
  const verifying = useRef(false);
  const verify = async (value) => { if (!value || verifying.current) return; verifying.current = true; setScanning(false); try { const response = await api.post('/api/guard/verify', { token: value.trim() }); setResult({ ok: true, text: response.data.message, data: response.data.data }); } catch (error) { setResult({ ok: false, text: error.response?.data?.message || 'Verification failed.' }); } };
  const reset = () => { verifying.current = false; setScanning(true); setToken(''); setResult(null); };
  return <main className="page guard-page"><header className="hero"><p className="eyebrow">Security checkpoint</p><h1>Verify an outpass</h1><p>Each approved QR code is signed, time-limited, and accepted only once.</p></header><section className="card scanner-card">{scanning ? <><QrReader onResult={(scan) => scan?.text && verify(scan.text)} constraints={{ facingMode: 'environment' }} containerStyle={{ width: '100%' }} /><p className="scan-label">Camera scanning active</p><div className="manual"><input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste QR token for manual verification" /><button onClick={() => verify(token)}>Verify</button></div></> : <div className={result?.ok ? 'verification valid' : 'verification denied'}><p className="eyebrow">{result?.ok ? 'Access granted' : 'Access denied'}</p><h2>{result?.text}</h2>{result?.data && <p>{result.data.name} · {result.data.rollNo}<br />Destination: {result.data.destination}</p>}<button onClick={reset}>Scan next pass</button></div>}</section></main>;
}
