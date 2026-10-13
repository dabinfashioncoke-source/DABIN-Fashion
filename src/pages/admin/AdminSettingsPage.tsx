import React, { useState } from 'react';
import {
  Settings,
  DollarSign,
  Globe,
  Sliders,
  Save,
  CheckCircle,
  Database,
  Download,
  Upload,
  RefreshCw,
  Truck,
  Plus,
  Trash2,
  Edit,
  X,
  CreditCard,
  Building2,
  Smartphone,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { CurrencyCode, DeliveryDestination, Language, WebsiteSettings } from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const { language, t, refreshSettings, settings } = useApp();

  const [formSettings, setFormSettings] = useState<WebsiteSettings>(() => storage.getSettings());
  const [destinations, setDestinations] = useState<DeliveryDestination[]>(() =>
    storage.getDestinations()
  );

  // New Destination Modal
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<Partial<DeliveryDestination> | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateSettings(formSettings);
    refreshSettings();
    setFeedback(language === 'fr' ? 'Paramètres sauvegardés avec succès.' : 'Settings saved successfully.');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleExportBackup = () => {
    const json = storage.exportFullDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dabin_fashion_database_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storage.restoreDatabaseFromJson(content);
        if (success) {
          refreshSettings();
          setFormSettings(storage.getSettings());
          setDestinations(storage.getDestinations());
          setImportStatus('Database restored successfully! Page data refreshed.');
        } else {
          setImportStatus('Invalid JSON backup file structure.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleFactoryReset = () => {
    const confirmReset = window.confirm(
      language === 'fr'
        ? 'Attention : Voulez-vous vraiment réinitialiser la base de données aux données d’usine ?'
        : 'Warning: Are you sure you want to reset all data to initial factory seeds?'
    );
    if (!confirmReset) return;

    storage.resetToFactoryDefaults();
    refreshSettings();
    setFormSettings(storage.getSettings());
    setDestinations(storage.getDestinations());
    alert('Factory data restored.');
    window.location.reload();
  };

  // Destination Management
  const handleOpenAddDest = () => {
    setEditingDest({
      city: '',
      country: 'DR Congo',
      active: true,
      estimatedTransitTimeEn: '3 – 5 days via cargo partners',
      estimatedTransitTimeFr: '3 à 5 jours via transporteurs partenaires',
      shippingNotesEn: '',
      shippingNotesFr: '',
      order: destinations.length + 1,
    });
    setIsDestModalOpen(true);
  };

  const handleSaveDest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDest || !editingDest.city?.trim()) return;

    const newDest: DeliveryDestination = {
      id: editingDest.id || `dest-${editingDest.city.toLowerCase().replace(/\s+/g, '-')}`,
      city: editingDest.city,
      country: editingDest.country || 'DR Congo',
      active: editingDest.active ?? true,
      estimatedTransitTimeEn: editingDest.estimatedTransitTimeEn || '',
      estimatedTransitTimeFr: editingDest.estimatedTransitTimeFr || '',
      shippingNotesEn: editingDest.shippingNotesEn || '',
      shippingNotesFr: editingDest.shippingNotesFr || '',
      order: editingDest.order || destinations.length + 1,
    };

    storage.saveDestination(newDest);
    setDestinations(storage.getDestinations());
    setIsDestModalOpen(false);
  };

  return (
    <AdminLayout activeTab="settings">
      <div className="space-y-8 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
            {t.settings.title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {t.settings.subtitle}
          </p>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>{feedback}</span>
            </div>
            <button type="button" onClick={() => setFeedback(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Currency & Exchange Rate Section */}
        <form onSubmit={handleSaveSettings} className="space-y-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <DollarSign className="w-4 h-4 text-[#7B173B]" />
              <h3 className="font-serif-brand text-lg font-bold">
                {t.settings.currencyHeading}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div>
                <label className="font-semibold block mb-1">
                  {t.settings.defaultCurrency}
                </label>
                <select
                  value={formSettings.defaultCurrency}
                  onChange={(e) =>
                    setFormSettings((prev) => ({
                      ...prev,
                      defaultCurrency: e.target.value as CurrencyCode,
                    }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                >
                  <option value="KES">Kenyan Shilling (KES)</option>
                  <option value="USD">United States Dollar (USD)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  {t.settings.exchangeRateLabel} *
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-500">1 USD =</span>
                  <input
                    type="number"
                    required
                    min={1}
                    step="0.1"
                    value={formSettings.exchangeRateUsdToKes}
                    onChange={(e) =>
                      setFormSettings((prev) => ({
                        ...prev,
                        exchangeRateUsdToKes: Number(e.target.value),
                      }))
                    }
                    className="w-32 p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-bold font-mono"
                  />
                  <span className="font-mono font-bold text-gray-500">KES</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {t.settings.exchangeRateNotice}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Public Storefront Controls */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Sliders className="w-4 h-4 text-[#7B173B]" />
              <h3 className="font-serif-brand text-lg font-bold">
                {t.settings.storefrontHeading}
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSettings.publicStockVisible}
                  onChange={(e) =>
                    setFormSettings((prev) => ({
                      ...prev,
                      publicStockVisible: e.target.checked,
                    }))
                  }
                  className="mt-0.5 rounded text-[#7B173B]"
                />
                <div>
                  <span className="font-semibold text-gray-900 block">
                    {t.settings.publicStockVisibility}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    {t.settings.publicStockDesc}
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formSettings.onlineCheckoutEnabled}
                  onChange={(e) =>
                    setFormSettings((prev) => ({
                      ...prev,
                      onlineCheckoutEnabled: e.target.checked,
                    }))
                  }
                  className="mt-0.5 rounded text-[#7B173B]"
                />
                <div>
                  <span className="font-semibold text-gray-900 block">
                    {t.settings.onlineCheckoutToggle}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    {t.settings.onlineCheckoutDesc}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Homepage Headlines CMS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Globe className="w-4 h-4 text-[#7B173B]" />
              <h3 className="font-serif-brand text-lg font-bold">
                {language === 'fr' ? 'Textes d’accueil (CMS)' : 'Homepage Hero Text (CMS)'}
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Hero Title (English)</label>
                  <input
                    type="text"
                    value={formSettings.heroHeadlineEn}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, heroHeadlineEn: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Titre Hero (Français)</label>
                  <input
                    type="text"
                    value={formSettings.heroHeadlineFr}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, heroHeadlineFr: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold block mb-1">Hero Subtitle (English)</label>
                  <textarea
                    rows={2}
                    value={formSettings.heroSubtitleEn}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, heroSubtitleEn: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Sous-titre Hero (Français)</label>
                  <textarea
                    rows={2}
                    value={formSettings.heroSubtitleFr}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, heroSubtitleFr: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. About Us Text CMS */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="font-serif-brand text-lg font-bold">
              {language === 'fr' ? 'Page À Propos (CMS)' : 'About Us Narrative (CMS)'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">About Text (English)</label>
                <textarea
                  rows={5}
                  value={formSettings.aboutTextEn}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, aboutTextEn: e.target.value }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Texte À Propos (Français)</label>
                <textarea
                  rows={5}
                  value={formSettings.aboutTextFr}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, aboutTextFr: e.target.value }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* 5. Payment & Banking Details CMS (Quotations, Invoices & Receipts) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#7B173B]/10 rounded-xl text-[#7B173B]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                    {language === 'fr'
                      ? 'Coordonnées de Règlement & Bancaires (Devis, Factures & Reçus)'
                      : 'Payment & Banking Details (Quotations, Invoices & Receipts)'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {language === 'fr'
                      ? 'Remplissez manuellement ces champs. Une fois sauvegardés, ils s’insèrent automatiquement sur les devis, factures et reçus.'
                      : 'Fill these in manually. Once saved, they will auto-fill on Quotations, Invoices, and Receipts. If blank, they will not appear.'}
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2">
                {Boolean(
                  formSettings.mpesaTillNumber?.trim() ||
                  formSettings.mpesaPaybillNumber?.trim() ||
                  formSettings.bankName?.trim() ||
                  formSettings.bankAccountNumber?.trim()
                ) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {language === 'fr' ? 'Actif sur les documents' : 'Active on Documents'}
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>
                      {language === 'fr' ? 'Non rempli (masqué sur documents)' : 'Not filled yet (hidden on documents)'}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Helper banner with quick actions */}
            <div className="p-3.5 bg-[#F8F8FA] rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="text-gray-600 text-[11px] leading-relaxed">
                <span className="font-semibold text-gray-900 block mb-0.5">
                  {language === 'fr'
                    ? 'Gestion centralisée du règlement client :'
                    : 'Centralized Payment Channels Management:'}
                </span>
                {language === 'fr'
                  ? 'Pour afficher vos canaux de paiement sur les versions imprimées/WhatsApp de vos documents, renseignez-les ci-dessous puis cliquez sur « Enregistrer les modifications ». Pour les masquer, laissez les champs vides.'
                  : 'To display payment instructions on printable and WhatsApp documents, enter them below and click "Save Changes". Leave empty to omit.'}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFormSettings((prev) => ({
                      ...prev,
                      mpesaTillNumber: '',
                      mpesaPaybillNumber: '',
                      mpesaPaybillAccount: '',
                      bankName: '',
                      bankAccountNumber: '',
                      bankSwiftCode: '',
                      bankBranchNotes: '',
                    }));
                  }}
                  className="px-2.5 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 font-medium text-[11px] rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'fr' ? 'Réinitialiser les champs' : 'Clear fields'}
                </button>
              </div>
            </div>

            {/* Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* M-Pesa Buy Goods Till */}
              <div>
                <label className="font-semibold block mb-1 text-gray-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>M-Pesa Buy Goods Till</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456"
                  value={formSettings.mpesaTillNumber || ''}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, mpesaTillNumber: e.target.value }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:bg-white focus:border-[#7B173B] outline-hidden font-mono"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  {language === 'fr' ? 'Numéro de Till Marchand (Buy Goods)' : 'Merchant Till number for Buy Goods'}
                </span>
              </div>

              {/* M-Pesa Paybill */}
              <div>
                <label className="font-semibold block mb-1 text-gray-800 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>M-Pesa Paybill Number</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 6-digit Business No."
                  value={formSettings.mpesaPaybillNumber || ''}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, mpesaPaybillNumber: e.target.value }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:bg-white focus:border-[#7B173B] outline-hidden font-mono"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  {language === 'fr' ? 'Numéro de Paybill d’entreprise' : 'Business Paybill number'}
                </span>
              </div>

              {/* M-Pesa Account Name / Ref */}
              <div>
                <label className="font-semibold block mb-1 text-gray-800">
                  <span>M-Pesa Account (A/C)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BUSINESS_NAME"
                  value={formSettings.mpesaPaybillAccount || ''}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, mpesaPaybillAccount: e.target.value }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:bg-white focus:border-[#7B173B] outline-hidden"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  {language === 'fr' ? 'Nom ou référence de compte Paybill' : 'Account name or reference for Paybill'}
                </span>
              </div>

              {/* Bank Name */}
              <div>
                <label className="font-semibold block mb-1 text-gray-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{language === 'fr' ? 'Nom de la Banque' : 'Bank Name'}</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank Name Kenya"
                  value={formSettings.bankName || ''}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:bg-white focus:border-[#7B173B] outline-hidden"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  {language === 'fr' ? 'Établissement bancaire récepteur' : 'Receiving financial institution'}
                </span>
              </div>

              {/* Bank Account Number */}
              <div>
                <label className="font-semibold block mb-1 text-gray-800">
                  <span>{language === 'fr' ? 'Numéro de Compte' : 'Bank Account Number'}</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 0123456789 (KES / USD)"
                  value={formSettings.bankAccountNumber || ''}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, bankAccountNumber: e.target.value }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:bg-white focus:border-[#7B173B] outline-hidden font-mono"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  {language === 'fr' ? 'Numéro de compte avec libellé de devise' : 'Account number with currency label'}
                </span>
              </div>

              {/* SWIFT Code */}
              <div>
                <label className="font-semibold block mb-1 text-gray-800">
                  <span>SWIFT / BIC Code (USD Wire)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BANKKENA"
                  value={formSettings.bankSwiftCode || ''}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, bankSwiftCode: e.target.value }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:bg-white focus:border-[#7B173B] outline-hidden font-mono uppercase"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  {language === 'fr' ? 'Code SWIFT pour virements internationaux' : 'SWIFT code for international wires'}
                </span>
              </div>

              {/* Bank Branch / Notes */}
              <div>
                <label className="font-semibold block mb-1 text-gray-800">
                  <span>{language === 'fr' ? 'Agence / Instructions' : 'Bank Branch / Notes'}</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Supreme Branch / Wire Transfer"
                  value={formSettings.bankBranchNotes || ''}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, bankBranchNotes: e.target.value }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:bg-white focus:border-[#7B173B] outline-hidden"
                />
              </div>

              {/* Tax / KRA PIN */}
              <div>
                <label className="font-semibold block mb-1 text-gray-800">
                  <span>{language === 'fr' ? 'Numéro KRA PIN / Fiscal' : 'Tax PIN / KRA PIN (Optional)'}</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. P051234567Z"
                  value={formSettings.taxPinNumber || ''}
                  onChange={(e) =>
                    setFormSettings((prev) => ({ ...prev, taxPinNumber: e.target.value }))
                  }
                  className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:bg-white focus:border-[#7B173B] outline-hidden font-mono"
                />
                <span className="text-[10px] text-gray-400 block mt-1">
                  {language === 'fr' ? 'Affiché sur l’en-tête fiscal des factures' : 'Displayed on official invoice header'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#7B173B] hover:bg-[#62122F] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{t.common.save}</span>
            </button>
          </div>
        </form>

        {/* 5. Delivery Destinations Management */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#7B173B]" />
              <h3 className="font-serif-brand text-lg font-bold">
                {language === 'fr' ? 'Destinations Régionales Desservies' : 'Regional Delivery Destinations'}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleOpenAddDest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171719] text-white rounded-lg text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add City</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {destinations.map((dest) => (
              <div
                key={dest.id}
                className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-gray-900">{dest.city}</div>
                  <div className="text-[11px] text-gray-500">
                    {dest.country} · {dest.active ? 'Active' : 'Hidden'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDest({ ...dest });
                    setIsDestModalOpen(true);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-900"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Database JSON Backup & Factory Reset */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Database className="w-4 h-4 text-[#7B173B]" />
            <h3 className="font-serif-brand text-lg font-bold">
              {t.settings.backupHeading}
            </h3>
          </div>

          {importStatus && (
            <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs border border-blue-200">
              {importStatus}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#171719] hover:bg-[#25252A] text-white rounded-xl font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>{t.settings.exportDataBtn}</span>
            </button>

            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-colors">
              <Upload className="w-4 h-4" />
              <span>{t.settings.importDataBtn}</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleFactoryReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-semibold border border-rose-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t.settings.resetDataBtn}</span>
            </button>
          </div>
        </div>

        {/* Destination Modal */}
        {isDestModalOpen && editingDest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-serif-brand text-lg font-bold">Manage Destination City</h3>
                <button type="button" onClick={() => setIsDestModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
                </button>
              </div>

              <form onSubmit={handleSaveDest} className="space-y-3">
                <div>
                  <label className="font-semibold block mb-1">City Name *</label>
                  <input
                    type="text"
                    required
                    value={editingDest.city || ''}
                    onChange={(e) =>
                      setEditingDest((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Country *</label>
                  <select
                    value={editingDest.country}
                    onChange={(e) =>
                      setEditingDest((prev) => ({ ...prev, country: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  >
                    <option value="DR Congo">Democratic Republic of the Congo (DR Congo)</option>
                    <option value="Burundi">Burundi</option>
                    <option value="Kenya">Kenya</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Transit Time Note (Français)</label>
                  <input
                    type="text"
                    value={editingDest.estimatedTransitTimeFr || ''}
                    onChange={(e) =>
                      setEditingDest((prev) => ({
                        ...prev,
                        estimatedTransitTimeFr: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Transit Time Note (English)</label>
                  <input
                    type="text"
                    value={editingDest.estimatedTransitTimeEn || ''}
                    onChange={(e) =>
                      setEditingDest((prev) => ({
                        ...prev,
                        estimatedTransitTimeEn: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsDestModalOpen(false)}
                    className="px-3 py-2 border border-gray-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#7B173B] text-white font-semibold rounded-xl"
                  >
                    Save City
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
