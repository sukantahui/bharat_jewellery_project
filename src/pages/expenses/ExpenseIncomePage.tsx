import React, { useState, useEffect } from 'react';
import { api, useAccounts } from '../../api/client';
import { ExpenseIncome, StoreExpenseIncomePayload } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Coins, Plus, Trash2 } from 'lucide-react';

export const ExpenseIncomePage: React.FC = () => {
  const [items, setItems] = useState<ExpenseIncome[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: accounts } = useAccounts();

  // New Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<StoreExpenseIncomePayload>({
    entry_type: 'expense',
    category: 'Showroom Electricity & Power',
    amount: 1500,
    account_id: 1, // Cash
    payment_mode: 'cash',
    entry_date: new Date().toISOString().split('T')[0],
    description: 'Monthly electricity bill',
    is_gst_claimable: false,
    gst_amount: 0,
    vendor_gstin: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.expenses.list();
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.expenses.create(form);
      setIsModalOpen(false);
      fetchItems();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to record expense.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.expenses.delete(id);
      fetchItems();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete record.');
    }
  };

  const totalExpenses = items
    .filter((i) => i.entry_type === 'expense')
    .reduce((acc, i) => acc + (parseFloat(String(i.amount)) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            Operating Expenses & Store Maintenance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log showroom utilities, staff refreshments, store security, and claim GST Input Tax Credit.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Daily Expense</span>
        </button>
      </div>

      {/* Overview Stat Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass">
          <div className="text-xs text-slate-400 uppercase font-mono">Total Showroom Expenses</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{items.length} records posted</div>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card variant="glass" className="p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading expense ledger..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase bg-slate-950/60">
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Category Head</th>
                  <th className="p-3.5">Account / Drawer</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5">GST ITC Claim</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                      No operating expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 text-slate-400">{formatDate(it.entry_date)}</td>
                      <td className="p-3.5 font-sans font-bold text-slate-200">{it.category}</td>
                      <td className="p-3.5 font-sans text-slate-400">{it.account?.account_name || 'Cash Drawer'}</td>
                      <td className="p-3.5 uppercase text-slate-400">{it.payment_mode}</td>
                      <td className="p-3.5 text-right font-bold text-rose-400 text-sm">
                        {formatCurrency(it.amount)}
                      </td>
                      <td className="p-3.5">
                        {it.is_gst_claimable ? (
                          <Badge variant="emerald" size="sm">
                            ITC: ₹{it.gst_amount}
                          </Badge>
                        ) : (
                          <span className="text-slate-600 text-[10px]">No Claim</span>
                        )}
                      </td>
                      <td className="p-3.5 font-sans text-slate-300 truncate max-w-[180px]">
                        {it.description || '—'}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDelete(it.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Daily Showroom Expense"
        subtitle="Deducts cash from showroom drawer or bank account"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Expense Category Head</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
            >
              <option value="Showroom Electricity & Power">Showroom Electricity & Power</option>
              <option value="Staff Tea, Snacks & Welfare">Staff Tea, Snacks & Welfare</option>
              <option value="Store Maintenance & Cleaning">Store Maintenance & Cleaning</option>
              <option value="Showroom Security & Guard Service">Showroom Security & Guard Service</option>
              <option value="Advertising, Banners & Promotion">Advertising, Banners & Promotion</option>
              <option value="Printing & Stationery (Paper/Receipts)">Printing & Stationery</option>
              <option value="Miscellaneous Store Expenses">Miscellaneous Store Expenses</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={form.entry_date}
                onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Pay From Account</label>
              <select
                value={form.account_id}
                onChange={(e) => setForm({ ...form, account_id: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              >
                {accounts?.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Payment Mode</label>
              <select
                value={form.payment_mode}
                onChange={(e) => setForm({ ...form, payment_mode: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 capitalize"
              >
                <option value="cash">Cash (Drawer)</option>
                <option value="upi">UPI / QR</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Description / Voucher Note</label>
            <input
              type="text"
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
            />
          </div>

          {/* GST Claimable Checkbox */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_gst_claimable}
                onChange={(e) => setForm({ ...form, is_gst_claimable: e.target.checked })}
                className="rounded border-slate-700 text-amber-500 focus:ring-0"
              />
              <span>Claim GST Input Tax Credit (ITC) for this invoice</span>
            </label>

            {form.is_gst_claimable && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Vendor GSTIN</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={form.vendor_gstin || ''}
                    onChange={(e) => setForm({ ...form, vendor_gstin: e.target.value.toUpperCase() })}
                    placeholder="19AAAAA0000A1Z5"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono uppercase text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">GST Tax Amount (₹)</label>
                  <input
                    type="number"
                    value={form.gst_amount || 0}
                    onChange={(e) => setForm({ ...form, gst_amount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-100"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              {isSubmitting ? 'Recording...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
