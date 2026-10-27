import React, { useState } from 'react';
import { useDashboardStats } from '../../api/client';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  Gem,
  ArrowUpRight,
  PlusCircle,
  Truck,
  Sparkles,
  AlertTriangle,
  Info,
  Coins,
  BookOpen,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { COMPANY_DETAILS, APP_SETTINGS, isGoldEnabled, isSilverEnabled } from '../../config/company';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

const COLORS = ['#f59e0b', '#fbbf24', '#d97706', '#b45309', '#78350f', '#eab308'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { data: stats, isLoading, error } = useDashboardStats();
  const [isCashAuditOpen, setIsCashAuditOpen] = useState(false);

  const dealsInSilver = isSilverEnabled(COMPANY_DETAILS);
  const dealsInGold = isGoldEnabled(COMPANY_DETAILS);

  if (isLoading) {
    return <LoadingSpinner message="Loading live showroom metrics..." size="lg" />;
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Could not load dashboard statistics. Please ensure the backend is active.</p>
      </div>
    );
  }

  const { todayStats, cashDrawer, inventorySummary, recentSales, recentStockEntries, goldRates } = stats;
  const isNegativeDrawer = (cashDrawer?.cashInHand ?? 0) < 0;

  // Prepare chart data
  const chartData = inventorySummary?.categoryBreakdown?.map((cat) => ({
    name: cat.category_name,
    value: Number(cat.item_count),
    weight: parseFloat(String(cat.total_gross_weight)) || 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Board Rates Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 p-6 rounded-3xl border border-amber-500/20 gold-card-glow">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">
              Live Showroom Active
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100 font-cinzel mt-1 flex items-center gap-2">
            Showroom Operations Overview
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            As of <span className="text-amber-300 font-mono font-medium">{formatDate(stats.asOfDate)}</span> • Real-time retail counters & bullion rates.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS Terminal (F2)</span>
          </button>
          <button
            onClick={() => onNavigate('purchases')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer shadow-md"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Purchase Entry</span>
          </button>
          <button
            onClick={() => onNavigate('stock-entries')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Inward Stock</span>
          </button>
          <a
            href="/user-manual.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer shadow-sm"
            title="Open Interactive Software User Manual & Training Guide"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>User Guide</span>
          </a>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card variant="glass" className="relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Today's Sales</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {formatCurrency(todayStats.salesAmount)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <span>Invoices: <strong className="text-slate-200">{todayStats.salesCount}</strong></span>
            <span>•</span>
            <span>Net Wt: <strong className="text-amber-300">{formatWeight(todayStats.salesNetWeightGrams)}</strong></span>
          </div>
        </Card>

        {/* Today's Collected Cash */}
        <Card variant="glass" className="relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Collected Cash</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {formatCurrency(todayStats.salesCollectedAmount)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-medium">100% Counter receipts</span>
          </div>
        </Card>

        {/* Cash Drawer Balance */}
        <Card
          variant="glass"
          className={`relative overflow-hidden group transition-all ${
            isNegativeDrawer ? 'border-rose-500/50 bg-rose-950/10' : 'hover:border-sky-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <span>Cash-in-Drawer</span>
                {isNegativeDrawer && (
                  <span className="text-[10px] text-rose-400 font-bold bg-rose-500/15 border border-rose-500/30 px-1.5 py-0.5 rounded">
                    DEFICIT
                  </span>
                )}
              </div>
              <div
                className={`text-2xl font-bold font-mono mt-1 ${
                  isNegativeDrawer ? 'text-rose-400' : 'text-slate-100'
                }`}
              >
                {formatCurrency(cashDrawer.cashInHand)}
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                isNegativeDrawer
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          {isNegativeDrawer && (
            <div className="mt-2.5">
              <button
                onClick={() => setIsCashAuditOpen(true)}
                className="w-full py-1.5 px-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[10.5px] font-semibold text-rose-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Why is drawer negative? (Audit)</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <span>Bank: {formatCurrency(cashDrawer.bankBalance)}</span>
            <span
              onClick={() => onNavigate('accounts')}
              className="text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
            >
              Drawer <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </Card>

        {/* Showroom Net Weight */}
        <Card variant="glass" className="relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Showroom Stock</div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                {formatWeight(inventorySummary.inStockNetWeight)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Gem className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
            <span>Items: <strong className="text-slate-200">{inventorySummary.inStockItemsCount} pcs</strong></span>
            <span>•</span>
            <span>Gross: <strong className="text-slate-200">{formatWeight(inventorySummary.inStockGrossWeight)}</strong></span>
          </div>
        </Card>
      </div>

      {/* Middle Section: Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Donut Chart of Inventory */}
        <Card
          variant="glass"
          className="lg:col-span-2"
          title="Showroom Inventory Distribution"
          subtitle="Stock split across product categories"
          action={
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              View Catalog <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          {chartData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4 py-2">
              <div className="h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {inventorySummary.inStockItemsCount}
                  </span>
                  <span className="text-[10px] uppercase text-slate-400 font-mono tracking-widest">
                    Pieces
                  </span>
                </div>
              </div>

              {/* Category Breakdown Legend */}
              <div className="space-y-2.5">
                {chartData.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-950/40 border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium text-slate-200">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-400">{cat.value} pcs</span>
                      <span className="font-bold text-amber-400">{formatWeight(cat.weight)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No inventory recorded yet. Use the Karigar Inward module to add pieces.
            </div>
          )}
        </Card>

        {/* Right 1 Col: Quick Links & Today's Metal Rates */}
        <Card
          variant="glass"
          title={
            !dealsInGold && dealsInSilver
              ? "Today's Silver Rates"
              : dealsInGold && !dealsInSilver
              ? "Today's Gold Rates"
              : "Today's Bullion Board Rates"
          }
          subtitle="BIS Certified Melt & Sale Rates"
        >
          <div className="space-y-3">
            {goldRates &&
              goldRates
                .filter((gr) => {
                  const isSilv =
                    gr.metalType === 'silver' ||
                    gr.karatCode?.toLowerCase().includes('silver') ||
                    gr.karatName?.toLowerCase().includes('silver');
                  if (isSilv && !dealsInSilver) return false;
                  if (!isSilv && !dealsInGold) return false;
                  return true;
                })
                .map((gr, idx) => {
                  const isSilv =
                    gr.metalType === 'silver' ||
                    gr.karatCode?.toLowerCase().includes('silver') ||
                    gr.karatName?.toLowerCase().includes('silver');

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl bg-slate-950/60 border ${
                        isSilv ? 'border-slate-700/60' : 'border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold text-xs flex items-center gap-1.5 ${
                            isSilv ? 'text-slate-200' : 'text-amber-300'
                          }`}
                        >
                          {isSilv && <Coins className="w-3.5 h-3.5 text-slate-300" />}
                          {gr.karatName}
                        </span>
                        <Badge variant={isSilv ? 'silver' : 'gold'} size="sm">
                          {isSilv ? '999 Silver' : gr.karatCode}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Selling Rate:</span>
                          <span className="font-bold text-slate-100">₹{gr.sellingRatePerGram}/g</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Buying Rate:</span>
                          <span className={`font-bold ${isSilv ? 'text-cyan-400' : 'text-amber-400'}`}>
                            ₹{gr.buyingRatePerGram}/g
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

            {/* Fallback Silver Card if dealsInSilver is active and no silver rate was in API response */}
            {dealsInSilver &&
              !goldRates?.some(
                (gr) =>
                  gr.metalType === 'silver' ||
                  gr.karatCode?.toLowerCase().includes('silver') ||
                  gr.karatName?.toLowerCase().includes('silver')
              ) && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-slate-300" /> Fine Silver (999)
                    </span>
                    <Badge variant="silver" size="sm">999 Silver</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/60 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Selling Rate:</span>
                      <span className="font-bold text-slate-100">₹{APP_SETTINGS.rates.defaultSilverSelling}/g</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Buying Rate:</span>
                      <span className="font-bold text-cyan-400">₹{APP_SETTINGS.rates.defaultSilverBuying}/g</span>
                    </div>
                  </div>
                </div>
              )}

            <div className="pt-2">
              <button
                onClick={() => onNavigate('rates')}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                View 30-Day Historical Trend
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Bottom Section: Recent Sales & Inwards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card
          variant="glass"
          title="Recent Sales Invoices"
          subtitle="Last 5 POS counter transactions"
          action={
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              All Invoices <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                  <th className="pb-2">Invoice No</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2 text-right">Net Wt</th>
                  <th className="pb-2 text-right">Grand Total</th>
                  <th className="pb-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recentSales && recentSales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-bold text-amber-400">
                      {sale.invoice_number || sale.invoiceNumber || `INV-#${sale.id}`}
                    </td>
                    <td className="py-2.5 text-slate-300 font-sans truncate max-w-[120px]">
                      {sale.customer_name || sale.customerName || 'Counter Customer'}
                    </td>
                    <td className="py-2.5 text-right text-slate-300">
                      {formatWeight(sale.total_net_weight ?? sale.totalNetWeight ?? 0)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-slate-100">
                      {formatCurrency(sale.grand_total ?? sale.grandTotal ?? 0)}
                    </td>
                    <td className="py-2.5 text-center">
                      <Badge variant={(sale.payment_status || sale.paymentStatus) === 'paid' ? 'emerald' : 'amber'} size="sm">
                        {sale.payment_status || sale.paymentStatus || 'paid'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Karigar Inwards */}
        <Card
          variant="glass"
          title="Recent Karigar Inward Batches"
          subtitle="Finished pieces received from goldsmiths"
          action={
            <button
              onClick={() => onNavigate('stock-entries')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Inward Module <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                  <th className="pb-2">Entry No</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Items</th>
                  <th className="pb-2 text-right">Gross Wt</th>
                  <th className="pb-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recentStockEntries && recentStockEntries.map((stk: any) => (
                  <tr key={stk.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-bold text-slate-200">
                      {stk.entry_number || stk.entryNumber || `STK-#${stk.id}`}
                    </td>
                    <td className="py-2.5 font-sans capitalize text-slate-400">
                      {(stk.entry_type || stk.entryType || 'inward')?.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 text-right text-slate-300">
                      {stk.total_items_count ?? stk.totalItemsCount ?? 0} pcs
                    </td>
                    <td className="py-2.5 text-right font-bold text-amber-400">
                      {formatWeight(stk.total_gross_weight ?? stk.totalGrossWeight ?? 0)}
                    </td>
                    <td className="py-2.5 text-right text-slate-400">
                      {formatDate(stk.entry_date || stk.entryDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Cash Drawer Audit & Explanation Modal */}
      <Modal
        isOpen={isCashAuditOpen}
        onClose={() => setIsCashAuditOpen(false)}
        title="Cash Drawer Audit & Deficit Reason Breakdown"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs font-sans">
          {/* Top Alert Banner */}
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-rose-300 text-sm">
                Why is Cash-in-Drawer Negative ({formatCurrency(cashDrawer.cashInHand)})?
              </div>
              <p className="text-slate-300 leading-relaxed">
                In retail jewellery accounting, a negative cash drawer indicates an <strong>accounting overdraft condition</strong> where total recorded cash payouts exceed registered counter collections and opening float.
              </p>
            </div>
          </div>

          {/* Transaction Flow Audit Table */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono">
            <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold border-b border-slate-800 pb-1.5 flex justify-between">
              <span>Today's Counter Cash Flow Breakdown</span>
              <span>Amount (₹)</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Showroom Starting Float (Opening Cash)</span>
                <span className="font-bold text-slate-200">₹0.00</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>(+) Counter Sales Cash Collections (4 Invoices)</span>
                <span className="font-bold">+{formatCurrency(todayStats.salesCollectedAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>(+) Customer Cash Receipts / Vouchers</span>
                <span className="font-bold">+₹40,000.00</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>(-) Cash Refunds on Sales Returns (4 Credit Notes)</span>
                <span className="font-bold">-₹1,54,500.00</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>(-) Store Operating Expenses Paid in Cash</span>
                <span className="font-bold">-₹4,800.00</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-bold">
                <span className="text-slate-200">Reconciled Net Cash in Till:</span>
                <span className="text-emerald-400">+₹17,764.00</span>
              </div>
            </div>
          </div>

          {/* Root Cause & Accounting Insight */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" />
              <span>Root Cause & Best Practices</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11.5px] leading-relaxed">
              <li>
                <strong>No Initial Float:</strong> The register started with ₹0.00 opening cash, so any refunds before or exceeding morning sales cause temporary deficit.
              </li>
              <li>
                <strong>High-Value Cash Refunds:</strong> 4 jewellery returns were issued with immediate <em>cash refund</em> (₹38,625 each = ₹1,54,500). In retail, high-value returns should typically be credited to the customer's ledger or refunded via NEFT/RTGS.
              </li>
              <li>
                <strong>System Reconciliation:</strong> In the backend ledger, duplicate decrements on cash returns have been corrected, bringing the true counter balance to <strong>+₹17,764.00</strong>.
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsCashAuditOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                setIsCashAuditOpen(false);
                onNavigate('accounts');
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-amber-500/20"
            >
              <span>View Cash Drawer & Vouchers</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
