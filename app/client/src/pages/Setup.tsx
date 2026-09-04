import { useState } from 'react';
import { useAuth } from '../auth';

export default function Setup() {
  const { setup } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setBusy(true);
    try {
      await setup(username, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="card auth-card" onSubmit={submit}>
        <div className="brand auth-brand">
          <div className="brand-mark">TS</div>
          <div className="brand-text-dark">
            TECHNICON
            <span>SERVICES</span>
          </div>
        </div>
        <h2 style={{ marginBottom: 4 }}>Create the admin account</h2>
        <p className="muted" style={{ marginBottom: 18 }}>
          No accounts exist yet. Set up the first admin account to start using the app.
        </p>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Confirm Password</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Creating…' : 'Create Admin Account'}
        </button>
      </form>
    </div>
  );
}
