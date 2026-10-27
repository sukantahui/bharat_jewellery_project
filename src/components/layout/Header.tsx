import React, { useState, useEffect } from 'react';
import { useTodayGoldRates, useCashDrawerSummary, api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useTerminalStore } from '../../store/terminalStore';
import { formatCurrency } from '../../utils/formatters';
import { Sparkles, TrendingUp, Wallet, User as UserIcon, LogOut, RefreshCw, Coins, HelpCircle, Monitor } from 'lucide-react';
import { Modal } from '../common/Modal';
import { COMPANY_DETAILS, APP_SETTINGS, isGoldEnabled, isSilverEnabled } from '../../config/company';

interface HeaderProps {
  onNavigate?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, logout } = useAuthStore();
  const { activeSession } = useTerminalStore();
  const { data: todayRates, refetch: refetchRates } = useTodayGoldRates();
  const { data: cashDrawer } = useCashDrawerSummary();
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  const dealsInGold = isGoldEnabled(COMPANY_DETAILS);
  const dealsInSilver = isSilverEnabled(COMPANY_DETAILS);

  const [rateForm, setRateForm] = useState({
    selling_22k: APP_SETTINGS.rates.default22kSelling || 7350,
    buying_22k: APP_SETTINGS.rates.default22kBuying || 7050,
    selling_24k: APP_SETTINGS.rates.default24kSelling || 7850,
    buying_24k: APP_SETTINGS.rates.default24kBuying || 7550,
    selling_18k: APP_SETTINGS.rates.default18kSelling || 6050,
    buying_18k: APP_SETTINGS.rates.default18kBuying || 5750,
    selling_silver: APP_SETTINGS.rates.defaultSilverSelling || 95,
    buying_silver: APP_SETTINGS.rates.defaultSilverBuying || 88,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Find 22K, 24K, 18K, Silver rates
  const rate22k = todayRates?.find((r) => r.purity?.karatCode === '22K' || r.purityId === 2);
  const rate24k = todayRates?.find((r) => r.purity?.karatCode === '24K' || r.purityId === 1);
  const rate18k = todayRates?.find((r) => r.purity?.karatCode === '18K' || r.purityId === 3);
  const rateSilver = todayRates?.find(
    (r) =>
      r.metalType?.toLowerCase() === 'silver' ||
      r.purity?.karatCode?.toLowerCase().includes('silver') ||
      r.purity?.karatName?.toLowerCase().includes('silver') ||
      r.purityId === 7 ||
      r.purityId === 8
  );

  // Pre-fill form when rates load or modal is opened
  useEffect(() => {
    if (todayRates && todayRates.length > 0) {
      setRateForm((prev) => ({
        ...prev,
        selling_22k: rate22k ? Number(rate22k.sellingRatePerGram) : prev.selling_22k,
        buying_22k: rate22k ? Number(rate22k.buyingRatePerGram) : prev.buying_22k,
        selling_24k: rate24k ? Number(rate24k.sellingRatePerGram) : prev.selling_24k,
        buying_24k: rate24k ? Number(rate24k.buyingRatePerGram) : prev.buying_24k,
        selling_18k: rate18k ? Number(rate18k.sellingRatePerGram) : prev.selling_18k,
        buying_18k: rate18k ? Number(rate18k.buyingRatePerGram) : prev.buying_18k,
        selling_silver: rateSilver ? Number(rateSilver.sellingRatePerGram) : prev.selling_silver,
        buying_silver: rateSilver ? Number(rateSilver.buyingRatePerGram) : prev.buying_silver,
      }));
    }
  }, [todayRates, isRateModalOpen]);

  const handleUpdateRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      if (dealsInGold) {
        // Post 22k
        await api.masters.storeDailyRate({
          rate_date: today,
          purity_id: 2,
          selling_rate_per_gram: Number(rateForm.selling_22k),
          buying_rate_per_gram: Number(rateForm.buying_22k),
          metal_type: 'gold',
        });
        // Post 24k
        await api.masters.storeDailyRate({
          rate_date: today,
          purity_id: 1,
          selling_rate_per_gram: Number(rateForm.selling_24k),
          buying_rate_per_gram: Number(rateForm.buying_24k),
          metal_type: 'gold',
        });
      }

      if (dealsInSilver) {
        // Post silver with valid silver purity id
        const silverPurityId =
          todayRates?.find(
            (r) =>
              r.metalType?.toLowerCase() === 'silver' ||
              r.purity?.karatCode?.toLowerCase().includes('silver') ||
              r.purityId === 7
          )?.purityId || 7;

        await api.masters.storeDailyRate({
          rate_date: today,
          purity_id: silverPurityId,
          selling_rate_per_gram: Number(rateForm.selling_silver),
          buying_rate_per_gram: Number(rateForm.buying_silver),
          metal_type: 'silver',
        });
      }

      refetchRates();
      setIsRateModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 no-print">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Live Gold / Silver Rates Board */}
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.1)]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-400" />
            <span className="font-cinzel uppercase tracking-wider text-[11px]">
              {!dealsInGold && dealsInSilver
                ? 'Silver Rates Today:'
                : dealsInGold && !dealsInSilver
                ? 'Gold Rates Today:'
                : 'Bullion Rates Today:'}
            </span>
          </div>

          {/* Gold Rates (Only if dealsInGold) */}
          {dealsInGold && (
            <>
              {/* 24K */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs shrink-0">
                <span className="font-bold text-amber-300">24K Bullion:</span>
                <span className="font-mono font-bold text-slate-100">
                  ₹{rate24k ? rate24k.sellingRatePerGram : APP_SETTINGS.rates.default24kSelling}/g
                </span>
              </div>

              {/* 22K */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-amber-500/20 text-xs shrink-0">
                <span className="font-bold text-amber-400">22K (916):</span>
                <span className="font-mono font-bold text-slate-100">
                  ₹{rate22k ? rate22k.sellingRatePerGram : APP_SETTINGS.rates.default22kSelling}/g
                </span>
                <span className="text-[10px] text-slate-400">
                  (Buy: ₹{rate22k ? rate22k.buyingRatePerGram : APP_SETTINGS.rates.default22kBuying})
                </span>
              </div>

              {/* 18K */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs shrink-0">
                <span className="font-bold text-amber-200">18K:</span>
                <span className="font-mono font-bold text-slate-100">
                  ₹{rate18k ? rate18k.sellingRatePerGram : APP_SETTINGS.rates.default18kSelling}/g
                </span>
              </div>
            </>
          )}

          {/* Silver Rates (Only if dealsInSilver) */}
          {dealsInSilver && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/60 text-xs shrink-0">
              <span className="font-bold text-slate-200 flex items-center gap-1">
                <Coins className="w-3 h-3 text-slate-300" /> Silver (999):
              </span>
              <span className="font-mono font-bold text-slate-100">
                ₹{rateSilver ? rateSilver.sellingRatePerGram : APP_SETTINGS.rates.defaultSilverSelling}/g
              </span>
              <span className="text-[10px] text-slate-400">
                (Buy: ₹{rateSilver ? rateSilver.buyingRatePerGram : APP_SETTINGS.rates.defaultSilverBuying})
              </span>
            </div>
          )}

          <button
            onClick={() => setIsRateModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs transition-colors shrink-0 cursor-pointer"
            title="Set Today's Board Rates"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Set Rates</span>
          </button>
        </div>

        {/* Right: Cash In Hand & User Profile */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Active POS Terminal Counter Badge */}
          <div
            onClick={() => onNavigate && onNavigate('terminals')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs cursor-pointer transition-all"
            title="Click to view or switch POS Terminals & Branches"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></div>
            <Monitor className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 leading-none">POS Counter</div>
              <div className="font-mono font-bold text-amber-300 leading-tight">
                {activeSession ? activeSession.terminalCode : 'POS-BOW-01'}
              </div>
            </div>
          </div>

          {/* Cash Drawer Widget */}
          <div
            onClick={() => onNavigate && onNavigate('accounts')}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs cursor-pointer transition-all"
            title="Showroom Cash-in-Hand Balance"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 leading-none">Cash Drawer</div>
              <div className="font-mono font-bold text-emerald-400 leading-tight">
                {cashDrawer ? formatCurrency(cashDrawer.cash_in_hand) : '₹0.00'}
              </div>
            </div>
          </div>

          {/* User Manual & Operating Guide Button */}
          <a
            href="/user-manual.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:text-amber-200 text-xs font-semibold cursor-pointer transition-all shadow-sm group"
            title="Learn How to Use This Software (Interactive User Manual)"
          >
            <HelpCircle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline">User Guide</span>
          </a>

          {/* Active User Badge & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md">
              {user?.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-tight flex items-center gap-1.5">
                {user?.name || 'Administrator'}
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-normal">
                  {user?.role || 'Admin'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5">{user?.userName || 'sukantahui'}</div>
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1 cursor-pointer"
              title="Logout Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Set Today's Rates Modal */}
      <Modal
        isOpen={isRateModalOpen}
        onClose={() => setIsRateModalOpen(false)}
        title={
          !dealsInGold && dealsInSilver
            ? "Set Today's Silver Board Rates"
            : dealsInGold && !dealsInSilver
            ? "Set Today's Gold Board Rates"
            : "Set Today's Gold & Silver Board Rates"
        }
        subtitle="Broadcast today's bullion and retail rates for all POS terminals and purchase entries"
        maxWidth="md"
        zIndex="z-[110]"
      >
        <form onSubmit={handleUpdateRates} className="space-y-4">
          {dealsInGold && (
            <>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 22 Karat (916 BIS Hallmark)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Selling Rate (₹/g)</label>
                    <input
                      type="number"
                      value={rateForm.selling_22k}
                      onChange={(e) => setRateForm({ ...rateForm, selling_22k: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Buying / Melt Rate (₹/g)</label>
                    <input
                      type="number"
                      value={rateForm.buying_22k}
                      onChange={(e) => setRateForm({ ...rateForm, buying_22k: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 24 Karat (999 Fine Bullion)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Selling Rate (₹/g)</label>
                    <input
                      type="number"
                      value={rateForm.selling_24k}
                      onChange={(e) => setRateForm({ ...rateForm, selling_24k: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Buying Rate (₹/g)</label>
                    <input
                      type="number"
                      value={rateForm.buying_24k}
                      onChange={(e) => setRateForm({ ...rateForm, buying_24k: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {dealsInSilver && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-700/60 space-y-3">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-slate-300" /> Silver (999 Fine Bullion & Articles)
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Selling Rate (₹/g)</label>
                  <input
                    type="number"
                    value={rateForm.selling_silver}
                    onChange={(e) => setRateForm({ ...rateForm, selling_silver: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Buying Rate (₹/g)</label>
                  <input
                    type="number"
                    value={rateForm.buying_silver}
                    onChange={(e) => setRateForm({ ...rateForm, buying_silver: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono text-sm focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRateModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/20"
            >
              {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Save & Broadcast Rates
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
};
