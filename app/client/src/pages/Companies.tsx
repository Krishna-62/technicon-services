import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Company } from '../api';
import { useAuth } from '../auth';
import { Pagination } from '../components/Pagination';
import { ExpandableSearch } from '../components/ExpandableSearch';

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

  const getInitials = (name: string) => {
    if (!name) return 'CO';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-6 flex flex-col gap-6 bg-[#101312] text-[#F5F7F4] min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="margin-0 text-[34px] font-medium tracking-[-.02em] leading-[1.05]">
            Companies
          </h1>
          <p className="margin-0 text-[13.5px] text-[#A5AEA8]">
            {companies.length} customer records and organizational accounts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...empty })}
          className="h-[34px] px-3.5 rounded-[9px] bg-transparent border border-[#3a4a1f] text-[#B8F23A] font-medium text-[12.5px] cursor-pointer hover:bg-[#1b2013] transition-colors"
        >
          + Add Company
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-[10px] border border-[#4a2a2a] bg-[#1b1414] text-[#E25757] text-[12.5px]">
          {error}
        </div>
      )}

      {/* Edit / New Modal Card */}
      {editing && (
        <section className="bg-[#171918] border border-[#292E2A] rounded-[16px] p-6 flex flex-col gap-4">
          <h3 className="margin-0 text-[18px] font-medium">
            {editing.id ? 'Edit Company' : 'New Company'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-[11px] text-[#6d756f] uppercase tracking-wider">
              NAME
              <input
                value={editing.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="h-[36px] px-3 rounded-[9px] bg-[#1D211E] border border-[#292E2A] text-[#F5F7F4] text-[13px] outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-[#6d756f] uppercase tracking-wider">
              STATE
              <input
                value={editing.state || ''}
                onChange={(e) => setEditing({ ...editing, state: e.target.value })}
                className="h-[36px] px-3 rounded-[9px] bg-[#1D211E] border border-[#292E2A] text-[#F5F7F4] text-[13px] outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-[#6d756f] uppercase tracking-wider md:col-span-2">
              ADDRESS
              <input
                value={editing.address || ''}
                onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                className="h-[36px] px-3 rounded-[9px] bg-[#1D211E] border border-[#292E2A] text-[#F5F7F4] text-[13px] outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-[#6d756f] uppercase tracking-wider">
              GSTIN
              <input
                value={editing.gstin || ''}
                onChange={(e) => setEditing({ ...editing, gstin: e.target.value })}
                className="h-[36px] px-3 rounded-[9px] bg-[#1D211E] border border-[#292E2A] text-[#F5F7F4] text-[13px] outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-[#6d756f] uppercase tracking-wider">
              CONTACT PERSON
              <input
                value={editing.contact_person || ''}
                onChange={(e) => setEditing({ ...editing, contact_person: e.target.value })}
                className="h-[36px] px-3 rounded-[9px] bg-[#1D211E] border border-[#292E2A] text-[#F5F7F4] text-[13px] outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-[#6d756f] uppercase tracking-wider">
              PHONE
              <input
                value={editing.phone || ''}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                className="h-[36px] px-3 rounded-[9px] bg-[#1D211E] border border-[#292E2A] text-[#F5F7F4] text-[13px] outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11px] text-[#6d756f] uppercase tracking-wider">
              EMAIL
              <input
                value={editing.email || ''}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="h-[36px] px-3 rounded-[9px] bg-[#1D211E] border border-[#292E2A] text-[#F5F7F4] text-[13px] outline-none"
              />
            </label>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              disabled={saving}
              className="h-[34px] px-4 rounded-[9px] bg-[#1D211E] border border-[#292E2A] text-[#A5AEA8] text-[12.5px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="h-[34px] px-4 rounded-[9px] bg-[#B8F23A] text-[#101312] font-bold text-[12.5px] cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Company'}
            </button>
          </div>
        </section>
      )}

      {/* Main Table Container Card */}
      <section className="bg-[#171918] border border-[#292E2A] rounded-[16px] p-[16px_18px_12px] flex flex-col gap-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 border-b border-[#20251f] pb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <ExpandableSearch
              value={query}
              onChange={setQuery}
              onSubmit={() => load(query)}
              placeholder="Search by company name..."
              ariaLabel="Search companies"
              maxWidth="280px"
            />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="h-[30px] px-2 rounded-[8px] bg-[#1D211E] border border-[#292E2A] text-[#F5F7F4] text-[12px] outline-none cursor-pointer"
            >
              <option value="">All States</option>
              {allStates.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {stateFilter && (
              <button
                type="button"
                onClick={() => setStateFilter('')}
                className="h-[30px] px-2.5 rounded-[8px] bg-[#1D211E] border border-[#292E2A] text-[#A5AEA8] text-[12px] cursor-pointer"
              >
                Clear
              </button>
            )}
            <span className="text-[11.5px] text-[#6d756f]">
              Showing {filteredCompanies.length} of {companies.length}
            </span>
          </div>
        </div>

        {/* Companies Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-[#20251f]">
                <th className="text-left p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  COMPANY
                </th>
                <th className="text-left p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  STATE
                </th>
                <th className="text-left p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  GSTIN
                </th>
                <th className="text-left p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  CONTACT
                </th>
                <th className="text-right p-[8px_10px] font-normal text-[11px] tracking-[.08em] text-[#6d756f] uppercase">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedCompanies.map((c) => (
                <tr key={c.id} className="border-b border-[#1a1f1c] hover:bg-[#1a1e1c] transition-colors">
                  <td className="p-[11px_10px]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-[8px] bg-[#1D211E] border border-[#2f362e] text-[#B8F23A] grid place-items-center text-[11px] font-bold shrink-0">
                        {getInitials(c.name)}
                      </span>
                      <span className="font-medium text-[#F5F7F4]">{c.name}</span>
                    </div>
                  </td>
                  <td className="p-[11px_10px] text-[#A5AEA8]">{c.state || '—'}</td>
                  <td className="p-[11px_10px] text-[#A5AEA8] font-mono text-[11.5px]">{c.gstin || '—'}</td>
                  <td className="p-[11px_10px] text-[#A5AEA8]">{c.phone || c.email || '—'}</td>
                  <td className="p-[11px_10px] text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/companies/${c.id}/health`}
                        className="text-[12px] text-[#B8F23A] hover:underline font-medium"
                      >
                        Health
                      </Link>
                      <button
                        type="button"
                        onClick={() => setEditing(c)}
                        disabled={deletingId === c.id}
                        className="text-[12px] text-[#A5AEA8] hover:text-[#F5F7F4] cursor-pointer"
                      >
                        Edit
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => remove(c.id)}
                          disabled={deletingId === c.id}
                          className="text-[12px] text-[#E25757] hover:underline cursor-pointer"
                        >
                          {deletingId === c.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#A5AEA8] text-[13px]">
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination Footer */}
      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
