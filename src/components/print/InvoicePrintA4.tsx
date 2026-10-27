import React from 'react';
import { Sale, BusinessProfile } from '../../types';
import { formatCurrency, formatWeight, formatDate, numberToWords } from '../../utils/formatters';
import { Printer, ShieldCheck } from 'lucide-react';
import { getCompanyDetails } from '../../config/company';

interface InvoicePrintA4Props {
  sale: Sale;
  profile?: BusinessProfile | null;
  onClose?: () => void;
}

export const InvoicePrintA4: React.FC<InvoicePrintA4Props> = ({
  sale,
  profile,
}) => {
  const comp = getCompanyDetails(profile);
  const storeName = comp.name;
  const tagline = comp.tagline;
  const gstin = comp.gstin;
  const address = comp.address;
  const phone = comp.phone;
  const email = comp.email;
  const state = comp.state;
  const stateCode = comp.stateCode;

  const handlePrint = () => {
    window.print();
  };

  const invNumber = sale.invoice_number || sale.invoiceNumber || '—';
  const invDate = sale.invoice_date || sale.invoiceDate;
  const custName = sale.party?.name || sale.customer_name || sale.customerName || 'Retail Counter Buyer';
  const custMobile = sale.party?.mobile || sale.customer_mobile || sale.customerMobile || '—';
  const custPan = sale.customer_pan || sale.customerPan;
  const custGstin = sale.party?.gstin || sale.customer_gstin || sale.customerGstin;
  const totalTaxable = sale.total_taxable_amount ?? sale.taxableAmount ?? sale.taxable_amount ?? 0;
  const grandTotal = sale.grand_total ?? sale.grandTotal ?? 0;
  const paidAmount = sale.paid_amount ?? sale.paidAmount ?? grandTotal;
  const dueAmount = sale.due_amount ?? sale.balanceAmount ?? sale.balance_amount ?? 0;
  const cgstAmount = sale.cgst_amount ?? sale.cgstAmount ?? 0;
  const sgstAmount = sale.sgst_amount ?? sale.sgstAmount ?? 0;
  const igstAmount = sale.igst_amount ?? sale.igstAmount ?? 0;
  const oldGoldAmount = sale.total_old_gold_amount ?? sale.oldGoldExchangeAmount ?? sale.old_gold_exchange_amount ?? 0;
  const roundOff = sale.round_off ?? sale.roundOff ?? 0;
  const items = sale.items || [];
  const oldGoldItems = sale.old_gold_items || sale.oldGoldExchanges || [];

  const isInterState = sale.is_inter_state || (parseFloat(String(igstAmount)) > 0);
  const totalAmountNum = parseFloat(String(grandTotal)) || 0;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-4xl mx-auto text-slate-900">
      {/* Top Action Bar for Screen view */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800 no-print">
        <div className="text-slate-300 text-sm">
          <span className="text-amber-400 font-semibold">{invNumber}</span> — Ready for A4/A5 Print
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print GST Tax Invoice
        </button>
      </div>

      {/* The Printable Document Sheet */}
      <div className="bg-white p-8 rounded-xl shadow-2xl font-sans text-xs leading-relaxed printable-area" id="printable-tax-invoice">
        {/* Header with Store & BIS Hallmark Logo */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-wider text-slate-950 uppercase font-serif">
                {storeName}
              </h1>
              <p className="text-[11px] font-semibold text-amber-800 tracking-wide">{tagline}</p>
              <p className="text-[11px] text-slate-700">{address}</p>
              <p className="text-[11px] text-slate-700">
                Phone: <span className="font-semibold">{phone}</span> {comp.alternatePhone ? `| ${comp.alternatePhone}` : ''} | Email: {email}
              </p>
            </div>
            <div className="text-right space-y-1.5">
              <div className="inline-block bg-amber-50 border border-amber-300 px-3 py-1 rounded text-amber-900 font-bold text-[11px]">
                TAX INVOICE (GST)
              </div>
              <p className="text-[11px] font-bold text-slate-900">
                GSTIN: <span className="font-mono">{gstin}</span>
              </p>
              <p className="text-[11px] text-slate-700">State: {state} (Code: {stateCode})</p>
              <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-800 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                BIS Hallmarked 100% Certified
              </div>
            </div>
          </div>
        </div>

        {/* Invoice & Buyer Information Grid */}
        <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded p-3 mb-4 bg-slate-50/50">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Invoice Details</div>
            <div className="mt-1 space-y-0.5">
              <div><span className="text-slate-600">Invoice No:</span> <span className="font-bold text-slate-950 font-mono text-[13px]">{invNumber}</span></div>
              <div><span className="text-slate-600">Invoice Date:</span> <span className="font-semibold">{formatDate(invDate)}</span></div>
              <div><span className="text-slate-600">Place of Supply:</span> <span className="font-semibold">{isInterState ? 'Inter-State' : `${state} (${stateCode})`}</span></div>
              {(sale.terminal_name || sale.terminal_code || sale.terminalName || sale.terminalCode) && (
                <div>
                  <span className="text-slate-600">POS Terminal:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    {sale.terminal_name || sale.terminalName || sale.terminal_code || sale.terminalCode}
                  </span>
                  {(sale.terminal_area || sale.terminalArea) && (
                    <span className="text-slate-600 font-normal"> • {sale.terminal_area || sale.terminalArea}</span>
                  )}
                </div>
              )}
              {(sale.cashier_name || sale.cashierName) && (
                <div>
                  <span className="text-slate-600">Billed By:</span>{' '}
                  <span className="font-semibold text-slate-800">{sale.cashier_name || sale.cashierName}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Billed To (Customer)</div>
            <div className="mt-1 space-y-0.5">
              <div className="font-bold text-slate-950 text-[13px]">{custName}</div>
              <div><span className="text-slate-600">Mobile:</span> {custMobile}</div>
              {custPan && (
                <div><span className="text-slate-600">PAN:</span> <span className="font-mono font-bold">{custPan}</span></div>
              )}
              {custGstin && (
                <div><span className="text-slate-600">GSTIN:</span> <span className="font-mono font-bold">{custGstin}</span></div>
              )}
            </div>
          </div>
        </div>

        {/* Payment & Bank Details Notice */}
        <div className="border border-amber-200 bg-amber-50/50 rounded p-2.5 mb-4 text-[10px] text-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="font-bold text-amber-900 uppercase">Settlement Bank (RTGS/NEFT): </span>
            <span>{comp.bankName} ({comp.bankBranch}) • A/C No: </span>
            <span className="font-mono font-bold text-slate-900">{comp.bankAccountNumber}</span>
            <span> • IFSC: </span>
            <span className="font-mono font-bold text-slate-900">{comp.bankIfsc}</span>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <span className="font-bold text-amber-900">UPI ID: </span>
              <span className="font-mono font-bold text-emerald-800">{comp.upiId}</span>
            </div>
            {comp.banks && comp.banks.length > 1 && (
              <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-medium border border-amber-200">
                {comp.banks.length} Banks Configured
              </span>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-300 rounded overflow-hidden mb-4">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-[10px] uppercase font-bold">
                <th className="p-2 border-r border-slate-300">#</th>
                <th className="p-2 border-r border-slate-300">Description & HUID</th>
                <th className="p-2 border-r border-slate-300 text-center">Purity</th>
                <th className="p-2 border-r border-slate-300 text-right">Gross Wt</th>
                <th className="p-2 border-r border-slate-300 text-right">Stone Wt</th>
                <th className="p-2 border-r border-slate-300 text-right">Net Wt</th>
                <th className="p-2 border-r border-slate-300 text-right">Rate / g</th>
                <th className="p-2 border-r border-slate-300 text-right">Making</th>
                <th className="p-2 text-right">Taxable (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items && items.map((item: any, idx: number) => {
                const itName = item.item_name || item.itemName || 'Jewellery Item';
                const tag = item.tag_code || item.tagCode;
                const huid = item.huid;
                const purityCode = item.purity?.karat_code || item.purity?.karatCode || '22K';
                const gross = item.gross_weight ?? item.grossWeight ?? 0;
                const stone = item.stone_weight ?? item.stoneWeight ?? 0;
                const net = item.net_weight ?? item.netWeight ?? 0;
                const rate = item.rate_per_gram ?? item.gold_rate_per_gram ?? item.goldRatePerGram ?? 0;
                const making = item.making_charges_amount ?? item.making_charges ?? item.makingCharges ?? 0;
                const taxable = item.taxable_amount ?? item.taxableAmount ?? 0;

                return (
                  <tr key={item.id || idx} className="text-[11px]">
                    <td className="p-2 border-r border-slate-200 text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-medium text-slate-900">
                      <div>{itName}</div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {tag ? `Tag: ${tag}` : ''} {huid ? `| HUID: ${huid}` : ''} | HSN: {item.hsn_code || item.hsnCode || '7113'}
                      </div>
                    </td>
                    <td className="p-2 border-r border-slate-200 text-center font-semibold">
                      {purityCode}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{formatWeight(gross)}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">{formatWeight(stone)}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono font-semibold">{formatWeight(net)}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">₹{rate}</td>
                    <td className="p-2 border-r border-slate-200 text-right font-mono">₹{making}</td>
                    <td className="p-2 text-right font-mono font-bold">₹{taxable}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Old Gold Trade-in section if applicable */}
        {oldGoldItems && oldGoldItems.length > 0 && (
          <div className="border border-amber-200 bg-amber-50/40 rounded p-3 mb-4">
            <div className="text-[10px] uppercase font-bold text-amber-900 mb-1">
              Old Gold Exchange / Trade-In Buyback Deductions
            </div>
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="border-b border-amber-200 text-amber-900">
                  <th className="py-1">Description</th>
                  <th className="py-1 text-right">Gross Wt</th>
                  <th className="py-1 text-right">Melt Purity</th>
                  <th className="py-1 text-right">Fine Gold</th>
                  <th className="py-1 text-right">Melt Rate</th>
                  <th className="py-1 text-right">Deduction Value</th>
                </tr>
              </thead>
              <tbody>
                {oldGoldItems.map((og: any, i: number) => {
                  const ogDesc = og.description || og.item_description || og.itemDescription || 'Customer Scrap Gold';
                  const ogGross = og.gross_weight ?? og.grossWeight ?? 0;
                  const ogPct = og.purity_percent ?? og.purity_percentage ?? og.purityPercentage ?? 0;
                  const ogNet = og.net_weight ?? og.netWeight ?? 0;
                  const ogRate = og.rate_per_gram ?? og.buying_rate_per_gram ?? og.buyingRatePerGram ?? 0;
                  const ogVal = og.exchange_value ?? og.total_exchange_value ?? og.totalExchangeValue ?? 0;

                  return (
                    <tr key={og.id || i} className="font-mono text-[10px]">
                      <td className="py-1">{ogDesc}</td>
                      <td className="py-1 text-right">{formatWeight(ogGross)}</td>
                      <td className="py-1 text-right">{ogPct}%</td>
                      <td className="py-1 text-right">{formatWeight(ogNet)}</td>
                      <td className="py-1 text-right">₹{ogRate}</td>
                      <td className="py-1 text-right font-bold text-amber-950">-₹{ogVal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tax & Summary Calculation Block */}
        <div className="grid grid-cols-2 gap-6 pt-2 mb-6">
          {/* Left: Words and Bank Details */}
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500">Amount in Words:</div>
              <p className="text-[11px] font-semibold text-slate-900 italic mt-0.5">
                {numberToWords(totalAmountNum)}
              </p>
            </div>

            <div className="border border-slate-200 rounded p-2.5 bg-slate-50 text-[10px] space-y-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="font-bold text-slate-800 uppercase">Payment & Settlement Banks</span>
                <span className="text-[9px] text-slate-500">Mode: <strong className="uppercase text-slate-700">{sale.payment_mode || 'Cash'}</strong></span>
              </div>
              <div className="space-y-1 pt-0.5">
                {comp.banks && comp.banks.length > 0 ? (
                  comp.banks.slice(0, 4).map((b, idx) => (
                    <div key={b.id || idx} className="text-[9px] leading-tight text-slate-700 border-b border-slate-100 last:border-b-0 pb-1 last:pb-0">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-slate-900">
                          {b.bankName}
                          {b.isPrimary && (
                            <span className="ml-1 text-[7.5px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-normal">Primary</span>
                          )}
                        </span>
                        <span className="font-mono text-slate-500 font-normal text-[8.5px]">IFSC: {b.bankIfsc}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[8.5px]">
                        <span>A/C: <span className="font-mono font-bold text-slate-800">{b.bankAccountNumber}</span> ({b.bankAccountType})</span>
                        {b.upiId && <span className="font-mono text-emerald-700 font-medium">{b.upiId}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div>
                    <div>A/C: <span className="font-mono font-semibold">{comp.bankAccountNumber}</span> ({comp.bankName})</div>
                    <div>IFSC: <span className="font-mono font-semibold">{comp.bankIfsc}</span></div>
                    {comp.upiId && <div>UPI ID: <span className="font-mono font-semibold">{comp.upiId}</span></div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Calculations Breakdown */}
          <div className="border border-slate-300 rounded p-3 bg-slate-50 space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-600">Total Taxable Value:</span>
              <span className="font-mono font-semibold">₹{totalTaxable}</span>
            </div>

            {isInterState ? (
              <div className="flex justify-between">
                <span className="text-slate-600">IGST (3.0%):</span>
                <span className="font-mono font-semibold">₹{igstAmount}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-600">CGST (1.5%):</span>
                  <span className="font-mono font-semibold">₹{cgstAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">SGST (1.5%):</span>
                  <span className="font-mono font-semibold">₹{sgstAmount}</span>
                </div>
              </>
            )}

            {parseFloat(String(oldGoldAmount)) > 0 && (
              <div className="flex justify-between text-amber-800">
                <span>Old Gold Trade-In:</span>
                <span className="font-mono font-semibold">-₹{oldGoldAmount}</span>
              </div>
            )}

            {parseFloat(String(roundOff)) !== 0 && (
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>Round Off:</span>
                <span className="font-mono">₹{roundOff}</span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t-2 border-slate-900 text-sm font-bold text-slate-950">
              <span>Grand Total:</span>
              <span className="font-mono text-base">{formatCurrency(grandTotal)}</span>
            </div>

            <div className="flex justify-between text-[11px] pt-1 text-emerald-800">
              <span>Amount Paid:</span>
              <span className="font-mono font-bold">₹{paidAmount}</span>
            </div>

            {parseFloat(String(dueAmount)) > 0 && (
              <div className="flex justify-between text-[11px] text-rose-700 font-bold">
                <span>Balance Due:</span>
                <span className="font-mono">₹{dueAmount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Terms & Signatures */}
        <div className="border-t border-slate-300 pt-4 mt-6">
          <div className="grid grid-cols-2 gap-8 text-[9px] text-slate-600 leading-normal">
            <div>
              <div className="font-bold text-slate-800 uppercase mb-0.5">Terms & Conditions</div>
              <ul className="list-disc pl-3 space-y-0.5">
                {(comp.invoiceTerms || []).map((term: string, idx: number) => (
                  <li key={idx}>{term}</li>
                ))}
              </ul>
              {comp.invoiceDeclaration && (
                <p className="text-[8px] text-slate-500 italic mt-1.5">{comp.invoiceDeclaration}</p>
              )}
            </div>

            <div className="flex flex-col justify-between items-end text-right">
              <div>Customer Signature</div>
              <div className="pt-8">
                <div className="font-bold text-slate-900 uppercase">For {storeName}</div>
                <div className="text-[8px] text-slate-500">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
