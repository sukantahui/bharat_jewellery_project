/**
 * Bharat Jewellery ERP & POS — Complete Axios API Client & React Query Hooks
 * 
 * Copy-paste this file into: src/api/client.ts (or modularize into src/api/)
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  ApiResponse,
  LoginPayload,
  LoginResponseData,
  UserProfile,
  DashboardStatsData,
  Purity,
  JewelleryCategory,
  DailyGoldRate,
  StoreDailyGoldRatePayload,
  JewelleryItem,
  StoreJewelleryItemPayload,
  Party,
  StorePartyPayload,
  Sale,
  StoreSalePayload,
  Purchase,
  StorePurchasePayload,
  SalesReturn,
  StoreSalesReturnPayload,
  Account,
  CashDrawerSummaryData,
  AccountStatementData,
  Payment,
  StorePaymentPayload,
  ExpenseIncome,
  StoreExpenseIncomePayload,
  GstStatusData,
  Gstr1SummaryData,
  Gstr3bSummaryData,
  BusinessProfile,
  UpdateBusinessProfilePayload,
  BackupItem,
  PosTerminal,
} from '../types';
import { COMPANY_DETAILS, APP_SETTINGS, isGoldEnabled, isSilverEnabled } from '../config/company';

// ============================================================================
// 1. AXIOS CLIENT INSTANCE & INTERCEPTORS
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/bharat_api/public/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach Sanctum Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('bharat_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unified Error Handling & Auto-Logout on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<any>>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bharat_token');
      localStorage.removeItem('bharat_user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Helper for extracting response payload data
export const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> =>
  promise.then((res) => {
    const payload = res.data?.data !== undefined ? res.data.data : res.data;
    if (Array.isArray(payload)) {
      try {
        Object.defineProperty(payload, 'data', {
          value: payload,
          writable: true,
          configurable: true,
          enumerable: false,
        });
      } catch {
        // In case object is frozen or non-extensible
      }
    }
    return payload as T;
  });

/**
 * Universal safe extractor for list responses:
 * Handles array directly, { data: [...] }, or undefined/null
 */
export const extractListData = <T = any>(res: any): T[] => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
};

