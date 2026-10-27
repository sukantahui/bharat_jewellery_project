import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { JewelleryCategory } from '../../types';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Tags,
  Plus,
  Search,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  FileCode,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CategoryFormData {
  category_name: string;
  category_code: string;
  default_hsn_code: string;
  description: string;
}

const DEFAULT_PRESETS = [
  { name: 'Bridal Necklace', code: 'B-NCK', hsn: '7113', desc: 'Heavy bridal choker and necklace sets' },
  { name: 'Solitaire Diamond Ring', code: 'SOL-RNG', hsn: '7113', desc: 'Certified single stone diamond rings' },
  { name: 'Antique Temple Jewellery', code: 'TMP-JWL', hsn: '7113', desc: 'Traditional south Indian nakshi work' },
  { name: 'Italian Hollow Bangle', code: 'ITL-BNG', hsn: '7113', desc: 'Lightweight hollow Italian bangles' },
  { name: 'Platinum Bands', code: 'PLT-BND', hsn: '7113', desc: '950 Platinum couple wedding bands' },
  { name: 'Nose Pin & Nath', code: 'NPN', hsn: '7113', desc: 'Gold and diamond studded nose pins' },
  { name: 'Silver Utensils & Diya', code: 'SLV-UTN', hsn: '7114', desc: 'Pooja silverware and dinner sets' },
];

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<JewelleryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<JewelleryCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    category_name: '',
    category_code: '',
    default_hsn_code: '7113',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.masters.getCategories();
      setCategories(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      category_name: '',
      category_code: '',
      default_hsn_code: '7113',
      description: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: JewelleryCategory) => {
    setEditingCategory(cat);
    setFormData({
      category_name: cat.categoryName || cat.name || '',
      category_code: cat.categoryCode || '',
      default_hsn_code: cat.defaultHsnCode || '7113',
      description: cat.description || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof DEFAULT_PRESETS[0]) => {
    setFormData({
      category_name: preset.name,
      category_code: preset.code,
      default_hsn_code: preset.hsn,
      description: preset.desc,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingCategory) {
        await api.masters.updateCategory(editingCategory.id, {
          category_name: formData.category_name,
          category_code: formData.category_code.toUpperCase(),
          default_hsn_code: formData.default_hsn_code,
          description: formData.description,
        });
      } else {
        await api.masters.createCategory({
          category_name: formData.category_name,
          category_code: formData.category_code.toUpperCase(),
          default_hsn_code: formData.default_hsn_code,
          description: formData.description,
        });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setFormError(err.response?.data?.message || 'Failed to save jewellery category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"? Existing inventory items linked to this category should be reassigned first.`)) {
      return;
    }

    try {
      await api.masters.deleteCategory(id);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  // Filtered categories
  const filtered = categories.filter((c) => {
    const name = (c.categoryName || c.name || '').toLowerCase();
    const code = (c.categoryCode || '').toLowerCase();
    const hsn = (c.defaultHsnCode || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || code.includes(q) || hsn.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2">
            <Tags className="w-5 h-5 text-amber-400" />
            Jewellery Categories Master
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Define showroom item categories, barcode tag prefixes, and statutory HSN tax codes (7113 / 7108).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Filter and Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass" className="sm:col-span-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search category name, tag code (e.g. RNG, BNG), or HSN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>
        </Card>

        <Card variant="glass" className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Active Categories</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {categories.length} Types
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
        </Card>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <LoadingSpinner message="Loading showroom categories..." />
      ) : filtered.length === 0 ? (
        <Card variant="glass" className="text-center py-12">
          <Tags className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No Categories Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'No categories match your search term.' : 'Click "New Category" to set up your showroom inventory classification.'}
          </p>
          {!search && (
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Add First Category
            </button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 font-mono font-bold text-xs text-amber-300">
                      {cat.categoryCode}
                    </span>
                    <Badge variant={cat.isActive ? 'emerald' : 'ruby'} size="sm">
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.categoryName || cat.name || '')}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-100 mt-2.5 font-sans">
                  {cat.categoryName || cat.name}
                </h3>

                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 min-h-[32px]">
                  {cat.description || 'Standard showroom item classification.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  HSN: <strong className="text-slate-100">{cat.defaultHsnCode || '7113'}</strong>
                </span>
                <span className="text-slate-500 text-[10px]">ID: #{cat.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Jewellery Category'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          {!editingCategory && (
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Quick Preset Suggestions (1-Click Fill)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_PRESETS.map((preset) => (
                  <button
                    key={preset.code}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="text-[10px] font-sans px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition-colors cursor-pointer"
                  >
                    {preset.name} ({preset.code})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Category Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Bridal Necklace, Mangalsutra, Finger Ring"
              value={formData.category_name}
              onChange={(e) => {
                const name = e.target.value;
                // Auto generate code if empty or creating
                let code = formData.category_code;
                if (!editingCategory && (!code || code.length <= 4)) {
                  code = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase();
                }
                setFormData({ ...formData, category_name: name, category_code: code });
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Category Code (Tag Prefix) <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={10}
                placeholder="e.g. RNG, NCK"
                value={formData.category_code}
                onChange={(e) => setFormData({ ...formData, category_code: e.target.value.toUpperCase() })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono uppercase focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Used on barcode tags & labels</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Default HSN Code <span className="text-amber-400">*</span>
              </label>
              <select
                value={formData.default_hsn_code}
                onChange={(e) => setFormData({ ...formData, default_hsn_code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="7113">7113 - Gold/Silver Jewellery</option>
                <option value="7108">7108 - Gold Bullion / Coins</option>
                <option value="7106">7106 - Silver Bullion / Bars</option>
                <option value="7114">7114 - Silver Articles / Utensils</option>
                <option value="7118">7118 - Legal Tender Coins</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Machine-made plain gold chains, 22K 916 hallmarked..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
