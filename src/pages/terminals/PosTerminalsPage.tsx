import React, { useState, useEffect } from 'react';
import { useTerminalStore, PosTerminal } from '../../store/terminalStore';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import {
  Monitor,
  Plus,
  MapPin,
  UserCheck,
  Wallet,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Power,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  Building2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface PosTerminalsPageProps {
  onNavigate?: (tab: string) => void;
}

export const PosTerminalsPage: React.FC<PosTerminalsPageProps> = ({ onNavigate }) => {
  const { user } = useAuthStore();
  const {
    terminals,
    activeSession,
    isLoading,
    fetchTerminalsFromApi,
    createTerminal,
    updateTerminal,
    deleteTerminal,
    toggleTerminalStatus,
    loginToTerminal,
    logoutFromTerminal,
    getAreas,
  } = useTerminalStore();

  useEffect(() => {
    fetchTerminalsFromApi();
  }, [fetchTerminalsFromApi]);

  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<PosTerminal | null>(null);

  // Quick Login Modal state
  const [loginModalTerminal, setLoginModalTerminal] = useState<PosTerminal | null>(null);
  const [cashierNameInput, setCashierNameInput] = useState('');
  const [openingCashInput, setOpeningCashInput] = useState<number>(5000);

  // Form State for Create / Edit
  const [form, setForm] = useState({
    code: '',
    name: '',
    area: '',
    branchCode: '',
    address: '',
    invoicePrefix: 'BJ-',
    assignedStaff: '',
    openingBalance: 5000,
    status: 'active' as 'active' | 'inactive',
    notes: '',
  });

  const areas = getAreas();

  // Filter terminals
  const filteredTerminals = terminals.filter((term) => {
    const matchesArea = selectedArea === 'all' || term.area === selectedArea;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      term.code.toLowerCase().includes(q) ||
      term.name.toLowerCase().includes(q) ||
      term.area.toLowerCase().includes(q) ||
      (term.assignedStaff && term.assignedStaff.toLowerCase().includes(q)) ||
      (term.invoicePrefix && term.invoicePrefix.toLowerCase().includes(q));

    return matchesArea && matchesSearch;
  });

  // KPI Metrics
  const totalTerminals = terminals.length;
  const activeCount = terminals.filter((t) => t.status === 'active').length;
  const totalDrawerCash = terminals.reduce((sum, t) => sum + (t.currentBalance || 0), 0);
  const distinctAreasCount = areas.length;

  const handleOpenCreateModal = () => {
    setEditingTerminal(null);
    const nextNum = terminals.length + 1;
    setForm({
      code: `POS-CTR-${nextNum.toString().padStart(2, '0')}`,
      name: `Retail Counter ${nextNum}`,
      area: areas[0] || 'Main Showroom',
      branchCode: 'HO-01',
      address: '',
      invoicePrefix: 'BJ-INV',
      assignedStaff: user?.name || '',
      openingBalance: 5000,
      status: 'active',
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (term: PosTerminal) => {
    setEditingTerminal(term);
    setForm({
      code: term.code,
      name: term.name,
      area: term.area,
      branchCode: term.branchCode || '',
      address: term.address || '',
      invoicePrefix: term.invoicePrefix,
      assignedStaff: term.assignedStaff || '',
      openingBalance: term.openingBalance,
      status: term.status,
      notes: term.notes || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveTerminal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim() || !form.area.trim()) {
      alert('Please fill Terminal Code, Name, and Area.');
      return;
    }

    if (editingTerminal) {
      updateTerminal(editingTerminal.id, {
        code: form.code.trim(),
        name: form.name.trim(),
        area: form.area.trim(),
        branchCode: form.branchCode.trim(),
        address: form.address.trim(),
        invoicePrefix: form.invoicePrefix.trim(),
        assignedStaff: form.assignedStaff.trim(),
        openingBalance: Number(form.openingBalance) || 0,
        status: form.status,
        notes: form.notes.trim(),
      });
    } else {
      createTerminal({
        code: form.code.trim(),
        name: form.name.trim(),
        area: form.area.trim(),
        branchCode: form.branchCode.trim(),
        address: form.address.trim(),
        invoicePrefix: form.invoicePrefix.trim(),
        assignedStaff: form.assignedStaff.trim(),
        openingBalance: Number(form.openingBalance) || 0,
        status: form.status,
        notes: form.notes.trim(),
      });
    }

    setIsCreateModalOpen(false);
    setEditingTerminal(null);
  };

  const handleInitiateLogin = (term: PosTerminal) => {
    setLoginModalTerminal(term);
    setCashierNameInput(user?.name || term.assignedStaff || 'Showroom Cashier');
    setOpeningCashInput(term.openingBalance || 5000);
  };

  const handleConfirmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginModalTerminal) return;

    loginToTerminal(
      loginModalTerminal.id,
      cashierNameInput,
      Number(openingCashInput)
    );

    setLoginModalTerminal(null);

    // If onNavigate provided, jump to POS Billing
    if (onNavigate) {
      onNavigate('pos');
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to end the active POS shift session?')) {
      logoutFromTerminal();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 p-6 rounded-3xl border border-amber-500/20 gold-card-glow">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold">
              Multi-Area Counter Network
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 font-cinzel tracking-wide mt-1 flex items-center gap-2">
            POS Terminals & Branch Counters
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-amber-300/80 font-sans mt-0.5">
            Area-based POS terminal network, billing counter control, and cashier shift management
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeSession && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-emerald-200">{activeSession.terminalCode}</span>
                <span className="text-emerald-400/80"> ({activeSession.area})</span>
              </div>
              <button
                onClick={handleLogout}
                title="End Shift Session"
                className="ml-1 p-1 hover:bg-emerald-500/20 rounded text-emerald-300 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => fetchTerminalsFromApi()}
            disabled={isLoading}
            title="Refresh Terminals from API"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-amber-300 font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Create New POS Terminal
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Total Terminals</div>
            <div className="text-xl font-black text-slate-100 font-mono">
              {totalTerminals} <span className="text-xs font-normal text-emerald-400">({activeCount} Active)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Showroom Areas</div>
            <div className="text-xl font-black text-slate-100 font-mono">
              {distinctAreasCount} <span className="text-xs font-normal text-slate-400">Locations</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Active Shift</div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              {activeSession ? '1 Open' : '0 Logged In'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Total Drawer Float</div>
            <div className="text-xl font-black text-amber-300 font-mono">
              {formatCurrency(totalDrawerCash)}
            </div>
          </div>
        </div>
      </div>

      {/* Area Filtering Tabs & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Area Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedArea('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedArea === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Areas ({terminals.length})
          </button>
          {areas.map((areaName) => {
            const count = terminals.filter((t) => t.area === areaName).length;
            const isSelected = selectedArea === areaName;
            return (
              <button
                key={areaName}
                onClick={() => setSelectedArea(areaName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>{areaName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search terminal code, counter, staff..."
            className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-sans"
          />
        </div>
      </div>

      {/* POS Terminal Cards Grid */}
      {filteredTerminals.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 text-slate-400 space-y-3">
          <Monitor className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-200 font-cinzel">No POS Terminals Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No terminal matches search term "${searchQuery}".`
              : 'No POS counter terminals have been configured in this area yet.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer"
          >
            Create First POS Terminal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTerminals.map((term) => {
            const isCurrentlyActive = activeSession?.terminalId === term.id;
            return (
              <div
                key={term.id}
                className={`bg-slate-900/90 rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl ${
                  isCurrentlyActive
                    ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : term.status === 'active'
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-800/60 opacity-60'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {term.code}
                        </span>
                        {isCurrentlyActive && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Live Session
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-slate-100 font-cinzel tracking-wide">
                        {term.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleTerminalStatus(term.id)}
                        title={term.status === 'active' ? 'Deactivate Terminal' : 'Activate Terminal'}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          term.status === 'active'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(term)}
                        title="Edit Terminal Settings"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete terminal ${term.code} (${term.name})?`)) {
                            deleteTerminal(term.id);
                          }
                        }}
                        title="Delete Terminal"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Location & Details */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-amber-300/90 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{term.area}</span>
                    </div>
                    {term.address && (
                      <p className="text-[11px] text-slate-400 truncate pl-5">
                        {term.address}
                      </p>
                    )}
                  </div>

                  {/* Cash Drawer & Assigned Staff Box */}
                  <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Cash in Drawer</span>
                      <span className="text-amber-400 font-bold text-sm">
                        {formatCurrency(term.currentBalance)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Invoice Series</span>
                      <span className="text-slate-200 font-bold text-sm">
                        {term.invoicePrefix || 'BJ-'}
                      </span>
                    </div>
                  </div>

                  {/* Cashier / Staff indicator */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-300 font-medium">
                        {term.assignedStaff || 'Unassigned Cashier'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Float: ₹{term.openingBalance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Card Footer / Action */}
                <div className="p-4 bg-slate-950/80 border-t border-slate-800/80">
                  {isCurrentlyActive ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate && onNavigate('pos')}
                        className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        Go to Billing (<kbd className="font-mono text-[10px]">F2</kbd>)
                      </button>
                      <button
                        onClick={handleLogout}
                        title="End Shift"
                        className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        End Shift
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInitiateLogin(term)}
                      disabled={term.status !== 'active'}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 hover:border-amber-500 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      Login & Start Billing on this Counter
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create / Edit POS Terminal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingTerminal ? `Edit POS Terminal (${editingTerminal.code})` : 'Create New POS Terminal & Branch Counter'}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveTerminal} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Terminal Code <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="POS-BOW-01"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                required
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Unique terminal identifier e.g. POS-BOW-01, POS-GAR-02</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Counter Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Main Gold Counter 1"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                required
              />
              <p className="text-[10px] text-slate-500 mt-0.5">E.g., Ground Floor Counter, Bridal Lounge, Diamond Section</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Area / Branch Location <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                list="existing-areas-list"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="Bowbazar Flagship Showroom"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                required
              />
              <datalist id="existing-areas-list">
                {areas.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
              <p className="text-[10px] text-slate-500 mt-0.5">Select existing showroom area or type a new branch name</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Invoice Number Prefix <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={form.invoicePrefix}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value.toUpperCase() })}
                placeholder="BJ-BOW"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                required
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Bill numbers will generate as: {form.invoicePrefix}-2026-0001</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default Opening Float Cash (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={form.openingBalance}
                onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Standard float in drawer at morning shift start</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Assigned Default Cashier / Staff
              </label>
              <input
                type="text"
                value={form.assignedStaff}
                onChange={(e) => setForm({ ...form, assignedStaff: e.target.value })}
                placeholder="Rahul Mukherjee"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Primary sales staff responsible for this counter</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Branch Physical Address / Room / Floor
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="124/B Bepin Behari Ganguly Street, Bowbazar, Kolkata 700012"
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Terminal Notes / Hardware Specs
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Thermal printer, Barcode Scanner, Cash drawer port 1"
              className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={form.status === 'active'}
                onChange={(e) => setForm({ ...form, status: e.target.checked ? 'active' : 'inactive' })}
                className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
              />
              <span>Terminal is Active and available for Cashier login</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {editingTerminal ? 'Save Changes' : 'Create POS Terminal'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL: Cashier Shift Login to Counter */}
      <Modal
        isOpen={Boolean(loginModalTerminal)}
        onClose={() => setLoginModalTerminal(null)}
        title="Open POS Terminal Shift"
        maxWidth="md"
      >
        {loginModalTerminal && (
          <form onSubmit={handleConfirmLogin} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-300">
                <Monitor className="w-4 h-4" />
                <span>Opening Counter: {loginModalTerminal.name} ({loginModalTerminal.code})</span>
              </div>
              <div className="text-amber-200/80">
                Area: <span className="font-semibold">{loginModalTerminal.area}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Operating Cashier Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={cashierNameInput}
                onChange={(e) => setCashierNameInput(e.target.value)}
                placeholder="Enter staff name"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Verified Opening Cash Float (₹) <span className="text-amber-400">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={openingCashInput}
                onChange={(e) => setOpeningCashInput(Number(e.target.value))}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                required
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Count the physical cash in this counter's drawer before opening shift.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setLoginModalTerminal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                Login & Launch POS Billing
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
