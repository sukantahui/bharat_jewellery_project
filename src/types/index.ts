/**
 * Bharat Jewellery ERP & POS — TypeScript Type Definitions
 * 
 * Copy-paste this file into: src/types/index.ts (or src/types/api.ts)
 */

// ============================================================================
// 1. GENERIC API ENVELOPES & PAGINATION
// ============================================================================

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedMeta {
  current_page: number;
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links?: any;
  meta?: PaginatedMeta;
}

// ============================================================================
// 2. AUTHENTICATION & USER MANAGEMENT
// ============================================================================

export type UserRole = 'Admin' | 'Developer' | 'Owner' | 'Staff' | 'Sales' | 'Accountant';

export interface UserProfile {
  id: number;
  userName: string;
  name: string;
  email: string;
  role: UserRole;
  mobile: string | null;
  department: string;
  designation: string;
  employeeId: number | null;
}

export interface LoginPayload {
  email: string; // or username
  password: string;
}

export interface LoginResponseData {
  user: UserProfile;
  token: string;
}

export interface RegisterUserPayload {
  email: string;
  password: string;
  password_confirmation?: string;
  user_type_id: number;
  employee_id: number;
}

// ============================================================================
// 3. DASHBOARD & KPI ANALYTICS
// ============================================================================

export interface GoldRateTickerItem {
  karatCode: string;
  karatName: string;
  metalType: 'gold' | 'silver' | 'platinum';
  sellingRatePerGram: number;
  buyingRatePerGram: number;
  rateDate: string;
}

export interface DashboardTodayStats {
  salesCount: number;
  salesAmount: number;
  salesNetWeightGrams: number;
  salesCollectedAmount: number;
  purchasesCount: number;
  purchasesAmount: number;
  purchasesWeightGrams: number;
  expensesCount: number;
  expensesAmount: number;
}

export interface DashboardCashDrawer {
  cashInHand: number;
  bankBalance: number;
  totalLiquidFunds: number;
}

export interface CategoryStockBreakdown {
  category_name: string;
  item_count: number;
  total_gross_weight: string | number;
}

export interface DashboardInventorySummary {
  inStockItemsCount: number;
  inStockGrossWeight: number;
  inStockNetWeight: number;
  totalSoldItems: number;
  categoryBreakdown: CategoryStockBreakdown[];
}

export interface RecentSaleItem {
  id: number;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  grand_total: string | number;
  payment_status: string;
  total_net_weight: string | number;
}

export interface RecentStockEntryItem {
  id: number;
  entry_number: string;
  entry_date: string;
  entry_type: string;
  total_items_count: number;
  total_gross_weight: string | number;
}

export interface DashboardStatsData {
  asOfDate: string;
  goldRates: GoldRateTickerItem[];
  todayStats: DashboardTodayStats;
  cashDrawer: DashboardCashDrawer;
  inventorySummary: DashboardInventorySummary;
  recentSales: RecentSaleItem[];
  recentStockEntries: RecentStockEntryItem[];
  directoryCounts: {
    totalCustomers: number;
    totalVendors: number;
    totalKarigars: number;
  };
}

// ============================================================================
// 4. JEWELLERY MASTERS (PURITIES, CATEGORIES, DAILY RATES)
// ============================================================================

export interface Purity {
  id: number;
  karatName: string;
  karatCode: string;
  purityPercentage: number;
  hallmarkCode: string | null;
  description: string | null;
  isActive: boolean;

  // Aliases for component convenience
  karat_code?: string;
  karat_name?: string;
  purity_percentage?: number;
}

export interface JewelleryCategory {
  id: number;
  categoryName: string;
  categoryCode: string;
  defaultHsnCode: string;
  description: string | null;
  isActive: boolean;
  name?: string;
}


export interface DailyGoldRate {
  id: number;
  rateDate: string;
  metalType: string;
  purityId: number;
  purity?: Purity;
  sellingRatePerGram: number;
  buyingRatePerGram: number;
  notes: string | null;
}

export interface StoreDailyGoldRatePayload {
  rate_date: string;
  metal_type?: 'gold' | 'silver';
  purity_id: number;
  selling_rate_per_gram?: number;
  buying_rate_per_gram?: number;
  rate_per_gram?: number;       // alias accepted by backend
  buyback_rate_per_gram?: number; // alias accepted by backend
  notes?: string;
}

