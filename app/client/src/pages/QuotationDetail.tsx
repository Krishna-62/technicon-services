import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, PerformaInvoice, PurchaseOrder, Quotation, QuotationFollowUp } from '../api';

function formatDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function QuotationDetail() {
  const { id } = useParams();
  const quotationId = Number(id);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [pis, setPis] = useState<PerformaInvoice[]>([]);
  const [error, setError] = useState('');
  const [clientPoRef, setClientPoRef] = useState('');
  // Which single action is currently in flight ('sent' | 'accepted' | 'rejected' | 'po' | 'pi'),
  // or null when idle. Still just one shared in-flight slot (same safety property as the old
  // boolean `busy` — only one of these mutations can run at a time) but keyed so each button can
  // show its own accurate "Converting…"-style label instead of a generic disabled state.
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [followUps, setFollowUps] = useState<QuotationFollowUp[] | null>(null);
  const [followUpsError, setFollowUpsError] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpFormError, setFollowUpFormError] = useState('');
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpBusy, setFollowUpBusy] = useState<number | null>(null);
  const [followUpActionErrors, setFollowUpActionErrors] = useState<Record<number, string>>({});
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [outcome, setOutcome] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  function load() {
    api.quotations.get(quotationId).then(setQuotation).catch((e) => setError(e.message));
    api.purchaseOrders.list().then((all) => setPos(all.filter((p) => p.quotation_id === quotationId)));
    api.performaInvoices.list().then((all) => setPis(all.filter((p) => p.quotation_id === quotationId)));
  }

  function loadFollowUps() {
    setFollowUpsError('');
    api.quotations.followUps
      .list(quotationId)
      .then((data) => setFollowUps(data.followUps))
      .catch((e) => setFollowUpsError(e.message));
  }

  useEffect(() => {
    load();
    loadFollowUps();
  }, [quotationId]);

  async function setStatus(status: string) {
    if (busyAction) return;
    setBusyAction(status);
    setError('');
    try {
      await api.quotations.setStatus(quotationId, status);
      load();
      loadFollowUps();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyAction(null);
    }
  }

  async function createPO() {
    if (busyAction) return;
    setBusyAction('po');
    setError('');
    try {
      await api.purchaseOrders.create({ quotation_id: quotationId, client_po_ref: clientPoRef });
      load();
      loadFollowUps();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyAction(null);
    }
  }

  async function createFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUpDate) {
      setFollowUpFormError('Follow-up date is required');
      return;
    }
    setFollowUpFormError('');
    setFollowUpSubmitting(true);
    try {
      await api.quotations.followUps.create(quotationId, { follow_up_date: followUpDate, notes: followUpNotes });
      setFollowUpDate('');
      setFollowUpNotes('');
      loadFollowUps();
    } catch (e: any) {
      setFollowUpFormError(e.message);
    } finally {
      setFollowUpSubmitting(false);
    }
  }

  function openComplete(followUpId: number) {
    setCompletingId(followUpId);
    setOutcome('');
    setOutcomeNotes('');
    setFollowUpActionErrors((prev) => ({ ...prev, [followUpId]: '' }));
  }

  async function submitComplete(followUpId: number) {
    setFollowUpBusy(followUpId);
    try {
      await api.quotations.followUps.complete(quotationId, followUpId, { outcome, outcome_notes: outcomeNotes });
      setCompletingId(null);
      loadFollowUps();
    } catch (e: any) {
      setFollowUpActionErrors((prev) => ({ ...prev, [followUpId]: e.message }));
    } finally {
      setFollowUpBusy(null);
    }
  }

  async function cancelFollowUp(followUpId: number) {
    setFollowUpBusy(followUpId);
    try {
      await api.quotations.followUps.cancel(quotationId, followUpId);
      loadFollowUps();
    } catch (e: any) {
      setFollowUpActionErrors((prev) => ({ ...prev, [followUpId]: e.message }));
    } finally {
      setFollowUpBusy(null);
    }
  }

  async function createPI(poId?: number) {
    if (busyAction) return;
    setBusyAction('pi');
    setError('');
    try {
      await api.performaInvoices.create({ quotation_id: quotationId, purchase_order_id: poId });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyAction(null);
    }
  }

  if (!quotation) return <p className="muted loading-text">Loading…</p>;

  return (
    <div>
      <div className="toolbar">
        <h2 style={{ margin: 0 }}>{quotation.number}</h2>
        <a className="btn secondary" href={api.quotations.pdfUrl(quotationId)} target="_blank" rel="noreferrer">
          View PDF
        </a>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card">
        <div className="row">
          <div><strong>Company:</strong> {quotation.company_name}</div>
          <div><strong>Date:</strong> {quotation.date}</div>
          <div><strong>Status:</strong> <span className={`badge ${quotation.status}`}>{quotation.status}</span></div>
        </div>

        <table style={{ marginTop: 16 }}>
          <thead>
            <tr><th>Part No</th><th>Description</th><th>HSN/SAC</th><th>Qty</th><th>Price</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {quotation.items?.map((it) => (
              <tr key={it.id}>
                <td>{it.part_no || '-'}</td>
                <td>{it.description}</td>
                <td>{it.hsn_sac || '-'}</td>
                <td>{it.qty}</td>
                <td>₹{Number(it.price).toLocaleString('en-IN')}</td>
                <td>₹{Number(it.amount).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div>Subtotal: ₹{Number(quotation.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div>Tax ({quotation.tax_percent}%): ₹{Number(quotation.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div><strong>Total: ₹{Number(quotation.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>
        </div>

        <div style={{ marginTop: 16 }}>
          {quotation.status === 'draft' && (
            <button className="btn secondary small" disabled={busyAction !== null} onClick={() => setStatus('sent')}>
              {busyAction === 'sent' ? 'Marking as Sent…' : 'Mark as Sent'}
            </button>
          )}
          {(quotation.status === 'draft' || quotation.status === 'sent') && (
            <>
              {' '}
              <button className="btn secondary small" disabled={busyAction !== null} onClick={() => setStatus('accepted')}>
                {busyAction === 'accepted' ? 'Marking as Accepted…' : 'Mark as Accepted'}
              </button>{' '}
              <button className="btn danger small" disabled={busyAction !== null} onClick={() => setStatus('rejected')}>
                {busyAction === 'rejected' ? 'Marking as Rejected…' : 'Mark as Rejected'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Follow-Ups</h3>
        <p className="muted" style={{ marginTop: -10, marginBottom: 16 }}>
          Track customer follow-ups and record their responses.
        </p>

        {followUpsError && <div className="error">{followUpsError}</div>}

        {quotation.status === 'sent' && (
          <form className="follow-up-form" onSubmit={createFollowUp} style={{ marginBottom: 20 }}>
            <div className="row">
              <div className="field">
                <label>Follow-up Date</label>
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Notes (optional)</label>
                <textarea
                  rows={2}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="Call the procurement team. Check whether they reviewed the quotation."
                />
              </div>
            </div>
            {followUpFormError && <div className="error">{followUpFormError}</div>}
            <button className="btn small" type="submit" disabled={followUpSubmitting}>
              {followUpSubmitting ? 'Scheduling…' : 'Schedule Follow-Up'}
            </button>
          </form>
        )}

        {followUps === null ? (
          <p className="muted loading-text">Loading…</p>
        ) : followUps.length === 0 ? (
          <p className="muted">
            {quotation.status === 'sent' ? 'No follow-ups scheduled yet.' : 'No follow-up history for this quotation.'}
          </p>
        ) : (
          <div className="follow-up-list">
            {followUps.map((f) => (
              <div className="follow-up-item" key={f.id}>
                <div className="follow-up-meta">
                  <span className="follow-up-date">{formatDate(f.follow_up_date)}</span>
                  <span className={`badge ${f.status}`}>{f.status}</span>
                </div>

                {f.notes && <div className="follow-up-notes">{f.notes}</div>}

                {f.status === 'completed' && (
                  <div className="follow-up-outcome">
                    <div>
                      <strong>Outcome:</strong> {f.outcome || '-'}
                    </div>
                    {f.outcome_notes && <div>{f.outcome_notes}</div>}
                    {f.completed_at && <div className="muted">Completed {formatDate(f.completed_at)}</div>}
                  </div>
                )}

                {f.status === 'scheduled' && (
                  <div className="follow-up-actions">
                    <button
                      className="btn small secondary"
                      disabled={followUpBusy === f.id}
                      onClick={() => openComplete(f.id)}
                    >
                      Complete
                    </button>
                    <button
                      className="btn small danger"
                      disabled={followUpBusy === f.id}
                      onClick={() => cancelFollowUp(f.id)}
                    >
                      {followUpBusy === f.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                )}

                {followUpActionErrors[f.id] && (
                  <div className="error" style={{ marginTop: 8 }}>
                    {followUpActionErrors[f.id]}
                  </div>
                )}

                {completingId === f.id && (
                  <div className="follow-up-complete-form">
                    <div className="field">
                      <label>Outcome</label>
                      <input
                        value={outcome}
                        onChange={(e) => setOutcome(e.target.value)}
                        placeholder="responded, no response, requested more time..."
                      />
                    </div>
                    <div className="field">
                      <label>Outcome Notes (optional)</label>
                      <textarea rows={2} value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} />
                    </div>
                    <button className="btn small" disabled={followUpBusy === f.id} onClick={() => submitComplete(f.id)}>
                      {followUpBusy === f.id ? 'Completing…' : 'Save'}
                    </button>{' '}
                    <button
                      className="btn small secondary"
                      disabled={followUpBusy === f.id}
                      onClick={() => setCompletingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Purchase Orders</h3>
        {pos.length === 0 ? (
          <>
            <p className="muted">No purchase order yet.</p>
            <div className="row">
              <div className="field">
                <label>Client PO Reference (optional)</label>
                <input value={clientPoRef} onChange={(e) => setClientPoRef(e.target.value)} />
              </div>
            </div>
            <button className="btn small" disabled={busyAction !== null} onClick={createPO}>
              {busyAction === 'po' ? 'Converting…' : 'Convert to Purchase Order'}
            </button>
          </>
        ) : (
          <table>
            <thead><tr><th>Number</th><th>Date</th><th>Client PO Ref</th><th></th></tr></thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id}>
                  <td>{po.number}</td>
                  <td>{po.date}</td>
                  <td>{po.client_po_ref || '-'}</td>
                  <td><a className="btn small secondary" href={api.purchaseOrders.pdfUrl(po.id)} target="_blank" rel="noreferrer">PDF</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Performa Invoices</h3>
        {pis.length === 0 ? (
          <>
            <p className="muted">No performa invoice yet.</p>
            <button className="btn small" disabled={busyAction !== null} onClick={() => createPI(pos[0]?.id)}>
              {busyAction === 'pi' ? 'Generating…' : 'Generate Performa Invoice'}
            </button>
          </>
        ) : (
          <table>
            <thead><tr><th>Number</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {pis.map((pi) => (
                <tr key={pi.id}>
                  <td>{pi.number}</td>
                  <td>{pi.date}</td>
                  <td><a className="btn small secondary" href={api.performaInvoices.pdfUrl(pi.id)} target="_blank" rel="noreferrer">PDF</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
