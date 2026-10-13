import {
  AlertTriangle,
  Archive,
  Copy,
  Edit,
  Eye,
  Film,
  Image as ImageIcon,
  Package,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sliders,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import {
  CurrencyCode,
  InventoryAdjustmentReason,
  Product,
  ProductCondition,
  ProductStatus,
} from '../../types';

export const AdminProductsPage: React.FC = () => {
  const { language, formatPrice, t, currentUser, currency } = useApp();

  const [productsList, setProductsList] = useState<Product[]>(() => storage.getProducts());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<InventoryAdjustmentReason>('count_correction');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categories = storage.getCategories();

  const refreshProducts = () => {
    setProductsList(storage.getProducts());
  };

  const filtered = useMemo(() => {
    return productsList.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          p.nameEn.toLowerCase().includes(q) ||
          p.nameFr.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && p.categoryId !== categoryFilter) return false;
      return true;
    });
  }, [productsList, search, statusFilter, categoryFilter]);

  // Open Add Product
  const handleAddNew = () => {
    setEditingProduct({
      sku: `DAB-${Math.floor(1000 + Math.random() * 9000)}`,
      nameEn: '',
      nameFr: '',
      descriptionEn: '',
      descriptionFr: '',
      categoryId: categories[0]?.id || 'cat-clothes',
      condition: 'excellent',
      basePrice: 2500,
      baseCurrency: 'KES',
      costPrice: 1200,
      quantityOnHand: 1,
      reservedQuantity: 0,
      lowStockThreshold: 1,
      status: 'available',
      featured: false,
      publicStockVisible: true,
      images: [],
      videos: [],
    });
    setVideoUrlInput('');
    setIsFormOpen(true);
  };

  // Open Edit Product
  const handleEdit = (p: Product) => {
    setEditingProduct({ ...p });
    setIsFormOpen(true);
  };

  // Open Duplicate
  const handleDuplicate = (p: Product) => {
    const dup: Partial<Product> = {
      ...p,
      id: undefined,
      sku: `DAB-${Math.floor(1000 + Math.random() * 9000)}`,
      nameEn: `${p.nameEn} (Copy)`,
      nameFr: `${p.nameFr} (Copie)`,
      status: 'draft',
      quantityOnHand: 1,
      reservedQuantity: 0,
    };
    storage.saveProduct(dup);
    refreshProducts();
    setFeedbackMsg({
      type: 'success',
      text: language === 'fr' ? 'Produit dupliqué avec succès.' : 'Product duplicated.',
    });
  };

  // Open Adjust Inventory Modal
  const handleOpenAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setNewQuantity(p.quantityOnHand);
    setAdjustReason('count_correction');
    setAdjustNotes('');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    try {
      storage.adjustInventory(adjustingProduct.id, newQuantity, adjustReason, adjustNotes);
      refreshProducts();
      setIsAdjustModalOpen(false);
      setFeedbackMsg({
        type: 'success',
        text: language === 'fr' ? 'Stock ajusté avec succès.' : 'Stock adjusted successfully.',
      });
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message });
    }
  };

  // Safe delete or archive
  const handleDeleteSafe = (p: Product) => {
    const confirmPrompt = window.confirm(
      language === 'fr'
        ? `Êtes-vous sûr de vouloir supprimer ou archiver ${p.nameEn} (${p.sku}) ?`
        : `Are you sure you want to remove ${p.nameEn} (${p.sku})?`
    );
    if (!confirmPrompt) return;

    const res = storage.deleteProductSafe(p.id);
    refreshProducts();
    setFeedbackMsg({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  // Image file upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result && editingProduct) {
          setEditingProduct((prev) => ({
            ...prev,
            images: [...(prev?.images || []), result],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Video file upload handler
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result && editingProduct) {
          setEditingProduct((prev) => ({
            ...prev,
            videos: [...(prev?.videos || []), result],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddVideoUrl = () => {
    if (!videoUrlInput.trim()) return;
    setEditingProduct((prev) => ({
      ...prev,
      videos: [...(prev?.videos || []), videoUrlInput.trim()],
    }));
    setVideoUrlInput('');
  };

  // Save product form
  const handleSaveProductForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (!editingProduct.nameEn?.trim() || !editingProduct.nameFr?.trim()) {
      alert(language === 'fr' ? 'Veuillez saisir le nom en anglais et en français.' : 'Please enter names in both languages.');
      return;
    }

    storage.saveProduct(editingProduct);
    refreshProducts();
    setIsFormOpen(false);
    setFeedbackMsg({
      type: 'success',
      text: language === 'fr' ? 'Fiche produit enregistrée.' : 'Product record saved.',
    });
  };

  return (
    <AdminLayout activeTab="products">
      <div className="space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {t.admin.products}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {language === 'fr'
                ? 'Gestion complète du catalogue, photographies, seuils d’alerte et inventaire.'
                : 'Manage product catalog, photo galleries, stock levels and status.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#7B173B] hover:bg-[#62122F] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'fr' ? 'Nouveau Produit' : 'New Product'}</span>
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedbackMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-gray-400 hover:text-gray-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
            {/* Search input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, SKU, brand..."
                className="w-full pl-8 pr-3 py-2 bg-[#F8F8FA] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7B173B]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 bg-[#F8F8FA] border border-gray-200 rounded-lg text-xs focus:outline-none"
            >
              <option value="all">{t.common.allCategories}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'fr' ? c.nameFr : c.nameEn}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 bg-[#F8F8FA] border border-gray-200 rounded-lg text-xs focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="available">{t.status.available}</option>
              <option value="low_stock">{t.status.low_stock}</option>
              <option value="out_of_stock">{t.status.out_of_stock}</option>
              <option value="draft">{t.status.draft}</option>
              <option value="archived">{t.status.archived}</option>
            </select>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            {filtered.length} {language === 'fr' ? 'produits' : 'products'}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F8FA] text-gray-500 font-semibold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Photo</th>
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">On Hand</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filtered.map((product) => {
                  const available = Math.max(0, product.quantityOnHand - product.reservedQuantity);
                  const isLow = available <= product.lowStockThreshold && available > 0;
                  const isOut = available === 0;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Photo Thumbnail */}
                      <td className="py-3 px-4">
                        <img
                          src={product.images[0] || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80'}
                          alt=""
                          className="w-11 h-11 object-cover rounded-lg border border-gray-200 bg-gray-50"
                        />
                      </td>

                      {/* SKU and Name */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">
                          {language === 'fr' ? product.nameFr : product.nameEn}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {product.sku} {product.brand && `· ${product.brand}`}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-gray-600 capitalize">
                        {product.categoryId.replace('cat-', '')}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-bold text-[#7B173B]">
                        {formatPrice(product.basePrice, product.baseCurrency)}
                      </td>

                      {/* On Hand */}
                      <td className="py-3 px-4 text-center font-mono font-medium">
                        {product.quantityOnHand}
                      </td>

                      {/* Available Qty */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded ${
                            isOut
                              ? 'bg-rose-50 text-rose-700'
                              : isLow
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {available}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            product.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : product.status === 'low_stock'
                              ? 'bg-amber-100 text-amber-800'
                              : product.status === 'out_of_stock'
                              ? 'bg-rose-100 text-rose-800'
                              : product.status === 'archived'
                              ? 'bg-gray-200 text-gray-700'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t.status[product.status] || product.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={() => handleOpenAdjust(product)}
                            className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                            title="Adjust Stock"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(product)}
                            className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Duplicate Product"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSafe(product)}
                            className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete / Archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* 1. Add / Edit Product Modal */}
        {isFormOpen && editingProduct && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F8FA]">
                <h2 className="font-serif-brand text-lg font-bold">
                  {editingProduct.id
                    ? language === 'fr'
                      ? 'Modifier la fiche produit'
                      : 'Edit Product Record'
                    : language === 'fr'
                    ? 'Ajouter un nouveau produit'
                    : 'Create New Product'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProductForm} className="overflow-y-auto p-6 space-y-6 text-xs flex-1">
                {/* Basic info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Name (English) *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.nameEn || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, nameEn: e.target.value }))
                      }
                      placeholder="e.g. Vintage Heritage Trench Coat"
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#7B173B]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Nom (Français) *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.nameFr || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, nameFr: e.target.value }))
                      }
                      placeholder="Ex. Trench-Coat Vintage Héritage"
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#7B173B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">SKU / Code *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.sku || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, sku: e.target.value }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-[#7B173B]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Category *</label>
                    <select
                      value={editingProduct.categoryId}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, categoryId: e.target.value }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameEn} ({c.nameFr})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Condition *</label>
                    <select
                      value={editingProduct.condition}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          condition: e.target.value as ProductCondition,
                        }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    >
                      <option value="brand_new_thrift">{t.condition.brand_new_thrift}</option>
                      <option value="like_new">{t.condition.like_new}</option>
                      <option value="excellent">{t.condition.excellent}</option>
                      <option value="very_good">{t.condition.very_good}</option>
                      <option value="good">{t.condition.good}</option>
                    </select>
                  </div>
                </div>

                {/* Attributes: Brand, Size, Color, Material */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Brand</label>
                    <input
                      type="text"
                      value={editingProduct.brand || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, brand: e.target.value }))
                      }
                      placeholder="e.g. London Fog"
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Size</label>
                    <input
                      type="text"
                      value={editingProduct.size || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, size: e.target.value }))
                      }
                      placeholder="e.g. L / EU 42"
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Color</label>
                    <input
                      type="text"
                      value={editingProduct.color || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, color: e.target.value }))
                      }
                      placeholder="e.g. Burgundy"
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block mb-1">Material</label>
                    <input
                      type="text"
                      value={editingProduct.material || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, material: e.target.value }))
                      }
                      placeholder="e.g. Wool Blend"
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Pricing & Stock with Currency Selection (KES or USD) */}
                <div className="p-4 bg-[#F8F8FA] rounded-2xl border border-gray-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                    <div>
                      <span className="font-bold text-sm text-[#171719] block">
                        {language === 'fr' ? 'Tarification & Devise de Saisie' : 'Pricing & Input Currency'}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {language === 'fr'
                          ? 'Saisissez le prix en KES ou en USD. Le système convertit automatiquement pour les clients.'
                          : 'Fill in the price in either USD or KES. The system converts automatically for shoppers.'}
                      </span>
                    </div>

                    {/* Toggle KES or USD */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          const currentCur = editingProduct.baseCurrency || 'KES';
                          if (currentCur !== 'KES') {
                            const curPrice = editingProduct.basePrice || 0;
                            const converted = storage.convertPrice(curPrice, 'USD', 'KES');
                            setEditingProduct((prev) => ({
                              ...prev,
                              baseCurrency: 'KES',
                              basePrice: converted,
                              costPrice: prev?.costPrice !== undefined ? storage.convertPrice(prev.costPrice, 'USD', 'KES') : undefined,
                            }));
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          (editingProduct.baseCurrency || 'KES') === 'KES'
                            ? 'bg-[#7B173B] text-white shadow-xs'
                            : 'text-gray-600 hover:text-black hover:bg-gray-100'
                        }`}
                      >
                        KES (Ksh)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currentCur = editingProduct.baseCurrency || 'KES';
                          if (currentCur !== 'USD') {
                            const curPrice = editingProduct.basePrice || 0;
                            const converted = storage.convertPrice(curPrice, 'KES', 'USD');
                            setEditingProduct((prev) => ({
                              ...prev,
                              baseCurrency: 'USD',
                              basePrice: converted,
                              costPrice: prev?.costPrice !== undefined ? storage.convertPrice(prev.costPrice, 'KES', 'USD') : undefined,
                            }));
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          editingProduct.baseCurrency === 'USD'
                            ? 'bg-[#7B173B] text-white shadow-xs'
                            : 'text-gray-600 hover:text-black hover:bg-gray-100'
                        }`}
                      >
                        USD ($)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="font-semibold block mb-1 text-[#7B173B]">
                        {language === 'fr'
                          ? `Prix de Vente (${editingProduct.baseCurrency || 'KES'}) *`
                          : `Selling Price (${editingProduct.baseCurrency || 'KES'}) *`}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-xs">
                          {editingProduct.baseCurrency === 'USD' ? '$' : 'Ksh'}
                        </span>
                        <input
                          type="number"
                          required
                          step={editingProduct.baseCurrency === 'USD' ? '0.01' : '1'}
                          min={0}
                          value={editingProduct.basePrice ?? ''}
                          onChange={(e) =>
                            setEditingProduct((prev) => ({
                              ...prev,
                              basePrice: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full pl-11 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#7B173B]"
                        />
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 font-medium">
                        {editingProduct.baseCurrency === 'USD' ? (
                          <span>
                            ≈ Ksh {storage.convertPrice(editingProduct.basePrice || 0, 'USD', 'KES').toLocaleString()} KES
                          </span>
                        ) : (
                          <span>
                            ≈ ${storage.convertPrice(editingProduct.basePrice || 0, 'KES', 'USD').toFixed(2)} USD
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-gray-600">
                        {language === 'fr'
                          ? `Prix de Revient (${editingProduct.baseCurrency || 'KES'})`
                          : `Cost Price (${editingProduct.baseCurrency || 'KES'})`}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">
                          {editingProduct.baseCurrency === 'USD' ? '$' : 'Ksh'}
                        </span>
                        <input
                          type="number"
                          step={editingProduct.baseCurrency === 'USD' ? '0.01' : '1'}
                          min={0}
                          value={editingProduct.costPrice ?? ''}
                          onChange={(e) =>
                            setEditingProduct((prev) => ({
                              ...prev,
                              costPrice: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full pl-11 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                        />
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {language === 'fr' ? 'Interne uniquement' : 'Internal cost only'}
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold block mb-1">
                        {language === 'fr' ? 'Quantité en Stock' : 'Quantity On Hand'}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={editingProduct.quantityOnHand ?? 1}
                        onChange={(e) =>
                          setEditingProduct((prev) => ({
                            ...prev,
                            quantityOnHand: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl font-bold text-sm"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1">
                        {language === 'fr' ? 'Alerte Stock Faible' : 'Low Stock Alert At'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={editingProduct.lowStockThreshold ?? 2}
                        onChange={(e) =>
                          setEditingProduct((prev) => ({
                            ...prev,
                            lowStockThreshold: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold block mb-1">Description (English)</label>
                    <textarea
                      rows={3}
                      value={editingProduct.descriptionEn || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          descriptionEn: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1">Description (Français)</label>
                    <textarea
                      rows={3}
                      value={editingProduct.descriptionFr || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          descriptionFr: e.target.value,
                        }))
                      }
                      className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Media Management: Photos and Videos */}
                <div className="space-y-5 p-4 bg-[#F8F8FA] rounded-2xl border border-gray-200">
                  <div className="border-b border-gray-200 pb-2">
                    <h3 className="font-bold text-sm text-[#171719]">
                      {language === 'fr' ? 'Médias du Produit (Photos & Vidéos)' : 'Product Media (Photos & Videos)'}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {language === 'fr'
                        ? 'Téléversez des photographies sous plusieurs angles et des vidéos de présentation pour valoriser l’article.'
                        : 'Upload multi-angle product photography and video recordings to showcase the item.'}
                    </p>
                  </div>

                  {/* Photographs Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#7B173B]" />
                        <span>
                          {language === 'fr' ? 'Photographies' : 'Photographs'} ({editingProduct.images?.length || 0})
                        </span>
                      </span>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#171719] hover:bg-[#7B173B] text-white rounded-lg text-xs font-medium transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Téléverser Photos' : 'Upload Photos'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {editingProduct.images && editingProduct.images.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {editingProduct.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden group bg-gray-50 shadow-2xs"
                          >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  images: prev?.images?.filter((_, i) => i !== idx),
                                }))
                              }
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                              title="Delete photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] text-center font-bold">
                                {language === 'fr' ? 'Principale' : 'Main'}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs italic">
                        {language === 'fr'
                          ? 'Aucune photo téléversée pour l’instant.'
                          : 'No photos uploaded yet. Click "Upload Photos" to add product shots.'}
                      </p>
                    )}
                  </div>

                  {/* Videos Section */}
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-gray-800 flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-[#7B173B]" />
                        <span>
                          {language === 'fr' ? 'Vidéos de présentation' : 'Product Videos'} ({editingProduct.videos?.length || 0})
                        </span>
                      </span>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#7B173B] hover:bg-[#62122F] text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Téléverser Fichier Vidéo' : 'Upload Video File'}</span>
                        <input
                          type="file"
                          multiple
                          accept="video/*"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Direct Video URL input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={videoUrlInput}
                        onChange={(e) => setVideoUrlInput(e.target.value)}
                        placeholder={
                          language === 'fr'
                            ? 'Ou coller l’URL directe d’une vidéo (ex: https://.../video.mp4)...'
                            : 'Or paste direct video link URL (e.g. https://.../video.mp4)...'
                        }
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#7B173B]"
                      />
                      <button
                        type="button"
                        onClick={handleAddVideoUrl}
                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition-colors shrink-0"
                      >
                        {language === 'fr' ? 'Ajouter URL' : 'Add Link'}
                      </button>
                    </div>

                    {editingProduct.videos && editingProduct.videos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {editingProduct.videos.map((vid, vIdx) => (
                          <div
                            key={vIdx}
                            className="relative rounded-xl border border-gray-300 overflow-hidden bg-black group"
                          >
                            <video
                              src={vid}
                              controls
                              className="w-full h-36 object-contain bg-black"
                              preload="metadata"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  videos: prev?.videos?.filter((_, i) => i !== vIdx),
                                }))
                              }
                              className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity z-10 shadow-md"
                              title="Delete video"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/75 text-white text-[10px] rounded backdrop-blur-xs font-medium">
                              {language === 'fr' ? `Vidéo ${vIdx + 1}` : `Video ${vIdx + 1}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-xs italic">
                        {language === 'fr'
                          ? 'Aucune vidéo téléversée. Vous pouvez téléverser un fichier MP4 ou coller un lien direct pour présenter l’article.'
                          : 'No videos uploaded yet. Upload an MP4 video or paste a link to showcase the garment.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Toggles: Featured, Public stock visible */}
                <div className="flex items-center gap-6 pt-3 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.featured ?? false}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, featured: e.target.checked }))
                      }
                      className="rounded text-[#7B173B]"
                    />
                    <span className="font-medium text-gray-700">Feature on Homepage</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.publicStockVisible ?? true}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          publicStockVisible: e.target.checked,
                        }))
                      }
                      className="rounded text-[#7B173B]"
                    />
                    <span className="font-medium text-gray-700">
                      Show Exact Quantity Publicly
                    </span>
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#7B173B] text-white font-semibold rounded-xl hover:bg-[#62122F]"
                  >
                    {t.common.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Manual Stock Adjustment Dialog */}
        {isAdjustModalOpen && adjustingProduct && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-serif-brand text-lg font-bold">
                  {language === 'fr' ? 'Ajuster l’inventaire' : 'Adjust Product Inventory'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1">
                <div className="font-semibold text-gray-800">
                  {adjustingProduct.nameEn} ({adjustingProduct.sku})
                </div>
                <div className="text-gray-500">
                  Current On-Hand Balance: <b>{adjustingProduct.quantityOnHand}</b> units
                </div>
              </div>

              <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold block mb-1">
                    New On-Hand Physical Count *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">
                    Mandatory Reason for Adjustment *
                  </label>
                  <select
                    value={adjustReason}
                    onChange={(e) =>
                      setAdjustReason(e.target.value as InventoryAdjustmentReason)
                    }
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  >
                    <option value="count_correction">Physical Stock Count Correction</option>
                    <option value="stock_intake">Direct Stock Received</option>
                    <option value="damaged">Damaged / Stained in Showroom</option>
                    <option value="lost">Lost / Missing</option>
                    <option value="reservation">Internal Reservation</option>
                    <option value="release_reservation">Release Reservation</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Audit Notes</label>
                  <input
                    type="text"
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    placeholder="e.g. End of month physical recount"
                    className="w-full p-2.5 bg-[#F8F8FA] border border-gray-200 rounded-xl"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdjustModalOpen(false)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-gray-600"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#7B173B] text-white font-semibold rounded-xl"
                  >
                    Confirm Adjustment
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
