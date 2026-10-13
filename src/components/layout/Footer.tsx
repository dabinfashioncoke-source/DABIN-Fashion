import React from 'react';
import { Mail, MessageCircle, MapPin, Globe, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DabinLogo } from '../common/DabinLogo';
import { OFFICIAL_BUSINESS_INFO } from '../../constants/initialData';
import { storage } from '../../services/storage';

export const Footer: React.FC = () => {
  const { language, setLanguage, t, navigateTo, currentUser } = useApp();

  const handleWhatsAppClick = () => {
    const url = storage.getWhatsAppLink(t.whatsapp.generalGreeting);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="bg-[#171719] text-gray-300 border-t border-[#26262B]">
      {/* Upper Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-lg inline-block shadow-sm">
              <DabinLogo size="md" sloganLanguage={language} />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {language === 'fr'
                ? 'DABIN Fashion rend accessible une sélection rigoureuse de mode et textiles de seconde main de qualité supérieure à Nairobi, avec expédition sécurisée vers la RDC et le Burundi.'
                : 'DABIN Fashion curates premium second-hand fashion, footwear, bags, and home textiles from Nairobi, Kenya, with reliable dispatches to DR Congo and Burundi.'}
            </p>
            <div className="pt-2">
              <div className="text-xs uppercase tracking-wider text-[#D4AF37] font-semibold">
                {language === 'fr' ? 'Notre devise :' : 'Our Motto:'}
              </div>
              <p className="text-sm text-white font-medium italic mt-0.5">
                « {OFFICIAL_BUSINESS_INFO.primarySloganFr} » · « {OFFICIAL_BUSINESS_INFO.englishSlogan} »
              </p>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4 border-b border-gray-800 pb-2">
              {language === 'fr' ? 'Navigation' : 'Explore'}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/shop')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.shop}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/shop?filter=new')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.newArrivals}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/shop?filter=in_stock')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.availableStock}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/about')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.aboutUs}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/destinations')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.deliveryDestinations}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigateTo('/contact')}
                  className="hover:text-white transition-colors"
                >
                  {t.nav.contact}
                </button>
              </li>
            </ul>
          </div>

          {/* Regional Shipping Destinations */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4 border-b border-gray-800 pb-2">
              {language === 'fr' ? 'Villes Desservies' : 'Regional Hubs'}
            </h4>
            <div className="space-y-3 text-xs text-gray-400">
              <div>
                <span className="font-semibold text-gray-200 block mb-1">
                  {language === 'fr' ? 'RD Congo (RDC) :' : 'DR Congo (DRC):'}
                </span>
                <p className="leading-relaxed">
                  Bukavu · Goma · Bunia · Butembo · Beni · Durba · Lubumbashi · Kolwezi
                </p>
              </div>
              <div className="pt-1">
                <span className="font-semibold text-gray-200 block mb-1">Burundi :</span>
                <p>Bujumbura</p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigateTo('/destinations')}
                  className="text-xs text-[#D4AF37] hover:underline"
                >
                  {language === 'fr'
                    ? 'Voir les modalités d’expédition →'
                    : 'View shipping arrangements →'}
                </button>
              </div>
            </div>
          </div>

          {/* Official Contact & Hours */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4 border-b border-gray-800 pb-2">
              {language === 'fr' ? 'Coordonnées Officielles' : 'Official Contact'}
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#7B173B] shrink-0 mt-0.5" />
                <span>{OFFICIAL_BUSINESS_INFO.location}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#7B173B] shrink-0" />
                <a
                  href={`mailto:${OFFICIAL_BUSINESS_INFO.email}`}
                  className="hover:text-white transition-colors text-xs"
                >
                  {OFFICIAL_BUSINESS_INFO.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <button
                  type="button"
                  onClick={handleWhatsAppClick}
                  className="hover:text-white text-xs font-medium text-left"
                >
                  WhatsApp : {OFFICIAL_BUSINESS_INFO.whatsappFormatted}
                </button>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={() => {
                  if (currentUser && currentUser.email?.trim().toLowerCase() === 'dabin.fashion.co.ke@gmail.com') {
                    navigateTo('/admin');
                  } else {
                    navigateTo('/login');
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-[#222226] hover:bg-[#2e2e33] px-3.5 py-1.5 rounded transition-colors font-medium border border-gray-800"
                title="DABIN Staff Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{language === 'fr' ? 'Personnel DABIN' : 'DABIN Staff'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#101012] py-5 border-t border-[#1F1F24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            © {new Date().getFullYear()} DABIN Fashion. {language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}{' '}
            <span className="text-gray-400">Nairobi, Kenya.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              {language === 'fr'
                ? 'Prix unique & transparent pour tous.'
                : 'Single transparent price for all.'}
            </span>
            <span className="text-gray-600">·</span>
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`hover:text-white ${language === 'en' ? 'text-white font-bold' : ''}`}
              >
                English
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`hover:text-white ${language === 'fr' ? 'text-white font-bold' : ''}`}
              >
                Français
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
