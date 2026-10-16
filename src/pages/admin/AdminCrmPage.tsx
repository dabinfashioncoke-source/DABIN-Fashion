import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  DollarSign,
  AlertCircle,
  FileText,
  X,
  History,
  ShieldCheck,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { safeOpenUrl } from '../../utils/navigation';
import {
  CrmActivity,
  Customer,
  CustomerType,
  FollowUpReminder,
  Language,
} from '../../types';

export const AdminCrmPage: React.FC = () => {
  const { language, formatPrice, t, currentUser, currency } = useApp();

  const [customersList, setCustomersList] = useState<Customer[]>(() =>
    storage.getCustomers()
  );
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  // Active customer drawer
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  // Form modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);

  // Activity modal
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityType, setActivityType] = useState<CrmActivity['type']>('whatsapp');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDetails, setActivityDetails] = useState('');

  // Reminder modal
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderNote, setReminderNote] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  const refreshCustomers = () => {
    setCustomersList(storage.getCustomers());
  };

  const filteredCustomers = useMemo(() => {
    return customersList.filter((c) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          c.fullName.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.whatsappNumber.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (cityFilter !== 'all' && c.city.toLowerCase() !== cityFilter.toLowerCase()) return false;
      return true;
    });
  }, [customersList, search, typeFilter, cityFilter]);

  const uniqueCities = useMemo(() => {
    return Array.from(new Set(customersList.map((c) => c.city)));
  }, [customersList]);

  // Open Add customer
  const handleAddNewCustomer = () => {
    setEditingCustomer({
      fullName: '',
      phone: '',
      whatsappNumber: '',
      email: '',
      city: 'Nairobi',
      country: 'Kenya',
      type: 'individual',
      preferredLanguage: 'fr',
      communicationConsent: true,
      notes: '',
    });
    setIsCustomerModalOpen(true);
  };

  // Open Edit customer
  const handleEditCustomer = (c: Customer) => {
    setEditingCustomer({ ...c });
    setIsCustomerModalOpen(true);
  };

  // Save Customer
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.fullName?.trim()) return;

    const saved = storage.saveCustomer(editingCustomer);
    refreshCustomers();
    setIsCustomerModalOpen(false);
    if (activeCustomer && activeCustomer.id === saved.id) {
      setActiveCustomer(saved);
    }
  };

  // Log activity
  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !activityTitle.trim()) return;

    storage.addCrmActivity({
      customerId: activeCustomer.id,
      type: activityType,
      title: activityTitle,
      details: activityDetails,
      staffName: currentUser?.name || 'Staff',
    });

    setIsActivityModalOpen(false);
    setActivityTitle('');
    setActivityDetails('');
  };

  // Save Reminder
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !reminderNote.trim()) return;

    storage.saveReminder({
      customerId: activeCustomer.id,
      customerName: activeCustomer.fullName,
      dueDate: reminderDate || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      reminderNote,
      completed: false,
      staffName: currentUser?.name || 'Staff',
    });

    setIsReminderModalOpen(false);
    setReminderNote('');
    setReminderDate('');
  };

  // Direct WhatsApp greeting for this customer
  const handleDirectWhatsApp = (c: Customer) => {
    const rawNumber = c.whatsappNumber.replace(/[^0-9]/g, '');
    const greeting =
      c.preferredLanguage === 'fr'
        ? `Bonjour ${c.fullName}, l’équipe DABIN Fashion de Nairobi vous contacte concernant votre commande ou vos sélections mode.`
        : `Hello ${c.fullName}, DABIN Fashion Nairobi team is reaching out regarding your inquiry or order.`;
    const url = `https://wa.me/${rawNumber}?text=${encodeURIComponent(greeting)}`;
    safeOpenUrl(url);
  };

  // Activities and sales for active customer
  const activeActivities = activeCustomer
    ? storage.getCrmActivities(activeCustomer.id)
    : [];
  const activeCustomerSales = activeCustomer
    ? storage.getSales().filter((s) => s.customerId === activeCustomer.id)
    : [];
  const reminders = storage.getReminders();

  return (
    <AdminLayout activeTab="crm">
      <div className="space-y-6">
        {/* Header & New Customer Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {t.crm.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {t.crm.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddNewCustomer}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7B173B] hover:bg-[#62122F] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.crm.addCustomerBtn}</span>
            </button>
          </div>
        </div>

        {/* Pricing notice card */}
        <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <b>{language === 'fr' ? 'Règle stricte de tarification :' : 'Strict Pricing Rule:'}</b>{' '}
            {t.crm.customerTypeNotice}
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, city..."
                className="w-full pl-8 pr-3 py-2 bg-[#F8F8FA] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7B173B]"
              />
            </div>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-2 px-3 bg-[#F8F8FA] border border-gray-200 rounded-lg text-xs"
            >
              <option value="all">All Groups</option>
              <option value="wholesaler">{t.customerType.wholesaler}</option>
              <option value="retailer">{t.customerType.retailer}</option>
              <option value="individual">{t.customerType.individual}</option>
            </select>

            {/* City filter */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="py-2 px-3 bg-[#F8F8FA] border border-gray-200 rounded-lg text-xs"
            >
              <option value="all">All Cities</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-gray-500 font-medium">
            {filteredCustomers.length} {language === 'fr' ? 'clients enregistrés' : 'customers'}
          </span>
        </div>

        {/* Customers Table and Profile Drawer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Table (7 or 12 cols depending on drawer) */}
          <div
            className={`${
              activeCustomer ? 'lg:col-span-7' : 'lg:col-span-12'
            } bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F8FA] text-gray-500 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-center">Purchases</th>
                    <th className="py-3 px-4">Total Spent</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredCustomers.map((c) => {
                    const isSelected = activeCustomer?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setActiveCustomer(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#7B173B]/5 font-semibold' : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{c.fullName}</div>
                          <div className="text-[11px] text-gray-400 font-mono">
                            {c.phone}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              c.type === 'wholesaler'
                                ? 'bg-purple-100 text-purple-800'
                                : c.type === 'retailer'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {t.customerType[c.type]}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-gray-600">
                          {c.city}, {c.country}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-medium">
                          {c.totalPurchasesCount}
                        </td>

                        <td className="py-3 px-4 font-bold text-[#7B173B]">
                          {formatPrice(c.totalSpentKes, 'KES')}
                        </td>

                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleDirectWhatsApp(c)}
                              className="p-1.5 text-[#25D366] hover:bg-emerald-50 rounded-md"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditCustomer(c)}
                              className="p-1.5 text-gray-400 hover:text-gray-800 rounded-md"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Drawer: Detailed Customer Profile View */}
          {activeCustomer && (
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-serif-brand text-xl font-bold text-[#171719]">
                    {activeCustomer.fullName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-[#7B173B]" />
                    <span>{activeCustomer.city}, {activeCustomer.country}</span>
                    <span>·</span>
                    <span className="capitalize">{activeCustomer.type}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveCustomer(null)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Contacts */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleDirectWhatsApp(activeCustomer)}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp</span>
                </button>

                <a
                  href={`tel:${activeCustomer.phone}`}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span>Call Phone</span>
                </a>
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-[#F9F9FB] rounded-xl text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">Purchases</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {activeCustomer.totalPurchasesCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">Total Spend</span>
                  <span className="font-bold text-[#7B173B] text-sm">
                    {formatPrice(activeCustomer.totalSpentKes, 'KES')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase block">Balance Due</span>
                  <span className="font-bold text-amber-700 text-sm">
                    {formatPrice(activeCustomer.outstandingBalanceKes, 'KES')}
                  </span>
                </div>
              </div>

              {/* Private Notes */}
              {activeCustomer.notes && (
                <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
                  <span className="font-bold text-gray-700 block mb-0.5">Internal CRM Notes:</span>
                  <p>{activeCustomer.notes}</p>
                </div>
              )}

              {/* Actions row: Log Activity & Follow up */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(true)}
                  className="flex-1 py-2 bg-[#171719] hover:bg-[#7B173B] text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  {t.crm.logActivity}
                </button>
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(true)}
                  className="flex-1 py-2 bg-[#F4F4F6] hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors"
                >
                  {t.crm.addReminder}
                </button>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t.crm.activitiesTimeline} ({activeActivities.length})
                </h4>
                {activeActivities.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeActivities.map((act) => (
                      <div
                        key={act.id}
                        className="p-2.5 bg-[#F8F8FA] rounded-xl border border-gray-100 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-gray-900">
                          <span className="capitalize">{act.type} · {act.title}</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            {new Date(act.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-[11px]">{act.details}</p>
                        <span className="text-[10px] text-gray-400 block">
                          Logged by: {act.staffName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No logged interactions yet.</p>
                )}
              </div>

              {/* Purchase History */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Past Transactions ({activeCustomerSales.length})
                </h4>
                {activeCustomerSales.length > 0 ? (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {activeCustomerSales.map((s) => (
                      <div
                        key={s.id}
                        className="p-2 bg-gray-50 rounded-lg text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-bold">{s.receiptNumber}</span>
                          <span className="text-gray-400 text-[10px] block">
                            {new Date(s.timestamp).toLocaleDateString()} · {s.items.length} items
                          </span>
                        </div>
                        <span className="font-bold text-[#7B173B]">
                          {formatPrice(s.total, s.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">No sales recorded yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 1. Add / Edit Customer Modal */}
        {isCustomerModalOpen && editingCustomer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-serif-brand text-lg font-bold">
                  {editingCustomer.id ? 'Edit Customer' : t.crm.addCustomerBtn}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">{t.crm.customerName} *</label>
                  <input
                    type="text"
                    required
                    value={editingCustomer.fullName || ''}
                    onChange={(e) =>
                      setEditingCustomer((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">{t.crm.phone} *</label>
                    <input
                      type="text"
                      required
                      value={editingCustomer.phone || ''}
                      onChange={(e) =>
                        setEditingCustomer((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">{t.crm.whatsapp}</label>
                    <input
                      type="text"
                      value={editingCustomer.whatsappNumber || ''}
                      onChange={(e) =>
                        setEditingCustomer((prev) => ({
                          ...prev,
                          whatsappNumber: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">{t.crm.city}</label>
                    <input
                      type="text"
                      value={editingCustomer.city || ''}
                      onChange={(e) =>
                        setEditingCustomer((prev) => ({ ...prev, city: e.target.value }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">{t.crm.country}</label>
                    <input
                      type="text"
                      value={editingCustomer.country || ''}
                      onChange={(e) =>
                        setEditingCustomer((prev) => ({ ...prev, country: e.target.value }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">{t.crm.customerTypeLabel}</label>
                    <select
                      value={editingCustomer.type}
                      onChange={(e) =>
                        setEditingCustomer((prev) => ({
                          ...prev,
                          type: e.target.value as CustomerType,
                        }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    >
                      <option value="individual">{t.customerType.individual}</option>
                      <option value="retailer">{t.customerType.retailer}</option>
                      <option value="wholesaler">{t.customerType.wholesaler}</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Language</label>
                    <select
                      value={editingCustomer.preferredLanguage}
                      onChange={(e) =>
                        setEditingCustomer((prev) => ({
                          ...prev,
                          preferredLanguage: e.target.value as Language,
                        }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Private Staff Notes</label>
                  <textarea
                    rows={2}
                    value={editingCustomer.notes || ''}
                    onChange={(e) =>
                      setEditingCustomer((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(false)}
                    className="px-3 py-2 border border-gray-200 rounded-xl"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#7B173B] text-white font-semibold rounded-xl"
                  >
                    {t.common.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Log Activity Modal */}
        {isActivityModalOpen && activeCustomer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
              <h3 className="font-serif-brand text-lg font-bold">
                Log Interaction with {activeCustomer.fullName}
              </h3>
              <form onSubmit={handleSaveActivity} className="space-y-3">
                <div>
                  <label className="font-semibold block mb-1">Interaction Type</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as any)}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  >
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="call">Phone Call</option>
                    <option value="visit">Showroom Visit</option>
                    <option value="inquiry">Product Availability Inquiry</option>
                    <option value="note">Internal Staff Note</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Subject / Summary *</label>
                  <input
                    type="text"
                    required
                    value={activityTitle}
                    onChange={(e) => setActivityTitle(e.target.value)}
                    placeholder="e.g. Inquired about trench coat stock"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Details & Outcomes</label>
                  <textarea
                    rows={3}
                    value={activityDetails}
                    onChange={(e) => setActivityDetails(e.target.value)}
                    placeholder="e.g. Client requested 3 units dispatched to Goma by Friday."
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsActivityModalOpen(false)}
                    className="px-3 py-2 border border-gray-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#7B173B] text-white font-semibold rounded-xl"
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 3. Follow up Reminder Modal */}
        {isReminderModalOpen && activeCustomer && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
              <h3 className="font-serif-brand text-lg font-bold">
                Schedule Follow-up for {activeCustomer.fullName}
              </h3>
              <form onSubmit={handleSaveReminder} className="space-y-3">
                <div>
                  <label className="font-semibold block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Reminder Action *</label>
                  <textarea
                    rows={3}
                    required
                    value={reminderNote}
                    onChange={(e) => setReminderNote(e.target.value)}
                    placeholder="e.g. Follow up on Bukavu cargo parcel receipt."
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReminderModalOpen(false)}
                    className="px-3 py-2 border border-gray-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#7B173B] text-white font-semibold rounded-xl"
                  >
                    Schedule Reminder
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
