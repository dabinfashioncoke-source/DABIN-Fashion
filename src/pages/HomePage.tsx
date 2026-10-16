import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MessageCircle,
  Package,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { storage } from '../services/storage';
import { safeOpenUrl } from '../utils/navigation';
import { Product } from '../types';
import { DeliveryDestinationsSection } from '../components/public/DeliveryDestinationsSection';
import { EqualPricingBanner } from '../components/public/EqualPricingBanner';
import { ProductCard } from '../components/public/ProductCard';
import { ProductDetailModal } from '../components/public/ProductDetailModal';

export const HomePage: React.FC = () => {
  const { language, t, navigateTo, settings, categories, publishedProducts } = useApp();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const featuredProducts = publishedProducts.filter((p) => p.featured).slice(0, 4);
  const newArrivals = [...publishedProducts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const handleWhatsAppContact = () => {
    const link = storage.getWhatsAppLink(t.whatsapp.generalGreeting);
    safeOpenUrl(link);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section */}
      <section className="relative bg-[#171719] text-white overflow-hidden py-20 lg:py-28">
        {/* Subtle Luxury Background Overlay */}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#7B173B_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#7B173B]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/15 text-xs font-semibold text-[#D4AF37] tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.home.heroBadge}</span>
              </div>

              <h1 className="font-serif-brand text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                {language === 'fr' ? settings.heroHeadlineFr : settings.heroHeadlineEn}
              </h1>

              <p className="text-gray-300 text-base sm:text-lg max-w-2xl leading-relaxed">
                {language === 'fr' ? settings.heroSubtitleFr : settings.heroSubtitleEn}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  type="button"
                  onClick={() => navigateTo('/shop')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#7B173B] hover:bg-[#63122F] text-white font-semibold text-sm rounded-xl shadow-lg transition-all active:scale-98"
                >
                  <span>{t.home.exploreBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleWhatsAppContact}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold text-sm rounded-xl border border-white/20 transition-colors backdrop-blur-xs"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>{t.home.contactWhatsAppBtn}</span>
                </button>
              </div>

              {/* Trust metadata */}
              <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-xs text-gray-300">
                <div>
                  <span className="font-bold text-white block text-sm sm:text-base">100% Curated</span>
                  <span>{language === 'fr' ? 'Qualité vérifiée' : 'Inspected Quality'}</span>
                </div>
                <div>
                  <span className="font-bold text-[#D4AF37] block text-sm sm:text-base">1 Standard Price</span>
                  <span>{language === 'fr' ? 'Prix unique pour tous' : 'Transparent for All'}</span>
                </div>
                <div>
                  <span className="font-bold text-white block text-sm sm:text-base">9 Regional Cities</span>
                  <span>{language === 'fr' ? 'RDC & Burundi' : 'DRC & Burundi'}</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual Feature Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#232328]">
                <img
                  src="https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=900&q=80"
                  alt="DABIN Fashion Collection"
                  className="w-full h-96 object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="text-xs uppercase font-mono tracking-wider text-[#D4AF37] font-semibold">
                    {language === 'fr' ? 'Arrivage de la semaine' : 'Weekly Selection'}
                  </span>
                  <h3 className="font-serif-brand text-2xl font-bold text-white">
                    {language === 'fr' ? 'Manteaux, Laine & Linge Européen' : 'Coats, Knitwear & European Linens'}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">
                    {language === 'fr'
                      ? 'Nairobi, Kenya • Expédition hebdomadaire'
                      : 'Nairobi, Kenya • Weekly cross-border dispatches'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-[#7B173B]">
              {language === 'fr' ? 'Explorer la boutique' : 'Browse Department'}
            </span>
            <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {t.home.categoriesHeading}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('/categories')}
            className="text-xs font-semibold text-[#7B173B] hover:underline inline-flex items-center gap-1"
          >
            <span>{language === 'fr' ? 'Toutes les catégories' : 'All Categories'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const catName = language === 'fr' ? cat.nameFr : cat.nameEn;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigateTo(`/shop?cat=${cat.id}`)}
                className="group relative rounded-xl overflow-hidden aspect-square border border-gray-200 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-end p-3.5 bg-gray-900"
              >
                <img
                  src={cat.imageUrl}
                  alt={catName}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="relative z-10">
                  <h3 className="font-serif-brand text-sm sm:text-base font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-tight">
                    {catName}
                  </h3>
                  <span className="text-[10px] text-gray-300 flex items-center gap-1 mt-0.5">
                    {cat.subcategories.length > 0 && (
                      <span>{cat.subcategories.length} {language === 'fr' ? 'sections' : 'types'}</span>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Equal Transparent Pricing Banner */}
      <EqualPricingBanner />

      {/* 4. Featured Pieces */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-[#7B173B]">
              {language === 'fr' ? 'Coup de cœur' : 'Handpicked'}
            </span>
            <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {t.home.featuredHeading}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('/shop?filter=featured')}
            className="text-xs font-semibold text-[#7B173B] hover:underline inline-flex items-center gap-1"
          >
            <span>{language === 'fr' ? 'Voir toute la sélection' : 'View full selection'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenDetails={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {language === 'fr'
                ? 'Aucun produit vedette configuré pour le moment.'
                : 'No featured items listed currently.'}
            </p>
          </div>
        )}
      </section>

      {/* 5. Fresh Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-[#7B173B]">
              {language === 'fr' ? 'Nouveaux arrivages' : 'Just In'}
            </span>
            <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {t.home.newArrivalsHeading}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('/shop?filter=new')}
            className="text-xs font-semibold text-[#7B173B] hover:underline inline-flex items-center gap-1"
          >
            <span>{language === 'fr' ? 'Explorer les nouveautés' : 'Explore new arrivals'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpenDetails={(p) => setSelectedProduct(p)}
            />
          ))}
        </div>
      </section>

      {/* 6. Regional Cross-Border Delivery Section */}
      <DeliveryDestinationsSection />

      {/* 7. The DABIN Quality Pledge */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-xs">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#7B173B]">
              {language === 'fr' ? 'Notre éthique de travail' : 'Our Quality Standard'}
            </span>
            <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
              {t.home.thriftPledgeTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#7B173B]/10 flex items-center justify-center text-[#7B173B] mx-auto sm:mx-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                {t.home.thriftPledge1Title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t.home.thriftPledge1Text}
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#7B173B]/10 flex items-center justify-center text-[#7B173B] mx-auto sm:mx-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                {t.home.thriftPledge2Title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t.home.thriftPledge2Text}
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-[#7B173B]/10 flex items-center justify-center text-[#7B173B] mx-auto sm:mx-0">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                {t.home.thriftPledge3Title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t.home.thriftPledge3Text}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Modal for viewing product detail */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />
    </div>
  );
};
