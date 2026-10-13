import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  PackageX,
  RotateCcw,
  Tag,
  ArrowUpDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storage } from '../services/storage';
import { Product, ProductCondition } from '../types';
import { ProductCard } from '../components/public/ProductCard';
import { ProductDetailModal } from '../components/public/ProductDetailModal';

export const ShopCatalogPage: React.FC = () => {
  const { language, t, currentRoute, navigateTo } = useApp();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Parse query params from currentRoute (e.g. #/shop?cat=cat-clothes or filter=new)
  const initialCategory = useMemo(() => {
    const match = currentRoute.match(/[?&]cat=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : 'all';
  }, [currentRoute]);

  const initialFilter = useMemo(() => {
    const match = currentRoute.match(/[?&]filter=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : 'all';
  }, [currentRoute]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialFilter === 'new') {
      setSortBy('newest');
    } else if (initialFilter === 'in_stock') {
      setAvailabilityFilter('in_stock');
    }
  }, [initialFilter]);

  const categories = storage.getCategories();
  const allPublishedProducts = storage.getPublishedProducts();

  // Filtered and sorted products list
  const filteredProducts = useMemo(() => {
    return allPublishedProducts
      .filter((p) => {
        // Search query (matches title in EN/FR, SKU, brand, color, material)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle =
            p.nameEn.toLowerCase().includes(q) ||
            p.nameFr.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            (p.brand && p.brand.toLowerCase().includes(q)) ||
            (p.color && p.color.toLowerCase().includes(q)) ||
            (p.material && p.material.toLowerCase().includes(q));
          if (!matchTitle) return false;
        }

        // Category
        if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
          return false;
        }

        // Condition
        if (selectedCondition !== 'all' && p.condition !== selectedCondition) {
          return false;
        }

        // Availability filter
        if (availabilityFilter === 'in_stock') {
          const available = Math.max(0, p.quantityOnHand - p.reservedQuantity);
          if (available <= 0 || p.status === 'out_of_stock') return false;
        }

        // Featured filter
        if (initialFilter === 'featured' && !p.featured) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') {
          return a.basePrice - b.basePrice;
        }
        if (sortBy === 'price_desc') {
          return b.basePrice - a.basePrice;
        }
        // Newest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [
    allPublishedProducts,
    searchQuery,
    selectedCategory,
    selectedCondition,
    availabilityFilter,
    sortBy,
    initialFilter,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setAvailabilityFilter('all');
    setSortBy('newest');
  };

  const conditionsList: ProductCondition[] = [
    'brand_new_thrift',
    'like_new',
    'excellent',
    'very_good',
    'good',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Search bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#7B173B]">
            {language === 'fr' ? 'Catalogue DABIN Fashion' : 'DABIN Catalog'}
          </span>
          <h1 className="font-serif-brand text-3xl sm:text-4xl font-bold text-[#171719] mt-1">
            {language === 'fr' ? 'La Boutique' : 'The Shop'}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            {language === 'fr'
              ? 'Mode, chaussures, maroquinerie et linge de maison de seconde main de premier choix.'
              : 'Curated second-hand apparel, footwear, leather goods, and household linens.'}
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.common.searchPlaceholder}
            className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7B173B]/30 focus:border-[#7B173B]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Control bar: active count, sort & mobile filter trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-lg font-medium"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t.common.filters}</span>
          </button>

          <span className="font-semibold text-gray-900">
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1
              ? language === 'fr'
                ? 'article trouvé'
                : 'item found'
              : language === 'fr'
              ? 'articles trouvés'
              : 'items found'}
          </span>

          {(selectedCategory !== 'all' ||
            selectedCondition !== 'all' ||
            availabilityFilter !== 'all' ||
            searchQuery) && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[11px] text-[#7B173B] hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.common.clearFilters}</span>
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 hidden sm:inline">{t.common.sortBy} :</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#F8F8FA] border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#7B173B]"
          >
            <option value="newest">{t.common.newest}</option>
            <option value="price_asc">{t.common.priceLowHigh}</option>
            <option value="price_desc">{t.common.priceHighLow}</option>
          </select>
        </div>
      </div>

      {/* Catalog Layout: Desktop Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-5 rounded-2xl border border-gray-200 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#7B173B]" />
              <span>{t.common.filters}</span>
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] text-[#7B173B] hover:underline"
            >
              {t.common.clearFilters}
            </button>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              {t.productDetail.category}
            </h4>
            <div className="space-y-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === 'all'
                    ? 'bg-[#7B173B] text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{t.common.allCategories}</span>
                <span>{allPublishedProducts.length}</span>
              </button>

              {categories.map((cat) => {
                const count = allPublishedProducts.filter((p) => p.categoryId === cat.id).length;
                const catName = language === 'fr' ? cat.nameFr : cat.nameEn;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#7B173B] text-white font-semibold'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{catName}</span>
                    <span className="opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condition Filter */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              {t.common.condition}
            </h4>
            <div className="space-y-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCondition('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                  selectedCondition === 'all'
                    ? 'bg-gray-900 text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.common.all}
              </button>
              {conditionsList.map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setSelectedCondition(cond)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                    selectedCondition === cond
                      ? 'bg-gray-900 text-white font-semibold'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t.condition[cond]}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              {t.productDetail.availability}
            </h4>
            <div className="space-y-1 text-xs">
              <button
                type="button"
                onClick={() => setAvailabilityFilter('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                  availabilityFilter === 'all'
                    ? 'bg-gray-900 text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {language === 'fr' ? 'Tous les articles' : 'All Items'}
              </button>
              <button
                type="button"
                onClick={() => setAvailabilityFilter('in_stock')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors ${
                  availabilityFilter === 'in_stock'
                    ? 'bg-gray-900 text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {language === 'fr' ? 'En stock uniquement' : 'In Stock Only'}
              </button>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetails={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 space-y-4">
              <PackageX className="w-12 h-12 text-gray-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-serif-brand text-lg font-bold text-gray-800">
                  {language === 'fr'
                    ? 'Aucun article ne correspond à votre recherche'
                    : 'No products match your criteria'}
                </h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {language === 'fr'
                    ? 'Essayez de modifier vos filtres ou de réinitialiser la recherche pour voir tous les stocks disponibles.'
                    : 'Try clearing your search terms or relaxing filter options to view available inventory.'}
                </p>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 bg-[#7B173B] text-white text-xs font-semibold rounded-lg hover:bg-[#62122F] transition-colors"
              >
                {t.common.clearFilters}
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Drawer Filter Modal */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-80 bg-white h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-serif-brand text-lg font-bold">{t.common.filters}</h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Categories */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase text-gray-700">{t.productDetail.category}</h4>
              <div className="space-y-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setMobileFiltersOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg ${
                    selectedCategory === 'all' ? 'bg-[#7B173B] text-white font-bold' : 'text-gray-700'
                  }`}
                >
                  {t.common.allCategories}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setMobileFiltersOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg ${
                      selectedCategory === c.id ? 'bg-[#7B173B] text-white font-bold' : 'text-gray-700'
                    }`}
                  >
                    {language === 'fr' ? c.nameFr : c.nameEn}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full py-2.5 bg-[#171719] text-white text-xs font-semibold rounded-lg"
            >
              {language === 'fr' ? 'Appliquer les filtres' : 'Apply Filters'}
            </button>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />
    </div>
  );
};
