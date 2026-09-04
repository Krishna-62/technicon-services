import { useEffect, useRef, useState } from 'react';
import { api, type AiAskResponse, type AiChatMessage } from '../api';

function formatCurrency(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const EXAMPLE_QUESTIONS = [
  'What were our sales in 2024?',
  'Who were our top customers last year?',
  'Which products sold the most last year?',
  "Which customers haven't purchased in 90 days?",
  'How much business is currently in our quotation pipeline?',
  'What is our business health score?',
];

const MAX_HISTORY_MESSAGES = 20;

interface ChatEntry {
  role: 'user' | 'model';
  text: string;
  result?: AiAskResponse;
  isError?: boolean;
}

function ResultTable({ result }: { result: AiAskResponse }) {
  const { intent, data } = result;
  if (!intent || !data) return null;

  if (intent === 'inactive_customers' && Array.isArray(data.customers)) {
    if (data.customers.length === 0) return null;
    return (
      <table>
        <thead><tr><th>Company</th><th>Last Purchase</th><th>Total Revenue</th></tr></thead>
        <tbody>
          {data.customers.map((c: any, i: number) => (
            <tr key={i}><td>{c.company_name}</td><td>{formatDate(c.last_purchase)}</td><td>{formatCurrency(c.total_revenue)}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'top_products' && Array.isArray(data.products)) {
    if (data.products.length === 0) return null;
    return (
      <table>
        <thead><tr><th>Product</th><th>Revenue</th><th>Units</th><th>Customers</th></tr></thead>
        <tbody>
          {data.products.map((p: any, i: number) => (
            <tr key={i}><td>{p.product_description || p.part_no}</td><td>{formatCurrency(p.revenue)}</td><td>{p.units}</td><td>{p.customers}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'sales_by_product' && data.found && Array.isArray(data.products)) {
    return (
      <table>
        <thead><tr><th>Product</th><th>Part No</th><th>Revenue</th><th>Units</th><th>Orders</th></tr></thead>
        <tbody>
          {data.products.map((p: any, i: number) => (
            <tr key={i}><td>{p.product_description}</td><td>{p.part_no}</td><td>{formatCurrency(p.revenue)}</td><td>{p.units}</td><td>{p.orderCount}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'quotation_search' && Array.isArray(data.quotations)) {
    if (data.quotations.length === 0) return null;
    return (
      <table>
        <thead><tr><th>Quotation</th><th>Company</th><th>Date</th><th>Value</th><th>Status</th></tr></thead>
        <tbody>
          {data.quotations.map((q: any, i: number) => (
            <tr key={i}><td>{q.number}</td><td>{q.company_name}</td><td>{formatDate(q.date)}</td><td>{formatCurrency(q.total)}</td><td>{q.status}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'quotation_summary' && Array.isArray(data.byStatus)) {
    return (
      <table>
        <thead><tr><th>Status</th><th>Count</th><th>Value</th></tr></thead>
        <tbody>
          {data.byStatus.map((s: any) => (
            <tr key={s.status}><td>{s.status}</td><td>{s.count}</td><td>{formatCurrency(s.value)}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'awaiting_customer_response' && Array.isArray(data.quotations)) {
    if (data.quotations.length === 0) return null;
    return (
      <table>
        <thead><tr><th>Quotation</th><th>Company</th><th>Date</th><th>Value</th></tr></thead>
        <tbody>
          {data.quotations.map((q: any, i: number) => (
            <tr key={i}><td>{q.number}</td><td>{q.company_name}</td><td>{formatDate(q.date)}</td><td>{formatCurrency(q.total)}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if ((intent === 'purchase_order_summary' || intent === 'performa_invoice_summary')) {
    const rows = data.purchaseOrders || data.performaInvoices;
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return (
      <table>
        <thead><tr><th>Number</th><th>Company</th><th>Date</th><th>Value</th><th>Quotation</th></tr></thead>
        <tbody>
          {rows.map((r: any, i: number) => (
            <tr key={i}><td>{r.number}</td><td>{r.company_name}</td><td>{formatDate(r.date)}</td><td>{formatCurrency(r.total)}</td><td>{r.quotation_number}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'top_customers' && Array.isArray(data.customers)) {
    if (data.customers.length === 0) return null;
    return (
      <table>
        <thead><tr><th>Company</th><th>Revenue</th><th>Orders</th><th>Avg Order Value</th></tr></thead>
        <tbody>
          {data.customers.map((c: any, i: number) => (
            <tr key={i}><td>{c.company_name}</td><td>{formatCurrency(c.revenue)}</td><td>{c.orderCount}</td><td>{formatCurrency(c.avgOrderValue)}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'sales_summary') {
    return (
      <div className="stat-grid">
        <div className="stat"><div className="label">Revenue</div><div className="value">{formatCurrency(data.revenue)}</div></div>
        <div className="stat"><div className="label">Orders</div><div className="value">{data.orderCount}</div></div>
        <div className="stat"><div className="label">Avg Order Value</div><div className="value">{formatCurrency(data.avgOrderValue)}</div></div>
      </div>
    );
  }

  if (intent === 'revenue_comparison' && data.periodA && data.periodB) {
    return (
      <table>
        <thead><tr><th>Period</th><th>Revenue</th><th>Orders</th></tr></thead>
        <tbody>
          <tr><td>{data.periodA.label}</td><td>{formatCurrency(data.periodA.revenue)}</td><td>{data.periodA.orderCount}</td></tr>
          <tr><td>{data.periodB.label}</td><td>{formatCurrency(data.periodB.revenue)}</td><td>{data.periodB.orderCount}</td></tr>
        </tbody>
      </table>
    );
  }

  if (intent === 'sales_by_customer' && data.found) {
    return (
      <div>
        <div className="stat-grid">
          <div className="stat"><div className="label">Revenue</div><div className="value">{formatCurrency(data.revenue)}</div></div>
          <div className="stat"><div className="label">Orders</div><div className="value">{data.orderCount}</div></div>
          <div className="stat"><div className="label">Last Order</div><div className="value">{data.lastOrderDate ? formatDate(data.lastOrderDate) : '—'}</div></div>
        </div>
        {Array.isArray(data.products) && data.products.length > 0 && (
          <table>
            <thead><tr><th>Product</th><th>Revenue</th><th>Units</th></tr></thead>
            <tbody>
              {data.products.map((p: any, i: number) => (
                <tr key={i}><td>{p.product_description || p.part_no}</td><td>{formatCurrency(p.revenue)}</td><td>{p.units}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (intent === 'customer_summary' && data.found) {
    return (
      <div>
        <div className="stat-grid">
          <div className="stat"><div className="label">Health</div><div className="value">{data.health.label}</div></div>
          <div className="stat"><div className="label">Total Revenue</div><div className="value">{formatCurrency(data.sales.totalRevenue)}</div></div>
          <div className="stat"><div className="label">Orders</div><div className="value">{data.sales.orderCount}</div></div>
          <div className="stat"><div className="label">Quotations</div><div className="value">{data.quotations.count} ({formatCurrency(data.quotations.totalValue)})</div></div>
          <div className="stat"><div className="label">Pending Follow-Ups</div><div className="value">{data.pendingFollowUps}</div></div>
        </div>
      </div>
    );
  }

  if (intent === 'follow_up_summary' && Array.isArray(data.followUps)) {
    if (data.followUps.length === 0) return null;
    return (
      <table>
        <thead><tr><th>Company</th><th>Quotation</th><th>Follow-Up Date</th><th>Notes</th></tr></thead>
        <tbody>
          {data.followUps.map((f: any, i: number) => (
            <tr key={i}><td>{f.company_name}</td><td>{f.quotation_number}</td><td>{formatDate(f.follow_up_date)}</td><td>{f.notes || '—'}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'product_performance' && Array.isArray(data.products)) {
    if (data.products.length === 0) return null;
    return (
      <table>
        <thead><tr><th>Product</th><th>Revenue</th><th>Units Sold</th><th>Quoted Lines</th><th>Trend</th></tr></thead>
        <tbody>
          {data.products.map((p: any, i: number) => (
            <tr key={i}><td>{p.description || p.part_no}</td><td>{formatCurrency(p.revenue)}</td><td>{p.unitsSold}</td><td>{p.quotedLineCount}</td><td>{p.trendDirection?.replace('_', ' ')}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'business_health_summary' && data.components) {
    return (
      <div>
        <div className="stat-grid">
          <div className="stat"><div className="label">Overall Score</div><div className="value">{data.overallScore ?? '—'}</div></div>
          {Object.values(data.components).map((c: any) => (
            <div className="stat" key={c.label}><div className="label">{c.label}</div><div className="value">{c.score ?? '—'}</div></div>
          ))}
        </div>
      </div>
    );
  }

  if (intent === 'customer_health_summary' && Array.isArray(data.customers)) {
    if (data.customers.length === 0) return null;
    return (
      <table>
        <thead><tr><th>Company</th><th>Status</th><th>Total Revenue</th><th>Last Order</th></tr></thead>
        <tbody>
          {data.customers.map((c: any, i: number) => (
            <tr key={i}><td>{c.company_name}</td><td>{c.label}</td><td>{formatCurrency(c.totalRevenue)}</td><td>{c.lastOrderDate ? formatDate(c.lastOrderDate) : '—'}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'growth_opportunities_summary' && Array.isArray(data.opportunities)) {
    if (data.opportunities.length === 0) return null;
    return (
      <table>
        <thead><tr><th>Company</th><th>Type</th><th>Priority</th><th>Title</th></tr></thead>
        <tbody>
          {data.opportunities.map((o: any, i: number) => (
            <tr key={i}><td>{o.company_name}</td><td>{o.type?.replace(/_/g, ' ')}</td><td>{o.priority}</td><td>{o.title}</td></tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (intent === 'pipeline_value' && Array.isArray(data.stages)) {
    return (
      <div>
        <div className="stat-grid">
          <div className="stat"><div className="label">Pipeline Value</div><div className="value">{formatCurrency(data.summary?.totalValue)}</div></div>
          <div className="stat"><div className="label">Open Opportunities</div><div className="value">{data.summary?.totalOpportunities} quotations</div></div>
        </div>
        <table>
          <thead><tr><th>Stage</th><th>Count</th><th>Value</th></tr></thead>
          <tbody>
            {data.stages.map((s: any) => (
              <tr key={s.key}><td>{s.label}</td><td>{s.count}</td><td>{formatCurrency(s.value)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return null;
}

function groundingLine(result: AiAskResponse) {
  const p = result.meta?.params || {};
  const bits: string[] = [];
  const di = p.dateInfo || p;
  if (di?.startDate && di?.endDate) bits.push(di.label ? di.label : `${formatDate(di.startDate)} – ${formatDate(di.endDate)}`);
  else if (di?.label) bits.push(di.label);
  if (p.months) bits.push(`${p.months}+ months inactive`);
  if (p.minValue) bits.push(`≥ ${formatCurrency(p.minValue)}${p.maxValue ? ` and ≤ ${formatCurrency(p.maxValue)}` : ''}`);
  if (bits.length === 0) return null;
  return bits.join(' · ');
}

export default function AskTechnicon({ embedded = false }: { embedded?: boolean }) {
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, asking]);

  async function ask(q?: string) {
    const finalQuestion = (q ?? question).trim();
    if (!finalQuestion || asking) return;

    const historyForApi: AiChatMessage[] = messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, { role: 'user', text: finalQuestion }]);
    setQuestion('');
    setAsking(true);
    try {
      const res = await api.ai.ask(finalQuestion, historyForApi);
      setMessages((prev) => [...prev, { role: 'model', text: res.answer, result: res }]);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: 'model', text: e.message || 'The assistant is unavailable right now. Please try again.', isError: true }]);
    } finally {
      setAsking(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    ask();
  }

  const body = (
    <>
      {messages.length > 0 && (
        <div className="ai-messages" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-message ${m.role}${m.isError ? ' ai-message-error' : ''}`}>
              <div className="ai-message-bubble">{m.text}</div>
              {m.role === 'model' && m.result && (
                <>
                  {m.result.intent && groundingLine(m.result) && <div className="muted ai-message-grounding">Based on: {groundingLine(m.result)}</div>}
                  <div className="table-scroll ai-message-result"><ResultTable result={m.result} /></div>
                </>
              )}
            </div>
          ))}
          {asking && (
            <div className="ai-message model">
              <div className="ai-message-bubble ai-thinking-bubble"><span /><span /><span /></div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="e.g. What were our sales in 2024?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={asking}
          style={{ flex: 1 }}
        />
        <button className="btn" type="submit" disabled={asking || !question.trim()}>
          {asking ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      {messages.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {EXAMPLE_QUESTIONS.map((q) => (
            <button key={q} className="btn small secondary" type="button" disabled={asking} onClick={() => ask(q)}>
              {q}
            </button>
          ))}
        </div>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <div className="card">
      <h3>✨ Ask TECHNICON</h3>
      <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
        Ask a question about your business data — customers, quotations, products, revenue, follow-ups.
      </p>
      {body}
    </div>
  );
}
