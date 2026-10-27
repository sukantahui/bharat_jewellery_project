import React, { useState, useEffect } from 'react';
import { api, usePurities, useJewelleryCategories } from '../../api/client';
import { JewelleryItem, StoreJewelleryItemPayload } from '../../types';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BarcodeTagPrint } from '../../components/print/BarcodeTagPrint';
import {
  Gem,
  Search,
  Plus,
  Printer,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const InventoryListPage: React.FC = () => {
  const [items, setItems] = useState<JewelleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('in_stock');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [purityFilter, setPurityFilter] = useState<number | ''>('');
  const [search, setSearch] = useState('');

  const { data: purities } = usePurities();
  const { data: categories } = useJewelleryCategories();

  // Print Barcode Tag Modal
  const [printTagItem, setPrintTagItem] = useState<JewelleryItem | null>(null);

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<StoreJewelleryItemPayload>({
    name: '',
    category_id: 1,
    purity_id: 2, // 22k
    gross_weight: 5.0,
    stone_weight: 0.0,
    stone_value: 0,
    making_cost: 500,
    purchase_cost: 35000,
    huid: '',
    status: 'in_stock',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.inventory.list({
        status: statusFilter === 'all' ? undefined : statusFilter,
        category_id: categoryFilter ? Number(categoryFilter) : undefined,
        purity_id: purityFilter ? Number(purityFilter) : undefined,
        search: search.trim() || undefined,
      });
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [statusFilter, categoryFilter, purityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.inventory.create(addForm);
      setIsAddModalOpen(false);
      fetchItems();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to add jewellery item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this unsold jewellery item from stock?')) return;
    try {
      await api.inventory.delete(id);
      fetchItems();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Cannot delete item that has transaction history.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2">
            <Gem className="w-5 h-5 text-amber-400" />
            Showroom Inventory & Barcode Tags
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time catalog of ornaments, Karat purities, weights, and BIS HUID registration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'in_stock', label: 'In Stock' },
            { id: 'sold', label: 'Sold' },
            { id: 'returned', label: 'Returned' },
            { id: 'all', label: 'All Items' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dropdowns & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.categoryName || c.name}</option>
            ))}
          </select>

          <select
            value={purityFilter}
            onChange={(e) => setPurityFilter(e.target.value ? Number(e.target.value) : '')}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
          >
            <option value="">All Purities</option>
            {purities?.map((p) => (
              <option key={p.id} value={p.id}>{p.karatCode} ({p.purityPercentage}%)</option>
            ))}
          </select>

          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tag code or HUID..."
              className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none w-44 font-mono"
            />
          </form>

          <button
            onClick={fetchItems}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 cursor-pointer"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card variant="glass" className="p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Scanning showroom stock..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono bg-slate-950/60">
                  <th className="p-3.5">Tag Code</th>
                  <th className="p-3.5">Ornament Name & Category</th>
                  <th className="p-3.5 text-center">Purity</th>
                  <th className="p-3.5">HUID</th>
                  <th className="p-3.5 text-right">Gross Wt</th>
                  <th className="p-3.5 text-right">Stone Wt</th>
                  <th className="p-3.5 text-right">Net Gold Wt</th>
                  <th className="p-3.5 text-right">Cost Price</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                      <Sparkles className="w-6 h-6 text-amber-500/30 mx-auto mb-2" />
                      No jewellery items found for this filter.
                    </td>
                  </tr>
                ) : (
                  items.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3.5 font-bold text-amber-400 font-mono">{it.tag_code || it.tagCode}</td>
                      <td className="p-3.5 font-sans">
                        <div className="font-semibold text-slate-100">{it.name || it.itemName}</div>
                        <div className="text-[10px] text-slate-400">{it.category?.name || it.category?.categoryName || 'Jewellery'}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge variant="gold" size="sm">
                          {it.purity?.karatCode || '22K'}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 font-mono">
                          {it.huid || '—'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-slate-200 font-semibold">{formatWeight(it.gross_weight ?? it.grossWeight)}</td>
                      <td className="p-3.5 text-right text-slate-400">{formatWeight(it.stone_weight ?? it.stoneWeight)}</td>
                      <td className="p-3.5 text-right font-bold text-amber-300">{formatWeight(it.net_weight ?? it.netGoldWeight)}</td>
                      <td className="p-3.5 text-right text-slate-300">
                        {(it.purchase_cost ?? it.purchaseCost) ? formatCurrency(it.purchase_cost ?? it.purchaseCost) : '—'}
                      </td>
                      <td className="p-3.5 text-center font-sans">
                        <Badge
                          variant={
                            it.status === 'in_stock'
                              ? 'emerald'
                              : it.status === 'sold'
                              ? 'blue'
                              : 'ruby'
                          }
                          size="sm"
                        >
                          {it.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPrintTagItem(it)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                            title="Print Barcode Tag Sticker"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {it.status === 'in_stock' && (
                            <button
                              onClick={() => handleDeleteItem(it.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Jewellery Piece"
        subtitle="Catalog finished ornament with gross weight, stone value & HUID"
        maxWidth="lg"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Ornament Title / Name</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g. 22K Traditional Bridal Choker Necklace"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Category</label>
              <select
                value={addForm.category_id}
                onChange={(e) => setAddForm({ ...addForm, category_id: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              >
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.categoryName || c.name} ({c.categoryCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Purity Karat</label>
              <select
                value={addForm.purity_id}
                onChange={(e) => setAddForm({ ...addForm, purity_id: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              >
                {purities?.map((p) => (
                  <option key={p.id} value={p.id}>{p.karatName} ({p.karatCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Gross Weight (g)</label>
              <input
                type="number"
                step="0.001"
                value={addForm.gross_weight}
                onChange={(e) => setAddForm({ ...addForm, gross_weight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stone Weight (g)</label>
              <input
                type="number"
                step="0.001"
                value={addForm.stone_weight}
                onChange={(e) => setAddForm({ ...addForm, stone_weight: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Stone Value (₹)</label>
              <input
                type="number"
                value={addForm.stone_value}
                onChange={(e) => setAddForm({ ...addForm, stone_value: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">BIS HUID Code</label>
              <input
                type="text"
                value={addForm.huid || ''}
                onChange={(e) => setAddForm({ ...addForm, huid: e.target.value.toUpperCase() })}
                placeholder="e.g. HM-2610-A1"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Estimated Purchase Cost (₹)</label>
              <input
                type="number"
                value={addForm.purchase_cost}
                onChange={(e) => setAddForm({ ...addForm, purchase_cost: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              {isSubmitting ? 'Saving...' : 'Catalog Item & Generate Tag'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Barcode Tag Print Modal */}
      {printTagItem && (
        <Modal
          isOpen={Boolean(printTagItem)}
          onClose={() => setPrintTagItem(null)}
          title={`Barcode Tag Sticker: ${printTagItem.tag_code || printTagItem.tagCode}`}
          subtitle="Jewellery barbell tag sticker format"
          maxWidth="md"
        >
          <BarcodeTagPrint item={printTagItem} />
        </Modal>
      )}
    </div>
  );
};
