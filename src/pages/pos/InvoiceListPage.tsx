import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Sale } from '../../types';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { InvoicePrintA4 } from '../../components/print/InvoicePrintA4';
import { ThermalSlipPrint } from '../../components/print/ThermalSlipPrint';
import {
  Receipt,
  Search,
  Printer,
  Ban,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const InvoiceListPage: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');

  // Cancel Invoice Modal
  const [cancelModalSale, setCancelModalSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested return on billing error');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.sales.list();
      setSales(res.data || []);
    } catch (err) {
      console.error('Failed to fetch sales invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleCancelInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalSale) return;
    setIsCancelling(true);
    try {
      await api.sales.cancel(cancelModalSale.id, cancelReason);
      setCancelModalSale(null);
      fetchSales();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to cancel invoice.');
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.invoice_number?.toLowerCase().includes(q) ||
      s.customer_name?.toLowerCase().includes(q) ||
      s.party?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            Sales Invoices & GST Tax Bills
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View, re-print, audit, and cancel official jewellery sales invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice or customer..."
              className="bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchSales}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 cursor-pointer"
            title="Refresh Invoices"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoices Data Table */}
      <Card variant="glass" className="p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading sales invoices..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono bg-slate-950/60">
                  <th className="p-3.5">Invoice No</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5 text-center">Type</th>
                  <th className="p-3.5 text-right">Net Wt</th>
                  <th className="p-3.5 text-right">Taxable</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                      No invoices found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-amber-400">{sale.invoice_number}</td>
                      <td className="p-3.5 text-slate-400">{formatDate(sale.invoice_date)}</td>
                      <td className="p-3.5 font-sans font-medium text-slate-200">
                        {sale.party?.name || sale.customer_name || 'Retail Counter Buyer'}
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="text-[10px] font-sans uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          {(sale.invoice_type || (sale as any).invoiceType) === 'tax_invoice' ? 'GST Tax' : 'Memo'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-slate-300">
                        {formatWeight(sale.total_net_weight)}
                      </td>
                      <td className="p-3.5 text-right text-slate-400">
                        ₹{sale.total_taxable_amount}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-100 text-sm">
                        {formatCurrency(sale.grand_total)}
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge
                          variant={
                            sale.status === 'cancelled'
                              ? 'ruby'
                              : sale.payment_status === 'paid'
                              ? 'emerald'
                              : 'amber'
                          }
                          size="sm"
                        >
                          {sale.status === 'cancelled' ? 'Cancelled' : sale.payment_status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                            title="View & Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {sale.status !== 'cancelled' && (
                            <button
                              onClick={() => setCancelModalSale(sale)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                              title="Cancel Invoice & Rollback Stock"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Invoice View / Print Modal */}
      {selectedSale && (
        <Modal
          isOpen={Boolean(selectedSale)}
          onClose={() => setSelectedSale(null)}
          title={`Invoice ${selectedSale.invoice_number}`}
          subtitle="Preview and re-print customer receipt"
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 p-1 bg-slate-950 rounded-xl max-w-xs mx-auto text-xs no-print">
              <button
                onClick={() => setPrintFormat('a4')}
                className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                  printFormat === 'a4'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                A4 / A5 Tax Invoice
              </button>
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                  printFormat === 'thermal'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                80mm Thermal
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {printFormat === 'a4' ? (
                <InvoicePrintA4 sale={selectedSale} />
              ) : (
                <ThermalSlipPrint sale={selectedSale} />
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Invoice Confirmation Modal */}
      {cancelModalSale && (
        <Modal
          isOpen={Boolean(cancelModalSale)}
          onClose={() => setCancelModalSale(null)}
          title={`Cancel Invoice: ${cancelModalSale.invoice_number}`}
          subtitle="Will revert jewellery items to 'in_stock' and rollback ledger entries"
          maxWidth="md"
        >
          <form onSubmit={handleCancelInvoice} className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Cancelling this invoice will immediately restore its {cancelModalSale.items?.length || 0} jewellery items back into showroom stock and reverse financial accounts.
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Reason for Cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalSale(null)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Go Back
              </button>
              <button
                type="submit"
                disabled={isCancelling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
