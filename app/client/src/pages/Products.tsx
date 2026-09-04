import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Product } from '../api';
import { useAuth } from '../auth';
import { Pagination } from '../components/Pagination';
import ProductImport from '../components/ProductImport';

const empty: Partial<Product> = { part_no: '', hsn_sac: '', description: '', unit: 'Nos', default_price: 0 };
const PAGE_SIZE = 20;

export default function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [partNoFilter, setPartNoFilter] = useState('');
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function load() {
    api.products.list().then(setProducts).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    setPage(1);
  }, [nameFilter, partNoFilter]);

  async function save() {
    if (!editing || saving) return;
    setError('');
    setSaving(true);
    try {
      if (editing.id) {
        await api.products.update(editing.id, editing);
      } else {
        await api.products.create(editing);
      }
      setEditing(null);
      load();
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
      await api.admin.deleteProduct(id);
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredProducts = useMemo(() => {
    const name = nameFilter.trim().toLowerCase();
    const partNo = partNoFilter.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!name || p.description.toLowerCase().includes(name)) &&
        (!partNo || p.part_no.toLowerCase().includes(partNo))
    );
  }, [products, nameFilter, partNoFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = useMemo(
    () => filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredProducts, currentPage]
  );

  const hasFilter = nameFilter || partNoFilter;

  return (
    <div>
      <h2>Products</h2>

      {error && <div className="error">{error}</div>}

      <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
        <a className="btn small secondary" href={api.products.templateUrl()}>Download Excel Template</a>{' '}
        <button className="btn secondary" onClick={() => { setShowImport(true); setEditing(null); }}>Upload / Import Excel</button>{' '}
        <button className="btn" onClick={() => { setEditing({ ...empty }); setShowImport(false); }}>+ Add Product</button>
      </div>

      <div className="filter-bar">
        <div className="field">
          <label>Product Name</label>
          <input placeholder="Filter by name…" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
        </div>
        <div className="field">
          <label>Part No</label>
          <input placeholder="Filter by part no…" value={partNoFilter} onChange={(e) => setPartNoFilter(e.target.value)} />
        </div>
        {hasFilter && (
          <button className="btn small secondary" onClick={() => { setNameFilter(''); setPartNoFilter(''); }} style={{ alignSelf: 'end' }}>
            Clear filters
          </button>
        )}
        <div className="filter-count muted">{filteredProducts.length} of {products.length} products</div>
      </div>

      {showImport && (
        <ProductImport onImported={() => { load(); }} onClose={() => setShowImport(false)} />
      )}

      {editing && (
        <div className="card">
          <h3>{editing.id ? 'Edit Product' : 'New Product'}</h3>
          <div className="row">
            <div className="field">
              <label>Part No</label>
              <input value={editing.part_no || ''} onChange={(e) => setEditing({ ...editing, part_no: e.target.value })} />
            </div>
            <div className="field">
              <label>HSN/SAC</label>
              <input value={editing.hsn_sac || ''} onChange={(e) => setEditing({ ...editing, hsn_sac: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </div>
          <div className="row">
            <div className="field">
              <label>Unit</label>
              <input value={editing.unit || 'Nos'} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
            </div>
            <div className="field">
              <label>Default Price</label>
              <input type="number" value={editing.default_price ?? 0} onChange={(e) => setEditing({ ...editing, default_price: Number(e.target.value) })} />
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
              <tr><th>Part No</th><th>Description</th><th>HSN/SAC</th><th>Unit</th><th>Price</th><th></th></tr>
            </thead>
            <tbody>
              {pagedProducts.map((p) => (
                <tr key={p.id}>
                  <td>{p.part_no}</td>
                  <td>{p.description}</td>
                  <td>{p.hsn_sac || '-'}</td>
                  <td>{p.unit}</td>
                  <td>₹{Number(p.default_price).toLocaleString('en-IN')}</td>
                  <td>
                    <Link className="btn small secondary" to={`/products/${p.id}/intelligence`}>Intelligence</Link>{' '}
                    <button className="btn small secondary" onClick={() => { setEditing(p); setShowImport(false); }} disabled={deletingId === p.id}>Edit</button>{' '}
                    {user?.role === 'admin' && (
                      <button className="btn small danger" onClick={() => remove(p.id)} disabled={deletingId === p.id}>
                        {deletingId === p.id ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && <tr><td colSpan={6} className="muted">No matches.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
