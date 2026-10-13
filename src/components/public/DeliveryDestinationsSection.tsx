import React, { useState } from 'react';
import { Truck, MessageCircle, MapPin, ArrowRight, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';

export const DeliveryDestinationsSection: React.FC = () => {
  const { language, t, navigateTo } = useApp();
  const destinations = storage.getDestinations().filter((d) => d.active);

  const drcCities = destinations.filter((d) => d.country === 'DR Congo');
  const burundiCities = destinations.filter((d) => d.country === 'Burundi');

  const [selectedCity, setSelectedCity] = useState(drcCities[0]?.city || 'Bukavu');
  const currentDest = destinations.find((d) => d.city === selectedCity) || destinations[0];

  const handleAskCityRates = (city: string, country: string) => {
    const msg = storage.generateDestinationInquiryMessage(city, country, language);
    const link = storage.getWhatsAppLink(msg);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F4F4F7]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7B173B] bg-[#7B173B]/10 px-3 py-1 rounded-full">
            <Truck className="w-3.5 h-3.5" />
            <span>{t.home.regionalHeading}</span>
          </div>
          <h2 className="font-serif-brand text-3xl sm:text-4xl font-bold text-[#171719]">
            {language === 'fr'
              ? 'Expéditions vers la RDC et le Burundi depuis Nairobi'
              : 'Cross-Border Deliveries from Nairobi to DR Congo & Burundi'}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {t.home.regionalSubtitle}
          </p>
        </div>

        {/* Content Columns: Interactive City Selector + Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cities Tabs / Grid */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t.home.regionalDrc} ({drcCities.length} {language === 'fr' ? 'villes' : 'cities'})
                </span>
                <span className="text-[11px] text-gray-400">RD Congo</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {drcCities.map((dest) => {
                  const isSelected = selectedCity === dest.city;
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => setSelectedCity(dest.city)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-all border ${
                        isSelected
                          ? 'bg-[#7B173B] text-white border-[#7B173B] shadow-xs font-semibold'
                          : 'bg-[#F9F9FA] hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <div className="truncate">{dest.city}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {t.home.regionalBurundi}
                </span>
                <span className="text-[11px] text-gray-400">Burundi</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {burundiCities.map((dest) => {
                  const isSelected = selectedCity === dest.city;
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => setSelectedCity(dest.city)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg text-left transition-all border ${
                        isSelected
                          ? 'bg-[#7B173B] text-white border-[#7B173B] shadow-xs font-semibold'
                          : 'bg-[#F9F9FA] hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <div className="truncate">{dest.city}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Selected City Card & WhatsApp Action */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            {currentDest && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#7B173B]" />
                    <h3 className="font-serif-brand text-2xl font-bold text-[#171719]">
                      {currentDest.city}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {currentDest.country}
                  </span>
                </div>

                <div className="text-xs text-gray-600 space-y-2 bg-[#FAFAFC] p-4 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 block mb-0.5">
                      {language === 'fr' ? 'Délai d’acheminement indicatif :' : 'Estimated Transit Time:'}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {language === 'fr'
                        ? currentDest.estimatedTransitTimeFr
                        : currentDest.estimatedTransitTimeEn}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60">
                    <span className="text-gray-400 block mb-0.5">
                      {language === 'fr' ? 'Précision logistique :' : 'Logistics Note:'}
                    </span>
                    <span className="text-gray-700">
                      {language === 'fr'
                        ? currentDest.shippingNotesFr || 'Expéditions hebdomadaires groupées ou directes.'
                        : currentDest.shippingNotesEn || 'Weekly consolidated or direct dispatches.'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    {language === 'fr'
                      ? 'Les tarifs de transport et options cargo sont confirmés directement sur demande sans engagement spéculatif.'
                      : 'Carrier freight rates and collection terms are confirmed upon inquiry without speculative promises.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAskCityRates(currentDest.city, currentDest.country)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {language === 'fr'
                      ? `Demander les tarifs pour ${currentDest.city} sur WhatsApp`
                      : `Ask shipping rates for ${currentDest.city} on WhatsApp`}
                  </span>
                </button>
              </div>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => navigateTo('/destinations')}
                className="text-xs text-[#7B173B] font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>{language === 'fr' ? 'Voir toutes les destinations de livraison' : 'View all delivery destinations'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
