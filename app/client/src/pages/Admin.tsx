import { useEffect, useState } from 'react';
import { api, AdminUser } from '../api';
import { useAuth } from '../auth';

type Tab = 'users' | 'data' | 'config';

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('staff');
  const [resetTarget, setResetTarget] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [userActionId, setUserActionId] = useState<number | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Data
  const [importBatches, setImportBatches] = useState<any[]>([]);
  const [reviewRows, setReviewRows] = useState<any[]>([]);
  const [stats, setStats] = useState<{ counts: Record<string, number>; dbSizeBytes: number } | null>(null);

  // Config
  const [taxPercent, setTaxPercent] = useState(18);
  const [lapseMonths, setLapseMonths] = useState(12);
  const [savingConfig, setSavingConfig] = useState(false);

  function loadUsers() {
    api.admin.listUsers().then(setUsers).catch((e) => setError(e.message));
  }

  function loadData() {
    api.imports.list().then(setImportBatches).catch((e) => setError(e.message));
    api.reports.reviewQueue().then(setReviewRows).catch((e) => setError(e.message));
    api.admin.stats().then(setStats).catch((e) => setError(e.message));
  }

  function loadConfig() {
    api.admin.getConfig().then((c) => {
      setTaxPercent(c.default_tax_percent);
      setLapseMonths(c.default_lapse_months);
    }).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (tab === 'users') loadUsers();
    else if (tab === 'data') loadData();
    else if (tab === 'config') loadConfig();
  }, [tab]);

  async function createUser() {
    if (creatingUser) return;
    setError('');
    setCreatingUser(true);
    try {
      await api.admin.createUser({ username: newUsername, password: newPassword, role: newRole });
      setNewUsername('');
      setNewPassword('');
      setNewRole('staff');
      loadUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreatingUser(false);
    }
  }

  async function deleteUser(id: number) {
    if (userActionId !== null) return;
    setError('');
    setUserActionId(id);
    try {
      await api.admin.deleteUser(id);
      loadUsers();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUserActionId(null);
    }
  }

  async function submitResetPassword(id: number) {
    if (resettingPassword) return;
    setError('');
    setResettingPassword(true);
    try {
      await api.admin.resetPassword(id, resetPassword);
      setResetTarget(null);
      setResetPassword('');
      setNotice('Password updated.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResettingPassword(false);
    }
  }

  async function deleteImportBatch(id: number) {
    setError('');
    try {
      await api.admin.deleteImport(id);
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function dismissReview(id: number) {
    setError('');
    try {
      await api.admin.dismissReview(id);
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deleteReview(id: number) {
    setError('');
    try {
      await api.admin.deleteReview(id);
      loadData();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function saveConfig() {
    setError('');
    setSavingConfig(true);
    try {
      await api.admin.updateConfig({ default_tax_percent: taxPercent, default_lapse_months: lapseMonths });
      setNotice('Configuration saved.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingConfig(false);
    }
  }

  return (
    <div>
      <h2>Admin</h2>
      {error && <div className="error">{error}</div>}
      {notice && <div className="card" style={{ background: '#d9f2e3', color: '#147a4a' }}>{notice}</div>}

      <div className="toolbar">
        <div>
          <button className={`btn small ${tab === 'users' ? '' : 'secondary'}`} onClick={() => setTab('users')}>Users</button>{' '}
          <button className={`btn small ${tab === 'data' ? '' : 'secondary'}`} onClick={() => setTab('data')}>Data</button>{' '}
          <button className={`btn small ${tab === 'config' ? '' : 'secondary'}`} onClick={() => setTab('config')}>Configuration</button>
        </div>
      </div>

      {tab === 'users' && (
        <>
          <div className="card">
            <h3>Add User</h3>
            <div className="row" style={{ alignItems: 'end' }}>
              <div className="field">
                <label>Username</label>
                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="field">
                <label>Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button className="btn small" onClick={createUser} disabled={creatingUser}>{creatingUser ? 'Adding…' : 'Add'}</button>
            </div>
          </div>

          <div className="card">
            <div className="table-scroll">
              <table>
                <thead><tr><th>Username</th><th>Role</th><th>Created</th><th></th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.username}</td>
                      <td><span className={`badge ${u.role === 'admin' ? 'accepted' : 'draft'}`}>{u.role}</span></td>
                      <td>{u.created_at}</td>
                      <td>
                        <button
                          className="btn small secondary"
                          disabled={userActionId === u.id}
                          onClick={() => { setResetTarget(u.id); setResetPassword(''); }}
                        >
                          Reset Password
                        </button>{' '}
                        {u.id !== user?.id && (
                          <button className="btn small danger" disabled={userActionId === u.id} onClick={() => deleteUser(u.id)}>
                            {userActionId === u.id ? 'Deleting…' : 'Delete'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {resetTarget != null && (
            <div className="card">
              <h3>Reset Password</h3>
              <div className="row" style={{ alignItems: 'end' }}>
                <div className="field">
                  <label>New Password</label>
                  <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
                </div>
                <button className="btn small" onClick={() => submitResetPassword(resetTarget)} disabled={resettingPassword}>
                  {resettingPassword ? 'Saving…' : 'Save'}
                </button>
                <button className="btn small secondary" onClick={() => setResetTarget(null)} disabled={resettingPassword}>Cancel</button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'data' && (
        <>
          {stats && (
            <div className="stat-grid">
              {Object.entries(stats.counts).map(([table, count]) => (
                <div className="stat" key={table}>
                  <div className="label">{table.replace(/_/g, ' ')}</div>
                  <div className="value">{count}</div>
                </div>
              ))}
              <div className="stat">
                <div className="label">Database Size</div>
                <div className="value">{formatBytes(stats.dbSizeBytes)}</div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="toolbar">
              <h3 style={{ margin: 0 }}>Import Batches</h3>
              <a className="btn secondary small" href={api.admin.backupUrl()}>Download Backup</a>
            </div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>File</th><th>Year</th><th>Imported At</th><th>Rows</th><th>Imported</th><th></th></tr></thead>
                <tbody>
                  {importBatches.map((b) => (
                    <tr key={b.id}>
                      <td>{b.filename}</td>
                      <td>{b.year_label || '-'}</td>
                      <td>{b.imported_at}</td>
                      <td>{b.row_count}</td>
                      <td>{b.imported_count}</td>
                      <td><button className="btn small danger" onClick={() => deleteImportBatch(b.id)}>Delete</button></td>
                    </tr>
                  ))}
                  {importBatches.length === 0 && <tr><td colSpan={6} className="muted">No imports yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3>Review Queue</h3>
            <p className="muted">Resolve rows imported with missing/inconsistent data — dismiss to hide, or delete if the row is junk.</p>
            <div className="table-scroll">
              <table>
                <thead><tr><th>Date</th><th>Company</th><th>Product</th><th>Reason</th><th></th></tr></thead>
                <tbody>
                  {reviewRows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.sale_date || '-'}</td>
                      <td>{r.company_name || '-'}</td>
                      <td>{r.product_description || '-'}</td>
                      <td className="muted">{r.review_reason}</td>
                      <td>
                        <button className="btn small secondary" onClick={() => dismissReview(r.id)}>Dismiss</button>{' '}
                        <button className="btn small danger" onClick={() => deleteReview(r.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {reviewRows.length === 0 && <tr><td colSpan={5} className="muted">Review queue is empty.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'config' && (
        <div className="card">
          <h3>Defaults</h3>
          <div className="row">
            <div className="field">
              <label>Default Quotation Tax %</label>
              <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Default Lapsed-Purchases Window (months)</label>
              <input type="number" value={lapseMonths} onChange={(e) => setLapseMonths(Number(e.target.value))} />
            </div>
          </div>
          <button className="btn" onClick={saveConfig} disabled={savingConfig}>{savingConfig ? 'Saving…' : 'Save'}</button>
        </div>
      )}
    </div>
  );
}
