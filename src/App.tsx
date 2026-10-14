import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ShopCatalogPage } from './pages/ShopCatalogPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AboutPage } from './pages/AboutPage';
import { DestinationsPage } from './pages/DestinationsPage';
import { ContactPage } from './pages/ContactPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardOverview } from './pages/admin/AdminDashboardOverview';
import { AdminPosPage } from './pages/admin/AdminPosPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminCrmPage } from './pages/admin/AdminCrmPage';
import { AdminInventoryIntakePage } from './pages/admin/AdminInventoryIntakePage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminDocumentsPage } from './pages/admin/AdminDocumentsPage';
import { AdminFinancePage } from './pages/admin/AdminFinancePage';

const AppRouter: React.FC = () => {
  const { currentRoute, settings, language, currentUser } = useApp();

  // If maintenance mode is active and not on admin routes
  if (settings.maintenanceMode && !currentRoute.startsWith('/admin') && currentRoute !== '/login') {
    return (
      <div className="min-h-screen bg-[#171719] text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="font-serif-brand text-3xl font-bold text-[#D4AF37]">
            DABIN Fashion
          </h1>
          <p className="text-sm text-gray-300">
            {language === 'fr'
              ? 'Notre boutique en ligne est actuellement en maintenance programmée. Pour toute commande ou question, veuillez nous contacter directement sur WhatsApp.'
              : 'Our boutique is currently undergoing scheduled maintenance. For immediate orders or inquiries, please reach us on WhatsApp.'}
          </p>
          <a
            href="https://wa.me/254181740330"
            className="inline-block py-2.5 px-6 bg-[#25D366] text-white text-xs font-semibold rounded-xl"
          >
            +254 181 740 330 (WhatsApp)
          </a>
        </div>
      </div>
    );
  }

  // Admin Routes (strictly guarded: only accessible via dabin.fashion.co.ke@gmail.com / Dabinfashion.77)
  if (currentRoute.startsWith('/admin')) {
    if (!currentUser || currentUser.email?.trim().toLowerCase() !== 'dabin.fashion.co.ke@gmail.com') {
      return (
        <div className="min-h-screen flex flex-col bg-[#F8F8FA] text-[#171719]">
          <Navbar />
          <main className="flex-1">
            <AdminLoginPage />
          </main>
          <Footer />
        </div>
      );
    }
  }

  if (currentRoute === '/admin') {
    return <AdminDashboardOverview />;
  }
  if (currentRoute === '/admin/pos') {
    return <AdminPosPage />;
  }
  if (currentRoute === '/admin/products') {
    return <AdminProductsPage />;
  }
  if (currentRoute === '/admin/crm') {
    return <AdminCrmPage />;
  }
  if (currentRoute === '/admin/documents') {
    return <AdminDocumentsPage />;
  }
  if (currentRoute === '/admin/finance') {
    return <AdminFinancePage />;
  }
  if (currentRoute === '/admin/intake') {
    return <AdminInventoryIntakePage />;
  }
  if (currentRoute === '/admin/reports') {
    return <AdminReportsPage />;
  }
  if (currentRoute === '/admin/settings') {
    return <AdminSettingsPage />;
  }

  // Public Routes (rendered with Navbar and Footer)
  const renderPublicPage = () => {
    if (currentRoute.startsWith('/shop')) {
      return <ShopCatalogPage />;
    }
    if (currentRoute === '/categories') {
      return <CategoriesPage />;
    }
    if (currentRoute === '/about') {
      return <AboutPage />;
    }
    if (currentRoute === '/destinations') {
      return <DestinationsPage />;
    }
    if (currentRoute === '/contact') {
      return <ContactPage />;
    }
    if (currentRoute === '/login') {
      return <AdminLoginPage />;
    }
    return <HomePage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F8FA] text-[#171719]">
      <Navbar />
      <main className="flex-1">{renderPublicPage()}</main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
