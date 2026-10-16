import {
  Globe,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  ShoppingBag,
  X,
} from 'lucide-react';
import React, { useState } from 'react';
import { OFFICIAL_BUSINESS_INFO } from '../../constants/initialData';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { DabinLogo } from '../common/DabinLogo';

export const Navbar: React.FC = () => {
  const {
    language,
    setLanguage,
    currency,
    setCurrency,
    t,
    currentRoute,
    navigateTo,
    currentUser,
    settings,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: t.nav.home, route: '/' },
    { label: t.nav.shop, route: '/shop' },
    { label: t.nav.categories, route: '/categories' },
    { label: t.nav.newArrivals, route: '/shop?filter=new' },
    { label: t.nav.availableStock, route: '/shop?filter=in_stock' },
    { label: t.nav.aboutUs, route: '/about' },
    { label: t.nav.deliveryDestinations, route: '/destinations' },
    { label: t.nav.contact, route: '/contact' },
  ];

  const handleWhatsAppGeneralClick = () => {
    const url = storage.getWhatsAppLink(t.whatsapp.generalGreeting);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showAnnouncement = settings.showAnnouncementBar ?? true;
  const announcementText =
    language === 'fr'
      ? settings.announcementTextFr || 'Expéditions vers la RDC (Bukavu, Goma, Bunia...) & Burundi (Bujumbura)'
      : settings.announcementTextEn || 'Dispatches to DR Congo (Bukavu, Goma, Bunia...) & Burundi (Bujumbura)';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8E8EC] transition-all">
      {/* Top Utility Announcement Bar */}
      {showAnnouncement && (
        <div className="bg-[#171719] text-white text-xs py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#D4AF37] tracking-wider uppercase text-[11px]">
                {settings.businessLocation || 'Nairobi, Kenya'}
              </span>
              <span className="text-gray-400 hidden sm:inline">·</span>
              <span className="text-gray-300 hidden sm:inline truncate max-w-xl">
                {announcementText}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <a
                href={storage.getWhatsAppLink(t.whatsapp.generalGreeting)}
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors"
              >
                <Phone className="w-3 h-3 text-[#D4AF37]" />
                <span>{settings.whatsappNumber || OFFICIAL_BUSINESS_INFO.whatsappFormatted}</span>
              </a>

            {/* Language Switcher */}
            <div className="flex items-center bg-[#242428] rounded p-0.5 border border-[#333338]">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                  language === 'en'
                    ? 'bg-[#7B173B] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('fr')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                  language === 'fr'
                    ? 'bg-[#7B173B] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Français"
              >
                FR
              </button>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center bg-[#242428] rounded p-0.5 border border-[#333338]">
              <button
                type="button"
                onClick={() => setCurrency('KES')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                  currency === 'KES'
                    ? 'bg-[#7B173B] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Kenyan Shillings"
              >
                KES
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                  currency === 'USD'
                    ? 'bg-[#7B173B] text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="US Dollars"
              >
                USD
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo with Brand Name and Slogan */}
          <button
            type="button"
            onClick={() => navigateTo('/')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <DabinLogo
              size="md"
              sloganLanguage={language}
              className="group-hover:opacity-95 transition-opacity"
            />
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive =
                currentRoute === link.route ||
                (link.route.startsWith('/shop') && currentRoute.startsWith('/shop'));
              return (
                <button
                  key={link.route}
                  type="button"
                  onClick={() => navigateTo(link.route)}
                  className={`text-sm font-medium transition-colors py-1 relative ${
                    isActive
                      ? 'text-[#7B173B] font-semibold'
                      : 'text-[#171719] hover:text-[#7B173B]'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B173B]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={handleWhatsAppGeneralClick}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#171719] bg-[#F4F4F6] hover:bg-[#EAEAEA] border border-[#E0E0E6] rounded-md transition-all shadow-xs"
              title="Chat with DABIN Fashion on WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentUser && currentUser.email?.trim().toLowerCase() === 'dabin.fashion.co.ke@gmail.com') {
                  navigateTo('/admin');
                } else {
                  navigateTo('/login');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-[#7B173B] border border-gray-200 hover:border-[#7B173B]/30 rounded-md transition-colors bg-white shadow-2xs"
              title="DABIN Staff Portal"
            >
              <ShieldCheck className="w-4 h-4 text-[#7B173B]" />
              <span>{language === 'fr' ? 'Personnel DABIN' : 'DABIN Staff'}</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 xl:hidden">
            <button
              type="button"
              onClick={handleWhatsAppGeneralClick}
              className="p-2 text-gray-700 hover:text-green-600 rounded-md"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#171719] hover:bg-gray-100 rounded-md"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-gray-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-gray-100">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Langue :' : 'Language:'}</span>
              <span className="font-bold text-[#171719] uppercase">{language}</span>
            </div>
            <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
              <span>{language === 'fr' ? 'Devise :' : 'Currency:'}</span>
              <span className="font-bold text-[#7B173B]">{currency}</span>
            </div>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.route}
                type="button"
                onClick={() => {
                  navigateTo(link.route);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 hover:text-[#7B173B] rounded-md transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-200 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                handleWhatsAppGeneralClick();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#25D366] text-white text-xs font-semibold rounded-md shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>+254 181 740 330 (WhatsApp)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentUser && currentUser.email?.trim().toLowerCase() === 'dabin.fashion.co.ke@gmail.com') {
                  navigateTo('/admin');
                } else {
                  navigateTo('/login');
                }
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              <ShieldCheck className="w-4 h-4 text-[#7B173B]" />
              <span>{language === 'fr' ? 'Personnel DABIN' : 'DABIN Staff'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
