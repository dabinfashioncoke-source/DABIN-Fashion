import React from 'react';
import { ArrowRight, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storage } from '../services/storage';

export const CategoriesPage: React.FC = () => {
  const { language, t, navigateTo, categories, publishedProducts: products } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#7B173B] bg-[#7B173B]/10 px-3 py-1 rounded-full">
          <Layers className="w-3.5 h-3.5 inline mr-1" />
          {t.nav.categories}
        </span>
        <h1 className="font-serif-brand text-3xl sm:text-4xl font-bold text-[#171719]">
          {language === 'fr'
            ? 'Rayons & Catégories de Produits'
            : 'Product Departments & Categories'}
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
          {language === 'fr'
            ? 'Découvrez nos collections de vêtements, chaussures, maroquinerie, linge de maison et accessoires de seconde main de haute qualité.'
            : 'Explore our curated collections of second-hand apparel, footwear, leather goods, household textiles, and lifestyle items.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((cat) => {
          const catName = language === 'fr' ? cat.nameFr : cat.nameEn;
          const catProducts = products.filter((p) => p.categoryId === cat.id);

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Image Header */}
              <div className="relative h-48 bg-gray-900 overflow-hidden">
                <img
                  src={cat.imageUrl}
                  alt={catName}
                  className="w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="font-serif-brand text-xl font-bold text-white">
                    {catName}
                  </h3>
                  <span className="text-xs text-gray-300">
                    {catProducts.length}{' '}
                    {catProducts.length === 1
                      ? language === 'fr'
                        ? 'article disponible'
                        : 'piece available'
                      : language === 'fr'
                      ? 'articles disponibles'
                      : 'pieces available'}
                  </span>
                </div>
              </div>

              {/* Subcategories list */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                {cat.subcategories.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                      {language === 'fr' ? 'Sous-catégories' : 'Subcategories'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.subcategories.map((sub) => (
                        <span
                          key={sub.id}
                          className="text-xs px-2.5 py-1 bg-[#F4F4F6] text-gray-700 rounded-md font-medium"
                        >
                          {language === 'fr' ? sub.nameFr : sub.nameEn}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    {language === 'fr'
                      ? 'Sélection variée d’articles vérifiés et renouvelés régulièrement.'
                      : 'Assorted curated collection updated on weekly intakes.'}
                  </p>
                )}

                <div className="pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => navigateTo(`/shop?cat=${cat.id}`)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#171719] hover:bg-[#7B173B] text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    <span>
                      {language === 'fr'
                        ? `Explorer ${catName}`
                        : `Browse ${catName}`}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
