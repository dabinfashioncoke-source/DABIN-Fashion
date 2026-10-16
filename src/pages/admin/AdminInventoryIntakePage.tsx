import React, { useState } from 'react';
import {
  Truck,
  Plus,
  PackageCheck,
  Building2,
  Calendar,
  DollarSign,
  History,
  X,
  CheckCircle,
  FileText,
  User,
  ShieldCheck,
} from 'lucide-react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { CurrencyCode, StockIntake, Supplier } from '../../types';

export const AdminInventoryIntakePage: React.FC = () => {
  const { language, formatPrice, t, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'intake' | 'suppliers' | 'movements'>('intake');

  const products = storage.getProducts();
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(() =>
    storage.getSuppliers()
  );
  const [intakesList, setIntakesList] = useState<StockIntake[]>(() =>
    storage.getStockIntakes()
  );
  const [movementsList, setMovementsList] = useState(() =>
    storage.getInventoryMovements()
  );

  // New Intake Modal
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliersList[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [quantityReceived, setQuantityReceived] = useState<number>(5);
  const [unitAcquisitionCost, setUnitAcquisitionCost] = useState<number>(1500);
  const [costCurrency, setCostCurrency] = useState<CurrencyCode>('KES');
  const [deliveryRef, setDeliveryRef] = useState('');
  const [intakeNotes, setIntakeNotes] = useState('');

  // New Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLocation, setNewLocation] = useState('Nairobi / Mombasa');
  const [newSupplierNotes, setNewSupplierNotes] = useState('');

  const [feedback, setFeedback] = useState<string | null>(null);

  const refreshAll = () => {
    setSuppliersList(storage.getSuppliers());
    setIntakesList(storage.getStockIntakes());
    setMovementsList(storage.getInventoryMovements());
  };

  // Submit Stock Intake
  const handleRecordIntake = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliersList.find((s) => s.id === selectedSupplierId);
    const prod = products.find((p) => p.id === selectedProductId);

    if (!sup || !prod) {
      setFeedback(language === 'fr' ? 'Veuillez sélectionner un fournisseur et un produit valides.' : 'Please select both a valid supplier and product.');
      setTimeout(() => setFeedback(null), 3500);
      return;
    }

    storage.recordStockIntake({
      supplierId: sup.id,
      supplierName: sup.name,
      productId: prod.id,
      productSku: prod.sku,
      productName: prod.nameEn,
      quantityReceived,
      acquisitionCost: unitAcquisitionCost,
      currency: costCurrency,
      deliveryReference: deliveryRef || `BATCH-${Date.now().toString().slice(-6)}`,
      dateReceived: new Date().toISOString(),
      staffName: currentUser?.name || 'Staff',
      notes: intakeNotes,
    });

    refreshAll();
    setIsIntakeModalOpen(false);
    setDeliveryRef('');
    setIntakeNotes('');
    setFeedback(t.stockIntake.intakeSuccess);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Add Supplier
  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    storage.saveSupplier({
      name: newSupplierName,
      contactPerson: newContactPerson,
      phone: newPhone,
      location: newLocation,
      notes: newSupplierNotes,
    });

    refreshAll();
    setIsSupplierModalOpen(false);
    setNewSupplierName('');
    setNewContactPerson('');
    setNewPhone('');
    setNewSupplierNotes('');
    setFeedback('Supplier created successfully.');
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <AdminLayout activeTab="intake">
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {t.stockIntake.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {t.stockIntake.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsIntakeModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7B173B] hover:bg-[#62122F] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{t.stockIntake.recordIntakeBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-xl"
            >
              <Plus className="w-4 h-4 text-gray-500" />
              <span>{t.stockIntake.addSupplierBtn}</span>
            </button>
          </div>
        </div>

        {/* Feedback message */}
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

        {/* Navigation Tabs */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200 shadow-2xs w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('intake')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'intake'
                ? 'bg-[#7B173B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.stockIntake.intakeLedgerHeading} ({intakesList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-[#7B173B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.stockIntake.suppliersHeading} ({suppliersList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'movements'
                ? 'bg-[#7B173B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {language === 'fr' ? 'Mouvements Globaux' : 'Movement Audit'} ({movementsList.length})
          </button>
        </div>

        {/* Tab 1: Stock Intake Ledger */}
        {activeTab === 'intake' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F8FA] text-gray-500 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-center">Qty Received</th>
                    <th className="py-3 px-4">Unit Cost (Private)</th>
                    <th className="py-3 px-4">Batch / Delivery Ref</th>
                    <th className="py-3 px-4">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {intakesList.length > 0 ? (
                    intakesList.map((intake) => (
                      <tr key={intake.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(intake.dateReceived).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900">{intake.productName}</div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {intake.productSku}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-800">
                          {intake.supplierName}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700 font-mono">
                          +{intake.quantityReceived}
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">
                          {formatPrice(intake.acquisitionCost, intake.currency)}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                          {intake.deliveryReference}
                        </td>
                        <td className="py-3 px-4 text-gray-500">{intake.staffName}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400 text-xs">
                        No stock intakes recorded yet. Click "Record New Stock Intake" to add inventory.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Sourcing Suppliers */}
        {activeTab === 'suppliers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliersList.map((sup) => (
              <div
                key={sup.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="font-serif-brand text-base font-bold text-[#171719]">
                      {sup.name}
                    </h3>
                    <Building2 className="w-4 h-4 text-[#7B173B]" />
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600 mt-2">
                    {sup.contactPerson && (
                      <div>
                        <span className="text-gray-400">Contact:</span> {sup.contactPerson}
                      </div>
                    )}
                    {sup.phone && (
                      <div>
                        <span className="text-gray-400">Phone:</span> {sup.phone}
                      </div>
                    )}
                    {sup.location && (
                      <div>
                        <span className="text-gray-400">Location:</span> {sup.location}
                      </div>
                    )}
                    {sup.notes && (
                      <p className="text-[11px] text-gray-500 italic mt-2 bg-gray-50 p-2 rounded-lg">
                        {sup.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                  Registered: {new Date(sup.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: All Movements Audit */}
        {activeTab === 'movements' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F8FA] text-gray-500 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-center">Change</th>
                    <th className="py-3 px-4 text-center">Balance After</th>
                    <th className="py-3 px-4">Responsible</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {movementsList.map((mov) => (
                    <tr key={mov.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {new Date(mov.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{mov.productName}</span>{' '}
                        <span className="text-gray-400 font-mono text-[10px]">
                          ({mov.productSku})
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize font-medium">{mov.reason}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span
                          className={
                            mov.quantityChanged > 0 ? 'text-emerald-700' : 'text-rose-700'
                          }
                        >
                          {mov.quantityChanged > 0 ? `+${mov.quantityChanged}` : mov.quantityChanged}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-medium">
                        {mov.quantityAfter}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{mov.staffName}</td>
                      <td className="py-3 px-4 text-gray-500 text-[11px] truncate max-w-xs">
                        {mov.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 1. Record Intake Modal */}
        {isIntakeModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-serif-brand text-lg font-bold">
                  {t.stockIntake.recordIntakeBtn}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsIntakeModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordIntake} className="space-y-4">
                <div>
                  <label className="font-semibold block mb-1">{t.stockIntake.supplier} *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  >
                    {suppliersList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.location || 'Depot'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">{t.stockIntake.product} *</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameEn} ({p.sku}) — Current stock: {p.quantityOnHand}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold block mb-1">
                      {t.stockIntake.qtyReceived} *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={quantityReceived}
                      onChange={(e) => setQuantityReceived(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">
                      {t.stockIntake.acquisitionCost}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={unitAcquisitionCost}
                      onChange={(e) => setUnitAcquisitionCost(Number(e.target.value))}
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    {t.stockIntake.deliveryRef}
                  </label>
                  <input
                    type="text"
                    value={deliveryRef}
                    onChange={(e) => setDeliveryRef(e.target.value)}
                    placeholder="e.g. BALE-GRADEA-2026-08"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Notes</label>
                  <input
                    type="text"
                    value={intakeNotes}
                    onChange={(e) => setIntakeNotes(e.target.value)}
                    placeholder="e.g. Inspected on arrival. Clean condition."
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsIntakeModalOpen(false)}
                    className="px-3 py-2 border border-gray-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#7B173B] text-white font-semibold rounded-xl"
                  >
                    Confirm Stock Receipt
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Add Supplier Modal */}
        {isSupplierModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-serif-brand text-lg font-bold">
                  {t.stockIntake.addSupplierBtn}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSupplier} className="space-y-3">
                <div>
                  <label className="font-semibold block mb-1">Supplier Company Name *</label>
                  <input
                    type="text"
                    required
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Location / Depot</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Private Notes</label>
                  <textarea
                    rows={2}
                    value={newSupplierNotes}
                    onChange={(e) => setNewSupplierNotes(e.target.value)}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSupplierModalOpen(false)}
                    className="px-3 py-2 border border-gray-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#7B173B] text-white font-semibold rounded-xl"
                  >
                    Save Supplier
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
