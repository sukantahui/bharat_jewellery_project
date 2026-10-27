/**
 * ============================================================================
 * BHARAT JEWELLERY ERP & POS — MASTER PROJECT SETTINGS CONFIGURATION
 * ============================================================================
 * 
 * THIS IS THE CENTRAL FILE TO MAINTAIN ALL SETTINGS FOR THIS ENTIRE PROJECT.
 * 
 * Edit the values in this file to customize:
 * 1. Company & Showroom Profile (Name, Phone, Email, Address, State, GSTIN, PAN, Bank, UPI)
 * 2. Tax & GST Settings (Default GST %, CGST/SGST/IGST rates, HSN codes, PAN cash rule)
 * 3. POS & Billing Defaults (Default payment mode, terms, exchange rules, return window)
 * 4. Default Gold & Silver Bullion Rates (24K, 22K, 18K, Silver default buying/selling)
 * 5. Inventory & Stock Controls (Low stock threshold, default making charges, wastage)
 * 6. UI & Localization (Currency, weight unit, locale, shortcuts)
 * 
 * Any change made here automatically reflects across all modules:
 * - POS Terminal & Billing Counter
 * - A4/A5 GST Tax Invoices & Thermal Cash Memos
 * - Purchase Entry & Bullion Procurement
 * - GST Compliance Reports & CSV Downloads
 * - System Settings, Header, Sidebar & Login Screens
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Precious metal trading scope for the showroom / organisation:
 * - 'gold': Showroom trades only in Gold items & bullion
 * - 'silver': Showroom trades only in Silver items & bullion
 * - 'both': Showroom trades in both Gold and Silver items
 */
export type TradedMetalScope = 'gold' | 'silver' | 'both';

export interface CompanyProfileSettings {
  /** Primary showroom / trade name */
  name: string;
  /** Legal registered corporate / firm name */
  legalName: string;
  /** Compact name for sidebar, mobile views, and thermal slips */
  shortName: string;
  /** Official slogan or BIS hallmarking statement */
  tagline: string;
  /** Year of establishment */
  establishedYear: string | number;
  /** BIS Hallmarking registration / license number */
  hallmarkLicenseNo: string;

  // Contact Info
  /** Primary customer care / showroom phone */
  phone: string;
  /** Secondary phone or landline */
  alternatePhone: string;
  /** Official WhatsApp number for digital receipts */
  whatsapp: string;
  /** Primary sales email */
  email: string;
  /** Support / queries email */
  supportEmail: string;
  /** Official website URL */
  website: string;

  // Showroom & Registered Address
  /** Full single-line address */
  address: string;
  /** Address Line 1 (Shop/Market) */
  addressLine1: string;
  /** Address Line 2 (Area/Locality) */
  addressLine2: string;
  /** City */
  city: string;
  /** State name */
  state: string;
  /** 2-digit Indian GST State Code ('19' for WB, '27' for MH, '24' for GJ, '07' for DL, etc.) */
  stateCode: string;
  /** 6-digit PIN code */
  pincode: string;
  /** Country */
  country: string;

  // Tax & Statutory IDs
  /** 15-digit GSTIN */
  gstin: string;
  /** 10-digit Income Tax PAN */
  pan: string;
  /** TAN (optional) */
  tan?: string;
  /** CIN / Registration number (optional) */
  cin?: string;

  // Bank & Settlement Accounts
  /** Settlement Bank Name (Primary) */
  bankName: string;
  /** Bank Branch (Primary) */
  bankBranch: string;
  /** Bank Account Number (Primary) */
  bankAccountNumber: string;
  /** 11-character IFSC Code (Primary) */
  bankIfsc: string;
  /** Account Type (Primary) */
  bankAccountType: string;
  /** Official Showroom UPI ID for QR collections (Primary) */
  upiId: string;
  /** Multiple settlement bank accounts (RTGS / NEFT / IMPS / UPI) */
  banks: BankAccount[];

  // Invoice Print Defaults
  /** Terms & conditions printed on invoices */
  invoiceTerms?: string[];
  /** Statutory declaration printed on invoices */
  invoiceDeclaration?: string;

  // Precious Metals & Business Scope
  /**
   * Precious metals dealt / sold by the showroom:
   * - 'gold': Showroom trades exclusively in Gold jewellery & bullion
   * - 'silver': Showroom trades exclusively in Silver articles, utensils & bullion
   * - 'both': Showroom trades in both Gold and Silver items
   */
  tradedMetals: TradedMetalScope;
  /** Whether the organisation trades / sells Gold (convenience boolean) */
  dealsInGold: boolean;
  /** Whether the organisation trades / sells Silver (convenience boolean) */
  dealsInSilver: boolean;
}