// ============================================================================
// 2. RAW API SERVICE FUNCTIONS
// ============================================================================

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    login: (payload: LoginPayload) => unwrap<LoginResponseData>(apiClient.post('/login', payload)),
    me: () => unwrap<UserProfile>(apiClient.get('/me')),
    logout: () => unwrap<any>(apiClient.post('/logout')),
    revokeAll: () => unwrap<any>(apiClient.post('/revokeAll')),
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    getStats: (date?: string) =>
      unwrap<DashboardStatsData>(apiClient.get('/dashboard', { params: { date } })),
  },

  // ── Jewellery Masters ─────────────────────────────────────────────────────
  masters: {
    getPurities: () => unwrap<Purity[]>(apiClient.get('/purities')),
    createPurity: (data: Partial<Purity>) => unwrap<Purity>(apiClient.post('/purities', data)),
    getCategories: () => unwrap<JewelleryCategory[]>(apiClient.get('/jewellery-categories')),
    createCategory: (data: Partial<JewelleryCategory> & { category_name?: string; category_code?: string; default_hsn_code?: string }) =>
      unwrap<JewelleryCategory>(apiClient.post('/jewellery-categories', data)),
    updateCategory: (id: number, data: Partial<JewelleryCategory> & { category_name?: string; category_code?: string; default_hsn_code?: string }) =>
      unwrap<JewelleryCategory>(apiClient.put(`/jewellery-categories/${id}`, data)),
    deleteCategory: (id: number) => unwrap<any>(apiClient.delete(`/jewellery-categories/${id}`)),
    getDailyRates: (params?: { date?: string; page?: number }) =>
      unwrap<any>(apiClient.get('/daily-gold-rates', { params })),
    getTodayRates: () => unwrap<DailyGoldRate[]>(apiClient.get('/daily-gold-rates/today')),
    storeDailyRate: (payload: StoreDailyGoldRatePayload) =>
      unwrap<DailyGoldRate>(apiClient.post('/daily-gold-rates', payload)),
  },

  // ── Inventory Items & Tags ────────────────────────────────────────────────
  inventory: {
    list: (params?: { status?: string; category_id?: number; purity_id?: number; search?: string; page?: number; per_page?: number }) =>
      unwrap<any>(apiClient.get('/jewellery-items', { params })),
    getById: (id: number) => unwrap<JewelleryItem>(apiClient.get(`/jewellery-items/${id}`)),
    getByTag: (tagCode: string) => unwrap<JewelleryItem>(apiClient.get(`/jewellery-items/tag/${encodeURIComponent(tagCode)}`)),
    create: (payload: StoreJewelleryItemPayload) => unwrap<JewelleryItem>(apiClient.post('/jewellery-items', payload)),
    update: (id: number, payload: Partial<StoreJewelleryItemPayload>) =>
      unwrap<JewelleryItem>(apiClient.put(`/jewellery-items/${id}`, payload)),
    delete: (id: number) => unwrap<any>(apiClient.delete(`/jewellery-items/${id}`)),
  },

  // ── Stock Entries (Karigar Inward) ────────────────────────────────────────
  stockEntries: {
    list: (params?: { type?: string; page?: number }) => unwrap<any>(apiClient.get('/stock-entries', { params })),
    getById: (id: number) => unwrap<any>(apiClient.get(`/stock-entries/${id}`)),
    create: (payload: any) => unwrap<any>(apiClient.post('/stock-entries', payload)),
  },

  // ── Sales & POS ───────────────────────────────────────────────────────────
  sales: {
    list: (params?: { party_id?: number; status?: string; from_date?: string; to_date?: string; page?: number }) =>
      unwrap<any>(apiClient.get('/sales', { params })),
    getById: (id: number) => unwrap<Sale>(apiClient.get(`/sales/${id}`)),
    create: (payload: StoreSalePayload) => unwrap<Sale>(apiClient.post('/sales', payload)),
    cancel: (id: number, reason: string) => unwrap<Sale>(apiClient.post(`/sales/${id}/cancel`, { reason })),
  },

  // ── Purchases & Procurement ───────────────────────────────────────────────
  purchases: {
    list: (params?: { party_id?: number; type?: string; page?: number }) =>
      unwrap<any>(apiClient.get('/purchases', { params })),
    getById: (id: number) => unwrap<Purchase>(apiClient.get(`/purchases/${id}`)),
    create: (payload: StorePurchasePayload) => unwrap<Purchase>(apiClient.post('/purchases', payload)),
    cancel: (id: number, reason: string) => unwrap<Purchase>(apiClient.post(`/purchases/${id}/cancel`, { reason })),
  },

  // ── Sales Returns (Credit Notes) ──────────────────────────────────────────
  salesReturns: {
    list: (params?: { party_id?: number; sale_id?: number; from_date?: string; to_date?: string; page?: number }) =>
      unwrap<any>(apiClient.get('/sales-returns', { params })),
    getById: (id: number) => unwrap<SalesReturn>(apiClient.get(`/sales-returns/${id}`)),
    create: (payload: StoreSalesReturnPayload) => unwrap<SalesReturn>(apiClient.post('/sales-returns', payload)),
  },

  // ── Parties (Customers, Vendors, Karigars) ────────────────────────────────
  parties: {
    list: (params?: { type?: string; search?: string; page?: number; per_page?: number }) =>
      unwrap<any>(apiClient.get('/parties', { params })),
    getById: (id: number) => unwrap<Party>(apiClient.get(`/parties/${id}`)),
    create: (payload: StorePartyPayload) => unwrap<Party>(apiClient.post('/parties', payload)),
    update: (id: number, payload: Partial<StorePartyPayload>) => unwrap<Party>(apiClient.put(`/parties/${id}`, payload)),
    delete: (id: number) => unwrap<any>(apiClient.delete(`/parties/${id}`)),
  },

  // ── Accounts & Cash Drawer ────────────────────────────────────────────────
  accounts: {
    list: (params?: { type?: string; is_cash?: number; is_bank?: number; search?: string }) =>
      unwrap<Account[]>(apiClient.get('/accounts', { params })),
    getById: (id: number) => unwrap<Account>(apiClient.get(`/accounts/${id}`)),
    cashDrawer: (date?: string) => unwrap<CashDrawerSummaryData>(apiClient.get('/accounts/drawer/cash-summary', { params: { date } })),
    statement: (id: number, params?: { from_date?: string; to_date?: string; page?: number }) =>
      unwrap<AccountStatementData>(apiClient.get(`/accounts/${id}/statement`, { params })),
  },

  // ── Payments & Receipts ───────────────────────────────────────────────────
  payments: {
    list: (params?: { type?: string; party_id?: number; account_id?: number; mode?: string; from_date?: string; to_date?: string; page?: number }) =>
      unwrap<any>(apiClient.get('/payments', { params })),
    getById: (id: number) => unwrap<Payment>(apiClient.get(`/payments/${id}`)),
    create: (payload: StorePaymentPayload) => unwrap<Payment>(apiClient.post('/payments', payload)),
  },

  // ── Expenses & Incomes ────────────────────────────────────────────────────
  expenses: {
    list: (params?: { type?: string; account_id?: number; from_date?: string; to_date?: string; page?: number }) =>
      unwrap<any>(apiClient.get('/expense-incomes', { params })),
    getById: (id: number) => unwrap<ExpenseIncome>(apiClient.get(`/expense-incomes/${id}`)),
    create: (payload: StoreExpenseIncomePayload) => unwrap<ExpenseIncome>(apiClient.post('/expense-incomes', payload)),
    delete: (id: number) => unwrap<any>(apiClient.delete(`/expense-incomes/${id}`)),
  },

  // ── GST Reports ───────────────────────────────────────────────────────────
  gst: {
    status: () => unwrap<GstStatusData>(apiClient.get('/gst/status')),
    gstr1Summary: (params: { from_date: string; to_date: string }) =>
      unwrap<Gstr1SummaryData>(apiClient.get('/gst/gstr1-summary', { params })),
    gstr3bSummary: (params: { from_date: string; to_date: string }) =>
      unwrap<Gstr3bSummaryData>(apiClient.get('/gst/gstr3b-summary', { params })),
  },

  // ── Business Profile & Backups ────────────────────────────────────────────
  profile: {
    get: () => unwrap<BusinessProfile>(apiClient.get('/business-profile')),
    update: (payload: UpdateBusinessProfilePayload) => unwrap<BusinessProfile>(apiClient.put('/business-profile', payload)),
  },
  backups: {
    list: () => unwrap<BackupItem[]>(apiClient.get('/backups')),
    create: () => unwrap<any>(apiClient.post('/backups')),
    downloadUrl: (filename: string) => `${API_BASE_URL}/backups/${filename}`,
    delete: (filename: string) => unwrap<any>(apiClient.delete(`/backups/${filename}`)),
  },
  terminals: {
    list: (params?: { status?: string; area?: string; search?: string }) =>
      unwrap<PosTerminal[]>(apiClient.get('/pos-terminals', { params })),
    getById: (id: string | number) =>
      unwrap<PosTerminal>(apiClient.get(`/pos-terminals/${id}`)),
    create: (data: Partial<PosTerminal>) =>
      unwrap<PosTerminal>(apiClient.post('/pos-terminals', data)),
    update: (id: string | number, data: Partial<PosTerminal>) =>
      unwrap<PosTerminal>(apiClient.put(`/pos-terminals/${id}`, data)),
    delete: (id: string | number) =>
      unwrap<any>(apiClient.delete(`/pos-terminals/${id}`)),
    openSession: (id: string | number, payload: { cashier_name: string; opening_cash?: number }) =>
      unwrap<any>(apiClient.post(`/pos-terminals/${id}/open-session`, payload)),
    closeSession: (id: string | number, payload: { closing_cash: number; notes?: string }) =>
      unwrap<any>(apiClient.post(`/pos-terminals/${id}/close-session`, payload)),
  },
};

