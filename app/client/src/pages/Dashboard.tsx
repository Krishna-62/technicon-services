import { useEffect, useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type AttentionData,
  type DashboardData,
  type DashboardFollowUp,
  type DashboardFollowUpsData,
  type DraftQuotationSummary,
  type PipelineData,
  type PipelineStageKey,
  type RecentActivityItem,
} from '../api';
import { RevenueLineChart } from '../components/RevenueLineChart';
import { PipelineDonutChart } from '../components/PipelineDonutChart';
import { HorizontalBarChart } from '../components/HorizontalBarChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { QuoteIcon, PurchaseOrderIcon, InvoiceIcon } from '../components/icons';
import { ArrowRightIcon, CalendarIcon, PlusIcon, RefreshCwIcon, SparklesIcon, AlertCircleIcon, CheckCircle2Icon } from 'lucide-react';

function formatCurrency(n: number) {
  return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatMonth(m: string) {
  const [y, mo] = m.split('-');
  return `${MONTH_NAMES[Number(mo) - 1]} ${y}`;
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function FollowUpRow({ item }: { item: DashboardFollowUp }) {
  return (
    <Link
      className="flex items-center justify-between p-2.5 rounded-lg bg-[#171918] hover:bg-[#1D211E] transition-colors border border-[#292E2A]"
      to={`/quotations/${item.quotation_id}`}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-[#F5F7F4] truncate">{item.company_name || '—'}</span>
        <span className="text-[11px] text-[#A5AEA8]">
          {item.quotation_number} · Due: {formatDate(item.follow_up_date)}
        </span>
        {item.notes && <span className="text-[11px] text-[#A5AEA8] italic mt-0.5">"{item.notes}"</span>}
      </div>
      <span className="text-xs font-bold text-[#B8F23A] flex items-center gap-1 shrink-0 ml-2">
        View <ArrowRightIcon className="size-3" />
      </span>
    </Link>
  );
}

type ActivityType = 'quotation' | 'purchase_order' | 'performa_invoice';

const ACTIVITY_META: Record<ActivityType, { icon: ComponentType; to: (id: number) => string; label: string }> = {
  quotation: { icon: QuoteIcon, to: (id) => `/quotations/${id}`, label: 'Quotation' },
  purchase_order: { icon: PurchaseOrderIcon, to: () => '/purchase-orders', label: 'Purchase Order' },
  performa_invoice: { icon: InvoiceIcon, to: () => '/performa-invoices', label: 'Performa Invoice' },
};

const PIPELINE_STAGE_ROUTE: Record<PipelineStageKey, string> = {
  draft: '/quotations',
  sent: '/quotations',
  accepted: '/quotations',
  purchase_order: '/purchase-orders',
  performa_invoice: '/performa-invoices',
  lost: '/quotations',
};

// Widget Error Boundary Fallback Component
function WidgetErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 flex items-center justify-between gap-3 text-xs font-semibold">
      <span>{message}</span>
      <Button size="sm" variant="destructive" onClick={onRetry} className="h-7 text-xs gap-1 bg-red-800 hover:bg-red-700">
        <RefreshCwIcon className="size-3" /> Retry
      </Button>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  const [attention, setAttention] = useState<AttentionData | null>(null);
  const [attentionError, setAttentionError] = useState('');

  const [draftQuotations, setDraftQuotations] = useState<DraftQuotationSummary[] | null>(null);
  const [draftQuotationsTotal, setDraftQuotationsTotal] = useState(0);
  const [draftQuotationsError, setDraftQuotationsError] = useState('');

  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [pipelineError, setPipelineError] = useState('');

  const [followUps, setFollowUps] = useState<DashboardFollowUpsData | null>(null);
  const [followUpsError, setFollowUpsError] = useState('');

  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[] | null>(null);
  const [recentActivityError, setRecentActivityError] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = () => {
    setRefreshing(true);
    setError('');
    setAttentionError('');
    setDraftQuotationsError('');
    setPipelineError('');
    setFollowUpsError('');
    setRecentActivityError('');

    Promise.all([
      api.dashboard.get().then(setData),
      api.dashboard.attention().then(setAttention),
      api.dashboard.draftQuotations().then((draftData) => {
        setDraftQuotationsTotal(draftData.count);
        setDraftQuotations(draftData.quotations.slice(0, 5));
      }),
      api.dashboard.pipeline().then(setPipeline),
      api.dashboard.followUps().then(setFollowUps),
      api.dashboard.recentActivity().then((activityData) => setRecentActivity(activityData.activity)),
    ])
      .catch((e) => setError(e.message))
      .finally(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const monthlyChartData = data ? data.monthlyTrend.map((m) => ({ label: formatMonth(m.month), value: m.total })) : [];
  const topCompaniesChartData = data
    ? data.topCompanies.slice(0, 5).map((c) => ({ label: c.company_name, sublabel: `${c.orders} orders`, value: c.total }))
    : [];
  const topProductsChartData = data
    ? data.topProducts.slice(0, 5).map((p) => ({ label: p.product_description, sublabel: p.part_no, value: p.total }))
    : [];

  // Map pipeline stages with REJECTED status instead of lost
  const mappedStages = pipeline
    ? pipeline.stages.map((s) => ({
        ...s,
        label: s.key === 'lost' ? 'Rejected' : s.label,
      }))
    : [];

  const openPipelineStages = mappedStages.filter((s) => s.key !== 'lost');
  const openPipelineValue = openPipelineStages.reduce((sum, s) => sum + s.value, 0);
  const openPipelineCount = openPipelineStages.reduce((sum, s) => sum + s.count, 0);
  const acceptedValue = mappedStages.find((s) => s.key === 'accepted')?.value || 0;
  const acceptedRate = openPipelineValue > 0 ? Math.round((acceptedValue / openPipelineValue) * 100) : 0;

  return (
    <div className="dashboard-analytics-theme bg-[#101312] text-[#F5F7F4] min-h-screen p-4 md:p-6 -m-4 md:-m-6 flex flex-col gap-6">
      
      {/* 1. DARK TOP BAR & PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#F5F7F4] tracking-tight">Business Analytics</h1>
          <p className="text-xs text-[#A5AEA8] mt-0.5">Real-time view of revenue, quotations, customers and business performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllData}
            disabled={refreshing}
            className="h-9 border-[#292E2A] bg-[#171918] text-[#F5F7F4] hover:bg-[#1D211E] text-xs font-semibold gap-1.5"
          >
            <RefreshCwIcon className={`size-3.5 ${refreshing ? 'animate-spin text-[#B8F23A]' : 'text-[#A5AEA8]'}`} />
            <span>Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="h-9 border-[#292E2A] bg-[#171918] text-[#F5F7F4] hover:bg-[#1D211E] text-xs font-semibold gap-2">
            <CalendarIcon className="size-3.5 text-[#B8F23A]" />
            <span>Last 30 Days</span>
          </Button>
          <Button asChild size="sm" className="h-9 gap-2 font-bold bg-[#B8F23A] text-[#101312] hover:bg-[#D8F98D]">
            <Link to="/quotations/new">
              <PlusIcon className="size-4" />
              <span>+ New Quotation</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* 2. EXECUTIVE SUPPORTING KPI STRIP */}
      {error ? (
        <WidgetErrorState message="Unable to load summary metrics." onRetry={fetchAllData} />
      ) : !data ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl bg-[#171918]" />
          ))}
        </div>
      ) : (
        <div className="bg-[#171918] border border-[#292E2A] rounded-xl overflow-hidden shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#292E2A]">
          <div className="p-4 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-[#A5AEA8] uppercase tracking-wider">Historical Revenue</span>
            <span className="text-2xl font-extrabold text-[#F5F7F4] mt-0.5">{formatCurrency(data.historicalRevenue)}</span>
            <span className="text-[11px] text-[#A5AEA8] mt-0.5">2024 Closed Volume</span>
          </div>
          <div className="p-4 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-[#A5AEA8] uppercase tracking-wider">Accepted Revenue</span>
            <span className="text-2xl font-extrabold text-[#B8F23A] mt-0.5">{formatCurrency(data.acceptedQuotationRevenue)}</span>
            <span className="text-[11px] text-[#A5AEA8] mt-0.5">{data.counts.quotations} Active Proposals</span>
          </div>
          <div className="p-4 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-[#A5AEA8] uppercase tracking-wider">Open Quotations</span>
            <span className="text-2xl font-extrabold text-[#F5F7F4] mt-0.5">{data.counts.quotations}</span>
            <span className="text-[11px] text-[#A5AEA8] mt-0.5">{data.counts.companies} Client Accounts</span>
          </div>
          <div className="p-4 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-[#A5AEA8] uppercase tracking-wider">Purchase Orders</span>
            <span className="text-2xl font-extrabold text-[#F5F7F4] mt-0.5">{data.counts.purchaseOrders}</span>
            <span className="text-[11px] text-[#A5AEA8] mt-0.5">{data.counts.products} Catalog Items</span>
          </div>
        </div>
      )}

      {/* 3. ROW 1: REVENUE ANALYTICS CENTERPIECE (8 COLS) + CUSTOMER PERFORMANCE (4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue Analytics Primary Card (8 Cols) */}
        <Card className="lg:col-span-8 bg-[#171918] border-[#292E2A] text-[#F5F7F4] flex flex-col justify-between shadow-xl">
          <CardHeader className="p-5 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-[#F5F7F4]">Revenue Analytics</CardTitle>
                <CardDescription className="text-xs text-[#A5AEA8] mt-0.5">Revenue performance across the selected period.</CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-[#101312] p-1 rounded-lg border border-[#292E2A] text-xs font-semibold text-[#A5AEA8]">
                <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs font-bold bg-[#171918] text-[#B8F23A] shadow-2xs">This Month</Button>
                <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs text-[#A5AEA8] hover:text-[#F5F7F4]">This Quarter</Button>
                <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs text-[#A5AEA8] hover:text-[#F5F7F4]">This Year</Button>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-3xl font-extrabold text-[#F5F7F4] tracking-tight">{data ? formatCurrency(data.historicalRevenue) : '—'}</div>
              <div className="text-xs font-semibold text-[#A5AEA8] mt-0.5">Historical Revenue (2024 Closed Volume)</div>
            </div>
          </CardHeader>

          <CardContent className="p-5 pt-2">
            {!data ? (
              <Skeleton className="h-[240px] w-full rounded-lg bg-[#101312]" />
            ) : (
              <RevenueLineChart data={monthlyChartData} />
            )}
          </CardContent>
        </Card>

        {/* Customer Performance Card (4 Cols) */}
        <Card className="lg:col-span-4 bg-[#171918] border-[#292E2A] text-[#F5F7F4] flex flex-col justify-between shadow-xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-[#F5F7F4]">Customer Performance</CardTitle>
            <CardDescription className="text-xs text-[#A5AEA8] mt-0.5">Key accounts generating revenue.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {!data ? (
              <Skeleton className="h-44 w-full rounded-lg bg-[#101312]" />
            ) : (
              <HorizontalBarChart data={topCompaniesChartData} color="#B8F23A" />
            )}
          </CardContent>
        </Card>

      </div>

      {/* 4. ROW 2: CONVERSION FUNNEL (7 COLS) + KEY BUSINESS INSIGHTS (5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Quotation Pipeline Conversion Funnel (7 Cols) */}
        <Card className="lg:col-span-7 bg-[#171918] border-[#292E2A] text-[#F5F7F4] shadow-xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-[#F5F7F4]">Quotation Pipeline Funnel</CardTitle>
            <CardDescription className="text-xs text-[#A5AEA8] mt-0.5">Proposal conversion rate and stage distribution.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {pipelineError ? (
              <WidgetErrorState message="Unable to load pipeline." onRetry={() => api.dashboard.pipeline().then(setPipeline)} />
            ) : !pipeline ? (
              <Skeleton className="h-48 w-full rounded-lg bg-[#101312]" />
            ) : (
              <PipelineDonutChart stages={mappedStages} totalValue={openPipelineValue} acceptedRate={acceptedRate} />
            )}
          </CardContent>
        </Card>

        {/* Key Business Insights (5 Cols) */}
        <Card className="lg:col-span-5 bg-[#171918] border-[#292E2A] text-[#F5F7F4] shadow-xl flex flex-col justify-between">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-[#F5F7F4] flex items-center gap-2">
              <SparklesIcon className="size-4 text-[#B8F23A]" />
              <span>Key Business Insights</span>
            </CardTitle>
            <CardDescription className="text-xs text-[#A5AEA8] mt-0.5">Operational summary derived from active data.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0 space-y-3">
            {attention && attention.items.length > 0 && (
              <div className="p-3 rounded-lg bg-[#1D211E] border border-[#292E2A] flex items-start gap-3">
                <AlertCircleIcon className="size-4 text-[#E25757] mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#F5F7F4] block">{attention.items[0].title}</span>
                  <span className="text-[#A5AEA8] mt-0.5 block">{attention.items[0].description}</span>
                </div>
              </div>
            )}
            {data && (
              <div className="p-3 rounded-lg bg-[#1D211E] border border-[#292E2A] flex items-start gap-3">
                <CheckCircle2Icon className="size-4 text-[#B8F23A] mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#F5F7F4] block">{data.counts.companies} Active Client Accounts</span>
                  <span className="text-[#A5AEA8] mt-0.5 block">Generating {formatCurrency(data.acceptedQuotationRevenue)} in accepted proposal revenue.</span>
                </div>
              </div>
            )}
            {followUps && (
              <div className="p-3 rounded-lg bg-[#1D211E] border border-[#292E2A] flex items-start gap-3">
                <CalendarIcon className="size-4 text-[#708D31] mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-[#F5F7F4] block">{followUps.summary.totalScheduledCount} Scheduled Customer Follow-Ups</span>
                  <span className="text-[#A5AEA8] mt-0.5 block">{followUps.summary.overdueCount} overdue touchpoints requiring immediate action.</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* 5. ROW 3: FOLLOW-UPS & PRODUCT PERFORMANCE (6 COLS + 6 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Today's Scheduled Follow-Ups (6 Cols) */}
        <Card className="lg:col-span-6 bg-[#171918] border-[#292E2A] text-[#F5F7F4] shadow-xl">
          <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#F5F7F4]">Follow-Up Activity</CardTitle>
              <CardDescription className="text-xs text-[#A5AEA8] mt-0.5">Scheduled customer touchpoints.</CardDescription>
            </div>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs font-bold text-[#B8F23A] hover:bg-[#1D211E]">
              <Link to="/quotations">View All →</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {followUpsError ? (
              <WidgetErrorState message="Unable to load follow-ups." onRetry={() => api.dashboard.followUps().then(setFollowUps)} />
            ) : !followUps ? (
              <Skeleton className="h-36 w-full rounded-lg bg-[#101312]" />
            ) : followUps.summary.totalScheduledCount === 0 ? (
              <p className="text-xs text-[#A5AEA8] py-6 text-center">No scheduled follow-ups.</p>
            ) : (
              <div className="space-y-2">
                {followUps.overdue.slice(0, 3).map((f) => (
                  <FollowUpRow key={f.id} item={f} />
                ))}
                {followUps.dueToday.slice(0, 2).map((f) => (
                  <FollowUpRow key={f.id} item={f} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Product Performance Leaderboard (6 Cols) */}
        <Card className="lg:col-span-6 bg-[#171918] border-[#292E2A] text-[#F5F7F4] shadow-xl">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="text-base font-bold text-[#F5F7F4]">Product Performance</CardTitle>
            <CardDescription className="text-xs text-[#A5AEA8] mt-0.5">Best selling catalog items.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {!data ? (
              <Skeleton className="h-36 w-full rounded-lg bg-[#101312]" />
            ) : (
              <HorizontalBarChart data={topProductsChartData} color="#708D31" />
            )}
          </CardContent>
        </Card>

      </div>

      {/* 6. ROW 4: RECENT SYSTEM ACTIVITY TIMELINE (12 COLS) */}
      <Card className="bg-[#171918] border-[#292E2A] text-[#F5F7F4] shadow-xl">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold text-[#F5F7F4]">Recent System Activity</CardTitle>
          <CardDescription className="text-xs text-[#A5AEA8] mt-0.5">Operational audit log of recent transactions.</CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {recentActivityError ? (
            <WidgetErrorState message="Unable to load recent activity." onRetry={() => api.dashboard.recentActivity().then((d) => setRecentActivity(d.activity))} />
          ) : recentActivity === null ? (
            <Skeleton className="h-32 w-full rounded-lg bg-[#101312]" />
          ) : recentActivity.length === 0 ? (
            <p className="text-xs text-[#A5AEA8] py-4 text-center">No activity recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#292E2A] hover:bg-transparent">
                  <TableHead className="text-xs h-8 text-[#A5AEA8]">Document</TableHead>
                  <TableHead className="text-xs h-8 text-[#A5AEA8]">Account</TableHead>
                  <TableHead className="text-xs h-8 text-[#A5AEA8]">Status</TableHead>
                  <TableHead className="text-xs h-8 text-right text-[#A5AEA8]">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((item) => {
                  const meta = ACTIVITY_META[item.type];
                  return (
                    <TableRow key={`${item.type}-${item.id}`} className="border-[#292E2A] hover:bg-[#1D211E] cursor-pointer">
                      <TableCell className="py-2.5 text-xs font-bold text-[#F5F7F4]">
                        <Link to={meta.to(item.id)} className="hover:underline flex items-center gap-2 text-[#B8F23A]">
                          <span className="shrink-0"><meta.icon /></span>
                          <span>{item.number}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-[#A5AEA8]">{item.company_name || '—'}</TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="text-[10px] capitalize font-semibold border-[#292E2A] text-[#F5F7F4] bg-[#101312]">
                          {item.status === 'lost' ? 'rejected' : item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2.5 text-xs text-[#A5AEA8] text-right font-medium">{formatDate(item.date)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