/**
 * Commercial Bank Account details for customer settlements & vendor transfers
 */
export interface BankAccount {
  /** Unique ID / slug for identifying the bank */
  id?: string;
  /** Commercial Bank Name (e.g., State Bank of India, HDFC Bank, ICICI Bank) */
  bankName: string;
  /** Branch Location */
  bankBranch: string;
  /** Bank Account Number */
  bankAccountNumber: string;
  /** 11-character Indian Financial System Code */
  bankIfsc: string;
  /** Account Type (Current Account / Cash Credit / OD / Savings) */
  bankAccountType: string;
  /** Account Beneficiary Name */
  accountHolderName?: string;
  /** Official UPI ID / VPA associated with this account */
  upiId?: string;
  /** QR Code image URL or data URI if applicable */
  qrCodeUrl?: string;
  /** Flag indicating this is the default/primary bank */
  isPrimary?: boolean;
}

export interface TaxSettings {
  /** Default GST rate percentage on gold jewellery (standard: 3.0%) */
  defaultGstRate: number;
  /** Intra-state CGST percentage (standard: 1.5%) */
  intraStateCgstRate: number;
  /** Intra-state SGST percentage (standard: 1.5%) */
  intraStateSgstRate: number;
  /** Inter-state IGST percentage (standard: 3.0%) */
  interStateIgstRate: number;
  /** Standard HSN code for finished gold jewellery */
  defaultJewelleryHsn: string;
  /** Standard HSN code for raw gold bars and bullion */
  defaultBullionHsn: string;
  /** Standard HSN code for silver articles and bullion */
  defaultSilverHsn: string;
  /** Cash transaction threshold in INR where customer PAN is mandatory (Rule 114B: ₹2,00,000) */
  panMandatoryCashThreshold: number;
  /** Default Input Tax Credit eligibility category */
  defaultItcEligibility: 'inputs' | 'capital_goods' | 'ineligible';
}

export interface BillingSettings {
  /** Default invoice type on POS terminal */
  defaultInvoiceType: 'tax_invoice' | 'estimate_memo';
  /** Default payment method */
  defaultPaymentMode: 'cash' | 'upi' | 'bank_transfer' | 'cheque';
  /** Allow credit sale / partial unpaid balance */
  allowCreditSale: boolean;
  /** Auto-round off grand total to the nearest rupee */
  autoRoundOff: boolean;
  /** Prefix for automatically generated inventory barcodes */
  barcodePrefix: string;
  /** Default making charge calculation method ('per_gram' | 'percentage' | 'fixed') */
  defaultMakingChargesType: 'per_gram' | 'percentage' | 'fixed';
  /** Default making charge rate in INR per gram */
  defaultMakingChargeRate: number;
  /** Default BIS hallmarking fee per item in INR (standard: ₹45) */
  defaultHallmarkingCharge: number;
  /** Terms & conditions printed on invoices */
  invoiceTerms: string[];
  /** Statutory declaration printed on invoices */
  invoiceDeclaration: string;
  /** Customer exchange & return window in days */
  returnPolicyDays: number;
}

export interface DefaultRatesSettings {
  /** 24K pure bullion selling rate (₹/g) fallback */
  default24kSelling: number;
  /** 24K pure bullion buying rate (₹/g) fallback */
  default24kBuying: number;
  /** 22K (916 hallmark) selling rate (₹/g) fallback */
  default22kSelling: number;
  /** 22K (916 hallmark) buying / melt rate (₹/g) fallback */
  default22kBuying: number;
  /** 18K jewellery selling rate (₹/g) fallback */
  default18kSelling: number;
  /** 18K jewellery buying rate (₹/g) fallback */
  default18kBuying: number;
  /** Silver selling rate (₹/g) fallback */
  defaultSilverSelling: number;
  /** Silver buying rate (₹/g) fallback */
  defaultSilverBuying: number;
}

export interface InventorySettings {
  /** Alert threshold in grams for low total pure stock */
  lowStockThresholdGrams: number;
  /** Alert threshold in item units for low category stock */
  lowStockItemCount: number;
  /** Default purity ID (1 = 24K, 2 = 22K, 3 = 18K) */
  defaultPurityId: number;
  /** Permitted precious metals dealt in inventory ('gold' | 'silver' | 'both') */
  tradedMetals: TradedMetalScope;
}

