import React from 'react';
import {
  MapPin,
  Mail,
  MessageCircle,
  Truck,
  ShieldCheck,
  CheckCircle,
  Globe2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storage } from '../services/storage';
import { safeOpenUrl } from '../utils/navigation';
import { OFFICIAL_BUSINESS_INFO } from '../constants/initialData';
import { DabinLogo } from '../components/common/DabinLogo';

export const AboutPage: React.FC = () => {
  const { language, t, navigateTo, settings, destinations: allDestinations } = useApp();

  const destinations = allDestinations.filter((d) => d.active);
  const drcCities = destinations.filter((d) => d.country === 'DR Congo');
  const burundiCities = destinations.filter((d) => d.country === 'Burundi');

  const handleWhatsAppInquiry = () => {
    const link = storage.getWhatsAppLink(t.whatsapp.generalGreeting);
    safeOpenUrl(link);
  };

  const primarySloganFr = settings.primarySloganFr || OFFICIAL_BUSINESS_INFO.primarySloganFr;
  const englishSlogan = settings.englishSlogan || OFFICIAL_BUSINESS_INFO.englishSlogan;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* 1. Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7B173B] bg-[#7B173B]/10 px-3 py-1 rounded-full">
          <Globe2 className="w-3.5 h-3.5" />
          <span>{t.about.badge}</span>
        </div>
        <h1 className="font-serif-brand text-3xl sm:text-5xl font-bold text-[#171719]">
          {language === 'fr'
            ? 'DABIN Fashion — La mode et la qualité plus proches de vous'
            : 'DABIN Fashion — Bringing Quality Fashion Closer to You'}
        </h1>
        <p className="text-sm font-medium text-gray-500 flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4 text-[#7B173B]" />
          <span>{settings.businessLocation || t.about.locationInfo}</span>
        </p>
      </div>

      {/* 2. Core Narrative Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col items-center text-center">
            <DabinLogo size="lg" sloganLanguage={language} className="mb-4" />
            <div className="p-3 bg-[#F4F4F6] rounded-xl text-xs text-gray-600 w-full text-center">
              <span className="font-bold text-[#171719] block mb-0.5">
                {primarySloganFr}
              </span>
              <span className="text-gray-500 italic">
                {englishSlogan}
              </span>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-[#171719] to-[#25252A] rounded-2xl text-white space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.home.pricingBannerTitle}</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {language === 'fr'
                ? 'Que vous recherchiez des articles pour votre commerce, que vous souhaitiez renouveler votre stock ou que vous soyez à la recherche d’un article pour votre usage personnel, DABIN Fashion vous propose un prix unique et transparent pour chaque produit, quel que soit votre profil de client.'
                : 'Whether you are sourcing products for your business, replenishing your stock, or looking for something special for yourself, DABIN Fashion offers a single, transparent price for every product, regardless of customer type.'}
            </p>
          </div>
        </div>

        {/* Narrative Copy */}
        <div className="lg:col-span-7 space-y-6 text-gray-700 text-sm leading-relaxed whitespace-pre-line bg-white p-8 rounded-2xl border border-gray-200 shadow-xs">
          <h2 className="font-serif-brand text-2xl font-bold text-[#171719]">
            {language === 'fr' ? 'Notre Mission & Vision' : 'Our Mission & Vision'}
          </h2>
          <div className="text-gray-600 space-y-4">
            {language === 'fr' ? settings.aboutTextFr : settings.aboutTextEn}
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>
                {language === 'fr'
                  ? 'Contacter l’équipe sur WhatsApp'
                  : 'Chat with our Team on WhatsApp'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/shop')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7B173B] hover:bg-[#62122F] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <span>{t.home.exploreBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Regional Destinations Matrix */}
      <div className="bg-[#FAFAFC] p-8 sm:p-12 rounded-3xl border border-gray-200 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7B173B]">
            <Truck className="w-4 h-4" />
            <span>{t.about.crossBorderTitle}</span>
          </div>
          <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold text-[#171719]">
            {language === 'fr'
              ? 'Villes de Destination en RDC et au Burundi'
              : 'Destination Cities in DR Congo & Burundi'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {language === 'fr'
              ? 'Depuis notre siège de Nairobi, nous facilitons l’acheminement sécurisé de vos commandes vers 9 centres urbains majeurs.'
              : 'From our base in Nairobi, Kenya, we facilitate the dispatch and delivery of our products to selected cities.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* DR Congo Box */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                {language === 'fr'
                  ? 'République Démocratique du Congo (RDC)'
                  : 'Democratic Republic of the Congo (DR Congo)'}
              </h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                8 {language === 'fr' ? 'villes' : 'cities'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {drcCities.map((dest) => (
                <div
                  key={dest.id}
                  className="p-3 bg-[#F8F8FA] rounded-xl border border-gray-100 text-xs font-semibold text-gray-800 flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#7B173B] shrink-0" />
                  <span className="truncate">{dest.city}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Burundi Box */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                Burundi
              </h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                1 {language === 'fr' ? 'ville' : 'city'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {burundiCities.map((dest) => (
                <div
                  key={dest.id}
                  className="p-3 bg-[#F8F8FA] rounded-xl border border-gray-100 text-xs font-semibold text-gray-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#7B173B]" />
                    <span className="text-sm font-bold">{dest.city}</span>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {language === 'fr' ? dest.estimatedTransitTimeFr : dest.estimatedTransitTimeEn}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60 text-xs text-amber-900">
              {language === 'fr'
                ? 'Pour connaître la disponibilité des produits, les modalités d’expédition, les délais et frais applicables, contactez-nous directement.'
                : 'For information about product availability, shipping arrangements, delivery times, and applicable delivery costs, please contact us directly.'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Official Contact Card */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xs">
        <h3 className="font-serif-brand text-xl font-bold text-[#171719] mb-4">
          {language === 'fr' ? 'Nos coordonnées officielles' : 'Our Official Contact Details'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#7B173B]" />
            <div>
              <span className="text-gray-400 block font-medium">E-mail</span>
              <a
                href={`mailto:${settings.contactEmail || OFFICIAL_BUSINESS_INFO.email}`}
                className="font-semibold text-gray-900 hover:underline"
              >
                {settings.contactEmail || OFFICIAL_BUSINESS_INFO.email}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            <div>
              <span className="text-gray-400 block font-medium">WhatsApp</span>
              <a
                href={storage.getWhatsAppLink(t.whatsapp.generalGreeting)}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gray-900 hover:underline"
              >
                {settings.whatsappNumber || OFFICIAL_BUSINESS_INFO.whatsappFormatted}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-[#7B173B]" />
            <div>
              <span className="text-gray-400 block font-medium">
                {language === 'fr' ? 'Siège des activités' : 'Based In'}
              </span>
              <span className="font-semibold text-gray-900">
                {settings.businessLocation || OFFICIAL_BUSINESS_INFO.location}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
