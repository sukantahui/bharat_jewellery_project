import { create } from 'zustand';

export interface PosTerminal {
  id: string;
  code: string;
  name: string;
  area: string;
  branchCode?: string;
  address?: string;
  invoicePrefix: string;
  assignedStaff?: string;
  openingBalance: number;
  currentBalance: number;
  status: 'active' | 'inactive';
  createdAt: string;
  lastActiveAt?: string;
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

  // Actions
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

const INITIAL_TERMINALS: PosTerminal[] = [
  {
    id: 'term-bow-01',
    code: 'POS-BOW-01',
    name: 'Main Gold Counter 1',
    area: 'Bowbazar Flagship Showroom',
    branchCode: 'BOW-01',
    address: '124/B Bepin Behari Ganguly Street, Bowbazar, Kolkata 700012',
    invoicePrefix: 'BJ-BOW',
    assignedStaff: 'Rahul Mukherjee',
    openingBalance: 10000,
    currentBalance: 10000,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    notes: 'Main floor gold jewellery retail billing counter with dual-display thermal printer.',
  },
  {
    id: 'term-bow-02',
    code: 'POS-BOW-02',
    name: 'Bridal Lounge Counter 2',
    area: 'Bowbazar Flagship Showroom',
    branchCode: 'BOW-01',
    address: '124/B Bepin Behari Ganguly Street, Bowbazar, Kolkata 700012',
    invoicePrefix: 'BJ-BOW2',
    assignedStaff: 'Priya Roy',
    openingBalance: 5000,
    currentBalance: 5000,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    notes: '1st Floor VIP Bridal Lounge & Diamond jewellery counter.',
  },
  {
    id: 'term-gar-01',
    code: 'POS-GAR-01',
    name: 'Gariahat Retail Counter 1',
    area: 'Gariahat Branch',
    branchCode: 'GAR-02',
    address: '42 Rashbehari Avenue, Gariahat Crossing, Kolkata 700019',
    invoicePrefix: 'BJ-GAR',
    assignedStaff: 'Anirban Sen',
    openingBalance: 8000,
    currentBalance: 8000,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    notes: 'South Kolkata primary retail outlet counter.',
  },
  {
    id: 'term-sl-01',
    code: 'POS-SL-01',
    name: 'Salt Lake Retail Counter 1',
    area: 'Salt Lake Sector 1 Branch',
    branchCode: 'SL-03',
    address: 'Block BA-12, Sector 1, Salt Lake City, Kolkata 700064',
    invoicePrefix: 'BJ-SL',
    assignedStaff: 'Tanmoy Das',
    openingBalance: 6000,
    currentBalance: 6000,
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    notes: 'North-East Kolkata residential retail counter.',
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
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TERMINALS;
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

  // Provide seamless default active session (Bowbazar Flagship Counter 1)
  const defaultTerm = INITIAL_TERMINALS[0];
  const autoSession: TerminalSession = {
    terminalId: defaultTerm.id,
    terminalCode: defaultTerm.code,
    terminalName: defaultTerm.name,
    area: defaultTerm.area,
    cashierName: defaultTerm.assignedStaff || 'Counter Billing Staff',
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

  createTerminal: (data) => {
    const newTerminal: PosTerminal = {
      ...data,
      id: `term-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
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
  },

  toggleTerminalStatus: (id) => {
    set((state) => {
      const updated = state.terminals.map((term) =>
        term.id === id
          ? { ...term, status: term.status === 'active' ? ('inactive' as const) : ('active' as const) }
          : term
      );
      try {
        localStorage.setItem(STORAGE_KEY_TERMINALS, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to toggle status', err);
      }
      return { terminals: updated };
    });
  },

  loginToTerminal: (terminalId, cashierName, openingCash) => {
    const terminal = get().terminals.find((t) => t.id === terminalId);
    if (!terminal) {
      throw new Error(`POS Terminal with ID "${terminalId}" not found.`);
    }

    const floatAmount =
      typeof openingCash === 'number' && !isNaN(openingCash)
        ? openingCash
        : terminal.openingBalance;

    const newSession: TerminalSession = {
      terminalId: terminal.id,
      terminalCode: terminal.code,
      terminalName: terminal.name,
      area: terminal.area,
      cashierName: cashierName.trim() || terminal.assignedStaff || 'Showroom Cashier',
      openingCash: floatAmount,
      sessionStartTime: new Date().toISOString(),
      totalSalesCount: 0,
      totalSalesAmount: 0,
      status: 'open',
    };

    // Update terminal last active timestamp
    const updatedTerminals = get().terminals.map((t) =>
      t.id === terminalId
        ? {
            ...t,
            lastActiveAt: new Date().toISOString(),
            currentBalance: floatAmount,
            assignedStaff: cashierName.trim() || t.assignedStaff,
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
    return newSession;
  },

  logoutFromTerminal: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch (err) {
      console.error('Failed to clear terminal session', err);
    }
    set({ activeSession: null });
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
    return get().terminals.find((t) => t.id === currentSession.terminalId);
  },
}));