export interface UiSettings {
  /** Application title for browser and navigation */
  appTitle: string;
  /** Currency symbol */
  currencySymbol: string;
  /** ISO Currency code */
  currencyCode: string;
  /** Weight unit */
  weightUnit: string;
  /** Number and date formatting locale */
  locale: string;
  /** Keyboard shortcuts */
  shortcuts: {
    posTerminal: string;
    inventory: string;
  };
}

export interface MasterAppSettings {
  company: CompanyProfileSettings;
  tax: TaxSettings;
  billing: BillingSettings;
  rates: DefaultRatesSettings;
  inventory: InventorySettings;
  ui: UiSettings;
}

// ============================================================================
// MASTER CONFIGURATION OBJECT — EDIT YOUR PROJECT SETTINGS BELOW
// ============================================================================

export const APP_SETTINGS: MasterAppSettings = {
  // 1. COMPANY & SHOWROOM IDENTITY
  company: {
    // ------------------------------------------------------------------------
    // PRECIOUS METALS BUSINESS SCOPE (Gold only, Silver only, or Both)
    // Options: 'gold' | 'silver' | 'both'
    // Edit this line to configure what metals your organisation sells / deals in!
    // ------------------------------------------------------------------------
    tradedMetals: 'both',
    dealsInGold: true,
    dealsInSilver: true,

    name: 'Bharat Jewellers & Sons',
    legalName: 'Bharat Jewellers & Sons Pvt. Ltd.',
    shortName: 'Bharat Jewellers',
    tagline: 'Govt. Approved BIS Hallmarked Jewellery & Bullion Merchants',
    establishedYear: '1984',
    hallmarkLicenseNo: 'HM/BIS/WB-2024/916',

    phone: '+91 98303 71685',
    alternatePhone: '+91 33 2212 3456',
    whatsapp: '+91 98303 71685',
    email: 'sales@bharatjewellers.com',
    supportEmail: 'support@bharatjewellers.com',
    website: 'https://bharatjewellers.com',

    address: '124, Gold Souk Market, Bowbazar, Kolkata, West Bengal - 700012',
    addressLine1: '124, Gold Souk Market, Bowbazar',
    addressLine2: 'Central Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    stateCode: '19', // Indian State GST Code (e.g. 19 = West Bengal, 27 = Maharashtra, 24 = Gujarat, 07 = Delhi)
    pincode: '700012',
    country: 'India',

    gstin: '19AAACB1234D1Z5',
    pan: 'AAACB1234D',
    tan: 'CALB12345E',
    cin: 'U36911WB2020PTC123456',

    bankName: 'State Bank of India',
    bankBranch: 'Bowbazar Branch, Kolkata',
    bankAccountNumber: '30492819281',
    bankIfsc: 'SBIN0000124',
    bankAccountType: 'Current Account',
    upiId: 'bharatjewellers@sbi',

    // Multiple Commercial Settlement Banks (> 3 banks configured for RTGS / NEFT / UPI)
    banks: [
      {
        id: 'bank-sbi',
        bankName: 'State Bank of India',
        bankBranch: 'Bowbazar Main Branch, Kolkata',
        bankAccountNumber: '30492819281',
        bankIfsc: 'SBIN0000124',
        bankAccountType: 'Current Account',
        accountHolderName: 'Bharat Jewellers & Sons Pvt. Ltd.',
        upiId: 'bharatjewellers@sbi',
        isPrimary: true,
      },
      {
        id: 'bank-hdfc',
        bankName: 'HDFC Bank Ltd.',
        bankBranch: 'BBD Bagh Branch, Kolkata',
        bankAccountNumber: '50200084729103',
        bankIfsc: 'HDFC0000014',
        bankAccountType: 'Current Account',
        accountHolderName: 'Bharat Jewellers & Sons Pvt. Ltd.',
        upiId: 'bharatjewellers@hdfcbank',
        isPrimary: false,
      },
      {
        id: 'bank-icici',
        bankName: 'ICICI Bank Ltd.',
        bankBranch: 'Park Street Branch, Kolkata',
        bankAccountNumber: '000605034821',
        bankIfsc: 'ICIC0000006',
        bankAccountType: 'Current Account',
        accountHolderName: 'Bharat Jewellers & Sons Pvt. Ltd.',
        upiId: 'bharatjewellers@icici',
        isPrimary: false,
      },
      {
        id: 'bank-pnb',
        bankName: 'Punjab National Bank',
        bankBranch: 'Brabourne Road Branch, Kolkata',
        bankAccountNumber: '0129002100045612',
        bankIfsc: 'PUNB0012900',
        bankAccountType: 'Current Account',
        accountHolderName: 'Bharat Jewellers & Sons Pvt. Ltd.',
        upiId: 'bharatjewellers@pnb',
        isPrimary: false,
      },
      {
        id: 'bank-axis',
        bankName: 'Axis Bank Ltd.',
        bankBranch: 'Shakespeare Sarani Branch, Kolkata',
        bankAccountNumber: '921020045819203',
        bankIfsc: 'UTIB0000005',
        bankAccountType: 'Current Account',
        accountHolderName: 'Bharat Jewellers & Sons Pvt. Ltd.',
        upiId: 'bharatjewellers@axisbank',
        isPrimary: false,
      },
    ],

    invoiceTerms: [
      'All gold ornaments are 100% BIS Hallmarked (916 / 750 / 999).',
      'Gross weight includes stones & embellishments; Net weight denotes pure bullion weight.',
      'Making charges and stone costs are non-refundable upon buyback or scrap melting.',
      'Goods once sold can be exchanged within 7 days with the original tax invoice and intact tags.',
      'All disputes are strictly subject to Kolkata jurisdiction only.',
    ],
    invoiceDeclaration:
      'We declare that this invoice shows the actual price of the precious goods described and that all particulars are true, accurate, and hallmarked in accordance with BIS guidelines.',
  },

  // 2. GST & TAXATION DEFAULTS
  tax: {
    defaultGstRate: 3.0,
    intraStateCgstRate: 1.5,
    intraStateSgstRate: 1.5,
    interStateIgstRate: 3.0,
    defaultJewelleryHsn: '7113',
    defaultBullionHsn: '7108',
    defaultSilverHsn: '7106',
    panMandatoryCashThreshold: 200000, // Income Tax Rule 114B: Cash >= ₹2,00,000 requires PAN
    defaultItcEligibility: 'inputs',
  },

  // 3. POS & BILLING SETTINGS
  billing: {
    defaultInvoiceType: 'tax_invoice',
    defaultPaymentMode: 'cash',
    allowCreditSale: true,
    autoRoundOff: true,
    barcodePrefix: 'BJ',
    defaultMakingChargesType: 'per_gram',
    defaultMakingChargeRate: 350,
    defaultHallmarkingCharge: 45,
    invoiceTerms: [
      'All gold ornaments are 100% BIS Hallmarked (916 / 750 / 999).',
      'Gross weight includes stones & embellishments; Net weight denotes pure bullion weight.',
      'Making charges and stone costs are non-refundable upon buyback or scrap melting.',
      'Goods once sold can be exchanged within 7 days with the original tax invoice and intact tags.',
      'All disputes are strictly subject to Kolkata jurisdiction only.',
    ],
    invoiceDeclaration:
      'We declare that this invoice shows the actual price of the precious goods described and that all particulars are true, accurate, and hallmarked in accordance with BIS guidelines.',
    returnPolicyDays: 7,
  },

  // 4. DEFAULT GOLD & SILVER RATES (Used when live board rates are not yet set)
  rates: {
    default24kSelling: 7850,
    default24kBuying: 7550,
    default22kSelling: 7350,
    default22kBuying: 7050,
    default18kSelling: 6050,
    default18kBuying: 5750,
    defaultSilverSelling: 95,
    defaultSilverBuying: 88,
  },

  // 5. INVENTORY & STOCK
  inventory: {
    lowStockThresholdGrams: 50.0,
    lowStockItemCount: 3,
    defaultPurityId: 2, // 22K (916)
    tradedMetals: 'both', // 'gold' | 'silver' | 'both'
  },

  // 6. UI & LOCALIZATION
  ui: {
    appTitle: 'Bharat Jewellery ERP & POS',
    currencySymbol: '₹',
    currencyCode: 'INR',
    weightUnit: 'g',
    locale: 'en-IN',
    shortcuts: {
      posTerminal: 'F2',
      inventory: 'F4',
    },
  },
};

