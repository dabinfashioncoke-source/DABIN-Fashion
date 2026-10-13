import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  BarChart3,
  Settings,
  LogOut,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Globe,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DabinLogo } from '../common/DabinLogo';
import { UserRole } from '../../types';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab }) => {
  const {
    language,
    setLanguage,
    currency,
    setCurrency,
    t,
    currentUser,
    setCurrentUser,
    navigateTo,
  } = useApp();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Strictly require authenticated DABIN Staff account
  if (!currentUser || currentUser.email?.trim().toLowerCase() !== 'dabin.fashion.co.ke@gmail.com') {
    return (
      <div className="min-h-screen bg-[#F4F4F7] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center max-w-sm space-y-4 shadow-xl">
          <ShieldCheck className="w-12 h-12 text-[#7B173B] mx-auto" />
          <h2 className="font-serif-brand text-xl font-bold">
            {language === 'fr' ? 'Personnel DABIN — Accès Restreint' : 'DABIN Staff — Access Restricted'}
          </h2>
          <p className="text-xs text-gray-500">
            {language === 'fr'
              ? 'Portail réservé exclusivement au personnel DABIN autorisé. Veuillez vous connecter.'
              : 'Portal restricted exclusively to authorized DABIN Staff. Please sign in.'}
          </p>
          <button
            type="button"
            onClick={() => navigateTo('/login')}
            className="w-full py-2.5 bg-[#7B173B] text-white text-xs font-semibold rounded-xl"
          >
            {language === 'fr' ? 'Connexion Personnel DABIN' : 'Sign In as DABIN Staff'}
          </button>
        </div>
      </div>
    );
  }

  const roleLabels: Record<UserRole, string> = {
    owner: t.admin.roleOwner,
    admin: t.admin.roleAdmin,
    cashier: t.admin.roleCashier,
  };

  const navItems = [
    {
      id: 'dashboard',
      label: language === 'fr' ? 'Personnel DABIN' : 'DABIN Staff',
      icon: LayoutDashboard,
      route: '/admin',
      allowedRoles: ['owner', 'admin', 'cashier'],
    },
    {
      id: 'pos',
      label: t.admin.pos,
      icon: ShoppingCart,
      route: '/admin/pos',
      allowedRoles: ['owner', 'admin', 'cashier'],
    },
    {
      id: 'products',
      label: t.admin.products,
      icon: Package,
      route: '/admin/products',
      allowedRoles: ['owner', 'admin', 'cashier'],
    },
    {
      id: 'crm',
      label: t.admin.crm,
      icon: Users,
      route: '/admin/crm',
      allowedRoles: ['owner', 'admin', 'cashier'],
    },
    {
      id: 'documents',
      label: t.admin.documents,
      icon: FileText,
      route: '/admin/documents',
      allowedRoles: ['owner', 'admin', 'cashier'],
    },
    {
      id: 'intake',
      label: t.admin.stockIntake,
      icon: Truck,
      route: '/admin/intake',
      allowedRoles: ['owner', 'admin'],
    },
    {
      id: 'reports',
      label: t.admin.reports,
      icon: BarChart3,
      route: '/admin/reports',
      allowedRoles: ['owner', 'admin'],
    },
    {
      id: 'settings',
      label: t.admin.cmsSettings,
      icon: Settings,
      route: '/admin/settings',
      allowedRoles: ['owner'],
    },
  ];

  const handleSignOut = () => {
    setCurrentUser(null);
    navigateTo('/');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F7] flex flex-col lg:flex-row text-[#171719]">
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <DabinLogo size="xs" sloganLanguage={language} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold bg-[#7B173B]/10 text-[#7B173B] px-2 py-0.5 rounded-full">
            {roleLabels[currentUser.role]}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="p-1.5 text-gray-500 hover:text-red-600 rounded-md"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sidebar Desktop & Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#171719] text-white flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:sticky top-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Logo Card Header */}
          <div className="p-5 border-b border-[#2B2B32]">
            <div className="bg-white p-2.5 rounded-xl shadow-xs">
              <DabinLogo size="sm" sloganLanguage={language} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
              <span className="text-gray-300 font-semibold">{currentUser.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#7B173B] text-white font-medium text-[10px]">
                {roleLabels[currentUser.role]}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 flex-1">
            {navItems.map((item) => {
              const isAllowed = item.allowedRoles.includes(currentUser.role);
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              if (!isAllowed) return null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigateTo(item.route);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#7B173B] text-white font-semibold shadow-xs'
                      : 'text-gray-300 hover:bg-[#25252C] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-[#26262D] space-y-3 bg-[#111113]">
          {/* Quick Language & Currency Switchers */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                  language === 'en' ? 'bg-[#7B173B] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                  language === 'fr' ? 'bg-[#7B173B] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                FR
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrency('KES')}
                className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                  currency === 'KES' ? 'bg-[#7B173B] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                KES
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2 py-0.5 text-[10px] rounded font-bold ${
                  currency === 'USD' ? 'bg-[#7B173B] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                USD
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{language === 'fr' ? 'Site public' : 'Public Store'}</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="text-[11px] text-gray-400 hover:text-red-400 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>{t.admin.signOutBtn}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Workspace Top Bar (Desktop) */}
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-gray-200 px-8 py-3.5 sticky top-0 z-20">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-[#171719] uppercase tracking-wider text-[11px]">
              DABIN Fashion Staff Portal
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">Nairobi, Kenya Hub</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">{currentUser.name}</span>
              <span className="px-2 py-0.5 bg-[#7B173B]/10 text-[#7B173B] rounded-full font-bold text-[10px]">
                {roleLabels[currentUser.role]}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="inline-flex items-center gap-1 text-gray-600 hover:text-[#7B173B] text-xs font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Voir la boutique' : 'View Storefront'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