// ============================================================================
// 5. PARTIES (CUSTOMERS, VENDORS, KARIGARS)
// ============================================================================

export type PartyType = 'customer' | 'vendor' | 'karigar' | 'both';

export interface Party {
  id: number;
  partyName: string;
  partyType: PartyType;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  stateId: number | null;
  stateCode: number | null;
  pincode: string | null;
  gstin: string | null;
  pan: string | null;
  openingBalance: number;
  currentBalance: number;
  metalOpeningBalanceGrams: number;
  metalCurrentBalanceGrams: number;
  creditLimit: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;

  // Aliases for component convenience
  name?: string;
  mobile?: string | null;
  state?: string | null;
  state_code?: string | null;
  opening_balance?: number;
  current_balance?: number;
  opening_metal_balance_grams?: number;
  current_metal_balance_grams?: number;
}

export interface StorePartyPayload {
  name?: string;
  party_name?: string;
  party_type: PartyType;
  mobile?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  state_id?: number;
  state_code?: number | string;
  pincode?: string;
  gstin?: string;
  pan?: string;
  opening_balance?: number;
  opening_metal_balance_grams?: number;
  metal_opening_balance_grams?: number;
  credit_limit?: number;
  notes?: string;
}

// ============================================================================
// 6. JEWELLERY INVENTORY ITEMS & TAGS
// ============================================================================

export type JewelleryItemStatus = 'in_stock' | 'sold' | 'returned' | 'reserved';

export interface JewelleryItem {
  id: number;
  tagCode: string;
  itemName: string;
  categoryId: number;
  category?: JewelleryCategory;
  purityId: number;
  purity?: Purity;
  hsnCode: string;
  grossWeight: number;
  stoneWeight: number;
  netGoldWeight: number;
  fineGoldWeight: number;
  stoneValue: number;
  purchaseCost: number;
  huid: string | null;
  sourceType: 'production' | 'purchase' | 'customer_trade_in' | 'manual';
  status: JewelleryItemStatus;
  soldDate: string | null;
  notes: string | null;
  createdAt: string;

  // Aliases for component convenience
  tag_code?: string;
  name?: string;
  item_name?: string;
  gross_weight?: number;
  stone_weight?: number;
  net_weight?: number;
  net_gold_weight?: number;
  purchase_cost?: number;
  category_id?: number;
  purity_id?: number;
  stone_value?: number;
}

export interface StoreJewelleryItemPayload {
  tag_code?: string;
  item_name?: string;
  name?: string;
  category_id: number;
  purity_id: number;
  hsn_code?: string;
  gross_weight: number;
  stone_weight?: number;
  stone_value?: number;
  purchase_cost?: number;
  making_cost?: number;
  status?: string;
  huid?: string;
  source_type?: string;
  notes?: string;
}

// ============================================================================
// 7. STOCK ENTRY (PRODUCTION INWARD FROM KARIGAR)
// ============================================================================

export interface StockEntryItemPayload {
  item_name: string;
  category_id: number;
  purity_id: number;
  tag_code?: string;
  huid?: string;
  gross_weight: number;
  stone_weight?: number;
  estimated_rate_per_gram?: number;
  making_cost?: number;
  stone_cost?: number;
}

export interface StoreStockEntryPayload {
  entry_date: string;
  entry_type?: 'production_inward' | 'opening_stock' | 'consignment_inward';
  artisan_id?: number; // Karigar party ID
  remarks?: string;
  items: StockEntryItemPayload[];
}

export interface StockEntry {
  id: number;
  entryNumber: string;
  entryDate: string;
  entryType: string;
  artisanId: number | null;
  artisan?: Party;
  totalItemsCount: number;
  totalGrossWeight: number;
  totalStoneWeight: number;
  totalNetWeight: number;
  totalFineGoldWeight: number;
  totalEstimatedValuation: number;
  remarks: string | null;
  items?: any[];
  createdAt: string;
}

// ============================================================================
// 8. SALES & POINT OF SALE (POS)
// ============================================================================

