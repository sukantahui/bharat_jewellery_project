import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Gem,
  TrendingUp,
  PackagePlus,
  Truck,
  Users,
  Wallet,
  Coins,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Tags,
  BookOpen,
  Monitor,
} from 'lucide-react';
import { COMPANY_DETAILS, isGoldEnabled, isSilverEnabled } from '../../config/company';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
}) => {
  const dealsInGold = isGoldEnabled(COMPANY_DETAILS);
  const dealsInSilver = isSilverEnabled(COMPANY_DETAILS);
  const ratesLabel =
    dealsInGold && dealsInSilver
      ? 'Daily Bullion Rates'
      : dealsInSilver
      ? 'Daily Silver Rates'
      : 'Daily Gold Rates';

  const navGroups: NavGroup[] = [
    {
      group: 'Core POS & Sales',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pos', label: 'POS Billing Terminal', icon: ShoppingCart, badge: 'F2' },
        { id: 'terminals', label: 'POS Terminals & Branches', icon: Monitor, badge: 'MULTI' },
        { id: 'invoices', label: 'Sales Invoices', icon: Receipt },
        { id: 'returns', label: 'Sales Returns & CRN', icon: RotateCcw },
      ],
    },
    {
      group: 'Showroom & Workshop',
      items: [
        { id: 'inventory', label: 'Inventory & Tags', icon: Gem },
        { id: 'purchases', label: 'Purchase Entry', icon: Truck, badge: 'PUR' },
        { id: 'stock-entries', label: 'Karigar Inward', icon: PackagePlus },
        { id: 'rates', label: ratesLabel, icon: TrendingUp },
        { id: 'categories', label: 'Categories Master', icon: Tags },
      ],
    },
    {
      group: 'Parties & CRM',
      items: [
        { id: 'parties', label: 'Customers & Parties', icon: Users },
      ],
    },
    {
      group: 'Accounts & GST',
      items: [
        { id: 'accounts', label: 'Cash Drawer & Ledger', icon: Wallet },
        { id: 'expenses', label: 'Operating Expenses', icon: Coins },
        { id: 'gst', label: 'GST Reports (GSTR)', icon: FileSpreadsheet },
      ],
    },
    {
      group: 'System & Help',
      items: [
        { id: 'settings', label: 'Settings & Backups', icon: Settings },
        { id: 'manual', label: 'User Manual & Guide', icon: BookOpen, badge: 'GUIDE' },
      ],
    },
  ];

  return (
    <aside
      className={`relative z-40 flex flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-300 no-print ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => onSelectTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0">
            <Gem className="w-5 h-5 text-slate-950" />
          </div>
          {!collapsed && (
            <div className="transition-opacity duration-200">
              <h1 className="font-cinzel font-bold text-sm text-slate-100 tracking-wider flex items-center gap-1.5 leading-none uppercase truncate max-w-[130px]" title={COMPANY_DETAILS.name}>
                {COMPANY_DETAILS.shortName}
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              </h1>
              <span className="text-[10px] text-amber-400/80 uppercase font-mono tracking-widest leading-none mt-1 block truncate">
                JEWELLERY ERP
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] uppercase font-bold text-slate-400/90 tracking-wider">
                {group.group}
              </div>
            )}
            <div className="space-y-1 pt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'manual') {
                        window.open('/user-manual.html', '_blank');
                      } else {
                        onSelectTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.12)] font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400/80'
                      }`}
                    />
                    {!collapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800/80 text-[10px] text-slate-400 text-center font-mono">
          <div className="text-amber-400/80 font-semibold">BIS 916 Compliant</div>
          <div className="text-slate-400">v1.2.0 • HSN 7113</div>
        </div>
      )}
    </aside>
  );
};
