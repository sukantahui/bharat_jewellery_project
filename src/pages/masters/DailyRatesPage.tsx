import React, { useState, useEffect } from 'react';
import { api, useTodayGoldRates, usePurities } from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { TrendingUp, Sparkles, Plus, RefreshCw, Coins } from 'lucide-react';
import { COMPANY_DETAILS, APP_SETTINGS, isGoldEnabled, isSilverEnabled } from '../../config/company';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const DailyRatesPage: React.FC = () => {
  const { data: todayRates, refetch: refetchToday, isLoading: loadingToday } = useTodayGoldRates();
  const { data: purities } = usePurities();

  const dealsInGold = isGoldEnabled(COMPANY_DETAILS);
  const dealsInSilver = isSilverEnabled(COMPANY_DETAILS);

  const [rateHistory, setRateHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPurityId, setFormPurityId] = useState(2); // 22k default
  const [sellingRate, setSellingRate] = useState(APP_SETTINGS.rates.default22kSelling || 7350);
  const [buyingRate, setBuyingRate] = useState(APP_SETTINGS.rates.default22kBuying || 7050);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.masters.getDailyRates();
      setRateHistory(Array.isArray(res) ? res : (res?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePurityChange = (purityId: number) => {
    setFormPurityId(purityId);
    const selected = purities?.find((p) => p.id === purityId);
    const isSilv =
      selected?.karatCode?.toLowerCase().includes('silver') ||
      selected?.karatName?.toLowerCase().includes('silver') ||
      purityId === 7 ||
      purityId === 8;

    if (isSilv) {
      setSellingRate(APP_SETTINGS.rates.defaultSilverSelling || 95);
      setBuyingRate(APP_SETTINGS.rates.defaultSilverBuying || 88);
    } else if (purityId === 1 || selected?.karatCode === '24K') {
      setSellingRate(APP_SETTINGS.rates.default24kSelling || 7850);
      setBuyingRate(APP_SETTINGS.rates.default24kBuying || 7550);
    } else if (purityId === 3 || selected?.karatCode === '18K') {
      setSellingRate(APP_SETTINGS.rates.default18kSelling || 6050);
      setBuyingRate(APP_SETTINGS.rates.default18kBuying || 5750);
    } else {
      setSellingRate(APP_SETTINGS.rates.default22kSelling || 7350);
      setBuyingRate(APP_SETTINGS.rates.default22kBuying || 7050);
    }
  };

  const handleSaveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const selected = purities?.find((p) => p.id === Number(formPurityId));
      const isSilv =
        selected?.karatCode?.toLowerCase().includes('silver') ||
        selected?.karatName?.toLowerCase().includes('silver') ||
        Number(formPurityId) === 7 ||
        Number(formPurityId) === 8;

      await api.masters.storeDailyRate({
        rate_date: formDate,
        purity_id: Number(formPurityId),
        selling_rate_per_gram: Number(sellingRate),
        buying_rate_per_gram: Number(buyingRate),
        metal_type: isSilv ? 'silver' : 'gold',
      });
      setIsModalOpen(false);
      refetchToday();
      fetchHistory();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save rate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare chart series from history
  const chartPoints = rateHistory
    .slice()
    .reverse()
    .map((r) => ({
      date: formatDate(r.rateDate || r.rate_date),
      selling: Number(r.sellingRatePerGram || r.selling_rate_per_gram),
      buying: Number(r.buyingRatePerGram || r.buying_rate_per_gram),
    }));

  const pageTitle =
    dealsInGold && dealsInSilver
      ? 'Daily Gold & Silver Bullion Rates'
      : dealsInSilver
      ? 'Daily Silver Bullion Rates'
      : 'Daily Gold Board Rates';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            {pageTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Set and broadcast daily standard bullion rates across all POS billing counters.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Set Today's Board Rate</span>
        </button>
      </div>

      {/* Today's Active Rates Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingToday ? (
          <div className="col-span-4">
            <LoadingSpinner message="Fetching today's board rates..." />
          </div>
        ) : (
          todayRates &&
          todayRates.map((rate) => {
            const isSilver =
              rate.metalType?.toLowerCase() === 'silver' ||
              rate.purity?.karatCode?.toLowerCase().includes('silver') ||
              rate.purity?.karatName?.toLowerCase().includes('silver') ||
              rate.purityId === 7 ||
              rate.purityId === 8;

            return (
              <Card
                key={rate.id}
                variant="glass"
                className={
                  isSilver
                    ? 'border-slate-500/40 bg-slate-900/60 shadow-[0_0_15px_rgba(148,163,184,0.15)]'
                    : 'border-amber-500/30 gold-card-glow'
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-bold font-cinzel text-sm ${
                      isSilver ? 'text-slate-100 flex items-center gap-1.5' : 'text-amber-300'
                    }`}
                  >
                    {isSilver && <Coins className="w-4 h-4 text-slate-300" />}
                    {rate.purity?.karatName || rate.purity?.karatCode}
                  </span>
                  <Badge variant={isSilver ? 'silver' : 'gold'} size="sm">
                    {rate.purity?.hallmarkCode
                      ? `Hallmark ${rate.purity.hallmarkCode}`
                      : isSilver
                      ? '999 Silver'
                      : rate.purity?.karatCode}
                  </Badge>
                </div>

                <div className="space-y-2 mt-4 pt-3 border-t border-slate-800/80 font-mono">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-400 uppercase">Selling:</span>
                    <span className="text-xl font-bold text-slate-100">
                      {formatCurrency(rate.sellingRatePerGram)}/g
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-[11px] text-slate-400 uppercase">Buying / Melt:</span>
                    <span className={`font-semibold ${isSilver ? 'text-cyan-400' : 'text-amber-400'}`}>
                      {formatCurrency(rate.buyingRatePerGram)}/g
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Rate Trend Chart */}
      <Card
        variant="glass"
        title="Bullion Price Trend History"
        subtitle="Daily selling vs melt buyback rates per gram"
      >
        <div className="h-72 w-full pt-4">
          {chartPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="selling"
                  name="Selling Rate (₹/g)"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f59e0b' }}
                />
                <Line
                  type="monotone"
                  dataKey="buying"
                  name="Buying/Melt (₹/g)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              No historical trend points recorded yet.
            </div>
          )}
        </div>
      </Card>

      {/* Set Rate Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          purities?.find((p) => p.id === formPurityId)?.karatCode?.toLowerCase().includes('silver') ||
          formPurityId === 7 ||
          formPurityId === 8
            ? "Update Daily Silver Rate"
            : "Update Daily Gold Rate"
        }
        subtitle="Submit today's market rate for counter billing"
        maxWidth="md"
      >
        <form onSubmit={handleSaveRate} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Effective Date</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Purity Karat / Metal</label>
            <select
              value={formPurityId}
              onChange={(e) => handlePurityChange(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
            >
              {purities?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.karatName} ({p.karatCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Selling Rate (₹/g)</label>
              <input
                type="number"
                value={sellingRate}
                onChange={(e) => setSellingRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Buying Rate (₹/g)</label>
              <input
                type="number"
                value={buyingRate}
                onChange={(e) => setBuyingRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              {isSubmitting ? 'Broadcasting...' : 'Save & Broadcast'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