export type PaymentMode = 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque';
export type InvoiceType = 'tax_invoice' | 'bill_of_supply' | 'cash_memo';
export type TaxType = 'intra_state' | 'inter_state' | 'non_gst';
export type MakingChargeType = 'per_gram' | 'percentage' | 'fixed';


export interface SaleItemPayload {
  jewellery_item_id?: number; // Tag item ID from inventory
  category_id?: number;
  purity_id: number;
  item_name: string;
  tag_code?: string;
  huid?: string;
  hsn_code?: string;
  gross_weight: number;
  stone_weight?: number;
  gold_rate_per_gram?: number; // Board rate applied
  rate_per_gram?: number;     // alias accepted
  making_charge_type?: 'per_gram' | 'percentage' | 'fixed';
  making_charge_rate?: number;
  making_rate?: number;
  making_charges?: number;
  making_charges_amount?: number;
  stone_charges?: number;
  stone_value?: number;
  hallmarking_charge?: number;
  discount_amount?: number;
  taxable_amount?: number;
  gst_rate?: number;          // Default 3.00
}

export interface SaleOldGoldExchangePayload {
  item_description?: string;
  description?: string;
  gross_weight: number;
  dust_stone_weight?: number;
  dust_weight?: number;       // alias accepted
  purity_percentage?: number; // or purity_id
  purity_percent?: number;
  purity_id?: number;
  buying_rate_per_gram?: number;
  rate_per_gram?: number;     // alias accepted
  remarks?: string;
}

export interface StoreSalePayload {
  invoice_number?: string;
  invoice_date?: string;
  party_id?: number | null;
  customer_name?: string;
  customer_mobile?: string;
  customer_email?: string;
  customer_address?: string;
  customer_gstin?: string;
  customer_pan?: string;       // REQUIRED by Indian Tax Law if cash payment >= 2,00,000
  place_of_supply_state_id?: number;
  place_of_supply_state_code?: number;
  invoice_type?: any;
  is_gst_applicable?: boolean;
  is_inter_state?: boolean;
  tax_type?: TaxType;
  discount_amount?: number;
  paid_amount?: number;
  payment_account_id?: number; // Cash Drawer or Bank Account ID
  deposit_account_id?: number; // alias accepted
  payment_mode?: PaymentMode;
  notes?: string;
  terminal_id?: string;
  terminal_code?: string;
  terminal_name?: string;
  terminal_area?: string;
  cashier_name?: string;
  items: any[];
  old_gold_items?: any[];
}


export interface SaleItemResource {
  id: number;
  jewelleryItemId: number | null;
  categoryId: number | null;
  purityId: number;
  itemName: string;
  tagCode: string | null;
  huid: string | null;
  hsnCode: string;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  fineGoldWeight: number;
  goldRatePerGram: number;
  goldAmount: number;
  makingChargeType: string;
  makingChargeRate: number;
  makingCharges: number;
  stoneCharges: number;
  hallmarkingCharge: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;

  // Aliases for component convenience
  item_name?: string;
  tag_code?: string | null;
  gross_weight?: number;
  stone_weight?: number;
  net_weight?: number;
  rate_per_gram?: number;
  making_charges_amount?: number;
  taxable_amount?: number;
  purity?: Purity;
}

export interface SaleOldGoldExchangeResource {
  id: number;
  itemDescription: string;
  grossWeight: number;
  dustStoneWeight: number;
  netWeight: number;
  purityPercentage: number;
  fineGoldWeight: number;
  buyingRatePerGram: number;
  exchangeValue: number;
  remarks: string | null;
}

export interface Sale {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  partyId: number | null;
  party?: Party;
  customerName: string;
  customerMobile: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  customerGstin: string | null;
  customerPan: string | null;
  placeOfSupplyStateId: number | null;
  placeOfSupplyStateCode: number;
  invoiceType: InvoiceType;
  isGstApplicable: boolean;
  taxType: TaxType;
  totalGrossWeight: number;
  totalStoneWeight: number;
  totalNetWeight: number;
  totalFineGoldWeight: number;
  totalGoldAmount: number;
  totalMakingCharges: number;
  totalStoneCharges: number;
  hallmarkingCharges: number;
  otherCharges: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTaxAmount: number;
  oldGoldExchangeAmount: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'paid' | 'partially_paid' | 'unpaid';
  isCancelled: boolean;
  cancellationReason: string | null;
  items?: SaleItemResource[];
  oldGoldExchanges?: SaleOldGoldExchangeResource[];
  createdAt: string;