// ============================================================================
// CONVENIENCE SHORTCUT EXPORT FOR COMPANY DETAILS
// ============================================================================
export const COMPANY_DETAILS = APP_SETTINGS.company;

// Type alias
export type CompanyDetails = CompanyProfileSettings;

/**
 * Helper utility to merge active database profile with COMPANY_DETAILS fallback.
 * Guarantees that any missing or blank database fields safely fall back to the config.
 */
export const getCompanyDetails = (profile?: any): CompanyProfileSettings => {
  if (!profile) return APP_SETTINGS.company;

  const def = APP_SETTINGS.company;

  return {
    name: profile.business_name || profile.businessName || def.name,
    legalName: profile.legal_name || profile.legalName || def.legalName,
    shortName: profile.short_name || profile.shortName || def.shortName,
    tagline: profile.tagline || def.tagline,
    establishedYear: profile.established_year || def.establishedYear,
    hallmarkLicenseNo: profile.hallmark_license_no || profile.hallmarkLicenseNo || def.hallmarkLicenseNo,

    phone: profile.phone || def.phone,
    alternatePhone: profile.alternate_phone || profile.alternatePhone || def.alternatePhone,
    whatsapp: profile.whatsapp || def.whatsapp,
    email: profile.email || def.email,
    supportEmail: profile.support_email || profile.supportEmail || def.supportEmail,
    website: profile.website || def.website,

    address: profile.address || def.address,
    addressLine1: profile.address_line1 || profile.addressLine1 || def.addressLine1,
    addressLine2: profile.address_line2 || profile.addressLine2 || def.addressLine2,
    city: profile.city || def.city,
    state: profile.state || def.state,
    stateCode: profile.state_code || profile.stateCode || def.stateCode,
    pincode: profile.pincode || def.pincode,
    country: profile.country || def.country,

    gstin: profile.gstin || def.gstin,
    pan: profile.pan || def.pan,
    tan: profile.tan || def.tan,
    cin: profile.cin || def.cin,

    bankName: profile.bank_name || profile.bankName || def.bankName,
    bankBranch: profile.bank_branch || profile.bankBranch || def.bankBranch,
    bankAccountNumber: profile.bank_account_number || profile.bankAccountNumber || def.bankAccountNumber,
    bankIfsc: profile.bank_ifsc || profile.bankIfsc || def.bankIfsc,
    bankAccountType: profile.bank_account_type || profile.bankAccountType || def.bankAccountType,
    upiId: profile.upi_id || profile.upiId || def.upiId,
    banks: (profile?.banks && Array.isArray(profile.banks) && profile.banks.length > 0)
      ? profile.banks
      : def.banks,
    invoiceTerms: profile?.invoice_terms || (profile?.terms_and_conditions ? [profile.terms_and_conditions] : def.invoiceTerms),
    invoiceDeclaration: profile?.invoice_declaration || def.invoiceDeclaration,

    // Precious metals scope
    tradedMetals: ((): TradedMetalScope => {
      const raw = profile?.traded_metals || profile?.tradedMetals || profile?.metal_type || profile?.metalType || def.tradedMetals;
      return (raw === 'gold' || raw === 'silver' || raw === 'both') ? raw : 'both';
    })(),
    dealsInGold: ((): boolean => {
      const raw = profile?.traded_metals || profile?.tradedMetals || profile?.metal_type || profile?.metalType || def.tradedMetals;
      if (raw === 'gold' || raw === 'both') return true;
      if (raw === 'silver') return false;
      return def.dealsInGold;
    })(),
    dealsInSilver: ((): boolean => {
      const raw = profile?.traded_metals || profile?.tradedMetals || profile?.metal_type || profile?.metalType || def.tradedMetals;
      if (raw === 'silver' || raw === 'both') return true;
      if (raw === 'gold') return false;
      return def.dealsInSilver;
    })(),
  };
};

