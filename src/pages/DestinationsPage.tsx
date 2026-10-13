import React, { useState } from 'react';
import {
  Truck,
  MessageCircle,
  MapPin,
  Clock,
  ShieldCheck,
  Send,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { storage } from '../services/storage';

export const DestinationsPage: React.FC = () => {
  const { language, t } = useApp();
  const destinations = storage.getDestinations().filter((d) => d.active);

  const drcCities = destinations.filter((d) => d.country === 'DR Congo');
  const burundiCities = destinations.filter((d) => d.country === 'Burundi');

  const [selectedCityId, setSelectedCityId] = useState<string>(destinations[0]?.id || '');
  const [inquiryNotes, setInquiryNotes] = useState('');

  const currentSelected =
    destinations.find((d) => d.id === selectedCityId) || destinations[0];

  const handleSendCityInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSelected) return;

    let baseMsg = storage.generateDestinationInquiryMessage(
      currentSelected.city,
      currentSelected.country,
      language
    );

    if (inquiryNotes.trim()) {
      baseMsg += ` ${language === 'fr' ? 'Précision :' : 'Notes:'} ${inquiryNotes.trim()}`;
    }

    const link = storage.getWhatsAppLink(baseMsg);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleDirectCityClick = (city: string, country: string) => {
    const msg = storage.generateDestinationInquiryMessage(city, country, language);
    const link = storage.getWhatsAppLink(msg);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7B173B] bg-[#7B173B]/10 px-3 py-1 rounded-full">
          <Truck className="w-3.5 h-3.5" />
          <span>{t.nav.deliveryDestinations}</span>
        </div>
        <h1 className="font-serif-brand text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171719]">
          {t.destinations.title}
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
          {t.destinations.subtitle}
        </p>
      </div>

      {/* Interactive Shipping Inquiry Tool */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-gray-200 shadow-sm max-w-3xl mx-auto space-y-6">
        <div className="space-y-1">
          <h2 className="font-serif-brand text-xl sm:text-2xl font-bold text-[#171719]">
            {t.destinations.inquireTitle}
          </h2>
          <p className="text-xs text-gray-500">
            {t.destinations.inquireSubtitle}
          </p>
        </div>

        <form onSubmit={handleSendCityInquiry} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-gray-800 block mb-1.5">
              {t.destinations.selectCity} *
            </label>
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="w-full p-3 bg-[#F8F8FA] border border-gray-200 rounded-xl font-medium text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7B173B]"
            >
              <optgroup label="République Démocratique du Congo (RDC)">
                {drcCities.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.city} (DR Congo)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Burundi">
                {burundiCities.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.city} (Burundi)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {currentSelected && (
            <div className="p-4 bg-[#F4F4F7] rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#171719] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#7B173B]" />
                  <span>{currentSelected.city}, {currentSelected.country}</span>
                </span>
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {language === 'fr'
                      ? currentSelected.estimatedTransitTimeFr
                      : currentSelected.estimatedTransitTimeEn}
                  </span>
                </span>
              </div>
              <p className="text-gray-600 text-[11px]">
                {language === 'fr'
                  ? currentSelected.shippingNotesFr || 'Expéditions hebdomadaires depuis Nairobi.'
                  : currentSelected.shippingNotesEn || 'Weekly dispatches from Nairobi.'}
              </p>
            </div>
          )}

          <div>
            <label className="font-semibold text-gray-800 block mb-1.5">
              {language === 'fr'
                ? 'Articles ou questions spécifiques (facultatif) :'
                : 'Specific items or parcel notes (Optional):'}
            </label>
            <input
              type="text"
              value={inquiryNotes}
              onChange={(e) => setInquiryNotes(e.target.value)}
              placeholder={
                language === 'fr'
                  ? 'Ex. Balle de vêtements, 5 manteaux, draps de lit...'
                  : 'Ex. Baling consignment, coats, bedsheets...'
              }
              className="w-full p-3 bg-[#F8F8FA] border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#7B173B]"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.destinations.askWhatsAppBtn}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Full City Directory Grid */}
      <div className="space-y-8">
        <div>
          <h2 className="font-serif-brand text-2xl font-bold text-[#171719] mb-4 flex items-center gap-2">
            <span>{t.destinations.drcTitle}</span>
            <span className="text-xs text-gray-500 font-sans font-normal">
              ({drcCities.length} {language === 'fr' ? 'villes desservies' : 'connected cities'})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {drcCities.map((dest) => (
              <div
                key={dest.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-[#7B173B] transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                      {dest.city}
                    </h3>
                    <span className="text-[10px] uppercase font-semibold text-gray-400">
                      RDC
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-[#7B173B]" />
                    <span>
                      {language === 'fr'
                        ? dest.estimatedTransitTimeFr
                        : dest.estimatedTransitTimeEn}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    {language === 'fr' ? dest.shippingNotesFr : dest.shippingNotesEn}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDirectCityClick(dest.city, dest.country)}
                  className="w-full py-2 px-3 bg-[#F4F4F6] hover:bg-[#25D366] text-gray-800 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Burundi Grid */}
        <div>
          <h2 className="font-serif-brand text-2xl font-bold text-[#171719] mb-4 flex items-center gap-2">
            <span>{t.destinations.burundiTitle}</span>
            <span className="text-xs text-gray-500 font-sans font-normal">
              (Bujumbura)
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {burundiCities.map((dest) => (
              <div
                key={dest.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:border-[#7B173B] transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-serif-brand text-lg font-bold text-[#171719]">
                      {dest.city}
                    </h3>
                    <span className="text-[10px] uppercase font-semibold text-gray-400">
                      Burundi
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-[#7B173B]" />
                    <span>
                      {language === 'fr'
                        ? dest.estimatedTransitTimeFr
                        : dest.estimatedTransitTimeEn}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    {language === 'fr' ? dest.shippingNotesFr : dest.shippingNotesEn}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDirectCityClick(dest.city, dest.country)}
                  className="w-full py-2 px-3 bg-[#F4F4F6] hover:bg-[#25D366] text-gray-800 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