  // Aliases for component convenience
  invoice_number?: string;
  invoice_date?: string;
  customer_name?: string;
  customer_mobile?: string | null;
  customer_pan?: string | null;
  customer_gstin?: string | null;
  total_net_weight?: number;
  total_gross_weight?: number;
  total_taxable_amount?: number;
  taxable_amount?: number;
  total_gst_amount?: number;
  total_tax_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  grand_total?: number | string;
  paid_amount?: number;
  due_amount?: number;
  balance_amount?: number;
  payment_status?: string;
  payment_mode?: string;
  status?: string;
  is_cancelled?: boolean;
  is_inter_state?: boolean;
  total_old_gold_amount?: number;
  old_gold_exchange_amount?: number;
  round_off?: number;
  old_gold_items?: any[];
  party_id?: number | null;
  invoice_type?: string;
  terminalId?: string;
  terminalCode?: string;
  terminalName?: string;
  terminalArea?: string;
  cashierName?: string;
  terminal_id?: string;
  terminal_code?: string;
  terminal_name?: string;
  terminal_area?: string;
  cashier_name?: string;
}

// ============================================================================
// 9. PURCHASES & PROCUREMENT
// ============================================================================

export interface PurchaseItemPayload {
  purity_id: number;
  category_id?: number;
  item_description?: string;
  description?: string;
  hsn_code?: string;
  gross_weight: number;
  net_weight?: number;
  stone_weight?: number;
  rate_per_gram: number;
  making_charges?: number;
  stone_charges?: number;
  gst_rate?: number;
  create_stock_item?: boolean;
  tag_code?: string;
}

export interface StorePurchasePayload {
  purchase_invoice_no?: string;
  purchase_date?: string;
  vendor_bill_no?: string;
  vendor_bill_number?: string;
  vendor_bill_date?: string;
  party_id: number; // Vendor ID
  purchase_type?: any;
  is_gst_applicable?: boolean;
  gst_applicable?: boolean;
  tax_type?: TaxType;
  itc_eligibility?: string;
  other_charges?: number;
  discount_amount?: number;
  paid_amount?: number;
  payment_account_id?: number;
  payment_mode?: PaymentMode;
  notes?: string;
  items: PurchaseItemPayload[];
}

export interface PurchaseItemResource {
  id: number;
  purityId: number;
  categoryId: number | null;
  itemDescription: string;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  purityPercentage: number;
  fineGoldWeight: number;
  ratePerGram: number;
  goldAmount: number;
  makingCharges: number;
  stoneCharges: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface Purchase {
  id: number;
  purchaseInvoiceNo: string;
  purchaseDate: string;
  vendorBillNo: string | null;
  vendorBillDate: string | null;
  partyId: number;
  party?: Party;
  purchaseType: string;
  isGstApplicable: boolean;
  taxType: TaxType;
  totalGrossWeight: number;
  totalNetWeight: number;
  totalFineGoldWeight: number;
  totalGoldAmount: number;
  totalMakingCharges: number;
  totalStoneCharges: number;
  otherCharges: number;
  discountAmount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTaxAmount: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'paid' | 'partially_paid' | 'unpaid';
  isCancelled: boolean;
  cancellationReason: string | null;
  itcEligibility: string;
  notes: string | null;
  items?: PurchaseItemResource[];
  createdAt: string;

  // Aliases for component convenience
  purchase_number?: string;
  purchase_invoice_no?: string;
  vendor_bill_number?: string;
  vendor_bill_no?: string | null;
  vendor_bill_date?: string | null;
  purchase_date?: string;
  purchase_type?: string;
  total_net_weight?: number;
  total_taxable_amount?: number;
  taxable_amount?: number;
  total_gst_amount?: number;
  grand_total?: number | string;
  payment_status?: string;
  is_cancelled?: boolean;
  cancellation_reason?: string | null;
  status?: string;
}

// ============================================================================
// 10. SALES RETURNS & CREDIT NOTES
// ============================================================================

export interface SalesReturnItemPayload {
  sale_item_id?: number;
  jewellery_item_id?: number;
  category_id?: number;
  purity_id?: number;
  item_name?: string;
  tag_code?: string;
  gross_weight?: number;
  return_weight?: number;
  return_amount?: number;
  stone_weight?: number;
  rate_per_gram?: number;
  making_charges_refunded?: number;
  stone_charges_refunded?: number;
  gst_rate?: number;
  stock_action?: string;
  restock_action?: string;
}

export interface StoreSalesReturnPayload {
  sale_id: number;
  credit_note_no?: string;
  credit_note_date?: string;
  return_date?: string;
  party_id?: number;
  refund_mode?: 'credit_to_ledger' | 'cash_refund' | 'bank_refund';
  refund_account_id?: number;
  reason?: string;
  return_reason?: string;
  notes?: string;
  items: SalesReturnItemPayload[];
}

export interface SalesReturn {
  id: number;
  creditNoteNo: string;
  creditNoteDate: string;
  saleId: number;
  sale?: Sale;
  partyId: number | null;
  party?: Party;
  customerName: string;
  totalGrossWeight: number;
  totalNetWeight: number;
  totalCreditAmount: number;
  refundMode: string;
  reason: string | null;
  items?: any[];
  createdAt: string;

