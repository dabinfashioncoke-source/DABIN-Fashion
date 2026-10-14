import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  FileText,
  Package,
  PlusCircle,
  Receipt,
  RotateCcw,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  ArrowDownUp,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { Sale } from '../../types';

export const AdminDashboardOverview: React.FC = () => {
  const { language, formatPrice, t, currentUser, navigateTo, currency } = useApp();

  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const products = storage.getProducts();
  const sales = storage.getSales();
  const customers = storage.getCustomers();
  const movements = storage.getInventoryMovements().slice(0, 8);

  // Real database metrics calculation
  const metrics = useMemo(() => {
    const activeProducts = products.filter(
      (p) => p.status === 'available' || p.status === 'low_stock'
    ).length;

    const totalStockUnits = products.reduce((acc, p) => acc + p.quantityOnHand, 0);
    const reservedUnits = products.reduce((acc, p) => acc + p.reservedQuantity, 0);

    const lowStockCount = products.filter(
      (p) =>
        p.status === 'low_stock' ||
        (p.quantityOnHand - p.reservedQuantity > 0 &&
          p.quantityOnHand - p.reservedQuantity <= p.lowStockThreshold)
    ).length;

    const outOfStockCount = products.filter(
      (p) =>
        p.status === 'out_of_stock' ||
        Math.max(0, p.quantityOnHand - p.reservedQuantity) === 0
    ).length;

    // Filter sales by date
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

    const validCompletedSales = sales.filter(
      (s) => s.paymentStatus !== 'refunded' && s.paymentStatus !== 'voided'
    );

    const todaySales = validCompletedSales.filter(
      (s) => new Date(s.timestamp).getTime() >= todayStart
    );
    const weekSales = validCompletedSales.filter(
      (s) => new Date(s.timestamp).getTime() >= weekStart
    );
    const monthSales = validCompletedSales.filter(
      (s) => new Date(s.timestamp).getTime() >= monthStart
    );

    // Sum revenue in selected display currency
    const totalRevenueDisplay = validCompletedSales.reduce((acc, s) => {
      const converted = storage.convertPrice(s.total, s.currency, currency);
      return acc + converted;
    }, 0);

    const todayRevenueDisplay = todaySales.reduce((acc, s) => {
      return acc + storage.convertPrice(s.total, s.currency, currency);
    }, 0);

    // Gross profit estimate (strictly based on recorded item acquisition costs)
    let grossProfitEstimate = 0;
    validCompletedSales.forEach((s) => {
      s.items.forEach((item) => {
        const itemCost = item.costPriceAtSale || 0;
        const itemProfit = item.totalPrice - itemCost * item.quantity;
        grossProfitEstimate += storage.convertPrice(itemProfit, item.currency, currency);
      });
    });

    const outstandingBalanceTotal = validCompletedSales.reduce((acc, s) => {
      return acc + storage.convertPrice(s.outstandingBalance, s.currency, currency);
    }, 0);

    return {
      activeProducts,
      totalStockUnits,
      reservedUnits,
      lowStockCount,
      outOfStockCount,
      todaySalesCount: todaySales.length,
      todayRevenueDisplay,
      weekSalesCount: weekSales.length,
      monthSalesCount: monthSales.length,
      totalRevenueDisplay,
      grossProfitEstimate,
      outstandingBalanceTotal,
      registeredCustomersCount: customers.length,
    };
  }, [products, sales, customers, currency]);

  return (
    <AdminLayout activeTab="dashboard">
      <div className="space-y-8">
        {/* Top Header & Fast Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {language === 'fr' ? 'Personnel DABIN' : 'DABIN Staff'}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fr'
                ? 'Indicateurs en temps réel calculés directement sur la base de données.'
                : 'Real-time database metrics, inventory counts, and sales audit.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => navigateTo('/admin/pos')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7B173B] hover:bg-[#62122F] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{language === 'fr' ? 'Nouvelle Vente (POS)' : 'New POS Sale'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/admin/products')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl"
            >
              <PlusCircle className="w-4 h-4 text-gray-500" />
              <span>{language === 'fr' ? 'Ajouter Produit' : 'Add Product'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/admin/crm')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl"
            >
              <Users className="w-4 h-4 text-gray-500" />
              <span>{language === 'fr' ? 'Nouveau Client' : 'New Customer'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/admin/documents')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl shadow-2xs"
            >
              <FileText className="w-4 h-4 text-[#7B173B]" />
              <span>{language === 'fr' ? 'Devis & Factures' : 'Quotations & Invoices'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/admin/finance')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl shadow-2xs"
            >
              <ArrowDownUp className="w-4 h-4 text-emerald-600" />
              <span>{language === 'fr' ? 'Revenus & Dépenses' : 'Income & Expenses'}</span>
            </button>
          </div>
        </div>

        {/* Primary Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {t.admin.totalRevenue}
              </span>
              <DollarSign className="w-4 h-4 text-[#7B173B]" />
            </div>
            <div className="text-2xl font-bold text-[#171719] tracking-tight">
              {storage.formatPrice(metrics.totalRevenueDisplay, currency)}
            </div>
            <div className="text-[11px] text-gray-500 flex items-center justify-between">
              <span>{language === 'fr' ? "Aujourd'hui :" : 'Today:'}</span>
              <span className="font-semibold text-emerald-700">
                {storage.formatPrice(metrics.todayRevenueDisplay, currency)}
              </span>
            </div>
          </div>

          {/* Active Inventory */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {t.admin.totalStockUnits}
              </span>
              <Package className="w-4 h-4 text-[#7B173B]" />
            </div>
            <div className="text-2xl font-bold text-[#171719] tracking-tight">
              {metrics.totalStockUnits} {language === 'fr' ? 'unités' : 'units'}
            </div>
            <div className="text-[11px] text-gray-500 flex items-center justify-between">
              <span>{language === 'fr' ? 'Produits actifs :' : 'Active products:'}</span>
              <span className="font-semibold text-gray-800">{metrics.activeProducts}</span>
            </div>
          </div>

          {/* Stock Alerts (Low stock & Out of stock) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {t.admin.lowStockAlerts}
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-800 tracking-tight">
              {metrics.lowStockCount}{' '}
              <span className="text-xs font-normal text-gray-400">
                / {metrics.outOfStockCount} {language === 'fr' ? 'épuisés' : 'out of stock'}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 flex items-center justify-between">
              <span>{language === 'fr' ? 'Réservés :' : 'Reserved units:'}</span>
              <span className="font-semibold text-gray-800">{metrics.reservedUnits}</span>
            </div>
          </div>

          {/* Registered Customers */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                {t.admin.registeredCustomers}
              </span>
              <Users className="w-4 h-4 text-[#7B173B]" />
            </div>
            <div className="text-2xl font-bold text-[#171719] tracking-tight">
              {metrics.registeredCustomersCount}
            </div>
            <div className="text-[11px] text-gray-500 flex items-center justify-between">
              <span>{language === 'fr' ? 'Créances impayées :' : 'Outstanding due:'}</span>
              <span className="font-semibold text-amber-700">
                {storage.formatPrice(metrics.outstandingBalanceTotal, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Owner Financial Highlight (Restricted to Owner) */}
        {currentUser?.role === 'owner' && (
          <div className="bg-gradient-to-r from-[#171719] to-[#25252A] p-5 rounded-2xl border border-gray-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>{t.admin.grossProfitEst} (Owner Confidential)</span>
              </div>
              <p className="text-xs text-gray-400">
                {language === 'fr'
                  ? 'Calculé à partir du chiffre d’affaires réel moins les coûts d’acquisition enregistrés.'
                  : 'Calculated from recorded sale revenue minus recorded product acquisition costs.'}
              </p>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {storage.formatPrice(metrics.grossProfitEstimate, currency)}
            </div>
          </div>
        )}

        {/* Data Tables: Recent Sales & Inventory Audit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sales Transactions */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                {t.admin.recentSales}
              </h3>
              <button
                type="button"
                onClick={() => navigateTo('/admin/pos')}
                className="text-xs text-[#7B173B] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>{language === 'fr' ? 'Accéder au POS' : 'Go to POS'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {sales.length > 0 ? (
              <div className="space-y-3">
                {sales.slice(0, 5).map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3 bg-[#F9F9FB] rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        <span>{sale.receiptNumber}</span>
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full font-medium ${
                            sale.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sale.paymentStatus === 'refunded'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sale.paymentStatus}
                        </span>
                      </div>
                      <div className="text-gray-500 text-[11px]">
                        {sale.customerName || 'Walk-in'} · {sale.channel} · {new Date(sale.timestamp).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-[#7B173B]">
                        {formatPrice(sale.total, sale.currency)}
                      </div>
                      <div className="text-[10px] text-gray-400 capitalize">
                        {sale.paymentMethod}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">
                {language === 'fr' ? 'Aucune vente enregistrée pour le moment.' : 'No transactions recorded yet.'}
              </p>
            )}
          </div>

          {/* Recent Inventory Movement History */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                {t.admin.recentMovements}
              </h3>
              <button
                type="button"
                onClick={() => navigateTo('/admin/products')}
                className="text-xs text-[#7B173B] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>{language === 'fr' ? 'Gérer les stocks' : 'Manage Stocks'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {movements.length > 0 ? (
              <div className="space-y-2.5">
                {movements.map((mov) => (
                  <div
                    key={mov.id}
                    className="p-3 bg-[#F9F9FB] rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 max-w-[70%]">
                      <div className="font-semibold text-gray-900 truncate">
                        {mov.productName} ({mov.productSku})
                      </div>
                      <div className="text-gray-500 text-[11px] truncate">
                        {mov.reason} · {mov.staffName} · {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-xs ${
                          mov.quantityChanged > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {mov.quantityChanged > 0 ? `+${mov.quantityChanged}` : mov.quantityChanged}
                      </span>
                      <div className="text-[10px] text-gray-400">
                        Balance: {mov.quantityAfter}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-6 text-center">
                {language === 'fr' ? 'Aucun mouvement d’inventaire récent.' : 'No recent movements.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
