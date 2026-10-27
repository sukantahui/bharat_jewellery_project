import React from 'react';
import { Sale, BusinessProfile } from '../../types';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { Printer } from 'lucide-react';
import { getCompanyDetails } from '../../config/company';

interface ThermalSlipPrintProps {
  sale: Sale;
  profile?: BusinessProfile | null;
}

export const ThermalSlipPrint: React.FC<ThermalSlipPrintProps> = ({
  sale,
  profile,
}) => {
  const comp = getCompanyDetails(profile);
  const storeName = comp.name;
  const phone = comp.phone;
  const gstin = comp.gstin;

  const invNumber = sale.invoice_number || sale.invoiceNumber || '—';
  const invDate = sale.invoice_date || sale.invoiceDate;
  const custName = sale.party?.name || sale.customer_name || sale.customerName || 'Counter Customer';
  const custPan = sale.customer_pan || sale.customerPan;
  const items = sale.items || [];
  const oldGoldItems = sale.old_gold_items || sale.oldGoldExchanges || [];
  const taxableAmount = sale.total_taxable_amount ?? sale.taxableAmount ?? sale.taxable_amount ?? 0;
  const gstAmount = sale.total_gst_amount ?? sale.totalTaxAmount ?? sale.total_tax_amount ?? 0;
  const grandTotal = sale.grand_total ?? sale.grandTotal ?? 0;
  const paidAmount = sale.paid_amount ?? sale.paidAmount ?? grandTotal;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-sm mx-auto text-slate-900">
      <div className="flex justify-between items-center mb-4 no-print">
        <span className="text-xs text-slate-400">80mm Thermal Receipt</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          Print Slip
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow font-mono text-[11px] leading-tight printable-area max-w-[300px] mx-auto">
        <div className="text-center pb-2 border-b border-dashed border-black">
          <div className="font-bold text-sm uppercase">{storeName}</div>
          <div className="text-[10px] text-slate-600">{comp.addressLine1 || comp.city}</div>
          <div className="text-[10px]">Ph: {phone}</div>
          <div className="text-[10px]">GSTIN: {gstin} • State: {comp.stateCode}</div>
          <div className="text-[10px] font-bold mt-1">RETAIL CASH MEMO</div>
        </div>

        <div className="py-2 border-b border-dashed border-black text-[10px]">
          <div>Inv: <span className="font-bold">{invNumber}</span></div>
          <div>Date: {formatDate(invDate)}</div>
          {(sale.terminal_code || sale.terminal_name || sale.terminalCode || sale.terminalName) && (
            <div>
              POS: <span className="font-bold">{sale.terminal_code || sale.terminalCode || sale.terminal_name}</span>
              {(sale.terminal_area || sale.terminalArea) && ` [${sale.terminal_area || sale.terminalArea}]`}
            </div>
          )}
          {(sale.cashier_name || sale.cashierName) && (
            <div>Op/Cashier: {sale.cashier_name || sale.cashierName}</div>
          )}
          <div>Cust: {custName}</div>
          {custPan && <div>PAN: {custPan}</div>}
        </div>

        <div className="py-2 border-b border-dashed border-black">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-black text-left">
                <th>Item</th>
                <th className="text-right">Net Wt</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items && items.map((it: any, idx: number) => {
                const itName = it.item_name || it.itemName || 'Jewellery Item';
                const huid = it.huid;
                const net = it.net_weight ?? it.netWeight ?? 0;
                const taxable = it.taxable_amount ?? it.taxableAmount ?? 0;

                return (
                  <tr key={it.id || idx}>
                    <td className="py-0.5">
                      <div>{itName}</div>
                      {huid && <div className="text-[8px]">HUID: {huid}</div>}
                    </td>
                    <td className="text-right py-0.5">{formatWeight(net)}</td>
                    <td className="text-right py-0.5 font-bold">₹{taxable}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {oldGoldItems && oldGoldItems.length > 0 && (
          <div className="py-1 border-b border-dashed border-black text-[10px]">
            <div className="font-bold">Old Gold Trade-In:</div>
            {oldGoldItems.map((og: any, i: number) => {
              const gross = og.gross_weight ?? og.grossWeight ?? 0;
              const pct = og.purity_percent ?? og.purity_percentage ?? og.purityPercentage ?? 0;
              const val = og.exchange_value ?? og.total_exchange_value ?? og.totalExchangeValue ?? 0;

              return (
                <div key={i} className="flex justify-between">
                  <span>{formatWeight(gross)} @ {pct}%</span>
                  <span>-₹{val}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-black">
          <div className="flex justify-between">
            <span>Taxable:</span>
            <span>₹{taxableAmount}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (3%):</span>
            <span>₹{gstAmount}</span>
          </div>
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
            <span>NET TOTAL:</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>Paid ({sale.payment_mode || 'Cash'}):</span>
            <span>₹{paidAmount}</span>
          </div>
        </div>

        <div className="text-center pt-3 text-[9px] text-slate-600">
          <div>* Thank you for your visit *</div>
          <div>BIS 100% Hallmarked Quality</div>
        </div>
      </div>
    </div>
  );
};
