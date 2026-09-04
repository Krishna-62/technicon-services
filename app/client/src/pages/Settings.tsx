import { useEffect, useState } from 'react';
import { api, CompanySettings } from '../api';

export default function Settings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.settings.get().then(setSettings).catch((e) => setError(e.message));
  }, []);

  async function save() {
    if (!settings || saving) return;
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const updated = await api.settings.update(settings);
      setSettings(updated);
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) return <p className="muted loading-text">Loading…</p>;

  return (
    <div>
      <h2>Settings</h2>
      <p className="muted">This information appears on the letterhead of every generated Quotation, Purchase Order, and Performa Invoice.</p>
      {error && <div className="error">{error}</div>}
      {saved && <div className="card" style={{ background: '#d9f2e3', color: '#147a4a' }}>Saved.</div>}

      <div className="card">
        <div className="field">
          <label>Company Name</label>
          <input value={settings.company_name} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} />
        </div>
        <div className="field">
          <label>Address</label>
          <input value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
        </div>
        <div className="row">
          <div className="field">
            <label>GSTIN</label>
            <input value={settings.gstin} onChange={(e) => setSettings({ ...settings, gstin: e.target.value })} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
          </div>
        </div>
        <div className="field">
          <label>Bank Details</label>
          <textarea rows={2} value={settings.bank_details} onChange={(e) => setSettings({ ...settings, bank_details: e.target.value })} />
        </div>
        <div className="field">
          <label>Terms & Conditions</label>
          <textarea rows={4} value={settings.terms_conditions} onChange={(e) => setSettings({ ...settings, terms_conditions: e.target.value })} />
        </div>
        <div className="row">
          <div className="field">
            <label>Quotation Prefix</label>
            <input value={settings.quotation_prefix} onChange={(e) => setSettings({ ...settings, quotation_prefix: e.target.value })} />
          </div>
          <div className="field">
            <label>PO Prefix</label>
            <input value={settings.po_prefix} onChange={(e) => setSettings({ ...settings, po_prefix: e.target.value })} />
          </div>
          <div className="field">
            <label>PI Prefix</label>
            <input value={settings.pi_prefix} onChange={(e) => setSettings({ ...settings, pi_prefix: e.target.value })} />
          </div>
        </div>
        <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
      </div>
    </div>
  );
}