  // Aliases for component convenience
  credit_note_number?: string;
  return_date?: string;
  total_return_weight?: number;
  total_refund_amount?: number;
  refund_mode?: string;
  return_reason?: string;
}

// ============================================================================
// 11. FINANCIAL ACCOUNTS & CASH DRAWER
// ============================================================================

export type AccountType = 'cash' | 'bank' | 'direct_expense' | 'indirect_expense' | 'direct_income' | 'indirect_income' | 'liability' | 'asset';

export interface AccountGroup {
  id: number;
  groupName: string;
  primaryType: 'assets' | 'liabilities' | 'income' | 'expenses';
}

export interface Account {
  id: number;
  accountCode: string;
  accountName: string;
  accountGroupId: number;
  accountGroup?: AccountGroup;
  accountType: AccountType;
  openingBalance: number;
  currentBalance: number;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  isActive: boolean;

  // Aliases for component convenience
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  current_balance?: number;
  is_cash?: boolean;
  is_bank?: boolean;
}

export interface CashDrawerSummaryData {
  asOfDate: string;
  totalCashBalance: number;
  totalBankBalance: number;
  totalLiquidFunds: number;

  // Aliases for component convenience
  cash_in_hand?: number;
  bank_balance?: number;
  opening_balance?: number;
  today_cash_sales?: number;
  today_cash_expenses?: number;
  total_liquid_funds?: number;
  todayCashInflow?: number;
  todayCashOutflow?: number;
  netCashMovement?: number;
  cashAccounts?: Account[];
  bankAccounts?: Account[];
}


export interface StatementEntry {
  id: number;
  financial_voucher_id: number;
  voucher_date: string;
  voucher_number: string;
  entry_type: 'debit' | 'credit';
  amount: number;
  narration: string;
}

export interface AccountStatementData {
  account: Account;
  fromDate: string;
  toDate: string;
  currentBalance: number;
  periodDebit: number;
  periodCredit: number;
  entries: PaginatedResponse<StatementEntry>;
}

// ============================================================================
// 12. PAYMENTS & VOUCHERS
// ============================================================================

export interface StorePaymentPayload {
  payment_number?: string;
  payment_date: string;
  payment_type: 'receipt' | 'payment';
  account_id: number;
  party_id?: number | null;
  reference_type?: 'sale' | 'purchase' | 'advance' | 'other';
  reference_id?: number;
  payment_mode: PaymentMode;
  transaction_reference?: string;
  reference_number?: string;
  narrative?: string;
  amount: number;
  notes?: string;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  paymentDate: string;
  paymentType: 'receipt' | 'payment';
  accountId: number;
  account?: Account;
  partyId: number | null;
  party?: Party;
  referenceType: string;
  referenceId: number | null;
  paymentMode: PaymentMode;
  transactionReference: string | null;
  amount: number;
  notes: string | null;
  createdAt: string;

