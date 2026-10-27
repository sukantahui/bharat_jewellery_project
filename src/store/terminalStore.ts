import { create } from 'zustand';
import { api } from '../api/client';

export interface PosTerminal {
  id: string;
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
  createdAt?: string;
  created_at?: string;
  lastActiveAt?: string;
  last_active_at?: string;
  notes?: string;
}

export interface TerminalSession {
  terminalId: string;
  terminalCode: string;
  terminalName: string;
  area: string;
  cashierName: string;
  cashierId?: string | number;
  openingCash: number;
  sessionStartTime: string;
  totalSalesCount: number;
  totalSalesAmount: number;
  status: 'open' | 'closed';
}

interface TerminalState {
  terminals: PosTerminal[];
  activeSession: TerminalSession | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTerminalsFromApi: () => Promise<void>;
  createTerminal: (
    data: Omit<PosTerminal, 'id' | 'createdAt' | 'currentBalance' | 'lastActiveAt'>
  ) => PosTerminal;
  updateTerminal: (id: string, partial: Partial<PosTerminal>) => void;
  deleteTerminal: (id: string) => void;
  toggleTerminalStatus: (id: string) => void;
  loginToTerminal: (
    terminalId: string,
    cashierName: string,
    openingCash?: number
  ) => TerminalSession;
  logoutFromTerminal: () => void;
  recordSaleInSession: (amount: number) => void;
  syncSessionCashier: (cashierName: string) => void;

  // Helpers
  getAreas: () => string[];
  getActiveTerminal: () => PosTerminal | undefined;
}

const STORAGE_KEY_TERMINALS = 'bj_pos_terminals';
const STORAGE_KEY_SESSION = 'bj_active_terminal_session';

export const INITIAL_TERMINALS: PosTerminal[] = [
  {
    id: '1',
    code: 'POS-GOLD-01',
    name: 'Main Gold Counter',
    counterType: 'gold',
    area: 'Bowbazar Flagship Showroom',
    branchCode: 'BOW-01',
    address: '42, Bowbazar Gold Market, Central Avenue, Kolkata 700012',
    invoicePrefix: 'BJ-GOLD',
    assignedStaff: 'Main Counter Cashier',
    openingBalance: 10000,
    currentBalance: 10000,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    notes: 'Primary gold jewellery retail billing & settlement counter with dual-display thermal printer.',
  },
  {
    id: '2',
    code: 'POS-BRIDAL-02',
    name: 'VIP Bridal Lounge Counter',
    counterType: 'diamond',
    area: 'Bowbazar Flagship Showroom - 1st Floor',
    branchCode: 'BOW-01',
    address: '42, Bowbazar Gold Market, Central Avenue, Kolkata 700012',
    invoicePrefix: 'BJ-BRD',
    assignedStaff: 'Bridal Desk Manager',
    openingBalance: 15000,
    currentBalance: 15000,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    notes: 'High-value wedding jewellery consultation, billing & custom orders.',
  },
  {
    id: '3',
    code: 'POS-SILVER-03',
    name: 'Silver & Bullion Counter',
    counterType: 'silver',
    area: 'Bowbazar Flagship Showroom - Ground Floor',
    branchCode: 'BOW-01',
    address: '42, Bowbazar Gold Market, Central Avenue, Kolkata 700012',
    invoicePrefix: 'BJ-SLV',
    assignedStaff: 'Bullion In-charge',
    openingBalance: 5000,
    currentBalance: 5000,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    notes: 'Silver ornaments, utensils, coins, and certified investment bars.',
  },
];

const loadInitialTerminals = (): PosTerminal[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TERMINALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(INITIAL_TERMINALS));
      return INITIAL_TERMINALS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure "Main Gold Counter" is guaranteed to be present
      const hasMainGold = parsed.some(
        (t: any) =>
          (t.name && t.name.toLowerCase().includes('main gold counter')) ||
          (t.code && t.code.includes('POS-GOLD-01'))
      );
      if (!hasMainGold) {
        const upgraded = [INITIAL_TERMINALS[0], ...parsed];
        localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(upgraded));
        return upgraded;
      }
      return parsed;
    }
    return INITIAL_TERMINALS;
  } catch {
    return INITIAL_TERMINALS;
  }
};