/**
 * Helper to check whether Gold trading is enabled for the organisation
 */
export const isGoldEnabled = (compOrProfile?: CompanyProfileSettings | any): boolean => {
  if (!compOrProfile) return APP_SETTINGS.company.dealsInGold;
  const scope = compOrProfile.tradedMetals || compOrProfile.traded_metals || compOrProfile.metalType;
  if (scope) return scope === 'gold' || scope === 'both';
  return compOrProfile.dealsInGold !== undefined ? Boolean(compOrProfile.dealsInGold) : APP_SETTINGS.company.dealsInGold;
};

/**
 * Helper to check whether Silver trading is enabled for the organisation
 */
export const isSilverEnabled = (compOrProfile?: CompanyProfileSettings | any): boolean => {
  if (!compOrProfile) return APP_SETTINGS.company.dealsInSilver;
  const scope = compOrProfile.tradedMetals || compOrProfile.traded_metals || compOrProfile.metalType;
  if (scope) return scope === 'silver' || scope === 'both';
  return compOrProfile.dealsInSilver !== undefined ? Boolean(compOrProfile.dealsInSilver) : APP_SETTINGS.company.dealsInSilver;
};

/**
 * Human-readable label for traded metal scope
 */
export const getTradedMetalsLabel = (scope: TradedMetalScope = 'both'): string => {
  switch (scope) {
    case 'gold':
      return 'Gold Only';
    case 'silver':
      return 'Silver Only';
    case 'both':
    default:
      return 'Both Gold & Silver';
  }
};
