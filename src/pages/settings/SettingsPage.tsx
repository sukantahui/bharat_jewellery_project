import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { BusinessProfile, UpdateBusinessProfilePayload, BackupItem } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Settings, Database, Store, Download, Trash2, CheckCircle2, ShieldCheck, RefreshCw, FileCode, Landmark, Coins, Sparkles, Gem, BookOpen } from 'lucide-react';
import { COMPANY_DETAILS, getCompanyDetails } from '../../config/company';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'backups'>('profile');

  // Business Profile Form
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [profileForm, setProfileForm] = useState<UpdateBusinessProfilePayload>({
    business_name: COMPANY_DETAILS.name,
    tagline: COMPANY_DETAILS.tagline,
    address: COMPANY_DETAILS.address,
    phone: COMPANY_DETAILS.phone,
    email: COMPANY_DETAILS.email,
    website: COMPANY_DETAILS.website,
    gstin: COMPANY_DETAILS.gstin,
    pan: COMPANY_DETAILS.pan,
    state: COMPANY_DETAILS.state,
    state_code: COMPANY_DETAILS.stateCode,
    bank_name: COMPANY_DETAILS.bankName,
    bank_account_number: COMPANY_DETAILS.bankAccountNumber,
    bank_ifsc: COMPANY_DETAILS.bankIfsc,
    bank_branch: COMPANY_DETAILS.bankBranch,
    upi_id: COMPANY_DETAILS.upiId,
    traded_metals: COMPANY_DETAILS.tradedMetals,
    tradedMetals: COMPANY_DETAILS.tradedMetals,
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Backups
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchBackups();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.profile.get();
      if (data) {
        setProfile(data);
        const comp = getCompanyDetails(data);
        setProfileForm({
          business_name: comp.name,
          tagline: comp.tagline,
          address: comp.address,
          phone: comp.phone,
          email: comp.email,
          website: comp.website,
          gstin: comp.gstin,
          pan: comp.pan,
          state: comp.state,
          state_code: comp.stateCode,
          bank_name: comp.bankName,
          bank_account_number: comp.bankAccountNumber,
          bank_ifsc: comp.bankIfsc,
          bank_branch: comp.bankBranch,
          upi_id: comp.upiId,
          traded_metals: comp.tradedMetals,
          tradedMetals: comp.tradedMetals,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const data = await api.backups.list();
      setBackups(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSavedMsg(false);
    try {
      const payload: UpdateBusinessProfilePayload = {
        ...profileForm,
        business_name: profileForm.business_name,
        company_name: profileForm.business_name,
        companyName: profileForm.business_name,
        pan: profileForm.pan,
        pan_number: profileForm.pan,
        panNumber: profileForm.pan,
        address: profileForm.address,
        address_line1: profileForm.address,
        addressLine1: profileForm.address,
        state_code: Number(profileForm.state_code) || 19,
        stateCode: Number(profileForm.state_code) || 19,
      };
      const updated = await api.profile.update(payload);
      setProfile(updated);
      const comp = getCompanyDetails(updated);
      setProfileForm({
        business_name: comp.name,
        tagline: comp.tagline,
        address: comp.address,
        phone: comp.phone,
        email: comp.email,
        website: comp.website,
        gstin: comp.gstin,
        pan: comp.pan,
        state: comp.state,
        state_code: comp.stateCode,
        bank_name: comp.bankName,
        bank_account_number: comp.bankAccountNumber,
        bank_ifsc: comp.bankIfsc,
        bank_branch: comp.bankBranch,
        upi_id: comp.upiId,
        traded_metals: comp.tradedMetals,
        tradedMetals: comp.tradedMetals,
      });
      setProfileSavedMsg(true);
      setTimeout(() => setProfileSavedMsg(false), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update business profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      await api.backups.create();
      fetchBackups();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to trigger backup.');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete backup file ${filename}?`)) return;
    try {
      await api.backups.delete(filename);
      fetchBackups();
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete backup file.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-cinzel text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Business Profile & System Settings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure enterprise brand headers, GSTIN credentials, bank accounts, and automated database backups.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs max-w-sm">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'profile'
              ? 'bg-amber-500 text-slate-950 shadow font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Business Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            activeTab === 'backups'
              ? 'bg-amber-500 text-slate-950 shadow font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Backups</span>
        </button>
      </div>

      {activeTab === 'profile' ? (
        /* Profile Form */
        <Card variant="glass" className="space-y-6">
          {/* User Manual Documentation Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 font-cinzel">Software Documentation & User Manual</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Learn complete operations: POS billing, old gold melt calculations, Rule 114B PAN rules, and GST reporting.
                </p>
              </div>
            </div>
            <a
              href="/user-manual.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>Launch Interactive Guide</span>
            </a>
          </div>

          {/* Config file notice */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Central Configuration File:</strong> You can maintain and update all default company details (Showroom Name, Phone, Email, Address, GSTIN, Bank & Invoice Terms) directly in <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-200 font-mono text-[11px] border border-amber-500/30">src/config/company.ts</code>.
              </span>
            </div>
          </div>

          {profileSavedMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Business profile updated successfully! Invoice headers and receipts updated.</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Store Identity */}
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-cinzel mb-3 flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-400" />
                Store Brand & Contact Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Company / Showroom Name</label>
                  <input
                    type="text"
                    value={profileForm.business_name}
                    onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Brand Tagline</label>
                  <input
                    type="text"
                    value={profileForm.tagline || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Showroom Full Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Primary Phone / Mobile</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={profileForm.email || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Precious Metals Scope Settings */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 font-cinzel mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Precious Metals Traded Scope (Gold / Silver / Both)
                </span>
                <span className="text-[11px] font-sans font-normal text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                  Central Config: <code className="font-mono text-amber-400">src/config/company.ts</code>
                </span>
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Select whether your organisation sells and buys Gold items only, Silver items only, or both precious metals. This setting controls the live board rates ticker, POS catalog filters, and purchase entries.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Gold Only */}
                <button
                  type="button"
                  onClick={() => setProfileForm({ ...profileForm, traded_metals: 'gold', tradedMetals: 'gold' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    (profileForm.traded_metals === 'gold' || profileForm.tradedMetals === 'gold')
                      ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Gold Only
                    </span>
                    {(profileForm.traded_metals === 'gold' || profileForm.tradedMetals === 'gold') && (
                      <span className="text-[9px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Showroom deals exclusively in Gold jewellery (24K bullion, 22K 916 Hallmark, 18K ornaments).
                  </p>
                </button>

                {/* Silver Only */}
                <button
                  type="button"
                  onClick={() => setProfileForm({ ...profileForm, traded_metals: 'silver', tradedMetals: 'silver' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    (profileForm.traded_metals === 'silver' || profileForm.tradedMetals === 'silver')
                      ? 'bg-slate-700/30 border-slate-300 shadow-lg shadow-slate-500/10 ring-1 ring-slate-300'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-slate-200 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-slate-300" /> Silver Only
                    </span>
                    {(profileForm.traded_metals === 'silver' || profileForm.tradedMetals === 'silver') && (
                      <span className="text-[9px] bg-slate-200 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Showroom deals exclusively in Fine Silver articles, silverware, ornaments, and 999 bullion.
                  </p>
                </button>

                {/* Both Gold & Silver */}
                <button
                  type="button"
                  onClick={() => setProfileForm({ ...profileForm, traded_metals: 'both', tradedMetals: 'both' })}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    (!profileForm.traded_metals || profileForm.traded_metals === 'both' || profileForm.tradedMetals === 'both')
                      ? 'bg-gradient-to-br from-amber-500/15 via-slate-800/40 to-slate-900 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-amber-200 flex items-center gap-1.5">
                      <Gem className="w-4 h-4 text-amber-300" /> Both Gold & Silver
                    </span>
                    {(!profileForm.traded_metals || profileForm.traded_metals === 'both' || profileForm.tradedMetals === 'both') && (
                      <span className="text-[9px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Comprehensive bullion merchant trading in both 22K/24K Gold ornaments and 999 Fine Silver.
                  </p>
                </button>
              </div>
            </div>

            {/* GST & Tax Registration */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 font-cinzel mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                GSTIN & State Jurisdiction
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">GSTIN (15-characters)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={profileForm.gstin}
                    onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs uppercase font-mono text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">State Jurisdiction</label>
                  <input
                    type="text"
                    value={profileForm.state}
                    onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">GST State Code</label>
                  <input
                    type="text"
                    value={profileForm.state_code}
                    onChange={(e) => setProfileForm({ ...profileForm, state_code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Settlement Bank Accounts */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 font-cinzel mb-3 flex items-center justify-between">
                <span>Invoice Settlement Bank & UPI Account</span>
                <span className="text-[11px] font-sans font-normal text-amber-400/90 flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5" />
                  {COMPANY_DETAILS.banks?.length || 0} Commercial Banks Configured
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Primary Bank Name</label>
                  <input
                    type="text"
                    value={profileForm.bank_name || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, bank_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={profileForm.bank_account_number || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, bank_account_number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={profileForm.bank_ifsc || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, bank_ifsc: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">UPI ID for Invoices</label>
                  <input
                    type="text"
                    value={profileForm.upi_id || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, upi_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Multi-bank Accounts Directory */}
              {COMPANY_DETAILS.banks && COMPANY_DETAILS.banks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-semibold text-slate-300">
                      All Configured Settlement Banks (Central Config: <code className="text-amber-400 text-[11px]">src/config/company.ts</code>)
                    </span>
                    <span className="text-[10px] text-slate-500">Auto-synchronized with A4 Tax Invoices</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {COMPANY_DETAILS.banks.map((bank, index) => (
                      <div
                        key={bank.id || index}
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          bank.isPrimary
                            ? 'bg-amber-500/10 border-amber-500/40 text-slate-200 shadow-sm shadow-amber-500/10'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <div className="font-bold text-slate-100 leading-tight">
                            {bank.bankName}
                          </div>
                          {bank.isPrimary ? (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                              Primary
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              #{index + 1}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mb-2 truncate" title={bank.bankBranch}>
                          {bank.bankBranch}
                        </div>
                        <div className="space-y-1 font-mono text-[11px] bg-slate-900/80 p-2 rounded-lg border border-slate-800/60">
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-sans text-[10px]">A/C No:</span>
                            <span className="font-semibold text-slate-200">{bank.bankAccountNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-sans text-[10px]">IFSC:</span>
                            <span className="text-amber-300/90">{bank.bankIfsc}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500 font-sans text-[10px]">Type:</span>
                            <span className="text-slate-300 text-[10px] font-sans">{bank.bankAccountType}</span>
                          </div>
                          {bank.upiId && (
                            <div className="flex justify-between pt-1 border-t border-slate-800">
                              <span className="text-slate-500 font-sans text-[10px]">UPI:</span>
                              <span className="text-emerald-400 text-[10px]">{bank.upiId}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Business Profile'}
              </button>
            </div>
          </form>
        </Card>
      ) : (
        /* Database Backups Tab */
        <Card
          variant="glass"
          title="Automated & On-Demand Database Backups"
          subtitle="One-click full MySQL database dumps for safe disaster recovery"
          action={
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{creatingBackup ? 'Creating Dump...' : 'Trigger Full Backup Now'}</span>
            </button>
          }
        >
          {loadingBackups ? (
            <LoadingSpinner message="Scanning backup snapshots..." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="pb-2">Snapshot Filename</th>
                    <th className="pb-2">Created Date</th>
                    <th className="pb-2 text-right">File Size</th>
                    <th className="pb-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">
                        No manual backups created yet. Click "Trigger Full Backup Now" above.
                      </td>
                    </tr>
                  ) : (
                    backups.map((b) => (
                      <tr key={b.filename} className="hover:bg-slate-800/30">
                        <td className="py-2.5 font-bold text-slate-200">{b.filename}</td>
                        <td className="py-2.5 text-slate-400">{formatDate(b.created_at)}</td>
                        <td className="py-2.5 text-right text-amber-300 font-semibold">{b.size}</td>
                        <td className="py-2.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <a
                              href={api.backups.downloadUrl(b.filename)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer"
                              title="Download SQL File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteBackup(b.filename)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer"
                              title="Delete Snapshot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      )}
    </div>
  );
};
