import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, Company, Product, QuotationItem } from '../api';
import SearchableSelect from '../components/SearchableSelect';

function emptyItem(): QuotationItem {
  return { product_id: null, part_no: '', description: '', hsn_sac: '', qty: 1, price: 0 };
}

export default function QuotationNew() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [companyId, setCompanyId] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [taxPercent, setTaxPercent] = useState(18);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([emptyItem()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.companies.list().then(setCompanies);
    api.products.list().then(setProducts);
    api.settings.get().then((s) => setTaxPercent(s.default_tax_percent));
  }, []);

  function updateItem(idx: number, patch: Partial<QuotationItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function pickProductForItem(idx: number, partNo: string) {
    const p = products.find((pr) => pr.part_no === partNo);
    if (p) {
      updateItem(idx, {
        product_id: p.id,
        part_no: p.part_no,
        description: p.description,
        hsn_sac: p.hsn_sac || '',
        price: p.default_price,
      });
    } else {
      updateItem(idx, { product_id: null, part_no: partNo });
    }
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = items.reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.price || 0), 0);
  const taxAmount = subtotal * (taxPercent / 100);
  const total = subtotal + taxAmount;

  async function submit() {
    setError('');
    if (!companyId) return setError('Please select a company');
    if (items.length === 0 || items.some((it) => !it.description || !it.qty)) {
      return setError('Every line item needs a description and quantity');
    }
    setSaving(true);
    try {
      const created = await api.quotations.create({
        company_id: Number(companyId),
        date,
        tax_percent: taxPercent,
        notes,
        items,
      } as any);
      navigate(`/quotations/${created.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>New Quotation</h2>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="row">
          <div className="field">
            <label>Company</label>
            <SearchableSelect
              options={companies.map((c) => ({ value: String(c.id), label: c.name }))}
              value={companyId === '' ? '' : String(companyId)}
              onChange={(v) => setCompanyId(v ? Number(v) : '')}
              placeholder="Search companies…"
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Tax %</label>
            <input type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} />
          </div>
        </div>

        <label style={{ marginTop: 8 }}>Line Items</label>

        {items.map((it, idx) => (
          <div className="item-row" key={idx}>
            <div>
              {idx === 0 && <label>Description</label>}
              <input
                placeholder="Description"
                value={it.description}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
              />
            </div>
            <div>
              {idx === 0 && <label>Part No</label>}
              <SearchableSelect
                options={products.map((p) => ({ value: p.part_no, label: `${p.part_no} — ${p.description}` }))}
                value={it.part_no || ''}
                onChange={(v) => pickProductForItem(idx, v)}
                placeholder="Search part no…"
              />
            </div>
            <div>
              {idx === 0 && <label>HSN/SAC</label>}
              <input value={it.hsn_sac || ''} onChange={(e) => updateItem(idx, { hsn_sac: e.target.value })} />
            </div>
            <div>
              {idx === 0 && <label>Qty</label>}
              <input type="number" value={it.qty} onChange={(e) => updateItem(idx, { qty: Number(e.target.value) })} />
            </div>
            <div>
              {idx === 0 && <label>Price</label>}
              <input type="number" value={it.price} onChange={(e) => updateItem(idx, { price: Number(e.target.value) })} />
            </div>
            <div>
              <button className="btn small danger" onClick={() => removeItem(idx)} disabled={items.length === 1}>✕</button>
            </div>
          </div>
        ))}

        <button className="btn secondary small" onClick={addItem}>+ Add Line</button>

        <div className="field" style={{ marginTop: 16 }}>
          <label>Notes</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="totals">
          <div>Subtotal: ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div>Tax ({taxPercent}%): ₹{taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div><strong>Total: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
        </div>

        <button className="btn" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save Quotation'}</button>
      </div>
    </div>
  );
}
