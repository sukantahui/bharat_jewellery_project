import React, { useState, useEffect } from 'react';
import { api, useAccounts, useCashDrawerSummary } from '../../api/client';
import { Payment, StorePaymentPayload } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Wallet,
  Building2,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

export const CashDrawerPage: React.FC = () => {
  const { data: accounts, refetch: refetchAccounts } = useAccounts();
  const { data: drawer, refetch: refetchDrawer, isLoading: loadingDrawer } = useCashDrawerSummary();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [parties, setParties] = useState<any[]>([]);

  // Voucher Modal
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherForm, setVoucherForm] = useState<StorePaymentPayload>({
    payment_type: 'receipt',
    party_id: 1,
    account_id: 1,
    amount: 10000,
    payment_mode: 'cash',
    reference_number: '',
    narrative: 'Customer account advance deposit',
    payment_date: new Date().toISOString().split('T')[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await api.payments.list();
      setPayments(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    api.parties.list().then((r) => setParties(r.data || [])).catch(console.error);
  }, []);

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.payments.create(voucherForm);
      setIsVoucherModalOpen(false);
      refetchDrawer();
      refetchAccounts();
      fetchPayments();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to record voucher.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" />
            Cash Drawer & Financial Accounts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor real-time showroom cash drawer balance, bank settlements, and cash book vouchers.
          </p>
        </div>

        <button
          onClick={() => setIsVoucherModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Payment / Receipt Voucher</span>
        </button>
      </div>

      {/* Real-time Drawer Counter Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash In Hand */}
        <Card variant="glass" className="border-amber-500/30 gold-card-glow">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-mono">Showroom Cash-in-Hand</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {drawer ? formatCurrency(drawer.cash_in_hand) : '₹0.00'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
            <span>Opening: {drawer ? formatCurrency(drawer.opening_balance) : '₹0.00'}</span>
            <span className="text-emerald-400 font-bold">Counter Active</span>
          </div>
        </Card>

        {/* Today's Cash Inflows */}
        <Card variant="glass">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-mono">Today's Total Receipts</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {drawer ? formatCurrency(drawer.today_cash_sales) : '₹0.00'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400">
            Counter POS receipts & customer advances
          </div>
        </Card>

        {/* Today's Cash Outflows */}
        <Card variant="glass">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-mono">Today's Cash Outflows</div>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                {drawer ? formatCurrency(drawer.today_cash_expenses) : '₹0.00'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400">
            Expenses, refunds & scrap buybacks
          </div>
        </Card>

        {/* Liquid Funds */}
        <Card variant="glass">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-mono">Total Liquid Funds</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">
                {drawer ? formatCurrency(drawer.total_liquid_funds) : '₹0.00'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
            Bank Accounts Balance: {drawer ? formatCurrency(drawer.bank_balance) : '₹0.00'}
          </div>
        </Card>
      </div>

      {/* Bank Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {accounts?.map((acc) => (
          <div key={acc.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 text-xs font-sans">{acc.account_name}</span>
              <Badge variant={acc.is_cash ? 'gold' : 'blue'} size="sm">
                {acc.is_cash ? 'Cash' : 'Bank'}
              </Badge>
            </div>
            <div className="text-xl font-bold font-mono text-slate-100">
              {formatCurrency(acc.current_balance)}
            </div>
            {acc.account_number && (
              <div className="text-[10px] text-slate-400 font-mono">
                A/C: {acc.account_number} • {acc.bank_name || 'Bank'}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recent Cash/Bank Book Vouchers */}
      <Card
        variant="glass"
        title="Cash Book & Bank Ledger Vouchers"
        subtitle="Recent inflow and outflow payment records"
        action={
          <button
            onClick={fetchPayments}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="pb-2">Voucher #</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Party</th>
                <th className="pb-2">Account</th>
                <th className="pb-2">Mode</th>
                <th className="pb-2 text-right">Amount</th>
                <th className="pb-2">Narrative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loadingPayments ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    Loading vouchers...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No payment vouchers recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-bold text-slate-200">{p.payment_number}</td>
                    <td className="py-2.5 text-slate-400">{formatDate(p.payment_date)}</td>
                    <td className="py-2.5">
                      <Badge variant={p.payment_type === 'receipt' ? 'emerald' : 'ruby'} size="sm">
                        {p.payment_type}
                      </Badge>
                    </td>
                    <td className="py-2.5 font-sans font-medium text-slate-200">
                      {p.party?.name || 'Walk-in / General'}
                    </td>
                    <td className="py-2.5 text-slate-400 font-sans">{p.account?.account_name || 'Cash'}</td>
                    <td className="py-2.5 uppercase text-slate-400">{p.payment_mode}</td>
                    <td className={`py-2.5 text-right font-bold text-sm ${p.payment_type === 'receipt' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.payment_type === 'receipt' ? '+' : '-'}{formatCurrency(p.amount)}
                    </td>
                    <td className="py-2.5 font-sans text-slate-400 truncate max-w-[160px]">
                      {p.narrative || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Voucher Modal */}
      <Modal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        title="Record Cash / Bank Voucher"
        subtitle="Post money received (receipt) or paid out (payment)"
        maxWidth="md"
      >
        <form onSubmit={handleCreateVoucher} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Voucher Type</label>
              <select
                value={voucherForm.payment_type}
                onChange={(e) => setVoucherForm({ ...voucherForm, payment_type: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              >
                <option value="receipt">Receipt (Money In)</option>
                <option value="payment">Payment (Money Out)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={voucherForm.payment_date}
                onChange={(e) => setVoucherForm({ ...voucherForm, payment_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Party (Customer / Vendor / Karigar)</label>
            <select
              value={voucherForm.party_id ?? ''}
              onChange={(e) => setVoucherForm({ ...voucherForm, party_id: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              required
            >
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.party_type})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Account (Drawer / Bank)</label>
              <select
                value={voucherForm.account_id}
                onChange={(e) => setVoucherForm({ ...voucherForm, account_id: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                required
              >
                {accounts?.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Payment Mode</label>
              <select
                value={voucherForm.payment_mode}
                onChange={(e) => setVoucherForm({ ...voucherForm, payment_mode: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 capitalize"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Amount (₹)</label>
            <input
              type="number"
              value={voucherForm.amount}
              onChange={(e) => setVoucherForm({ ...voucherForm, amount: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono text-base font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Narrative / Description</label>
            <input
              type="text"
              value={voucherForm.narrative || ''}
              onChange={(e) => setVoucherForm({ ...voucherForm, narrative: e.target.value })}
              placeholder="e.g. Advance gold booking payment"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsVoucherModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              {isSubmitting ? 'Posting...' : 'Save & Post Voucher'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
