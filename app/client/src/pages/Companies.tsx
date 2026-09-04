import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Company } from '../api';
import { useAuth } from '../auth';
import { Pagination } from '../components/Pagination';

const empty: Partial<Company> = { name: '', address: '', state: '', gstin: '', contact_person: '', phone: '', email: '' };
const PAGE_SIZE = 20;

export default function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allStates, setAllStates] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [editing, setEditing] = useState<Partial<Company> | null>(null);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function load(q?: string) {
    api.companies.list(q).then(setCompanies).catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
    // Fetched once, unfiltered, so the state dropdown stays complete even after a name search narrows the table.
    api.companies.list().then((all) => {
      const states = Array.from(new Set(all.map((c) => c.state).filter((s): s is string => !!s))).sort();
      setAllStates(states);
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [companies, stateFilter]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    load(query);
  }

  async function save() {
    if (!editing || saving) return;
    setError('');
    setSaving(true);
    try {
      if (editing.id) {
        await api.companies.update(editing.id, editing);
      } else {
        await api.companies.create(editing);
      }
      setEditing(null);
      load(query);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (deletingId !== null) return;
    setError('');
    setDeletingId(id);
    try {
      await api.admin.deleteCompany(id);
      load(query);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredCompanies = useMemo(
    () => (stateFilter ? companies.filter((c) => c.state === stateFilter) : companies),
    [companies, stateFilter]
  );

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedCompanies = useMemo(
    () => filteredCompanies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredCompanies, currentPage]
  );

  return (
    <div>
      <h2>Companies</h2>

      {error && <div className="error">{error}</div>}

      <div className="toolbar">
        <form onSubmit={onSearch}>
          <input type="search" placeholder="Search companies…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>
        <button className="btn" onClick={() => setEditing({ ...empty })}>+ Add Company</button>
      </div>

      <div className="filter-bar">
        <div className="field">
          <label>State</label>
          <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
            <option value="">All states</option>
            {allStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {stateFilter && (
          <button className="btn small secondary" onClick={() => setStateFilter('')} style={{ alignSelf: 'end' }}>
            Clear filter
          </button>
        )}
        <div className="filter-count muted">{filteredCompanies.length} of {companies.length} companies</div>
      </div>

      {editing && (
        <div className="card">
          <h3>{editing.id ? 'Edit Company' : 'New Company'}</h3>
          <div className="row">
            <div className="field">
              <label>Name</label>
              <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="field">
              <label>State</label>
              <input value={editing.state || ''} onChange={(e) => setEditing({ ...editing, state: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Address</label>
            <input value={editing.address || ''} onChange={(e) => setEditing({ ...editing, address: e.target.value })} />
          </div>
          <div className="row">
            <div className="field">
              <label>GSTIN</label>
              <input value={editing.gstin || ''} onChange={(e) => setEditing({ ...editing, gstin: e.target.value })} />
            </div>
            <div className="field">
              <label>Contact Person</label>
              <input value={editing.contact_person || ''} onChange={(e) => setEditing({ ...editing, contact_person: e.target.value })} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label>Phone</label>
              <input value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </div>
          </div>
          <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>{' '}
          <button className="btn secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
        </div>
      )}

      <div className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Name</th><th>State</th><th>GSTIN</th><th>Phone</th><th></th></tr>
            </thead>
            <tbody>
              {pagedCompanies.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.state || '-'}</td>
                  <td>{c.gstin || '-'}</td>
                  <td>{c.phone || '-'}</td>
                  <td>
                    <Link className="btn small secondary" to={`/companies/${c.id}/health`}>Health</Link>{' '}
                    <button className="btn small secondary" onClick={() => setEditing(c)} disabled={deletingId === c.id}>Edit</button>{' '}
                    {user?.role === 'admin' && (
                      <button className="btn small danger" onClick={() => remove(c.id)} disabled={deletingId === c.id}>
                        {deletingId === c.id ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && <tr><td colSpan={5} className="muted">No matches.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
