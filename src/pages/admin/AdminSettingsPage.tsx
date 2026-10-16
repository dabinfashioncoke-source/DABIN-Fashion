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
  Layers,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Radio,
  Image as ImageIcon,
  ShieldAlert,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import {
  Category,
  CurrencyCode,
  DeliveryDestination,
  WebsiteSettings,
} from '../../types';

export const AdminSettingsPage: React.FC = () => {
  const {
    language,
    t,
    refreshSettings,
    refreshData,
    settings,
    categories: contextCategories,
    destinations: contextDestinations,
    isLiveConnected,
    lastSyncTime,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'storefront' | 'contact' | 'categories' | 'destinations' | 'payments' | 'currency' | 'backup'
  >('storefront');

  const [formSettings, setFormSettings] = useState<WebsiteSettings>(() => storage.getSettings());
  const [destinations, setDestinations] = useState<DeliveryDestination[]>(() =>
    storage.getDestinations()
  );
  const [categoriesList, setCategoriesList] = useState<Category[]>(() =>
    storage.getCategories()
  );

  // Modals
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<Partial<DeliveryDestination> | null>(null);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<Category> | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateSettings(formSettings);
    refreshSettings();
    await refreshData();
    setFeedback(
      language === 'fr'
        ? 'Modifications publiées et diffusées en temps réel sur tout le site.'
        : 'Changes published and broadcasted live across the entire website.'
    );
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
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = storage.restoreDatabaseFromJson(content);
        if (success) {
          // Push batch to server
          const fullDb = JSON.parse(content);
          storage.postToServer('/api/database', fullDb);
          await refreshData();
          setFormSettings(storage.getSettings());
          setDestinations(storage.getDestinations());
          setCategoriesList(storage.getCategories());
          setImportStatus('Database restored successfully and synchronized with server!');
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
        ? 'Attention : Voulez-vous vraiment réinitialiser toutes les données aux valeurs d’usine ?'
        : 'Warning: Are you sure you want to reset all data to initial factory seeds?'
    );
    if (!confirmReset) return;

    storage.resetToFactoryDefaults();
    storage.syncFromServer();
    refreshSettings();
    setFormSettings(storage.getSettings());
    setDestinations(storage.getDestinations());
    setCategoriesList(storage.getCategories());
    setFeedback(language === 'fr' ? 'Données d’usine restaurées avec succès.' : 'Factory data restored successfully.');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  // --- DESTINATIONS MANAGEMENT ---
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

  const handleSaveDest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDest || !editingDest.city?.trim()) return;

    const newDest: DeliveryDestination = {
      id: editingDest.id || `dest-${editingDest.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      city: editingDest.city.trim(),
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
    await refreshData();
    setIsDestModalOpen(false);
  };

  const handleDeleteDest = async (id: string) => {
    if (!window.confirm(language === 'fr' ? 'Supprimer cette ville ?' : 'Delete this city?')) return;
    storage.deleteDestination(id);
    setDestinations(storage.getDestinations());
    await refreshData();
  };

  // --- CATEGORIES MANAGEMENT ---
  const handleOpenAddCategory = () => {
    setEditingCat({
      id: `cat-${Date.now()}`,
      nameEn: '',
      nameFr: '',
      slug: '',
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
      subcategories: [],
    });
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editingCat.nameEn?.trim() || !editingCat.nameFr?.trim()) {
      setFeedback(language === 'fr' ? 'Veuillez saisir les noms en français et en anglais.' : 'Please enter English and French names.');
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    const catToSave: Category = {
      id: editingCat.id || `cat-${Date.now()}`,
      nameEn: editingCat.nameEn.trim(),
      nameFr: editingCat.nameFr.trim(),
      slug: editingCat.slug?.trim() || editingCat.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      imageUrl: editingCat.imageUrl?.trim() || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
      subcategories: editingCat.subcategories || [],
    };

    storage.saveCategory(catToSave);
    setCategoriesList(storage.getCategories());
    await refreshData();
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!window.confirm(language === 'fr' ? `Supprimer la catégorie « ${cat.nameFr} » ?` : `Delete category "${cat.nameEn}"?`)) return;
    storage.deleteCategory(cat.id);
    setCategoriesList(storage.getCategories());
    await refreshData();
  };

  // WhatsApp quick tester
  const whatsappCleaned = (formSettings.whatsappNumber || '').replace(/[^0-9]/g, '');

  return (
    <AdminLayout activeTab="settings">
      <div className="space-y-6 max-w-5xl">
        {/* Header & Live Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
                {language === 'fr' ? 'Configuration & Personnalisation du Site' : 'Storefront CMS & Website Settings'}
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fr'
                ? 'Toute modification enregistrée ici modifie instantanément l’apparence et les contenus du site public pour chaque visiteur.'
                : 'Every change saved here instantly updates the public website layout, copy, and contacts for all visitors.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border ${
                isLiveConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
              title="Live synchronization status"
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveConnected ? 'animate-pulse text-emerald-600' : 'text-blue-500'}`} />
              <span>{isLiveConnected ? (language === 'fr' ? 'Diffusion en direct active' : 'Live Sync Online') : (language === 'fr' ? 'Synchronisé avec le serveur' : 'Synced with Server')}</span>
            </span>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{feedback}</span>
            </div>
            <button type="button" onClick={() => setFeedback(null)}>
              <X className="w-4 h-4 text-emerald-700 hover:text-emerald-900" />
            </button>
          </div>
        )}

        {/* Sub-Tabs Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          {[
            { id: 'storefront', label: language === 'fr' ? 'Vitrine & Textes (CMS)' : 'Storefront & Copy (CMS)', icon: Globe },
            { id: 'contact', label: language === 'fr' ? 'Contacts & WhatsApp' : 'Contact & WhatsApp', icon: Smartphone },
            { id: 'currency', label: language === 'fr' ? 'Devises & Taux' : 'Currencies & Rates', icon: DollarSign },
            { id: 'categories', label: language === 'fr' ? 'Rayons & Catégories' : 'Departments & Categories', icon: Layers },
            { id: 'destinations', label: language === 'fr' ? 'Villes Desservies' : 'Delivery Destinations', icon: Truck },
            { id: 'payments', label: language === 'fr' ? 'Règlement & Banque' : 'Banking & Payments', icon: CreditCard },
            { id: 'backup', label: language === 'fr' ? 'Sauvegarde & Données' : 'Backup & Reset', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#7B173B] text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: STOREFRONT & CMS                                   */}
        {/* ======================================================== */}
        {activeSubTab === 'storefront' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Top Announcement Bar */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#7B173B]" />
                  <h3 className="font-serif-brand text-lg font-bold">
                    {language === 'fr' ? 'Bandeau d’annonce supérieur (Navbar)' : 'Top Announcement Banner (Navbar)'}
                  </h3>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={formSettings.showAnnouncementBar ?? true}
                    onChange={(e) =>
                      setFormSettings((prev) => ({
                        ...prev,
                        showAnnouncementBar: e.target.checked,
                      }))
                    }
                    className="rounded text-[#7B173B]"
                  />
                  <span>{language === 'fr' ? 'Afficher le bandeau' : 'Enable banner'}</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Texte d’annonce (Français)</label>
                  <input
                    type="text"
                    value={formSettings.announcementTextFr || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, announcementTextFr: e.target.value }))
                    }
                    placeholder="Expéditions vers la RDC (Bukavu, Goma, Bunia...) & Burundi"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Announcement Text (English)</label>
                  <input
                    type="text"
                    value={formSettings.announcementTextEn || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, announcementTextEn: e.target.value }))
                    }
                    placeholder="Dispatches to DR Congo (Bukavu, Goma, Bunia...) & Burundi"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Brand Slogans & Mottos */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Globe className="w-4 h-4 text-[#7B173B]" />
                <h3 className="font-serif-brand text-lg font-bold">
                  {language === 'fr' ? 'Devises & Slogans Officiels de la Marque' : 'Official Brand Slogans & Motto'}
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Slogan Principal (Français)</label>
                  <input
                    type="text"
                    value={formSettings.primarySloganFr || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, primarySloganFr: e.target.value }))
                    }
                    placeholder="La mode et la qualité plus proches de vous"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    Affiché sous le logo et sur la page À Propos.
                  </span>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Official Motto (English)</label>
                  <input
                    type="text"
                    value={formSettings.englishSlogan || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, englishSlogan: e.target.value }))
                    }
                    placeholder="Bringing quality fashion closer to you"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    Shown under logo and throughout international copy.
                  </span>
                </div>
              </div>
            </div>

            {/* Homepage Hero Headline & Subtitle */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Sliders className="w-4 h-4 text-[#7B173B]" />
                <h3 className="font-serif-brand text-lg font-bold">
                  {language === 'fr' ? 'Bannière d’accueil (Hero Section)' : 'Homepage Hero Section (CMS)'}
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Sous-titre Hero (Français)</label>
                    <textarea
                      rows={3}
                      value={formSettings.heroSubtitleFr}
                      onChange={(e) =>
                        setFormSettings((prev) => ({ ...prev, heroSubtitleFr: e.target.value }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Hero Subtitle (English)</label>
                    <textarea
                      rows={3}
                      value={formSettings.heroSubtitleEn}
                      onChange={(e) =>
                        setFormSettings((prev) => ({ ...prev, heroSubtitleEn: e.target.value }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* About Us Narrative */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="font-serif-brand text-lg font-bold">
                {language === 'fr' ? 'Récit & Mission sur la Page À Propos (CMS)' : 'About Us Page Story (CMS)'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">Texte de Présentation (Français)</label>
                  <textarea
                    rows={6}
                    value={formSettings.aboutTextFr}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, aboutTextFr: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-sans"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Presentation Narrative (English)</label>
                  <textarea
                    rows={6}
                    value={formSettings.aboutTextEn}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, aboutTextEn: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-sans"
                  />
                </div>
              </div>
            </div>

            {/* Public Stock Visibility & Maintenance Mode */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="font-serif-brand text-lg font-bold">
                {language === 'fr' ? 'Options d’Affichage & Disponibilité' : 'Display & Storefront Access'}
              </h3>
              <div className="space-y-3 text-xs">
                <label className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl cursor-pointer border border-gray-200/80">
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
                      {language === 'fr'
                        ? 'Si coché, les visiteurs voient les quantités exactes en stock (« 4 pièces disponibles »). Si décoché, seul le statut (« En stock ») apparaît.'
                        : 'If checked, visitors see exact stock counts. If unchecked, visitors only see in-stock or low-stock badges.'}
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl cursor-pointer border border-gray-200/80">
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

                {/* Maintenance Mode */}
                <label className={`flex items-start gap-3 p-3.5 rounded-xl cursor-pointer border transition-colors ${
                  formSettings.maintenanceMode
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                }`}>
                  <input
                    type="checkbox"
                    checked={formSettings.maintenanceMode}
                    onChange={(e) =>
                      setFormSettings((prev) => ({
                        ...prev,
                        maintenanceMode: e.target.checked,
                      }))
                    }
                    className="mt-0.5 rounded text-[#7B173B]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>{language === 'fr' ? 'Mode Maintenance Programmée' : 'Maintenance Mode'}</span>
                    </div>
                    <span className="text-[11px] opacity-80 block mt-0.5">
                      {language === 'fr'
                        ? 'Active un écran de maintenance poli pour les visiteurs avec renvoi vers WhatsApp, tout en laissant l’espace d’administration accessible au propriétaire.'
                        : 'Puts public website into maintenance mode with direct WhatsApp link while admin stays fully accessible.'}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#7B173B] hover:bg-[#62122F] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'fr' ? 'Enregistrer & Mettre en Ligne' : 'Save & Publish Live'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CONTACT & CHANNELS                                 */}
        {/* ======================================================== */}
        {activeSubTab === 'contact' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <Smartphone className="w-4 h-4 text-[#7B173B]" />
                <div>
                  <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                    {language === 'fr' ? 'Canaux de Contact Officiels' : 'Official Direct Contact Channels'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {language === 'fr'
                      ? 'Ces numéros et adresses sont utilisés sur tous les boutons « Contacter sur WhatsApp », dans le pied de page et sur la page de contact.'
                      : 'These contact details power every WhatsApp chat button, footer link, and contact page across the site.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                {/* WhatsApp Number */}
                <div className="space-y-2">
                  <label className="font-semibold block text-gray-800 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'fr' ? 'Numéro WhatsApp Officiel *' : 'Official WhatsApp Number *'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formSettings.whatsappNumber || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))
                    }
                    placeholder="+254 181 740 330"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-mono text-sm"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                    <span>Format international (ex: +254181740330)</span>
                    {whatsappCleaned && (
                      <a
                        href={`https://wa.me/${whatsappCleaned}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                      >
                        <span>{language === 'fr' ? 'Tester le lien' : 'Test Link'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <label className="font-semibold block text-gray-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#7B173B]" />
                    <span>{language === 'fr' ? 'Adresse E-mail Officielle *' : 'Official Email Address *'}</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formSettings.contactEmail || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, contactEmail: e.target.value }))
                    }
                    placeholder="dabin.fashion.co.ke@gmail.com"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl text-sm"
                  />
                  <span className="text-[11px] text-gray-400 block pt-1">
                    Utilisé pour les correspondances formelles et les devis.
                  </span>
                </div>

                {/* Location / Hub */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="font-semibold block text-gray-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>{language === 'fr' ? 'Localisation du Showroom / Siège' : 'Showroom Hub Location'}</span>
                  </label>
                  <input
                    type="text"
                    value={formSettings.businessLocation || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, businessLocation: e.target.value }))
                    }
                    placeholder="Nairobi, Kenya"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl text-sm"
                  />
                  <span className="text-[11px] text-gray-400 block pt-1">
                    Affiché dans l’en-tête de la page d’accueil, les coordonnées du footer et les documents officiels.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#7B173B] hover:bg-[#62122F] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'fr' ? 'Enregistrer les Contacts' : 'Save Contact Details'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CURRENCY & EXCHANGE RATES                          */}
        {/* ======================================================== */}
        {activeSubTab === 'currency' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
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

              {/* Conversion Simulator Preview */}
              <div className="p-4 bg-[#F8F8FA] rounded-xl border border-gray-200 space-y-2 text-xs">
                <span className="font-bold text-gray-900 block">
                  {language === 'fr' ? 'Aperçu du calcul en boutique :' : 'Storefront Price Converter Preview:'}
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">1,000 KES</span>
                    <span className="font-bold text-gray-900 font-mono">
                      ${(1000 / (formSettings.exchangeRateUsdToKes || 130)).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">4,500 KES</span>
                    <span className="font-bold text-gray-900 font-mono">
                      ${(4500 / (formSettings.exchangeRateUsdToKes || 130)).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                    <span className="text-gray-400 block text-[10px]">$50 USD</span>
                    <span className="font-bold text-[#7B173B] font-mono">
                      Ksh {Math.round(50 * (formSettings.exchangeRateUsdToKes || 130)).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#7B173B] hover:bg-[#62122F] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'fr' ? 'Enregistrer le Taux' : 'Save Exchange Rate'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 4: CATEGORIES & DEPARTMENTS                           */}
        {/* ======================================================== */}
        {activeSubTab === 'categories' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                    {language === 'fr' ? 'Gestion des Rayons & Catégories' : 'Store Departments & Categories'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {language === 'fr'
                      ? 'Ajoutez, modifiez ou retirez des rayons. Les changements sont immédiatement appliqués aux filtres et à la page des catégories.'
                      : 'Manage department collections. Updates immediately reflect in the shop catalog filter and categories page.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddCategory}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7B173B] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#62122F] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Ajouter une catégorie' : 'Add Category'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {categoriesList.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={cat.imageUrl}
                        alt={cat.nameEn}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-200"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-gray-900 block truncate text-sm">
                          {cat.nameFr}
                        </span>
                        <span className="text-gray-500 block truncate text-[11px]">
                          {cat.nameEn}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-mono mt-0.5">
                          ID: {cat.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200/60">
                      <span className="text-[11px] text-gray-500">
                        {cat.subcategories?.length || 0} {language === 'fr' ? 'sous-rayons' : 'subcategories'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCat({ ...cat });
                            setIsCatModalOpen(true);
                          }}
                          className="p-1.5 text-gray-600 hover:text-gray-900 bg-white rounded-lg border border-gray-200"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 bg-rose-50 rounded-lg border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: DELIVERY DESTINATIONS                              */}
        {/* ======================================================== */}
        {activeSubTab === 'destinations' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                    {language === 'fr' ? 'Villes de Destination & Modalités de Fret' : 'Delivery Destinations & Transit Times'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {language === 'fr'
                      ? 'Ces villes apparaissent sur la page d’accueil, la page Destinations et la page À Propos.'
                      : 'These cities appear in the regional matrix across homepage, about, and destinations pages.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddDest}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7B173B] text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-[#62122F] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'fr' ? 'Ajouter une Ville' : 'Add City'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {destinations.map((dest) => (
                  <div
                    key={dest.id}
                    className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#7B173B]" />
                        <span>{dest.city}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {dest.country} · {dest.active ? (
                          <span className="text-emerald-700 font-semibold">{language === 'fr' ? 'Visible' : 'Active'}</span>
                        ) : (
                          <span className="text-amber-700 font-semibold">{language === 'fr' ? 'Masquée' : 'Hidden'}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {dest.estimatedTransitTimeFr || dest.estimatedTransitTimeEn}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDest({ ...dest });
                          setIsDestModalOpen(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-900"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDest(dest.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: BANKING & PAYMENTS                                 */}
        {/* ======================================================== */}
        {activeSubTab === 'payments' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#7B173B]" />
                  <h3 className="font-serif-brand text-lg font-bold">
                    {language === 'fr' ? 'Coordonnées de Règlement & Bancaires' : 'Payment & Banking Channels'}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* M-Pesa Till */}
                <div>
                  <label className="font-semibold block mb-1">M-Pesa Buy Goods Till</label>
                  <input
                    type="text"
                    placeholder="e.g. 123456"
                    value={formSettings.mpesaTillNumber || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, mpesaTillNumber: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-mono"
                  />
                </div>

                {/* M-Pesa Paybill */}
                <div>
                  <label className="font-semibold block mb-1">M-Pesa Paybill Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 6-digit Business No."
                    value={formSettings.mpesaPaybillNumber || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, mpesaPaybillNumber: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-mono"
                  />
                </div>

                {/* M-Pesa Account */}
                <div>
                  <label className="font-semibold block mb-1">M-Pesa Account (A/C)</label>
                  <input
                    type="text"
                    placeholder="e.g. DABIN_FASHION"
                    value={formSettings.mpesaPaybillAccount || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, mpesaPaybillAccount: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                {/* Bank Name */}
                <div>
                  <label className="font-semibold block mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bank of Africa Kenya"
                    value={formSettings.bankName || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, bankName: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                {/* Bank Account */}
                <div>
                  <label className="font-semibold block mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 0123456789"
                    value={formSettings.bankAccountNumber || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, bankAccountNumber: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-mono"
                  />
                </div>

                {/* SWIFT */}
                <div>
                  <label className="font-semibold block mb-1">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AFRIKENA"
                    value={formSettings.bankSwiftCode || ''}
                    onChange={(e) =>
                      setFormSettings((prev) => ({ ...prev, bankSwiftCode: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#7B173B] hover:bg-[#62122F] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{language === 'fr' ? 'Enregistrer les Coordonnées Bancaires' : 'Save Banking Channels'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 7: BACKUP & DATA                                      */}
        {/* ======================================================== */}
        {activeSubTab === 'backup' && (
          <div className="space-y-6">
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#171719] hover:bg-[#25252A] text-white rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{t.settings.exportDataBtn}</span>
                </button>

                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold transition-colors">
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-semibold border border-rose-200 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{t.settings.resetDataBtn}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* DESTINATION MODAL                                         */}
        {/* ======================================================== */}
        {isDestModalOpen && editingDest && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-serif-brand text-lg font-bold">
                  {editingDest.id ? (language === 'fr' ? 'Modifier la Ville' : 'Edit City') : (language === 'fr' ? 'Ajouter une Ville' : 'Add City')}
                </h3>
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
                    placeholder="3 à 5 jours via transporteurs partenaires"
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
                    placeholder="3 – 5 days via cargo partners"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editingDest.active ?? true}
                    onChange={(e) =>
                      setEditingDest((prev) => ({ ...prev, active: e.target.checked }))
                    }
                    className="rounded text-[#7B173B]"
                  />
                  <span className="font-semibold">
                    {language === 'fr' ? 'Actif & visible sur le site' : 'Active and visible on site'}
                  </span>
                </label>

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
                    className="px-4 py-2 bg-[#7B173B] text-white font-semibold rounded-xl cursor-pointer"
                  >
                    Save City
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* CATEGORY MODAL                                            */}
        {/* ======================================================== */}
        {isCatModalOpen && editingCat && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-serif-brand text-lg font-bold">
                  {editingCat.id && categoriesList.some((c) => c.id === editingCat.id)
                    ? (language === 'fr' ? 'Modifier la Catégorie' : 'Edit Category')
                    : (language === 'fr' ? 'Nouvelle Catégorie' : 'New Category')}
                </h3>
                <button type="button" onClick={() => setIsCatModalOpen(false)}>
                  <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-3">
                <div>
                  <label className="font-semibold block mb-1">Nom du Rayon (Français) *</label>
                  <input
                    type="text"
                    required
                    value={editingCat.nameFr || ''}
                    onChange={(e) =>
                      setEditingCat((prev) => ({ ...prev, nameFr: e.target.value }))
                    }
                    placeholder="ex. Vêtements, Sacs, Chaussures..."
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Category Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingCat.nameEn || ''}
                    onChange={(e) =>
                      setEditingCat((prev) => ({ ...prev, nameEn: e.target.value }))
                    }
                    placeholder="e.g. Clothes, Bags, Shoes..."
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">URL de l’image de couverture</label>
                  <input
                    type="text"
                    value={editingCat.imageUrl || ''}
                    onChange={(e) =>
                      setEditingCat((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-mono text-[11px]"
                  />
                </div>

                {editingCat.imageUrl && (
                  <div className="h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                    <img
                      src={editingCat.imageUrl}
                      alt="Category preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCatModalOpen(false)}
                    className="px-3 py-2 border border-gray-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#7B173B] text-white font-semibold rounded-xl cursor-pointer"
                  >
                    Save Category
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
