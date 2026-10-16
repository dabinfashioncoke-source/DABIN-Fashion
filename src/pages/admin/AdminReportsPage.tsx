import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Printer,
  Calendar,
  ShoppingBag,
  CreditCard,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { CurrencyCode } from '../../types';
import { OFFICIAL_BUSINESS_INFO } from '../../constants/initialData';
import { downloadPdfFromElement } from '../../utils/pdfGenerator';

const CATEGORY_COLORS = [
  '#7B173B', // Deep Burgundy
  '#2563EB', // Royal Blue
  '#D97706', // Warm Amber
  '#059669', // Emerald Green
  '#7C3AED', // Rich Purple
  '#DB2777', // Rose Pink
  '#0D9488', // Teal
  '#4B5563', // Slate Gray
];

const PAYMENT_COLORS: Record<string, string> = {
  mpesa: '#059669', // Safari green
  bank_transfer: '#2563EB', // Banking blue
  cash: '#D97706', // Amber gold
  card: '#7C3AED', // Violet purple
  other: '#6B7280', // Gray
};

export const AdminReportsPage: React.FC = () => {
  const { language, t, currency } = useApp();

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('all');
  const [reportCurrency, setReportCurrency] = useState<CurrencyCode>(currency);
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const products = storage.getProducts();
  const sales = storage.getSales();
  const categories = storage.getCategories();
  const exchangeRate = storage.getExchangeRate();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  // Category name mapping helper
  const getCategoryDisplayName = (categoryIdOrSlug: string): string => {
    const found = categories.find(
      (c) => c.id === categoryIdOrSlug || c.slug === categoryIdOrSlug || c.id.replace('cat-', '') === categoryIdOrSlug
    );
    if (found) {
      return language === 'fr' ? found.nameFr : found.nameEn;
    }
    const mapping: Record<string, { en: string; fr: string }> = {
      clothes: { en: 'Apparel & Clothes', fr: 'Vêtements' },
      shoes: { en: 'Shoes & Footwear', fr: 'Chaussures' },
      bags: { en: 'Bags & Handbags', fr: 'Sacs' },
      'home-textiles': { en: 'Home Textiles & Bedding', fr: 'Linge de maison' },
      accessories: { en: 'Accessories & Scarves', fr: 'Accessoires' },
      apparel: { en: 'Apparel & Outfits', fr: 'Prêt-à-porter' },
    };
    const cleanKey = categoryIdOrSlug.replace('cat-', '');
    if (mapping[cleanKey]) {
      return language === 'fr' ? mapping[cleanKey].fr : mapping[cleanKey].en;
    }
    return categoryIdOrSlug;
  };

  // Aggregate Metrics & Chart Data
  const reportData = useMemo(() => {
    let totalGrossSales = 0;
    let totalCashReceived = 0;
    let totalOutstanding = 0;
    let totalCostOfGoodsSold = 0;
    let totalUnitsSold = 0;

    const categoryRevenueMap: Record<string, { revenue: number; units: number }> = {};
    const paymentMethodMap: Record<string, number> = {};
    const productSalesMap: Record<string, { name: string; sku: string; units: number; revenue: number }> = {};
    const monthlyMap: Record<
      string,
      { monthKey: string; monthLabel: string; revenue: number; profit: number; cost: number; orders: number; units: number }
    > = {};

    filteredSales.forEach((sale) => {
      const saleTotalInReportCurr = storage.convertPrice(sale.total, sale.currency, reportCurrency);
      const paidInReportCurr = storage.convertPrice(sale.amountPaid, sale.currency, reportCurrency);
      const balInReportCurr = storage.convertPrice(sale.outstandingBalance, sale.currency, reportCurrency);

      totalGrossSales += saleTotalInReportCurr;
      totalCashReceived += paidInReportCurr;
      totalOutstanding += balInReportCurr;

      paymentMethodMap[sale.paymentMethod] =
        (paymentMethodMap[sale.paymentMethod] || 0) + saleTotalInReportCurr;

      const saleDate = new Date(sale.timestamp);
      const year = saleDate.getFullYear();
      const monthNum = String(saleDate.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${monthNum}`;

      const monthLabel = saleDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
        month: 'short',
        year: 'numeric',
      });

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          monthKey,
          monthLabel,
          revenue: 0,
          profit: 0,
          cost: 0,
          orders: 0,
          units: 0,
        };
      }
      monthlyMap[monthKey].orders += 1;
      monthlyMap[monthKey].revenue += saleTotalInReportCurr;

      let saleCostTotal = 0;
      sale.items.forEach((item) => {
        const itemRev = storage.convertPrice(item.totalPrice, item.currency, reportCurrency);
        const itemCost = storage.convertPrice(
          (item.costPriceAtSale || 0) * item.quantity,
          item.currency,
          reportCurrency
        );

        totalCostOfGoodsSold += itemCost;
        saleCostTotal += itemCost;
        totalUnitsSold += item.quantity;
        monthlyMap[monthKey].units += item.quantity;

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

        const prod = products.find((p) => p.id === item.productId);
        const catKey = prod ? prod.categoryId : 'cat-clothes';
        if (!categoryRevenueMap[catKey]) {
          categoryRevenueMap[catKey] = { revenue: 0, units: 0 };
        }
        categoryRevenueMap[catKey].revenue += itemRev;
        categoryRevenueMap[catKey].units += item.quantity;
      });

      monthlyMap[monthKey].cost += saleCostTotal;
      monthlyMap[monthKey].profit += saleTotalInReportCurr - saleCostTotal;
    });

    const grossProfit = totalGrossSales - totalCostOfGoodsSold;
    const profitMargin = totalGrossSales > 0 ? (grossProfit / totalGrossSales) * 100 : 0;
    const avgOrderValue = filteredSales.length > 0 ? totalGrossSales / filteredSales.length : 0;

    const monthlyChartData = Object.values(monthlyMap)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .map((m) => ({
        month: m.monthLabel,
        revenue: Math.round(m.revenue),
        profit: Math.round(m.profit),
        cost: Math.round(m.cost),
        orders: m.orders,
        units: m.units,
        margin: m.revenue > 0 ? Math.round((m.profit / m.revenue) * 100) : 0,
      }));

    const categoryChartData = Object.entries(categoryRevenueMap)
      .map(([catKey, data]) => {
        const sharePercent =
          totalGrossSales > 0 ? Math.round((data.revenue / totalGrossSales) * 100) : 0;
        return {
          name: getCategoryDisplayName(catKey),
          categoryId: catKey,
          revenue: Math.round(data.revenue),
          units: data.units,
          share: sharePercent,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const paymentChartData = Object.entries(paymentMethodMap).map(([method, amount]) => {
      const share = totalGrossSales > 0 ? Math.round((amount / totalGrossSales) * 100) : 0;
      let label = method;
      if (method === 'mpesa') label = 'M-Pesa Express / Till';
      else if (method === 'bank_transfer') label = 'Bank Transfer / SWIFT';
      else if (method === 'cash') label = 'Cash at Showroom';
      else if (method === 'card') label = 'Visa / Mastercard';

      return {
        name: label,
        methodKey: method,
        amount: Math.round(amount),
        share,
      };
    });

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
      .slice(0, 6);

    return {
      totalGrossSales,
      totalCashReceived,
      totalOutstanding,
      totalCostOfGoodsSold,
      grossProfit,
      profitMargin,
      avgOrderValue,
      totalUnitsSold,
      monthlyChartData,
      categoryChartData,
      paymentChartData,
      totalInventoryRetailValue,
      totalInventoryCostValue,
      topSellingProducts,
    };
  }, [filteredSales, products, categories, reportCurrency, language]);

  const handleDownloadPdfReport = async () => {
    const elem = document.getElementById('printable-reports-dashboard');
    if (!elem) return;

    try {
      setIsDownloadingPdf(true);
      const filename = `DABIN-Sales-Analytics-${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadPdfFromElement(
        elem,
        filename,
        'DABIN Fashion House — Sales & Category Analytics Report'
      );
      showToast(
        language === 'fr'
          ? '✓ Rapport analytique PDF téléchargé !'
          : '✓ Sales analytics report PDF downloaded!'
      );
    } catch (err) {
      console.error('Failed to download PDF report:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <AdminLayout activeTab="reports">
      <div className="space-y-6">
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-[#171719] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm border border-white/10 animate-fade-in no-print">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* HEADER & TOP CONTROL BAR */}
        {/* ======================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
                {language === 'fr' ? 'Rapports & Statistiques des Ventes' : 'Sales Analytics & Reports'}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#7B173B]/10 text-[#7B173B] border border-[#7B173B]/20">
                <Sparkles className="w-3 h-3" />
                <span>Recharts Engine</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fr'
                ? 'Tableau de bord interactif visualisant le chiffre d’affaires mensuel, les marges et les catégories les plus vendues.'
                : 'Interactive analytics visualizing monthly revenue velocity, gross margins, and top-selling product categories.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdfReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#7B173B] hover:bg-[#62122F] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download analytical report as PDF file"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {isDownloadingPdf
                  ? language === 'fr'
                    ? 'Génération...'
                    : 'Generating PDF...'
                  : language === 'fr'
                  ? 'Télécharger PDF'
                  : 'Download PDF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#171719] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              title="Trigger device native print options"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Imprimer' : 'Print'}</span>
            </button>

            <button
              type="button"
              onClick={() => storage.exportSalesCsv()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" />
              <span>{t.reports.exportSalesCsv}</span>
            </button>

            <button
              type="button"
              onClick={() => storage.exportInventoryCsv()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-gray-500" />
              <span>{t.reports.exportInventoryCsv}</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FILTER TOOLBAR: DATE RANGE & CURRENCY TOGGLE */}
        {/* ======================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-gray-400 font-medium mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.reports.filterRange}:</span>
            </span>
            {(['today', 'week', 'month', 'year', 'all'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setDateRange(r)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  dateRange === r
                    ? 'bg-[#7B173B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                {t.reports[
                  r === 'today'
                    ? 'today'
                    : r === 'week'
                    ? 'thisWeek'
                    : r === 'month'
                    ? 'thisMonth'
                    : r === 'year'
                    ? 'thisYear'
                    : 'allTime'
                ]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-gray-500 font-medium">{t.reports.currencyFilter}:</span>
            <div className="flex items-center bg-[#F4F4F6] p-1 rounded-xl border border-gray-200 font-bold">
              <button
                type="button"
                onClick={() => setReportCurrency('KES')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  reportCurrency === 'KES'
                    ? 'bg-[#7B173B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                KES
              </button>
              <button
                type="button"
                onClick={() => setReportCurrency('USD')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  reportCurrency === 'USD'
                    ? 'bg-[#7B173B] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                USD
              </button>
            </div>
            <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
              (1 USD = {exchangeRate} KES)
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* MAIN PRINTABLE ANALYTICS REPORT BODY */}
        {/* ======================================================== */}
        <div id="printable-reports-dashboard" className="space-y-6 bg-transparent">
          {/* Official Letterhead (Visible when printing / generating PDF) */}
          <div className="hidden print:block pb-4 mb-4 border-b border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold font-serif-brand text-[#7B173B]">
                  DABIN FASHION HOUSE
                </h1>
                <p className="text-xs text-gray-600">
                  {OFFICIAL_BUSINESS_INFO.primarySloganFr} • {OFFICIAL_BUSINESS_INFO.englishSlogan}
                </p>
                <p className="text-xs text-gray-500">
                  Nairobi, Kenya • WhatsApp: {OFFICIAL_BUSINESS_INFO.whatsappFormatted} • Email:{' '}
                  {OFFICIAL_BUSINESS_INFO.email}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Official Executive Report
                </span>
                <span className="text-sm font-mono font-bold text-gray-900">
                  Sales & Categories Analytics
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Generated: {new Date().toLocaleDateString()} • Currency: {reportCurrency}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* EXECUTIVE KPI METRIC CARDS */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Gross Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2 hover:border-[#7B173B]/30 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-gray-500">
                  {language === 'fr' ? 'Chiffre d’Affaires Brut' : 'Gross Sales Revenue'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#7B173B]/10 flex items-center justify-center text-[#7B173B]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#171719] tracking-tight">
                {storage.formatPrice(reportData.totalGrossSales, reportCurrency)}
              </div>
              <div className="text-[11px] text-gray-500 flex items-center justify-between">
                <span>{filteredSales.length} {language === 'fr' ? 'transactions' : 'orders'}</span>
                <span className="font-semibold text-gray-700">
                  {reportData.totalUnitsSold} {language === 'fr' ? 'articles vendus' : 'units sold'}
                </span>
              </div>
            </div>

            {/* Actual Cash Received */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2 hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-gray-500">
                  {language === 'fr' ? 'Encaissements Reçus' : 'Cash Realized'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800 tracking-tight">
                {storage.formatPrice(reportData.totalCashReceived, reportCurrency)}
              </div>
              <div className="text-[11px] text-gray-500 flex items-center justify-between">
                <span>{language === 'fr' ? 'Règlements encaissés' : 'Verified paid in POS'}</span>
                {reportData.totalOutstanding > 0 && (
                  <span className="text-amber-700 font-bold">
                    {storage.formatPrice(reportData.totalOutstanding, reportCurrency)} {language === 'fr' ? 'dû' : 'due'}
                  </span>
                )}
              </div>
            </div>

            {/* Estimated Gross Profit */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2 hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-gray-500">
                  {language === 'fr' ? 'Marge Brute Estimée' : 'Est. Gross Profit'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#7B173B]/10 flex items-center justify-center text-[#7B173B]">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#7B173B] tracking-tight">
                {storage.formatPrice(reportData.grossProfit, reportCurrency)}
              </div>
              <div className="text-[11px] text-gray-500 flex items-center justify-between">
                <span>{language === 'fr' ? 'Taux de marge' : 'Gross Margin'}</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {reportData.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Average Order Value (AOV) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2 hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-gray-500">
                  {language === 'fr' ? 'Panier Moyen (AOV)' : 'Avg. Order Value'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight">
                {storage.formatPrice(reportData.avgOrderValue, reportCurrency)}
              </div>
              <div className="text-[11px] text-gray-500">
                {language === 'fr'
                  ? 'Revenu moyen par transaction enregistrée'
                  : 'Average ticket per checkout sale'}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RECHARTS VISUALIZATION 1: MONTHLY REVENUE & PROFIT */}
          {/* ======================================================== */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif-brand text-lg font-bold text-[#171719] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#7B173B]" />
                  <span>
                    {language === 'fr'
                      ? 'Évolution Mensuelle du Chiffre d’Affaires & de la Marge'
                      : 'Monthly Revenue & Gross Profit Trend'}
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'fr'
                    ? 'Comparatif mensuel des ventes totales et du profit estimé (en ' + reportCurrency + ')'
                    : 'Month-over-month performance comparing gross sales and estimated profit (in ' + reportCurrency + ')'}
                </p>
              </div>

              {/* Chart type switch */}
              <div className="flex items-center gap-1 bg-[#F8F8FA] p-1 rounded-xl border border-gray-200 text-xs no-print">
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    chartType === 'bar'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {language === 'fr' ? 'Barres' : 'Bars'}
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    chartType === 'area'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {language === 'fr' ? 'Aire' : 'Area'}
                </button>
              </div>
            </div>

            {/* Recharts Chart Container */}
            <div className="h-72 sm:h-80 w-full pt-2">
              {reportData.monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart
                      data={reportData.monthlyChartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="month"
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#171719',
                          borderRadius: '16px',
                          border: 'none',
                          color: '#fff',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                          padding: '12px 16px',
                        }}
                        formatter={(value: any, name: any) => {
                          const valNum = Number(value) || 0;
                          const formatted = storage.formatPrice(valNum, reportCurrency);
                          const label =
                            name === 'revenue'
                              ? language === 'fr'
                                ? 'Chiffre d’affaires'
                                : 'Gross Revenue'
                              : language === 'fr'
                              ? 'Bénéfice estimé'
                              : 'Est. Net Profit';
                          return [formatted, label];
                        }}
                        labelStyle={{ color: '#E5E7EB', fontWeight: 'bold', marginBottom: '4px' }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                        formatter={(val) =>
                          val === 'revenue'
                            ? language === 'fr'
                              ? 'Chiffre d’affaires'
                              : 'Gross Revenue'
                            : language === 'fr'
                            ? 'Marge brute'
                            : 'Gross Profit'
                        }
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#7B173B"
                        radius={[8, 8, 0, 0]}
                        name="revenue"
                        maxBarSize={48}
                      />
                      <Bar
                        dataKey="profit"
                        fill="#059669"
                        radius={[8, 8, 0, 0]}
                        name="profit"
                        maxBarSize={48}
                      />
                    </BarChart>
                  ) : (
                    <AreaChart
                      data={reportData.monthlyChartData}
                      margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7B173B" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#7B173B" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="month"
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                      />
                      <YAxis
                        stroke="#6B7280"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{ stroke: '#E5E7EB' }}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                        }
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#171719',
                          borderRadius: '16px',
                          border: 'none',
                          color: '#fff',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                          padding: '12px 16px',
                        }}
                        formatter={(value: any, name: any) => {
                          const valNum = Number(value) || 0;
                          return [storage.formatPrice(valNum, reportCurrency), name === 'revenue' ? 'Revenue' : 'Profit'];
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#7B173B"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="profit"
                        stroke="#059669"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorProfit)"
                        name="profit"
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  {language === 'fr'
                    ? 'Aucune vente enregistrée pour la période sélectionnée.'
                    : 'No sales data recorded for the selected period.'}
                </div>
              )}
            </div>
          </div>

          {/* ======================================================== */}
          {/* RECHARTS VISUALIZATION 2 & 3: CATEGORIES & PAYMENT BREAKDOWN */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top-Selling Product Categories (Horizontal Bar Chart) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-serif-brand text-base sm:text-lg font-bold text-[#171719] flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-[#7B173B]" />
                    <span>
                      {language === 'fr'
                        ? 'Catégories de Produits les Plus Vendues'
                        : 'Top-Selling Product Categories'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    {language === 'fr'
                      ? 'Répartition du chiffre d’affaires généré par catégorie de stock'
                      : 'Revenue contribution per inventory category'}
                  </p>
                </div>
                <span className="text-xs font-bold bg-[#F8F8FA] px-2.5 py-1 rounded-lg text-gray-600">
                  {reportData.categoryChartData.length} {language === 'fr' ? 'Catégories' : 'Categories'}
                </span>
              </div>

              {/* Chart */}
              <div className="h-64 sm:h-72 w-full">
                {reportData.categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={reportData.categoryChartData}
                      margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis
                        type="number"
                        stroke="#6B7280"
                        fontSize={11}
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                        }
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#374151"
                        fontSize={11}
                        width={90}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#171719',
                          borderRadius: '14px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '10px 14px',
                        }}
                        formatter={(value: any, _name: any, item: any) => [
                          `${storage.formatPrice(Number(value) || 0, reportCurrency)} (${item.payload.share}%)`,
                          language === 'fr' ? 'Revenu' : 'Revenue',
                        ]}
                      />
                      <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
                        {reportData.categoryChartData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    {language === 'fr' ? 'Aucune donnée de catégorie disponible.' : 'No category data.'}
                  </div>
                )}
              </div>

              {/* Category Badges Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                {reportData.categoryChartData.slice(0, 4).map((cat, idx) => (
                  <div key={cat.categoryId} className="p-2 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 truncate">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="truncate font-medium text-gray-700">{cat.name}</span>
                    </div>
                    <span className="font-bold text-[#7B173B] shrink-0">
                      {cat.share}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-serif-brand text-base sm:text-lg font-bold text-[#171719] flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-700" />
                    <span>
                      {language === 'fr'
                        ? 'Modes de Paiement Utilisés'
                        : 'Payment Methods Breakdown'}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    {language === 'fr'
                      ? 'Part respective de M-Pesa, Virement Bancaire, Espèces et Carte'
                      : 'M-Pesa, Bank Transfer, Showroom Cash, and Card splits'}
                  </p>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="h-64 sm:h-72 w-full flex items-center justify-center">
                {reportData.paymentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.paymentChartData}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                      >
                        {reportData.paymentChartData.map((entry) => (
                          <Cell
                            key={`payment-${entry.methodKey}`}
                            fill={PAYMENT_COLORS[entry.methodKey] || '#6B7280'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#171719',
                          borderRadius: '14px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          padding: '10px 14px',
                        }}
                        formatter={(val: any, _name: any, item: any) => [
                          `${storage.formatPrice(Number(val) || 0, reportCurrency)} (${item.payload.share}%)`,
                          item.payload.name,
                        ]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-gray-400 text-sm">
                    {language === 'fr' ? 'Aucune transaction.' : 'No transactions.'}
                  </div>
                )}
              </div>

              {/* Payment Summary Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                {reportData.paymentChartData.map((p) => (
                  <div key={p.methodKey} className="p-2 bg-gray-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate">{p.name}</span>
                    <span className="font-bold text-gray-900 shrink-0">
                      {storage.formatPrice(p.amount, reportCurrency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MONTHLY PERFORMANCE AUDIT TABLE */}
          {/* ======================================================== */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                  {language === 'fr' ? 'Registre Mensuel des Performances' : 'Monthly Performance Ledger'}
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'fr'
                    ? 'Historique complet mois par mois des volumes de vente, coûts d’achat et bénéfices'
                    : 'Month-by-month financial summary of order velocity, acquisition costs, and realized margins'}
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-[#F8F8FA] px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700">
                {reportData.monthlyChartData.length} {language === 'fr' ? 'Mois Enregistrés' : 'Months Logged'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8F8FA] border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">{language === 'fr' ? 'Mois' : 'Month'}</th>
                    <th className="py-3 px-4 text-center">{language === 'fr' ? 'Commandes' : 'Orders'}</th>
                    <th className="py-3 px-4 text-center">{language === 'fr' ? 'Unités Vendues' : 'Units Sold'}</th>
                    <th className="py-3 px-4 text-right">{language === 'fr' ? 'Chiffre d’Affaires' : 'Gross Revenue'}</th>
                    <th className="py-3 px-4 text-right">{language === 'fr' ? 'Coût Marchandises' : 'Cost of Goods'}</th>
                    <th className="py-3 px-4 text-right">{language === 'fr' ? 'Bénéfice Brut' : 'Gross Profit'}</th>
                    <th className="py-3 px-5 text-right">{language === 'fr' ? 'Marge' : 'Margin %'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.monthlyChartData.length > 0 ? (
                    reportData.monthlyChartData.map((row) => (
                      <tr key={row.month} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-gray-900">{row.month}</td>
                        <td className="py-3.5 px-4 text-center text-gray-600 font-semibold">{row.orders}</td>
                        <td className="py-3.5 px-4 text-center text-gray-600">{row.units}</td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-[#171719]">
                          {storage.formatPrice(row.revenue, reportCurrency)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-gray-500">
                          {storage.formatPrice(row.cost, reportCurrency)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#7B173B]">
                          {storage.formatPrice(row.profit, reportCurrency)}
                        </td>
                        <td className="py-3.5 px-5 text-right font-bold text-emerald-700">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50">
                            {row.margin}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-400">
                        {language === 'fr' ? 'Aucune donnée enregistrée.' : 'No data recorded.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ======================================================== */}
          {/* INVENTORY VALUATION COMPARISON CARDS */}
          {/* ======================================================== */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                  {t.reports.inventoryValuation}
                </h3>
                <p className="text-xs text-gray-500">
                  {language === 'fr'
                    ? 'Valeur marchande globale du stock magasin et entrepôt vs coût d’acquisition'
                    : 'Total showroom & warehouse inventory valuation compared against acquisition bale cost'}
                </p>
              </div>
              <span className="text-xs text-gray-500 font-semibold">
                {products.length} {language === 'fr' ? 'Références' : 'SKUs in Catalog'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-[#F8F8FA] rounded-2xl border border-gray-200 space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">
                  {t.reports.totalStockRetail}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#171719]">
                  {storage.formatPrice(reportData.totalInventoryRetailValue, reportCurrency)}
                </div>
                <p className="text-[11px] text-gray-400">
                  {language === 'fr'
                    ? 'Calculé au prix de vente au détail sur toutes les pièces en rayon.'
                    : 'Calculated at standard retail price on all active on-hand pieces.'}
                </p>
              </div>

              <div className="p-5 bg-[#F8F8FA] rounded-2xl border border-gray-200 space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block">
                  {t.reports.totalStockCost}
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#7B173B]">
                  {storage.formatPrice(reportData.totalInventoryCostValue, reportCurrency)}
                </div>
                <p className="text-[11px] text-gray-400">
                  {language === 'fr'
                    ? 'Coût d’achat initial des balles et pièces de friperie.'
                    : 'Direct acquisition cost value invested in current stock.'}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* TOP-SELLING INDIVIDUAL PRODUCTS */}
          {/* ======================================================== */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h4 className="font-serif-brand text-lg font-bold text-[#171719]">
                  {t.reports.topSelling}
                </h4>
                <p className="text-xs text-gray-500">
                  {language === 'fr'
                    ? 'Articles individuels générant le plus de revenus'
                    : 'Individual catalog pieces driving the highest revenue'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportData.topSellingProducts.length > 0 ? (
                reportData.topSellingProducts.map((p, idx) => (
                  <div
                    key={p.sku}
                    className="p-4 rounded-2xl border border-gray-200 hover:border-[#7B173B]/40 bg-[#FDFDFE] hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold bg-[#7B173B]/10 text-[#7B173B] px-2 py-0.5 rounded-md">
                        #{idx + 1} • {p.sku}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        {p.units} {language === 'fr' ? 'vendus' : 'sold'}
                      </span>
                    </div>
                    <div className="font-bold text-gray-900 text-sm truncate" title={p.name}>
                      {p.name}
                    </div>
                    <div className="text-base font-extrabold text-[#7B173B]">
                      {storage.formatPrice(p.revenue, reportCurrency)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 py-3 text-center col-span-3">
                  {language === 'fr' ? 'Aucun article vendu dans cette période.' : 'No sales recorded yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
