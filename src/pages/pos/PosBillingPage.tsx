import React, { useState, useEffect } from 'react';
import { usePosStore, PosItem } from '../../store/posStore';
import { useTerminalStore, PosTerminal } from '../../store/terminalStore';
import { useAuthStore } from '../../store/authStore';
import {
  useTodayGoldRates,
  usePurities,
  useJewelleryCategories,
  useAccounts,
  api,
} from '../../api/client';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { isPanRequired, isValidPan } from '../../utils/panValidator';
import { Sale, StoreSalePayload, PaymentMode, MakingChargeType } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { InvoicePrintA4 } from '../../components/print/InvoicePrintA4';
import { ThermalSlipPrint } from '../../components/print/ThermalSlipPrint';
import {
  Scan,
  Plus,
  Trash2,
  UserCheck,
  RotateCcw,
  Printer,
  AlertTriangle,
  Receipt,
  FileText,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Coins,
  Monitor,
  MapPin,
  LogIn,
  LogOut,
  CheckCircle2,
} from 'lucide-react';
import { COMPANY_DETAILS, APP_SETTINGS, isGoldEnabled, isSilverEnabled } from '../../config/company';

export const PosBillingPage: React.FC = () => {
  const {
    customer,
    items,
    oldGoldItems,
    invoiceType,
    isInterState,
    paymentMode,
    paidAmount,
    customerPan,
    paymentAccountId,
    notes,
    setCustomer,
    setInvoiceType,
    setIsInterState,
    addItem,
    updateItem,
    removeItem,
    addOldGold,
    updateOldGold,
    removeOldGold,
    setPaymentMode,
    setPaidAmount,
    setCustomerPan,
    setPaymentAccountId,
    setNotes,
    resetPos,
    getTotals,
  } = usePosStore();

  const { data: todayRates } = useTodayGoldRates();
  const { data: purities } = usePurities();
  const { data: categories } = useJewelleryCategories();
  const { data: accounts } = useAccounts();

  const dealsInGold = isGoldEnabled(COMPANY_DETAILS);
  const dealsInSilver = isSilverEnabled(COMPANY_DETAILS);

  // Local scanning and modal states
  const [tagInput, setTagInput] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Manual item entry modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    item_name: 'Custom Gold Ornament',
    category_id: 1,
    purity_id: 2, // 22K default
    gross_weight: 10.0,
    stone_weight: 0.0,
    rate_per_gram: 7350,
    making_charge_type: 'per_gram' as MakingChargeType,
    making_rate: 650,
    stone_value: 0,
    hallmarking_charge: 45,
    discount_amount: 0,
    huid: '',
  });

  // Customer search modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<any[]>([]);

  // Old gold accordion toggle
  const [showOldGold, setShowOldGold] = useState(false);

  // New old gold scrap form
  const [oldGoldForm, setOldGoldForm] = useState({
    description: 'Old Scrap Gold Necklace',
    gross_weight: 5.0,
    dust_weight: 0.2,
    purity_percent: 85,
    rate_per_gram: 7050,
  });

  // Print completed invoice modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multi-Area POS Terminal State
  const { user } = useAuthStore();
  const {
    terminals,
    activeSession,
    loginToTerminal,
    logoutFromTerminal,
    recordSaleInSession,
    syncSessionCashier,
    getAreas,
  } = useTerminalStore();

  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>(
    activeSession?.terminalId || terminals[0]?.id || ''
  );
  const [sessionCashierName, setSessionCashierName] = useState(
    user?.name || activeSession?.cashierName || 'Counter Billing Staff'
  );
  const [sessionOpeningFloat, setSessionOpeningFloat] = useState<number>(
    activeSession?.openingCash || 5000
  );

  // Sync user name to session cashier automatically
  useEffect(() => {
    if (user?.name) {
      syncSessionCashier(user.name);
      setSessionCashierName(user.name);
    }
  }, [user?.name, syncSessionCashier]);

  const handleTerminalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const termId = selectedTerminalId || terminals[0]?.id;
    if (!termId) return;

    loginToTerminal(
      termId,
      sessionCashierName || user?.name || 'Counter Billing Staff',
      Number(sessionOpeningFloat)
    );
    setIsTerminalModalOpen(false);
  };

  // Calculate live totals
  const totals = getTotals();

  // PAN mandatory validation check
  const requiresPan = isPanRequired(paymentMode, totals.grandTotal);
  const isPanValid = isValidPan(customerPan);
  const panBlocked = requiresPan && !isPanValid;

  // Auto-sync paidAmount when grandTotal changes if it was equal
  useEffect(() => {
    if (paidAmount === 0 || paidAmount === totals.grandTotal) {
      setPaidAmount(totals.grandTotal);
    }
  }, [totals.grandTotal]);

  // Handle Barcode Tag Scan
  const handleTagScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const tag = tagInput.trim();
    if (!tag) return;

    setScanLoading(true);
    setScanError(null);
    try {
      const item = await api.inventory.getByTag(tag);
      if (item.status !== 'in_stock') {
        setScanError(`Item ${tag} is already ${item.status.toUpperCase()} (Sold/Returned).`);
        return;
      }

      // Check if item already exists in cart
      const itemTag = item.tag_code || item.tagCode;
      if (items.some((i) => i.tag_code === itemTag || i.jewellery_item_id === item.id)) {
        setScanError(`Item ${tag} is already added in the bill cart.`);
        return;
      }

      // Determine today's board rate for this purity
      const itemPurityId = item.purity_id ?? item.purityId;
      const matchingRate = todayRates?.find(
        (r) => r.purityId === itemPurityId || r.purity?.karatCode === item.purity?.karatCode
      );
      const defaultRate = matchingRate ? matchingRate.sellingRatePerGram : 7350;

      addItem({
        jewellery_item_id: item.id,
        tag_code: itemTag,
        item_name: item.name || item.itemName,
        category_id: item.category_id ?? item.categoryId,
        category_name: item.category?.name || item.category?.categoryName,
        purity_id: itemPurityId,
        purity_code: item.purity?.karatCode || '22K',
        huid: item.huid || '',
        gross_weight: parseFloat(String(item.gross_weight ?? item.grossWeight)) || 0,
        stone_weight: parseFloat(String(item.stone_weight ?? item.stoneWeight)) || 0,
        rate_per_gram: defaultRate,
        making_charge_type: 'per_gram',
        making_rate: 650,
        stone_value: parseFloat(String(item.stone_value ?? item.stoneValue)) || 0,
        hallmarking_charge: 45,
        discount_amount: 0,
      });

      setTagInput('');
    } catch (err: any) {
      console.error(err);
      setScanError(`Tag "${tag}" not found in showroom inventory.`);
    } finally {
      setScanLoading(false);
    }
  };

  // Add Manual Item
  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    const purityObj = purities?.find((p) => p.id === manualForm.purity_id);
    const catObj = categories?.find((c) => c.id === manualForm.category_id);

    addItem({
      item_name: manualForm.item_name,
      category_id: manualForm.category_id,
      category_name: catObj?.name,
      purity_id: manualForm.purity_id,
      purity_code: purityObj?.karatCode || '22K',
      huid: manualForm.huid,
      gross_weight: Number(manualForm.gross_weight),
      stone_weight: Number(manualForm.stone_weight),
      rate_per_gram: Number(manualForm.rate_per_gram),
      making_charge_type: manualForm.making_charge_type,
      making_rate: Number(manualForm.making_rate),
      stone_value: Number(manualForm.stone_value),
      hallmarking_charge: Number(manualForm.hallmarking_charge),
      discount_amount: Number(manualForm.discount_amount),
    });

    setIsManualModalOpen(false);
  };

  // Add Old Gold
  const handleAddOldGold = (e: React.FormEvent) => {
    e.preventDefault();
    addOldGold({
      description: oldGoldForm.description,
      gross_weight: Number(oldGoldForm.gross_weight),
      dust_weight: Number(oldGoldForm.dust_weight),
      purity_percent: Number(oldGoldForm.purity_percent),
      rate_per_gram: Number(oldGoldForm.rate_per_gram),
    });
    setOldGoldForm({
      description: 'Old Scrap Gold',
      gross_weight: 0,
      dust_weight: 0,
      purity_percent: 85,
      rate_per_gram: todayRates?.[0]?.buyingRatePerGram || 7050,
    });
  };

  // Customer search
  const handleSearchCustomers = async (query: string) => {
    setCustomerSearch(query);
    if (query.length < 2) {
      setCustomerResults([]);
      return;
    }
    try {
      const res = await api.parties.list({ type: 'customer', search: query });
      setCustomerResults(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Complete Sale and Checkout
  const handleCompleteSale = async () => {
    // Ensure active terminal session exists, or auto-connect default counter
    const effectiveSession =
      activeSession ||
      loginToTerminal(
        terminals[0]?.id || 'term-bow-01',
        user?.name || 'Counter Billing Staff',
        terminals[0]?.openingBalance || 5000
      );

    if (items.length === 0) {
      alert('Please add at least one jewellery item to the bill.');
      return;
    }

    if (panBlocked) {
      alert('Indian Tax Law requires a valid 10-character PAN for cash payments of ₹2,00,000 or more.');
      return;
    }

    setIsSubmitting(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const payload: StoreSalePayload = {
        invoice_date: todayDate,
        party_id: customer?.id,
        customer_name: customer?.name || 'Retail Counter Customer',
        customer_mobile: customer?.mobile || undefined,
        customer_pan: customerPan || undefined,
        invoice_type: invoiceType,
        is_inter_state: isInterState,
        payment_mode: (paymentMode || 'cash').toLowerCase() as PaymentMode,
        payment_account_id: paymentAccountId || (accounts && accounts.length > 0 ? accounts[0].id : 1),
        paid_amount: Number(paidAmount) > 0 ? Number(paidAmount) : totals.grandTotal,
        notes: notes || undefined,
        terminal_id: effectiveSession.terminalId,
        terminal_code: effectiveSession.terminalCode,
        terminal_name: effectiveSession.terminalName,
        terminal_area: effectiveSession.area,
        cashier_name: effectiveSession.cashierName || user?.name || 'Showroom Cashier',
        items: items.map((it) => ({
          jewellery_item_id: it.jewellery_item_id,
          item_name: it.item_name,
          category_id: it.category_id,
          purity_id: it.purity_id,
          huid: it.huid,
          gross_weight: it.gross_weight,
          stone_weight: it.stone_weight,
          rate_per_gram: it.rate_per_gram,
          gold_rate_per_gram: it.rate_per_gram,
          making_charge_type: it.making_charge_type,
          making_charge_rate: it.making_rate,
          making_rate: it.making_rate,
          making_charges: it.making_charges_amount,
          making_charges_amount: it.making_charges_amount,
          stone_value: it.stone_value,
          hallmarking_charge: it.hallmarking_charge,
          discount_amount: it.discount_amount,
          taxable_amount: it.taxable_amount,
        })),
        old_gold_items: oldGoldItems.length > 0 ? oldGoldItems.map((og) => ({
          description: og.description,
          gross_weight: og.gross_weight,
          dust_weight: og.dust_weight,
          purity_percent: og.purity_percent,
          rate_per_gram: og.rate_per_gram,
        })) : undefined,
      };

      const created = await api.sales.create(payload);
      const invNum = created.invoice_number || created.invoiceNumber || 'INV-GENERATED';
      const enriched: Sale = {
        ...created,
        invoice_number: invNum,
        invoiceNumber: invNum,
        invoice_date: created.invoice_date || created.invoiceDate || todayDate,
        invoiceDate: created.invoiceDate || created.invoice_date || todayDate,
        customer_name: created.customer_name || created.customerName || customer?.name || 'Retail Counter Customer',
        customerName: created.customerName || created.customer_name || customer?.name || 'Retail Counter Customer',
        customer_mobile: created.customer_mobile || created.customerMobile || customer?.mobile || null,
        payment_mode: paymentMode,
        grand_total: created.grand_total ?? created.grandTotal ?? Number(totals.grandTotal),
        grandTotal: created.grandTotal ?? created.grand_total ?? Number(totals.grandTotal),
        paid_amount: created.paid_amount ?? created.paidAmount ?? (Number(paidAmount) > 0 ? Number(paidAmount) : Number(totals.grandTotal)),
        paidAmount: created.paidAmount ?? created.paid_amount ?? (Number(paidAmount) > 0 ? Number(paidAmount) : Number(totals.grandTotal)),
        total_taxable_amount: created.total_taxable_amount ?? created.taxableAmount ?? Number(totals.taxableAmount),
        taxableAmount: created.taxableAmount ?? created.total_taxable_amount ?? Number(totals.taxableAmount),
        total_gst_amount: created.total_gst_amount ?? created.totalTaxAmount ?? Number(totals.totalGst),
        totalTaxAmount: created.totalTaxAmount ?? created.total_gst_amount ?? Number(totals.totalGst),
        terminal_id: effectiveSession.terminalId,
        terminal_code: effectiveSession.terminalCode,
        terminal_name: effectiveSession.terminalName,
        terminal_area: effectiveSession.area,
        cashier_name: effectiveSession.cashierName || user?.name || 'Showroom Cashier',
        terminalId: effectiveSession.terminalId,
        terminalCode: effectiveSession.terminalCode,
        terminalName: effectiveSession.terminalName,
        terminalArea: effectiveSession.area,
        cashierName: effectiveSession.cashierName || user?.name || 'Showroom Cashier',
      };

      recordSaleInSession(Number(totals.grandTotal));
      setCompletedSale(enriched);
      resetPos();
    } catch (err: any) {
      console.error('Sale error:', err);
      let msg = err.response?.data?.message || 'Failed to complete sale transaction.';
      if (err.response?.data?.errors) {
        const errorList = Object.values(err.response.data.errors).flat();
        msg += '\n\nValidation Details:\n• ' + errorList.join('\n• ');
      }
      alert(`Sale Validation Notice:\n${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Active POS Terminal Counter Shift Strip */}
      <div className="bg-slate-900/90 rounded-2xl px-5 py-3 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {activeSession ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  {activeSession.terminalCode}
                </span>
                <span className="text-sm font-bold text-slate-100">{activeSession.terminalName}</span>
                <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  {activeSession.area}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Cashier: <strong className="text-slate-200">{activeSession.cashierName}</strong></span>
                <span>•</span>
                <span>Opening Cash Float: <strong className="text-amber-300 font-mono">₹{activeSession.openingCash.toLocaleString('en-IN')}</strong></span>
                <span>•</span>
                <span>Shift Sales: <strong className="text-emerald-400 font-mono">{activeSession.totalSalesCount} bills (₹{activeSession.totalSalesAmount.toLocaleString('en-IN')})</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-rose-300 text-xs font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>No POS Terminal counter logged in. You must select your terminal before billing.</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTerminalModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5 text-amber-400" />
            {activeSession ? 'Switch Counter' : 'Select POS Counter'}
          </button>
          {activeSession && (
            <button
              onClick={() => {
                if (confirm('End active POS counter shift?')) {
                  logoutFromTerminal();
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors cursor-pointer flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              End Shift
            </button>
          )}
        </div>
      </div>

      {/* Top Banner: Customer Selector & Quick Controls */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Customer Info Card */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm">{customer?.name || 'Retail Counter Customer'}</span>
              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
              >
                Change / Select
              </button>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{customer?.mobile ? `Mobile: ${customer.mobile}` : 'Walk-in'}</span>
              <span>•</span>
              <span className="text-slate-300">
                {isInterState ? 'Inter-State (3% IGST)' : 'Intra-State WB (1.5% CGST + 1.5% SGST)'}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Type & Inter-state Toggles */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setInvoiceType('tax_invoice')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                invoiceType === 'tax_invoice'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              GST Tax Invoice
            </button>
            <button
              onClick={() => setInvoiceType('estimate_memo')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                invoiceType === 'estimate_memo'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Estimate / Memo
            </button>
          </div>

          <button
            onClick={() => setIsInterState(!isInterState)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isInterState
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isInterState ? 'IGST (Inter-State)' : 'CGST+SGST (Local)'}
          </button>

          <button
            onClick={() => resetPos()}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Clear and Reset POS Terminal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Items & Scanning (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Barcode Tag Scan & Manual Entry Bar */}
          <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
            <form onSubmit={handleTagScan} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-amber-400">
                  <Scan className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Scan or type barcode tag code (e.g. TAG-261015-1042)..."
                  className="w-full bg-slate-950 border border-amber-500/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={scanLoading || !tagInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {scanLoading ? 'Looking up...' : 'Add Tag'}
              </button>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Custom Item</span>
              </button>
            </form>

            {scanError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}
          </div>

          {/* Active Cart Line Items Table */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="px-5 py-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-slate-200 text-sm font-cinzel">Cart Items ({items.length})</h3>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Gross: <strong className="text-slate-200">{formatWeight(totals.totalGrossWeight)}</strong> | Net Gold: <strong className="text-amber-400">{formatWeight(totals.totalNetWeight)}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono bg-slate-950/60">
                    <th className="p-3">#</th>
                    <th className="p-3">Item & Tag</th>
                    <th className="p-3 text-center">Purity</th>
                    <th className="p-3 text-right">Gross (g)</th>
                    <th className="p-3 text-right">Stone (g)</th>
                    <th className="p-3 text-right">Net Wt (g)</th>
                    <th className="p-3 text-right">Rate (₹/g)</th>
                    <th className="p-3 text-right">Making</th>
                    <th className="p-3 text-right">Taxable (₹)</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        <Sparkles className="w-6 h-6 text-amber-500/40 mx-auto mb-2" />
                        <p className="font-sans text-xs">No items in the billing cart.</p>
                        <p className="font-sans text-[11px] text-slate-600 mt-0.5">Scan a jewellery tag barcode above or add a custom item.</p>
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={it.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 text-slate-500">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-sans font-medium text-slate-100">{it.item_name}</div>
                          <div className="text-[10px] text-slate-500">
                            {it.tag_code && <span className="text-amber-400/80">{it.tag_code}</span>}
                            {it.huid && <span className="ml-1.5">• HUID: {it.huid}</span>}
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="gold" size="sm">{it.purity_code || '22K'}</Badge>
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-200">
                          {formatWeight(it.gross_weight)}
                        </td>
                        <td className="p-3 text-right text-slate-400">
                          {formatWeight(it.stone_weight)}
                        </td>
                        <td className="p-3 text-right font-bold text-amber-300">
                          {formatWeight(it.net_weight)}
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={it.rate_per_gram}
                            onChange={(e) => updateItem(it.id, { rate_per_gram: Number(e.target.value) })}
                            className="w-20 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-xs focus:border-amber-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-3 text-right text-slate-300">
                          ₹{it.making_charges_amount}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-100">
                          ₹{it.taxable_amount}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeItem(it.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Remove Item"
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
          </div>

          {/* Old Gold Exchange / Trade-In Buyback Accordion */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <button
              type="button"
              onClick={() => setShowOldGold(!showOldGold)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-200 text-xs font-cinzel">
                  Old Gold / Silver Exchange & Customer Trade-In ({oldGoldItems.length})
                </span>
                {totals.oldGoldTotal > 0 && (
                  <span className="text-xs font-mono font-bold text-amber-400">
                    - {formatCurrency(totals.oldGoldTotal)}
                  </span>
                )}
              </div>
              {showOldGold ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showOldGold && (
              <div className="p-5 border-t border-slate-800 space-y-4 bg-slate-950/40">
                {/* Quick Presets for Scrap */}
                <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-800/60">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Trade-In Preset:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const goldRate =
                        todayRates?.find((r) => r.purityId === 2 || r.purity?.karatCode === '22K')
                          ?.buyingRatePerGram ||
                        APP_SETTINGS.rates.default22kBuying ||
                        7050;
                      setOldGoldForm({
                        description: 'Old Scrap Gold',
                        gross_weight: 5.0,
                        dust_weight: 0.2,
                        purity_percent: 85,
                        rate_per_gram: Number(goldRate),
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium cursor-pointer"
                  >
                    Old Scrap Gold (85%)
                  </button>
                  {dealsInSilver && (
                    <button
                      type="button"
                      onClick={() => {
                        const silverRate =
                          todayRates?.find(
                            (r) =>
                              r.metalType === 'silver' ||
                              r.purity?.karatCode?.toLowerCase().includes('silver') ||
                              r.purityId === 7
                          )?.buyingRatePerGram ||
                          APP_SETTINGS.rates.defaultSilverBuying ||
                          88;
                        setOldGoldForm({
                          description: 'Old Scrap Silver (Payal/Utensils)',
                          gross_weight: 50.0,
                          dust_weight: 1.0,
                          purity_percent: 80,
                          rate_per_gram: Number(silverRate),
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer flex items-center gap-1"
                    >
                      <Coins className="w-3 h-3 text-slate-400" />
                      Old Scrap Silver (80%)
                    </button>
                  )}
                </div>

                {/* Form to add scrap item */}
                <form onSubmit={handleAddOldGold} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Description</label>
                    <input
                      type="text"
                      value={oldGoldForm.description}
                      onChange={(e) => setOldGoldForm({ ...oldGoldForm, description: e.target.value })}
                      placeholder="Old Scrap Bangles"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Gross Wt (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={oldGoldForm.gross_weight}
                      onChange={(e) => setOldGoldForm({ ...oldGoldForm, gross_weight: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono text-right"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Purity (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={oldGoldForm.purity_percent}
                      onChange={(e) => setOldGoldForm({ ...oldGoldForm, purity_percent: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono text-right"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-mono mb-1">Melt Rate (₹/g)</label>
                    <input
                      type="number"
                      value={oldGoldForm.rate_per_gram}
                      onChange={(e) => setOldGoldForm({ ...oldGoldForm, rate_per_gram: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono text-right"
                      required
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/40 cursor-pointer"
                    >
                      + Add Scrap
                    </button>
                  </div>
                </form>

                {/* Old Gold Table */}
                {oldGoldItems.length > 0 && (
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                        <th className="pb-1.5">Description</th>
                        <th className="pb-1.5 text-right">Gross Wt</th>
                        <th className="pb-1.5 text-right">Melt Purity</th>
                        <th className="pb-1.5 text-right">Rate</th>
                        <th className="pb-1.5 text-right">Exchange Value</th>
                        <th className="pb-1.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {oldGoldItems.map((og) => (
                        <tr key={og.id}>
                          <td className="py-2 text-slate-200">{og.description}</td>
                          <td className="py-2 text-right text-slate-300">{formatWeight(og.gross_weight)}</td>
                          <td className="py-2 text-right text-amber-300">{og.purity_percent}%</td>
                          <td className="py-2 text-right">₹{og.rate_per_gram}</td>
                          <td className="py-2 text-right font-bold text-amber-400">-₹{og.exchange_value}</td>
                          <td className="py-2 text-center">
                            <button
                              onClick={() => removeOldGold(og.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Summary & Payment Box (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/95 rounded-2xl border border-amber-500/30 p-5 shadow-2xl gold-card-glow space-y-4">
            <h3 className="font-bold text-slate-100 font-cinzel text-base border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Bill Breakdown</span>
              <Badge variant="gold" size="sm">
                {invoiceType === 'tax_invoice' ? 'GST 3%' : 'Memo'}
              </Badge>
            </h3>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Taxable Amount:</span>
                <span className="font-bold text-slate-200">₹{totals.taxableAmount.toFixed(2)}</span>
              </div>

              {invoiceType === 'tax_invoice' && (
                <>
                  {isInterState ? (
                    <div className="flex justify-between text-slate-400">
                      <span>IGST (3.0%):</span>
                      <span className="text-slate-200">₹{totals.igstAmount.toFixed(2)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>CGST (1.5%):</span>
                        <span className="text-slate-200">₹{totals.cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>SGST (1.5%):</span>
                        <span className="text-slate-200">₹{totals.sgstAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </>
              )}

              {totals.oldGoldTotal > 0 && (
                <div className="flex justify-between text-amber-400 font-bold pt-1 border-t border-slate-800">
                  <span>Old Gold Trade-In:</span>
                  <span>-₹{totals.oldGoldTotal.toFixed(2)}</span>
                </div>
              )}

              {totals.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span>{totals.roundOff > 0 ? `+₹${totals.roundOff}` : `-₹${Math.abs(totals.roundOff)}`}</span>
                </div>
              )}

              {/* NET GRAND TOTAL */}
              <div className="pt-3 border-t-2 border-amber-500/30 flex justify-between items-baseline">
                <span className="text-xs uppercase font-bold text-slate-300 font-sans">Net Payable:</span>
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 uppercase font-mono mb-1.5">Payment Mode</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['cash', 'upi', 'card', 'bank_transfer', 'cheque'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`py-1.5 px-2 rounded-lg capitalize font-medium text-center transition-all cursor-pointer ${
                        paymentMode === mode
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Paid input */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-400">Paid Amount (₹)</label>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(totals.grandTotal)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-mono font-semibold underline cursor-pointer"
                    >
                      Exact (₹{totals.grandTotal.toLocaleString('en-IN')})
                    </button>
                  </div>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Deposit Account</label>
                  <select
                    value={paymentAccountId || ''}
                    onChange={(e) => setPaymentAccountId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="">Default Counter Drawer</option>
                    {accounts?.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.account_name || acc.accountName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mandatory PAN Validation Banner */}
              {requiresPan && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Rule 114B: PAN Mandatory</span>
                  </div>
                  <p className="text-[11px] text-amber-200/80 leading-tight">
                    Income Tax requires customer PAN for cash purchases of ₹2,00,000 or more.
                  </p>
                  <div>
                    <input
                      type="text"
                      maxLength={10}
                      value={customerPan}
                      onChange={(e) => setCustomerPan(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs font-mono uppercase tracking-widest text-slate-100 placeholder-slate-600 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  {customerPan && !isPanValid && (
                    <p className="text-[10px] text-rose-400">Invalid PAN format. Must be 5 letters, 4 digits, 1 letter.</p>
                  )}
                </div>
              )}

              {/* Complete & Checkout Button */}
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={isSubmitting || items.length === 0 || panBlocked}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-extrabold text-sm tracking-wide shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Generating Tax Invoice...</span>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>COMPLETE SALE & PRINT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Item Entry Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Add Custom Jewellery Item"
        subtitle="For non-tagged custom orders or manual inventory"
        maxWidth="lg"
      >
        <form onSubmit={handleAddManualItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Item Description</label>
              <input
                type="text"
                value={manualForm.item_name}
                onChange={(e) => setManualForm({ ...manualForm, item_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Purity Karat / Metal</label>
              <select
                value={manualForm.purity_id}
                onChange={(e) => {
                  const pid = Number(e.target.value);
                  const pObj = purities?.find((p) => p.id === pid);
                  const isSilv =
                    pObj?.karatCode?.toLowerCase().includes('silver') ||
                    pObj?.karatName?.toLowerCase().includes('silver') ||
                    pid === 7 ||
                    pid === 8;

                  const matchingRate = todayRates?.find(
                    (r) =>
                      r.purityId === pid ||
                      (isSilv &&
                        (r.metalType === 'silver' ||
                          r.purity?.karatCode?.toLowerCase().includes('silver')))
                  );

                  const newRate = matchingRate
                    ? Number(matchingRate.sellingRatePerGram)
                    : isSilv
                    ? APP_SETTINGS.rates.defaultSilverSelling || 95
                    : pid === 1
                    ? APP_SETTINGS.rates.default24kSelling || 7850
                    : pid === 3
                    ? APP_SETTINGS.rates.default18kSelling || 6050
                    : APP_SETTINGS.rates.default22kSelling || 7350;

                  setManualForm({
                    ...manualForm,
                    purity_id: pid,
                    rate_per_gram: newRate,
                    making_rate: isSilv ? 25 : 650,
                  });
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              >
                {purities?.map((p) => (
                  <option key={p.id} value={p.id}>{p.karatName} ({p.karatCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Gross Weight (g)</label>
              <input
                type="number"
                step="0.001"
                value={manualForm.gross_weight}
                onChange={(e) => setManualForm({ ...manualForm, gross_weight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stone Weight (g)</label>
              <input
                type="number"
                step="0.001"
                value={manualForm.stone_weight}
                onChange={(e) => setManualForm({ ...manualForm, stone_weight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                {purities?.find((p) => p.id === manualForm.purity_id)?.karatCode?.toLowerCase().includes('silver') ||
                manualForm.purity_id === 7 ||
                manualForm.purity_id === 8
                  ? 'Silver Rate (₹/g)'
                  : 'Gold Rate (₹/g)'}
              </label>
              <input
                type="number"
                value={manualForm.rate_per_gram}
                onChange={(e) => setManualForm({ ...manualForm, rate_per_gram: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Making Charge Rate (₹/g)</label>
              <input
                type="number"
                value={manualForm.making_rate}
                onChange={(e) => setManualForm({ ...manualForm, making_rate: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">BIS HUID Code (if hallmarked)</label>
              <input
                type="text"
                value={manualForm.huid}
                onChange={(e) => setManualForm({ ...manualForm, huid: e.target.value.toUpperCase() })}
                placeholder="e.g. HM-AB1234"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono uppercase"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Add to Bill Cart
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Selection Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Select Customer / Buyer"
        subtitle="Search existing customer registry or set walk-in details"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => handleSearchCustomers(e.target.value)}
              placeholder="Type customer name or mobile number..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {/* Quick Walk-in default */}
            <div
              onClick={() => {
                setCustomer({ name: 'Retail Counter Customer', mobile: '', state_code: '19' });
                setIsCustomerModalOpen(false);
              }}
              className="p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 text-xs cursor-pointer border border-slate-800 flex justify-between items-center"
            >
              <span className="font-semibold text-slate-200">Standard Walk-in Customer</span>
              <span className="text-[10px] text-amber-400 font-mono">West Bengal (19)</span>
            </div>

            {customerResults.map((cust) => (
              <div
                key={cust.id}
                onClick={() => {
                  setCustomer(cust);
                  if (cust.pan) setCustomerPan(cust.pan);
                  setIsCustomerModalOpen(false);
                }}
                className="p-2.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 text-xs cursor-pointer border border-slate-800 flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-slate-100">{cust.name}</div>
                  <div className="text-[10px] text-slate-400">{cust.mobile || 'No mobile'} {cust.city ? `• ${cust.city}` : ''}</div>
                </div>
                <div className="text-right font-mono text-[10px]">
                  <div className="text-amber-400">{cust.state || 'West Bengal'}</div>
                  {cust.pan && <div className="text-slate-400">PAN: {cust.pan}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* POS Terminal Selection & Shift Login Modal */}
      <Modal
        isOpen={isTerminalModalOpen}
        onClose={() => setIsTerminalModalOpen(false)}
        title="Select POS Terminal Counter"
        subtitle="শোরুম এরিয়া ভিত্তিক POS টার্মিনাল ও ক্যাশ ড্রয়ার লগইন"
        maxWidth="lg"
      >
        <form onSubmit={handleTerminalLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Select Counter Terminal <span className="text-amber-400">*</span>
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {terminals.map((term) => {
                const isSelected = selectedTerminalId === term.id;
                const isTermActive = term.status === 'active';
                return (
                  <div
                    key={term.id}
                    onClick={() => {
                      if (isTermActive) {
                        setSelectedTerminalId(term.id);
                        setSessionOpeningFloat(term.openingBalance || 5000);
                        if (!sessionCashierName || sessionCashierName === 'Showroom Cashier') {
                          setSessionCashierName(user?.name || term.assignedStaff || 'Showroom Cashier');
                        }
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-slate-100 ring-1 ring-amber-500/30'
                        : isTermActive
                        ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        : 'bg-slate-950/20 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {term.code}
                        </span>
                        <span className="text-sm font-bold text-slate-100">{term.name}</span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-amber-300/90 font-medium">{term.area}</span>
                        {term.address && <span className="truncate max-w-[200px] text-[11px]">• {term.address}</span>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-slate-400 uppercase">Float Cash</div>
                      <div className="text-xs font-mono font-bold text-amber-400">
                        ₹{term.openingBalance.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Inv: {term.invoicePrefix}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Cashier Staff Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={sessionCashierName}
                onChange={(e) => setSessionCashierName(e.target.value)}
                placeholder="Rahul Mukherjee"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Drawer Opening Float (₹) <span className="text-amber-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={sessionOpeningFloat}
                onChange={(e) => setSessionOpeningFloat(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Shift links all sales to this counter terminal</span>
            </div>

            <button
              type="submit"
              disabled={!selectedTerminalId}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Open Counter & Start Billing
            </button>
          </div>
        </form>
      </Modal>

      {/* Print Completed Sale Modal */}
      {completedSale && (
        <Modal
          isOpen={Boolean(completedSale)}
          onClose={() => setCompletedSale(null)}
          title="Sale Completed Successfully!"
          subtitle={`Invoice #${completedSale.invoice_number || completedSale.invoiceNumber} is generated and inventory is updated.`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            {/* Format toggle: A4 vs Thermal */}
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

            {/* Print Preview Container */}
            <div className="max-h-[70vh] overflow-y-auto">
              {printFormat === 'a4' ? (
                <InvoicePrintA4 sale={completedSale} />
              ) : (
                <ThermalSlipPrint sale={completedSale} />
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
