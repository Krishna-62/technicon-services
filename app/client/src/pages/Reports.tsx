import { useEffect, useState } from 'react';
import { api, Company } from '../api';
import { HorizontalBarChart, GroupedBarChart } from '../components/BarChart';
import SearchableSelect from '../components/SearchableSelect';

type Tab = 'companies' | 'products' | 'review' | 'import' | 'lapsed' | 'trends';

export default function Reports() {
  const [tab, setTab] = useState<Tab>('companies');
  const [loadedTabs, setLoadedTabs] = useState<Set<Tab>>(new Set());
  const [loading, setLoading] = useState(false);

  const [companyRows, setCompanyRows] = useState<any[]>([]);
  const [companySearch, setCompanySearch] = useState('');
  const [productRows, setProductRows] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [reviewRows, setReviewRows] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [yearComparison, setYearComparison] = useState<{ years: string[]; products: any[] } | null>(null);
  const [error, setError] = useState('');

  // Import Data tab
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [importBatches, setImportBatches] = useState<any[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadYear, setUploadYear] = useState(String(new Date().getFullYear()));
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  // Lapsed Purchases tab
  const [lapsedMonths, setLapsedMonths] = useState(12);
  const [lapsedRows, setLapsedRows] = useState<any[]>([]);

  // Company Trends tab
  const [trendsCompany, setTrendsCompany] = useState('');
  const [trendsData, setTrendsData] = useState<{ products: any[]; years: string[]; rows: any[] } | null>(null);

  // Only fetch a tab's data the first time it's opened, so switching to Reports
  // doesn't fire six requests when the user only wants to look at one thing.
  useEffect(() => {
    if (loadedTabs.has(tab)) return;
    setLoading(true);
    const done = () => setLoading(false);
    setLoadedTabs((prev) => new Set(prev).add(tab));

    if (tab === 'companies') api.reports.companies().then(setCompanyRows).catch((e) => setError(e.message)).finally(done);
    else if (tab === 'products') api.reports.products().then(setProductRows).catch((e) => setError(e.message)).finally(done);
    else if (tab === 'review') api.reports.reviewQueue().then(setReviewRows).catch((e) => setError(e.message)).finally(done);
    else if (tab === 'lapsed') {
      api.settings.get().then((s) => {
        setLapsedMonths(s.default_lapse_months);
        return loadLapsed(s.default_lapse_months);
      }).catch((e) => setError(e.message)).finally(done);
    }
    else if (tab === 'trends') api.companies.list().then(setCompaniesList).catch((e) => setError(e.message)).finally(done);
    else if (tab === 'import') loadImportBatches().finally(done);
    else done();
  }, [tab]);

  function viewHistory(name: string) {
    setSelectedCompany(name);
    api.reports.companyHistory(name).then(setHistory).catch((e) => setError(e.message));
    api.reports.companyYearComparison(name).then(setYearComparison).catch((e) => setError(e.message));
  }

  function loadImportBatches() {
    return api.imports.list().then(setImportBatches).catch((e) => setError(e.message));
  }

  function loadLapsed(months: number) {
    return api.reports.lapsed(months).then(setLapsedRows).catch((e) => setError(e.message));
  }

  async function submitUpload() {
    if (!uploadFile) return setError('Choose a file first');
    setError('');
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await api.imports.upload(uploadFile, uploadYear);
      setUploadResult(result);
      setUploadFile(null);
      loadImportBatches();
      // Sales data changed — drop cached tabs so they refetch next time they're opened.
      setLoadedTabs(new Set(['import']));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  function loadTrends(company: string) {
    setTrendsCompany(company);
    if (!company) { setTrendsData(null); return; }
    api.reports.companyYearly(company).then(setTrendsData).catch((e) => setError(e.message));
  }

  const lapsedChartData = lapsedRows.slice(0, 15).map((r) => ({
    label: r.company_name,
    sublabel: r.product_description,
    value: r.total_revenue,
  }));

  const trendsChartData = trendsData
    ? trendsData.products.map((p) => ({
        category: p.product_description.length > 22 ? p.product_description.slice(0, 22) + '…' : p.product_description,
        series: trendsData.years.map((year) => ({
          name: year,
          value: trendsData.rows.find((r) => r.part_no === p.part_no && r.year === year)?.total || 0,
        })),
      }))
    : [];

  const yearComparisonChartData = yearComparison
    ? yearComparison.products.map((p) => ({
        category: p.product_description.length > 22 ? p.product_description.slice(0, 22) + '…' : p.product_description,
        series: yearComparison.years.map((year, i) => ({
          name: year,
          value: i === 0 ? p.older_total : p.newer_total ?? 0,
        })),
      }))
    : [];

  const droppedProducts = yearComparison && yearComparison.years.length === 2
    ? yearComparison.products.filter((p) => p.newer_total === 0)
    : [];

  const filteredCompanyRows = companySearch
    ? companyRows.filter((c) => c.company_name.toLowerCase().includes(companySearch.toLowerCase()))
    : companyRows;
  const filteredProductRows = productSearch
    ? productRows.filter(
        (p) =>
          p.product_description.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.part_no.toLowerCase().includes(productSearch.toLowerCase())
      )
    : productRows;

  return (
    <div>
      <h2>Reports</h2>
      {error && <div className="error">{error}</div>}

      <div className="toolbar">
        <div>
          <button className={`btn small ${tab === 'companies' ? '' : 'secondary'}`} onClick={() => setTab('companies')}>Companies</button>{' '}
          <button className={`btn small ${tab === 'products' ? '' : 'secondary'}`} onClick={() => setTab('products')}>Products</button>{' '}
          <button className={`btn small ${tab === 'lapsed' ? '' : 'secondary'}`} onClick={() => setTab('lapsed')}>Lapsed Purchases</button>{' '}
          <button className={`btn small ${tab === 'trends' ? '' : 'secondary'}`} onClick={() => setTab('trends')}>Company Trends</button>{' '}
          <button className={`btn small ${tab === 'review' ? '' : 'secondary'}`} onClick={() => setTab('review')}>
            Review Queue{loadedTabs.has('review') ? ` (${reviewRows.length})` : ''}
          </button>{' '}
          <button className={`btn small ${tab === 'import' ? '' : 'secondary'}`} onClick={() => setTab('import')}>Import Data</button>
        </div>
        {(tab === 'companies' || tab === 'products') && (
          <a className="btn secondary small" href={api.reports.exportUrl(tab)}>Export to Excel</a>
        )}
      </div>

      {loading && <p className="muted loading-text">Loading…</p>}

      {!loading && tab === 'companies' && (
        <div className="card">
          <input
            type="search"
            placeholder="Search companies…"
            value={companySearch}
            onChange={(e) => setCompanySearch(e.target.value)}
            style={{ maxWidth: 280, marginBottom: 14 }}
          />
          <div className="table-scroll">
            <table>
              <thead><tr><th>Company</th><th>Orders</th><th>Total Qty</th><th>Revenue</th><th></th></tr></thead>
              <tbody>
                {filteredCompanyRows.map((c) => (
                  <tr key={c.company_name}>
                    <td>{c.company_name}</td>
                    <td>{c.order_count}</td>
                    <td>{c.total_qty}</td>
                    <td>₹{Number(c.total).toLocaleString('en-IN')}</td>
                    <td><button className="btn small secondary" onClick={() => viewHistory(c.company_name)}>History</button></td>
                  </tr>
                ))}
                {filteredCompanyRows.length === 0 && <tr><td colSpan={5} className="muted">No matches.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'products' && (
        <div className="card">
          <input
            type="search"
            placeholder="Search products…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            style={{ maxWidth: 280, marginBottom: 14 }}
          />
          <div className="table-scroll">
            <table>
              <thead><tr><th>Part No</th><th>Description</th><th>Orders</th><th>Total Qty</th><th>Revenue</th></tr></thead>
              <tbody>
                {filteredProductRows.map((p) => (
                  <tr key={p.part_no}>
                    <td>{p.part_no}</td>
                    <td>{p.product_description}</td>
                    <td>{p.order_count}</td>
                    <td>{p.total_qty}</td>
                    <td>₹{Number(p.total).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {filteredProductRows.length === 0 && <tr><td colSpan={5} className="muted">No matches.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'review' && (
        <div className="card">
          <p className="muted">Rows imported from sales files with missing or inconsistent data. Review and correct in the source if needed.</p>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Date</th><th>Invoice</th><th>Company</th><th>Product</th><th>Reason</th></tr></thead>
              <tbody>
                {reviewRows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.sale_date || '-'}</td>
                    <td>{r.invoice_no || '-'}</td>
                    <td>{r.company_name || '-'}</td>
                    <td>{r.product_description || '-'}</td>
                    <td className="muted">{r.review_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'lapsed' && (
        <div className="card">
          <p className="muted">Company–product pairs with no purchase in the last N months, ranked by how much revenue they used to bring.</p>
          <div className="row" style={{ maxWidth: 300, alignItems: 'end' }}>
            <div className="field">
              <label>No purchase in the last (months)</label>
              <input type="number" min={1} value={lapsedMonths} onChange={(e) => setLapsedMonths(Number(e.target.value))} />
            </div>
            <button className="btn small" onClick={() => loadLapsed(lapsedMonths)}>Apply</button>
          </div>

          <h3 style={{ marginTop: 20 }}>Top 15 Lapsed Relationships</h3>
          <HorizontalBarChart data={lapsedChartData} />

          <div className="table-scroll" style={{ marginTop: 20 }}>
            <table>
              <thead><tr><th>Company</th><th>Product</th><th>Last Purchased</th><th>Months Since</th><th>Revenue Before Lapse</th></tr></thead>
              <tbody>
                {lapsedRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.company_name}</td>
                    <td>{r.product_description}</td>
                    <td>{r.last_purchase}</td>
                    <td>{r.months_since}</td>
                    <td>₹{Number(r.total_revenue).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {lapsedRows.length === 0 && <tr><td colSpan={5} className="muted">Nothing lapsed at this threshold.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === 'trends' && (
        <div className="card">
          <p className="muted">Purchases per product per year for a chosen company — a missing bar means a gap year.</p>
          <div className="field" style={{ maxWidth: 320 }}>
            <label>Company</label>
            <SearchableSelect
              options={companiesList.map((c) => ({ value: c.name, label: c.name }))}
              value={trendsCompany}
              onChange={loadTrends}
              placeholder="Search companies…"
            />
          </div>

          {trendsData && (
            <>
              <h3 style={{ marginTop: 20 }}>Top Products by Year</h3>
              <GroupedBarChart data={trendsChartData} seriesNames={trendsData.years} />

              <div className="table-scroll" style={{ marginTop: 20 }}>
                <table>
                  <thead><tr><th>Product</th>{trendsData.years.map((y) => <th key={y}>{y}</th>)}</tr></thead>
                  <tbody>
                    {trendsData.products.map((p) => (
                      <tr key={p.part_no}>
                        <td>{p.product_description}</td>
                        {trendsData.years.map((y) => {
                          const val = trendsData.rows.find((r) => r.part_no === p.part_no && r.year === y)?.total;
                          return <td key={y}>{val ? `₹${Number(val).toLocaleString('en-IN')}` : '-'}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {!loading && tab === 'import' && (
        <div className="card">
          <p className="muted">Upload a year's sales Excel file (same column layout as the original report) to add it to the database.</p>
          <div className="row" style={{ alignItems: 'end' }}>
            <div className="field">
              <label>Excel File</label>
              <input type="file" accept=".xlsx,.xls" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
            </div>
            <div className="field">
              <label>Year</label>
              <input value={uploadYear} onChange={(e) => setUploadYear(e.target.value)} />
            </div>
            <button className="btn small" onClick={submitUpload} disabled={uploading}>{uploading ? 'Importing…' : 'Import'}</button>
          </div>

          {uploadResult && (
            <div className="card" style={{ background: '#d9f2e3', marginTop: 16 }}>
              <strong>Import complete.</strong>{' '}
              {uploadResult.importedCount} rows imported, {uploadResult.skippedDuplicateCount} duplicates skipped,{' '}
              {uploadResult.flaggedCount} flagged for review, {uploadResult.companiesAdded} new companies,{' '}
              {uploadResult.productsAdded} new products.
            </div>
          )}

          <h3 style={{ marginTop: 20 }}>Import History</h3>
          <div className="table-scroll">
            <table>
              <thead><tr><th>File</th><th>Year</th><th>Imported At</th><th>Rows</th><th>Imported</th><th>Duplicates</th><th>Flagged</th></tr></thead>
              <tbody>
                {importBatches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.filename}</td>
                    <td>{b.year_label || '-'}</td>
                    <td>{b.imported_at}</td>
                    <td>{b.row_count}</td>
                    <td>{b.imported_count}</td>
                    <td>{b.skipped_duplicate_count}</td>
                    <td>{b.flagged_count}</td>
                  </tr>
                ))}
                {importBatches.length === 0 && <tr><td colSpan={7} className="muted">No imports yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCompany && yearComparison && yearComparison.years.length > 0 && (
        <div className="card">
          <h3>Products Bought — {yearComparison.years.join(' vs ')} — {selectedCompany}</h3>
          {yearComparison.years.length < 2 ? (
            <p className="muted">Only one year of data on file for this company. Import a second year (Reports → Import Data) to see a year-over-year comparison.</p>
          ) : (
            <>
              <p className="muted">
                Products purchased in {yearComparison.years[0]} vs {yearComparison.years[1]}, biggest drop-offs first — a short or missing {yearComparison.years[1]} bar means they didn't reorder it.
              </p>
              {droppedProducts.length > 0 && (
                <p className="muted">
                  <strong>{droppedProducts.length}</strong> product(s) bought in {yearComparison.years[0]} with nothing purchased in {yearComparison.years[1]}.
                </p>
              )}
            </>
          )}
          <GroupedBarChart data={yearComparisonChartData} seriesNames={yearComparison.years} />
        </div>
      )}

      {selectedCompany && (
        <div className="card">
          <h3>Purchase History — {selectedCompany}</h3>
          <div className="table-scroll">
            <table>
              <thead><tr><th>Date</th><th>Invoice</th><th>Part No</th><th>Description</th><th>Qty</th><th>Amount</th></tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{h.sale_date}</td>
                    <td>{h.invoice_no}</td>
                    <td>{h.part_no}</td>
                    <td>{h.product_description}</td>
                    <td>{h.qty}</td>
                    <td>₹{Number(h.total_amount).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