  // Aliases for component convenience
  payment_number?: string;
  payment_date?: string;
  payment_type?: 'receipt' | 'payment' | string;
  payment_mode?: PaymentMode | string;
  narrative?: string;
  voucher_number?: string;
  reference_number?: string;
}

// ============================================================================
// 13. OPERATING EXPENSES & INCOMES
// ============================================================================

export interface StoreExpenseIncomePayload {
  entry_number?: string;
  entry_date: string;
  entry_type: 'expense' | 'income';
  account_id: number;         // Expense head account e.g. Tea/Electricity
  payment_account_id?: number; // Cash or Bank Drawer account
  amount: number;
  payment_mode: PaymentMode;
  reference_no?: string;
  description?: string;
  category?: string;
  is_gst_claimed?: boolean;
  is_gst_claimable?: boolean;
  tax_amount?: number;
  gst_amount?: number;
  vendor_gstin?: string;
}

export interface ExpenseIncome {
  id: number;
  entryNumber: string;
  entryDate: string;
  entryType: 'expense' | 'income';
  accountId: number;
  account?: Account;
  paymentAccountId: number;
  paymentAccount?: Account;
  amount: number;
  paymentMode: PaymentMode;
  referenceNo: string | null;
  description: string | null;
  isGstClaimed: boolean;
  taxAmount: number;
  vendorGstin: string | null;
  createdAt: string;

  // Aliases for component convenience
  entry_number?: string;
  entry_date?: string;
  entry_type?: 'expense' | 'income' | string;
  payment_mode?: PaymentMode | string;
  category?: string;
  is_gst_claimable?: boolean;
  gst_amount?: number;
}

// ============================================================================
// 14. STATUTORY GST REPORTS
// ============================================================================

export interface GstStatusData {
  isGstRegistered: boolean;
  gstin: string | null;
  businessName: string | null;
  stateCode: number | null;
  stateName: string | null;
  hsnCode: string;
  goldGstRate: number;
  silverGstRate: number;
  makingGstRate: number;
}

export interface Gstr1SummaryData {
  period: {
    fromDate: string;
    toDate: string;
  };
  totalTaxableSupplies: number;
  totalOutputTax: number;
  totalTaxableAmount?: number;
  totalCgstAmount?: number;
  totalSgstAmount?: number;
  totalIgstAmount?: number;
  totalNetWeightGrams?: number;
  table4_b2b: {
    count: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
    invoices: Array<{
      invoiceNo: string;
      invoiceDate: string;
      customerName: string;
      customerGstin: string;
      posStateCode: number;
      taxableAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalAmount: number;
    }>;
  };
  table5_b2cl: {
    count: number;
    taxableAmount: number;
    igstAmount: number;
    invoices: any[];
  };
  table7_b2cs: {
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
  };
  table9b_cdnr: {
    count: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    notes: any[];
  };
  table9b_cdnur?: {
    count: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    notes: Array<{
      creditNoteNo: string;
      creditNoteDate: string;
      originalInvoiceNo: string;
      originalInvoiceDate: string;
      customerName: string;
      customerGstin: string;
      posStateCode: number;
      taxableAmount: number;
      cgstAmount: number;
      sgstAmount: number;
      igstAmount: number;
      totalCreditAmount: number;
    }>;
  };
  table12_hsn: Array<{
    hsnCode: string;
    description: string;
    uqc: string;
    totalItems: number;
    totalGrossWeight: number;
    totalNetWeight: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalValue: number;
  }>;
}

export interface Gstr3bSummaryData {
  period: {
    fromDate: string;
    toDate: string;
  };
  table3_1_outwardSupplies: {
    taxableAmount?: number;
    netTaxableAmount?: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalOutputTax?: number;
    totalTax?: number;
  };
  table4_eligibleItc: {
    taxableAmount?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    cgstItc?: number;
    sgstItc?: number;
    igstItc?: number;
    totalItcAvailable?: number;
    totalItc?: number;
  };
  netPayableAfterItc?: {
    netCgstPayable: number;
    netSgstPayable: number;
    netIgstPayable: number;
    totalCashPayable: number;
  };
  netTaxPayableInCash?: {
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
  };