const loadInitialSession = (): TerminalSession => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.terminalId) return parsed;
    }
  } catch {
    // fallback below
  }

  // Provide seamless default active session (Main Gold Counter)
  const defaultTerm = INITIAL_TERMINALS[0];
  const autoSession: TerminalSession = {
    terminalId: String(defaultTerm.id),
    terminalCode: defaultTerm.code,
    terminalName: defaultTerm.name,
    area: defaultTerm.area,
    cashierName: defaultTerm.assignedStaff || 'Main Counter Cashier',
    openingCash: defaultTerm.openingBalance,
    sessionStartTime: new Date().toISOString(),
    totalSalesCount: 0,
    totalSalesAmount: 0,
    status: 'open',
  };

  try {
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(autoSession));
  } catch {
    // ignore
  }

  return autoSession;
};

export const useTerminalStore = create<TerminalState>((set, get) => ({
  terminals: loadInitialTerminals(),
  activeSession: loadInitialSession(),
  isLoading: false,
  error: null,

  fetchTerminalsFromApi: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.terminals.list();
      const list: any[] = Array.isArray(res) ? res : ((res as any)?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        const formatted: PosTerminal[] = list.map((item: any) => ({
          id: String(item.id),
          code: item.code,
          name: item.name,
          counterType: item.counterType || item.counter_type || 'gold',
          area: item.area,
          branchCode: item.branchCode || item.branch_code || '',
          address: item.address || '',
          invoicePrefix: item.invoicePrefix || item.invoice_prefix || 'BJ-INV',
          assignedStaff: item.assignedStaff || item.assigned_staff || '',
          openingBalance: Number(item.openingBalance ?? item.opening_balance ?? 0),
          currentBalance: Number(item.currentBalance ?? item.current_balance ?? 0),
          status: item.status || 'active',
          createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          lastActiveAt: item.lastActiveAt || item.last_active_at || new Date().toISOString(),
          notes: item.notes || '',
        }));

        set({ terminals: formatted, isLoading: false });
        try {
          localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(formatted));
        } catch (err) {
          console.error('Failed to update localStorage with API terminals', err);
        }
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      console.warn('POS API terminals fetch note (using cached/fallback):', err?.message || err);
      set({ isLoading: false, error: err?.message || 'Failed to fetch terminals from API' });
    }
  },

  createTerminal: (data) => {
    const localId = `term-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;
    const newTerminal: PosTerminal = {
      ...data,
      id: localId,
      currentBalance: data.openingBalance || 0,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = [newTerminal, ...state.terminals];
      try {
        localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to persist POS terminals to localStorage', err);
      }
      return { terminals: updated };
    });

    api.terminals
      .create({
        code: data.code,
        name: data.name,
        counter_type: data.counterType || (data.name.toLowerCase().includes('gold') ? 'gold' : 'general'),
        area: data.area,
        branch_code: data.branchCode,
        address: data.address,
        invoice_prefix: data.invoicePrefix,
        assigned_staff: data.assignedStaff,
        opening_balance: data.openingBalance,
        status: data.status,
        notes: data.notes,
      })
      .then((serverTerm: any) => {
        if (serverTerm && serverTerm.id) {
          const serverId = String(serverTerm.id);
          set((state) => {
            const synced = state.terminals.map((t) =>
              t.id === localId ? { ...t, ...serverTerm, id: serverId } : t
            );
            try {
              localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(synced));
            } catch {}
            return { terminals: synced };
          });
        }
      })
      .catch((err) => {
        console.warn('Terminal created locally, backend sync note:', err);
      });

    return newTerminal;
  },

  updateTerminal: (id, partial) => {
    set((state) => {
      const updated = state.terminals.map((term) =>
        term.id === id ? { ...term, ...partial } : term
      );
      try {
        localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to update POS terminal', err);
      }

      // If active session belongs to this terminal, update terminalName or area if changed
      let session = state.activeSession;
      if (session && session.terminalId === id) {
        session = {
          ...session,
          terminalName: partial.name ?? session.terminalName,
          terminalCode: partial.code ?? session.terminalCode,
          area: partial.area ?? session.area,
        };
        try {
          localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        } catch {
          // ignore
        }
      }

      return { terminals: updated, activeSession: session };
    });

    api.terminals
      .update(id, {
        code: partial.code,
        name: partial.name,
        counter_type: partial.counterType,
        area: partial.area,
        branch_code: partial.branchCode,
        address: partial.address,
        invoice_prefix: partial.invoicePrefix,
        assigned_staff: partial.assignedStaff,
        opening_balance: partial.openingBalance,
        status: partial.status,
        notes: partial.notes,
      })
      .catch((err) => {
        console.warn('Terminal updated locally, backend sync note:', err);
      });
  },

  deleteTerminal: (id) => {
    set((state) => {
      const updated = state.terminals.filter((term) => term.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to delete POS terminal', err);
      }

      let session = state.activeSession;
      if (session && session.terminalId === id) {
        session = null;
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }

      return { terminals: updated, activeSession: session };
    });

    api.terminals.delete(id).catch((err: any) => {
      console.warn('Terminal deleted locally, backend delete note:', err?.message || err);
    });
  },

  toggleTerminalStatus: (id) => {
    let nextStatus: 'active' | 'inactive' = 'active';
    set((state) => {
      const target = state.terminals.find((t) => t.id === id);
      nextStatus = target && target.status === 'active' ? 'inactive' : 'active';
      const updated = state.terminals.map((term) =>
        term.id === id ? { ...term, status: nextStatus } : term
      );
      try {
        localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to toggle status', err);
      }
      return { terminals: updated };
    });

    api.terminals.update(id, { status: nextStatus }).catch((err) => {
      console.warn('Terminal status toggled locally, backend sync note:', err);
    });
  },

  loginToTerminal: (terminalId, cashierName, openingCash) => {
    const terminal = get().terminals.find((t) => String(t.id) === String(terminalId));
    if (!terminal) {
      throw new Error(`POS Terminal with ID "${terminalId}" not found.`);
    }

    const floatAmount =
      typeof openingCash === 'number' && !isNaN(openingCash)
        ? openingCash
        : (terminal.openingBalance || 10000);

    const cleanCashier = cashierName.trim() || terminal.assignedStaff || 'Showroom Cashier';

    const newSession: TerminalSession = {
      terminalId: String(terminal.id),
      terminalCode: terminal.code,
      terminalName: terminal.name,
      area: terminal.area,
      cashierName: cleanCashier,
      openingCash: floatAmount,
      sessionStartTime: new Date().toISOString(),
      totalSalesCount: 0,
      totalSalesAmount: 0,
      status: 'open',
    };

    // Update terminal last active timestamp and cashier
    const updatedTerminals = get().terminals.map((t) =>
      String(t.id) === String(terminalId)
        ? {
            ...t,
            lastActiveAt: new Date().toISOString(),
            currentBalance: floatAmount,
            assignedStaff: cleanCashier,
          }
        : t
    );

    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(newSession));
      localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(updatedTerminals));
    } catch (err) {
      console.error('Failed to save terminal session', err);
    }

    set({ activeSession: newSession, terminals: updatedTerminals });

    api.terminals
      .openSession(terminalId, {
        cashier_name: cleanCashier,
        opening_cash: floatAmount,
      })
      .catch((err) => {
        console.warn('Session opened locally, backend notification note:', err);
      });

    return newSession;
  },

  logoutFromTerminal: () => {
    const session = get().activeSession;
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch (err) {
      console.error('Failed to clear terminal session', err);
    }
    set({ activeSession: null });

    if (session && session.terminalId) {
      api.terminals
        .closeSession(session.terminalId, {
          closing_cash: session.openingCash + session.totalSalesAmount,
          notes: `Shift ended by ${session.cashierName}. Total sales: ${session.totalSalesCount}`,
        })
        .catch((err) => {
          console.warn('Session ended locally, backend notification note:', err);
        });
    }
  },

  recordSaleInSession: (amount) => {
    set((state) => {
      if (!state.activeSession) return state;

      const updatedSession: TerminalSession = {
        ...state.activeSession,
        totalSalesCount: state.activeSession.totalSalesCount + 1,
        totalSalesAmount: state.activeSession.totalSalesAmount + amount,
      };

      // Also update the terminal's currentBalance
      const updatedTerminals = state.terminals.map((term) =>
        term.id === state.activeSession?.terminalId
          ? {
              ...term,
              currentBalance: term.currentBalance + amount,
              lastActiveAt: new Date().toISOString(),
            }
          : term
      );

      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updatedSession));
        localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(updatedTerminals));
      } catch (err) {
        console.error('Failed to update session sale', err);
      }

      return {
        activeSession: updatedSession,
        terminals: updatedTerminals,
      };
    });
  },

  syncSessionCashier: (cashierName: string) => {
    set((state) => {
      if (!state.activeSession) return state;
      const cleanName = cashierName.trim();
      if (!cleanName || state.activeSession.cashierName === cleanName) return state;

      const updatedSession: TerminalSession = {
        ...state.activeSession,
        cashierName: cleanName,
      };

      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updatedSession));
      } catch {
        // ignore
      }

      return { activeSession: updatedSession };
    });
  },

  getAreas: () => {
    const areas = new Set<string>();
    get().terminals.forEach((term) => {
      if (term.area) areas.add(term.area);
    });
    return Array.from(areas);
  },

  getActiveTerminal: () => {
    const currentSession = get().activeSession;
    if (!currentSession) return undefined;
    return get().terminals.find((t) => String(t.id) === String(currentSession.terminalId));
  },
}));
