import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SalesReturn, Sale } from '../../types';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RotateCcw, Plus, Search, CheckSquare, Square, Printer, RefreshCw } from 'lucide-react';

export const SalesReturnListPage: React.FC = () => {
  const [returns, setReturns] = useState<SalesReturn[]>([]);
  const [loading, setLoading] = useState(true);

  // New Credit Note Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invoiceLookup, setInvoiceLookup] = useState('');
  const [matchedSale, setMatchedSale] = useState<Sale | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Selected return items
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [restockAction, setRestockAction] = useState<'restock' | 'melt_scrap'>('restock');
  const [refundMode, setRefundMode] = useState<'ledger_credit' | 'cash_refund'>('cash_refund');
  const [returnReason, setReturnReason] = useState('Customer exchange / design change');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.salesReturns.list();
      setReturns(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleLookupInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceLookup.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setMatchedSale(null);
    setSelectedItemIds([]);

    try {
      const res = await api.sales.list();
      const allSales: Sale[] = res.data || [];
      const found = allSales.find(
        (s) => s.invoice_number?.toLowerCase() === invoiceLookup.trim().toLowerCase()
      );
      if (!found) {
        setLookupError(`Invoice "${invoiceLookup}" not found in system.`);
        return;
      }
      setMatchedSale(found);
      // Preselect all items
      if (found.items) {
        setSelectedItemIds(found.items.map((i) => i.id));
      }
    } catch (err: any) {
      console.error(err);
      setLookupError('Failed to lookup invoice.');
    } finally {
      setLookupLoading(false);
    }
  };

  const toggleItemSelection = (id: number) => {
    if (selectedItemIds.includes(id)) {
      setSelectedItemIds(selectedItemIds.filter((x) => x !== id));
    } else {
      setSelectedItemIds([...selectedItemIds, id]);
    }
  };

  const handleCreateReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedSale) return;
    if (selectedItemIds.length === 0) {
      alert('Please select at least one item being returned.');
      return;
    }

    setIsSubmitting(true);
    try {
      const returnItems = matchedSale.items
        ?.filter((it) => selectedItemIds.includes(it.id))
        .map((it: any) => ({
          sale_item_id: it.id,
          jewellery_item_id: it.jewellery_item_id || it.jewelleryItemId,
          purity_id: it.purity_id || it.purityId || 2,
          item_name: it.item_name || it.itemName || 'Returned Item',
          gross_weight: parseFloat(String(it.gross_weight || it.grossWeight || 0)),
          rate_per_gram: parseFloat(String(it.rate_per_gram || it.goldRatePerGram || 7350)),
          return_weight: parseFloat(String(it.net_weight || it.netWeight || 0)),
          return_amount: parseFloat(String(it.taxable_amount || it.taxableAmount || 0)),
          restock_action: restockAction,
        }));

      await api.salesReturns.create({
        sale_id: matchedSale.id,
        party_id: (matchedSale.party_id ?? matchedSale.partyId) || undefined,
        return_date: new Date().toISOString().split('T')[0],
        return_reason: returnReason,
        refund_mode: refundMode === 'ledger_credit' ? 'credit_to_ledger' : 'cash_refund',
        items: (returnItems as any) || [],
      });

      setIsModalOpen(false);
      fetchReturns();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to issue Credit Note.');
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
            <RotateCcw className="w-5 h-5 text-amber-400" />
            Sales Returns & GST Credit Notes
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Process jewellery returns, restock showroom inventory or scrap melt, and issue statutory Credit Notes.
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setMatchedSale(null);
            setInvoiceLookup('');
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Issue GST Credit Note</span>
        </button>
      </div>

      {/* Credit Notes Table */}
      <Card variant="glass" className="p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading sales returns & credit notes..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono bg-slate-950/60">
                  <th className="p-3.5">Credit Note #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Original Invoice</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5 text-right">Returned Wt</th>
                  <th className="p-3.5 text-right">Credit Amount</th>
                  <th className="p-3.5">Refund Mode</th>
                  <th className="p-3.5">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                      No sales returns or credit notes recorded yet.
                    </td>
                  </tr>
                ) : (
                  returns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-amber-400">{ret.credit_note_number || ret.creditNoteNo}</td>
                      <td className="p-3.5 text-slate-400">{formatDate(ret.return_date || ret.creditNoteDate)}</td>
                      <td className="p-3.5 font-bold text-slate-200">{ret.sale?.invoice_number || ret.sale?.invoiceNumber || 'INV'}</td>
                      <td className="p-3.5 font-sans font-medium text-slate-200">
                        {ret.party?.name || ret.party?.partyName || ret.sale?.customer_name || ret.sale?.customerName || ret.customerName || 'Retail Customer'}
                      </td>
                      <td className="p-3.5 text-right text-amber-300 font-bold">
                        {formatWeight(ret.total_return_weight ?? ret.totalNetWeight)}
                      </td>
                      <td className="p-3.5 text-right font-bold text-rose-400 text-sm">
                        {formatCurrency(ret.total_refund_amount ?? ret.totalCreditAmount)}
                      </td>
                      <td className="p-3.5 font-sans capitalize text-slate-400">
                        {(ret.refund_mode || ret.refundMode)?.replace('_', ' ')}
                      </td>
                      <td className="p-3.5 font-sans text-slate-400 truncate max-w-[150px]">
                        {ret.return_reason || ret.reason || 'Exchange'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Issue Credit Note Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue GST Credit Note (Sales Return)"
        subtitle="Lookup original invoice and select returned pieces"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Step 1: Invoice Lookup */}
          <form onSubmit={handleLookupInvoice} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={invoiceLookup}
                onChange={(e) => setInvoiceLookup(e.target.value)}
                placeholder="Enter Invoice Number (e.g. INV-20261015-0001)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-100 uppercase focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={lookupLoading}
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
            >
              {lookupLoading ? 'Finding...' : 'Lookup Bill'}
            </button>
          </form>

          {lookupError && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {lookupError}
            </div>
          )}

          {/* Step 2: Show Found Invoice Items */}
          {matchedSale && (
            <form onSubmit={handleCreateReturn} className="space-y-4 pt-2 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400">Invoice:</span>{' '}
                  <strong className="text-amber-400 font-mono">{matchedSale.invoice_number || matchedSale.invoiceNumber}</strong>
                  <div className="text-[11px] text-slate-400">Customer: {matchedSale.customer_name || matchedSale.customerName || 'Walk-in'}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-slate-200 font-bold">{formatCurrency(matchedSale.grand_total || matchedSale.grandTotal)}</div>
                  <div className="text-[10px] text-slate-400">{formatDate(matchedSale.invoice_date || matchedSale.invoiceDate)}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Select Items Being Returned:
                </label>
                <div className="space-y-1.5">
                  {matchedSale.items?.map((it: any) => {
                    const isSelected = selectedItemIds.includes(it.id);
                    return (
                      <div
                        key={it.id}
                        onClick={() => toggleItemSelection(it.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/40 text-slate-100'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold">{it.item_name || it.itemName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Net Wt: {formatWeight(it.net_weight || it.netWeight)} • Tag: {it.tag_code || it.tagCode || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-200">
                          ₹{it.taxable_amount || it.taxableAmount}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Restock Action</label>
                  <select
                    value={restockAction}
                    onChange={(e) => setRestockAction(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  >
                    <option value="restock">Restock to Showroom Inventory</option>
                    <option value="melt_scrap">Send to Workshop for Melting</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Refund Settlement</label>
                  <select
                    value={refundMode}
                    onChange={(e) => setRefundMode(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  >
                    <option value="cash_refund">Immediate Cash Drawer Refund</option>
                    <option value="ledger_credit">Credit to Customer Ledger Balance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Return Reason</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                  required
                />
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
                  disabled={isSubmitting || selectedItemIds.length === 0}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  {isSubmitting ? 'Generating...' : 'Issue Credit Note & Restock'}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};