// ============================================================================
// 3. REACT QUERY CUSTOM HOOKS (Ready for Components)
// ============================================================================

export const useDashboardStats = (date?: string) =>
  useQuery({
    queryKey: ['dashboard', date],
    queryFn: () => api.dashboard.getStats(date),
    refetchInterval: 60000, // Poll every minute for live counter sales
  });

export const useTodayGoldRates = () =>
  useQuery({
    queryKey: ['daily-gold-rates', 'today'],
    queryFn: async () => {
      let list: DailyGoldRate[] = [];
      try {
        const res = await api.masters.getTodayRates();
        list = extractListData<DailyGoldRate>(res);
      } catch (err) {
        console.warn('Could not fetch today board rates from API:', err);
      }

      const dealsInSilver = isSilverEnabled(COMPANY_DETAILS);
      const dealsInGold = isGoldEnabled(COMPANY_DETAILS);

      let result = [...list];

      // If dealsInSilver is active and silver rate is not in DB response, ensure silver rate is present
      const hasSilver = result.some(
        (r) =>
          r.metalType?.toLowerCase() === 'silver' ||
          r.purity?.karatCode?.toLowerCase().includes('silver') ||
          r.purity?.karatName?.toLowerCase().includes('silver') ||
          r.purityId === 7 ||
          r.purityId === 8
      );

      if (dealsInSilver && !hasSilver) {
        result.push({
          id: 9999,
          rateDate: new Date().toISOString().split('T')[0],
          metalType: 'silver',
          purityId: 7,
          sellingRatePerGram: APP_SETTINGS.rates.defaultSilverSelling || 95,
          buyingRatePerGram: APP_SETTINGS.rates.defaultSilverBuying || 88,
          notes: 'Standard Showroom Silver Board Rate',
          purity: {
            id: 7,
            karatName: 'Fine Silver (999)',
            karatCode: 'SILVER-999',
            purityPercentage: 99.9,
            hallmarkCode: '999',
            description: 'Pure Silver Bullion & Articles',
            isActive: true,
          },
        });
      }

      // Filter by metal trading scope
      if (!dealsInGold && dealsInSilver) {
        result = result.filter(
          (r) =>
            r.metalType?.toLowerCase() === 'silver' ||
            r.purity?.karatCode?.toLowerCase().includes('silver') ||
            r.purity?.karatName?.toLowerCase().includes('silver')
        );
      } else if (dealsInGold && !dealsInSilver) {
        result = result.filter(
          (r) =>
            r.metalType?.toLowerCase() !== 'silver' &&
            !r.purity?.karatCode?.toLowerCase().includes('silver') &&
            !r.purity?.karatName?.toLowerCase().includes('silver')
        );
      }

      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

export const usePurities = () =>
  useQuery({
    queryKey: ['purities'],
    queryFn: async () => {
      let list: Purity[] = [];
      try {
        const res = await api.masters.getPurities();
        list = extractListData<Purity>(res);
      } catch (err) {
        console.warn('Could not fetch purities from API:', err);
      }

      const dealsInSilver = isSilverEnabled(COMPANY_DETAILS);
      const dealsInGold = isGoldEnabled(COMPANY_DETAILS);

      let result = [...list];

      const hasSilver = result.some(
        (p) =>
          p.karatCode?.toLowerCase().includes('silver') ||
          p.karatName?.toLowerCase().includes('silver')
      );

      if (dealsInSilver && !hasSilver) {
        result.push(
          {
            id: 7,
            karatName: 'Fine Silver (999)',
            karatCode: 'SILVER-999',
            purityPercentage: 99.9,
            hallmarkCode: '999',
            description: 'Fine Silver 99.9% Bullion & Articles',
            isActive: true,
          },
          {
            id: 8,
            karatName: 'Sterling Silver (925)',
            karatCode: 'SILVER-925',
            purityPercentage: 92.5,
            hallmarkCode: '925',
            description: 'Standard 92.5% Sterling Silver Jewellery & Utensils',
            isActive: true,
          }
        );
      }

      // Scope filter
      if (!dealsInGold && dealsInSilver) {
        result = result.filter(
          (p) => p.karatCode?.toLowerCase().includes('silver') || p.karatName?.toLowerCase().includes('silver')
        );
      } else if (dealsInGold && !dealsInSilver) {
        result = result.filter(
          (p) => !p.karatCode?.toLowerCase().includes('silver') && !p.karatName?.toLowerCase().includes('silver')
        );
      }

      return result;
    },
    staleTime: 30 * 1000,
  });

export const useJewelleryCategories = () =>
  useQuery({
    queryKey: ['jewellery-categories'],
    queryFn: async () => {
      let list: JewelleryCategory[] = [];
      try {
        const res = await api.masters.getCategories();
        list = extractListData<JewelleryCategory>(res);
      } catch (err) {
        console.warn('Could not fetch categories from API:', err);
      }

      const dealsInSilver = isSilverEnabled(COMPANY_DETAILS);
      const dealsInGold = isGoldEnabled(COMPANY_DETAILS);

      let result = [...list];

      const hasSilver = result.some(
        (c) =>
          c.categoryName?.toLowerCase().includes('silver') ||
          c.categoryCode?.toLowerCase().includes('silv')
      );

      if (dealsInSilver && !hasSilver) {
        result.push(
          {
            id: 14,
            categoryName: 'Silver Articles & Utensils',
            categoryCode: 'SILV-ART',
            defaultHsnCode: APP_SETTINGS.tax.defaultSilverHsn || '7106',
            description: 'Fine silver utensils, pooja items, coins & gifts',
            isActive: true,
          },
          {
            id: 15,
            categoryName: 'Silver Jewellery & Ornaments',
            categoryCode: 'SILV-JEW',
            defaultHsnCode: APP_SETTINGS.tax.defaultSilverHsn || '7106',
            description: 'Sterling silver payal, chains, rings & ornaments',
            isActive: true,
          }
        );
      }

      if (!dealsInGold && dealsInSilver) {
        result = result.filter(
          (c) =>
            c.categoryName?.toLowerCase().includes('silver') ||
            c.categoryCode?.toLowerCase().includes('silv')
        );
      } else if (dealsInGold && !dealsInSilver) {
        result = result.filter(
          (c) =>
            !c.categoryName?.toLowerCase().includes('silver') &&
            !c.categoryCode?.toLowerCase().includes('silv')
        );
      }

      return result;
    },
    staleTime: 30 * 1000,
  });

export const useJewelleryItemByTag = (tagCode: string, enabled = true) =>
  useQuery({
    queryKey: ['jewellery-item', 'tag', tagCode],
    queryFn: () => api.inventory.getByTag(tagCode),
    enabled: Boolean(tagCode) && enabled,
    retry: false,
  });

export const useCashDrawerSummary = (date?: string) =>
  useQuery({
    queryKey: ['accounts', 'cash-drawer', date],
    queryFn: () => api.accounts.cashDrawer(date),
  });

export const useAccounts = (type?: string) =>
  useQuery({
    queryKey: ['accounts', type],
    queryFn: () => api.accounts.list({ type }),
  });

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StoreSalePayload) => api.sales.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['jewellery-items'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useCancelSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => api.sales.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['jewellery-items'] });
    },
  });
};
