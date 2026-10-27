import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Gstr1SummaryData, Gstr3bSummaryData, GstStatusData, BusinessProfile } from '../../types';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  ShieldCheck,
  Printer,
  FileCode,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Coins,
  Building2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';
import { getCompanyDetails } from '../../config/company';

type PeriodPreset = 'this_month' | 'last_month' | 'q1' | 'q2' | 'q3' | 'q4' | 'fy_current' | 'today' | 'custom';

export const GstReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'gstr1' | 'gstr3b'>('gstr1');
  const [activePreset, setActivePreset] = useState<PeriodPreset>('this_month');
  const [fromDate, setFromDate] = useState('2026-10-01');
  const [toDate, setToDate] = useState('2026-10-31');

  const [gstStatus, setGstStatus] = useState<GstStatusData | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [gstr1Data, setGstr1Data] = useState<Gstr1SummaryData | null>(null);
  const [gstr3bData, setGstr3bData] = useState<Gstr3bSummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  // Apply Period Preset
  const handleApplyPreset = (preset: PeriodPreset) => {
    setActivePreset(preset);
    const now = new Date();
    const year = now.getFullYear();

    switch (preset) {
      case 'today': {
        const todayStr = now.toISOString().split('T')[0];
        setFromDate(todayStr);
        setToDate(todayStr);
        break;
      }
      case 'this_month': {
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        setFromDate(`${year}-${month}-01`);
        setToDate(`${year}-${month}-${lastDay}`);
        break;
      }
      case 'last_month': {
        const prevMonthDate = new Date(year, now.getMonth() - 1, 1);
        const pYear = prevMonthDate.getFullYear();
        const pMonth = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(pYear, prevMonthDate.getMonth() + 1, 0).getDate();
        setFromDate(`${pYear}-${pMonth}-01`);
        setToDate(`${pYear}-${pMonth}-${lastDay}`);
        break;
      }
      case 'q1': // Apr - Jun
        setFromDate(`${year}-04-01`);
        setToDate(`${year}-06-30`);
        break;
      case 'q2': // Jul - Sep
        setFromDate(`${year}-07-01`);
        setToDate(`${year}-09-30`);
        break;
      case 'q3': // Oct - Dec
        setFromDate(`${year}-10-01`);
        setToDate(`${year}-12-31`);
        break;
      case 'q4': // Jan - Mar
        setFromDate(`${year + 1}-01-01`);
        setToDate(`${year + 1}-03-31`);
        break;
      case 'fy_current': // Apr to Mar
        setFromDate(`${year}-04-01`);
        setToDate(`${year + 1}-03-31`);
        break;
      case 'custom':
        break;
    }
  };

  const fetchStatus = async () => {
    try {
      const [statusRes, profileRes] = await Promise.all([
        api.gst.status().catch(() => null),
        api.profile.get().catch(() => null),
      ]);
      if (statusRes) setGstStatus(statusRes);
      if (profileRes) setProfile(profileRes);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      if (activeTab === 'gstr1') {
        const res = await api.gst.gstr1Summary({ from_date: fromDate, to_date: toDate });
        setGstr1Data(res);
      } else {
        const res = await api.gst.gstr3bSummary({ from_date: fromDate, to_date: toDate });
        setGstr3bData(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [activeTab, fromDate, toDate]);

  // Derived GSTR-1 figures
  const b2csTaxable = gstr1Data?.table7_b2cs?.taxableAmount || 0;
  const b2csCgst = gstr1Data?.table7_b2cs?.cgstAmount || 0;
  const b2csSgst = gstr1Data?.table7_b2cs?.sgstAmount || 0;
  const b2csIgst = gstr1Data?.table7_b2cs?.igstAmount || 0;

  const b2bTaxable = gstr1Data?.table4_b2b?.taxableAmount || 0;
  const b2bCgst = gstr1Data?.table4_b2b?.cgstAmount || 0;
  const b2bSgst = gstr1Data?.table4_b2b?.sgstAmount || 0;
  const b2bIgst = gstr1Data?.table4_b2b?.igstAmount || 0;

  const totalGrossTaxable = b2csTaxable + b2bTaxable;
  const totalCgst = b2csCgst + b2bCgst;
  const totalSgst = b2csSgst + b2bSgst;
  const totalIgst = b2csIgst + b2bIgst;
  const totalOutputTax = totalCgst + totalSgst + totalIgst;

  // Derived GSTR-3B figures
  const g3bTaxable = gstr3bData?.table3_1_outwardSupplies?.netTaxableAmount ?? gstr3bData?.table3_1_outwardSupplies?.taxableAmount ?? 0;
  const g3bCgst = gstr3bData?.table3_1_outwardSupplies?.cgstAmount ?? 0;
  const g3bSgst = gstr3bData?.table3_1_outwardSupplies?.sgstAmount ?? 0;
  const g3bIgst = gstr3bData?.table3_1_outwardSupplies?.igstAmount ?? 0;
  const g3bTotalTax = gstr3bData?.table3_1_outwardSupplies?.totalTax ?? (g3bCgst + g3bSgst + g3bIgst);

  const itcCgst = gstr3bData?.table4_eligibleItc?.cgstItc ?? gstr3bData?.table4_eligibleItc?.cgstAmount ?? 0;
  const itcSgst = gstr3bData?.table4_eligibleItc?.sgstItc ?? gstr3bData?.table4_eligibleItc?.sgstAmount ?? 0;
  const itcIgst = gstr3bData?.table4_eligibleItc?.igstItc ?? gstr3bData?.table4_eligibleItc?.igstAmount ?? 0;
  const itcTotal = gstr3bData?.table4_eligibleItc?.totalItc ?? (itcCgst + itcSgst + itcIgst);

  const cashPayable = gstr3bData?.netTaxPayableInCash?.totalTax ?? Math.max(0, g3bTotalTax - itcTotal);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Export Govt. GST Portal JSON (GSTR-1 Offline Tool Schema)
  // ──────────────────────────────────────────────────────────────────────────
  const handleExportGovtJson = () => {
    if (!gstr1Data) return;

    const gstin = gstStatus?.gstin || profile?.gstin || '19AAACB1234F1Z5';
    // Format fp as MMYYYY
    const d = new Date(fromDate);
    const fp = `${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;

    const govtJson = {
      gstin: gstin,
      fp: fp,
      gt: totalGrossTaxable,
      cur_gt: totalGrossTaxable,
      version: 'GSTR1_v3.0.4',
      hash: 'hash-bharat-jewellery',
      b2b: gstr1Data.table4_b2b?.invoices?.map((inv, idx) => ({
        ctin: inv.customerGstin,
        inv: [
          {
            inum: inv.invoiceNo,
            idt: inv.invoiceDate,
            val: inv.totalAmount,
            pos: String(inv.posStateCode || '19'),
            rchrg: 'N',
            inv_typ: 'R',
            itms: [
              {
                num: idx + 1,
                itm_det: {
                  rt: 3.0,
                  txval: inv.taxableAmount,
                  camt: inv.cgstAmount,
                  samt: inv.sgstAmount,
                  csamt: 0.0,
                },
              },
            ],
          },
        ],
      })) || [],
      b2cl: [],
      b2cs: [
        {
          sply_ty: 'INTRA',
          typ: 'OE',
          pos: String(gstStatus?.stateCode || '19'),
          rt: 3.0,
          txval: b2csTaxable,
          camt: b2csCgst,
          samt: b2csSgst,
          csamt: 0.0,
        },
      ],
      cdnur: gstr1Data.table9b_cdnur?.notes?.map((n) => ({
        typ: 'B2BUR',
        nt_num: n.creditNoteNo,
        nt_dt: n.creditNoteDate,
        p_gst: 'N',
        val: n.totalCreditAmount,
        itms: [
          {
            num: 1,
            itm_det: {
              rt: 3.0,
              txval: n.taxableAmount,
              camt: n.cgstAmount,
              samt: n.sgstAmount,
              csamt: 0.0,
            },
          },
        ],
      })) || [],
      hsn: {
        data: gstr1Data.table12_hsn?.map((h, i) => ({
          num: i + 1,
          hsn_sc: h.hsnCode,
          desc: h.description,
          uqc: h.uqc || 'GMS',
          qty: h.totalNetWeight || h.totalGrossWeight,
          val: h.totalValue,
          txval: h.taxableAmount,
          camt: h.cgstAmount,
          samt: h.sgstAmount,
          csamt: 0.0,
        })) || [],
      },
    };

    const blob = new Blob([JSON.stringify(govtJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${gstin}_${fp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Export Excel / CSV Spreadsheets
  // ──────────────────────────────────────────────────────────────────────────
  const handleExportCsv = () => {
    const comp = getCompanyDetails(profile);
    const compGstin = gstStatus?.gstin || comp.gstin;
    const compStateCode = gstStatus?.stateCode || comp.stateCode;
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'gstr1') {
      csvContent += `${comp.name.toUpperCase()} - GSTR-1 COMPLIANCE REPORT\n`;
      csvContent += `GSTIN,${compGstin},State Code,${compStateCode}\n`;
      csvContent += `Period From,${fromDate},Period To,${toDate}\n\n`;

      csvContent += `TABLE 12: HSN SUMMARY (HSN 7113 & 7108)\n`;
      csvContent += `HSN Code,Description,UQC,Total Qty (Grams),Taxable Value (INR),CGST 1.5%,SGST 1.5%,IGST 3%,Total Value (INR)\n`;
      gstr1Data?.table12_hsn?.forEach((h) => {
        csvContent += `"${h.hsnCode}","${h.description}","${h.uqc}",${h.totalNetWeight},${h.taxableAmount},${h.cgstAmount},${h.sgstAmount},${h.igstAmount},${h.totalValue}\n`;
      });

      csvContent += `\nTABLE 7: B2C SMALL RETAIL COUNTER SUPPLIES (3% INTRA-STATE)\n`;
      csvContent += `Supply Type,POS State,Rate %,Taxable Value,CGST 1.5%,SGST 1.5%,Total Tax\n`;
      csvContent += `INTRA-STATE,${compStateCode},3.00%,${b2csTaxable},${b2csCgst},${b2csSgst},${b2csCgst + b2csSgst}\n`;

      csvContent += `\nTABLE 9B: UNREGISTERED CUSTOMER RETURNS & CREDIT NOTES (CDNUR)\n`;
      csvContent += `Credit Note No,Date,Original Invoice,Customer,Taxable Reversal,CGST Reversal,SGST Reversal,Total Credit Note\n`;
      gstr1Data?.table9b_cdnur?.notes?.forEach((n) => {
        csvContent += `"${n.creditNoteNo}","${n.creditNoteDate}","${n.originalInvoiceNo}","${n.customerName}",${n.taxableAmount},${n.cgstAmount},${n.sgstAmount},${n.totalCreditAmount}\n`;
      });
    } else {
      csvContent += `${comp.name.toUpperCase()} - GSTR-3B MONTHLY SUMMARY\n`;
      csvContent += `GSTIN,${compGstin},State Code,${compStateCode}\n`;
      csvContent += `Period From,${fromDate},Period To,${toDate}\n\n`;
      csvContent += `Section,Description,Taxable Value (INR),CGST (INR),SGST (INR),IGST (INR),Total Tax (INR)\n`;
      csvContent += `3.1,Tax on Outward Supplies (Net of Returns),${g3bTaxable},${g3bCgst},${g3bSgst},${g3bIgst},${g3bTotalTax}\n`;
      csvContent += `4.0,Eligible Input Tax Credit (ITC),0,${itcCgst},${itcSgst},${itcIgst},${itcTotal}\n`;
      csvContent += `5.1,Net Tax Payable in Cash via Challan,${g3bTaxable},${gstr3bData?.netTaxPayableInCash?.cgst || 0},${gstr3bData?.netTaxPayableInCash?.sgst || 0},0,${cashPayable}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeTab.toUpperCase()}_GST_Report_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const comp = getCompanyDetails(profile);

  return (
    <div className="space-y-6">
      {/* Printable Official Header (Hidden on screen, visible during window.print()) */}
      <div className="hidden print:block text-slate-950 p-4 border-b border-slate-300 font-sans">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider">
              {comp.name}
            </h1>
            <p className="text-xs text-slate-600">
              {comp.address} • Phone: {comp.phone}
            </p>
            <div className="mt-2 text-xs font-mono">
              <span>GSTIN: <strong>{gstStatus?.gstin || comp.gstin}</strong></span>
              <span className="mx-2">|</span>
              <span>State: <strong>{gstStatus?.stateCode || comp.stateCode} - {comp.state}</strong></span>
              <span className="mx-2">|</span>
              <span>Hallmark License: <strong>{comp.hallmarkLicenseNo}</strong></span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold uppercase text-slate-800">
              {activeTab === 'gstr1' ? 'GSTR-1 Outward Supplies Audit' : 'GSTR-3B Tax Return Summary'}
            </div>
            <div className="text-xs font-mono text-slate-600 mt-1">
              Period: {fromDate} to {toDate}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            Statutory GST Filing Center (GSTR-1 & GSTR-3B)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-compiled HSN 7113 gold jewellery tax returns with 1-click Govt. Portal JSON and CSV exports.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'gstr1' && (
            <button
              onClick={handleExportGovtJson}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              title="Download official JSON file to upload directly on services.gst.gov.in"
            >
              <FileCode className="w-4 h-4" />
              <span>Govt. GST Portal JSON</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors"
            title="Download CSV for Chartered Accountant / Tax Consultant"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition-colors"
            title="Print formal tax audit report"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* GST Status Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-slate-200 font-bold font-sans">
              GSTIN: <span className="font-mono text-amber-300">{gstStatus?.gstin || '19AAACB1234F1Z5'}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              State: {gstStatus?.stateCode || 19} (West Bengal) • Gold Tax: 3.00% (1.5% CGST + 1.5% SGST)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            Primary HSN: <strong className="text-amber-400">7113</strong> (Gold Jewellery)
          </span>
          <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-slate-300">
            Bullion HSN: <strong className="text-amber-400">7108</strong> (Raw Gold)
          </span>
          <Badge variant="emerald" size="sm">
            GST Active
          </Badge>
        </div>
      </div>

      {/* Date Filter & Tab Switcher Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* GSTR-1 vs GSTR-3B Tab Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('gstr1')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'gstr1'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GSTR-1 (Outward Supplies & HSN)
            </button>
            <button
              onClick={() => setActiveTab('gstr3b')}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'gstr3b'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GSTR-3B (Liability & ITC Offset)
            </button>
          </div>

          {/* Date Picker Form */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setActivePreset('custom');
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <span className="text-slate-500 font-sans">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setActivePreset('custom');
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={fetchReports}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title="Refresh GST Data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Period Presets */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-sans mr-1">Period Presets:</span>
          {[
            { id: 'today', label: 'Today' },
            { id: 'this_month', label: 'This Month (Oct 2026)' },
            { id: 'last_month', label: 'Last Month (Sep 2026)' },
            { id: 'q2', label: 'Q2 (Jul - Sep)' },
            { id: 'q3', label: 'Q3 (Oct - Dec)' },
            { id: 'fy_current', label: 'FY 2026-27' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset.id as PeriodPreset)}
              className={`text-[10px] font-sans px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activePreset === preset.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Compiling statutory GST tables from retail sales & returns..." />
      ) : activeTab === 'gstr1' ? (
        /* ═══════════════════════════════════════════════════════════════════════
           GSTR-1 VIEW (Outward Supplies & HSN 7113)
           ═══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          {/* Summary Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-mono">
            <Card variant="glass" className="hover:border-amber-500/30 transition-all">
              <div className="text-[10px] text-slate-400 uppercase">Gross Taxable Outward</div>
              <div className="text-xl font-bold text-slate-100 mt-1">
                {formatCurrency(totalGrossTaxable)}
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-2">B2CS + B2B Sales</div>
            </Card>

            <Card variant="glass" className="hover:border-amber-500/30 transition-all">
              <div className="text-[10px] text-slate-400 uppercase">Central Tax (CGST 1.5%)</div>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {formatCurrency(totalCgst)}
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-2">Intra-State Central</div>
            </Card>

            <Card variant="glass" className="hover:border-amber-500/30 transition-all">
              <div className="text-[10px] text-slate-400 uppercase">State Tax (SGST 1.5%)</div>
              <div className="text-xl font-bold text-amber-400 mt-1">
                {formatCurrency(totalSgst)}
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-2">West Bengal State</div>
            </Card>

            <Card variant="glass" className="hover:border-sky-500/30 transition-all">
              <div className="text-[10px] text-slate-400 uppercase">Integrated Tax (IGST 3%)</div>
              <div className="text-xl font-bold text-sky-400 mt-1">
                {formatCurrency(totalIgst)}
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-2">Inter-State Shipments</div>
            </Card>

            <Card variant="glass" className="hover:border-emerald-500/30 transition-all">
              <div className="text-[10px] text-slate-400 uppercase">Total Output Tax</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">
                {formatCurrency(totalOutputTax)}
              </div>
              <div className="text-[10px] text-slate-500 font-sans mt-2">CGST + SGST + IGST</div>
            </Card>
          </div>

          {/* Table 12: HSN Summary of Outward Supplies */}
          <Card
            variant="glass"
            title="Table 12: HSN Summary of Outward Supplies"
            subtitle="Harmonized System of Nomenclature code breakdown for precious metal jewellery"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-950/60">
                    <th className="p-3">HSN Code</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">UQC</th>
                    <th className="p-3 text-right">Total Net Weight</th>
                    <th className="p-3 text-right">Taxable Value (₹)</th>
                    <th className="p-3 text-right">CGST 1.5% (₹)</th>
                    <th className="p-3 text-right">SGST 1.5% (₹)</th>
                    <th className="p-3 text-right">IGST 3% (₹)</th>
                    <th className="p-3 text-right">Total Invoice Value (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {gstr1Data?.table12_hsn && gstr1Data.table12_hsn.length > 0 ? (
                    gstr1Data.table12_hsn.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-bold text-amber-400">{h.hsnCode}</td>
                        <td className="p-3 font-sans text-slate-200">{h.description}</td>
                        <td className="p-3 text-center text-slate-400">{h.uqc || 'GMS'}</td>
                        <td className="p-3 text-right font-bold text-amber-300">
                          {formatWeight(h.totalNetWeight || h.totalGrossWeight || 0)}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-100">
                          {formatCurrency(h.taxableAmount)}
                        </td>
                        <td className="p-3 text-right text-amber-300">{formatCurrency(h.cgstAmount)}</td>
                        <td className="p-3 text-right text-amber-300">{formatCurrency(h.sgstAmount)}</td>
                        <td className="p-3 text-right text-sky-400">{formatCurrency(h.igstAmount)}</td>
                        <td className="p-3 text-right font-bold text-slate-100">
                          {formatCurrency(h.totalValue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="p-6 text-center text-slate-500 font-sans">
                        No outward supplies recorded for HSN 7113 in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Table 7: B2CS & Table 9B: Returns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table 7: B2CS Retail Counter Supplies */}
            <Card
              variant="glass"
              title="Table 7: B2C Small Supplies (Counter POS)"
              subtitle="Intra-state retail sales to walk-in consumers without GSTIN"
            >
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Supply Type:</span>
                  <span className="font-bold text-slate-200">INTRA-STATE (West Bengal - 19)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Applicable Tax Rate:</span>
                  <span className="font-bold text-amber-400">3.00% (1.5% CGST + 1.5% SGST)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Gross Taxable Outward:</span>
                  <span className="font-bold text-slate-100">{formatCurrency(b2csTaxable)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Central Tax (CGST 1.5%):</span>
                  <span className="font-bold text-amber-300">{formatCurrency(b2csCgst)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">State Tax (SGST 1.5%):</span>
                  <span className="font-bold text-amber-300">{formatCurrency(b2csSgst)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
                  <span className="font-sans">Total B2CS Tax Amount:</span>
                  <span>{formatCurrency(b2csCgst + b2csSgst)}</span>
                </div>
              </div>
            </Card>

            {/* Table 9B: Customer Returns & Credit Notes (CDNUR) */}
            <Card
              variant="glass"
              title="Table 9B: Credit Notes (Returns & Buyback Reversals)"
              subtitle="Reversal of tax liability for returned jewellery articles"
            >
              {gstr1Data?.table9b_cdnur?.notes && gstr1Data.table9b_cdnur.notes.length > 0 ? (
                <div className="space-y-2.5 font-mono text-xs max-h-[300px] overflow-y-auto pr-1">
                  {gstr1Data.table9b_cdnur.notes.map((n: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center text-slate-200">
                        <span className="font-bold text-amber-400">{n.creditNoteNo}</span>
                        <span className="text-[10px] text-slate-400">{n.creditNoteDate}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-sans">
                        <span>Inv: {n.originalInvoiceNo} • {n.customerName}</span>
                        <span className="font-mono text-rose-400 font-bold">
                          Tax Reversed: -{formatCurrency(n.cgstAmount + n.sgstAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                        <span>Taxable: {formatCurrency(n.taxableAmount)}</span>
                        <span>Total Note: {formatCurrency(n.totalCreditAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 font-sans text-xs">
                  No sales return credit notes registered in this period.
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════
           GSTR-3B VIEW (Liability vs Eligible ITC & Challan Cash)
           ═══════════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Section 3.1: Outward Tax Liability */}
            <Card
              variant="glass"
              title="3.1 Tax on Outward Supplies (Net of Returns)"
              subtitle="Output tax collected from customers after adjusting sales return credit notes"
            >
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Net Taxable Outward Value:</span>
                  <span className="font-bold text-slate-100">{formatCurrency(g3bTaxable)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Central Tax (CGST 1.5%):</span>
                  <span className="text-amber-300 font-bold">{formatCurrency(g3bCgst)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">State Tax (SGST 1.5%):</span>
                  <span className="text-amber-300 font-bold">{formatCurrency(g3bSgst)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Integrated Tax (IGST 3.0%):</span>
                  <span className="text-sky-400 font-bold">{formatCurrency(g3bIgst)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
                  <span className="font-sans">Total Output Tax Liability:</span>
                  <span>{formatCurrency(g3bTotalTax)}</span>
                </div>
              </div>
            </Card>

            {/* Section 4: Eligible Input Tax Credit (ITC) */}
            <Card
              variant="glass"
              title="4. Eligible Input Tax Credit (ITC)"
              subtitle="Tax paid on bullion raw gold purchases & registered store expenses"
            >
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">ITC from Bullion Raw Gold:</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(itcTotal)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Central Tax Credit (CGST):</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(itcCgst)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">State Tax Credit (SGST):</span>
                  <span className="font-bold text-emerald-400">{formatCurrency(itcSgst)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                  <span className="text-slate-400 font-sans">Integrated Tax Credit (IGST):</span>
                  <span className="font-bold text-sky-400">{formatCurrency(itcIgst)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                  <span className="font-sans">Total Eligible ITC Available:</span>
                  <span>{formatCurrency(itcTotal)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Net Cash Tax Payable Challan Preview */}
          <Card variant="gold" className="text-center py-6 px-4">
            <div className="text-xs uppercase font-mono text-amber-300 tracking-wider">
              Section 5.1: Net GST Cash Liability to Pay in Bank (CPIN Challan)
            </div>
            <div className="text-3xl font-extrabold font-mono text-slate-100 mt-2">
              {formatCurrency(cashPayable)}
            </div>
            <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto font-sans leading-relaxed">
              Calculated as: Output Tax Liability ({formatCurrency(g3bTotalTax)}) minus Eligible Input Tax Credit ({formatCurrency(itcTotal)}).
              Pay this amount before the 20th of next month to avoid statutory interest under Section 50.
            </p>
          </Card>
        </div>
      )}

      {/* Printable Formal Sign-off Section (Visible only during window.print()) */}
      <div className="hidden print:block pt-8 border-t border-slate-400 font-sans text-xs text-slate-900 mt-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="font-bold">DECLARATION:</div>
            <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">
              I hereby declare that the particulars given above are true, correct, and complete to the best of my knowledge and belief, and nothing has been concealed therefrom.
            </p>
            <div className="mt-12 text-slate-800 font-bold">
              Authorized Signatory / Showroom Owner
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold">VERIFIED BY:</div>
            <p className="text-[10px] text-slate-700 mt-1 leading-relaxed">
              Chartered Accountant / Tax Practitioner Signature & Seal
            </p>
            <div className="mt-12 text-slate-800 font-bold">
              Membership / ARN # ___________________
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