  // Convenience summary objects
  outputTaxLiability?: {
    taxableAmount?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
  };
  eligibleItc?: {
    purchasesItc?: number;
    expensesItc?: number;
    totalItc?: number;
  };
  netTaxPayable?: number;
}

// ============================================================================
// 15. BUSINESS PROFILE & SETTINGS
// ============================================================================

export interface BusinessProfile {
  id: number;
  businessName: string;
  tagline: string | null;
  gstin: string | null;
  pan: string | null;
  hallmarkingLicenseNo: string | null;
  isGstRegistered: boolean;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  districtId: number | null;
  stateId: number | null;
  stateCode: number;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  invoicePrefix: string;
  purchasePrefix: string;
  stockEntryPrefix: string;
  goldGstRate: number;
  silverGstRate: number;
  makingGstRate: number;
  hsnCode: string;
  financialYearStart: string;
  termsAndConditions: string | null;
  logoUrl: string | null;

  // Aliases for component convenience
  business_name?: string;
  address?: string;
  website?: string | null;
  state?: string;
  state_code?: string | number;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  bank_branch?: string;
  upi_id?: string;
  traded_metals?: 'gold' | 'silver' | 'both';
  tradedMetals?: 'gold' | 'silver' | 'both';
}

export interface UpdateBusinessProfilePayload {
  business_name?: string;
  company_name?: string;
  companyName?: string;
  trade_name?: string;
  tradeName?: string;
  legal_name?: string;
  legalName?: string;
  tagline?: string;
  gstin?: string;
  pan?: string;
  pan_number?: string;
  panNumber?: string;
  hallmarking_license_no?: string;
  hallmarkLicenseNo?: string;
  is_gst_registered?: boolean;
  address_line1?: string;
  addressLine1?: string;
  address_line2?: string;
  addressLine2?: string;
  city?: string;
  district_id?: number;
  state_id?: number;
  state_code?: number | string;
  stateCode?: number | string;
  state_name?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  invoice_prefix?: string;
  purchase_prefix?: string;
  stock_entry_prefix?: string;
  gold_gst_rate?: number;
  silver_gst_rate?: number;
  making_gst_rate?: number;
  terms_and_conditions?: string;
  termsAndConditions?: string;

  // Additional settings fields
  address?: string;
  state?: string;
  website?: string;
  bank_name?: string;
  bankName?: string;
  bank_account_number?: string;
  bankAccountNumber?: string;
  bank_ifsc?: string;
  bankIfsc?: string;
  bank_branch?: string;
  bankBranch?: string;
  upi_id?: string;
  upiId?: string;
  traded_metals?: 'gold' | 'silver' | 'both';
  tradedMetals?: 'gold' | 'silver' | 'both';
}

// ============================================================================
// 16. ADMINISTRATION MASTERS (EMPLOYEES, DEPARTMENTS, STATES)
// ============================================================================

export interface Employee {
  id: number;
  employee_name: string;
  email: string;
  mobile: string;
  department_id: number;
  designation_id: number;
  department?: { id: number; department_name: string };
  designation?: { id: number; designation_name: string };
}

export interface Department {
  id: number;
  department_name: string;
}

export interface Designation {
  id: number;
  designation_name: string;
}

export interface State {
  id: number;
  state_name: string;
  state_code: number;
}

export interface District {
  id: number;
  district_name: string;
  state_id: number;
}

export interface BackupItem {
  filename: string;
  size: string;
  created_at: string;
}

export interface PosTerminal {
  id: string | number;
  code: string;
  name: string;
  counterType?: string;
  counter_type?: string;
  area: string;
  branchCode?: string;
  branch_code?: string;
  address?: string;
  invoicePrefix: string;
  invoice_prefix?: string;
  assignedStaff?: string;
  assigned_staff?: string;
  openingBalance: number;
  opening_balance?: number;
  currentBalance: number;
  current_balance?: number;
  status: 'active' | 'inactive';
  notes?: string;
  createdAt?: string;
  created_at?: string;
  lastActiveAt?: string;
  last_active_at?: string;
}
