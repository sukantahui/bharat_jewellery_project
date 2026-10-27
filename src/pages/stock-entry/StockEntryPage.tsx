import React, { useState, useEffect } from 'react';
import { api, usePurities, useJewelleryCategories } from '../../api/client';
import { formatWeight, formatDate } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { PackagePlus, Plus, Trash2, Printer, Sparkles, CheckCircle2 } from 'lucide-react';

interface InwardItemRow {
  id: string;
  name: string;
  category_id: number;
  purity_id: number;
  gross_weight: number;
  stone_weight: number;
  stone_value: number;
  making_cost: number;
  purchase_cost: number;
  huid: string;
}

export const StockEntryPage: React.FC = () => {
  const { data: purities } = usePurities();
  const { data: categories } = useJewelleryCategories();

  const [karigars, setKarigars] = useState<any[]>([]);
  const [selectedKarigarId, setSelectedKarigarId] = useState<number | ''>('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  // Item repeater
  const [rows, setRows] = useState<InwardItemRow[]>([
    {
      id: 'row-1',
      name: '22K Handcrafted Gold Bangle',
      category_id: 1,
      purity_id: 2,
      gross_weight: 15.5,
      stone_weight: 0.0,
      stone_value: 0,
      making_cost: 850,
      purchase_cost: 110000,
      huid: 'HM-2610-01',
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successEntry, setSuccessEntry] = useState<any | null>(null);

  // Past Stock Entries list
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    // Fetch Karigars
    api.parties.list({ type: 'karigar' }).then((res) => setKarigars(res.data || [])).catch(console.error);
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.stockEntries.list();
      setRecentEntries(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: `row-${Date.now()}`,
        name: 'Gold Ornament Piece',
        category_id: categories?.[0]?.id || 1,
        purity_id: 2,
        gross_weight: 10.0,
        stone_weight: 0.0,
        stone_value: 0,
        making_cost: 650,
        purchase_cost: 70000,
        huid: '',
      },
    ]);
  };

  const handleUpdateRow = (id: string, partial: Partial<InwardItemRow>) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...partial } : r)));
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  // Compute totals
  const totalGross = rows.reduce((acc, r) => acc + (Number(r.gross_weight) || 0), 0);
  const totalCost = rows.reduce((acc, r) => acc + (Number(r.purchase_cost) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        party_id: selectedKarigarId ? Number(selectedKarigarId) : undefined,
        entry_date: entryDate,
        entry_type: 'production_inward',
        remarks: remarks || 'Finished jewellery received from workshop',
        items: rows.map((r) => ({
          name: r.name,
          category_id: r.category_id,
          purity_id: r.purity_id,
          gross_weight: Number(r.gross_weight),
          stone_weight: Number(r.stone_weight),
          stone_value: Number(r.stone_value),
          making_cost: Number(r.making_cost),
          purchase_cost: Number(r.purchase_cost),
          huid: r.huid || undefined,
        })),
      };

      const result = await api.stockEntries.create(payload);
      setSuccessEntry(result);
      fetchHistory();
      // Reset form
      setRows([
        {
          id: `row-${Date.now()}`,
          name: '',
          category_id: 1,
          purity_id: 2,
          gross_weight: 0,
          stone_weight: 0,
          stone_value: 0,
          making_cost: 0,
          purchase_cost: 0,
          huid: '',
        },
      ]);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to submit stock entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-amber-400" />
            Karigar Production Inward Batch
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Receive crafted ornaments from workshop goldsmiths and generate showroom barcode tags.
          </p>
        </div>
      </div>

      {/* Main Inward Form Card */}
      <Card variant="glass" className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-800">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Inward Date</label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Artisan / Karigar</label>
              <select
                value={selectedKarigarId}
                onChange={(e) => setSelectedKarigarId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="">In-House Workshop / Internal</option>
                {karigars.map((k) => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Batch Remarks / Lot #</label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Lot #26-B Bridal Collection"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Items Repeater Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono">
                  <th className="pb-2 w-10">#</th>
                  <th className="pb-2">Item Description</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Purity</th>
                  <th className="pb-2 text-right">Gross Wt (g)</th>
                  <th className="pb-2 text-right">Stone Wt (g)</th>
                  <th className="pb-2 text-right">Making Cost</th>
                  <th className="pb-2">BIS HUID</th>
                  <th className="pb-2 text-right">Cost (₹)</th>
                  <th className="pb-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="py-2 text-slate-500 font-sans">{idx + 1}</td>
                    <td className="py-2">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleUpdateRow(row.id, { name: e.target.value })}
                        placeholder="Item name..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-sans"
                        required
                      />
                    </td>
                    <td className="py-2">
                      <select
                        value={row.category_id}
                        onChange={(e) => handleUpdateRow(row.id, { category_id: Number(e.target.value) })}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-sans"
                      >
                        {categories?.map((c) => (
                          <option key={c.id} value={c.id}>{c.name || c.categoryName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <select
                        value={row.purity_id}
                        onChange={(e) => handleUpdateRow(row.id, { purity_id: Number(e.target.value) })}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-100 font-sans"
                      >
                        {purities?.map((p) => (
                          <option key={p.id} value={p.id}>{p.karatCode}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        step="0.001"
                        value={row.gross_weight}
                        onChange={(e) => handleUpdateRow(row.id, { gross_weight: Number(e.target.value) })}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right text-slate-100"
                        required
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        step="0.001"
                        value={row.stone_weight}
                        onChange={(e) => handleUpdateRow(row.id, { stone_weight: Number(e.target.value) })}
                        className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right text-slate-100"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        value={row.making_cost}
                        onChange={(e) => handleUpdateRow(row.id, { making_cost: Number(e.target.value) })}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right text-slate-100"
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="text"
                        value={row.huid}
                        onChange={(e) => handleUpdateRow(row.id, { huid: e.target.value.toUpperCase() })}
                        placeholder="HM-XXXX"
                        className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs uppercase text-slate-100"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        value={row.purchase_cost}
                        onChange={(e) => handleUpdateRow(row.id, { purchase_cost: Number(e.target.value) })}
                        className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-right text-slate-100"
                      />
                    </td>
                    <td className="py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(row.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Item Row</span>
            </button>

            <div className="flex items-center gap-6 font-mono text-xs">
              <span className="text-slate-400">Total Pieces: <strong className="text-slate-200">{rows.length}</strong></span>
              <span className="text-slate-400">Batch Weight: <strong className="text-amber-400">{formatWeight(totalGross)}</strong></span>
              <span className="text-slate-400">Total Valuation: <strong className="text-slate-200">₹{totalCost.toLocaleString('en-IN')}</strong></span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <PackagePlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Inwarding Pieces...' : 'Accept Batch & Inward Stock'}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Past Stock Entries */}
      <Card
        variant="glass"
        title="Recent Inward Batches"
        subtitle="Historical stock batches generated into showroom tags"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="pb-2">Batch #</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Karigar</th>
                <th className="pb-2 text-right">Items</th>
                <th className="pb-2 text-right">Gross Wt</th>
                <th className="pb-2">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentEntries.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 font-bold text-amber-400">{e.entry_number}</td>
                  <td className="py-2.5 text-slate-400">{formatDate(e.entry_date)}</td>
                  <td className="py-2.5 font-sans text-slate-300">{e.party?.name || 'In-House Workshop'}</td>
                  <td className="py-2.5 text-right font-bold text-slate-200">{e.total_items_count} pcs</td>
                  <td className="py-2.5 text-right font-bold text-amber-300">{formatWeight(e.total_gross_weight)}</td>
                  <td className="py-2.5 font-sans text-slate-400">{e.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Success Inward Modal with Tag List */}
      {successEntry && (
        <Modal
          isOpen={Boolean(successEntry)}
          onClose={() => setSuccessEntry(null)}
          title="Stock Inward Completed!"
          subtitle={`Batch ${successEntry.entry_number} has been cataloged into showroom stock.`}
          maxWidth="md"
        >
          <div className="space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-xs text-slate-300">
              Successfully generated <strong className="text-amber-400">{successEntry.total_items_count || rows.length} new inventory items</strong> with unique barcode tags and HUID records.
            </p>
            <div className="pt-3">
              <button
                onClick={() => setSuccessEntry(null)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
