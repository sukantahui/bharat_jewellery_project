import { create } from 'zustand';
import { MakingChargeType, PaymentMode } from '../types';
import { calculateLineItem, calculateGst, calculateOldGold } from '../utils/calculations';

export interface PosItem {
  id: string; // unique cart id
  jewellery_item_id?: number;
  tag_code?: string;
  item_name: string;
  category_id: number;
  category_name?: string;
  purity_id: number;
  purity_code?: string;
  huid?: string;
  gross_weight: number;
  stone_weight: number;
  net_weight: number;
  rate_per_gram: number;
  making_charge_type: MakingChargeType;
  making_rate: number;
  making_charges_amount: number;
  stone_value: number;
  hallmarking_charge: number;
  discount_amount: number;
  taxable_amount: number;
}

export interface PosOldGoldItem {
  id: string;
  description: string;
  gross_weight: number;
  dust_weight: number;
  net_weight: number;
  purity_percent: number;
  rate_per_gram: number;
  exchange_value: number;
}

export interface PosCustomer {
  id?: number;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  state_code?: string;
  gstin?: string;
  pan?: string;
}

interface PosState {
  customer: PosCustomer | null;
  invoiceType: 'tax_invoice' | 'estimate_memo';
  isInterState: boolean;
  items: PosItem[];
  oldGoldItems: PosOldGoldItem[];
  paymentMode: PaymentMode;
  paidAmount: number;
  customerPan: string;
  paymentAccountId: number | null;
  notes: string;

  // Actions
  setCustomer: (customer: PosCustomer | null) => void;
  setInvoiceType: (type: 'tax_invoice' | 'estimate_memo') => void;
  setIsInterState: (isInterState: boolean) => void;
  addItem: (item: Omit<PosItem, 'id' | 'net_weight' | 'making_charges_amount' | 'taxable_amount'>) => void;
  updateItem: (id: string, partial: Partial<PosItem>) => void;
  removeItem: (id: string) => void;
  addOldGold: (item: Omit<PosOldGoldItem, 'id' | 'net_weight' | 'exchange_value'>) => void;
  updateOldGold: (id: string, partial: Partial<PosOldGoldItem>) => void;
  removeOldGold: (id: string) => void;
  setPaymentMode: (mode: PaymentMode) => void;
  setPaidAmount: (amount: number) => void;
  setCustomerPan: (pan: string) => void;
  setPaymentAccountId: (id: number | null) => void;
  setNotes: (notes: string) => void;
  resetPos: () => void;

  // Getters
  getTotals: () => {
    totalGrossWeight: number;
    totalNetWeight: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalGst: number;
    itemsTotal: number;
    oldGoldTotal: number;
    roundOff: number;
    grandTotal: number;
    dueAmount: number;
  };
}

const initialCustomer: PosCustomer = {
  name: 'Counter Retail Customer',
  mobile: '',
  state_code: '19', // Default West Bengal intra-state
};

