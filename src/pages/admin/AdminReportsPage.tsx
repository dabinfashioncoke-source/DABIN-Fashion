import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  CreditCard,
  Users,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { CurrencyCode } from '../../types';

export const AdminReportsPage: React.FC = () => {
  const { language, formatPrice, t, currentUser, currency, setCurrency } = useApp();

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  const [reportCurrency, setReportCurrency] = useState<CurrencyCode>(currency);

  const products = storage.getProducts();
  const sales = storage.getSales();
  const customers = storage.getCustomers();
  const exchangeRate = storage.getExchangeRate();

  // Filter sales by date range
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    let cutoff = 0;
    if (dateRange === 'today') {
      cutoff = todayStart;
    } else if (dateRange === 'week') {
      cutoff = todayStart - 7 * 86400000;
    } else if (dateRange === 'month') {
      cutoff = todayStart - 30 * 86400000;
    } else if (dateRange === 'year') {
      cutoff = todayStart - 365 * 86400000;
    }

    return sales.filter((s) => {
      if (s.paymentStatus === 'refunded' || s.paymentStatus === 'voided') return false;
      if (cutoff === 0) return true;
      return new Date(s.timestamp).getTime() >= cutoff;
    });
  }, [sales, dateRange]);

  // Aggregate Metrics
  const reportData = useMemo(() => {
    let totalGrossSales = 0;
    let totalCashReceived = 0;
    let totalOutstanding = 0;
    let totalCostOfGoodsSold = 0;

    const categoryRevenueMap: Record<string, number> = {};
    const paymentMethodMap: Record<string, number> = {};
    const productSalesMap: Record<string, { name: string; sku: string; units: number; revenue: number }> = {};
    const customerGroupMap: Record<string, number> = {
      wholesaler: 0,
      retailer: 0,
      individual: 0,
    };

    filteredSales.forEach((sale) => {
      const saleTotalInReportCurr = storage.convertPrice(sale.total, sale.currency, reportCurrency);
      const paidInReportCurr = storage.convertPrice(sale.amountPaid, sale.currency, reportCurrency);
      const balInReportCurr = storage.convertPrice(sale.outstandingBalance, sale.currency, reportCurrency);

      totalGrossSales += saleTotalInReportCurr;
      totalCashReceived += paidInReportCurr;
      totalOutstanding += balInReportCurr;

      // Payment method breakdown
      paymentMethodMap[sale.paymentMethod] = (paymentMethodMap[sale.paymentMethod] || 0) + saleTotalInReportCurr;

      // Customer group
      if (sale.customerId) {
        const cust = customers.find((c) => c.id === sale.customerId);
        if (cust) {
          customerGroupMap[cust.type] = (customerGroupMap[cust.type] || 0) + saleTotalInReportCurr;
        } else {
          customerGroupMap.individual = (customerGroupMap.individual || 0) + saleTotalInReportCurr;
        }
      } else {
        customerGroupMap.individual = (customerGroupMap.individual || 0) + saleTotalInReportCurr;
      }

      // Items
      sale.items.forEach((item) => {
        const itemRev = storage.convertPrice(item.totalPrice, item.currency, reportCurrency);
        const itemCost = storage.convertPrice((item.costPriceAtSale || 0) * item.quantity, item.currency, reportCurrency);

        totalCostOfGoodsSold += itemCost;

        // Top product
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = {
            name: item.productName,
            sku: item.sku,
            units: 0,
            revenue: 0,
          };
        }
        productSalesMap[item.productId].units += item.quantity;
        productSalesMap[item.productId].revenue += itemRev;

        // Category
        const prod = products.find((p) => p.id === item.productId);
        const catKey = prod ? prod.categoryId.replace('cat-', '') : 'apparel';
        categoryRevenueMap[catKey] = (categoryRevenueMap[catKey] || 0) + itemRev;
      });
    });

    const grossProfit = totalGrossSales - totalCostOfGoodsSold;

    // Inventory Valuation
    const totalInventoryRetailValue = products.reduce((acc, p) => {
      const pInReport = storage.convertPrice(p.basePrice, p.baseCurrency, reportCurrency);
      return acc + pInReport * p.quantityOnHand;
    }, 0);

    const totalInventoryCostValue = products.reduce((acc, p) => {
      const cInReport = storage.convertPrice(p.costPrice || 0, p.baseCurrency, reportCurrency);
      return acc + cInReport * p.quantityOnHand;
    }, 0);

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalGrossSales,
      totalCashReceived,
      totalOutstanding,
      grossProfit,
      totalInventoryRetailValue,
      totalInventoryCostValue,
      categoryRevenueMap,
      paymentMethodMap,
      customerGroupMap,
      topSellingProducts,
    };
  }, [filteredSales, products, customers, reportCurrency]);

  return (
    <AdminLayout activeTab="reports">
      <div className="space-y-6">
        {/* Header & CSV Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {t.reports.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {t.reports.subtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => storage.exportSalesCsv()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>{t.reports.exportSalesCsv}</span>
            </button>
            <button
              type="button"
              onClick={() => storage.exportInventoryCsv()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>{t.reports.exportInventoryCsv}</span>
            </button>
            <button
              type="button"
              onClick={() => storage.exportCustomersCsv()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span>{t.reports.exportCustomersCsv}</span>
            </button>
          </div>
        </div>

        {/* Currency & Date Filters */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          {/* Date range filter */}
          <div className="flex items-center gap-1.5 text-xs bg-[#F8F8FA] p-1 rounded-xl border border-gray-200">
            <span className="text-gray-400 px-2 font-medium">{t.reports.filterRange}:</span>
            {(['today', 'week', 'month', 'year', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  dateRange === r ? 'bg-[#7B173B] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.reports[r === 'today' ? 'today' : r === 'week' ? 'thisWeek' : r === 'month' ? 'thisMonth' : r === 'year' ? 'thisYear' : 'allTime']}
              </button>
            ))}
          </div>

          {/* Report currency selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">{t.reports.currencyFilter}:</span>
            <div className="flex items-center bg-[#F4F4F6] p-0.5 rounded-lg border border-gray-200 font-bold">
              <button
                type="button"
                onClick={() => setReportCurrency('KES')}
                className={`px-2.5 py-1 rounded ${
                  reportCurrency === 'KES' ? 'bg-[#7B173B] text-white' : 'text-gray-600'
                }`}
              >
                KES
              </button>
              <button
                type="button"
                onClick={() => setReportCurrency('USD')}
                className={`px-2.5 py-1 rounded ${
                  reportCurrency === 'USD' ? 'bg-[#7B173B] text-white' : 'text-gray-600'
                }`}
              >
                USD
              </button>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              (1 USD = {exchangeRate} KES)
            </span>
          </div>
        </div>

        {/* Core KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 block">
              Gross Sales Revenue
            </span>
            <div className="text-2xl font-bold text-[#171719] tracking-tight">
              {storage.formatPrice(reportData.totalGrossSales, reportCurrency)}
            </div>
            <div className="text-[11px] text-gray-500">
              Across {filteredSales.length} verified transactions
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 block">
              Actual Cash Received
            </span>
            <div className="text-2xl font-bold text-emerald-800 tracking-tight">
              {storage.formatPrice(reportData.totalCashReceived, reportCurrency)}
            </div>
            <div className="text-[11px] text-gray-500">
              Verified paid receipts
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 block">
              {t.reports.unpaidBalances}
            </span>
            <div className="text-2xl font-bold text-amber-700 tracking-tight">
              {storage.formatPrice(reportData.totalOutstanding, reportCurrency)}
            </div>
            <div className="text-[11px] text-gray-500">
              Customer partial payment receivables
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500 block">
              Est. Gross Profit
            </span>
            <div className="text-2xl font-bold text-[#7B173B] tracking-tight">
              {storage.formatPrice(reportData.grossProfit, reportCurrency)}
            </div>
            <div className="text-[11px] text-gray-500">
              Revenue minus recorded costs
            </div>
          </div>
        </div>

        {/* Inventory Valuation Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
              {t.reports.inventoryValuation}
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              {products.length} Products in Catalog
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#F8F8FA] rounded-xl border border-gray-200 space-y-1">
              <span className="text-xs text-gray-500 font-medium">
                {t.reports.totalStockRetail}
              </span>
              <div className="text-2xl font-bold text-gray-900">
                {storage.formatPrice(reportData.totalInventoryRetailValue, reportCurrency)}
              </div>
              <p className="text-[11px] text-gray-400">
                Calculated at standard retail price on all on-hand units.
              </p>
            </div>

            <div className="p-4 bg-[#F8F8FA] rounded-xl border border-gray-200 space-y-1">
              <span className="text-xs text-gray-500 font-medium">
                {t.reports.totalStockCost}
              </span>
              <div className="text-2xl font-bold text-[#7B173B]">
                {storage.formatPrice(reportData.totalInventoryCostValue, reportCurrency)}
              </div>
              <p className="text-[11px] text-gray-400">
                Acquisition cost value of current stock.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Breakdowns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Category Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h4 className="font-serif-brand text-base font-bold text-[#171719]">
              {t.reports.salesByCategory}
            </h4>
            <div className="space-y-2 text-xs">
              {Object.entries(reportData.categoryRevenueMap).length > 0 ? (
                Object.entries(reportData.categoryRevenueMap).map(([cat, amount]) => (
                  <div key={cat} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                    <span className="capitalize font-medium text-gray-700">{cat}</span>
                    <span className="font-bold text-[#7B173B]">
                      {storage.formatPrice(amount, reportCurrency)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 py-3 text-center">No sales in this date range.</p>
              )}
            </div>
          </div>

          {/* 2. Payment Method Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h4 className="font-serif-brand text-base font-bold text-[#171719]">
              {t.reports.salesByPayment}
            </h4>
            <div className="space-y-2 text-xs">
              {Object.entries(reportData.paymentMethodMap).length > 0 ? (
                Object.entries(reportData.paymentMethodMap).map(([method, amount]) => (
                  <div key={method} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                    <span className="capitalize font-medium text-gray-700">{method}</span>
                    <span className="font-bold text-emerald-800">
                      {storage.formatPrice(amount, reportCurrency)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 py-3 text-center">No transactions in this period.</p>
              )}
            </div>
          </div>

          {/* 3. Top-Selling Products */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h4 className="font-serif-brand text-base font-bold text-[#171719]">
              {t.reports.topSelling}
            </h4>
            <div className="space-y-2 text-xs">
              {reportData.topSellingProducts.length > 0 ? (
                reportData.topSellingProducts.map((p) => (
                  <div key={p.sku} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                    <div className="truncate max-w-[65%]">
                      <div className="font-semibold text-gray-900 truncate">{p.name}</div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {p.units} units sold
                      </span>
                    </div>
                    <span className="font-bold text-[#7B173B]">
                      {storage.formatPrice(p.revenue, reportCurrency)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 py-3 text-center">No sold items recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
