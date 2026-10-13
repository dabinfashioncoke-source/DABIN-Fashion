import React from 'react';
import { Scale, Users, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const EqualPricingBanner: React.FC = () => {
  const { language, t } = useApp();

  return (
    <section className="bg-gradient-to-r from-[#171719] via-[#232328] to-[#171719] text-white py-12 px-4 sm:px-6 lg:px-8 border-y border-[#32323A]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4AF37] uppercase tracking-wider bg-[#2B2B32] px-3 py-1 rounded-full border border-[#3E3E48]">
              <Scale className="w-3.5 h-3.5" />
              <span>{t.home.pricingBannerTitle}</span>
            </div>
            <h2 className="font-serif-brand text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {language === 'fr'
                ? 'Un seul et même prix pour tous nos clients'
                : 'One Single, Honest Price for Every Customer'}
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              {t.home.pricingBannerText}
            </p>
          </div>

          {/* Three Pillars Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="bg-[#212126] border border-[#32323C] p-4 rounded-xl flex items-center gap-3">
              <Users className="w-6 h-6 text-[#7B173B] shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">
                  {language === 'fr' ? 'Grossistes' : 'Wholesalers'}
                </div>
                <div className="text-[11px] text-gray-400">
                  {language === 'fr' ? 'Prix standard affiché' : 'Same standard price'}
                </div>
              </div>
            </div>

            <div className="bg-[#212126] border border-[#32323C] p-4 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#7B173B] shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">
                  {language === 'fr' ? 'Détaillants' : 'Retailers'}
                </div>
                <div className="text-[11px] text-gray-400">
                  {language === 'fr' ? 'Prix standard affiché' : 'Same standard price'}
                </div>
              </div>
            </div>

            <div className="bg-[#212126] border border-[#32323C] p-4 rounded-xl flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#7B173B] shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">
                  {language === 'fr' ? 'Particuliers' : 'Individuals'}
                </div>
                <div className="text-[11px] text-gray-400">
                  {language === 'fr' ? 'Prix standard affiché' : 'Same standard price'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