export const usePosStore = create<PosState>((set, get) => ({
  customer: initialCustomer,
  invoiceType: 'tax_invoice',
  isInterState: false,
  items: [],
  oldGoldItems: [],
  paymentMode: 'cash',
  paidAmount: 0,
  customerPan: '',
  paymentAccountId: null,
  notes: '',

  setCustomer: (customer) => {
    const isInter = customer?.state_code ? customer.state_code !== '19' : false;
    set({ customer, isInterState: isInter });
  },

  setInvoiceType: (invoiceType) => set({ invoiceType }),
  setIsInterState: (isInterState) => set({ isInterState }),

  addItem: (itemData) => {
    const calc = calculateLineItem({
      grossWeight: itemData.gross_weight,
      stoneWeight: itemData.stone_weight,
      ratePerGram: itemData.rate_per_gram,
      makingChargeType: itemData.making_charge_type,
      makingRate: itemData.making_rate,
      stoneValue: itemData.stone_value,
      hallmarkingCharge: itemData.hallmarking_charge,
      discountAmount: itemData.discount_amount,
    });

    const newItem: PosItem = {
      ...itemData,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      net_weight: calc.netWeight,
      making_charges_amount: calc.makingChargesAmount,
      taxable_amount: calc.taxableAmount,
    };

    set((state) => {
      const nextItems = [...state.items, newItem];
      return { items: nextItems };
    });
  },

  updateItem: (id, partial) => {
    set((state) => {
      const nextItems = state.items.map((item) => {
        if (item.id !== id) return item;
        const merged = { ...item, ...partial };
        const calc = calculateLineItem({
          grossWeight: merged.gross_weight,
          stoneWeight: merged.stone_weight,
          ratePerGram: merged.rate_per_gram,
          makingChargeType: merged.making_charge_type,
          makingRate: merged.making_rate,
          stoneValue: merged.stone_value,
          hallmarkingCharge: merged.hallmarking_charge,
          discountAmount: merged.discount_amount,
        });
        return {
          ...merged,
          net_weight: calc.netWeight,
          making_charges_amount: calc.makingChargesAmount,
          taxable_amount: calc.taxableAmount,
        };
      });
      return { items: nextItems };
    });
  },

  removeItem: (id) => {
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
  },

  addOldGold: (itemData) => {
    const calc = calculateOldGold({
      grossWeight: itemData.gross_weight,
      dustWeight: itemData.dust_weight,
      purityPercent: itemData.purity_percent,
      ratePerGram: itemData.rate_per_gram,
    });

    const newOldGold: PosOldGoldItem = {
      ...itemData,
      id: `og-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      net_weight: calc.netWeight,
      exchange_value: calc.exchangeValue,
    };

    set((state) => ({ oldGoldItems: [...state.oldGoldItems, newOldGold] }));
  },

  updateOldGold: (id, partial) => {
    set((state) => {
      const nextOldGold = state.oldGoldItems.map((og) => {
        if (og.id !== id) return og;
        const merged = { ...og, ...partial };
        const calc = calculateOldGold({
          grossWeight: merged.gross_weight,
          dustWeight: merged.dust_weight,
          purityPercent: merged.purity_percent,
          ratePerGram: merged.rate_per_gram,
        });
        return {
          ...merged,
          net_weight: calc.netWeight,
          exchange_value: calc.exchangeValue,
        };
      });
      return { oldGoldItems: nextOldGold };
    });
  },

  removeOldGold: (id) => {
    set((state) => ({ oldGoldItems: state.oldGoldItems.filter((og) => og.id !== id) }));
  },

  setPaymentMode: (paymentMode) => set({ paymentMode }),
  setPaidAmount: (paidAmount) => set({ paidAmount }),
  setCustomerPan: (customerPan) => set({ customerPan }),
  setPaymentAccountId: (paymentAccountId) => set({ paymentAccountId }),
  setNotes: (notes) => set({ notes }),

  resetPos: () => {
    set({
      customer: initialCustomer,
      invoiceType: 'tax_invoice',
      isInterState: false,
      items: [],
      oldGoldItems: [],
      paymentMode: 'cash',
      paidAmount: 0,
      customerPan: '',
      paymentAccountId: null,
      notes: '',
    });
  },

  getTotals: () => {
    const { items, oldGoldItems, isInterState, invoiceType, paidAmount } = get();

    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let taxableAmount = 0;

    items.forEach((item) => {
      totalGrossWeight += Number(item.gross_weight) || 0;
      totalNetWeight += Number(item.net_weight) || 0;
      taxableAmount += Number(item.taxable_amount) || 0;
    });

    totalGrossWeight = Number(totalGrossWeight.toFixed(3));
    totalNetWeight = Number(totalNetWeight.toFixed(3));
    taxableAmount = Number(taxableAmount.toFixed(2));

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let totalGst = 0;

    if (invoiceType === 'tax_invoice') {
      const gst = calculateGst(taxableAmount, isInterState);
      cgstAmount = gst.cgstAmount;
      sgstAmount = gst.sgstAmount;
      igstAmount = gst.igstAmount;
      totalGst = gst.totalGst;
    }

    const itemsTotal = Number((taxableAmount + totalGst).toFixed(2));

    let oldGoldTotal = 0;
    oldGoldItems.forEach((og) => {
      oldGoldTotal += Number(og.exchange_value) || 0;
    });
    oldGoldTotal = Number(oldGoldTotal.toFixed(2));

    const rawGrandTotal = itemsTotal - oldGoldTotal;
    const roundedGrandTotal = Math.max(0, Math.round(rawGrandTotal));
    const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));
    const grandTotal = roundedGrandTotal;

    const dueAmount = Math.max(0, Number((grandTotal - (Number(paidAmount) || 0)).toFixed(2)));

    return {
      totalGrossWeight,
      totalNetWeight,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGst,
      itemsTotal,
      oldGoldTotal,
      roundOff,
      grandTotal,
      dueAmount,
    };
  },
}));
