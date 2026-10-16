import React, { useState, useMemo } from 'react';
import {
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Download,
  Share2,
  Printer,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CreditCard,
  Building,
  Truck,
  ShoppingBag,
  FileText,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye,
  AlertCircle,
  Sparkles,
  Tag,
  Loader2,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DabinLogo } from '../../components/common/DabinLogo';
import { ShareDocumentModal } from '../../components/admin/ShareDocumentModal';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import {
  CurrencyCode,
  FinanceCategory,
  FinanceTransaction,
  FinanceTransactionType,
  PaymentMethod,
} from '../../types';
import { OFFICIAL_BUSINESS_INFO } from '../../constants/initialData';
import { downloadPdfFromElement } from '../../utils/pdfGenerator';

type PeriodFilter = 'all' | 'today' | 'this_week' | 'this_month' | 'this_year';
type TypeFilter = 'all' | 'income' | 'expense';

export const AdminFinancePage: React.FC = () => {
  const { language, settings } = useApp();

  // Transactions list state
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() =>
    storage.getFinanceTransactions()
  );

  // Filters
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'KES' | 'USD'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for creating/editing transaction
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [formType, setFormType] = useState<FinanceTransactionType>('expense');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formCurrency, setFormCurrency] = useState<CurrencyCode>('KES');
  const [formCategory, setFormCategory] = useState<FinanceCategory | string>('inventory_purchase');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod | string>('mpesa');
  const [formReferenceNumber, setFormReferenceNumber] = useState('');
  const [formPaidToOrFrom, setFormPaidToOrFrom] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'completed' | 'pending'>('completed');

  const refreshList = () => {
    setTransactions(storage.getFinanceTransactions());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open modal for new transaction
  const handleOpenNewModal = (type: FinanceTransactionType = 'expense') => {
    setEditingTxId(null);
    setFormType(type);
    setFormTitle('');
    setFormAmount('');
    setFormCurrency('KES');
    setFormCategory(type === 'income' ? 'pos_sales' : 'inventory_purchase');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('mpesa');
    setFormReferenceNumber('');
    setFormPaidToOrFrom('');
    setFormNotes('');
    setFormStatus('completed');
    setIsEditorOpen(true);
  };

  // Open modal to edit existing transaction
  const handleEdit = (tx: FinanceTransaction) => {
    setEditingTxId(tx.id);
    setFormType(tx.type);
    setFormTitle(tx.title);
    setFormAmount(String(tx.amount));
    setFormCurrency(tx.currency);
    setFormCategory(tx.category);
    setFormDate(tx.date);
    setFormPaymentMethod(tx.paymentMethod);
    setFormReferenceNumber(tx.referenceNumber || '');
    setFormPaidToOrFrom(tx.paidToOrFrom || '');
    setFormNotes(tx.notes || '');
    setFormStatus(tx.status === 'pending' ? 'pending' : 'completed');
    setIsEditorOpen(true);
  };

  // Delete transaction
  const handleDelete = (id: string, title: string) => {
    if (
      window.confirm(
        language === 'fr'
          ? `Supprimer définitivement l'enregistrement "${title}" ?`
          : `Permanently delete transaction "${title}"?`
      )
    ) {
      storage.deleteFinanceTransaction(id);
      refreshList();
      showToast(language === 'fr' ? 'Enregistrement supprimé' : 'Transaction deleted');
    }
  };

  // Save transaction
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast(language === 'fr' ? 'Veuillez saisir un montant valide supérieur à 0.' : 'Please enter a valid amount greater than 0.');
      return;
    }
    if (!formTitle.trim()) {
      showToast(language === 'fr' ? 'Veuillez saisir un libellé / titre.' : 'Please enter a transaction title / description.');
      return;
    }

    storage.saveFinanceTransaction({
      id: editingTxId || undefined,
      type: formType,
      title: formTitle.trim(),
      amount: amountNum,
      currency: formCurrency,
      exchangeRateUsed: settings.exchangeRateUsdToKes || 130,
      category: formCategory,
      date: formDate,
      paymentMethod: formPaymentMethod,
      referenceNumber: formReferenceNumber.trim() || undefined,
      paidToOrFrom: formPaidToOrFrom.trim() || undefined,
      notes: formNotes.trim() || undefined,
      status: formStatus,
    });

    refreshList();
    setIsEditorOpen(false);
    showToast(
      language === 'fr'
        ? `✓ ${formType === 'income' ? 'Revenu' : 'Dépense'} enregistré avec succès !`
        : `✓ ${formType === 'income' ? 'Income' : 'Expense'} recorded successfully!`
    );
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return transactions.filter((tx) => {
      // Type filter
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Currency filter
      if (currencyFilter !== 'all' && tx.currency !== currencyFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

      // Period filter
      if (periodFilter === 'today') {
        if (tx.date !== todayStr) return false;
      } else if (periodFilter === 'this_week') {
        const d = new Date(tx.date);
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (periodFilter === 'this_month') {
        if (!tx.date.startsWith(todayStr.substring(0, 7))) return false;
      } else if (periodFilter === 'this_year') {
        if (!tx.date.startsWith(todayStr.substring(0, 4))) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = tx.title.toLowerCase().includes(q);
        const matchesRef = tx.referenceNumber?.toLowerCase().includes(q);
        const matchesPerson = tx.paidToOrFrom?.toLowerCase().includes(q);
        const matchesNotes = tx.notes?.toLowerCase().includes(q);
        const matchesCategory = tx.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesRef && !matchesPerson && !matchesNotes && !matchesCategory) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, periodFilter, currencyFilter, categoryFilter, searchQuery]);

  // Executive financial totals
  const metrics = useMemo(() => {
    let incomeKes = 0;
    let expenseKes = 0;
    let incomeUsd = 0;
    let expenseUsd = 0;

    let todayMovementKes = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    for (const tx of transactions) {
      if (tx.status === 'cancelled') continue;
      const amt = Number(tx.amount) || 0;

      if (tx.currency === 'USD') {
        if (tx.type === 'income') incomeUsd += amt;
        else expenseUsd += amt;
      } else {
        if (tx.type === 'income') incomeKes += amt;
        else expenseKes += amt;
      }

      if (tx.date === todayStr) {
        const inKes = tx.currency === 'USD' ? amt * (tx.exchangeRateUsed || 130) : amt;
        if (tx.type === 'income') todayMovementKes += inKes;
        else todayMovementKes -= inKes;
      }
    }

    return {
      incomeKes,
      expenseKes,
      netKes: incomeKes - expenseKes,
      incomeUsd,
      expenseUsd,
      netUsd: incomeUsd - expenseUsd,
      todayMovementKes,
      totalCount: transactions.length,
    };
  }, [transactions]);

  // Download statement as PDF
  const handleDownloadStatement = async () => {
    const elem = document.getElementById('printable-finance-report');
    if (!elem) return;

    try {
      setIsDownloadingPdf(true);
      const filename = `DABIN-Financial-Statement-${new Date().toISOString().split('T')[0]}.pdf`;
      await downloadPdfFromElement(elem, filename, 'DABIN Fashion House — Financial Cash Flow Statement');
      showToast(language === 'fr' ? '✓ Relevé financier PDF téléchargé !' : '✓ Financial statement PDF downloaded!');
    } catch (err) {
      console.error('Failed to download finance PDF:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Human readable category labels
  const getCategoryLabel = (cat: string) => {
    const map: Record<string, { en: string; fr: string }> = {
      pos_sales: { en: 'Showroom & POS Sales', fr: 'Ventes Showroom & POS' },
      wholesale_order: { en: 'Wholesale Orders', fr: 'Commandes Gros' },
      cargo_shipping_income: { en: 'Client Freight Contribution', fr: 'Contribution Fret Client' },
      tailoring_services: { en: 'Tailoring & Alterations', fr: 'Retouches & Coutures' },
      client_deposit: { en: 'Client Advance Deposit', fr: 'Acompte Client' },
      other_income: { en: 'Other Business Income', fr: 'Autres Entrées' },
      inventory_purchase: { en: 'Thrift Bales & Stock Intake', fr: 'Balles Friperie & Achats Stock' },
      freight_shipping: { en: 'Cross-Border Cargo Freight', fr: 'Fret & Transport Cargo' },
      customs_clearance: { en: 'Customs & Port Clearance', fr: 'Dédouanement & Formalités' },
      rent_utilities: { en: 'Showroom Rent & Utilities', fr: 'Loyer Showroom & Énergie' },
      salaries_commissions: { en: 'Staff Salaries & Wages', fr: 'Salaires & Commissions' },
      packaging_materials: { en: 'Packaging & Branded Dust Bags', fr: 'Emballages & Sacs' },
      marketing_advertising: { en: 'Marketing & Social Media', fr: 'Marketing & Publicité' },
      financial_fees: { en: 'M-Pesa & Bank Charges', fr: 'Frais M-Pesa & Bancaires' },
      equipment_repairs: { en: 'Equipment & Maintenance', fr: 'Équipement & Maintenance' },
      taxes_licenses: { en: 'County Licenses & Taxes', fr: 'Licences & Taxes' },
      miscellaneous_expense: { en: 'Miscellaneous Expense', fr: 'Dépenses Diverses' },
    };
    if (map[cat]) {
      return language === 'fr' ? map[cat].fr : map[cat].en;
    }
    return cat.replace(/_/g, ' ');
  };

  // Category Icon helper
  const getCategoryIcon = (cat: string) => {
    if (cat.includes('sales') || cat.includes('wholesale')) return ShoppingBag;
    if (cat.includes('freight') || cat.includes('shipping') || cat.includes('cargo')) return Truck;
    if (cat.includes('rent') || cat.includes('license')) return Building;
    if (cat.includes('fees') || cat.includes('deposit')) return CreditCard;
    return Tag;
  };

  // Build statement summary text for WhatsApp/social sharing
  const statementSummaryText = useMemo(() => {
    const periodLabel =
      periodFilter === 'today'
        ? "Today's Movement"
        : periodFilter === 'this_week'
        ? 'This Week'
        : periodFilter === 'this_month'
        ? 'This Month'
        : 'All Time Recorded';

    return (
      `*DABIN FASHION HOUSE — FINANCIAL STATEMENT*\n` +
      `Nairobi, Kenya • ${OFFICIAL_BUSINESS_INFO.whatsappFormatted}\n` +
      `Period: ${periodLabel} (${new Date().toLocaleDateString()})\n\n` +
      `📊 *FINANCIAL SUMMARY:*\n` +
      `• Total Income (KES): Ksh ${metrics.incomeKes.toLocaleString()}\n` +
      `• Total Expenses (KES): Ksh ${metrics.expenseKes.toLocaleString()}\n` +
      `• Net Cashflow (KES): Ksh ${metrics.netKes.toLocaleString()}\n\n` +
      `• Total Income (USD): $${metrics.incomeUsd.toLocaleString()}\n` +
      `• Total Expenses (USD): $${metrics.expenseUsd.toLocaleString()}\n` +
      `• Net Cashflow (USD): $${metrics.netUsd.toLocaleString()}\n\n` +
      `Transactions recorded: ${filteredTransactions.length}\n` +
      `Generated by DABIN Staff Management System.`
    );
  }, [metrics, periodFilter, filteredTransactions]);

  return (
    <AdminLayout activeTab="finance">
      <div className="space-y-6">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#7B173B]/10 text-[#7B173B]">
                <ArrowDownUp className="w-5 h-5" />
              </span>
              <h1 className="font-serif-brand text-2xl font-bold text-[#171719]">
                {language === 'fr' ? 'Revenus & Dépenses' : 'Income & Expenses'}
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fr'
                ? 'Suivi des flux de trésorerie, entrées de fonds (POS, gros, acomptes) et sorties d’argent (balles, loyer, logistique, salaires).'
                : 'Track financial cash flow, cash inflows (POS, wholesale, deposits) and cash outflows (bales, rent, logistics, wages).'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Record Income (+ Green) */}
            <button
              type="button"
              onClick={() => handleOpenNewModal('income')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'fr' ? 'Enregistrer une Entrée' : 'Record Income'}</span>
            </button>

            {/* Record Expense (- Rose) */}
            <button
              type="button"
              onClick={() => handleOpenNewModal('expense')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Minus className="w-4 h-4" />
              <span>{language === 'fr' ? 'Enregistrer une Dépense' : 'Record Expense'}</span>
            </button>

            {/* Download Statement PDF */}
            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadStatement}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#7B173B] hover:bg-[#62122F] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download Statement as PDF"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>{isDownloadingPdf ? 'PDF...' : 'PDF'}</span>
            </button>

            {/* Share Statement Modal */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Share statement to WhatsApp, Instagram, TikTok, Facebook, etc."
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Partager' : 'Share'}</span>
            </button>

            {/* Print Statement */}
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#171719] hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Print financial statement via system printer dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Imprimer' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Executive Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Recorded Income */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {language === 'fr' ? 'Entrées Totales' : 'Total Income'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 space-y-0.5">
              <div className="text-2xl font-bold text-emerald-700">
                Ksh {metrics.incomeKes.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-gray-500">
                + ${metrics.incomeUsd.toLocaleString()} USD
              </div>
            </div>
          </div>

          {/* Card 2: Total Recorded Expenses */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {language === 'fr' ? 'Sorties Totales' : 'Total Expenses'}
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 space-y-0.5">
              <div className="text-2xl font-bold text-rose-700">
                Ksh {metrics.expenseKes.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-gray-500">
                + ${metrics.expenseUsd.toLocaleString()} USD
              </div>
            </div>
          </div>

          {/* Card 3: Net Cash Flow (KES) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {language === 'fr' ? 'Solde Net (KES)' : 'Net Cash Flow (KES)'}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  metrics.netKes >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 space-y-0.5">
              <div
                className={`text-2xl font-bold ${
                  metrics.netKes >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                Ksh {metrics.netKes.toLocaleString()}
              </div>
              <div className="text-xs font-medium text-gray-500">
                {metrics.netKes >= 0
                  ? language === 'fr'
                    ? 'Excédent de trésorerie'
                    : 'Operating Cash Surplus'
                  : language === 'fr'
                  ? 'Déficit de période'
                  : 'Cash Deficit'}
              </div>
            </div>
          </div>

          {/* Card 4: Net Cash Flow (USD) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {language === 'fr' ? 'Solde Net (USD)' : 'Net Cash Flow (USD)'}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  metrics.netUsd >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 space-y-0.5">
              <div
                className={`text-2xl font-bold ${
                  metrics.netUsd >= 0 ? 'text-blue-700' : 'text-rose-700'
                }`}
              >
                ${metrics.netUsd.toLocaleString()} USD
              </div>
              <div className="text-xs font-medium text-gray-500">
                {language === 'fr' ? 'Compte Devise / SWIFT' : 'USD Vault & Wire Account'}
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {language === 'fr' ? 'Tous les Mouvements' : 'All Transactions'}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('income')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  typeFilter === 'income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Entrées Uniquement' : 'Incomes'}</span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('expense')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  typeFilter === 'expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Dépenses Uniquement' : 'Expenses'}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'fr'
                    ? 'Rechercher par libellé, référence, fournisseur, client...'
                    : 'Search by title, reference, supplier, client...'
                }
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:border-[#7B173B]"
              />
            </div>
          </div>

          {/* Secondary Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 text-xs">
            {/* Period */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-hidden"
              >
                <option value="all">{language === 'fr' ? 'Toutes les dates' : 'All Dates'}</option>
                <option value="today">{language === 'fr' ? "Aujourd'hui" : 'Today'}</option>
                <option value="this_week">{language === 'fr' ? 'Cette semaine' : 'This Week'}</option>
                <option value="this_month">{language === 'fr' ? 'Ce mois-ci' : 'This Month'}</option>
                <option value="this_year">{language === 'fr' ? 'Cette année' : 'This Year'}</option>
              </select>
            </div>

            {/* Currency */}
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={currencyFilter}
                onChange={(e) => setCurrencyFilter(e.target.value as 'all' | 'KES' | 'USD')}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-hidden"
              >
                <option value="all">{language === 'fr' ? 'Toutes devises (KES + USD)' : 'All Currencies'}</option>
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
              </select>
            </div>

            {/* Category */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-hidden"
              >
                <option value="all">{language === 'fr' ? 'Toutes catégories' : 'All Categories'}</option>
                <optgroup label="Entrées / Income">
                  <option value="pos_sales">{getCategoryLabel('pos_sales')}</option>
                  <option value="wholesale_order">{getCategoryLabel('wholesale_order')}</option>
                  <option value="cargo_shipping_income">{getCategoryLabel('cargo_shipping_income')}</option>
                  <option value="tailoring_services">{getCategoryLabel('tailoring_services')}</option>
                  <option value="client_deposit">{getCategoryLabel('client_deposit')}</option>
                  <option value="other_income">{getCategoryLabel('other_income')}</option>
                </optgroup>
                <optgroup label="Dépenses / Expenses">
                  <option value="inventory_purchase">{getCategoryLabel('inventory_purchase')}</option>
                  <option value="freight_shipping">{getCategoryLabel('freight_shipping')}</option>
                  <option value="customs_clearance">{getCategoryLabel('customs_clearance')}</option>
                  <option value="rent_utilities">{getCategoryLabel('rent_utilities')}</option>
                  <option value="salaries_commissions">{getCategoryLabel('salaries_commissions')}</option>
                  <option value="packaging_materials">{getCategoryLabel('packaging_materials')}</option>
                  <option value="marketing_advertising">{getCategoryLabel('marketing_advertising')}</option>
                  <option value="financial_fees">{getCategoryLabel('financial_fees')}</option>
                  <option value="equipment_repairs">{getCategoryLabel('equipment_repairs')}</option>
                  <option value="taxes_licenses">{getCategoryLabel('taxes_licenses')}</option>
                  <option value="miscellaneous_expense">{getCategoryLabel('miscellaneous_expense')}</option>
                </optgroup>
              </select>
            </div>

            <span className="ml-auto text-xs text-gray-500">
              {filteredTransactions.length} {language === 'fr' ? 'mouvements trouvés' : 'records found'}
            </span>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">{language === 'fr' ? 'Type & Catégorie' : 'Type & Category'}</th>
                  <th className="py-3 px-4">{language === 'fr' ? 'Libellé / Référence' : 'Title & Reference'}</th>
                  <th className="py-3 px-4">{language === 'fr' ? 'Tiers (Bénéficiaire/Payeur)' : 'Party (To / From)'}</th>
                  <th className="py-3 px-4">{language === 'fr' ? 'Moyen de paiement' : 'Payment Method'}</th>
                  <th className="py-3 px-4 text-right">{language === 'fr' ? 'Montant' : 'Amount'}</th>
                  <th className="py-3 px-4 text-center">{language === 'fr' ? 'Statut' : 'Status'}</th>
                  <th className="py-3 px-4 text-right">{language === 'fr' ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      <ArrowDownUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="font-semibold text-gray-600">
                        {language === 'fr' ? 'Aucun mouvement trouvé' : 'No transactions recorded'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {language === 'fr'
                          ? 'Utilisez les boutons ci-dessus pour enregistrer une entrée ou une dépense.'
                          : 'Use the buttons above to record an income or expense.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const CatIcon = getCategoryIcon(tx.category);
                    const isIncome = tx.type === 'income';

                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono whitespace-nowrap text-gray-700">
                          {tx.date}
                        </td>

                        {/* Type & Category */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`p-1 rounded-md shrink-0 ${
                                isIncome
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isIncome ? (
                                <Plus className="w-3.5 h-3.5" />
                              ) : (
                                <Minus className="w-3.5 h-3.5" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider block ${
                                  isIncome ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {isIncome
                                  ? language === 'fr'
                                    ? 'Entrée'
                                    : 'Income'
                                  : language === 'fr'
                                  ? 'Dépense'
                                  : 'Expense'}
                              </span>
                              <span className="font-medium text-gray-900 truncate block">
                                {getCategoryLabel(tx.category)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Title & Reference */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-bold text-gray-900 truncate">{tx.title}</div>
                          {tx.referenceNumber && (
                            <div className="font-mono text-[10px] text-gray-500">
                              Ref: {tx.referenceNumber}
                            </div>
                          )}
                          {tx.notes && (
                            <div className="text-[10px] text-gray-400 italic truncate max-w-xs">
                              {tx.notes}
                            </div>
                          )}
                        </td>

                        {/* Party To / From */}
                        <td className="py-3.5 px-4 text-gray-700">
                          {tx.paidToOrFrom || '—'}
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-4 uppercase font-mono text-[11px] text-gray-600">
                          {tx.paymentMethod.replace(/_/g, ' ')}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div
                            className={`font-mono font-bold text-sm ${
                              isIncome ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isIncome ? '+' : '-'} {tx.currency === 'USD' ? '$' : 'Ksh '}
                            {tx.amount.toLocaleString()}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              tx.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEdit(tx)}
                              className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title={language === 'fr' ? 'Modifier' : 'Edit'}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(tx.id, tx.title)}
                              className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={language === 'fr' ? 'Supprimer' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* ADD / EDIT TRANSACTION MODAL */}
        {/* ======================================================== */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto no-print">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#171719] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      formType === 'income' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <h3 className="font-serif-brand text-lg font-bold">
                    {editingTxId
                      ? language === 'fr'
                        ? 'Modifier le Mouvement Financier'
                        : 'Edit Financial Transaction'
                      : formType === 'income'
                      ? language === 'fr'
                        ? 'Enregistrer une Entrée de Fonds'
                        : 'Record Inflow / Income'
                      : language === 'fr'
                      ? 'Enregistrer une Sortie / Dépense'
                      : 'Record Outflow / Expense'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                {/* Type Switcher */}
                <div className="flex rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setFormType('income')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      formType === 'income'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    + {language === 'fr' ? 'Entrée de Fonds (Income)' : 'Cash Inflow (Income)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('expense')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      formType === 'expense'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    - {language === 'fr' ? 'Sortie / Dépense (Expense)' : 'Cash Outflow (Expense)'}
                  </button>
                </div>

                {/* Amount and Currency */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      {language === 'fr' ? 'Montant *' : 'Amount *'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="0.00"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono font-bold focus:border-[#7B173B] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      {language === 'fr' ? 'Devise' : 'Currency'}
                    </label>
                    <select
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value as CurrencyCode)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-bold focus:border-[#7B173B] focus:outline-hidden bg-white"
                    >
                      <option value="KES">KES (Ksh)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>

                {/* Title / Description */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {language === 'fr' ? 'Libellé du mouvement *' : 'Transaction Description *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      formType === 'income'
                        ? 'e.g. Vente Showroom POS, Acompte Commande Bukavu...'
                        : 'e.g. Achat Balles Friperie Europe, Loyer Showroom, Fret Goma...'
                    }
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:border-[#7B173B] focus:outline-hidden"
                  />
                </div>

                {/* Category & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      {language === 'fr' ? 'Catégorie' : 'Category'}
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:border-[#7B173B] focus:outline-hidden bg-white"
                    >
                      {formType === 'income' ? (
                        <>
                          <option value="pos_sales">{getCategoryLabel('pos_sales')}</option>
                          <option value="wholesale_order">{getCategoryLabel('wholesale_order')}</option>
                          <option value="cargo_shipping_income">{getCategoryLabel('cargo_shipping_income')}</option>
                          <option value="tailoring_services">{getCategoryLabel('tailoring_services')}</option>
                          <option value="client_deposit">{getCategoryLabel('client_deposit')}</option>
                          <option value="other_income">{getCategoryLabel('other_income')}</option>
                        </>
                      ) : (
                        <>
                          <option value="inventory_purchase">{getCategoryLabel('inventory_purchase')}</option>
                          <option value="freight_shipping">{getCategoryLabel('freight_shipping')}</option>
                          <option value="customs_clearance">{getCategoryLabel('customs_clearance')}</option>
                          <option value="rent_utilities">{getCategoryLabel('rent_utilities')}</option>
                          <option value="salaries_commissions">{getCategoryLabel('salaries_commissions')}</option>
                          <option value="packaging_materials">{getCategoryLabel('packaging_materials')}</option>
                          <option value="marketing_advertising">{getCategoryLabel('marketing_advertising')}</option>
                          <option value="financial_fees">{getCategoryLabel('financial_fees')}</option>
                          <option value="equipment_repairs">{getCategoryLabel('equipment_repairs')}</option>
                          <option value="taxes_licenses">{getCategoryLabel('taxes_licenses')}</option>
                          <option value="miscellaneous_expense">{getCategoryLabel('miscellaneous_expense')}</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      {language === 'fr' ? 'Date' : 'Date'}
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:border-[#7B173B] focus:outline-hidden bg-white"
                    />
                  </div>
                </div>

                {/* Payment Method & Reference */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      {language === 'fr' ? 'Moyen de paiement' : 'Payment Method'}
                    </label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:border-[#7B173B] focus:outline-hidden bg-white"
                    >
                      <option value="mpesa">M-Pesa (Till / Paybill)</option>
                      <option value="bank_transfer">Bank Transfer (Equity Bank)</option>
                      <option value="swift_usd">SWIFT USD Wire</option>
                      <option value="cash">Cash / Espèces</option>
                      <option value="card">Debit / Credit Card</option>
                      <option value="cheque">Cheque</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      {language === 'fr' ? 'Code / Réf Transaction' : 'Ref Code / Voucher #'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. MP-89201LK, REC-102"
                      value={formReferenceNumber}
                      onChange={(e) => setFormReferenceNumber(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs font-mono focus:border-[#7B173B] focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Paid To / Received From */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {formType === 'income'
                      ? language === 'fr'
                        ? 'Reçu de (Nom du Client ou Source)'
                        : 'Received From (Client / Source)'
                      : language === 'fr'
                      ? 'Payé à (Fournisseur, Bailleur, Transporteur...)'
                      : 'Paid To (Supplier, Landlord, Transporter...)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EuroTextile Ltd, Alain Kanyamihigo, Kivu Express..."
                    value={formPaidToOrFrom}
                    onChange={(e) => setFormPaidToOrFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:border-[#7B173B] focus:outline-hidden"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {language === 'fr' ? 'Notes internes / Justificatifs' : 'Internal Notes / Audit Memo'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={
                      language === 'fr'
                        ? 'Détails complémentaires, numéro de bordereau de fret, etc.'
                        : 'Additional transaction notes, waybill numbers, etc.'
                    }
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs focus:border-[#7B173B] focus:outline-hidden"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    {language === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      formType === 'income'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {editingTxId
                      ? language === 'fr'
                        ? 'Enregistrer les modifications'
                        : 'Save Changes'
                      : formType === 'income'
                      ? language === 'fr'
                        ? 'Confirmer l’Entrée'
                        : 'Record Income'
                      : language === 'fr'
                      ? 'Confirmer la Dépense'
                      : 'Record Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* SHARE MODAL INTEGRATION */}
        {/* ======================================================== */}
        <ShareDocumentModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          targetElementId="printable-finance-report"
          documentTitle={`DABIN Fashion — Financial Cash Flow Statement (${new Date().toLocaleDateString()})`}
          documentNumber={`STATEMENT-${new Date().toISOString().split('T')[0]}`}
          fileName={`DABIN-Financial-Statement-${new Date().toISOString().split('T')[0]}.pdf`}
          summaryText={statementSummaryText}
          language={language}
          onSent={(channel) => {
            showToast(
              language === 'fr'
                ? `Relevé financier partagé via ${channel} !`
                : `Financial statement shared via ${channel}!`
            );
          }}
        />

        {/* ======================================================== */}
        {/* PRINTABLE FINANCIAL STATEMENT FOR HIGH-RES PDF & PRINT */}
        {/* ======================================================== */}
        <div className="fixed -left-[9999px] top-0 pointer-events-none opacity-100 z-[-100]">
          <div
            id="printable-finance-report"
            className="p-8 max-w-4xl w-[800px] mx-auto space-y-6 bg-white text-gray-900 font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-gray-900 pb-5">
              <div className="space-y-1">
                <DabinLogo size="md" sloganLanguage={language} />
                <p className="text-xs text-gray-600 font-medium pt-1">
                  {OFFICIAL_BUSINESS_INFO.location} • Tel: {OFFICIAL_BUSINESS_INFO.phone}
                </p>
                <p className="text-xs text-gray-500">Email: {OFFICIAL_BUSINESS_INFO.email}</p>
              </div>
              <div className="text-right space-y-1">
                <span className="px-3 py-1 bg-[#7B173B] text-white text-xs font-bold uppercase tracking-widest rounded">
                  FINANCIAL CASH FLOW STATEMENT
                </span>
                <p className="text-xs text-gray-600 pt-1">
                  Date: {new Date().toLocaleDateString()}
                </p>
                <p className="text-xs font-mono text-gray-500">
                  Ref: STMT-{new Date().toISOString().split('T')[0]}
                </p>
              </div>
            </div>

            {/* Financial Overview Metrics */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  Total Income Recorded
                </span>
                <span className="text-base font-bold text-emerald-700 block">
                  Ksh {metrics.incomeKes.toLocaleString()}
                </span>
                <span className="text-xs text-gray-600">
                  + ${metrics.incomeUsd.toLocaleString()} USD
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  Total Expenses Recorded
                </span>
                <span className="text-base font-bold text-rose-700 block">
                  Ksh {metrics.expenseKes.toLocaleString()}
                </span>
                <span className="text-xs text-gray-600">
                  + ${metrics.expenseUsd.toLocaleString()} USD
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-500 block">
                  Net Cash Position
                </span>
                <span
                  className={`text-base font-bold block ${
                    metrics.netKes >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  Ksh {metrics.netKes.toLocaleString()}
                </span>
                <span className="text-xs text-gray-600">
                  Net USD: ${metrics.netUsd.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Itemized Movement Schedule ({filteredTransactions.length} items)
              </h4>
              <table className="w-full text-left text-xs border border-gray-300 border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-bold text-gray-700">
                    <th className="p-2">Date</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Description & Reference</th>
                    <th className="p-2">Party</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-mono text-[11px]">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="p-2">{tx.date}</td>
                      <td className="p-2 font-bold uppercase">
                        {tx.type === 'income' ? '+ Income' : '- Expense'}
                      </td>
                      <td className="p-2">{getCategoryLabel(tx.category)}</td>
                      <td className="p-2 font-sans font-medium">
                        {tx.title}
                        {tx.referenceNumber && (
                          <span className="block text-[10px] text-gray-500 font-mono">
                            Ref: {tx.referenceNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-2">{tx.paidToOrFrom || '—'}</td>
                      <td className="p-2 text-right font-bold">
                        {tx.type === 'income' ? '+' : '-'} {tx.currency}{' '}
                        {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Audit & Sign-off Footer */}
            <div className="pt-6 border-t border-gray-300 flex justify-between items-end text-xs text-gray-600">
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">DABIN Fashion House Nairobi</p>
                <p className="text-[10px] text-gray-500">
                  Generated by Authorized Personnel • Official Management Statement
                </p>
              </div>
              <div className="text-right space-y-2">
                <div className="w-48 border-b border-gray-400"></div>
                <p className="text-[10px] font-bold text-gray-700 uppercase">
                  Authorized Signatory & Stamp
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
