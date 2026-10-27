import React, { useState, useEffect, useMemo } from 'react';
import { api, usePurities, useAccounts, useJewelleryCategories, useTodayGoldRates, extractListData } from '../../api/client';
import { COMPANY_DETAILS, APP_SETTINGS, isGoldEnabled, isSilverEnabled } from '../../config/company';
import { Purchase, StorePurchasePayload } from '../../types';
import { formatCurrency, formatWeight, formatDate } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Truck,
  Plus,
  Ban,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  Receipt,
  Gem,
  Coins,
  FileSpreadsheet,
  ArrowDownLeft,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

interface PurchaseItemFormRow {
  id: string;
  item_description: string;
  category_id?: number;
  purity_id: number;
  gross_weight: number;
  stone_weight: number;
  net_weight: number;
  rate_per_gram: number;
  making_charges: number;
  stone_charges: number;
  gst_rate: number;
  create_stock_item: boolean;
}

export const PurchaseListPage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const { data: purities } = usePurities();
  const { data: accounts } = useAccounts();
  const { data: categories } = useJewelleryCategories();
  const { data: todayRates } = useTodayGoldRates();

  const dealsInGold = isGoldEnabled(COMPANY_DETAILS);
  const dealsInSilver = isSilverEnabled(COMPANY_DETAILS);

  const rate24k = useMemo(
    () => todayRates?.find((r) => r.purity?.karatCode === '24K' || r.purityId === 1),
    [todayRates]
  );
  const rate22k = useMemo(
    () => todayRates?.find((r) => r.purity?.karatCode === '22K' || r.purityId === 2),
    [todayRates]
  );
  const rate18k = useMemo(
    () => todayRates?.find((r) => r.purity?.karatCode === '18K' || r.purityId === 3),
    [todayRates]
  );
  const rateSilver = useMemo(
    () =>
      todayRates?.find(
        (r) =>
          r.metalType?.toLowerCase() === 'silver' ||
          r.purity?.karatCode?.toLowerCase().includes('silver') ||
          r.purity?.karatName?.toLowerCase().includes('silver') ||
          r.purityId === 7 ||
          r.purityId === 8
      ),
    [todayRates]
  );

  const getRateForPurity = (purityId: number, isBuyback: boolean = false) => {
    if (purityId === 1) {
      const val = isBuyback ? rate24k?.buyingRatePerGram : rate24k?.sellingRatePerGram;
      return Number(val) || (isBuyback ? 7550 : 7850);
    }
    if (purityId === 2) {
      const val = isBuyback ? rate22k?.buyingRatePerGram : rate22k?.sellingRatePerGram;
      return Number(val) || (isBuyback ? 7050 : 7350);
    }
    if (purityId === 3) {
      const val = isBuyback ? rate18k?.buyingRatePerGram : rate18k?.sellingRatePerGram;
      return Number(val) || (isBuyback ? 5750 : 6050);
    }

    const pObj = purities?.find((p) => p.id === purityId);
    const isSilv =
      pObj?.karatCode?.toLowerCase().includes('silver') ||
      pObj?.karatName?.toLowerCase().includes('silver') ||
      purityId === 7 ||
      purityId === 8;

    if (isSilv) {
      const val = isBuyback ? rateSilver?.buyingRatePerGram : rateSilver?.sellingRatePerGram;
      return Number(val) || (isBuyback ? (APP_SETTINGS.rates.defaultSilverBuying || 88) : (APP_SETTINGS.rates.defaultSilverSelling || 95));
    }

    const matched = todayRates?.find((r) => r.purityId === purityId);
    if (matched) {
      const val = isBuyback ? matched.buyingRatePerGram : matched.sellingRatePerGram;
      return Number(val) || 7350;
    }
    return 7350;
  };

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'vendor_jewellery' | 'bullion_raw_gold' | 'customer_old_gold_buyback'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all');

  // Create Purchase Entry Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [partyTypeMode, setPartyTypeMode] = useState<'vendor' | 'customer'>('vendor');
  const [selectedPartyId, setSelectedPartyId] = useState<number | ''>('');
  const [vendorBillNo, setVendorBillNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [vendorBillDate, setVendorBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseType, setPurchaseType] = useState<'vendor_jewellery' | 'bullion_raw_gold' | 'customer_old_gold_buyback'>('vendor_jewellery');
  const [activeBullionMetal, setActiveBullionMetal] = useState<'gold' | 'silver'>('gold');
  const [isGstApplicable, setIsGstApplicable] = useState(true);
  const [itcEligibility, setItcEligibility] = useState<'inputs' | 'capital_goods' | 'ineligible'>('inputs');
  const [notes, setNotes] = useState('');

  // Item Rows
  const [itemRows, setItemRows] = useState<PurchaseItemFormRow[]>(() => {
    const isOnlySilv = !dealsInGold && dealsInSilver;
    if (isOnlySilv) {
      return [
        {
          id: 'item-1',
          item_description: 'Fine Silver Articles & Utensils (999)',
          category_id: 14,
          purity_id: 7, // Silver 999
          gross_weight: 100.0,
          stone_weight: 0.0,
          net_weight: 100.0,
          rate_per_gram: 95,
          making_charges: 25,
          stone_charges: 0,
          gst_rate: 3.0,
          create_stock_item: true,
        },
      ];
    }
    return [
      {
        id: 'item-1',
        item_description: '22K Wholesale Gold Jewellery Batch',
        category_id: undefined,
        purity_id: 2, // 22K (916)
        gross_weight: 25.0,
        stone_weight: 0.0,
        net_weight: 25.0,
        rate_per_gram: 7350,
        making_charges: 250,
        stone_charges: 0,
        gst_rate: 3.0,
        create_stock_item: true,
      },
    ];
  });

  // Update initial row with live rate when todayRates loads
  useEffect(() => {
    if (todayRates && todayRates.length > 0) {
      setItemRows((prev) =>
        prev.map((it) => {
          if (it.rate_per_gram === 7350 || it.rate_per_gram === 7550 || it.rate_per_gram === 7100) {
            return {
              ...it,
              rate_per_gram: getRateForPurity(it.purity_id, purchaseType === 'customer_old_gold_buyback'),
            };
          }
          return it;
        })
      );
    }
  }, [todayRates]);

  // Payment section
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'bank_transfer' | 'cash' | 'upi' | 'cheque'>('bank_transfer');
  const [paymentAccountId, setPaymentAccountId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View Details Modal
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Cancel Modal
  const [cancelPurchase, setCancelPurchase] = useState<Purchase | null>(null);
  const [cancelReason, setCancelReason] = useState('Vendor returned invoice / goods mismatch');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.purchases.list();
      const list = extractListData<Purchase>(res);
      setPurchases(list);
    } catch (err) {
      console.error('Failed to load purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParties = async () => {
    try {
      const [vendorRes, custRes] = await Promise.all([
        api.parties.list({ type: 'vendor' }),
        api.parties.list({ type: 'customer' }),
      ]);
      setVendors(extractListData(vendorRes));
      setCustomers(extractListData(custRes));
    } catch (err) {
      console.error('Failed to load parties:', err);
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchParties();
  }, []);

  // Update default items when purchase type changes
  const handleTypeChange = (
    newType: 'vendor_jewellery' | 'bullion_raw_gold' | 'bullion_raw_silver' | 'customer_old_gold_buyback'
  ) => {
    if (newType === 'bullion_raw_silver') {
      setPurchaseType('bullion_raw_gold');
      setActiveBullionMetal('silver');
      setPartyTypeMode('vendor');
      const silvPurity = purities?.find((p) => p.karatCode?.toLowerCase().includes('silver') || p.id === 7);
      const sId = silvPurity?.id || 7;
      const silvCat = categories?.find(
        (c) => c.name?.toLowerCase().includes('silver') || c.categoryName?.toLowerCase().includes('silver')
      );
      setItemRows([
        {
          id: `item-${Date.now()}`,
          item_description: 'Fine Pure Silver Bullion Bar (999)',
          category_id: silvCat?.id || categories?.[0]?.id,
          purity_id: sId,
          gross_weight: 1000.0,
          stone_weight: 0.0,
          net_weight: 1000.0,
          rate_per_gram: getRateForPurity(sId, false),
          making_charges: 0,
          stone_charges: 0,
          gst_rate: 3.0,
          create_stock_item: false,
        },
      ]);
      setIsGstApplicable(true);
      return;
    }

    setActiveBullionMetal('gold');
    setPurchaseType(newType as any);
    if (newType === 'bullion_raw_gold') {
      setPartyTypeMode('vendor');
      setItemRows([
        {
          id: `item-${Date.now()}`,
          item_description: '24K Fine Bullion Gold Bar (999)',
          category_id: categories?.[0]?.id,
          purity_id: 1, // 24K default
          gross_weight: 50.0,
          stone_weight: 0.0,
          net_weight: 50.0,
          rate_per_gram: getRateForPurity(1, false),
          making_charges: 0,
          stone_charges: 0,
          gst_rate: 3.0,
          create_stock_item: false,
        },
      ]);
      setIsGstApplicable(true);
    } else if (newType === 'customer_old_gold_buyback') {
      setPartyTypeMode('customer');
      const isOnlySilver = !dealsInGold && dealsInSilver;
      const silvPurity = purities?.find((p) => p.karatCode?.toLowerCase().includes('silver') || p.id === 7);
      const sId = silvPurity?.id || 7;
      setItemRows([
        {
          id: `item-${Date.now()}`,
          item_description: isOnlySilver
            ? 'Customer Scrap Silver / Old Utensils Melting'
            : 'Customer Scrap Gold / Old Jewellery Melting',
          category_id: undefined,
          purity_id: isOnlySilver ? sId : 2, // Silver 999 or 22K
          gross_weight: isOnlySilver ? 100.0 : 12.0,
          stone_weight: isOnlySilver ? 0.0 : 0.5,
          net_weight: isOnlySilver ? 100.0 : 11.5,
          rate_per_gram: getRateForPurity(isOnlySilver ? sId : 2, true),
          making_charges: 0,
          stone_charges: 0,
          gst_rate: 0.0, // URD purchases are typically 0% GST to unregistered customer
          create_stock_item: false,
        },
      ]);
      setIsGstApplicable(false);
    } else {
      setPartyTypeMode('vendor');
      const isOnlySilver = !dealsInGold && dealsInSilver;
      const silvPurity = purities?.find((p) => p.karatCode?.toLowerCase().includes('silver') || p.id === 7);
      const defPurity = isOnlySilver ? (silvPurity?.id || 7) : 2;
      const silvCat = categories?.find(
        (c) => c.name?.toLowerCase().includes('silver') || c.categoryName?.toLowerCase().includes('silver')
      );
      setItemRows([
        {
          id: `item-${Date.now()}`,
          item_description: isOnlySilver
            ? 'Finished Wholesale Silver Articles / Utensils'
            : 'Finished Wholesale Jewellery Piece',
          category_id: isOnlySilver ? (silvCat?.id || categories?.[0]?.id) : categories?.[0]?.id,
          purity_id: defPurity,
          gross_weight: isOnlySilver ? 50.0 : 20.0,
          stone_weight: 0.0,
          net_weight: isOnlySilver ? 50.0 : 20.0,
          rate_per_gram: getRateForPurity(defPurity, false),
          making_charges: isOnlySilver ? 25 : 350,
          stone_charges: 0,
          gst_rate: 3.0,
          create_stock_item: true,
        },
      ]);
      setIsGstApplicable(true);
    }
  };

  // Calculations for items
  const calculatedItems = useMemo(() => {
    return itemRows.map((item) => {
      const netWeight = Math.max(0, (Number(item.gross_weight) || 0) - (Number(item.stone_weight) || 0));
      const goldCost = netWeight * (Number(item.rate_per_gram) || 0);
      const makingCost = (Number(item.making_charges) || 0) * (purchaseType === 'vendor_jewellery' ? netWeight : 1);
      const stoneCost = Number(item.stone_charges) || 0;
      const taxable = goldCost + makingCost + stoneCost;
      const gstRate = isGstApplicable ? (Number(item.gst_rate) || 0) : 0;
      const gstAmt = (taxable * gstRate) / 100;
      const lineTotal = taxable + gstAmt;

      return {
        ...item,
        net_weight: netWeight,
        gold_cost: goldCost,
        making_cost: makingCost,
        taxable_amount: taxable,
        gst_amount: gstAmt,
        line_total: lineTotal,
      };
    });
  }, [itemRows, isGstApplicable, purchaseType]);

  const totalGrossWeight = calculatedItems.reduce((acc, it) => acc + (Number(it.gross_weight) || 0), 0);
  const totalNetWeight = calculatedItems.reduce((acc, it) => acc + it.net_weight, 0);
  const totalTaxable = calculatedItems.reduce((acc, it) => acc + it.taxable_amount, 0);
  const totalGst = calculatedItems.reduce((acc, it) => acc + it.gst_amount, 0);
  const grandTotal = Math.round(totalTaxable + totalGst);
  const dueBalance = Math.max(0, grandTotal - (Number(paidAmount) || 0));

  const handleAddItemRow = (metal: 'gold' | 'silver' | 'default' = 'default') => {
    const isBuyback = purchaseType === 'customer_old_gold_buyback';
    const silverPurity = purities?.find((p) => p.karatCode?.toLowerCase().includes('silver') || p.id === 7);
    const sId = silverPurity?.id || 7;
    const isSilver = metal === 'silver' || (!dealsInGold && dealsInSilver);
    const chosenPurity = isSilver ? sId : purchaseType === 'bullion_raw_gold' ? 1 : 2;

    const silvCat = categories?.find(
      (c) => c.name?.toLowerCase().includes('silver') || c.categoryName?.toLowerCase().includes('silver')
    );
    const goldCat = categories?.[0];

    setItemRows([
      ...itemRows,
      {
        id: `item-${Date.now()}`,
        item_description:
          isSilver
            ? purchaseType === 'bullion_raw_gold'
              ? 'Fine Pure Silver Bullion Bar (999)'
              : isBuyback
              ? 'Customer Scrap Silver / Old Utensils Melting'
              : 'Silver Articles & Utensils (999)'
            : purchaseType === 'bullion_raw_gold'
            ? 'Bullion Gold Bar (999)'
            : isBuyback
            ? 'Customer Scrap Gold / Old Jewellery Melting'
            : 'Wholesale Jewellery Item',
        category_id: isSilver ? (silvCat?.id || goldCat?.id) : goldCat?.id,
        purity_id: chosenPurity,
        gross_weight: isSilver ? 100.0 : 10.0,
        stone_weight: 0.0,
        net_weight: isSilver ? 100.0 : 10.0,
        rate_per_gram: getRateForPurity(chosenPurity, isBuyback),
        making_charges: isSilver
          ? purchaseType === 'vendor_jewellery'
            ? 25
            : 0
          : purchaseType === 'vendor_jewellery'
          ? 250
          : 0,
        stone_charges: 0,
        gst_rate: isGstApplicable ? 3.0 : 0.0,
        create_stock_item: purchaseType === 'vendor_jewellery',
      },
    ]);
  };

  const handleUpdateItemRow = (id: string, partial: Partial<PurchaseItemFormRow>) => {
    setItemRows(itemRows.map((it) => (it.id === id ? { ...it, ...partial } : it)));
  };

  const handleRemoveItemRow = (id: string) => {
    if (itemRows.length === 1) return;
    setItemRows(itemRows.filter((it) => it.id !== id));
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartyId) {
      alert(`Please select a ${partyTypeMode === 'vendor' ? 'Wholesale Vendor' : 'Customer'}.`);
      return;
    }

    if (itemRows.length === 0) {
      alert('Please add at least one purchase item line.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: StorePurchasePayload = {
        purchase_date: purchaseDate,
        vendor_bill_no: vendorBillNo.trim() || `BILL-${Date.now().toString().slice(-6)}`,
        vendor_bill_date: vendorBillDate || purchaseDate,
        party_id: Number(selectedPartyId),
        purchase_type: purchaseType,
        is_gst_applicable: isGstApplicable,
        tax_type: isGstApplicable ? 'intra_state' : 'non_gst',
        itc_eligibility: isGstApplicable ? itcEligibility : 'ineligible',
        paid_amount: Number(paidAmount) || 0,
        payment_mode: paidAmount > 0 ? paymentMode : undefined,
        payment_account_id: paidAmount > 0 && paymentAccountId ? Number(paymentAccountId) : undefined,
        notes: notes.trim() || undefined,
        items: calculatedItems.map((it) => ({
          item_description: it.item_description.trim() || 'Jewellery Purchase Item',
          description: it.item_description.trim() || 'Jewellery Purchase Item',
          category_id: it.category_id ? Number(it.category_id) : undefined,
          purity_id: Number(it.purity_id),
          gross_weight: Number(it.gross_weight),
          stone_weight: Number(it.stone_weight) || 0,
          net_weight: Number(it.net_weight),
          rate_per_gram: Number(it.rate_per_gram),
          making_charges: Number(it.making_charges) || 0,
          stone_charges: Number(it.stone_charges) || 0,
          gst_rate: isGstApplicable ? Number(it.gst_rate) : 0,
          create_stock_item: Boolean(it.create_stock_item && purchaseType === 'vendor_jewellery'),
        })),
      };

      await api.purchases.create(payload);
      setIsCreateOpen(false);
      // Reset form
      setVendorBillNo('');
      setNotes('');
      setPaidAmount(0);
      fetchPurchases();
      alert('Purchase Entry recorded successfully!');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to record purchase entry.';
      alert(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelPurchase) return;
    setIsCancelling(true);
    try {
      await api.purchases.cancel(cancelPurchase.id, cancelReason);
      setCancelPurchase(null);
      fetchPurchases();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to cancel purchase.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      // Type filter
      const pType = p.purchase_type || p.purchaseType;
      if (typeFilter !== 'all' && pType !== typeFilter) return false;

      // Status filter
      const isCanc = p.is_cancelled || p.isCancelled || p.status === 'cancelled';
      if (statusFilter === 'active' && isCanc) return false;
      if (statusFilter === 'cancelled' && !isCanc) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const invoiceNo = (p.purchase_invoice_no || p.purchaseInvoiceNo || '').toLowerCase();
        const billNo = (p.vendor_bill_no || p.vendorBillNo || '').toLowerCase();
        const partyName = (p.party?.name || p.party?.partyName || '').toLowerCase();
        if (!invoiceNo.includes(query) && !billNo.includes(query) && !partyName.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [purchases, typeFilter, statusFilter, searchTerm]);

  // Overall Metrics
  const metrics = useMemo(() => {
    const totalCount = purchases.length;
    const activePurchases = purchases.filter((p) => !p.is_cancelled && !p.isCancelled && p.status !== 'cancelled');
    const totalNetWt = activePurchases.reduce((acc, p) => acc + (Number(p.total_net_weight ?? p.totalNetWeight) || 0), 0);
    const totalGrandVal = activePurchases.reduce((acc, p) => acc + (Number(p.grand_total ?? p.grandTotal) || 0), 0);
    const totalItc = activePurchases.reduce((acc, p) => acc + (Number(p.total_gst_amount ?? p.totalTaxAmount) || 0), 0);
    return { totalCount, totalNetWt, totalGrandVal, totalItc };
  }, [purchases]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
              Procurement & Inward
            </span>
          </div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2.5 mt-1">
            <Truck className="w-6 h-6 text-amber-400" />
            Purchase Entry & Procurement
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record wholesale ornament bills, refinery bullion bars, and customer old gold buyback (URD vouchers) with GST ITC tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPurchases}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition-all cursor-pointer"
            title="Refresh Purchases"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (vendors.length === 0 && customers.length === 0) {
                fetchParties();
              }
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Purchase Entry</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="glass" className="relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">Total Purchase Bills</div>
              <div className="text-2xl font-bold font-mono text-slate-100 mt-1">{metrics.totalCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400">
            Recorded in system
          </div>
        </Card>

        <Card variant="glass" className="relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">Net Gold Inward</div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{formatWeight(metrics.totalNetWt)}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Gem className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400">
            Active stock procurement
          </div>
        </Card>

        <Card variant="glass" className="relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">Total Inward Value</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{formatCurrency(metrics.totalGrandVal)}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400">
            Net purchase expenditure
          </div>
        </Card>

        <Card variant="glass" className="relative overflow-hidden group hover:border-sky-500/40 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">Eligible GST (ITC)</div>
              <div className="text-2xl font-bold font-mono text-sky-400 mt-1">{formatCurrency(metrics.totalItc)}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400">
            GSTR-3B Input Tax Credit
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Purchase #, Vendor Bill #, or Vendor Name..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Purchase Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Purchase Types</option>
            <option value="vendor_jewellery">Wholesale Jewellery (Gold & Silver)</option>
            <option value="bullion_raw_gold">Bullion Bars (Gold & Silver)</option>
            <option value="customer_old_gold_buyback">Old Scrap Buyback (URD)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Completed)</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Purchases Data Table */}
      <Card variant="glass" className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner message="Loading procurement records & purchase bills..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono bg-slate-950/80">
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Bill #</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Supplier / Party</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5 text-right">Net Wt</th>
                  <th className="p-3.5 text-right">Taxable</th>
                  <th className="p-3.5 text-right">GST (ITC)</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center text-slate-400 font-sans">
                      <Truck className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-slate-300">No purchase entries match your criteria.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Click <strong className="text-amber-400">+ New Purchase Entry</strong> above to record wholesale stock or bullion inward.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => {
                    const invoiceNo = p.purchase_invoice_no || p.purchaseInvoiceNo || `PUR-#${p.id}`;
                    const billNo = p.vendor_bill_no || p.vendorBillNo || '—';
                    const partyName = p.party?.name || p.party?.partyName || 'Supplier';
                    const rawType = p.purchase_type || p.purchaseType || 'vendor_jewellery';
                    const isCancelled = Boolean(p.is_cancelled || p.isCancelled || p.status === 'cancelled');

                    let typeBadgeVariant: 'gold' | 'emerald' | 'ruby' | 'silver' = 'gold';
                    let typeLabel = 'Wholesale Jewellery';
                    const hasSilverItems = p.items?.some((it: any) => {
                      const pCode = it.purity?.karatCode || '';
                      const pName = it.purity?.karatName || '';
                      const desc = it.item_description || it.itemDescription || '';
                      return (
                        it.purity_id === 7 ||
                        it.purity_id === 8 ||
                        it.purityId === 7 ||
                        it.purityId === 8 ||
                        pCode.toLowerCase().includes('silver') ||
                        pName.toLowerCase().includes('silver') ||
                        desc.toLowerCase().includes('silver')
                      );
                    });

                    if (rawType === 'bullion_raw_gold') {
                      if (hasSilverItems) {
                        typeBadgeVariant = 'silver';
                        typeLabel = 'Silver Bullion (999)';
                      } else {
                        typeBadgeVariant = 'gold';
                        typeLabel = 'Gold Bullion (24K)';
                      }
                    } else if (rawType === 'customer_old_gold_buyback') {
                      typeBadgeVariant = hasSilverItems ? 'silver' : 'ruby';
                      typeLabel = hasSilverItems ? 'Old Silver Buyback' : 'Old Scrap Buyback';
                    } else {
                      if (hasSilverItems) {
                        typeBadgeVariant = 'silver';
                        typeLabel = 'Wholesale Silver';
                      }
                    }

                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-bold text-amber-400 flex items-center gap-1.5">
                          <span>{invoiceNo}</span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">{billNo}</td>
                        <td className="p-3.5 text-slate-400 font-sans">{formatDate(p.purchase_date || p.purchaseDate)}</td>
                        <td className="p-3.5 font-sans font-medium text-slate-200">{partyName}</td>
                        <td className="p-3.5 font-sans">
                          <Badge variant={typeBadgeVariant} size="sm">
                            {typeLabel}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right font-bold text-amber-300">
                          {formatWeight(p.total_net_weight ?? p.totalNetWeight)}
                        </td>
                        <td className="p-3.5 text-right text-slate-300">
                          ₹{(Number(p.taxable_amount ?? p.taxableAmount) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right text-emerald-400 font-semibold">
                          ₹{(Number(p.total_gst_amount ?? p.totalTaxAmount) || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3.5 text-right font-bold text-slate-100 text-sm">
                          {formatCurrency(p.grand_total ?? p.grandTotal)}
                        </td>
                        <td className="p-3.5 text-center font-sans">
                          <Badge variant={isCancelled ? 'ruby' : 'emerald'} size="sm">
                            {isCancelled ? 'cancelled' : (p.payment_status || p.paymentStatus || 'completed')}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedPurchase(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                              title="View Purchase Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {!isCancelled && (
                              <button
                                onClick={() => setCancelPurchase(p)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                                title="Cancel Purchase & Revert Stock"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ============================================================================ */}
      {/* Comprehensive Purchase Entry Modal */}
      {/* ============================================================================ */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record New Purchase Entry"
        subtitle="Inward finished jewellery, bullion bars, or customer old gold with GST ITC eligibility"
        maxWidth="6xl"
      >
        <form onSubmit={handleCreatePurchase} className="space-y-5">
          {/* Purchase Type Selector */}
          <div className={`grid grid-cols-1 ${dealsInSilver ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2.5 p-1.5 bg-slate-950 rounded-2xl border border-slate-800`}>
            <button
              type="button"
              onClick={() => handleTypeChange('vendor_jewellery')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                purchaseType === 'vendor_jewellery'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gem className="w-3.5 h-3.5" />
              <span>Wholesale Jewellery</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('bullion_raw_gold')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                purchaseType === 'bullion_raw_gold' && activeBullionMetal === 'gold'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Gold Bullion (24K)</span>
            </button>
            {dealsInSilver && (
              <button
                type="button"
                onClick={() => handleTypeChange('bullion_raw_silver')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  purchaseType === 'bullion_raw_gold' && activeBullionMetal === 'silver'
                    ? 'bg-slate-200 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-slate-400" />
                <span>Silver Bullion (999)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleTypeChange('customer_old_gold_buyback')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                purchaseType === 'customer_old_gold_buyback'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Old Scrap Buyback (URD)</span>
            </button>
          </div>

          {/* Supplier & Invoice Header Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {partyTypeMode === 'vendor' ? 'Wholesale Vendor *' : 'Customer *'}
              </label>
              <select
                value={selectedPartyId}
                onChange={(e) => setSelectedPartyId(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                required
              >
                <option value="">
                  Select {partyTypeMode === 'vendor' ? 'Vendor...' : 'Customer...'}
                </option>
                {(partyTypeMode === 'vendor' ? vendors : customers).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || p.partyName} {p.city ? `(${p.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {partyTypeMode === 'vendor' ? 'Bill / Invoice #' : 'Buyback Slip #'} *
              </label>
              <input
                type="text"
                value={vendorBillNo}
                onChange={(e) => setVendorBillNo(e.target.value)}
                placeholder="e.g. VEND-2026-901"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Date *</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => {
                  setPurchaseDate(e.target.value);
                  setVendorBillDate(e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">GST Applicable?</label>
              <select
                value={isGstApplicable ? 'yes' : 'no'}
                onChange={(e) => setIsGstApplicable(e.target.value === 'yes')}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="yes">Yes (3% GST ITC)</option>
                <option value="no">No (Non-GST / URD)</option>
              </select>
            </div>

            {isGstApplicable && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ITC Eligibility</label>
                <select
                  value={itcEligibility}
                  onChange={(e) => setItcEligibility(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="inputs">Inputs (Resale)</option>
                  <option value="capital_goods">Capital Goods</option>
                  <option value="ineligible">Ineligible</option>
                </select>
              </div>
            )}

            <div className={!isGstApplicable ? 'col-span-2' : ''}>
              <label className="block text-xs font-medium text-slate-300 mb-1">Remarks / Note</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional supplier notes"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Items Repeater Section */}
          <div className="space-y-3">
            {/* Live Board Rates Banner & Quick Apply */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 font-cinzel">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>
                    {!dealsInGold && dealsInSilver
                      ? "Today's Silver Rates:"
                      : dealsInGold && !dealsInSilver
                      ? "Today's Gold Rates:"
                      : "Today's Board Rates:"}
                  </span>
                </div>
                {dealsInGold && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const r = getRateForPurity(1, false);
                        const has24k = itemRows.some((row) => row.purity_id === 1);
                        if (has24k) {
                          setItemRows(itemRows.map(row => row.purity_id === 1 ? { ...row, rate_per_gram: r } : row));
                        } else {
                          setItemRows(itemRows.map((row, idx) => idx === 0 ? { ...row, purity_id: 1, rate_per_gram: r, item_description: '24K Fine Bullion Gold Bar (999)', making_charges: 0 } : row));
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono transition-all cursor-pointer text-xs"
                      title="Click to apply 24K rate to items"
                    >
                      <span className="text-amber-300 font-semibold">24K:</span> ₹{rate24k ? rate24k.sellingRatePerGram : APP_SETTINGS.rates.default24kSelling}/g
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const r = getRateForPurity(2, purchaseType === 'customer_old_gold_buyback');
                        const has22k = itemRows.some((row) => row.purity_id === 2);
                        if (has22k) {
                          setItemRows(itemRows.map(row => row.purity_id === 2 ? { ...row, rate_per_gram: r } : row));
                        } else {
                          setItemRows(itemRows.map((row, idx) => idx === 0 ? { ...row, purity_id: 2, rate_per_gram: r, item_description: '22K Wholesale Gold Jewellery Batch', making_charges: 250 } : row));
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-500/30 text-slate-200 font-mono transition-all cursor-pointer text-xs"
                      title="Click to apply 22K rate to items"
                    >
                      <span className="text-amber-400 font-semibold">22K:</span> ₹{rate22k ? rate22k.sellingRatePerGram : APP_SETTINGS.rates.default22kSelling}/g
                      {purchaseType === 'customer_old_gold_buyback' && (
                        <span className="text-emerald-400 text-[10px] ml-1">
                          (Buy: ₹{rate22k ? rate22k.buyingRatePerGram : APP_SETTINGS.rates.default22kBuying})
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const r = getRateForPurity(3, purchaseType === 'customer_old_gold_buyback');
                        const has18k = itemRows.some((row) => row.purity_id === 3);
                        if (has18k) {
                          setItemRows(itemRows.map(row => row.purity_id === 3 ? { ...row, rate_per_gram: r } : row));
                        } else {
                          setItemRows(itemRows.map((row, idx) => idx === 0 ? { ...row, purity_id: 3, rate_per_gram: r, item_description: '18K Wholesale Gold Jewellery Batch', making_charges: 300 } : row));
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono transition-all cursor-pointer text-xs"
                      title="Click to apply 18K rate to items"
                    >
                      <span className="text-amber-200 font-semibold">18K:</span> ₹{rate18k ? rate18k.sellingRatePerGram : APP_SETTINGS.rates.default18kSelling}/g
                    </button>
                  </>
                )}
                {dealsInSilver && (
                  <button
                    type="button"
                    onClick={() => {
                      const silverPurity = purities?.find(
                        (p) => p.karatCode?.toLowerCase().includes('silver') || p.id === 7 || p.id === 8
                      );
                      const sId = silverPurity?.id || 7;
                      const r = getRateForPurity(sId, purchaseType === 'customer_old_gold_buyback');
                      const silvCat = categories?.find(
                        (c) => c.name?.toLowerCase().includes('silver') || c.categoryName?.toLowerCase().includes('silver')
                      );

                      const hasSilverRow = itemRows.some((row) => {
                        const rowP = purities?.find((p) => p.id === row.purity_id);
                        return rowP?.karatCode?.toLowerCase().includes('silver') || row.purity_id === sId || row.purity_id === 8;
                      });

                      if (hasSilverRow) {
                        setItemRows(
                          itemRows.map((row) => {
                            const rowP = purities?.find((p) => p.id === row.purity_id);
                            const isSilvRow =
                              rowP?.karatCode?.toLowerCase().includes('silver') ||
                              row.purity_id === sId ||
                              row.purity_id === 8;
                            return isSilvRow ? { ...row, rate_per_gram: r } : row;
                          })
                        );
                      } else {
                        // Switch the first row to Silver
                        setItemRows(
                          itemRows.map((row, idx) => {
                            if (idx === 0) {
                              return {
                                ...row,
                                purity_id: sId,
                                rate_per_gram: r,
                                item_description: 'Fine Silver Articles & Utensils (999)',
                                category_id: silvCat?.id || row.category_id,
                                making_charges: 25,
                              };
                            }
                            return row;
                          })
                        );
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-mono transition-all cursor-pointer text-xs"
                    title="Click to apply Silver rate to silver items"
                  >
                    <span className="text-slate-300 font-semibold">Silver:</span> ₹{rateSilver ? rateSilver.sellingRatePerGram : APP_SETTINGS.rates.defaultSilverSelling}/g
                    {purchaseType === 'customer_old_gold_buyback' && (
                      <span className="text-emerald-400 text-[10px] ml-1">
                        (Buy: ₹{rateSilver ? rateSilver.buyingRatePerGram : APP_SETTINGS.rates.defaultSilverBuying})
                      </span>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setItemRows((prev) =>
                      prev.map((row) => ({
                        ...row,
                        rate_per_gram: getRateForPurity(row.purity_id, purchaseType === 'customer_old_gold_buyback'),
                      }))
                    );
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs border border-amber-500/30 cursor-pointer transition-all"
                  title="Update all rows with the current active board rates for their purities"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Auto-Apply Live Rates to All</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                Purchase Line Items
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                {dealsInGold && (
                  <button
                    type="button"
                    onClick={() => handleAddItemRow('gold')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Gold Line (22K)</span>
                  </button>
                )}
                {dealsInSilver && (
                  <button
                    type="button"
                    onClick={() => handleAddItemRow('silver')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer transition-all"
                  >
                    <Coins className="w-3.5 h-3.5 text-slate-300" />
                    <span>+ Add Silver Line (999)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAddItemRow('default')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Blank Line</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-2xl shadow-inner bg-slate-950/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono bg-slate-950">
                    <th className="p-3 min-w-[220px]">Item Description</th>
                    {purchaseType === 'vendor_jewellery' && <th className="p-3 min-w-[150px]">Category</th>}
                    <th className="p-3 min-w-[140px]">Purity</th>
                    <th className="p-3 text-right min-w-[105px]">Gross Wt (g)</th>
                    <th className="p-3 text-right min-w-[95px]">Stone Wt (g)</th>
                    <th className="p-3 text-right min-w-[115px]">Rate (₹/g)</th>
                    {purchaseType === 'vendor_jewellery' && <th className="p-3 text-right min-w-[100px]">Making/g</th>}
                    <th className="p-3 text-right min-w-[115px]">Total (₹)</th>
                    {purchaseType === 'vendor_jewellery' && <th className="p-3 text-center min-w-[75px]">Auto Tag?</th>}
                    <th className="p-3 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {calculatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-2.5 font-sans">
                        <input
                          type="text"
                          value={item.item_description}
                          onChange={(e) => handleUpdateItemRow(item.id, { item_description: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                          placeholder="Item description / batch..."
                          required
                        />
                      </td>

                      {purchaseType === 'vendor_jewellery' && (
                        <td className="p-2.5 font-sans">
                          <select
                            value={item.category_id || ''}
                            onChange={(e) => handleUpdateItemRow(item.id, { category_id: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                          >
                            <option value="">Select Category</option>
                            {categories?.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.categoryName || c.name} {c.categoryCode ? `(${c.categoryCode})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      <td className="p-2.5 font-sans">
                        <select
                          value={item.purity_id}
                          onChange={(e) => {
                            const newPurityId = Number(e.target.value);
                            const pObj = purities?.find((p) => p.id === newPurityId);
                            const isSilv =
                              pObj?.karatCode?.toLowerCase().includes('silver') ||
                              pObj?.karatName?.toLowerCase().includes('silver') ||
                              newPurityId === 7 ||
                              newPurityId === 8;
                            const newRate = getRateForPurity(newPurityId, purchaseType === 'customer_old_gold_buyback');
                            const updates: Partial<PurchaseItemFormRow> = {
                              purity_id: newPurityId,
                              rate_per_gram: newRate,
                            };
                            if (isSilv) {
                              if (
                                !item.item_description ||
                                item.item_description.includes('Gold') ||
                                item.item_description.includes('22K') ||
                                item.item_description === 'Wholesale Jewellery Item'
                              ) {
                                updates.item_description =
                                  newPurityId === 8
                                    ? 'Sterling Silver Jewellery & Ornaments (925)'
                                    : 'Fine Silver Articles & Utensils (999)';
                              }
                              updates.making_charges = Math.min(item.making_charges, 40);
                              const silvCat = categories?.find(
                                (c) =>
                                  c.name?.toLowerCase().includes('silver') ||
                                  c.categoryName?.toLowerCase().includes('silver')
                              );
                              if (silvCat) {
                                updates.category_id = silvCat.id;
                              }
                            } else {
                              if (item.item_description.includes('Silver')) {
                                updates.item_description =
                                  newPurityId === 1
                                    ? '24K Fine Bullion Gold Bar (999)'
                                    : '22K Wholesale Gold Jewellery Batch';
                              }
                              if (item.making_charges <= 40 && purchaseType === 'vendor_jewellery') {
                                updates.making_charges = 250;
                              }
                            }
                            handleUpdateItemRow(item.id, updates);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-semibold focus:border-amber-500 focus:outline-none"
                        >
                          {purities?.map((pur) => (
                            <option key={pur.id} value={pur.id}>
                              {pur.karatName || pur.karatCode}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.001"
                          value={item.gross_weight}
                          onChange={(e) => handleUpdateItemRow(item.id, { gross_weight: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-right text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                          required
                        />
                      </td>

                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          step="0.001"
                          value={item.stone_weight}
                          onChange={(e) => handleUpdateItemRow(item.id, { stone_weight: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-right text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                        />
                      </td>

                      <td className="p-2.5 text-right">
                        <input
                          type="number"
                          value={item.rate_per_gram}
                          onChange={(e) => handleUpdateItemRow(item.id, { rate_per_gram: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-right text-slate-100 font-mono font-bold text-amber-300 focus:border-amber-500 focus:outline-none"
                          required
                        />
                      </td>

                      {purchaseType === 'vendor_jewellery' && (
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            value={item.making_charges}
                            onChange={(e) => handleUpdateItemRow(item.id, { making_charges: Number(e.target.value) })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-right text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                          />
                        </td>
                      )}

                      <td className="p-2.5 text-right font-bold text-amber-300 whitespace-nowrap">
                        {formatCurrency(item.line_total)}
                      </td>

                      {purchaseType === 'vendor_jewellery' && (
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={item.create_stock_item}
                            onChange={(e) => handleUpdateItemRow(item.id, { create_stock_item: e.target.checked })}
                            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 cursor-pointer"
                            title="Auto-create inventory barcode tag"
                          />
                        </td>
                      )}

                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(item.id)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-rose-500/10 transition-colors"
                          title="Remove row"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Settlement / Payment Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Paid Amount (₹)</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                max={grandTotal}
                min={0}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                placeholder="0 for credit purchase"
              />
            </div>

            {paidAmount > 0 && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="cash">Showroom Cash Drawer</option>
                    <option value="upi">UPI / QR Code</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Account</label>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Cash/Bank Account</option>
                    {accounts?.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountName}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Live Bill Summary Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 border border-amber-500/20 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Gross / Net Wt</span>
              <strong className="text-amber-300 text-sm">{formatWeight(totalGrossWeight)} / {formatWeight(totalNetWeight)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Taxable Value</span>
              <strong className="text-slate-200 text-sm">₹{totalTaxable.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">GST (ITC 3%)</span>
              <strong className="text-emerald-400 text-sm">₹{totalGst.toLocaleString('en-IN')}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Grand Total Bill</span>
              <strong className="text-amber-400 text-base">{formatCurrency(grandTotal)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Due Payable</span>
              <strong className="text-rose-400 text-sm">₹{dueBalance.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Purchase...' : 'Save Purchase Entry'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* ============================================================================ */}
      {/* View Purchase Details Modal */}
      {/* ============================================================================ */}
      {selectedPurchase && (
        <Modal
          isOpen={Boolean(selectedPurchase)}
          onClose={() => setSelectedPurchase(null)}
          title={`Purchase Bill #${selectedPurchase.purchase_invoice_no || selectedPurchase.purchaseInvoiceNo}`}
          subtitle={`Recorded on ${formatDate(selectedPurchase.purchase_date || selectedPurchase.purchaseDate)}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Vendor / Party</span>
                <span className="font-sans font-semibold text-slate-200">
                  {selectedPurchase.party?.name || selectedPurchase.party?.partyName || 'Wholesale Vendor'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Vendor Bill #</span>
                <span className="text-amber-300 font-bold">
                  {selectedPurchase.vendor_bill_no || selectedPurchase.vendorBillNo || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Purchase Type</span>
                <span className="capitalize text-slate-300 font-sans">
                  {(selectedPurchase.purchase_type || selectedPurchase.purchaseType)?.replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Status</span>
                <Badge
                  variant={(selectedPurchase.is_cancelled || selectedPurchase.isCancelled) ? 'ruby' : 'emerald'}
                  size="sm"
                >
                  {(selectedPurchase.is_cancelled || selectedPurchase.isCancelled) ? 'cancelled' : 'completed'}
                </Badge>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase bg-slate-950/80">
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-right">Net Wt</th>
                    <th className="p-2.5 text-right">Rate (₹/g)</th>
                    <th className="p-2.5 text-right">Taxable</th>
                    <th className="p-2.5 text-right">GST</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedPurchase.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-sans font-medium text-slate-200">
                        {item.item_description || item.itemDescription}
                      </td>
                      <td className="p-2.5 text-right text-amber-300">
                        {formatWeight(item.net_weight ?? item.netWeight)}
                      </td>
                      <td className="p-2.5 text-right text-slate-300">
                        ₹{(Number(item.rate_per_gram ?? item.ratePerGram) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right text-slate-300">
                        ₹{(Number(item.taxable_amount ?? item.taxableAmount) || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right text-emerald-400">
                        ₹{(Number(item.cgst_amount ? (Number(item.cgst_amount) + Number(item.sgst_amount)) : item.totalTaxAmount || 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-100">
                        ₹{(Number(item.total_amount ?? item.totalAmount) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Row */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center font-mono text-xs">
              <span className="text-slate-400">
                Taxable: <strong className="text-slate-200">₹{(Number(selectedPurchase.taxable_amount ?? selectedPurchase.taxableAmount) || 0).toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-emerald-400">
                GST ITC: <strong>₹{(Number(selectedPurchase.total_gst_amount ?? selectedPurchase.totalTaxAmount) || 0).toLocaleString('en-IN')}</strong>
              </span>
              <span className="text-amber-400 text-sm font-bold">
                Grand Total: {formatCurrency(selectedPurchase.grand_total ?? selectedPurchase.grandTotal)}
              </span>
            </div>

            {selectedPurchase.cancellation_reason && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <strong>Cancellation Reason:</strong> {selectedPurchase.cancellation_reason}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================================ */}
      {/* Cancel Purchase Modal */}
      {/* ============================================================================ */}
      {cancelPurchase && (
        <Modal
          isOpen={Boolean(cancelPurchase)}
          onClose={() => setCancelPurchase(null)}
          title={`Cancel Purchase Bill #${cancelPurchase.vendor_bill_no || cancelPurchase.vendorBillNo || cancelPurchase.purchase_invoice_no || cancelPurchase.purchaseInvoiceNo}`}
          subtitle="Rolls back stock and vendor payable ledger balance"
          maxWidth="md"
        >
          <form onSubmit={handleCancelPurchase} className="space-y-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Safety check: The backend will verify that none of the purchased items or bullion have been sold before confirming cancellation.
              </span>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Cancellation Reason</label>
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
                onClick={() => setCancelPurchase(null)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="submit"
                disabled={isCancelling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                {isCancelling ? 'Processing...' : 'Confirm Cancel'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
