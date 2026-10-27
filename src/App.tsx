import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './pages/auth/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PosBillingPage } from './pages/pos/PosBillingPage';
import { InvoiceListPage } from './pages/pos/InvoiceListPage';
import { SalesReturnListPage } from './pages/returns/SalesReturnListPage';
import { InventoryListPage } from './pages/inventory/InventoryListPage';
import { CategoriesPage } from './pages/masters/CategoriesPage';
import { DailyRatesPage } from './pages/masters/DailyRatesPage';
import { StockEntryPage } from './pages/stock-entry/StockEntryPage';
import { PurchaseListPage } from './pages/purchases/PurchaseListPage';
import { PartiesPage } from './pages/parties/PartiesPage';
import { CashDrawerPage } from './pages/accounts/CashDrawerPage';
import { ExpenseIncomePage } from './pages/expenses/ExpenseIncomePage';
import { GstReportsPage } from './pages/gst/GstReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { PosTerminalsPage } from './pages/terminals/PosTerminalsPage';
import { LoadingSpinner } from './components/common/LoadingSpinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
      retry: 1,
    },
  },
});

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, initAuth } = useAuthStore();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner message="Authenticating terminal session..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentTab} />;
      case 'pos':
        return <PosBillingPage />;
      case 'terminals':
        return <PosTerminalsPage onNavigate={setCurrentTab} />;
      case 'invoices':
        return <InvoiceListPage />;
      case 'returns':
        return <SalesReturnListPage />;
      case 'inventory':
        return <InventoryListPage />;
      case 'categories':
        return <CategoriesPage />;
      case 'rates':
        return <DailyRatesPage />;
      case 'stock-entries':
        return <StockEntryPage />;
      case 'purchases':
        return <PurchaseListPage />;
      case 'parties':
        return <PartiesPage />;
      case 'accounts':
        return <CashDrawerPage />;
      case 'expenses':
        return <ExpenseIncomePage />;
      case 'gst':
        return <GstReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'manual':
        window.open('/user-manual.html', '_blank');
        return <DashboardPage onNavigate={setCurrentTab} />;
      default:
        return <DashboardPage onNavigate={setCurrentTab} />;
    }
  };

  return (
    <AppLayout currentTab={currentTab} onNavigate={setCurrentTab}>
      {renderContent()}
    </AppLayout>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
