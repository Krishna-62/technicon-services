import { useEffect, useState } from 'react';
import { api, type InactiveCustomersData } from '../api';
import { Pagination } from '../components/Pagination';

const PAGE_SIZE = 20;

function formatCurrency(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function InactiveCustomers() {
  const [data, setData] = useState<InactiveCustomersData | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.dashboard.inactiveCustomers().then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <p className="muted loading-text">Loading…</p>;

  const filtered = search
    ? data.customers.filter((c) => c.company_name.toLowerCase().includes(search.toLowerCase()))
    : data.customers;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <h2>Inactive Customers</h2>
      <p className="page-subtitle">Customers with no purchases in the last {data.months} months.</p>

      <div className="inactive-summary">
        <div className="inactive-summary-count">
          {data.count} Inactive Customer{data.count === 1 ? '' : 's'}
        </div>
        <div className="inactive-summary-hint">No purchases in the last {data.months} months.</div>
      </div>

      <input
        type="search"
        placeholder="Search inactive customers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ maxWidth: 280, marginBottom: 14 }}
      />

      <div className="card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Last Purchase</th>
                <th>Months Inactive</th>
                <th>Historical Revenue</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((c) => (
                <tr key={c.company_name}>
                  <td>{c.company_name}</td>
                  <td>{formatDate(c.last_purchase)}</td>
                  <td>{c.months_inactive} months</td>
                  <td>{formatCurrency(c.total_revenue)}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    No inactive customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
