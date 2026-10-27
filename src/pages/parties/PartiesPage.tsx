import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Party, StorePartyPayload, PartyType } from '../../types';
import { formatCurrency, formatWeight } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Users, Plus, Search, Trash2, Phone, MapPin, RefreshCw } from 'lucide-react';

export const PartiesPage: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PartyType>('customer');
  const [search, setSearch] = useState('');

  // Add Party Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<StorePartyPayload>({
    name: '',
    party_type: 'customer',
    mobile: '',
    email: '',
    gstin: '',
    pan: '',
    address: '',
    city: 'Kolkata',
    state: 'West Bengal',
    state_code: 19,
    opening_balance: 0,
    opening_metal_balance_grams: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const res = await api.parties.list({ type: activeTab, search: search.trim() || undefined });
      setParties(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchParties();
  };

  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.parties.create({ ...form, party_type: activeTab });
      setIsModalOpen(false);
      setForm({
        name: '',
        party_type: activeTab,
        mobile: '',
        email: '',
        gstin: '',
        pan: '',
        address: '',
        city: 'Kolkata',
        state: 'West Bengal',
        state_code: 19,
        opening_balance: 0,
        opening_metal_balance_grams: 0,
      });
      fetchParties();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create party.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteParty = async (id: number) => {
    if (!confirm('Are you sure you want to remove this party from registry?')) return;
    try {
      await api.parties.delete(id);
      fetchParties();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Cannot delete party that has transaction history.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Parties CRM & Metal Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage customers, bullion vendors, and workshop karigars with cash & metal balances.
          </p>
        </div>

        <button
          onClick={() => {
            setForm({ ...form, party_type: activeTab });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New {activeTab === 'customer' ? 'Customer' : activeTab === 'vendor' ? 'Vendor' : 'Karigar'}</span>
        </button>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Type Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          {[
            { id: 'customer', label: 'Customers' },
            { id: 'vendor', label: 'Bullion Vendors' },
            { id: 'karigar', label: 'Karigars (Artisans)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as PartyType)}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, PAN..."
            className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none w-60"
          />
        </form>
      </div>

      {/* Parties Table */}
      <Card variant="glass" className="p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner message={`Loading ${activeTab} directory...`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-mono bg-slate-950/60">
                  <th className="p-3.5">Name & City</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">GSTIN & PAN</th>
                  <th className="p-3.5">State</th>
                  <th className="p-3.5 text-right">Cash Balance</th>
                  <th className="p-3.5 text-right">Gold Balance</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {parties.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                      No {activeTab}s registered yet. Click "Add New" above to register.
                    </td>
                  </tr>
                ) : (
                  parties.map((p) => {
                    const balance = parseFloat(String(p.current_balance || p.opening_balance || 0));
                    const metalBalance = parseFloat(String(p.current_metal_balance_grams || p.opening_metal_balance_grams || 0));
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3.5 font-sans">
                          <div className="font-bold text-slate-100 text-sm">{p.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-amber-400/80" />
                            {p.city || 'Kolkata'}, {p.state || 'West Bengal'}
                          </div>
                        </td>
                        <td className="p-3.5 font-sans">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Phone className="w-3 h-3 text-slate-500" />
                            {p.mobile || '—'}
                          </div>
                          {p.email && <div className="text-[10px] text-slate-500">{p.email}</div>}
                        </td>
                        <td className="p-3.5">
                          {p.gstin && (
                            <div className="text-amber-300 font-bold text-[11px]">
                              GST: {p.gstin}
                            </div>
                          )}
                          {p.pan && <div className="text-slate-400 text-[10px]">PAN: {p.pan}</div>}
                          {!p.gstin && !p.pan && <span className="text-slate-500 text-[10px]">Unregistered</span>}
                        </td>
                        <td className="p-3.5 text-slate-400 font-sans">
                          {p.state || 'West Bengal'} ({p.state_code || '19'})
                        </td>
                        <td className="p-3.5 text-right font-bold text-sm">
                          <span className={balance > 0 ? 'text-rose-400' : balance < 0 ? 'text-emerald-400' : 'text-slate-300'}>
                            {formatCurrency(balance)}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-bold text-amber-400">
                          {formatWeight(metalBalance)}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleDeleteParty(p.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                            title="Delete Party"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Party Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Register New ${activeTab === 'customer' ? 'Customer' : activeTab === 'vendor' ? 'Bullion Vendor' : 'Karigar'}`}
        subtitle="Record contact details, tax identifiers and opening balances"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateParty} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Full Name / Trade Entity</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Joydeb Gold Ornaments Works"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Mobile Number</label>
              <input
                type="text"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="9830000000"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Customer PAN (10-digits)</label>
              <input
                type="text"
                maxLength={10}
                value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs uppercase font-mono text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">GSTIN (if registered)</label>
              <input
                type="text"
                maxLength={15}
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                placeholder="19AAAAA0000A1Z5"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs uppercase font-mono text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">State & GST State Code</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Opening Cash Balance (₹)</label>
              <input
                type="number"
                value={form.opening_balance}
                onChange={(e) => setForm({ ...form, opening_balance: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Opening Gold Balance (grams)</label>
              <input
                type="number"
                step="0.001"
                value={form.opening_metal_balance_grams}
                onChange={(e) => setForm({ ...form, opening_metal_balance_grams: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
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
              {isSubmitting ? 'Registering...' : 'Register Party'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
