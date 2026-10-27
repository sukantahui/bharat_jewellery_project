/**
 * Bharat Jewellery ERP & POS — Calculation Utilities
 */

import { MakingChargeType } from '../types';

export interface LineItemCalculationInput {
  grossWeight: number;
  stoneWeight: number;
  ratePerGram: number;
  makingChargeType: MakingChargeType;
  makingRate: number;
  stoneValue?: number;
  hallmarkingCharge?: number;
  discountAmount?: number;
}

export interface LineItemCalculationResult {
  netWeight: number;
  goldAmount: number;
  makingChargesAmount: number;
  stoneValue: number;
  hallmarkingCharge: number;
  discountAmount: number;
  taxableAmount: number;
}

export const calculateLineItem = (input: LineItemCalculationInput): LineItemCalculationResult => {
  const gross = Math.max(0, Number(input.grossWeight) || 0);
  const stone = Math.max(0, Number(input.stoneWeight) || 0);
  const netWeight = Math.max(0, Number((gross - stone).toFixed(3)));
  const rate = Math.max(0, Number(input.ratePerGram) || 0);

  // Gold value calculated on net pure weight
  const goldAmount = Number((netWeight * rate).toFixed(2));

  // Making charges can be per_gram (usually on gross weight), percentage (of gold amount), or fixed
  let makingChargesAmount = 0;
  const makingRate = Math.max(0, Number(input.makingRate) || 0);
  if (input.makingChargeType === 'per_gram') {
    makingChargesAmount = Number((gross * makingRate).toFixed(2));
  } else if (input.makingChargeType === 'percentage') {
    makingChargesAmount = Number(((goldAmount * makingRate) / 100).toFixed(2));
  } else {
    makingChargesAmount = makingRate;
  }

  const stoneValue = Math.max(0, Number(input.stoneValue) || 0);
  const hallmarkingCharge = Math.max(0, Number(input.hallmarkingCharge) || 0);
  const discountAmount = Math.max(0, Number(input.discountAmount) || 0);

  const taxableAmount = Math.max(
    0,
    Number((goldAmount + makingChargesAmount + stoneValue + hallmarkingCharge - discountAmount).toFixed(2))
  );

  return {
    netWeight,
    goldAmount,
    makingChargesAmount,
    stoneValue,
    hallmarkingCharge,
    discountAmount,
    taxableAmount,
  };
};

/**
 * GST Calculation (3% total for Gold Jewellery HSN 7113)
 * Intra-state: 1.5% CGST + 1.5% SGST
 * Inter-state: 3.0% IGST
 */
export interface GstCalculationResult {
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGst: number;
}

export const calculateGst = (taxableAmount: number, isInterState: boolean): GstCalculationResult => {
  if (isInterState) {
    const igstAmount = Number(((taxableAmount * 3.0) / 100).toFixed(2));
    return {
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 3.0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount,
      totalGst: igstAmount,
    };
  } else {
    const cgstAmount = Number(((taxableAmount * 1.5) / 100).toFixed(2));
    const sgstAmount = Number(((taxableAmount * 1.5) / 100).toFixed(2));
    return {
      cgstRate: 1.5,
      sgstRate: 1.5,
      igstRate: 0,
      cgstAmount,
      sgstAmount,
      igstAmount: 0,
      totalGst: Number((cgstAmount + sgstAmount).toFixed(2)),
    };
  }
};

/**
 * Old Gold Melt Value Calculation
 */
export interface OldGoldCalculationInput {
  grossWeight: number;
  dustWeight: number;
  purityPercent: number;
  ratePerGram: number; // Melt/Buying rate
}

export interface OldGoldCalculationResult {
  netWeight: number;
  fineWeight: number;
  exchangeValue: number;
}

export const calculateOldGold = (input: OldGoldCalculationInput): OldGoldCalculationResult => {
  const gross = Math.max(0, Number(input.grossWeight) || 0);
  const dust = Math.max(0, Number(input.dustWeight) || 0);
  const netWeight = Math.max(0, Number((gross - dust).toFixed(3)));
  const purity = Math.min(100, Math.max(0, Number(input.purityPercent) || 0));
  const fineWeight = Number(((netWeight * purity) / 100).toFixed(3));
  const rate = Math.max(0, Number(input.ratePerGram) || 0);
  const exchangeValue = Number((fineWeight * rate).toFixed(2));

  return {
    netWeight,
    fineWeight,
    exchangeValue,
  };
};
